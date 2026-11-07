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

`supabase/config.toml` sets `verify_jwt = false` **only** for `public-projects`, intentionally allowing unauthenticated gateway requests. This local setting changes no hosted permissions. Before rollout, the authorized operator must verify target identity, apply the restricted export/provision its runtime role, provide the three runtime values securely, and verify native runtime, gateway/CORS and grants under the [operator gates](public-projects-access.md). The user-declared target is `galia_dev` / `mygqfdbloqojffhsurgo`; it has not been machine-verified. No project linking, provisioning, remote invocation or deployment is authorized by this implementation.

`runtime.d.ts` is an explicitly minimal **local structural contract** for `Deno.env.get` and the used one-handler `Deno.serve` overload, not official Deno typings. The unused server return is `unknown`. A Node fixture substitutes a fake global Deno and fetch, imports the entry, checks single registration and per-request environment wiring, then restores globals. It reads no real environment or credentials. Passing this test/type check is **not native Deno or hosted proof**.

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

Fixtures cover public Request/Response behavior, reader/RPC contracts, sanitized partial failures, cross-origin headers, freshness and fake entry wiring, not live grants or all-state SQL selection. T1 owns that SQL proof and remains unchanged. Native Deno is unavailable locally. Hosted target identity, role provisioning/rotation, Supabase/PostgREST behavior and deployment remain unverified; parent owns full application validation and independent security review. The later T3 migration and final local validation150/150 are recorded in the [R1 task log](../odd/tasks/r1-public-projects.md); they do not complete the pending native-runtime or hosted rollout proof.
