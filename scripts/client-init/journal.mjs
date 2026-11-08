// @ts-check
import { mkdir, readFile, rename, lstat, realpath, open } from 'node:fs/promises';
import { join, dirname, basename, isAbsolute } from 'node:path';
import { randomUUID } from 'node:crypto';
import { hash, normal, exists, fileAt, git, treeFiles } from './safety.mjs';
import { validateName, validateSlug, validatePortfolio } from './input.mjs';

/** @typedef {{path: string, hash: string, mode: string}} Entry */
/** @typedef {{version: 1, operation: string, root: string, destination: string, backup: string,
 * dev: number, ino: number, source: string, name: string, slug: string, author: string, email: string,
 * portfolio?: {uid: string, url: string}, files: Entry[], gitFiles: Entry[], originals: Entry[],
 * phase: string, commit: string, remoteId: number, remoteNode: string, envCreated: boolean,
 * envIdentity?: import('./environment.mjs').EnvironmentIdentity}} State */

/** @param {unknown} input @returns {Record<string, unknown>} */
function record(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw new Error('Invalid journal object.');
  return /** @type {Record<string, unknown>} */ (input);
}
/** @param {Record<string, unknown>} data @param {string} key */
function text(data, key) {
  const value = data[key];
  if (typeof value !== 'string') throw new Error('Invalid journal field.');
  return value;
}
/** @param {Record<string, unknown>} data @param {string} key */
function number(data, key) {
  const value = data[key];
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('Invalid journal number.');
  return value;
}
/** @param {unknown} value @returns {Entry[]} */
function entries(value) {
  if (!Array.isArray(value) || value.length > 100000) throw new Error('Invalid journal manifest.');
  const result = value.map((item) => {
    const entry = record(item);
    const path = text(entry, 'path');
    if (!path || isAbsolute(path) || path.includes('\\') || /[\x00-\x1f\x7f]/.test(path) ||
      path.split('/').some((part) => !part || part === '..' || part === '.')) throw new Error('Unsafe journal path.');
    const digest = text(entry, 'hash');
    if (!/^[a-f0-9]{64}$/.test(digest)) throw new Error('Invalid journal digest.');
    const mode = text(entry, 'mode');
    if (!['100644', '100755'].includes(mode)) throw new Error('Invalid journal mode.');
    return { path, hash: digest, mode };
  });
  if (new Set(result.map((entry) => entry.path)).size !== result.length) throw new Error('Duplicate journal paths.');
  return result;
}

/** @param {string} author @param {string} email */
export function validateAuthor(author, email) {
  validateName(author);
  if (/[<>]/.test(author) || !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    throw new Error('Explicit safe Git author name and email are required.');
  }
}

/** Atomically replace a private journal; incomplete temp records are retained, never replayed.
 * @param {State} state */
export async function save(state) {
  const payload = JSON.stringify(state);
  const target = join(state.backup, `journal-${randomUUID()}.tmp`);
  const file = await open(target, 'wx', 0o600);
  try {
    await file.writeFile(JSON.stringify({ payload, digest: hash(payload) }) + '\n');
    await file.sync();
  } finally { await file.close(); }
  await rename(target, join(state.backup, 'journal.json'));
  const directory = await open(state.backup, 'r');
  try { await directory.sync(); } finally { await directory.close(); }
}

