// @ts-check
import { spawnSync } from 'node:child_process';
import { object } from './identity.mjs';
import { safeEnvironment, git } from './safety.mjs';
import { save } from './journal.mjs';

/** @param {string[]} args */
function gh(args) {
  return spawnSync('gh', args, { env: safeEnvironment(), encoding: 'utf8', timeout: 120_000,
    maxBuffer: 1024 * 1024 });
}

/** A 404 is only a provisional missing result when the caller permits it.
 * In particular, members may not see private collisions; creation is authoritative.
 * @param {string} route @param {boolean} [allowMissing] @param {string[]} [args] */
function lookup(route, allowMissing = false, args = []) {
  const result = gh(['api', '--hostname', 'github.com', route, ...args]);
  if (result.status === 0) {
    try { return object(JSON.parse(result.stdout)); } catch { throw new Error('GitHub returned an invalid identity response.'); }
  }
  if (allowMissing && /\(HTTP 404\)/.test(result.stderr)) return undefined;
  throw new Error('GitHub lookup denied or unavailable (network/authentication); absence is not established.');
}

/** Require active membership, viewer creation capability and private creation policy.
 * Admins can create private repositories; ordinary members also require the
 * organization's explicit private-repository policy. General creation is insufficient.
 * @param {string} slug */
export function githubPreflight(slug) {
  if (gh(['auth', 'status', '--hostname', 'github.com']).status !== 0) {
    throw new Error('GitHub authentication unavailable or denied; no changes made.');
  }
  const membership = lookup('user/memberships/orgs/mocklabapp');
  if (membership?.state !== 'active' || (membership.role !== 'admin' && membership.role !== 'member')) {
    throw new Error('Verified active mocklabapp organization membership is required; no changes made.');
  }
  const capability = lookup('graphql', false, ['-f',
    'query=query { organization(login: "mocklabapp") { viewerCanCreateRepositories } }']);
  let canCreate = false;
  try {
    canCreate = capability?.errors === undefined &&
      object(object(capability?.data).organization).viewerCanCreateRepositories === true;
  } catch { /* Unknown response shape is not permission. */ }
  if (!canCreate) throw new Error('GitHub repository creation capability is unverified; no changes made.');
  if (membership.role === 'member' && lookup('orgs/mocklabapp')?.members_can_create_private_repositories !== true) {
    throw new Error('GitHub private repository creation policy is denied or unknown; no changes made.');
  }
  if (lookup(`repos/mocklabapp/${slug}`, true)) {
    throw new Error('GitHub repository collision: never adopt or overwrite an existing repository.');
  }
}

/** @param {string} slug */
function repository(slug) {
  const data = lookup(`repos/mocklabapp/${slug}`);
  if (!data || data.full_name !== `mocklabapp/${slug}` || data.private !== true ||
    typeof data.id !== 'number' || !Number.isSafeInteger(data.id) || data.id <= 0 ||
    typeof data.node_id !== 'string' || !/^[A-Za-z0-9_=-]+$/.test(data.node_id)) {
    throw new Error('Exact private organization repository identity could not be verified; manual inspection required.');
  }
  return { id: data.id, node: data.node_id };
}

/** @param {import('./journal.mjs').State} state */
export function verifyRemote(state) {
  const identity = repository(state.slug);
  if (!state.remoteId || identity.id !== state.remoteId || identity.node !== state.remoteNode) {
    throw new Error('Recorded operation-created repository identity mismatch; never adopt a replacement.');
  }
}

/** @param {import('./journal.mjs').State} state */
export function verifyPublication(state) {
  verifyRemote(state);
  const ref = lookup(`repos/mocklabapp/${state.slug}/git/ref/heads/main`, true);
  if (!ref || object(ref.object).sha !== state.commit) {
    throw new Error('Published remote commit mismatch; manual inspection required.');
  }
}

/** @param {import('./journal.mjs').State} state */
export async function createRemote(state) {
  githubPreflight(state.slug);
  state.phase = 'creating';
  await save(state);
  const result = gh(['repo', 'create', `mocklabapp/${state.slug}`, '--private']);
  if (result.status !== 0) throw new Error('Remote creation ambiguous; manual GitHub inspection required. Never replay creation or adopt a repository.');
  // A crash before the identity is durably recorded intentionally remains ambiguous.
  const identity = repository(state.slug);
  state.remoteId = identity.id;
  state.remoteNode = identity.node;
  state.phase = 'remote';
  await save(state);
}

/** @param {import('./journal.mjs').State} state */
export async function publish(state) {
  verifyRemote(state);
  const remote = `https://github.com/mocklabapp/${state.slug}.git`;
  const remotes = git(state.root, ['remote']);
  if (!remotes) git(state.root, ['remote', 'add', 'origin', remote]);
  else if (remotes !== 'origin' || git(state.root, ['config', '--get', 'remote.origin.url']) !== remote) {
    throw new Error('Unexpected local remote; manual inspection required.');
  }
  const current = lookup(`repos/mocklabapp/${state.slug}/git/ref/heads/main`, true);
  if (current) {
    if (object(current.object).sha !== state.commit) throw new Error('Remote branch mismatch; never overwrite remote history.');
    state.phase = 'pushed';
    await save(state);
    return;
  }
  if (state.phase === 'pushing') throw new Error('Previous push ambiguous; manual inspection required before any repeat.');
  state.phase = 'pushing';
  await save(state);
  // The helper delegates authentication to gh without reading or storing credentials here.
  // No inherited helper, SSH command, hook, force option or user-supplied push target.
  git(state.root, ['-c', 'credential.helper=', '-c', 'credential.helper=!gh auth git-credential',
    'push', '--', remote, 'HEAD:refs/heads/main']);
  const pushed = lookup(`repos/mocklabapp/${state.slug}/git/ref/heads/main`, true);
  if (!pushed || object(pushed.object).sha !== state.commit) throw new Error('Push result ambiguous; manual remote inspection required.');
  state.phase = 'pushed';
  await save(state);
}
