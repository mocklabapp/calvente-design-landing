// @ts-check
import { lstat, rename, realpath } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { preflight } from './preflight.mjs';
import { copyTree, exists, inspectGit, privateParent, git } from './safety.mjs';
import { createBackupDirectory, save, load, validateAuthor, verifyBackup, verifyFiles, reconcileRoot } from './journal.mjs';
import { sourceFiles, retainOriginals, editIdentity } from './identity.mjs';
import { validationTool, validateLocal } from './validation.mjs';
import { githubPreflight, createRemote, verifyRemote, verifyPublication, publish } from './github.mjs';
import { replaceHistory, reconcileHistory, verifyHistory } from './history.mjs';
import { verifyEnvironment } from './environment.mjs';

/** @typedef {(prompt: string) => Promise<string>} Ask */
/** @param {Ask} ask @param {string} phrase */
async function confirm(ask, phrase) {
  if (await ask(`Type ${phrase}: `) !== phrase) throw new Error('Not confirmed; no further changes made.');
}

/** @param {import('./journal.mjs').State} state */
function guidance(state) {
  console.log(`Retained backup: ${state.backup}\nSource version: ${state.source}\nRecorded stage: ${state.phase}`);
  console.log(`Resume from ${state.root}: node scripts/init-client.mjs --resume ${JSON.stringify(state.backup)}`);
  console.log('Never delete the backup or run automatic rollback. Inspect uncertain stages manually.');
}

/** @param {{name: string, slug: string, portfolio?: {uid: string, url: string}}} input
 * @param {Map<string, string>} args @param {Ask} ask */
export async function apply(input, args, ask) {
  const root = await realpath(process.cwd());
  await privateParent(root);
  await inspectGit(root);
  const author = args.get('--author-name') ?? '';
  const email = args.get('--author-email') ?? '';
  validateAuthor(author, email);
  const plan = await preflight(root, input.slug, !!input.portfolio);
  await verifyEnvironment(root);
  if (input.portfolio && git(root, ['check-ignore', '--', '.env']) !== '.env') throw new Error('Portfolio environment must already be ignored.');
  await validationTool(root);
  const files = await sourceFiles(root);
  githubPreflight(input.slug);
  console.log(`APPLY PLAN\nExisting clone: ${root}\nSource commit: ${plan.source}\nDisplay name: ${input.name}\nPrivate repository: mocklabapp/${input.slug}`);
  console.log(`Retained backup absolute location: ${plan.backup}\nFinal directory (last): ${plan.destination}`);
  console.log('Identity edits, optional ignored environment, local validation, independent history; separate publication approval.');
  await confirm(ask, `APPLY ${input.slug}`);
  await confirm(ask, `BACKUP ${plan.backup}`);
  // Recheck source/destinations after interactive waiting, before the first write.
  await inspectGit(root);
  await preflight(root, input.slug, !!input.portfolio);
  await verifyEnvironment(root);
  await verifyFiles(root, files);
  const identity = await lstat(root);
  /** @type {import('./journal.mjs').State} */
  const state = { version: 1, operation: randomUUID(), ...plan, name: input.name, slug: input.slug,
    portfolio: input.portfolio, author, email, dev: identity.dev, ino: identity.ino,
    files, gitFiles: [], originals: [], phase: 'backup', commit: '', remoteId: 0, remoteNode: '', envCreated: false };
  try {
    await createBackupDirectory(state.backup);
    const manifest = await copyTree(join(root, '.git'), join(state.backup, 'original.git'));
    state.gitFiles = Object.entries(manifest).map(([path, hash]) => ({ path, hash, mode: '100644' }));
    await retainOriginals(state);
    await verifyBackup(state);
    await save(state);
    console.log('BACKUP VERIFIED — retained original Git metadata and exact identity bytes.');
    await advance(state, ask);
  } catch (error) {
    guidance(state);
    throw error;
  }
}

