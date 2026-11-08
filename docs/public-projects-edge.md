# Public projects Edge Function

**R1/T4 is Completed / verified** for the authorized implementation and Edge deployment. The shared `public-projects` function exposes public owner-selected projects without caller authentication or site keys. Version 1 is active on the approved project; the parent verified a populated read through the actual Astro client: HTTP 200, 22 projects, 0 translations, public-field allowlist and no-store/CORS checks passed. Live translations/multipage cases, other-app functional checks and Vercel deployment were not exercised.

T2 supplies the reader/HTTP adapter and native entry; T7/S10 adds publishable infrastructure key selection while preserving the restricted bearer and legacy compatibility. T3 migrated the Astro consumer: each site needs only `MOCKLAB_PROJECTS_URL` (shared endpoint) and `MOCKLAB_USER_ID` (owner UUID), never a token. See the [site configuration guide](projects.md).

## HTTP contract for consumers (T3)

Call `GET <shared-function-url>?uid=<owner-uuid>` with no authentication or custom headers. UID is a public selector, not authorization: any caller can select any owner's public output. Only one `uid` query parameter is accepted, with no extra query options, credential/URL overrides or project-detail operation. UUIDs are case-insensitive and normalized by the reader.

| Request/result | Status and body |
| --- | --- |
| Valid GET, including empty portfolio | `200 {"projects":[...]}` using the frozen public DTO below |
| Missing, duplicate, malformed UID or any extra query parameter | `400 {"error":"Invalid query"}` |
| OPTIONS, without reading configuration or upstream | `204`, empty body |
| Any other method | `405 {"error":"Method not allowed"}`, `Allow: GET, OPTIONS` |
| Invalid/missing runtime configuration, upstream failure or invalid data | `503 {"error":"Projects unavailable"}`, never partial projects |

Every handler response has `Cache-Control`, `CDN-Cache-Control` and `Vercel-CDN-Cache-Control: no-store`, `Access-Control-Allow-Origin: *` and `Access-Control-Allow-Methods: GET, OPTIONS`. No credential allowance or custom-header allowance is emitted: public GET needs neither. CORS is not an authorization boundary. Each GET reads fresh data; an already open page must request again. Native HTTP servers may suppress HEAD bodies; the handler still selects the 405 response.

## Runtime and operator boundary

`createPublicProjectsHandler(getConfig, dependencies?)` in `handler.ts` accepts trusted configuration/dependencies for isolated tests. `index.ts` registers it with `Deno.serve`; configuration is read on every valid GET, from exactly `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEYS` and `PUBLIC_PROJECTS_ROLE_JWT`. See the frozen constraints below. Sites receive only the shared function URL and owner UUID, never these credentials. No SDK or new dependency is used.

