// @ts-check
import { lstat, readdir, readFile, realpath, mkdir, copyFile, constants } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

/** @param {string} path */
export async function exists(path) {
  try { await lstat(path); return true; } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false;
    throw new Error('Cannot inspect required filesystem state.');
  }
}

/** No symlinks, devices, sockets or shared hardlinked files in managed trees.
 * @param {string} path @param {boolean} [directory] */
export async function normal(path, directory = false) {
  const s = await lstat(path);
  if (s.isSymbolicLink() || (directory ? !s.isDirectory() : !s.isFile() || s.nlink !== 1)) {
    throw new Error('Unsupported linked or nonregular filesystem path.');
  }
  return s;
}

/** @param {string} root @param {string} relative */
export async function fileAt(root, relative) {
  await normal(root, true);
  if (!relative || relative.startsWith('/') || relative.includes('\\') ||
      relative.split('/').some((part) => !part || part === '.' || part === '..') || /[\x00-\x1f\x7f]/.test(relative)) {
    throw new Error('Unsafe source path.');
  }
  let current = root;
  const parts = relative.split('/');
  for (const [i, part] of parts.entries()) {
    current = join(current, part);
    await normal(current, i < parts.length - 1);
  }
  return current;
}

/** @param {string} root */
export async function privateParent(root) {
  const parent = dirname(root);
  const s = await normal(parent, true);
  if ((s.mode & 0o022) !== 0 || (process.getuid && s.uid !== process.getuid())) {
    throw new Error('The clone parent must be owned by you and not writable by other users.');
  }
  if (await realpath(root) !== resolve(root)) throw new Error('Use a canonical root path.');
}

/** @param {string | Buffer} value */
export const hash = (value) => createHash('sha256').update(value).digest('hex');

/** Git ignores inherited Git configuration/environment, hooks, filters and signing.
 * Local configuration is separately allowlisted before any source Git invocation.
 * @param {string} cwd @param {string[]} args @param {NodeJS.ProcessEnv} [extra] */
export function git(cwd, args, extra = {}) {
  const result = spawnSync('git', ['--no-optional-locks', '-c', 'core.hooksPath=/dev/null',
    '-c', 'core.fsmonitor=false', '-c', 'commit.gpgSign=false', '-c', 'tag.gpgSign=false', ...args], {
    cwd, env: { ...safeEnvironment(), ...extra }, encoding: 'utf8', timeout: 120_000,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error('Git operation failed; retained state requires inspection.');
  return result.stdout.trim();
}

export function safeEnvironment() {
  /** @type {NodeJS.ProcessEnv} */
  const env = { PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: process.env.TMPDIR,
    LANG: 'C.UTF-8', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_TERMINAL_PROMPT: '0', GIT_ATTR_NOSYSTEM: '1', GIT_NO_REPLACE_OBJECTS: '1',
    ASTRO_TELEMETRY_DISABLED: '1', CI: '1' };
  return env;
}

/** Reject configuration injection before asking Git to inspect the clone.
 * @param {string} root */
export async function inspectGit(root) {
  await normal(join(root, '.git'), true);
  await fileAt(root, '.git/config');
  const config = await readFile(join(root, '.git/config'), 'utf8');
  let section = '';
  for (const raw of config.split('\n')) {
    const line = raw.trim();
    if (!line || /^[#;]/.test(line)) continue;
    const header = /^\[(core|user|remote "origin"|branch "[a-zA-Z0-9._/-]+")\]$/.exec(line);
    if (header) { section = header[1]; continue; }
    const field = /^([a-zA-Z]+)\s*=\s*(.*)$/.exec(line);
    const allowed = section === 'core' ? ['repositoryformatversion', 'filemode', 'bare', 'logallrefupdates', 'ignorecase', 'precomposeunicode']
      : section === 'user' ? ['name', 'email'] : section === 'remote "origin"' ? ['url', 'fetch']
        : section.startsWith('branch "') ? ['remote', 'merge'] : [];
    if (!field || !allowed.includes(field[1].toLowerCase()) || /[\\\x00-\x1f\x7f]/.test(field[2])) {
      throw new Error('Unsupported Git config; remove custom includes, hooks, filters or overrides manually.');
    }
    if (section === 'core' && !/^(true|false|0)$/.test(field[2])) throw new Error('Unsupported core Git config.');
  }
  for (const path of ['commondir', 'shallow', 'objects/info/alternates', 'objects/info/http-alternates',
    'config.worktree', 'refs/replace', 'info/grafts', 'modules', 'worktrees', 'index.lock']) {
    if (await exists(join(root, '.git', path))) throw new Error('A normal self-contained Git layout is required.');
  }
  const metadata = await treeFiles(join(root, '.git'));
  if (metadata.some((path) => path.startsWith('hooks/') && !path.endsWith('.sample'))) {
    throw new Error('Custom Git hooks are unsupported; they are never inherited or executed.');
  }
  git(root, ['fsck', '--full', '--no-reflogs']);
}

/** @param {string} root @param {string} [prefix] @returns {Promise<string[]>} */
export async function treeFiles(root, prefix = '') {
  await normal(root, true);
  /** @type {string[]} */
  const files = [];
  for (const name of await readdir(join(root, prefix))) {
    const relative = prefix ? `${prefix}/${name}` : name;
    const path = join(root, relative);
    const stat = await lstat(path);
    await normal(path, stat.isDirectory());
    if (stat.isDirectory()) files.push(...await treeFiles(root, relative));
    else files.push(relative);
  }
  return files.sort();
}

/** Copy only inspected files into an exclusively created private directory.
 * @param {string} from @param {string} to */
export async function copyTree(from, to) {
  const files = await treeFiles(from);
  await mkdir(to, { mode: 0o700 });
  /** @type {Record<string, string>} */
  const manifest = {};
  for (const file of files) {
    await mkdir(dirname(join(to, file)), { recursive: true, mode: 0o700 });
    const original = await readFile(await fileAt(from, file));
    await copyFile(join(from, file), join(to, file), constants.COPYFILE_EXCL);
    // Copy modes are fixed separately; neither executable hooks nor inherited permissions survive.
    const { chmod } = await import('node:fs/promises');
    await chmod(join(to, file), 0o600);
    manifest[file] = hash(original);
    if (hash(await readFile(join(to, file))) !== manifest[file]) throw new Error('Backup integrity failed.');
  }
  // Git needs empty object/ref directories even when the source has only loose objects.
  for (const dir of ['objects/info', 'objects/pack', 'refs/heads', 'refs/tags']) {
    await mkdir(join(to, dir), { recursive: true, mode: 0o700 });
  }
  return manifest;
}

/** @param {string} path */
export const excluded = (path) => path !== '.env.example' && (/(^|\/)(?:\.env[^/]*|node_modules|dist|\.vercel|\.astro|\.git|\.codegraph|coverage)(\/|$)/i.test(path)
  || /(^|\/)(?:\.npmrc|\.yarnrc(?:\.yml)?|\.netrc|\.pypirc|\.git-credentials|\.ssh|\.aws|auth\.json)(\/|$)/i.test(path)
  || /(^|\/)(?:id_rsa|id_ed25519|credentials[^/]*|secrets?[^/]*)(\/|$)|\.(?:pem|key|p12|pfx)$/i.test(path));
