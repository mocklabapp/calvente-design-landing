# Restricted public projects export

**R1/T4 is Completed / verified** for the authorized implementation and Edge-deployed scope. This additive SQL unit covers S1/S2/S5/S7: read-only public DTOs selected by owner UUID. Under separate S8 approval, the reviewed SQL is installed in `galia_dev` / `mygqfdbloqojffhsurgo`. SQL installation alone is not runtime proof; the separately authorized Edge v1 deployment and parent live HTTP checks are recorded below. T3 migrated the [Astro consumer](projects.md). UID selects public content; it is not visitor authentication or tenant authorization.

## Run the isolated proof

Run `node scripts/test-projects-sql.mjs` from the repository with Node 24, existing pinned dependencies, Docker and an already-local `postgres:15.8` image. The runner strictly type-checks itself without emitting files, creates one uniquely named container with no network or host mounts, and uses fake tables/data only. No image pull, real credentials or remote calls occur. Docker is deliberately not added to `pnpm run validate`.

Each subprocess has a 60-second timeout; database readiness is bounded to 30 polls. Fixture setup, the PostgreSQL 15 version check and the existing-application baseline run once. Setup failure reports zero tests and preserves its container for inspection (including its printed name); there is no automatic retry. Migration application is then a counted regression probe under `fixture_deployer`, a non-superuser with `CREATEROLE`, disposable database/schema authority and table ownership. A migration failure records a failed probe and stops later probes. After probes, only that run's container is removed. A missing migration explicitly runs the RED baseline, not a passing setup fallback.

The PG15 regression also compares existing application memberships, grants, policies and a management RPC, exercises fake project/translation CRUD before and after migration, and checks that temporary deployment privileges do not remain. Negative probes reject an inheriting authenticator, existing PUBLIC schema CREATE and missing deployer schema authority; transaction failure must preserve prior roles, grants, policies, schema privileges and fake rows. It does not exercise the real dashboard/webhooks or prove hosted permissions. Historical SQL62/62 results were obtained on PG17, not this new fixture; see the [task log](../odd/tasks/r1-public-projects.md) for observed PG15 results.

## RPC contract for the Edge implementation

`POST /rest/v1/rpc/export_public_projects` accepts exactly:

```json
{"p_owner":"11111111-1111-1111-1111-111111111111","p_offset":0,"p_limit":200}
```

The SQL signature is `(uuid, integer, integer) RETURNS jsonb`. All arguments are required and non-null; offset is 0–1,000,000 and limit 1–200. Invalid bounds raise SQLSTATE `22023`. PostgREST returns one JSON object, not a table/array wrapper:

```json
{"total":"0","count":0,"offset":0,"limit":200,"projects":[]}
```

- `total` is an exact decimal **string** for all matching projects, including on an empty/out-of-range page. `count` is the returned array length; offset/limit echo validated integers.
- Projects are ordered by numeric bigint ID, cast to text **before** JSON construction. Each contains only `id`, nullable `title`, `description`, `weblink`, nullable `originalLanguage`, and `translations`.
- Translations contain only `language`, nullable `title` and `description`, ordered by language using C collation. Settings join by project ID; translations join settings by project ID **and** original language. Missing settings mean unknown language and an empty array; partial fields remain null. No state filtering or language fallback occurs.
- Edge must validate the envelope/DTO, safe totals, increasing unique IDs and progress; advance by `count`, not requested limit. Stop only at the exact total; reject zero progress, inconsistent totals or exhaustion of time/page bounds. Never return a knowingly truncated success. One RPC uses one statement snapshot; multiple requests are not a shared snapshot under concurrent edits.

## Roles and runtime configuration

