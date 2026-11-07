// @ts-check
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const container = `public-projects-test-${randomUUID()}`;
let started = false;
let setupComplete = false;
let passed = 0;
let failed = 0;

/** @param {string[]} args @param {string} [input] */
function docker(args, input) {
  const result = spawnSync('docker', args, {
    input, encoding: 'utf8', timeout: 60_000, maxBuffer: 2 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  return result;
}
/** @param {string[]} args */
function required(args) {
  const result = docker(args);
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
}
/** @param {string} source */
function sql(source) {
  return docker(['exec', '-i', container, 'psql', '-X', '-U', 'postgres', '-d', 'postgres',
    '-At', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose'], source);
}
/** @param {string} path */
function source(path) {
  return readFileSync(new URL(path, root), 'utf8');
}
/** @param {string} statement */
function success(statement) {
  const result = sql(statement);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}
/** @param {string} name @param {() => void} probe */
function test(name, probe) {
  try {
    probe();
    passed++;
    console.log(`ok - ${name}`);
  } catch (error) {
    failed++;
    console.error(`not ok - ${name}\n${String(error)}`);
  }
}
/** @param {string} role @param {string} statement @param {string} [code] */
function denied(role, statement, code = '42501') {
  const result = sql(`SET SESSION AUTHORIZATION ${role}; SELECT 'role-ready'; ${statement}`);
  assert.match(result.stdout, /role-ready/, 'Role setup must succeed before the denied operation');
  assert.notEqual(result.status, 0, 'Operation unexpectedly succeeded');
  assert.match(result.stderr, new RegExp(`ERROR:  ${code}:`));
}
const owner = "'11111111-1111-1111-1111-111111111111'";
const rpc = `SELECT public.export_public_projects(${owner}, 0, 200)`;
const snapshot = `SELECT jsonb_build_array(
  (SELECT jsonb_agg(to_jsonb(p) ORDER BY id) FROM public.projects p),
  (SELECT jsonb_agg(to_jsonb(s) ORDER BY project_id) FROM public.project_translation_settings s),
  (SELECT jsonb_agg(to_jsonb(t) ORDER BY project_id, language) FROM public.project_translations t));`;

try {
  // Existing pinned tooling only; no emit, package-manager invocation or install.
  const types = spawnSync(process.execPath, [
    fileURLToPath(new URL('node_modules/typescript/bin/tsc', root)),
    '--ignoreConfig', '--allowJs', '--checkJs', '--noEmit', '--strict',
    '--module', 'nodenext', '--target', 'es2022', '--types', 'node',
    fileURLToPath(import.meta.url),
  ], { encoding: 'utf8', timeout: 60_000 });
  if (types.error || types.status !== 0) throw new Error(types.error?.message || types.stdout || types.stderr);
  console.log('Runner strict type check passed');
  required(['image', 'inspect', 'postgres:17']);
  required(['run', '--detach', '--pull=never', '--name', container, '--network=none',
    '--env', 'POSTGRES_HOST_AUTH_METHOD=trust', 'postgres:17']);
  started = true;
  // Readiness polling only: fixture/migration setup is attempted exactly once.
  required(['exec', container, 'sh', '-c',
    'for i in $(seq 1 30); do pg_isready -U postgres >/dev/null && exit 0; sleep 1; done; exit 1']);
  success(source('supabase/tests/public-projects-fixture.sql'));
  const directory = new URL('supabase/migrations/', root);
  const migrations = existsSync(directory)
    ? readdirSync(directory).filter((name) => name.endsWith('_public_projects_read.sql')).sort() : [];
  assert.ok(migrations.length <= 1, 'Expected one additive export migration');
  if (!migrations.length) console.log('RED baseline: export migration absent; probing fixture database');
  for (const migration of migrations) success(source(`supabase/migrations/${migration}`));
  const before = success(snapshot);
  setupComplete = true;

  test('RPC exact DTO, both owners, all fixture states, bigint, nulls and pages', () => {
    success(source('supabase/tests/public-projects-output.sql'));
  });
  test('dedicated roles cannot login, bypass RLS, administer or inherit other roles', () => {
    assert.equal(success(`SELECT count(*) FROM pg_roles r WHERE rolname IN
      ('public_projects_runtime', 'public_projects_export_owner') AND NOT
      (rolsuper OR rolcanlogin OR rolbypassrls OR rolcreaterole OR rolcreatedb OR rolreplication OR rolinherit)
      AND NOT EXISTS (SELECT FROM pg_auth_members m WHERE m.member = r.oid);`).trim(), '2');
  });
  for (const role of ['anon', 'authenticated', 'public_projects_runtime']) {
    test(`${role} cannot assume export owner`, () => denied(role, 'SET ROLE public_projects_export_owner'));
  }
  for (const role of ['anon', 'authenticated', 'authenticator']) {
    test(`${role} cannot execute RPC without runtime SET ROLE`, () => denied(role, rpc));
  }
  for (const [table, column] of [
    ['projects', 'prompt'], ['project_translation_settings', 'internal_note'],
    ['project_translations', 'internal_note'],
  ]) {
    for (const role of ['public_projects_runtime', 'public_projects_export_owner']) {
      for (const statement of [
        `SELECT ${column} FROM public.${table}`,
        `UPDATE public.${table} SET ${column} = 'changed'`,
        `DELETE FROM public.${table}`,
        `INSERT INTO public.${table} (${column}) VALUES ('changed')`,
        `UPDATE public.${table} SET ${table === 'projects' ? 'id = id' : 'project_id = project_id'}`,
        `INSERT INTO public.${table} (${table === 'projects' ? 'id' : 'project_id'}) VALUES (99)`,
        `TRUNCATE public.${table}`,
      ]) test(`${role}: deny ${statement}`, () => denied(role, statement));
    }
    test(`runtime cannot directly select ${table}`, () => {
      const publicColumn = table === 'projects' ? 'id' : 'project_id';
      denied('public_projects_runtime', `SELECT ${publicColumn} FROM public.${table}`);
    });
  }
  for (const args of [
    `${owner}, -1, 1`, `${owner}, 1000001, 1`, `${owner}, 0, 0`, `${owner}, 0, 201`,
    `${owner}, null, 1`, `${owner}, 0, null`, 'null, 0, 1',
  ]) test(`reject invalid RPC arguments: ${args}`, () => {
    denied('public_projects_runtime', `SELECT public.export_public_projects(${args})`, '22023');
  });
  test('export still works when legacy PUBLIC row policies deny all rows', () => {
    for (const table of ['projects', 'project_translation_settings', 'project_translations']) {
      success(`ALTER POLICY legacy ON public.${table} USING (false) WITH CHECK (false)`);
    }
    success(source('supabase/tests/public-projects-output.sql'));
  });
  test('rejected operations leave stored fixtures unchanged', () => {
    assert.equal(success(snapshot), before);
  });
} catch (error) {
  console.error(`Setup failed; no automatic retry: ${String(error)}`);
  process.exitCode = 1;
} finally {
  console.log(`Tests: ${passed + failed}; passed: ${passed}; failed: ${failed}`);
  if (started && setupComplete) {
    try { required(['rm', '--force', container]); }
    catch (error) {
      console.error(`Own-container cleanup failed (${container}): ${String(error)}`);
      process.exitCode = 1;
    }
  } else if (started) console.error(`Failed setup preserved for inspection: ${container}`);
  if (failed) process.exitCode = 1;
}
