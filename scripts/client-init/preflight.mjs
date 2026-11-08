// @ts-check
import { lstat, realpath } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

/** @param {string} path */
async function exists(path) {
  try { await lstat(path); return true; } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false;
    throw new Error('Cannot inspect a required path.');
  }
}

/** @param {string} root @param {string} relative @param {boolean} directory */
async function regularPath(root, relative, directory) {
  let current = root;
  const parts = relative.split('/');
  for (const [index, part] of parts.entries()) {
    current = join(current, part);
    const stat = await lstat(current).catch(() => { throw new Error('Required clone path is missing.'); });
    const isDirectory = index < parts.length - 1 || directory;
    if (stat.isSymbolicLink() || (isDirectory ? !stat.isDirectory() : !stat.isFile())) {
      throw new Error('Clone paths must be normal files/directories, not links.');
    }
  }
}

/** Read-only Git commands with no hooks, prompts, fsmonitor or inherited Git overrides. */
function gitEnvironment() {
  /** @type {NodeJS.ProcessEnv} */
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key.startsWith('GIT_')) delete env[key];
  }
  return { ...env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_TERMINAL_PROMPT: '0' };
}

/** @param {string} cwd @param {string} slug @param {boolean} portfolio */
export async function preflight(cwd, slug, portfolio) {
  const root = await realpath(cwd);
  await regularPath(root, '.git', true);
  await regularPath(root, '.git/objects', true);
  for (const path of ['.git/commondir', '.git/objects/info/alternates', '.git/shallow']) {
    if (await exists(join(root, path))) throw new Error('A complete self-contained clone is required.');
  }
  /** @param {string[]} args */
  const git = (...args) => {
    const result = spawnSync('git', ['--no-optional-locks', '-c', 'core.fsmonitor=false', ...args], {
      cwd: root, env: gitEnvironment(), encoding: 'utf8', timeout: 10_000,
    });
    if (result.status !== 0) throw new Error('Git preflight failed; inspect the clone locally.');
    return result.stdout.trim();
  };
  if (git('rev-parse', '--show-toplevel') !== root ||
    resolve(root, git('rev-parse', '--git-common-dir')) !== join(root, '.git') ||
    git('rev-parse', '--is-bare-repository') !== 'false') {
    throw new Error('Run from the root of a normal, self-contained clone.');
  }
  const origins = git('config', '--local', '--get-all', 'remote.origin.url');
  if (!/^(https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)mocklabapp\/base-landing-mocklab(?:\.git)?$/.test(origins)) {
    throw new Error('Expected the exact mocklabapp/base-landing-mocklab origin without credentials.');
  }
  const source = git('rev-parse', '--verify', 'HEAD');
  for (const target of ['package.json', 'src/config/site.ts', 'docs/project-brief.md']) {
    await regularPath(root, target, false);
    git('ls-files', '--error-unmatch', '--', target);
  }
  if (git('status', '--porcelain=v1', '--untracked-files=all', '--ignore-submodules=none')) {
    throw new Error('A clean clone is required; preserve and commit your work before planning.');
  }
  const destination = join(dirname(root), slug);
  const backup = join(dirname(root), `.${slug}-client-init-backup`);
  if (destination !== root && await exists(destination)) throw new Error('Directory destination already exists.');
  if (await exists(backup)) throw new Error('Backup destination already exists; inspect it, never overwrite it.');
  if (portfolio && await exists(join(root, '.env'))) throw new Error('Local .env already exists; it will not be read or overwritten.');
  return { root, source, destination, backup };
}