/** @param {string} backup @param {Ask} ask */
export async function resume(backup, ask) {
  const state = await load(backup);
  await reconcileRoot(state);
  await privateParent(state.root);
  await verifyBackup(state);
  guidance(state);
  await confirm(ask, `RESUME ${state.slug}`);
  try {
    await verifyEnvironment(state.root, state);
    if (state.phase === 'creating') throw new Error('Remote creation ambiguous; manual inspection required. No automatic replay or adoption.');
    await reconcileHistory(state);
    if (['local', 'remote', 'pushing', 'pushed', 'renaming', 'complete'].includes(state.phase)) await verifyHistory(state);
    await advance(state, ask);
  } catch (error) {
    guidance(state);
    throw error;
  }
}

/** @param {import('./journal.mjs').State} state @param {Ask} ask */
async function advance(state, ask) {
  await verifyEnvironment(state.root, state);
  if (['backup', 'editing', 'edited', 'validated'].includes(state.phase)) {
    await inspectGit(state.root);
    if (git(state.root, ['rev-parse', 'HEAD']) !== state.source) throw new Error('Original history changed; manual inspection required.');
    await editIdentity(state);
    await verifyFiles(state.root, state.files);
    console.log('Validating with installed Astro check/build and the existing Node test suite; no dependency installation.');
    await verifyEnvironment(state.root, state);
    await validateLocal(state);
    await verifyFiles(state.root, state.files);
    state.phase = 'validated';
    await save(state);
    await confirm(ask, `HISTORY ${state.slug}`);
    await verifyEnvironment(state.root, state);
    await replaceHistory(state);
  }
  if (state.phase === 'local') {
    console.log('Publication creates a PRIVATE organization repository and pushes code. Push may trigger deployment integrations. Vercel is manual.');
    const answer = await ask(`Type PUBLISH mocklabapp/${state.slug} or decline to retain prepared local state: `);
    if (answer !== `PUBLISH mocklabapp/${state.slug}`) {
      console.log('LOCAL PREPARED — publication pending; final directory rename pending.');
      guidance(state);
      nextSteps(state);
      return;
    }
    await verifyHistory(state);
    await createRemote(state);
  } else if (['remote', 'pushing', 'pushed', 'renaming'].includes(state.phase)) {
    verifyRemote(state);
    console.log('Resume publication can push code and trigger deployment integrations.');
    await confirm(ask, `REMOTE mocklabapp/${state.slug} ${state.remoteId}`);
  }
  if (['remote', 'pushing'].includes(state.phase)) await publish(state);
  if (['pushed', 'renaming'].includes(state.phase)) {
    await verifyHistory(state);
    verifyPublication(state);
    if (state.root !== state.destination) {
      if (await exists(state.destination)) throw new Error('Final rename destination exists; source retained. Resolve collision manually, then resume.');
      state.phase = 'renaming';
      await save(state);
      try { await rename(state.root, state.destination); } catch {
        throw new Error('Final directory rename failed; source and backup retained. Inspect permissions/collision and resume.');
      }
      state.root = state.destination;
    }
    state.phase = 'complete';
    await save(state);
  }
  if (state.phase !== 'complete') throw new Error('Initialization incomplete; inspect recorded and actual state manually.');
  await verifyHistory(state);
  verifyPublication(state);
  console.log(`INITIALIZATION COMPLETE — ${state.root}\nPrivate repository: mocklabapp/${state.slug}\nRetained backup: ${state.backup}`);
  nextSteps(state);
}

/** @param {import('./journal.mjs').State} state */
function nextSteps(state) {
  console.log('Continue docs/project-kickoff.md; identity setup is not content, design or launch approval.');
  console.log('Import the private repository manually in Vercel; no Vercel API or deployment was invoked.');
  if (state.portfolio) console.log('Configure MOCKLAB_PROJECTS_URL and MOCKLAB_USER_ID manually in Vercel. Never supply service keys.');
}
