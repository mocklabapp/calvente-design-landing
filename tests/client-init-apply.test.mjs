// @ts-check
import assert from 'node:assert/strict';
import { readFile, readdir, stat, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { applyFixture } from './helpers/client-init-apply.mjs';

test('apply prepares identity and independent history only after retained backup; publication may be declined', async () => {
  const f = await applyFixture();
  const before = await f.snapshot();
  const result = f.run(f.args, f.confirmation + 'no\n');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /LOCAL PREPARED.*publication pending/);
  assert.doesNotMatch(result.stdout, /INITIALIZATION COMPLETE/);
  assert.equal(JSON.parse(await readFile(join(f.root, 'package.json'), 'utf8')).name, 'clinica-norte');
  assert.match(await readFile(join(f.root, 'src/config/site.ts'), 'utf8'), /Clínica Norte/);
  assert.match(await readFile(join(f.root, 'docs/project-brief.md'), 'utf8'), /confirmed.*Clínica Norte/i);
  assert.notEqual(f.git('rev-parse', 'HEAD'), before.head);
  assert.equal(f.git('rev-list', '--count', 'HEAD'), '1');
  assert.equal(f.git('remote'), '');
  assert.equal((await stat(f.backup)).mode & 0o777, 0o700);
  const retained = spawnSync('git', ['--git-dir', join(f.backup, 'original.git'), 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  assert.equal(retained.stdout.trim(), before.head);
  assert.match(result.stdout, new RegExp(before.head));
  assert.doesNotMatch(await f.calls(), /repo create/);
});

test('apply refusal and GitHub absence/denial/network/collision distinctions preserve source', async () => {
  for (const mode of ['absent', 'denied', 'network', 'collision']) {
    const f = await applyFixture();
    await writeFile(f.mode, mode);
    const before = await f.snapshot();
    const result = f.run(f.args, 'no\n');
    assert.equal(result.status, 1, mode);
    assert.deepEqual(await f.snapshot(), before);
    assert.ok(!(await readdir(f.scratch)).includes('.clinica-norte-client-init-backup'));
    assert.doesNotMatch(await f.calls(), /repo create/);
  }
});

test('failing local validation retains original history and backup without remote mutation', async () => {
  const f = await applyFixture();
  await writeFile(join(f.root, 'validation-fails'), '');
  const before = f.git('rev-parse', 'HEAD');
  const result = f.run(f.args, f.confirmation);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /validation failed/i);
  assert.equal(f.git('rev-parse', 'HEAD'), before);
  assert.ok((await readdir(f.backup)).includes('original.git'));
  assert.doesNotMatch(await f.calls(), /repo create/);
});

test('optional portfolio exclusively creates an ignored private file, excludes it from new history', async () => {
  const f = await applyFixture();
  const result = f.run([...f.args, '--uid', '123e4567-e89b-42d3-a456-426614174000',
    '--projects-url', 'https://service.example.test/public'], f.confirmation + 'no\n');
  assert.equal(result.status, 0, result.stderr);
  assert.equal((await stat(join(f.root, '.env'))).mode & 0o777, 0o600);
  assert.equal(f.git('ls-files', '.env'), '');
  assert.match(result.stdout, /MOCKLAB_USER_ID/);
});

test('ambiguous remote creation stops and never replays on explicit resume', async () => {
  const f = await applyFixture();
  await writeFile(f.mode, 'ambiguous');
  const result = f.run(f.args, f.confirmation + 'PUBLISH mocklabapp/clinica-norte\n');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /ambiguous.*manual/i);
  const resumed = f.run(['--resume', f.backup], 'RESUME clinica-norte\n');
  assert.equal(resumed.status, 1);
  assert.match(resumed.stderr, /ambiguous.*manual/i);
  assert.equal((await f.calls()).match(/repo create/g)?.length, 1);
});

test('tracked credential-store filenames are preserved on disk but excluded from fresh history', async () => {
  const f = await applyFixture();
  await writeFile(join(f.root, '.npmrc'), '//fixture.invalid/:_authToken=FAKE_FIXTURE_ONLY\n');
  f.git('add', '.npmrc');
  f.git('commit', '-m', 'fixture credential filename');
  const result = f.run(f.args, f.confirmation + 'no\n');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.git('ls-files', '.npmrc'), '');
  assert.ok((await readdir(f.root)).includes('.npmrc'));
  assert.doesNotMatch(result.stdout + result.stderr, /FAKE_FIXTURE_ONLY/);
});

test('unsafe Git config and destination collisions refuse before stored state or edits', async () => {
  for (const kind of ['config', 'destination', 'hook', 'environment']) {
    const f = await applyFixture();
    if (kind === 'config') f.git('config', 'core.hooksPath', '/unsafe');
    if (kind === 'destination') await mkdir(join(f.scratch, 'clinica-norte'));
    if (kind === 'hook') await writeFile(join(f.root, '.git/hooks/pre-commit'), '#!/bin/sh\nexit 99\n');
    if (kind === 'environment') await writeFile(join(f.root, '.env'), 'HUMAN_OWNED=do-not-read');
    const before = await f.snapshot();
    const result = f.run(f.args, f.confirmation);
    assert.equal(result.status, 1);
    assert.deepEqual(await f.snapshot(), before);
    assert.ok(!(await readdir(f.scratch)).includes('.clinica-norte-client-init-backup'));
  }
});
