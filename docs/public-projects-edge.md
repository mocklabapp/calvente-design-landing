# Public projects Edge Function — local T2a/T2b

The local `public-projects` function exposes public owner-selected projects without caller authentication or site keys. T2a supplies the frozen reader; T2b supplies the HTTP adapter, native entry and function-only public gateway configuration for S1–S5. Nothing here is deployed. T3 has migrated the local Astro consumer to `MOCKLAB_PROJECTS_URL` and `MOCKLAB_USER_ID`; see the [site configuration guide](projects.md).

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

`createPublicProjectsHandler(getConfig, dependencies?)` in `handler.ts` accepts trusted configuration/dependencies for isolated tests. `index.ts` registers it with `Deno.serve`; configuration is read only on valid GETs, from exactly `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `PUBLIC_PROJECTS_ROLE_JWT`. See the frozen constraints below. Sites receive only the shared function URL and owner UUID, never these credentials. No SDK or new dependency is used.

`supabase/config.toml` sets `verify_jwt = false` **only** for `public-projects`, intentionally allowing unauthenticated gateway requests. This local setting changes no hosted permissions. The target `galia_dev` / `mygqfdbloqojffhsurgo` was bound through human-provided MCP configuration; the separately approved restricted SQL export is installed and manually checked. Do not reapply that one-shot migration. Runtime credential provisioning, native gateway/CORS/PostgREST checks and deployment remain separate [operator gates](public-projects-access.md). The latest authorization covers preparation only, not project linking, provisioning, remote invocation or deployment.

`runtime.d.ts` is an explicitly minimal **local structural contract** for `Deno.env.get` and the used one-handler `Deno.serve` overload, not official Deno typings. The unused server return is `unknown`. A Node fixture substitutes a fake global Deno and fetch, imports the entry, checks single registration and per-request environment wiring, then restores globals. It reads no real environment or credentials. Passing this test/type check is **not native Deno or hosted proof**.

## Deployment preparation — not executed

The source manifest under `supabase/functions/public-projects/` is `index.ts`, `handler.ts`, `reader.ts`, `validation.ts` and `runtime.d.ts`. The entrypoint is `index.ts`; preserve the explicit relative imports and its reference to the declaration file. There are no external runtime imports in this closure. This source map does not prove native bundling or Deno compatibility.

1. **Enable the deployment capability, not a deployment.** The current MCP connection enables only Database tools. The operator can retain the project binding and enable Functions:
   `https://mcp.supabase.com/mcp?project_ref=mygqfdbloqojffhsurgo&features=database,functions&read_only=false`.
   Reconnect and inspect the actual tools before using them. Keep human approval enabled; do not add `skip_elicitations`. Changing tool availability is not permission to invoke a write.
2. **Confirm signing prerequisites without revealing values.** In project settings, report the legacy JWT signing-secret status and whether legacy `anon` API keys remain enabled. The current reader rejects opaque publishable keys. Do not create/import/rotate/revoke a signing key or change existing apps' authentication to satisfy this check. Supabase-generated signing keys cannot be exported; if no suitable existing operator-controlled signer is available, pause for a separately scoped decision.
3. **Plan operator-only credential issuance.** The intended token has `role: public_projects_runtime` and a finite `exp`; no visitor account or impersonated `sub` is required for owner-UID selection. Confirm the accepted signer, expiry and renewal owner before issuance. Do not use a service-role token, online JWT generator, SQL token output or chat/MCP arguments containing secret values. A signing key stays outside the Edge runtime.
4. **Use the hosted environment correctly.** Supabase injects `SUPABASE_URL` and the legacy `SUPABASE_ANON_KEY`; verify availability without printing values. Do not try to add custom `SUPABASE_*` secrets: that prefix is reserved. The new custom secret is `PUBLIC_PROJECTS_ROLE_JWT`, entered by the operator in the Dashboard only after issuance is authorized. It is a project Edge secret, not a website variable. Where supported, MCP `create_edge_function_secret` requests Dashboard entry by name; it must never receive the value.
5. **Authorize and verify actual rollout separately.** Check for an existing function of the same name before any deployment. Deploy only the reviewed source closure with the function-specific public gateway setting. Verify native compilation, PostgREST role switching, public GET/OPTIONS, sanitized errors and all no-store headers against approved public owners without logging payloads or credentials. Confirm renewal and rollback ownership before enabling website consumers. None of these hosted checks has run.

