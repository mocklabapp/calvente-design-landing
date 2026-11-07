# Public projects RPC reader — local T2a

`readPublicProjects(uid, config, dependencies?)` returns `Promise<PublicProject[]>` or rejects with only `Error('Projects unavailable')`. It implements the reader for S1–S5, not an HTTP endpoint or deployed Edge Function. T2b owns Request validation, statuses, JSON wrapping, CORS, three response no-store headers, Deno entry and public gateway configuration.

## Frozen reader contract

- Import from `supabase/functions/public-projects/reader.ts`; `PublicProject`, `ReaderConfig` and `ReaderDependencies` are exported types. UID is one UUID, normalized to lowercase, and selects any owner's public content without visitor authentication.
- Pass trusted runtime configuration: `SUPABASE_URL` (canonical HTTPS `<20-character-project-ref>.supabase.co` origin, optional trailing slash), `SUPABASE_ANON_KEY` (JWT with `anon` claim), `PUBLIC_PROJECTS_ROLE_JWT` (JWT with `public_projects_runtime` claim). Missing/invalid values fail before fetch. No URL/key overrides from visitors and no privileged-key fallback. Publishable opaque keys are not accepted by this contract.
- Role-claim checks catch configuration mistakes; they do not verify signatures, expiry or database permissions. PostgREST and operator provisioning own those checks. Never put the restricted JWT on a website. Its `PUBLIC_` name does **not** make it public.
- Optional trusted dependencies are `{ fetch: typeof fetch, timeout?: typeof AbortSignal.timeout }`; defaults use native fetch and one shared 10-second deadline. Tests inject only fake RPC responses/signals, never production configuration.
- Every RPC is POST to `/rest/v1/rpc/export_public_projects` with `{p_owner, p_offset, p_limit:200}`, public infrastructure `apikey`, restricted bearer JWT, `cache:'no-store'`, `redirect:'error'` and the shared abort signal.
- Output has exactly `id`, nullable `title/description/weblink`, nullable `originalLanguage` (`es/en/ca`), and `translations` containing only `language` (`es/en/ca`), nullable `title/description`. Positive signed-bigint IDs remain strings. Extra upstream fields are discarded; duplicate translations fail. No state filtering or language fallback occurs.
- Pagination advances by actual count, tolerating lower upstream caps. Offset/limit/count must match; decimal-string totals must stay exact and stable. Totals above 1,000,200, offsets above 1,000,000, zero progress, non-increasing IDs, overflow, invalid JSON/data and upstream errors fail without partial output. Separate pages are not a transactional snapshot.

## Verification and remaining gates

Run `node --test tests/public-projects-edge-reader.test.mjs` with Node 24 and existing dependencies. Fixtures cover the public reader interface and captured native RPC Requests/Responses, not live grants or all-state SQL selection. T1 owns that SQL proof.

Follow [restricted export and operator gates](public-projects-access.md) before any hosted change. T1 remains unchanged. Native Deno, hosted target identity, role provisioning/rotation, Supabase/PostgREST behavior and deployment remain unverified; parent owns full application validation and independent security review. T3 sites will use only the shared public URL and owner UUID, after T2b defines the HTTP boundary.
