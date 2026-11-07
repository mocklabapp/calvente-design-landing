// @ts-check
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { localizedProjectFixture, projectResponse } from './helpers/localized-project-fixture.mjs';

test('full-document locale requests share local/UI and fresh project language', async () => {
  const result = await localizedProjectFixture();
  assert.equal(result.status, 0, result.output);
  let version = 1;
  let calls = 0;
  const nativeFetch = globalThis.fetch;
  const names = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'GALIA_USER_ID'];
  const previous = names.map((name) => process.env[name]);
  const server = createServer();
  try {
    process.env.SUPABASE_URL = 'https://mygqfdbloqojffhsurgo.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'fake-local-fixture-key';
    process.env.GALIA_USER_ID = '12345678-1234-4234-8234-123456789abc';
    globalThis.fetch = async (input, options) => {
      const url = new URL(input instanceof Request ? input.url : input);
      assert.equal(url.hostname, 'mygqfdbloqojffhsurgo.supabase.co');
      assert.equal(options?.cache, 'no-store');
      calls++;
      return projectResponse(version);
    };
    const module = await import(pathToFileURL(join(result.root, '.vercel/output/_functions/entry.mjs')).href);
    /** @type {unknown} */
    const handler = module.default;
    assert.ok(handler && typeof handler === 'object' && 'fetch' in handler);
    assert.equal(typeof handler.fetch, 'function');
    server.on('request', async (req, res) => {
      try {
        if (typeof handler.fetch !== 'function') throw new Error('Missing fetch handler');
        /** @type {unknown} */
        const response = await handler.fetch(new Request(`http://site.test${req.url}`));
        assert.ok(response instanceof Response);
        res.writeHead(response.status, Object.fromEntries(response.headers));
        res.end(Buffer.from(await response.arrayBuffer()));
      } catch { res.writeHead(500); res.end('Fixture handler failed'); }
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    const site = `http://127.0.0.1:${address.port}`;
    /** @param {string} path @param {number} status */
    const request = async (path, status) => {
      const response = await nativeFetch(`${site}${path}`);
      assert.equal(response.status, status);
      for (const header of ['cache-control', 'cdn-cache-control', 'vercel-cdn-cache-control']) {
        assert.equal(response.headers.get(header), 'no-store');
      }
      return response.text();
    };
    const spanish = await request('/', 200);
    assert.match(spanish, /<html lang="es"/u);
    assert.match(spanish, /Página local/u);
    assert.match(spanish, /Cuerpo local/u);
    assert.match(spanish, /Idioma/u);
    assert.match(spanish, /Original v1/u);
    assert.match(spanish, /href="\/en\/"[^>]*hreflang="en"/u);
    // Follow the equivalent anchor as a fresh HTTP document request, not a SPA update.
    const english = await request('/en/', 200);
    assert.match(english, /<html lang="en"/u);
    assert.match(english, /Local page/u);
    assert.match(english, /Local body/u);
    assert.match(english, /Language/u);
    assert.match(english, /Translated v1/u);
    assert.match(english, /href="\/"[^>]*hreflang="es"/u);
    assert.match(english, /data-content-source="missing"/u);
    assert.doesNotMatch(english, /Original v1|Untranslated original must not leak|Cuerpo local/u);
    version = 2;
    assert.match(await request('/en/', 200), /Translated v2/u);
    version = 3;
    const failure = await request('/en/', 503);
    assert.match(failure, /Projects unavailable/u);
    assert.doesNotMatch(failure, /private-upstream-detail|fake-local-fixture-key/u);
    assert.equal(await request('/fr/', 404), 'Not found');
    assert.equal(calls, 4, 'unpublished locale must not fetch projects');
  } finally {
    globalThis.fetch = nativeFetch;
    names.forEach((name, i) => {
      if (previous[i] === undefined) delete process.env[name];
      else process.env[name] = previous[i];
    });
    server.closeAllConnections();
    if (server.listening) await new Promise((resolve) => server.close(resolve));
  }
});