Official references: [MCP capabilities and secret entry](https://supabase.com/docs/guides/getting-started/mcp), [Edge environment variables](https://supabase.com/docs/guides/functions/secrets), and [JWT signing keys and custom tokens](https://supabase.com/docs/guides/auth/signing-keys). Platform guidance does not establish the current project's signing-key state.

## Frozen reader contract

- Import from `supabase/functions/public-projects/reader.ts`; `PublicProject`, `ReaderConfig` and `ReaderDependencies` are exported types. UID is one UUID, normalized to lowercase, and selects any owner's public content without visitor authentication.
- Pass trusted runtime configuration: `SUPABASE_URL` (canonical HTTPS `<20-character-project-ref>.supabase.co` origin, optional trailing slash), `SUPABASE_ANON_KEY` (JWT with `anon` claim), `PUBLIC_PROJECTS_ROLE_JWT` (JWT with `public_projects_runtime` claim). Missing/invalid values fail before fetch. No URL/key overrides from visitors and no privileged-key fallback. Publishable opaque keys are not accepted by this contract.
- Role-claim checks catch configuration mistakes; they do not verify signatures, expiry or database permissions. PostgREST and operator provisioning own those checks. Never put the restricted JWT on a website. Its `PUBLIC_` name does **not** make it public.
- Optional trusted dependencies are `{ fetch: typeof fetch, timeout?: typeof AbortSignal.timeout }`; defaults use native fetch and one shared 10-second deadline. Tests inject only fake RPC responses/signals, never production configuration.
- Every RPC is POST to `/rest/v1/rpc/export_public_projects` with `{p_owner, p_offset, p_limit:200}`, public infrastructure `apikey`, restricted bearer JWT, `cache:'no-store'`, `redirect:'error'` and the shared abort signal.
- Output has exactly `id`, nullable `title/description/weblink`, nullable `originalLanguage` (`es/en/ca`), and `translations` containing only `language` (`es/en/ca`), nullable `title/description`. Positive signed-bigint IDs remain strings. Extra upstream fields are discarded; duplicate translations fail. No state filtering or language fallback occurs.
- Pagination advances by actual count, tolerating lower upstream caps. Offset/limit/count must match; decimal-string totals must stay exact and stable. Totals above 1,000,200, offsets above 1,000,000, zero progress, non-increasing IDs, overflow, invalid JSON/data and upstream errors fail without partial output. Separate pages are not a transactional snapshot.

## Verification and remaining gates

Run with Node 24 and existing dependencies (no secrets):

```sh
node --test tests/public-projects-edge-http.test.mjs
node --test tests/public-projects-edge*.test.mjs
node node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --allowJs --checkJs --allowImportingTsExtensions --module nodenext --target es2022 --lib es2022,dom --skipLibCheck supabase/functions/public-projects/*.ts tests/public-projects-edge*.test.mjs tests/helpers/public-projects-edge.mjs
```

Fixtures cover public Request/Response behavior, reader/RPC contracts, sanitized partial failures, cross-origin headers, freshness and fake entry wiring, not live grants or all-state SQL selection. T1 owns that SQL proof and remains unchanged. Native Deno is unavailable locally. The human supplied project-scoped MCP target binding and separately authorized SQL installation; see the [access status](public-projects-access.md#operator-only-gates). Restricted credential provisioning/rotation, native Supabase/PostgREST behavior and Edge deployment remain pending; parent owns full application validation and independent security review. The later T3 migration and final local validation150/150 are recorded in the [R1 task log](../odd/tasks/r1-public-projects.md); they do not complete the pending native-runtime or hosted rollout proof.
