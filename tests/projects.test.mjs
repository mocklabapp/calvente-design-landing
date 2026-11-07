import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';

// Only replace Astro's environment bridge; production uses astro:env/server.
registerHooks({ resolve(specifier, context, next) {
  if (specifier === 'astro:env/server') return { shortCircuit: true,
    url: 'data:text/javascript,export const getSecret = (name) => process.env[name];' };
  return next(specifier, context);
} });
const { getProjects } = await import('../src/lib/projects.ts');
const { GET } = await import('../src/pages/api/projects.json.ts');
const owner = '12345678-1234-4234-8234-123456789abc';
const key = 'fixture-secret-not-real';
const row = (id = '9007199254740993') => ({ id, user: owner, title: 'Public',
  description: null, weblink: null, project_translation_settings: null,
  prompt: 'PRIVATE', nas_folder: 'PRIVATE' });
const response = (rows, total = rows.length, start = 0) => new Response(JSON.stringify(rows), {
  headers: { 'content-range': rows.length ? `${start}-${start + rows.length - 1}/${total}` : `*/${total}` },
});
const originalFetch = globalThis.fetch;
test.beforeEach(() => {
  process.env.SUPABASE_URL = 'https://mygqfdbloqojffhsurgo.supabase.co';
  process.env.SUPABASE_SECRET_KEY = key;
  process.env.GALIA_USER_ID = owner;
});
test.afterEach(() => { globalThis.fetch = originalFetch; });

test('fixed owner, allowlist, nested relation and no state filter; partial translations survive', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url.searchParams.get('user'), `eq.${owner}`);
    assert.equal(url.searchParams.has('state'), false);
    assert.equal(url.searchParams.get('order'), 'id.asc');
    assert.match(url.searchParams.get('select'), /id::text/);
    assert.match(url.searchParams.get('select'), /project_translation_settings\(original_language,project_translations\(language,title,description\)\)/);
    assert.doesNotMatch(url.searchParams.get('select'), /\*|prompt|nas_folder/);
    assert.equal(options.redirect, 'error');
    assert.equal(options.cache, 'no-store');
    assert.ok(options.signal instanceof AbortSignal);
    assert.equal(options.headers.apikey, key);
    return response([{ ...row(), project_translation_settings: { original_language: 'ca',
      project_translations: [{ language: 'en', title: null, description: 'Partial', prompt: 'PRIVATE' }] } },
    row('9007199254740994')]);
  };
  const result = await getProjects();
  assert.deepEqual(result, [{ id: '9007199254740993', title: 'Public', description: null, weblink: null,
    originalLanguage: 'ca', translations: [{ language: 'en', title: null, description: 'Partial' }] },
  { id: '9007199254740994', title: 'Public', description: null, weblink: null,
    originalLanguage: null, translations: [] }]);
});

test('pagination follows actual rows returned even with a lower upstream cap', async () => {
  let calls = 0;
  globalThis.fetch = async (url) => {
    assert.equal(url.searchParams.get('offset'), String(calls));
    calls++;
    return response([row(String(calls))], 3, calls - 1);
  };
  assert.equal((await getProjects()).length, 3);
  assert.equal(calls, 3);
});

test('empty portfolio is valid', async () => {
  globalThis.fetch = async () => response([], 0);
  assert.deepEqual(await getProjects(), []);
});

test('configuration fails before sending credentials to unsafe URLs or invalid owners', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error(key); };
  for (const url of ['http://mygqfdbloqojffhsurgo.supabase.co', 'https://evil.test',
    'https://mygqfdbloqojffhsurgo.supabase.co@evil.test',
    'https://mygqfdbloqojffhsurgo.supabase.co/path',
    'https://mygqfdbloqojffhsurgo.supabase.co?key=x']) {
    process.env.SUPABASE_URL = url;
    await assert.rejects(getProjects(), /Projects unavailable/);
  }
  process.env.SUPABASE_URL = 'https://mygqfdbloqojffhsurgo.supabase.co';
  process.env.GALIA_USER_ID = 'invalid';
  await assert.rejects(getProjects(), /Projects unavailable/);
  assert.equal(calls, 0);
});

test('public endpoint ignores caller overrides and re-fetches with no-store on every request', async () => {
  let calls = 0;
  globalThis.fetch = async (url) => {
    assert.equal(url.searchParams.get('user'), `eq.${owner}`);
    return response([{ ...row(), title: `Version ${++calls}` }]);
  };
  for (let i = 1; i <= 2; i++) {
    const res = await GET({ request: new Request('https://site.test/api/projects.json?user=other&key=evil') });
    assert.equal(res.status, 200);
    for (const header of ['cache-control', 'cdn-cache-control', 'vercel-cdn-cache-control']) {
      assert.match(res.headers.get(header), /no-store/);
    }
    assert.equal((await res.json()).projects[0].title, `Version ${i}`);
  }
});

test('errors, malformed data and foreign owners fail closed without upstream details', async () => {
  for (const upstream of [
    async () => { throw new Error(key); },
    async () => new Response(key, { status: 403 }),
    async () => new Response('', { status: 302, headers: { location: 'https://evil.test' } }),
    async () => response([{ ...row(), user: 'other' }]),
    async () => response([{ ...row(), id: 9007199254740992 }]),
    async () => response([{ ...row(), title: {} }]),
    async () => response([{ ...row(), project_translation_settings: [] }]),
    async () => new Response('{broken'),
    async () => response([], 10),
    async () => new Response('[]'),
  ]) {
    globalThis.fetch = upstream;
    const res = await GET({});
    assert.equal(res.status, 503);
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await res.json(), { error: 'Projects unavailable' });
  }
  delete process.env.SUPABASE_SECRET_KEY;
  const res = await GET({});
  assert.equal(res.status, 503);
});
