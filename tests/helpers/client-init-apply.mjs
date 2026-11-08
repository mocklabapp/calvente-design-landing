// @ts-check
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { clientFixture, planArgs } from './client-init-fixture.mjs';

export async function applyFixture() {
  const f = await clientFixture();
  const bin = join(f.scratch, 'bin');
  await mkdir(bin);
  const state = join(f.scratch, 'remote.json');
  const calls = join(f.scratch, 'calls.txt');
  const mode = join(f.scratch, 'mode');
  const pushed = join(f.scratch, 'pushed');
  const validations = join(f.scratch, 'validations.txt');
  await writeFile(validations, '');
  await writeFile(mode, 'absent');
  await writeFile(calls, '');
  const fake = `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
const mode = fs.readFileSync(${JSON.stringify(mode)}, 'utf8');
fs.appendFileSync(${JSON.stringify(calls)}, args.join(' ') + '\\n');
const repo = { id: 123, node_id: 'R_fixture', full_name: 'mocklabapp/clinica-norte', private: true };
if (mode === 'network') { console.error('network unavailable'); process.exit(1); }
if (args[0] === 'auth') process.exit(mode === 'denied' ? 1 : 0);
if (args.includes('user/memberships/orgs/mocklabapp')) {
  console.log(JSON.stringify({state: mode === 'inactive' ? 'pending' : 'active',
    role: mode.startsWith('member') ? 'member' : 'admin'})); process.exit(0);
}
if (args.includes('graphql')) {
  if (mode === 'member-auth') { console.error('HTTP 401'); process.exit(1); }
  if (mode === 'member-network') { console.error('network unavailable'); process.exit(1); }
  if (mode === 'member-malformed') { console.log('[]'); process.exit(0); }
  console.log(JSON.stringify({data:{organization:{viewerCanCreateRepositories:
    mode === 'member-no-capability' ? false : mode === 'member-unknown-capability' ? 'true' : true}},
    ...(mode === 'member-graphql-error' ? {errors:[{message:'fixture error'}]} : {})})); process.exit(0);
}
if (args.includes('orgs/mocklabapp')) {
  console.log(JSON.stringify(mode === 'member-unknown' ? {} : {
    members_can_create_private_repositories: mode === 'member-string-policy' ? 'true' : mode !== 'member-public-only',
    members_can_create_public_repositories: true})); process.exit(0);
}
if (args[0] === 'repo' && args[1] === 'create') {
  if (mode === 'member-create-denied' || mode === 'member-hidden-collision') {
    console.error('creation refused'); process.exit(1);
  }
  if (mode === 'wrong-private') repo.private = false;
  fs.writeFileSync(${JSON.stringify(state)}, JSON.stringify(repo));
  if (mode === 'ambiguous') process.exit(1);
  console.log(JSON.stringify(repo)); process.exit(0);
}
if (args.some(a => a.includes('/git/ref/'))) {
  if (fs.existsSync(${JSON.stringify(pushed)})) {
    console.log(JSON.stringify({object:{sha:fs.readFileSync(${JSON.stringify(pushed)}, 'utf8')}})); process.exit(0);
  }
  console.error('gh: Not Found (HTTP 404)'); process.exit(1);
}
if (mode === 'lookup-denied') { console.error('gh: Forbidden (HTTP 403)'); process.exit(1); }
if (mode === 'lookup-network') { console.error('connection refused'); process.exit(1); }
if (mode === 'collision' || fs.existsSync(${JSON.stringify(state)})) {
  console.log(mode === 'collision' ? JSON.stringify(repo) : fs.readFileSync(${JSON.stringify(state)}, 'utf8')); process.exit(0);
}
console.error('gh: Not Found (HTTP 404)'); process.exit(1);
`;
  await writeFile(join(bin, 'gh'), fake);
  await chmod(join(bin, 'gh'), 0o700);
  const gitShim = `#!${process.execPath}
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const args = process.argv.slice(2);
const env = {...process.env, PATH:${JSON.stringify(process.env.PATH)}};
if (args.includes('push')) {
  const mode = fs.readFileSync(${JSON.stringify(mode)}, 'utf8');
  fs.appendFileSync(${JSON.stringify(calls)}, 'git push\\n');
  const head = spawnSync('git', ['rev-parse', 'HEAD'], {env, encoding:'utf8'}).stdout.trim();
  if (mode === 'push-fails') process.exit(1);
  fs.writeFileSync(${JSON.stringify(pushed)}, head);
  if (mode === 'rename-collision') fs.mkdirSync(${JSON.stringify(join(f.scratch, 'clinica-norte'))});
  process.exit(mode === 'push-ambiguous' ? 1 : 0);
}
if (args.includes('ls-remote') || args.includes('fetch') || args.includes('clone')) process.exit(99);
const result = spawnSync('git', args, {env, encoding:'utf8'});
process.stdout.write(result.stdout || ''); process.stderr.write(result.stderr || '');
const mode = fs.readFileSync(${JSON.stringify(mode)}, 'utf8');
if (result.status === 0 && ((mode === 'commit-interrupted' && args.includes('commit')) ||
  (mode === 'init-interrupted' && args.includes('init')))) process.kill(process.ppid, 'SIGKILL');
process.exit(result.status ?? 1);
`;
  await writeFile(join(bin, 'git'), gitShim);
  await chmod(join(bin, 'git'), 0o700);
  // Fake only command-flow validation, never a package manager or network operation.
  await mkdir(join(f.root, 'node_modules/astro'), { recursive: true });
  await writeFile(join(f.root, 'node_modules/astro/package.json'), '{"name":"astro","bin":{"astro":"astro.mjs"}}');
  await writeFile(join(f.root, 'node_modules/astro/astro.mjs'),
    `import { appendFileSync, existsSync } from 'node:fs';
appendFileSync(${JSON.stringify(validations)}, process.argv[2] + '\\n');
if (existsSync('validation-fails')) process.exit(1);`);
  await writeFile(join(f.root, 'package.json'), JSON.stringify({ name: 'base-landing-mocklab',
    scripts: { validate: 'astro check && astro build && node --test tests/*.test.mjs' } }, null, 2) + '\n');
  await writeFile(join(f.root, '.gitignore'), '.env*\n!.env.example\nnode_modules/\nvalidation-fails\n');
  await writeFile(join(f.root, '.env.example'), '# Public configuration only\nMOCKLAB_PROJECTS_URL=\nMOCKLAB_USER_ID=\n');
  await mkdir(join(f.root, 'tests'));
  await writeFile(join(f.root, 'tests/smoke.test.mjs'), "import test from 'node:test'; test('fixture', () => {});\n");
  f.git('add', 'package.json', '.gitignore', '.env.example', 'tests/smoke.test.mjs');
  f.git('commit', '-m', 'validation fixture');
  f.env.PATH = `${bin}:${process.env.PATH}`;
  const backup = join(f.scratch, '.clinica-norte-client-init-backup');
  const args = [...planArgs, '--apply', '--author-name', 'Fixture', '--author-email', 'fixture@example.test'];
  const confirmation = `APPLY clinica-norte\nBACKUP ${backup}\nHISTORY clinica-norte\n`;
  return { ...f, args, backup, confirmation, mode, state,
    validationCalls: () => readFile(validations, 'utf8'),
    calls: () => readFile(calls, 'utf8') };
}