| Boundary | Contract |
| --- | --- |
| `public_projects_export_owner` | NOLOGIN, NOINHERIT, NOBYPASSRLS; owns the fixed-search-path SECURITY DEFINER RPC. Exact column SELECT only on the three existing tables; dedicated SELECT policies permit all owners. No state/private-column grants or writes. |
| `public_projects_runtime` | Separate NOLOGIN, NOINHERIT, NOBYPASSRLS role. Explicit EXECUTE only on this RPC, schema USAGE, no table grants or export-owner membership. |
| `authenticator` | Must already be NOINHERIT. Plain PostgreSQL 15 membership permits SET ROLE to runtime without automatically inheriting EXECUTE. Existing management memberships/grants and role attributes are untouched. |
| Edge (deployed T2/T7) | `SUPABASE_URL`; prefer the `default` publishable key in injected `SUPABASE_PUBLISHABLE_KEYS` JSON for `apikey`. Only when that variable is absent, use legacy `SUPABASE_ANON_KEY` with the anon claim. Explicit invalid publishable configuration fails closed. `Authorization: Bearer …` still requires the separate operator-provisioned `PUBLIC_PROJECTS_ROLE_JWT` with runtime role claim, never a publishable/secret/service-role key. See the [Edge configuration contract](public-projects-edge.md#frozen-reader-contract). |
| Sites (T3) | Only `MOCKLAB_PROJECTS_URL` (shared public Edge endpoint) and `MOCKLAB_USER_ID`. No old-name fallback, role JWT or infrastructure key on sites. |

The migration is transactional and one-shot: name collisions fail, rather than adopting/replacing pre-existing objects. It refuses disabled RLS, existing PUBLIC table/column privileges on these three tables, PUBLIC schema CREATE, or an absent/inheriting authenticator; it never repairs them by revoking management access or altering existing roles. Permissive PUBLIC **policies** do not grant column access. PUBLIC/anon/authenticated EXECUTE is revoked on this RPC only. Hosted catalog checks show that existing `service_role` default privileges also grant it EXECUTE; these were preserved, not silently revoked.

For non-superuser deployment, the principal needs CREATEROLE, table/policy ownership and authority to create functions and grant/revoke CREATE on `public`. The migration temporarily grants membership in the **new** export-owner role to `CURRENT_USER` and schema CREATE to that new role, transfers function ownership, then revokes both exact temporary grants before COMMIT. Any failure rolls back this transaction. No existing app membership, table grant or schema grant is revoked. Local fixture authority models these prerequisites; it does not establish that the hosted deploying principal has them. PostgreSQL 15 semantics are documented in [ALTER FUNCTION](https://www.postgresql.org/docs/15/sql-alterfunction.html) and [role membership](https://www.postgresql.org/docs/15/role-membership.html).

**Not global hardening:** NOINHERIT does not remove PUBLIC privileges. Existing/default PUBLIC EXECUTE on other functions, especially SECURITY DEFINER functions, can remain reachable by either new role. Schema CREATE, other schemas/tables, future grants, existing restrictive policies and policy-function dependencies need operator audit. This migration does not claim that runtime can effectively execute only one function across the database, or that existing management access became read-only.

## Operator-only gates

- Target binding was supplied by the human's project-scoped MCP configuration; hosted PostgreSQL 15.8 and deploying-principal authority were confirmed through catalogs. The exact reviewed migration was applied once as `public_projects_read_pg15`. Do not replay this one-shot migration. Parent catalog comparison preserved the existing permissions/policies included in its fingerprint; see the [task log](../odd/tasks/r1-public-projects.md) for evidence and limits. The human subsequently elected dashboard review and supplied seven passing metadata checks, closing the SQL installation substep. The automated verifier still has no callable MCP and ran zero remote probes; human execution of parent-authored checks is not automated independent verification. The separately authorized Edge rollout is also complete, with the bounded parent HTTP evidence below.
- Inherited PUBLIC access and definer functions remain a separate audit/hardening concern requiring management-owner approval, not an open R1 implementation task. Hosted deploying authority was confirmed for the installed migration. Never give runtime membership in management/export-owner roles.
- S11 separately authorized Edge deployment and a 365-day restricted JWT. The operator generated/stored it without model access to values and owns renewal before expiry, 365 days after issuance. The initially reported expiry may precede regeneration; no latest exact expiry is verified. Future credential/gateway/schema changes still require separate authorization. Sites receive only the shared endpoint and owner UUID, never this token.
- Edge version 1 is ACTIVE from source `18e9fcad94c6570469257cb9d814b59e0733bd5f`; one deployment, five files, `verify_jwt=false`, 20 other functions unchanged. Initial HTTP job1 passed seven cases and returned 503 for the synthetic-owner GET. After operator API-key creation, job2 rechecked **only** that failed GET: 200, exact empty projects, all three no-store headers and wildcard CORS passed. This is not a fresh 8/8 run. New API keys coexist with legacy keys, with no rotation/revocation; the human closed and chose to ignore the anon warning, whose exact text remains unavailable.
- For T4 under S2/S11, the human supplied «por ejemplo: e7b86352-c94e-4925-b02f-7e6080fe0146». Parent job3 used the actual `src/lib/projects-client.ts` `fetchPublicProjects`: exit 0, HTTP 200, 22 projects, 0 translations; raw public-field allowlist and all three no-store/wildcard CORS checks passed. No customer content logged or data mutations. With 22 < 200 and no translations, live multipage/translation cases were not exercised; fake fixtures retain that contract coverage. Parent HTTP checks do not replace or retry the unavailable automated hosted verifier.

Local evidence in the [R1 task log](../odd/tasks/r1-public-projects.md) includes historical PG17 SQL62/62, reviewed PG15 migration `e193e9f` with local/independent72/72, consumer16/16 and earlier native approvals. For deployed source `18e9fca`, writer RED50pass/35fail became Edge85/85 plus strict types and full186/186; independent local85/85 plus strict TypeScript passed. Native assess was `reviewDue=false/under_budget`, not a review approval for T7. Together with installed-state parent catalog preservation, human7/7 and bounded live results, this closes the approved R1 scope with no open implementation tasks. Other-app functional checks and Vercel deployment were not performed; no global-hardening claim. Renewal and each website's deployment remain operator maintenance/separate launch work. No functional checks were rerun for this documentation-only closure.

## Rollback boundary

Only after separate operator approval: stop the new Edge consumer and revoke its issued credential, remove this RPC's runtime EXECUTE and the newly added runtime membership from authenticator, then remove this exact RPC, its three `public_projects_export_select` policies and the two dedicated roles' exact column/schema grants. Remove the roles only after confirming no unexpected dependencies; use restrictive object removal, never CASCADE, DROP OWNED, or blanket privilege revocations. Preserve all pre-existing tables, rows, policies, roles, default privileges and management grants. No rollback is executed here.
