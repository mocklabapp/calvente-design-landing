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
const legacyAccess = `SELECT jsonb_build_object(
  'roles', (SELECT jsonb_agg(jsonb_build_array(rolname, rolinherit, rolbypassrls, rolcreaterole)
    ORDER BY rolname) FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role','authenticator')),
  'memberships', (SELECT jsonb_agg(jsonb_build_array(r.rolname, m.rolname, am.admin_option)
    ORDER BY r.rolname, m.rolname) FROM pg_auth_members am
    JOIN pg_roles r ON r.oid=am.roleid JOIN pg_roles m ON m.oid=am.member
    WHERE r.rolname IN ('anon','authenticated','service_role')),
  'grants', (SELECT jsonb_agg(jsonb_build_array(c.relname, a.grantee, a.privilege_type, a.is_grantable)
    ORDER BY c.relname, a.grantee, a.privilege_type) FROM pg_class c
    CROSS JOIN LATERAL aclexplode(c.relacl) a
    WHERE c.oid IN ('public.projects'::regclass, 'public.project_translation_settings'::regclass,
      'public.project_translations'::regclass)
    AND a.grantee IN (SELECT oid FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role'))),
  'policies', (SELECT jsonb_agg(to_jsonb(p) ORDER BY tablename, policyname) FROM pg_policies p
    WHERE schemaname='public' AND policyname='legacy'),
  'management_rpc', (SELECT jsonb_build_array(proowner, proacl::text) FROM pg_proc
    WHERE oid='public.fixture_management_count()'::regprocedure));`;
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
  required(['image', 'inspect', 'postgres:15.8']);
  required(['run', '--detach', '--pull=never', '--name', container, '--network=none',
    '--env', 'POSTGRES_HOST_AUTH_METHOD=trust', 'postgres:15.8']);
  started = true;
  // Readiness polling only: fixture/migration setup is attempted exactly once.
  required(['exec', container, 'sh', '-c',
    'for i in $(seq 1 30); do pg_isready -U postgres >/dev/null && exit 0; sleep 1; done; exit 1']);
  success(source('supabase/tests/public-projects-fixture.sql'));
  const directory = new URL('supabase/migrations/', root);
  const migrations = existsSync(directory)
    ? readdirSync(directory).filter((name) => name.endsWith('_public_projects_read.sql')).sort() : [];
  assert.ok(migrations.length <= 1, 'Expected one additive export migration');
  assert.equal(success("SELECT current_setting('server_version_num')::integer / 10000").trim(), '15');
  const before = success(snapshot);
  const accessBefore = success(legacyAccess);
  success(source('supabase/tests/public-projects-management.sql'));
  assert.equal(success(snapshot), before, 'Management baseline must leave fake rows unchanged');
  setupComplete = true;
  if (!migrations.length) console.log('RED baseline: export migration absent; probing fixture database');
  for (const migration of migrations) {
    const migrationSource = source(`supabase/migrations/${migration}`);
    const schemaBefore = success("SELECT jsonb_build_array(nspowner, nspacl::text) FROM pg_namespace WHERE nspname='public'");
    for (const [name, preparation, code] of [
      ['inheriting authenticator', 'ALTER ROLE authenticator INHERIT;', '22023'],
      ['PUBLIC schema CREATE', 'GRANT CREATE ON SCHEMA public TO PUBLIC;', '22023'],
      ['missing schema grant authority', 'ALTER SCHEMA public OWNER TO postgres;', '42501'],
    ]) {
      test(`migration rejects ${name} without leaving partial changes`, () => {
        const result = sql(`BEGIN; ${preparation} SET SESSION AUTHORIZATION fixture_deployer;
          SELECT 'deployer-ready'; ${migrationSource}`);
        assert.match(result.stdout, /deployer-ready/);
        assert.notEqual(result.status, 0, 'Unsafe migration unexpectedly succeeded');
        assert.match(result.stderr, new RegExp(`ERROR:  ${code}:`));
        assert.equal(success(`SELECT count(*) FROM pg_roles WHERE rolname IN
          ('public_projects_export_owner','public_projects_runtime')`).trim(), '0');
        assert.equal(success(legacyAccess), accessBefore);
        assert.equal(success(snapshot), before);
        assert.equal(success("SELECT jsonb_build_array(nspowner, nspacl::text) FROM pg_namespace WHERE nspname='public'"), schemaBefore);
      });
    }
    test('migration applies on PostgreSQL 15 as a non-superuser deployer', () => {
      const result = sql(`SET SESSION AUTHORIZATION fixture_deployer;
        SELECT current_user || ':' || rolsuper::text FROM pg_roles WHERE rolname=current_user;
        ${migrationSource}`);
      assert.match(result.stdout, /fixture_deployer:false/);
      assert.equal(result.status, 0, `stdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
    });
    if (failed) throw new Error('Migration probe failed; remaining probes were not run');
  }

  const portfolioMigration = source('supabase/migrations/202608010001_public_projects_portfolio.sql');
  const exportAcl = "SELECT proacl::text FROM pg_proc WHERE oid='public.export_public_projects(uuid,integer,integer)'::regprocedure";
  const aclBefore = success(exportAcl);
  test('portfolio successor replaces export as non-superuser without changing its ACL', () => {
    success(`SET SESSION AUTHORIZATION fixture_deployer; ${portfolioMigration}`);
    assert.equal(success(exportAcl), aclBefore);
  });
  if (failed) throw new Error('Portfolio migration failed; remaining probes were not run');
  test('export owner receives exactly the approved project columns, never whole-table SELECT', () => {
    const columns = success(`SELECT string_agg(column_name::text, ',' ORDER BY column_name)
      FROM information_schema.columns WHERE table_schema='public' AND table_name='projects'
      AND has_column_privilege('public_projects_export_owner', 'public.projects', column_name, 'SELECT')`).trim();
    assert.equal(columns, 'category,description,id,image_data,title,user,weblink,year');
    assert.equal(success("SELECT has_table_privilege('public_projects_export_owner', 'public.projects', 'SELECT')").trim(), 'f');
  });
  test('source remains jsonb[]; malformed elements fail without dropping images', () => {
    assert.equal(success(`SELECT udt_name FROM information_schema.columns
      WHERE table_schema='public' AND table_name='projects' AND column_name='image_data'`).trim(), '_jsonb');
    success(source('supabase/tests/public-projects-images.sql'));
    assert.equal(success(snapshot), before);
  });

  test('existing application roles, memberships, grants, policies and RPC are unchanged', () => {
    assert.equal(success(legacyAccess), accessBefore);
    assert.equal(success(snapshot), before, 'Migration must not modify fake rows');
    success(source('supabase/tests/public-projects-management.sql'));
    assert.equal(success(snapshot), before, 'Management checks must leave fake rows unchanged');
  });
  test('ownership transferred without residual schema CREATE or deployer membership', () => {
    assert.equal(success(`SELECT pg_get_userbyid(proowner)
      FROM pg_proc WHERE oid='public.export_public_projects(uuid,integer,integer)'::regprocedure;`).trim(),
    'public_projects_export_owner');
    for (const role of ['public_projects_export_owner', 'public_projects_runtime']) {
      assert.equal(success(`SELECT has_schema_privilege('${role}', 'public', 'CREATE')`).trim(), 'f');
    }
    assert.equal(success(`SELECT pg_has_role('fixture_deployer', 'public_projects_export_owner', 'MEMBER')`).trim(), 'f');
    denied('fixture_deployer', 'SET ROLE public_projects_export_owner');
  });
  for (const role of ['anon', 'authenticated', 'service_role', 'public_projects_export_owner']) {
    test(`runtime cannot assume ${role}`, () => denied('public_projects_runtime', `SET ROLE ${role}`));
  }
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
  console.error(`${setupComplete ? 'Verification stopped' : 'Setup failed'}; no automatic retry: ${String(error)}`);
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
