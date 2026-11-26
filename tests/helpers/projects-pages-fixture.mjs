// @ts-check
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fixture } from './build-fixture.mjs';

const origin = 'https://abcdefghijklmnopqrst.supabase.co';
const owner = '12345678-1234-4234-8234-123456789abc';
const bucket = `${origin}/storage/v1/object/public/projects-images`;
export const noStoreHeaders = ['cache-control', 'cdn-cache-control', 'vercel-cdn-cache-control'];

/** @param {string} name */
const image = (name) => ({ url: `${bucket}/owner/${name}.jpg` });

/** Three projects: translated, Spanish-only with unsafe link/no photos, English-only. */
export const projects = [
  { id: '1', title: 'Casa Patio', description: 'Primera línea del memo.\nSegunda línea del memo.',
    weblink: 'https://example.com/casa', originalLanguage: 'es', category: 'residencial', year: '2024',
    images: [image('a'), image('b'), image('c')],
    translations: [{ language: 'en', title: 'Courtyard House', description: 'First memo line.' }] },
  { id: '2', title: 'Solo español', description: 'Texto que no debe filtrarse al inglés.',
    weblink: 'javascript:alert(1)', originalLanguage: 'es', category: 'cultural', year: null,
    images: [], translations: [] },
  { id: '3', title: 'English only', description: 'Only English text.', weblink: null,
    originalLanguage: 'en', category: null, year: '2026', images: [image('d')], translations: [] },
];

/** @typedef {{ status: number, headers: Headers, body: string }} Reply */
/** @typedef {{ root: string, request: (path: string) => Promise<Reply>, scenario: (next: unknown) => void, calls: () => number, close: () => void }} Site */

/**
 * Build the whole site once in an isolated scratch copy, then drive its on-demand handler.
 * The upstream is a fake `fetch`: `scenario` is a project list, or `'failure'` for a 403.
 * @returns {Promise<Site>}
 */
export async function startSite() {
  const names = ['MOCKLAB_PROJECTS_URL', 'MOCKLAB_USER_ID'];
  const result = await fixture();
  assert.equal(result.status, 0, result.output);
  const nativeFetch = globalThis.fetch;
  /** @type {unknown} */
  let current = projects;
  let calls = 0;
  process.env.MOCKLAB_PROJECTS_URL = `${origin}/functions/v1/public-projects`;
  process.env.MOCKLAB_USER_ID = owner;
  globalThis.fetch = async (input) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    assert.equal(url.href, `${origin}/functions/v1/public-projects?uid=${owner}`);
    calls++;
    return current === 'failure'
      ? new Response('private-upstream-detail', { status: 403 })
      : Response.json({ projects: current });
  };
  const module = await import(pathToFileURL(join(result.root, '.vercel/output/_functions/entry.mjs')).href);
  /** @type {unknown} */
  const handler = module.default;
  assert.ok(handler && typeof handler === 'object' && 'fetch' in handler && typeof handler.fetch === 'function');
  /** @type {(request: Request) => Promise<unknown>} */
  const handle = handler.fetch.bind(handler);
  return {
    root: result.root,
    async request(path) {
      const response = await handle(new Request(`http://site.test${path}`));
      assert.ok(response instanceof Response);
      return { status: response.status, headers: response.headers, body: await response.text() };
    },
    scenario(next) { current = next; },
    calls: () => calls,
    close() {
      globalThis.fetch = nativeFetch;
      for (const name of names) delete process.env[name];
    },
  };
}
