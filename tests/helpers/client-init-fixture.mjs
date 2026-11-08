// @ts-check
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../../scripts/init-client.mjs', import.meta.url));

/** Create only disposable repositories; never mutate the checkout's Git state. */
export async function clientFixture() {
  const scratch = await realpath(await mkdtemp(join(tmpdir(), 'client-init-')));
  const root = join(scratch, 'starter');
  await mkdir(root);
  /** @type {NodeJS.ProcessEnv} */
  const env = { ...process.env, HOME: scratch, GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: join(scratch, 'no-global-config') };
  for (const key of Object.keys(env)) {
    if (key.startsWith('GIT_') && !['GIT_CONFIG_NOSYSTEM', 'GIT_CONFIG_GLOBAL'].includes(key)) {
      delete env[key];
    }
  }
  /** @param {string[]} args */
  const git = (...args) => {
    const result = spawnSync('git', args, { cwd: root, env, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  git('init', '--initial-branch=main');
  git('config', 'user.name', 'Fixture');
  git('config', 'user.email', 'fixture@example.test');
  git('remote', 'add', 'origin', 'https://github.com/mocklabapp/base-landing-mocklab.git');
  await mkdir(join(root, 'src/config'), { recursive: true });
  await mkdir(join(root, 'docs'));
  await writeFile(join(root, 'package.json'), '{"name":"base-landing-mocklab"}\n');
  await writeFile(join(root, 'src/config/site.ts'), "export const site = { name: 'base-landing-mocklab' };\n");
  await writeFile(join(root, 'docs/project-brief.md'), '# Project brief\n');
  await writeFile(join(root, '.gitignore'), '.env\n');
  git('add', '.');
  git('commit', '-m', 'fixture');
  /** @param {string[]} [args] @param {string} [input] */
  const run = (args = [], input = '') => runAt(root, args, input);
  /** @param {string} cwd @param {string[]} [args] @param {string} [input] */
  const runAt = (cwd, args = [], input = '') => spawnSync(process.execPath, [cli, ...args], {
    cwd, env, input, encoding: 'utf8', timeout: 30_000,
  });
  const snapshot = async () => ({
    head: git('rev-parse', 'HEAD'), status: git('status', '--porcelain', '--untracked-files=all'),
    config: await readFile(join(root, '.git/config'), 'utf8'),
    identity: await Promise.all(['package.json', 'src/config/site.ts', 'docs/project-brief.md']
      .map((path) => readFile(join(root, path), 'utf8'))),
  });
  return { root, scratch, git, run, runAt, snapshot, env };
}

export const planArgs = ['--name', 'Clínica Norte', '--slug', 'clinica-norte'];