`supabase/config.toml` sets `verify_jwt = false` **only** for `public-projects`, intentionally allowing unauthenticated gateway requests. This local setting changes no hosted permissions. The target `galia_dev` / `mygqfdbloqojffhsurgo` was bound through human-provided MCP configuration; the separately approved restricted SQL export is installed and manually checked. Do not reapply that one-shot migration. S10 authorized the local compatibility adjustment; S11 separately authorized deployment with an operator-issued JWT valid for 365 days. The operator generated it privately and stored it in the Dashboard without exposing values to the model. Hosted reads now pass for empty and approved populated owners; see the [access evidence and operator boundaries](public-projects-access.md#operator-only-gates). Renewal before expiry, 365 days after issuance, remains the operator's responsibility. An initially reported expiry may precede regeneration and is not the latest verified expiry. This does not authorize shared signing-key rotation, changes to other applications or secret disclosure.

`runtime.d.ts` is an explicitly minimal **local structural contract** for `Deno.env.get` and the used one-handler `Deno.serve` overload, not official Deno typings. The unused server return is `unknown`. A Node fixture substitutes a fake global Deno and fetch, imports the entry, checks single registration and per-request environment wiring, then restores globals. It reads no real environment or credentials. Passing this test/type check is **not native Deno or hosted proof**.

## Deployment record and operator reference

One deployment used source `18e9fcad94c6570469257cb9d814b59e0733bd5f`: five files, `verify_jwt=false`, ACTIVE version 1, function ID `e01e10b4-d2c9-4dbc-87d1-814bb77327cf`, deployment `ezbr_sha256` `cc21dadec1b5b015554af1d0c87ed29655edc8811126536af47d134749f06910`. The 20 other functions were unchanged. No redeployment followed the API-key configuration change.

Parent-reported HTTP evidence, in order:

1. Initial job1: seven of eight cases passed; the valid synthetic-owner GET returned 503.
2. After human API-key creation, job2 rechecked **only** that failed GET: 200, exact empty projects, all three no-store headers and wildcard CORS passed. This is not a fresh 8/8 suite.
3. The human authorized the populated-owner example: «por ejemplo: e7b86352-c94e-4925-b02f-7e6080fe0146». Job3 called `src/lib/projects-client.ts` `fetchPublicProjects`: exit 0, HTTP 200, 22 projects, 0 translations, raw public-field allowlist and no-store/wildcard CORS passed. No customer content was logged or data mutated. Because 22 < 200 and there were no translations, live multipage/translation cases remain unexercised; fake fixtures protect those contracts.

The anon warning was closed and the human chose to ignore it; its exact text is unavailable. Official new API keys coexist with legacy keys; no key rotation/revocation occurred. Existing-app functionality was not tested.

The source manifest under `supabase/functions/public-projects/` is `index.ts`, `handler.ts`, `reader.ts`, `validation.ts` and `runtime.d.ts`. The entrypoint is `index.ts`; preserve the explicit relative imports and its reference to the declaration file. There are no external runtime imports in this closure. The manifest alone is not runtime proof; the deployment and parent HTTP results above supply bounded hosted evidence.

The following preparation safeguards remain an operator reference for future authorized maintenance, not open R1 implementation tasks or instructions to repeat deployment:

1. **Enable the deployment capability, not a deployment.** The operator enabled Functions alongside Database tools, and `deploy_edge_function` is now discoverable. Retain the project binding when configuring this connection:
   `https://mcp.supabase.com/mcp?project_ref=mygqfdbloqojffhsurgo&features=database,functions&read_only=false`.
   Reconnect and inspect the actual tools before using them. Keep human approval enabled; do not add `skip_elicitations`. Changing tool availability is not permission to invoke a write.
2. **Confirm signing prerequisites without revealing values.** The human reported that legacy `anon` API keys remain enabled for existing apps; preserve that compatibility. The reader now accepts the hosted default publishable infrastructure key, but it still requires a separately signed restricted-role JWT. This does not remove the signing prerequisite. Do not create/import/rotate/revoke a signing key or change existing apps' authentication to satisfy this check. Supabase-generated signing keys cannot be exported; if no suitable existing operator-controlled signer is available, pause for a separately scoped decision.
3. **Plan operator-only credential issuance.** The intended token has `role: public_projects_runtime` and a finite `exp`; no visitor account or impersonated `sub` is required for owner-UID selection. Confirm the accepted signer, expiry and renewal owner before issuance. Do not use a service-role token, online JWT generator, SQL token output or chat/MCP arguments containing secret values. A signing key stays outside the Edge runtime.
4. **Use the hosted environment correctly.** Supabase documents injected `SUPABASE_URL`, legacy `SUPABASE_ANON_KEY` and `SUPABASE_PUBLISHABLE_KEYS` (a JSON dictionary with a `default` entry). Verify availability without printing values. The reader prefers the valid default publishable entry and uses legacy anon only when the dictionary variable is absent. Empty/malformed explicit configuration fails closed; do not mask it with a legacy fallback. Do not try to add custom `SUPABASE_*` secrets: that prefix is reserved. The new custom secret is `PUBLIC_PROJECTS_ROLE_JWT`, entered by the operator in the Dashboard only after issuance is authorized. It is a project Edge secret, not a website variable. Where supported, MCP `create_edge_function_secret` requests Dashboard entry by name; it must never receive the value.
5. **Authorize and verify actual rollout separately.** Check for an existing function of the same name before any deployment. Deploy only the reviewed source closure with the function-specific public gateway setting. Verify native compilation, PostgREST role switching, public GET/OPTIONS, sanitized errors and all no-store headers against approved public owners without logging payloads or credentials. Confirm renewal and rollback ownership before enabling website consumers. The completed rollout evidence and unexercised live cases are recorded above. Each website's configuration/deployment remains separately authorized launch work, not a blocker for this approved R1 scope.

Official references: [MCP capabilities and secret entry](https://supabase.com/docs/guides/getting-started/mcp), [Edge environment variables](https://supabase.com/docs/guides/functions/secrets), and [JWT signing keys and custom tokens](https://supabase.com/docs/guides/auth/signing-keys). Platform guidance does not establish the current project's signing-key state.

## Frozen reader contract

- Import from `supabase/functions/public-projects/reader.ts`; `PublicProject`, `ReaderConfig` and `ReaderDependencies` are exported types. UID is one UUID, normalized to lowercase, and selects any owner's public content without visitor authentication.
- Pass trusted runtime configuration: `SUPABASE_URL` (canonical HTTPS `<20-character-project-ref>.supabase.co` origin, optional trailing slash), optional `SUPABASE_PUBLISHABLE_KEYS` (JSON dictionary), legacy `SUPABASE_ANON_KEY` and mandatory `PUBLIC_PROJECTS_ROLE_JWT` (JWT with `public_projects_runtime` claim). No URL/key overrides from visitors and no privileged-key fallback.
- Infrastructure `apikey` selection: when `SUPABASE_PUBLISHABLE_KEYS` is present, parse it as unknown JSON and require a string `default` with prefix `sb_publishable_` and a nonempty ASCII letters/digits/underscore/hyphen suffix. Other dictionary entries are not selected. Whitespace, controls, secret keys, JWTs, missing/default-invalid values, arrays and malformed/empty JSON fail before fetch, even with a valid legacy anon key. Only an absent dictionary permits `SUPABASE_ANON_KEY`, which must remain an `anon` JWT.
- `Authorization` always uses the separate restricted `PUBLIC_PROJECTS_ROLE_JWT`, never the publishable or legacy infrastructure key. Publishable shape checks do not prove key validity or hosted gateway acceptance; both require separately authorized native/hosted verification.
- Role-claim checks catch configuration mistakes; they do not verify signatures, expiry or database permissions. PostgREST and operator provisioning own those checks. Never put the restricted JWT on a website. Its `PUBLIC_` name does **not** make it public.
- Optional trusted dependencies are `{ fetch: typeof fetch, timeout?: typeof AbortSignal.timeout }`; defaults use native fetch and one shared 10-second deadline. Tests inject only fake RPC responses/signals, never production configuration.
- Every RPC is POST to `/rest/v1/rpc/export_public_projects` with `{p_owner, p_offset, p_limit:200}`, public infrastructure `apikey`, restricted bearer JWT, `cache:'no-store'`, `redirect:'error'` and the shared abort signal.
- Output has exactly `id`, nullable `title/description/weblink`, nullable `originalLanguage` (`es/en/ca`), and `translations` containing only `language` (`es/en/ca`), nullable `title/description`. Positive signed-bigint IDs remain strings. Extra upstream fields are discarded; duplicate translations fail. No state filtering or language fallback occurs.
- Pagination advances by actual count, tolerating lower upstream caps. Offset/limit/count must match; decimal-string totals must stay exact and stable. Totals above 1,000,200, offsets above 1,000,000, zero progress, non-increasing IDs, overflow, invalid JSON/data and upstream errors fail without partial output. Separate pages are not a transactional snapshot.

## Verification evidence and limits

Run with Node 24 and existing dependencies (no secrets):

```sh
node --test tests/public-projects-edge-http.test.mjs
node --test tests/public-projects-edge*.test.mjs
node node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --allowJs --checkJs --allowImportingTsExtensions --module nodenext --target es2022 --lib es2022,dom --skipLibCheck supabase/functions/public-projects/*.ts tests/public-projects-edge*.test.mjs tests/helpers/public-projects-edge.mjs
```

Fixtures cover public Request/Response behavior, reader/RPC contracts (including translations and pagination), publishable preference, legacy compatibility, malformed-config fail-before-fetch, restricted bearer separation, sanitized partial failures, cross-origin headers, freshness and per-request fake entry wiring, not live grants or all-state SQL selection. T1 owns the separate SQL proof. At deployed source `18e9fca`, writer evidence is RED 50 passed/35 failed, GREEN Edge 85/85 plus strict types and full validation 186/186; independent local verification passed 85/85 plus strict TypeScript. Native assess returned `reviewDue=false/under_budget`; no review approval is claimed for that adjustment.

Native Deno remains unavailable locally, but the deployed function has the bounded parent HTTP evidence above. The automated hosted verifier remains unavailable and was not retried; those HTTP results are parent evidence, not automated independent verification. See the [access status](public-projects-access.md#operator-only-gates) and [R1 task log](../odd/tasks/r1-public-projects.md). No existing-app functional or Vercel deployment proof, live multipage/translation coverage or global database hardening is claimed. Token renewal and each website's deployment remain operator work. This documentation closure reran no tests/builds or remote probes.
