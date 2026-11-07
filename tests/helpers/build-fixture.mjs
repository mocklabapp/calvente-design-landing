// @ts-check
import { cp, mkdtemp, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const project = fileURLToPath(new URL('../../', import.meta.url));
// One dependency copy per suite, never a symlink to a shared Astro cache.
// Canonical paths keep Astro's client-script metadata consistent on macOS (/var -> /private/var).
const scratch = await realpath(await mkdtemp(join(tmpdir(), 'base-landing-mocklab-i18n-')));
// Preserve pnpm's relative internal links instead of rewriting them to the checkout.
await cp(join(project, 'node_modules'), join(scratch, 'node_modules'), {
  recursive: true, verbatimSymlinks: true,
});
const astro = pathToFileURL(createRequire(join(scratch, 'package.json')).resolve('astro')).href;
let counter = 0;

/**
 * @typedef {{ root: string, replace: (path: string, from: string, to: string) => Promise<void> }} FixtureInput
 */

/**
 * @param {(input: FixtureInput) => void | Promise<void>} [change]
 * @param {{ site?: boolean }} [options]
 */
export async function fixture(change = async () => {}, options = {}) {
  const root = join(scratch, String(counter++));
  await mkdir(root);
  for (const path of ['src', 'public', 'astro.config.mjs', 'tsconfig.json', 'package.json']) {
    await cp(join(project, path), join(root, path), { recursive: true });
  }
  /** @type {FixtureInput['replace']} */
  const replace = async (path, from, to) => {
    const target = join(root, path);
    const text = await readFile(target, 'utf8');
    if (!text.includes(from)) throw new Error(`Fixture replacement missing: ${from}`);
    await writeFile(target, text.replace(from, to));
  };
  await change({ root, replace });
  const script = `import { build } from ${JSON.stringify(astro)};
    await build({ root: ${JSON.stringify(root)}, cacheDir: ${JSON.stringify(join(root, 'cache'))},
      ${options.site === false ? '' : "site: 'https://example.test',"} });`;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: root, encoding: 'utf8', timeout: 120_000,
    env: { ...process.env, TMPDIR: scratch, ASTRO_TELEMETRY_DISABLED: '1' },
  });
  if (result.error) throw result.error;
  return { ...result, root, output: result.stdout + result.stderr,
    html: (path = 'index.html') => readFile(join(root, 'dist', 'client', path), 'utf8') };
}
