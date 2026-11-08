// @ts-check
import { readFile, realpath } from 'node:fs/promises';
import { join, relative, isAbsolute } from 'node:path';
import { spawnSync } from 'node:child_process';
import { object } from './identity.mjs';
import { safeEnvironment, normal } from './safety.mjs';

const contract = 'astro check && astro build && node --test tests/*.test.mjs';

/** Resolve installed tools without invoking a package manager or downloading anything.
 * @param {string} root */
export async function validationTool(root) {
  const pkg = object(JSON.parse(await readFile(join(root, 'package.json'), 'utf8')));
  if (object(pkg.scripts).validate !== contract) throw new Error('Unsupported validate script; expected the existing starter validation contract.');
  let tool;
  try {
    const directory = await realpath(join(root, 'node_modules/astro'));
    const metadata = object(JSON.parse(await readFile(join(directory, 'package.json'), 'utf8')));
    const bin = object(metadata.bin).astro;
    if (typeof bin !== 'string') throw new Error('Missing local Astro binary.');
    tool = await realpath(join(directory, bin));
    const local = relative(join(root, 'node_modules'), tool);
    if (isAbsolute(local) || local.startsWith('..')) throw new Error('External tool.');
    await normal(tool);
  } catch {
    throw new Error('Installed local Astro tools are required. Install dependencies deliberately before initialization; no automatic install occurs.');
  }
  return tool;
}

/** @param {import('./journal.mjs').State} state */
export async function validateLocal(state) {
  const tool = await validationTool(state.root);
  const tests = state.files.map((entry) => entry.path).filter((path) => /^tests\/[^/]+\.test\.mjs$/.test(path));
  if (!tests.length) throw new Error('No tracked validation tests found.');
  const commands = [[tool, 'check'], [tool, 'build'], ['--test', ...tests]];
  const labels = ['Astro check', 'Astro build', 'Node tests'];
  for (const [index, args] of commands.entries()) {
    const result = spawnSync(process.execPath, args, { cwd: state.root, env: safeEnvironment(),
      encoding: 'utf8', timeout: 1_200_000, maxBuffer: 16 * 1024 * 1024 });
    if (result.status !== 0) throw new Error(`Local validation failed (${labels[index]}). Original history/backup retained; inspect that local command before explicit resume.`);
  }
}
