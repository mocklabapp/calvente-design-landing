// @ts-check
/// <reference types="node" />
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createPublicProjectsHandler } from '../supabase/functions/public-projects/handler.ts';
import { config, fixture, owner, page, project } from './helpers/public-projects-edge.mjs';

/** @param {string} [query] @param {RequestInit} [init] */
const request = (query = `uid=${owner}`, init) =>
  new Request(`https://edge.example.test/functions/v1/public-projects?${query}`, init);

/** @param {Response} response @param {number} status @param {unknown} body */
async function check(response, status, body) {
  assert.equal(response.status, status);
  for (const name of ['Cache-Control', 'CDN-Cache-Control', 'Vercel-CDN-Cache-Control']) {
    assert.equal(response.headers.get(name), 'no-store');
  }
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(response.headers.get('Access-Control-Allow-Credentials'), null);
  assert.equal(response.headers.get('Access-Control-Allow-Methods'), 'GET, OPTIONS');
  assert.equal(response.headers.get('Access-Control-Allow-Headers'), null);
  const text = await response.text();
  const output = text + JSON.stringify([...response.headers]);
  for (const secret of [config.SUPABASE_ANON_KEY, config.PUBLIC_PROJECTS_ROLE_JWT, 'PRIVATE']) {
    assert.equal(output.includes(secret), false);
  }
  if (status === 204) assert.equal(text, '');
  else {
    assert.match(response.headers.get('content-type') ?? '', /^application\/json\b/);
    assert.deepEqual(JSON.parse(text), body);
  }
}

test('unauthenticated GET preserves public DTO, trusted RPC and normalized owner across origins', async () => {
  const uid = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA';
  for (const origin of [undefined, 'https://one.example', 'https://two.example', 'null']) {
    const rpc = fixture([page([{ ...project(), prompt: 'PRIVATE', token: config.PUBLIC_PROJECTS_ROLE_JWT }])]);
    const handler = createPublicProjectsHandler(() => config, rpc);
    const headers = new Headers();
    if (origin) headers.set('Origin', origin);
    // Caller headers are neither required nor forwarded as trusted configuration.
    headers.set('Authorization', 'Bearer PRIVATE');
    headers.set('apikey', 'PRIVATE');
    const response = await handler(request(`uid=${uid}`, { headers }));
    await check(response, 200, { projects: [project()] });
    assert.equal(rpc.calls.length, 1);
    const call = rpc.calls[0];
    assert.equal(call.url, `${config.SUPABASE_URL}/rest/v1/rpc/export_public_projects`);
    assert.equal(call.method, 'POST');
    assert.equal(call.headers.get('authorization'), `Bearer ${config.PUBLIC_PROJECTS_ROLE_JWT}`);
    assert.equal(call.headers.get('apikey'), config.SUPABASE_ANON_KEY);
    assert.equal(call.headers.get('origin'), null);
    assert.deepEqual(await call.json(), { p_owner: uid.toLowerCase(), p_offset: 0, p_limit: 200 });
  }
});

test('repeated unauthenticated GETs fetch fresh data including empty portfolios', async () => {
  const rpc = fixture([page([]), page([project()])]);
  const handler = createPublicProjectsHandler(() => config, rpc);
  await check(await handler(request()), 200, { projects: [] });
  await check(await handler(request()), 200, { projects: [project()] });
  assert.equal(rpc.calls.length, 2);
});

test('invalid queries reject before runtime configuration or upstream calls', async () => {
  const rpc = fixture([]);
  let reads = 0;
  const handler = createPublicProjectsHandler(() => { reads++; return config; }, rpc);
  for (const query of ['', 'uid=', 'uid=PRIVATE', `uid=%20${owner}`, `uid=${owner}%20`,
    `uid=${owner}&uid=${owner}`, `uid=${owner}&uid=`, `UID=${owner}`, `uid=${owner},${owner}`,
    ...['owner', 'p_owner', 'url', 'key', 'limit', 'offset', 'id'].map((key) => `uid=${owner}&${key}=PRIVATE`),
  ]) await check(await handler(request(query)), 400, { error: 'Invalid query' });
  assert.equal(reads, 0);
  assert.equal(rpc.calls.length, 0);
});

test('OPTIONS is bodyless; unsupported methods return Allow, without configuration or RPC', async () => {
  const rpc = fixture([]);
  let reads = 0;
  const handler = createPublicProjectsHandler(() => { reads++; return config; }, rpc);
  await check(await handler(request('', { method: 'OPTIONS', headers: {
    Origin: 'https://another.example', 'Access-Control-Request-Method': 'GET',
  } })), 204, null);
  // An unneeded auth header or write method is not granted by preflight.
  await check(await handler(request('', { method: 'OPTIONS', headers: {
    'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization',
  } })), 204, null);
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'HEAD']) {
    const response = await handler(request('', { method }));
    assert.equal(response.headers.get('Allow'), 'GET, OPTIONS');
    await check(response, 405, { error: 'Method not allowed' });
  }
  assert.equal(reads, 0);
  assert.equal(rpc.calls.length, 0);
});

