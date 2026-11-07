import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

const owner = '12345678-1234-4234-8234-123456789abc';
const secret = 'runtime-fixture-secret-not-real';
const listen = async (server) => {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
};

test('built Vercel public HTTP endpoint reflects changed upstream without rebuilding', async () => {
  let version = 1;
  let upstreamCalls = 0;
  const nativeFetch = globalThis.fetch;
  const upstream = createServer((req, res) => {
    upstreamCalls++;
    const url = new URL(req.url, 'http://fixture.test');
    assert.equal(url.pathname, '/rest/v1/projects');
    assert.equal(url.searchParams.get('user'), `eq.${owner}`);
    assert.equal(req.headers.apikey, secret);
    if (version === 3) { res.writeHead(403); res.end(secret); return; }
    res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Range': '0-1/2' });
    // Different states are deliberately irrelevant to the public mapping.
    res.end(JSON.stringify(['draft', 'published'].map((state, i) => ({
      id: String(i + 1), user: owner, title: `${state} v${version}`, description: null,
      weblink: null, state, prompt: secret, project_translation_settings: null,
    }))));
  });
  let server;
  try {
    const upstreamURL = await listen(upstream);
    globalThis.fetch = (input, options) => {
      const url = new URL(input instanceof Request ? input.url : input);
      if (url.hostname === 'mygqfdbloqojffhsurgo.supabase.co') {
        return nativeFetch(`${upstreamURL}${url.pathname}${url.search}`, options);
      }
      return nativeFetch(input, options);
    };
    // The build used no credentials; environment is supplied only after build.
    process.env.SUPABASE_URL = 'https://mygqfdbloqojffhsurgo.supabase.co';
    process.env.SUPABASE_SECRET_KEY = secret;
    process.env.GALIA_USER_ID = owner;
    const { default: handler } = await import('../.vercel/output/_functions/entry.mjs');
    server = createServer(async (req, res) => {
      try {
        const result = await handler.fetch(new Request(`http://site.test${req.url}`));
        res.writeHead(result.status, Object.fromEntries(result.headers));
        res.end(Buffer.from(await result.arrayBuffer()));
      } catch { res.writeHead(500); res.end('Fixture handler failed'); }
    });
    const site = await listen(server);
    for (version = 1; version <= 3; version++) {
      const result = await nativeFetch(`${site}/api/projects.json?user=foreign&SUPABASE_SECRET_KEY=foreign`);
      assert.equal(result.status, version === 3 ? 503 : 200);
      for (const header of ['cache-control', 'cdn-cache-control', 'vercel-cdn-cache-control']) {
        assert.equal(result.headers.get(header), 'no-store');
      }
      const body = await result.text();
      assert.ok(!body.includes(secret));
      if (version < 3) {
        assert.deepEqual(JSON.parse(body).projects.map((p) => p.title), [`draft v${version}`, `published v${version}`]);
      } else assert.deepEqual(JSON.parse(body), { error: 'Projects unavailable' });
    }
    assert.equal(upstreamCalls, 3);
    delete process.env.SUPABASE_SECRET_KEY;
    const unconfigured = await nativeFetch(`${site}/api/projects.json`);
    assert.equal(unconfigured.status, 503);
    assert.equal(upstreamCalls, 3);
    assert.equal(unconfigured.headers.get('cache-control'), 'no-store');
    const config = JSON.parse(await readFile(new URL('../.vercel/output/config.json', import.meta.url)));
    assert.ok(JSON.stringify(config).includes('_render'));
    assert.ok(!JSON.stringify(config).includes('isr'));
    const scan = async (directory) => {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const file = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directory);
        if (entry.isDirectory()) await scan(file);
        else assert.ok(!(await readFile(file)).includes(Buffer.from(secret)));
      }
    };
    await scan(new URL('../dist/client/', import.meta.url));
  } finally {
    globalThis.fetch = nativeFetch;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.GALIA_USER_ID;
    if (server) { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
    upstream.closeAllConnections();
    await new Promise((resolve) => upstream.close(resolve));
  }
});
