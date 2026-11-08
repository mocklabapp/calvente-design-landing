// @ts-check
/// <reference types="node" />
import assert from 'node:assert/strict';

export const owner = '11111111-1111-1111-1111-111111111111';
/** @param {string} role */
export const jwt = (role) => `e30.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.fake`;
export const config = {
  SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co',
  SUPABASE_ANON_KEY: jwt('anon'),
  PUBLIC_PROJECTS_ROLE_JWT: jwt('public_projects_runtime'),
};
/** @param {string} [id] */
export const project = (id = '9007199254740993') => ({
  id, title: null, description: 'Original', weblink: null, originalLanguage: null,
  translations: [{ language: 'ca', title: 'Traducció', description: null }],
});
/** @param {unknown[]} projects @param {string} [total] @param {number} [offset] */
export const page = (projects, total = String(projects.length), offset = 0) => ({
  projects, total, count: projects.length, offset, limit: 200,
});
/** @param {unknown[]} pages */
export function fixture(pages) {
  /** @type {Request[]} */
  const calls = [];
  /** @type {typeof globalThis.fetch} */
  const fetch = async (input, init) => {
    const request = new Request(input, init);
    calls.push(request);
    assert.ok(calls.length <= pages.length, 'Unexpected RPC call');
    return Response.json(pages[calls.length - 1]);
  };
  return { fetch, calls };
}
