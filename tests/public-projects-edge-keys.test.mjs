// @ts-check
/// <reference types="node" />
import assert from 'node:assert/strict';
import test from 'node:test';
import { readPublicProjects } from '../supabase/functions/public-projects/reader.ts';
import { createPublicProjectsHandler } from '../supabase/functions/public-projects/handler.ts';
import { config, fixture, jwt, owner, page, project } from './helpers/public-projects-edge.mjs';

// Synthetic opaque values only; no key generation or real infrastructure credentials.
const publishable = 'sb_publishable_FAKE_fixture_0123456789-abcdefghij';
const publishableKeys = JSON.stringify({ default: publishable });

test('native default publishable key is preferred only as apikey, with restricted bearer', async () => {
  for (const legacy of [undefined, config.SUPABASE_ANON_KEY, jwt('service_role'), 'invalid']) {
    const rpc = fixture([page([project('1')], '2'), page([project('2')], '2', 1)]);
    const result = await readPublicProjects(owner, {
      ...config, SUPABASE_ANON_KEY: legacy, SUPABASE_PUBLISHABLE_KEYS: publishableKeys,
    }, rpc);
    assert.deepEqual(result, [project('1'), project('2')]);
    assert.equal(rpc.calls.length, 2);
    for (const call of rpc.calls) {
      assert.equal(call.headers.get('apikey'), publishable);
      assert.equal(call.headers.get('authorization'), `Bearer ${config.PUBLIC_PROJECTS_ROLE_JWT}`);
      assert.equal(call.cache, 'no-store');
      assert.equal(call.redirect, 'error');
    }
  }
});

test('absent publishable dictionary retains legacy anon JWT without changing bearer', async () => {
  const rpc = fixture([page([])]);
  assert.deepEqual(await readPublicProjects(owner, config, rpc), []);
  assert.equal(rpc.calls[0].headers.get('apikey'), config.SUPABASE_ANON_KEY);
  assert.equal(rpc.calls[0].headers.get('authorization'), `Bearer ${config.PUBLIC_PROJECTS_ROLE_JWT}`);
});

test('only the default dictionary entry selects infrastructure credentials', async () => {
  const rpc = fixture([page([])]);
  assert.deepEqual(await readPublicProjects(owner, {
    ...config,
    SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({ named: 'ignored', default: publishable }),
  }, rpc), []);
  assert.equal(rpc.calls[0].headers.get('apikey'), publishable);
});

const invalidConfigurations = [
  '', ' ', '{', 'null', 'false', '42', '[]', '{}', JSON.stringify(publishable),
  JSON.stringify({ named: publishable }),
  ...[null, false, 42, [], {}, '', 'sb_publishable_',
    'sb_secret_FAKE_fixture', jwt('service_role'), jwt('anon'),
    'SB_PUBLISHABLE_FAKE', ` ${publishable}`, `${publishable} `,
    `${publishable}\n`, `${publishable}\r\n`, `${publishable}\t`, `${publishable}\0`,
    `${publishable}\x7f`, `${publishable}é`, `${publishable}.suffix`,
    `${publishable}/suffix`, `${publishable}=`,
  ].map((value) => JSON.stringify({ default: value })),
];

for (const [index, value] of invalidConfigurations.entries()) {
  test(`explicit invalid publishable configuration ${index + 1} fails closed before fetch`, async () => {
    const rpc = fixture([]);
    // A usable legacy key must never mask a broken explicit new configuration.
    const current = { ...config, SUPABASE_PUBLISHABLE_KEYS: value };
    await assert.rejects(readPublicProjects(owner, current, rpc), {
      name: 'Error', message: 'Projects unavailable',
    });
    const response = await createPublicProjectsHandler(() => current, rpc)(
      new Request(`https://edge.example.test/?uid=${owner}`),
    );
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'Projects unavailable' });
    for (const name of ['Cache-Control', 'CDN-Cache-Control', 'Vercel-CDN-Cache-Control']) {
      assert.equal(response.headers.get(name), 'no-store');
    }
    assert.equal(rpc.calls.length, 0);
  });
}

test('publishable apikey never substitutes for or relaxes the restricted role bearer', async () => {
  for (const token of [undefined, '', publishable, 'sb_secret_FAKE_fixture',
    jwt('anon'), jwt('service_role'), jwt('authenticated'), 'e30.bm90LWpzb24.fake']) {
    const rpc = fixture([]);
    await assert.rejects(readPublicProjects(owner, {
      ...config, SUPABASE_PUBLISHABLE_KEYS: publishableKeys, PUBLIC_PROJECTS_ROLE_JWT: token,
    }, rpc), { name: 'Error', message: 'Projects unavailable' });
    assert.equal(rpc.calls.length, 0);
  }
});
