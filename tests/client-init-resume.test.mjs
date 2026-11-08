// @ts-check
import assert from 'node:assert/strict';
import { readFile, writeFile, readdir, rename, symlink, stat } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { applyFixture } from './helpers/client-init-apply.mjs';

const publish = 'PUBLISH mocklabapp/clinica-norte\n';
const resumeRemote = 'RESUME clinica-norte\nREMOTE mocklabapp/clinica-norte 123\n';

test('private creation, push and final in-place rename complete; repeat resume verifies identities without replay', async () => {
  const f = await applyFixture();
  const identity = await stat(f.root);
  const result = f.run(f.args, f.confirmation + publish);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /INITIALIZATION COMPLETE/);
  assert.match(result.stdout, /Push may trigger deployment/);
  const destination = join(f.scratch, 'clinica-norte');
  assert.equal((await stat(destination)).ino, identity.ino);
  assert.ok(!(await readdir(f.scratch)).includes('starter'));
  assert.equal(JSON.parse(await readFile(f.state, 'utf8')).private, true);
  const before = await f.calls();
  const resumed = f.runAt(destination, ['--resume', f.backup], 'RESUME clinica-norte\n');
  assert.equal(resumed.status, 0, resumed.stderr);
  const calls = (await f.calls()).slice(before.length);
  assert.doesNotMatch(calls, /repo create|git push/);
});

test('declined publication resumes only with explicit operation and private remote approval', async () => {
  const f = await applyFixture();
  assert.equal(f.run(f.args, f.confirmation + 'no\n').status, 0);
  const before = await f.snapshot();
  const calls = await f.calls();
  const refused = f.run(['--resume', f.backup], 'no\n');
  assert.equal(refused.status, 1);
  assert.deepEqual(await f.snapshot(), before);
  assert.equal(await f.calls(), calls);
  const resumed = f.run(['--resume', f.backup], 'RESUME clinica-norte\n' + publish);
  assert.equal(resumed.status, 0, resumed.stderr);
  assert.match(resumed.stdout, /INITIALIZATION COMPLETE/);
});

test('lookup permission/network errors and wrong-private creation never publish', async () => {
  for (const mode of ['lookup-denied', 'lookup-network', 'wrong-private']) {
    const f = await applyFixture();
    await writeFile(f.mode, mode);
    const before = await f.snapshot();
    const result = f.run(f.args, f.confirmation + publish);
    assert.equal(result.status, 1, mode);
    assert.doesNotMatch(await f.calls(), /git push/);
    if (mode !== 'wrong-private') {
      assert.match(result.stderr, /denied or unavailable/);
      assert.deepEqual(await f.snapshot(), before);
      assert.ok(!(await readdir(f.scratch)).includes('.clinica-norte-client-init-backup'));
    }
  }
});

test('ambiguous push is reconciled from exact remote commit without pushing twice', async () => {
  const f = await applyFixture();
  await writeFile(f.mode, 'push-ambiguous');
  const result = f.run(f.args, f.confirmation + publish);
  assert.equal(result.status, 1);
  assert.doesNotMatch(result.stdout, /INITIALIZATION COMPLETE/);
  const resumed = f.run(['--resume', f.backup], resumeRemote);
  assert.equal(resumed.status, 0, resumed.stderr);
  assert.equal((await f.calls()).match(/git push/g)?.length, 1);
});

test('unconfirmed push absence and final rename collisions stop without loss', async () => {
  for (const mode of ['push-fails', 'rename-collision']) {
    const f = await applyFixture();
    await writeFile(f.mode, mode);
    const result = f.run(f.args, f.confirmation + publish);
    assert.equal(result.status, 1, mode);
    assert.doesNotMatch(result.stdout, /INITIALIZATION COMPLETE/);
    assert.ok((await readdir(f.root)).includes('package.json'));
    assert.ok((await readdir(f.backup)).includes('original.git'));
    const resumed = f.run(['--resume', f.backup], resumeRemote);
    assert.equal(resumed.status, 1);
    assert.match(resumed.stderr, /ambiguous|destination exists/);
    assert.equal((await f.calls()).match(/git push/g)?.length, 1);
  }
});

