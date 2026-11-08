// @ts-check
import { readFile, writeFile, mkdir, lstat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileAt, hash, git, excluded } from './safety.mjs';
import { template, verifyBlankTemplate, createEnvironment } from './environment.mjs';
import { save } from './journal.mjs';

export const targets = ['package.json', 'src/config/site.ts', 'docs/project-brief.md'];

/** @param {unknown} value @returns {Record<string, unknown>} */
export function object(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Expected an object.');
  return /** @type {Record<string, unknown>} */ (value);
}

/** @param {string} path @param {string} original @param {string} name @param {string} slug @param {string} source */
export function transform(path, original, name, slug, source) {
  if (path === 'package.json') {
    const pkg = object(JSON.parse(original));
    if (pkg.name !== 'base-landing-mocklab') throw new Error('Expected starter package identity.');
    pkg.name = slug;
    return JSON.stringify(pkg, null, 2) + '\n';
  }
  if (path === 'src/config/site.ts') {
    const pattern = /\bname:\s*(['"])base-landing-mocklab\1/g;
    if (!original.includes('export const site =') || [...original.matchAll(pattern)].length !== 1) {
      throw new Error('Unsupported shared site identity; no global replacement is allowed.');
    }
    return original.replace(pattern, () => `name: ${JSON.stringify(name)}`);
  }
  if (original.includes('## Initializer identity')) throw new Error('Client brief already initialized.');
  const escaped = name.replace(/[\\`*_{}\[\]()#+.!|<>]/g, '\\$&');
  return original + `\n## Initializer identity\n\n- Confirmed display name: ${escaped}\n- Confirmed package/repository: \`mocklabapp/${slug}\` (private).\n- Source starter version: \`${source}\`.\n- Source: explicit initializer input. Offering, content, design, domain and launch approval remain pending.\n`;
}

/** @param {string} root @returns {Promise<import('./journal.mjs').Entry[]>} */
export async function sourceFiles(root) {
  await verifyBlankTemplate(root);
  const rows = git(root, ['ls-files', '--stage', '-z']).split('\0').filter(Boolean);
  /** @type {import('./journal.mjs').Entry[]} */
  const files = [];
  for (const row of rows) {
    const match = /^(100644|100755) ([a-f0-9]{40}) 0\t(.+)$/.exec(row);
    if (!match) throw new Error('Unsupported index entry or submodule.');
    const [, mode, blob, path] = match;
    if (excluded(path)) continue;
    if (path.endsWith('.gitattributes') || path.endsWith('.gitmodules')) throw new Error('Custom Git attributes/submodules are unsupported.');
    await fileAt(root, path);
    if (git(root, ['hash-object', '--no-filters', '--', path]) !== blob) throw new Error('Tracked bytes differ from the source index.');
    files.push({ path, hash: hash(await readFile(join(root, path))), mode });
  }
  if (![...targets, template].every((path) => files.some((entry) => entry.path === path))) {
    throw new Error('Missing identity target or blank template in source allowlist.');
  }
  return files;
}

/** @param {import('./journal.mjs').State} state */
export async function retainOriginals(state) {
  for (const path of targets) {
    const bytes = await readFile(await fileAt(state.root, path));
    await mkdir(dirname(join(state.backup, 'originals', path)), { recursive: true, mode: 0o700 });
    await writeFile(join(state.backup, 'originals', path), bytes, { flag: 'wx', mode: 0o600 });
    const entry = state.files.find((entry) => entry.path === path);
    if (!entry || hash(bytes) !== entry.hash) throw new Error('Source changed while backing up.');
    state.originals.push({ ...entry });
    entry.hash = hash(transform(path, bytes.toString('utf8'), state.name, state.slug, state.source));
  }
}

/** Idempotent only for exact original or expected bytes; never overwrite foreign edits.
 * @param {import('./journal.mjs').State} state */
export async function editIdentity(state) {
  state.phase = 'editing';
  await save(state);
  for (const path of targets) {
    const original = await readFile(await fileAt(join(state.backup, 'originals'), path), 'utf8');
    const expected = transform(path, original, state.name, state.slug, state.source);
    const target = await fileAt(state.root, path);
    const current = hash(await readFile(target));
    if (current === hash(expected)) continue;
    if (current !== hash(original)) throw new Error('Identity changed externally; manual recovery required.');
    await writeFile(target, expected);
  }
  await createEnvironment(state);
  state.phase = 'edited';
  await save(state);
}

/** @param {import('./journal.mjs').State} state */
export async function verifyModes(state) {
  for (const entry of state.files) {
    const stat = await lstat(await fileAt(state.root, entry.path));
    if (!!(stat.mode & 0o111) !== (entry.mode === '100755')) throw new Error('Source mode mismatch.');
  }
}
