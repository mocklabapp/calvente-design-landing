// @ts-check
/// <reference types="node" />
import assert from 'node:assert/strict';
import test from 'node:test';
import { readPublicProjects } from '../supabase/functions/public-projects/reader.ts';
import { config, fixture, jwt, owner, page, project } from './helpers/public-projects-edge.mjs';

/** @param {Promise<unknown>} result */
async function unavailable(result) {
  await assert.rejects(result, { name: 'Error', message: 'Projects unavailable' });
}

test('public DTO, capped pagination, fixed RPC and restricted credentials for either owner', async () => {
  for (const uid of [owner, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa']) {
    const first = { ...project(), state: 'draft', prompt: 'PRIVATE', user: uid };
    const second = { ...project('9223372036854775807'), state: 'published',
      originalLanguage: 'es', translations: [] };
    const rpc = fixture([page([first], '2'), page([second], '2', 1)]);
    let deadlines = 0;
    const signal = new AbortController().signal;
    const result = await readPublicProjects(uid.toUpperCase(), config, {
      fetch: (input, init) => {
        assert.equal(init?.signal, signal);
        return rpc.fetch(input, init);
      },
      timeout: (ms) => {
        assert.equal(ms, 10_000);
        deadlines++;
        return signal;
      },
    });
    assert.deepEqual(result, [project(), { ...project('9223372036854775807'),
      originalLanguage: 'es', translations: [] }]);
    assert.equal(first.prompt, 'PRIVATE');
    assert.equal(deadlines, 1);
    assert.equal(rpc.calls.length, 2);
    for (const [offset, request] of rpc.calls.entries()) {
      assert.equal(request.url, `${config.SUPABASE_URL}/rest/v1/rpc/export_public_projects`);
      assert.equal(request.method, 'POST');
      assert.deepEqual(await request.json(), { p_owner: uid, p_offset: offset, p_limit: 200 });
      assert.equal(request.headers.get('apikey'), config.SUPABASE_ANON_KEY);
      assert.equal(request.headers.get('authorization'), `Bearer ${config.PUBLIC_PROJECTS_ROLE_JWT}`);
      assert.equal(request.headers.get('content-type'), 'application/json');
      assert.equal(request.cache, 'no-store');
      assert.equal(request.redirect, 'error');
    }
  }
});

test('all supported languages and null content retain only public translation fields', async () => {
  for (const locale of ['es', 'en', 'ca']) {
    const value = { ...project(), description: null, weblink: 'https://example.test',
      originalLanguage: locale, translations: [{ language: locale, title: null,
        description: 'Text', prompt: 'PRIVATE', token: config.PUBLIC_PROJECTS_ROLE_JWT }] };
    const rpc = fixture([page([value])]);
    assert.deepEqual(await readPublicProjects(owner, config, rpc), [{ ...value,
      translations: [{ language: locale, title: null, description: 'Text' }] }]);
  }
  const value = { ...project(), translations: [] };
  assert.deepEqual(await readPublicProjects(owner, config, fixture([page([value])])), [value]);
});

test('empty owner and fresh data on subsequent calls', async () => {
  const rpc = fixture([page([]), page([project()])]);
  assert.deepEqual(await readPublicProjects(owner, config, rpc), []);
  assert.deepEqual(await readPublicProjects(owner, config, rpc), [project()]);
});

test('invalid UID/configuration never fetches, including privileged credentials', async () => {
  const rpc = fixture([]);
  for (const uid of ['', 'bad', `${owner},${owner}`, `${owner}&p_owner=other`]) {
    await unavailable(readPublicProjects(uid, config, rpc));
  }
  for (const patch of [
    { SUPABASE_URL: 'http://abcdefghijklmnopqrst.supabase.co' },
    { SUPABASE_URL: `${config.SUPABASE_URL}.evil.test` },
    { SUPABASE_URL: `${config.SUPABASE_URL}/rest/v1` },
    { SUPABASE_URL: `${config.SUPABASE_URL}?key=secret` },
    { SUPABASE_URL: 'https://user:pass@abcdefghijklmnopqrst.supabase.co' },
    { SUPABASE_URL: `${config.SUPABASE_URL}:443` },
    { SUPABASE_URL: `${config.SUPABASE_URL}#fragment` },
    { SUPABASE_URL: undefined },
    { SUPABASE_ANON_KEY: undefined },
    { SUPABASE_ANON_KEY: jwt('service_role') },
    { PUBLIC_PROJECTS_ROLE_JWT: undefined },
    { PUBLIC_PROJECTS_ROLE_JWT: jwt('service_role') },
    { PUBLIC_PROJECTS_ROLE_JWT: jwt('anon') },
    { PUBLIC_PROJECTS_ROLE_JWT: 'not-a-jwt' },
    { PUBLIC_PROJECTS_ROLE_JWT: 'e30.bm90LWpzb24.fake' },
  ]) await unavailable(readPublicProjects(owner, { ...config, ...patch }, rpc));
  assert.equal(rpc.calls.length, 0);
});

const invalidPages = [
  null, [], { ...page([]), total: 0 }, { ...page([]), total: '01' },
  { ...page([]), total: '-1' }, { ...page([]), total: '9007199254740993' },
  { ...page([]), total: '1000201' }, { ...page([]), count: 1 },
  { ...page([]), count: '0' }, { ...page([]), offset: 1 },
  { ...page([]), limit: 100 }, page([], '1'), page([project()], '0'),
  page(Array.from({ length: 201 }, (_, i) => project(String(i + 1)))),
  ...['0', '-1', '01', '1.2', '9223372036854775808', 1].map((id) =>
    page([{ ...project(), id }])),
  ...[undefined, 42, {}].map((title) => page([{ ...project(), title }])),
  page([{ ...project(), description: false }]), page([{ ...project(), weblink: 3 }]),
  page([{ ...project(), originalLanguage: 'fr' }]),
  page([{ ...project(), translations: null }]),
  page([{ ...project(), originalLanguage: undefined }]),
  page([{ ...project(), translations: [null] }]),
  page([project('2'), project('1')]), page([project('1'), project('1')]),
  page([{ ...project(), translations: [{ language: 'fr', title: null, description: null }] }]),
  page([{ ...project(), translations: [{ language: 'en', title: null }] }]),
  page([{ ...project(), translations: [...project().translations, ...project().translations] }]),
];
for (const [index, value] of invalidPages.entries()) {
  test(`malformed envelope/DTO ${index + 1} is sanitized`, async () => {
    const rpc = fixture([value]);
    await unavailable(readPublicProjects(owner, config, rpc));
    assert.equal(rpc.calls.length, 1);
  });
}

test('pagination rejects changed totals, zero progress, duplicate/decreasing IDs and overflow', async () => {
  for (const next of [
    page([project('3')], '3', 1), page([], '2', 1),
    page([project('2')], '2', 1), page([project('1')], '2', 1),
    page([project('3'), project('4')], '2', 1),
  ]) {
    const rpc = fixture([page([project('2')], '2'), next]);
    await unavailable(readPublicProjects(owner, config, rpc));
    assert.equal(rpc.calls.length, 2);
  }
});

test('network, upstream HTTP, redirect and JSON failures never expose details or partial data', async () => {
  for (const outcome of [new Response('SECRET', { status: 403 }),
    new Response('SECRET', { status: 302, headers: { location: 'https://evil.test' } }),
    new Response('SECRET'), new Error('SECRET')]) {
    let calls = 0;
    /** @type {typeof globalThis.fetch} */
    const fetch = async () => {
      if (++calls === 1) return Response.json(page([project('1')], '2'));
      if (outcome instanceof Error) throw outcome;
      return outcome;
    };
    await unavailable(readPublicProjects(owner, config, { fetch }));
    assert.equal(calls, 2);
  }
});

test('one deadline aborts between pages and during fetch/body consumption', async () => {
  for (const phase of ['before', 'fetch', 'body']) {
    const controller = new AbortController();
    let calls = 0;
    if (phase === 'before') controller.abort();
    /** @type {typeof globalThis.fetch} */
    const fetch = async (input, init) => {
      calls++;
      const request = new Request(input, init);
      if (phase === 'fetch') {
        controller.abort();
        assert.equal(request.signal.aborted, true);
        throw new Error('SECRET');
      }
      return new Response(new ReadableStream({ start(stream) {
        stream.enqueue(new TextEncoder().encode(JSON.stringify(page([project('1')], '2'))));
        controller.abort();
        stream.close();
      } }));
    };
    await unavailable(readPublicProjects(owner, config, { fetch, timeout: () => controller.signal }));
    assert.equal(calls, phase === 'before' ? 0 : 1);
  }
});