test('tampered journal, original backup bytes and changed working identity are refused without further calls', async () => {
  for (const kind of ['journal', 'backup', 'identity']) {
    const f = await applyFixture();
    assert.equal(f.run(f.args, f.confirmation + 'no\n').status, 0);
    if (kind === 'journal') await writeFile(join(f.backup, 'journal.json'), '{}');
    if (kind === 'backup') await writeFile(join(f.backup, 'originals/package.json'), '{}');
    if (kind === 'identity') await writeFile(join(f.root, 'src/config/site.ts'), 'foreign edit');
    const calls = await f.calls();
    const result = f.run(['--resume', f.backup], resumeRemote);
    assert.equal(result.status, 1, kind);
    assert.match(result.stderr, /journal|integrity|mismatch|Invalid/i);
    assert.equal(await f.calls(), calls);
  }
});

test('foreign root and symlinked backup paths cannot resume a recorded operation', async () => {
  const f = await applyFixture();
  assert.equal(f.run(f.args, f.confirmation + 'no\n').status, 0);
  const other = await applyFixture();
  const foreign = other.run(['--resume', f.backup], resumeRemote);
  assert.equal(foreign.status, 1);
  assert.match(foreign.stderr, /recorded clone root/);
  const linked = join(f.scratch, 'linked-backup');
  await symlink(f.backup, linked);
  assert.equal(f.run(['--resume', linked], resumeRemote).status, 1);
});

test('history approval EOF retains original history and explicit resume completes validation and preparation', async () => {
  const f = await applyFixture();
  const source = f.git('rev-parse', 'HEAD');
  const result = f.run(f.args, `APPLY clinica-norte\nBACKUP ${f.backup}\n`);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Input ended; no further changes/);
  assert.equal(f.git('rev-parse', 'HEAD'), source);
  const resumed = f.run(['--resume', f.backup], 'RESUME clinica-norte\nHISTORY clinica-norte\nno\n');
  assert.equal(resumed.status, 0, resumed.stderr);
  assert.match(resumed.stdout, /LOCAL PREPARED/);
});

test('history crash boundaries reconcile a finished commit but refuse a partial index', async () => {
  for (const mode of ['commit-interrupted', 'init-interrupted']) {
    const f = await applyFixture();
    await writeFile(f.mode, mode);
    const interrupted = f.run(f.args, f.confirmation + 'no\n');
    assert.equal(interrupted.signal, 'SIGKILL');
    await writeFile(f.mode, 'absent');
    const resumed = f.run(['--resume', f.backup], 'RESUME clinica-norte\nno\n');
    if (mode === 'commit-interrupted') {
      assert.equal(resumed.status, 0, resumed.stderr);
      assert.match(resumed.stdout, /LOCAL PREPARED/);
    } else {
      assert.equal(resumed.status, 1);
      assert.match(resumed.stderr, /History transition incomplete.*manual inspection/);
    }
    assert.doesNotMatch(await f.calls(), /repo create|git push/);
    assert.ok((await readdir(f.backup)).includes('retired.git'));
  }
});

test('replacement remote ID and changed destination are never adopted', async () => {
  const f = await applyFixture();
  await writeFile(f.mode, 'rename-collision');
  assert.equal(f.run(f.args, f.confirmation + publish).status, 1);
  await writeFile(f.state, JSON.stringify({ id: 999, node_id: 'R_other', full_name: 'mocklabapp/clinica-norte', private: true }));
  const result = f.run(['--resume', f.backup], resumeRemote);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /identity mismatch/);
  assert.equal((await f.calls()).match(/repo create/g)?.length, 1);
  await rename(f.root, join(f.scratch, 'moved'));
  assert.equal(f.runAt(join(f.scratch, 'moved'), ['--resume', f.backup], resumeRemote).status, 1);
});
