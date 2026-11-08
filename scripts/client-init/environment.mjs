// @ts-check
import { constants, open, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileAt, normal } from './safety.mjs';

export const template = '.env.example';
/** @typedef {{dev: number, ino: number, uid: number}} EnvironmentIdentity */

/** Only the two blank assignments, whitespace and comments may be distributed.
 * Do not echo parser input or errors: a malformed template may contain secrets.
 * @param {string} root */
export async function verifyBlankTemplate(root) {
  const path = await fileAt(root, template).catch(() => {
    throw new Error('Required blank environment template is missing or unsafe.');
  });
  const source = await readFile(path, 'utf8');
  const keys = new Set();
  for (const line of source.split(/\r?\n/)) {
    if (/^\s*(?:#.*)?$/.test(line)) continue;
    const match = /^\s*(?:export\s+)?(MOCKLAB_PROJECTS_URL|MOCKLAB_USER_ID)\s*=\s*(?:""|'')?\s*(?:#.*)?$/.exec(line);
    if (!match || keys.has(match[1])) throw new Error('Environment template must contain only the two approved blank keys and comments.');
    keys.add(match[1]);
  }
  if (keys.size !== 2) throw new Error('Environment template requires both approved blank keys.');
}

/** @param {{uid: string, url: string}} portfolio */
export const publicEnvironment = (portfolio) =>
  `MOCKLAB_PROJECTS_URL=${portfolio.url}\nMOCKLAB_USER_ID=${portfolio.uid}\n`;

/** Refuse unknown material using names/metadata only, before validation can load it.
 * A journal boolean is not ownership proof; require the originally created inode,
 * device, user and private mode before opening the operation's public file.
 * @param {string} root @param {import('./journal.mjs').State} [state] */
export async function verifyEnvironment(root, state) {
  const names = (await readdir(root)).filter((name) => /^\.env/i.test(name) && name !== template);
  if (names.some((name) => name !== '.env') || (names.length &&
    (!state?.portfolio || !state.envCreated || !state.envIdentity))) {
    throw new Error('Unknown environment material is not read or overwritten; inspect it manually.');
  }
  if (state?.envCreated) {
    if (!state.portfolio || !state.envIdentity || !names.includes('.env')) {
      throw new Error('Operation environment ownership is unverified; manual inspection required.');
    }
    const identity = state.envIdentity;
    /** @param {import('node:fs').Stats} stat */
    const owned = (stat) => stat.isFile() && stat.nlink === 1 && stat.dev === identity.dev &&
      stat.ino === identity.ino && stat.uid === identity.uid &&
      (!process.getuid || stat.uid === process.getuid()) && (stat.mode & 0o777) === 0o600;
    const path = join(root, '.env');
    const stat = await normal(path).catch(() => {
      throw new Error('Operation environment path is unsafe; manual inspection required.');
    });
    if (!owned(stat)) throw new Error('Operation environment ownership or mode changed; manual inspection required.');
    const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      if (!owned(await file.stat())) throw new Error('Operation environment identity changed; manual inspection required.');
      if (await file.readFile('utf8') !== publicEnvironment(state.portfolio)) {
        throw new Error('Operation environment content changed; retained without overwriting.');
      }
    } finally { await file.close(); }
  }
  await verifyBlankTemplate(root);
}

/** Exclusively create the public file and retain filesystem identity, never adopt.
 * @param {import('./journal.mjs').State} state */
export async function createEnvironment(state) {
  if (!state.portfolio || state.envCreated) return;
  const file = await open(join(state.root, '.env'), 'wx', 0o600);
  try {
    await file.writeFile(publicEnvironment(state.portfolio));
    await file.sync();
    const { dev, ino, uid } = await file.stat();
    state.envIdentity = { dev, ino, uid };
    state.envCreated = true;
  } finally { await file.close(); }
}
