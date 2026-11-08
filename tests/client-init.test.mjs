// @ts-check
import assert from 'node:assert/strict';
import { mkdir, writeFile, readdir, rename, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { clientFixture, planArgs } from './helpers/client-init-fixture.mjs';

const confirmed = [...planArgs, '--confirm-plan', 'clinica-norte'];

test('public help labels the plan-only boundary without requiring a valid clone', async () => {
  const f = await clientFixture();
  f.git('remote', 'remove', 'origin');
  const result = f.run(['--help']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /plan-only/i);
  assert.match(result.stdout, /--confirm-plan/);
  assert.match(result.stdout, /No files.*changed/);
});

test('confirmed plan reports in-place identity, source and future backup without mutation', async () => {
  const f = await clientFixture();
  const before = await f.snapshot();
  const result = f.run(confirmed);
  assert.equal(result.status, 0, result.stderr);
  for (const text of ['PLAN CONFIRMED', 'Clínica Norte', 'clinica-norte', before.head,
    'package.json', 'src/config/site.ts', 'docs/project-brief.md', 'mocklabapp/clinica-norte',
    join(f.scratch, '.clinica-norte-client-init-backup'), 'not created or verified',
    'Pending: backup, local edits, validation, new history, GitHub, directory rename']) {
    assert.ok(result.stdout.includes(text), result.stdout);
  }
  assert.deepEqual(await f.snapshot(), before);
  assert.deepEqual(await readdir(f.scratch), ['starter']);
});

test('interactive input suggests an editable slug and requires exact confirmation', async () => {
  const f = await clientFixture();
  const result = f.run([], 'Clínica Norte\ncentro-norte\n\nPLAN centro-norte\n');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Slug \[clinica-norte\]/);
  assert.match(result.stdout, /mocklabapp\/centro-norte/);
  assert.match(result.stdout, /Portfolio: disabled/);
  assert.match(result.stdout, /PLAN CONFIRMED/);
});

test('refusal, EOF, mismatched confirmation and apply flag never mutate', async () => {
  const f = await clientFixture();
  const before = await f.snapshot();
  for (const args of [planArgs, [...planArgs, '--confirm-plan', 'wrong'], [...confirmed, '--apply']]) {
    const result = f.run(args, 'yes\n');
    assert.notEqual(result.status, 0, result.stdout);
    assert.match(result.stderr, /Plan not confirmed|Unknown, duplicate or incomplete option/);
    assert.deepEqual(await f.snapshot(), before);
  }
  const eof = f.run();
  assert.notEqual(eof.status, 0);
  assert.match(eof.stderr, /Input ended/);
});

test('invalid display name, slug, UUID and public URL fail without echoing unsafe input', async () => {
  const f = await clientFixture();
  const before = await f.snapshot();
  const cases = [
    ['--name', 'bad\u001bname', '--slug', 'valid'],
    ['--name', 'Valid', '--slug', '../escape'],
    ['--name', 'Valid', '--slug', 'Upper'],
    ['--name', 'Valid', '--slug', 'trailing\n', '--confirm-plan', 'trailing\n'],
    [...planArgs, '--uid', 'not-a-uuid'],
    [...confirmed, '--uid', '123e4567-e89b-42d3-a456-426614174000\n',
      '--projects-url', 'https://service.example.test/public'],
    [...planArgs, '--projects-url', 'https://service.example.test/public'],
    ...['http://service.example.test', 'https://user:secret@example.test',
      'https://example.test/?token=secret', 'https://localhost/public', 'https://127.0.0.1/public']
      .map((url) => [...planArgs, '--uid', '123e4567-e89b-42d3-a456-426614174000', '--projects-url', url]),
  ];
  for (const args of cases) {
    const result = f.run(args);
    assert.notEqual(result.status, 0, result.stdout);
    assert.match(result.stderr, /Display name|Slug must|UUID|HTTPS/);
    assert.doesNotMatch(result.stdout + result.stderr, /secret|bad\u001b/);
    assert.deepEqual(await f.snapshot(), before);
  }
});

test('optional portfolio accepts a UUID and explicit public HTTPS URL, never creates env', async () => {
  const f = await clientFixture();
  const before = await f.snapshot();
  const result = f.run([...confirmed, '--uid', '123e4567-e89b-42d3-a456-426614174000',
    '--projects-url', 'https://service.example.test/public-projects']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /MOCKLAB_PROJECTS_URL/);
  assert.match(result.stdout, /MOCKLAB_USER_ID/);
  assert.match(result.stdout, /\.env/);
  assert.ok(!(await readdir(f.root)).includes('.env'));
  assert.deepEqual(await f.snapshot(), before);
});

test('preflight accepts equivalent SSH origins, rejects other or credential-bearing origins', async () => {
  const f = await clientFixture();
  for (const url of ['git@github.com:mocklabapp/base-landing-mocklab.git',
    'ssh://git@github.com/mocklabapp/base-landing-mocklab.git']) {
    f.git('remote', 'set-url', 'origin', url);
    assert.equal(f.run(confirmed).status, 0);
  }
  for (const url of ['https://github.com/other/base-landing-mocklab.git',
    'https://secret@github.com/mocklabapp/base-landing-mocklab.git']) {
    f.git('remote', 'set-url', 'origin', url);
    const result = f.run(confirmed);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /origin/);
    assert.doesNotMatch(result.stderr + result.stdout, /secret/);
  }
});

test('dirty clone, destination/backup collisions and existing env stop safely', async () => {
  for (const kind of ['dirty', 'destination', 'backup', 'env']) {
    const f = await clientFixture();
    if (kind === 'dirty') await writeFile(join(f.root, 'untracked.txt'), 'untracked');
    if (kind === 'destination') await mkdir(join(f.scratch, 'clinica-norte'));
    if (kind === 'backup') await mkdir(join(f.scratch, '.clinica-norte-client-init-backup'));
    if (kind === 'env') await writeFile(join(f.root, '.env'), 'DO_NOT_READ=sentinel');
    const before = await f.snapshot();
    const result = f.run([...confirmed, '--uid', '123e4567-e89b-42d3-a456-426614174000',
      '--projects-url', 'https://service.example.test/public']);
    assert.notEqual(result.status, 0, kind);
    assert.match(result.stderr, /clean clone|destination already exists|\.env already exists/);
    assert.deepEqual(await f.snapshot(), before);
    assert.doesNotMatch(result.stdout + result.stderr, /sentinel/);
  }
});

test('nonstandard Git layout and linked identity targets are rejected', async () => {
  for (const kind of ['git-link', 'git-file', 'target-link', 'alternates']) {
    const f = await clientFixture();
    if (kind === 'git-link' || kind === 'git-file') {
      await rename(join(f.root, '.git'), join(f.scratch, 'git-data'));
      if (kind === 'git-link') await symlink(join(f.scratch, 'git-data'), join(f.root, '.git'));
      else await writeFile(join(f.root, '.git'), `gitdir: ${join(f.scratch, 'git-data')}\n`);
    } else if (kind === 'target-link') {
      await rename(join(f.root, 'src/config/site.ts'), join(f.scratch, 'site.ts'));
      await symlink(join(f.scratch, 'site.ts'), join(f.root, 'src/config/site.ts'));
    } else {
      await writeFile(join(f.root, '.git/objects/info/alternates'), '/not-self-contained\n');
    }
    const result = f.run(confirmed);
    assert.notEqual(result.status, 0, kind);
    assert.match(result.stderr, /normal files\/directories|self-contained clone/);
  }
});