test('runtime configuration errors are sanitized before upstream access', async () => {
  const rpc = fixture([]);
  for (const getConfig of [() => { throw new Error('PRIVATE'); },
    () => ({ ...config, SUPABASE_URL: undefined }),
    () => ({ ...config, PUBLIC_PROJECTS_ROLE_JWT: 'PRIVATE' }),
  ]) {
    await check(await createPublicProjectsHandler(getConfig, rpc)(request()),
      503, { error: 'Projects unavailable' });
  }
  assert.equal(rpc.calls.length, 0);
});

test('upstream failures and invalid data discard partial output and hide details', async () => {
  for (const partial of [false, true]) {
    for (const outcome of [new Error('PRIVATE'), new Response('PRIVATE', { status: 403 }),
      new Response('PRIVATE'), Response.json(page([{ ...project(), id: 'PRIVATE' }])),
    ]) {
      let calls = 0;
      /** @type {typeof globalThis.fetch} */
      const fetch = async () => {
        calls++;
        if (partial && calls === 1) return Response.json(page([project('1')], '2'));
        if (outcome instanceof Error) throw outcome;
        return outcome;
      };
      const handler = createPublicProjectsHandler(() => config, { fetch });
      await check(await handler(request()), 503, { error: 'Projects unavailable' });
      assert.equal(calls, partial ? 2 : 1);
    }
  }
});

test('native entry reads fresh infrastructure keys and restricted bearer per valid GET (fake Deno)', async (t) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'Deno');
  /** @type {((request: Request) => Response | Promise<Response>)[]} */
  const handlers = [];
  /** @type {string[]} */
  const reads = [];
  const values = new Map(Object.entries(config));
  const publishable = 'sb_publishable_FAKE_entry_0123456789-abcdefghijk';
  const rpc = fixture([page([]), page([project()]), page([])]);
  t.mock.method(globalThis, 'fetch', rpc.fetch);
  Object.defineProperty(globalThis, 'Deno', { configurable: true, value: {
    env: {
      /** @param {string} key */
      get(key) { reads.push(key); return values.get(key); },
    },
    /** @param {(request: Request) => Response | Promise<Response>} handler */
    serve(handler) { handlers.push(handler); },
  } });
  try {
    await import('../supabase/functions/public-projects/index.ts');
    assert.equal(handlers.length, 1);
    assert.deepEqual(reads, []);
    const handler = handlers[0];
    await check(await handler(request('', { method: 'OPTIONS' })), 204, null);
    await check(await handler(request('')), 400, { error: 'Invalid query' });
    assert.deepEqual(reads, []);
    await check(await handler(request()), 200, { projects: [] });
    assert.equal(rpc.calls[0].headers.get('apikey'), config.SUPABASE_ANON_KEY);
    values.set('SUPABASE_PUBLISHABLE_KEYS', JSON.stringify({ default: publishable }));
    values.delete('SUPABASE_ANON_KEY');
    const published = await handler(request());
    assert.equal(JSON.stringify([...published.headers]).includes(publishable), false);
    await check(published, 200, { projects: [project()] });
    assert.equal(rpc.calls[1].headers.get('apikey'), publishable);
    assert.equal(rpc.calls[1].headers.get('authorization'), `Bearer ${config.PUBLIC_PROJECTS_ROLE_JWT}`);
    values.set('SUPABASE_ANON_KEY', config.SUPABASE_ANON_KEY);
    values.set('SUPABASE_PUBLISHABLE_KEYS', '{}');
    await check(await handler(request()), 503, { error: 'Projects unavailable' });
    values.delete('SUPABASE_PUBLISHABLE_KEYS');
    await check(await handler(request()), 200, { projects: [] });
    assert.equal(rpc.calls[2].headers.get('apikey'), config.SUPABASE_ANON_KEY);
    values.set('SUPABASE_PUBLISHABLE_KEYS', JSON.stringify({ default: publishable }));
    values.delete('PUBLIC_PROJECTS_ROLE_JWT');
    await check(await handler(request()), 503, { error: 'Projects unavailable' });
    const keys = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_PUBLISHABLE_KEYS', 'PUBLIC_PROJECTS_ROLE_JWT'];
    assert.deepEqual(reads, Array.from({ length: 5 }, () => keys).flat());
    assert.equal(rpc.calls.length, 3);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'Deno', previous);
    else Reflect.deleteProperty(globalThis, 'Deno');
  }
});

test('gateway disables JWT verification only for the intentionally public function', async () => {
  const text = await readFile(new URL('../supabase/config.toml', import.meta.url), 'utf8');
  const settings = text.split('\n').map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
  assert.deepEqual(settings, ['[functions.public-projects]', 'verify_jwt = false']);
});
