// @ts-check
import { rename, writeFile, readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { exists, git, hash, fileAt, inspectGit } from './safety.mjs';
import { save, verifyBackup, verifyFiles } from './journal.mjs';
import { verifyModes } from './identity.mjs';

/** @param {import('./journal.mjs').State} state */
const message = (state) => `Initialize ${state.slug}\n\nStarter: ${state.source}\nOperation: ${state.operation}`;

/** Verify actual history, allowlisted tree and working bytes rather than trusting a phase.
 * @param {import('./journal.mjs').State} state */
export async function verifyHistory(state) {
  await inspectGit(state.root);
  await verifyFiles(state.root, state.files);
  await verifyModes(state);
  const remotes = git(state.root, ['remote']);
  if (remotes && (!state.remoteId || remotes !== 'origin' ||
    git(state.root, ['config', '--get', 'remote.origin.url']) !== `https://github.com/mocklabapp/${state.slug}.git`)) {
    throw new Error('Unexpected remote identity in prepared history; manual inspection required.');
  }
  const commit = git(state.root, ['rev-parse', '--verify', 'HEAD']);
  if ((state.commit && commit !== state.commit) || commit === state.source ||
    git(state.root, ['rev-list', '--count', 'HEAD']) !== '1' ||
    git(state.root, ['branch', '--show-current']) !== 'main' ||
    git(state.root, ['log', '-1', '--format=%B']) !== message(state) ||
    git(state.root, ['log', '-1', '--format=%an%n%ae']) !== `${state.author}\n${state.email}`) {
    throw new Error('Independent history identity mismatch; manual recovery required.');
  }
  const tree = git(state.root, ['ls-tree', '-rz', 'HEAD']).split('\0').filter(Boolean);
  if (tree.length !== state.files.length) throw new Error('Unexpected files in independent history.');
  for (const row of tree) {
    const match = /^(100644|100755) blob ([a-f0-9]{40})\t(.+)$/.exec(row);
    const entry = match && state.files.find((entry) => entry.path === match[3]);
    if (!match || !entry || entry.mode !== match[1] ||
      git(state.root, ['hash-object', '--no-filters', '--', entry.path]) !== match[2] ||
      hash(await readFile(await fileAt(state.root, entry.path))) !== entry.hash) {
      throw new Error('Independent history tree mismatch.');
    }
  }
  if (git(state.root, ['diff', '--cached', '--name-only'])) throw new Error('Unexpected staged changes.');
  return commit;
}

/** @param {import('./journal.mjs').State} state */
export async function replaceHistory(state) {
  await verifyBackup(state);
  await verifyFiles(state.root, state.files);
  await verifyModes(state);
  await inspectGit(state.root);
  await verifyFiles(join(state.root, '.git'), state.gitFiles);
  if (git(state.root, ['rev-parse', 'HEAD']) !== state.source) throw new Error('Source history changed.');
  if (await exists(join(state.backup, 'retired.git'))) throw new Error('Retired history already exists; manual inspection required.');
  state.phase = 'history';
  await save(state);
  // Preserve the actual original directory too. Nothing is deleted, including on failure.
  await rename(join(state.root, '.git'), join(state.backup, 'retired.git'));
  git(state.root, ['init', '--initial-branch=main', `--template=${join(state.backup, 'empty-template')}`]);
  git(state.root, ['config', '--local', 'user.name', state.author]);
  git(state.root, ['config', '--local', 'user.email', state.email]);
  // Only the verified, unchanged canonical blank template is distributable.
  await mkdir(join(state.root, '.git/info'), { mode: 0o700 });
  await writeFile(join(state.root, '.git/info/exclude'), '.env*\n!.env.example\n', { flag: 'wx', mode: 0o600 });
  git(state.root, ['add', '--', ...state.files.map((entry) => entry.path)]);
  git(state.root, ['commit', '--no-verify', '-m', message(state)]);
  state.commit = await verifyHistory(state);
  state.phase = 'local';
  await save(state);
}

/** Resume can recognize a completely recorded commit, but never guess at a partial index.
 * @param {import('./journal.mjs').State} state */
export async function reconcileHistory(state) {
  if (state.phase !== 'history') return;
  if (!await exists(join(state.root, '.git')) || !await exists(join(state.backup, 'retired.git'))) {
    throw new Error('History transition interrupted; original and backup retained. Manual recovery required; do not delete either.');
  }
  try {
    state.commit = await verifyHistory(state);
  } catch {
    throw new Error('History transition incomplete; manual inspection of retained history and new index required. No automatic rollback.');
  }
  state.phase = 'local';
  await save(state);
}
