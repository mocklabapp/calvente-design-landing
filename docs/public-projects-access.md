# Restricted public projects export — local T1 only

This additive SQL unit covers S1/S2/S5: read-only public DTOs selected by owner UUID. It does **not** deploy R1 or authorize production access. The separate T3 unit has now migrated the local [Astro consumer](projects.md). UID selects public content; it is not visitor authentication or tenant authorization.

## Run the isolated proof

Run `node scripts/test-projects-sql.mjs` from the repository with Node 24, existing pinned dependencies, Docker and an already-local `postgres:17` image. The runner strictly type-checks itself without emitting files, creates one uniquely named container with no network or host mounts, and uses fake tables/data only. No image pull, real credentials or remote calls occur. Docker is deliberately not added to `pnpm run validate`.

Each subprocess has a 60-second timeout; database readiness is bounded to 30 polls. Fixture and migration setup run once. Setup failure reports zero tests and preserves its container for inspection (including its printed name); there is no automatic retry. After probes, only that run's container is removed. A missing migration explicitly runs the RED baseline, not a passing setup fallback.

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

## Roles and proposed runtime configuration

| Boundary | Contract |
| --- | --- |
| `public_projects_export_owner` | NOLOGIN, NOINHERIT, NOBYPASSRLS; owns the fixed-search-path SECURITY DEFINER RPC. Exact column SELECT only on the three existing tables; dedicated SELECT policies permit all owners. No state/private-column grants or writes. |
| `public_projects_runtime` | Separate NOLOGIN, NOINHERIT, NOBYPASSRLS role. Explicit EXECUTE only on this RPC, schema USAGE, no table grants or export-owner membership. |
| `authenticator` | May SET ROLE to runtime, without inheriting it (PostgreSQL 16+ membership syntax). Existing management memberships/grants are untouched. |
| Edge (local T2) | `SUPABASE_URL`, public infrastructure `SUPABASE_ANON_KEY` for `apikey`, and operator-provisioned secret `PUBLIC_PROJECTS_ROLE_JWT` for `Authorization: Bearer …` with runtime role claim. Never use a service-role key. |
| Sites (T3) | Only `MOCKLAB_PROJECTS_URL` (shared public Edge endpoint) and `MOCKLAB_USER_ID`. No old-name fallback, role JWT or infrastructure key on sites. |

The migration is transactional and one-shot: name collisions fail, rather than adopting/replacing pre-existing objects. It refuses disabled RLS or existing PUBLIC table/column privileges on these three tables; it never repairs them by revoking management access. Permissive PUBLIC **policies** do not grant column access. PUBLIC/anon/authenticated EXECUTE is revoked on this RPC only.

**Not global hardening:** NOINHERIT does not remove PUBLIC privileges. Existing/default PUBLIC EXECUTE on other functions, especially SECURITY DEFINER functions, can remain reachable by either new role. Schema CREATE, other schemas/tables, future grants, existing restrictive policies and policy-function dependencies need operator audit. This migration does not claim that runtime can effectively execute only one function across the database, or that existing management access became read-only.

## Operator-only gates — all pending

- Confirm the intended `galia_dev` / `mygqfdbloqojffhsurgo` target and PostgreSQL version through authorized project identity tooling, not a generic SQL login. Confirm actual table types, unique/FK relations, RLS policies, effective/default grants and policy dependencies against the fixture assumptions before applying anything.
- Audit inherited PUBLIC access and definer functions; resolve unsafe access separately with management-owner approval. Confirm the deploying principal can create roles/policies and transfer function ownership. Never give runtime membership in management/export-owner roles.
- Separately authorize migration application, PostgREST schema-cache refresh/exposure, custom role JWT provisioning/rotation/expiry, infrastructure key and Edge gateway configuration. Verify hosted role switching, sanitized failures, no-store and real HTTP pagination before deployment approval. No tokens are minted/read by this unit.
Local evidence is recorded in the [R1 task log](../odd/tasks/r1-public-projects.md): isolated SQL62/62, final application validation150/150, independent consumer16/16 and approved native code reviews. These completed checks do not establish hosted Supabase/PostgREST/Vercel behavior or close R1.

## Rollback boundary

Only after separate operator approval: stop the new Edge consumer and revoke its issued credential, remove this RPC's runtime EXECUTE and the newly added runtime membership from authenticator, then remove this exact RPC, its three `public_projects_export_select` policies and the two dedicated roles' exact column/schema grants. Remove the roles only after confirming no unexpected dependencies; use restrictive object removal, never CASCADE, DROP OWNED, or blanket privilege revocations. Preserve all pre-existing tables, rows, policies, roles, default privileges and management grants. No rollback is executed here.