/** @param {string} path @returns {Promise<State>} */
export async function load(path) {
  if (!isAbsolute(path) || await realpath(path) !== path) throw new Error('Resume requires a canonical absolute backup path.');
  for (const target of [path, join(path, 'journal.json')]) {
    const s = await normal(target, target === path);
    if ((s.mode & 0o077) !== 0 || (process.getuid && s.uid !== process.getuid())) throw new Error('Journal must be private and owned by you.');
  }
  const envelope = record(JSON.parse(await readFile(join(path, 'journal.json'), 'utf8')));
  const payload = text(envelope, 'payload');
  if (hash(payload) !== text(envelope, 'digest')) throw new Error('Journal integrity mismatch; manual inspection required.');
  const data = record(JSON.parse(payload));
  if (data.version !== 1 || typeof data.envCreated !== 'boolean') throw new Error('Unsupported journal.');
  const slug = validateSlug(text(data, 'slug'));
  const root = text(data, 'root');
  const destination = text(data, 'destination');
  if (!isAbsolute(root) || dirname(root) !== dirname(path) || basename(path) !== `.${slug}-client-init-backup` ||
    destination !== join(dirname(path), slug) || text(data, 'backup') !== path || root === path) {
    throw new Error('Foreign journal or root mismatch.');
  }
  const phase = text(data, 'phase');
  if (!['backup', 'editing', 'edited', 'validated', 'history', 'local', 'creating', 'remote', 'pushing', 'pushed', 'renaming', 'complete'].includes(phase)) {
    throw new Error('Invalid journal phase.');
  }
  const source = text(data, 'source');
  const commit = text(data, 'commit');
  const operation = text(data, 'operation');
  if (!/^[a-f0-9]{40}$/.test(source) || (commit && !/^[a-f0-9]{40}$/.test(commit)) ||
    !/^[a-f0-9-]{36}$/.test(operation)) throw new Error('Invalid recorded identity.');
  const author = text(data, 'author');
  const email = text(data, 'email');
  validateAuthor(author, email);
  let portfolio;
  if (data.portfolio !== undefined) {
    const p = record(data.portfolio);
    portfolio = validatePortfolio(text(p, 'uid'), text(p, 'url'));
  }
  let envIdentity;
  if (data.envIdentity !== undefined) {
    const identity = record(data.envIdentity);
    envIdentity = { dev: number(identity, 'dev'), ino: number(identity, 'ino'), uid: number(identity, 'uid') };
  }
  return { version: 1, operation, root, destination, backup: path, source, commit, phase,
    slug, name: validateName(text(data, 'name')), author, email, portfolio,
    dev: number(data, 'dev'), ino: number(data, 'ino'), remoteId: number(data, 'remoteId'),
    remoteNode: text(data, 'remoteNode'), envCreated: data.envCreated, envIdentity,
    files: entries(data.files), originals: entries(data.originals), gitFiles: entries(data.gitFiles) };
}

/** @param {State} state */
export async function verifyBackup(state) {
  for (const [base, entries] of [[join(state.backup, 'original.git'), state.gitFiles],
    [join(state.backup, 'originals'), state.originals]]) {
    // Tuple typing is explicit so paths and entries cannot be interchanged.
    if (typeof base !== 'string' || !Array.isArray(entries)) throw new Error('Invalid backup manifest.');
    if (JSON.stringify(await treeFiles(base)) !== JSON.stringify(entries.map((entry) => entry.path).sort())) {
      throw new Error('Backup file inventory mismatch; manual recovery required.');
    }
    for (const entry of entries) {
      const path = await fileAt(base, entry.path);
      if (((await lstat(path)).mode & 0o077) !== 0 || hash(await readFile(path)) !== entry.hash) {
        throw new Error('Backup integrity mismatch; manual recovery required.');
      }
    }
  }
  const args = ['--git-dir', join(state.backup, 'original.git')];
  if (git(state.backup, [...args, 'rev-parse', 'HEAD']) !== state.source) throw new Error('Backup source mismatch.');
  git(state.backup, [...args, 'fsck', '--full', '--no-reflogs']);
}

/** Reconcile rename crashes by inode, never just a journal phase or path.
 * @param {State} state */
export async function reconcileRoot(state) {
  if (!await exists(state.root) && ['renaming', 'complete'].includes(state.phase) && await exists(state.destination)) {
    const s = await lstat(state.destination);
    if (s.dev !== state.dev || s.ino !== state.ino) throw new Error('Destination identity mismatch.');
    state.root = state.destination;
  }
  const s = await normal(state.root, true);
  if (s.dev !== state.dev || s.ino !== state.ino || await realpath(state.root) !== state.root) throw new Error('Foreign journal: root identity mismatch.');
  if (await realpath(process.cwd()) !== state.root) throw new Error(`Resume from the recorded clone root: ${state.root}`);
}

/** @param {string} root @param {Entry[]} entries */
export async function verifyFiles(root, entries) {
  for (const entry of entries) {
    if (hash(await readFile(await fileAt(root, entry.path))) !== entry.hash) throw new Error('Source identity/hash mismatch; preserve changes and inspect manually.');
  }
}

/** @param {string} backup */
export async function createBackupDirectory(backup) {
  await mkdir(backup, { mode: 0o700 });
  await mkdir(join(backup, 'originals'), { mode: 0o700 });
  await mkdir(join(backup, 'empty-template'), { mode: 0o700 });
}
