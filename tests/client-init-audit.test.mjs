// @ts-check
import assert from 'node:assert/strict';
import { chmod, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import test from 'node:test';
import { applyFixture } from './helpers/client-init-apply.mjs';
import { environmentExampleIssue, ignoredEnvironmentFiles } from './helpers/toolchain-fixture.mjs';

const portfolio = ['--uid', '123e4567-e89b-42d3-a456-426614174000',
  '--projects-url', 'https://service.example.test/public'];
const publish = 'PUBLISH mocklabapp/clinica-norte\n';
const resume = 'RESUME clinica-norte\nHISTORY clinica-norte\nno\n';

test('B1 fresh local clone retains the unchanged blank template and setup contract', async () => {
  const f = await applyFixture();
  const original = await readFile(join(f.root, '.env.example'));
  const result = f.run([...f.args, ...portfolio], f.confirmation + 'no\n');
  assert.equal(result.status, 0, result.stderr);
  const clone = join(f.scratch, 'fresh-clone');
  const cloned = spawnSync('git', ['clone', '--no-hardlinks', '--', f.root, clone], {
    env: { ...f.env, PATH: process.env.PATH }, encoding: 'utf8',
  });
  assert.equal(cloned.status, 0, cloned.stderr);
  assert.deepEqual(await readFile(join(clone, '.env.example')), original);
  assert.equal(environmentExampleIssue(original.toString('utf8')), null);
  const ignored = await ignoredEnvironmentFiles(await readFile(join(clone, '.gitignore'), 'utf8'));
  assert.equal(ignored.status, 0, ignored.stderr);
  assert.deepEqual(ignored.stdout.trim().split('\n'), ['.env', '.env.local', '.env.production']);
  assert.equal((await readdir(clone)).includes('.env'), false);
});

test('B1 nonblank, unknown, missing and duplicate template keys refuse before any changes', async () => {
  const canonical = 'MOCKLAB_PROJECTS_URL=\nMOCKLAB_USER_ID=\n';
  for (const content of [canonical.replace('URL=', 'URL=FAKE_DO_NOT_ECHO'),
    canonical + 'UNKNOWN_FAKE=\n', 'MOCKLAB_USER_ID=\n', canonical + 'MOCKLAB_USER_ID=\n']) {
    const f = await applyFixture();
    await writeFile(join(f.root, '.env.example'), content);
    f.git('add', '.env.example');
    f.git('commit', '-m', 'invalid fixture template');
    const before = await f.snapshot();
    const result = f.run(f.args, f.confirmation + 'no\n');
    assert.equal(result.status, 1);
    assert.match(result.stderr, /blank.*template|template.*blank/i);
    assert.doesNotMatch(result.stdout + result.stderr, /FAKE_DO_NOT_ECHO|UNKNOWN_FAKE/);
    assert.deepEqual(await f.snapshot(), before);
    assert.equal(await f.validationCalls(), '');
    assert.equal(await f.calls(), '');
    assert.equal((await readdir(f.scratch)).includes('.clinica-norte-client-init-backup'), false);
  }
});

test('B2 resume refuses newly introduced or altered environment before downstream validation', async () => {
  for (const kind of ['skipped-human', 'portfolio-extra', 'content', 'replacement', 'mode']) {
    const f = await applyFixture();
    const withPortfolio = kind !== 'skipped-human';
    const stopped = f.run([...f.args, ...(withPortfolio ? portfolio : [])],
      `APPLY clinica-norte\nBACKUP ${f.backup}\n`);
    assert.equal(stopped.status, 1);
    assert.match(stopped.stderr, /Input ended/);
    const file = join(f.root, kind === 'portfolio-extra' ? '.env.production' : '.env');
    if (kind === 'replacement') await rename(file, join(f.scratch, 'retained-public-file'));
    if (kind === 'mode') await chmod(file, 0o644);
    else if (kind === 'replacement') {
      await writeFile(file, 'MOCKLAB_PROJECTS_URL=https://service.example.test/public\nMOCKLAB_USER_ID=123e4567-e89b-42d3-a456-426614174000\n', { mode: 0o600 });
    } else await writeFile(file, 'FAKE_HUMAN_VALUE=DO_NOT_ECHO\n', { mode: 0o600 });
    const bytes = await readFile(file);
    const identity = await stat(file);
    const validations = await f.validationCalls();
    const calls = await f.calls();
    const before = await f.snapshot();
    const result = f.run(['--resume', f.backup], resume);
    assert.equal(result.status, 1, kind);
    assert.match(result.stderr, /environment/i);
    assert.doesNotMatch(result.stdout + result.stderr, /DO_NOT_ECHO/);
    assert.equal(await f.validationCalls(), validations, kind);
    assert.equal(await f.calls(), calls, kind);
    assert.deepEqual(await readFile(file), bytes);
    assert.equal((await stat(file)).ino, identity.ino);
    assert.deepEqual(await f.snapshot(), before);
  }
});

test('B2 verified operation-owned public environment resumes validation safely', async () => {
  const f = await applyFixture();
  const stopped = f.run([...f.args, ...portfolio], `APPLY clinica-norte\nBACKUP ${f.backup}\n`);
  assert.equal(stopped.status, 1);
  const bytes = await readFile(join(f.root, '.env'));
  const result = f.run(['--resume', f.backup], resume);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await f.validationCalls(), 'check\nbuild\ncheck\nbuild\n');
  assert.deepEqual(await readFile(join(f.root, '.env')), bytes);
});

test('B3 admin and verified private-capable ordinary member publish only private repositories', async () => {
  for (const mode of ['member-allowed', 'absent']) {
    const f = await applyFixture();
    await writeFile(f.mode, mode);
    const result = f.run(f.args, f.confirmation + publish);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /INITIALIZATION COMPLETE/);
    if (mode === 'member-allowed') assert.match(await f.calls(), /orgs\/mocklabapp/);
    assert.match(await f.calls(), /repo create mocklabapp\/clinica-norte --private/);
    assert.doesNotMatch(await f.calls(), /--public/);
  }
});

test('B3 private-denied, unknown, inactive and failed capability checks refuse before mutation', async () => {
  for (const mode of ['member-public-only', 'member-no-capability', 'member-unknown',
    'member-auth', 'member-network', 'inactive', 'member-malformed', 'member-unknown-capability',
    'member-graphql-error', 'member-string-policy']) {
    const f = await applyFixture();
    await writeFile(f.mode, mode);
    const before = await f.snapshot();
    const result = f.run(f.args, f.confirmation + publish);
    assert.equal(result.status, 1, mode);
    assert.deepEqual(await f.snapshot(), before);
    assert.equal(await f.validationCalls(), '');
    assert.doesNotMatch(await f.calls(), /repo create|git push/);
    assert.equal((await readdir(f.scratch)).includes('.clinica-norte-client-init-backup'), false);
  }
});

test('B3 member 404 is provisional; denied creation or hidden collision retains local recovery without adoption', async () => {
  for (const mode of ['member-create-denied', 'member-hidden-collision']) {
    const f = await applyFixture();
    await writeFile(f.mode, mode);
    const result = f.run(f.args, f.confirmation + publish);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /creation ambiguous.*manual/i);
    assert.equal(f.git('rev-list', '--count', 'HEAD'), '1');
    assert.ok((await readdir(f.backup)).includes('original.git'));
    const resumed = f.run(['--resume', f.backup], 'RESUME clinica-norte\n');
    assert.equal(resumed.status, 1);
    assert.equal((await f.calls()).match(/repo create/g)?.length, 1);
    assert.doesNotMatch(await f.calls(), /git push/);
  }
});
