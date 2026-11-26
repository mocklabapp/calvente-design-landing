// @ts-check
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fixture } from './build-fixture.mjs';

/** Build and type-check the exact copyable guide example in isolated routes. */
export async function localizedProjectFixture() {
  const guide = await readFile(new URL('../../docs/projects.md', import.meta.url), 'utf8');
  const example = guide.match(/```astro\n([\s\S]*?)\n```/u)?.[1];
  assert.ok(example, 'Native Astro example must exist');
  return fixture(async ({ root, replace }) => {
    // English is already enabled by the client defaults. The fixture registry replaces the
    // client pages (kept below it, unused) so local copy never depends on the starter's identity.
    await replace('src/data/pages.ts', 'export const pages: Page[] = [', `export const pages: Page[] = [{ id: 'home', translations: {
  es: { slug: '', title: 'Página local', description: 'Metadatos locales', body: 'Cuerpo local' },
  en: { slug: '', title: 'Local page', description: 'Local metadata', body: 'Local body' },
} }];
export const clientPages: Page[] = [`);
    for (const route of ['index.astro', '[...path].astro']) {
      await writeFile(join(root, 'src/pages', route), example);
    }
    const check = spawnSync(process.execPath,
      [join(dirname(root), 'node_modules/astro/bin/astro.mjs'), 'check'], {
        cwd: root, encoding: 'utf8', timeout: 120_000,
        env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
      });
    assert.equal(check.status, 0, check.stdout + check.stderr);
  });
}

/** @param {number} version */
export function projectResponse(version) {
  if (version === 3) return new Response('private-upstream-detail', { status: 403 });
  return Response.json({ projects: [
    { id: '1', title: `Original v${version}`, description: null, weblink: null,
      originalLanguage: 'es', translations: [
        { language: 'en', title: `Translated v${version}`, description: null },
      ] },
    { id: '2', title: 'Untranslated original must not leak', description: null, weblink: null,
      originalLanguage: 'es', translations: [] },
  ] });
}
