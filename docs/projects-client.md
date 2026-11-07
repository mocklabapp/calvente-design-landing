# Standalone public projects client — T3a

`fetchPublicProjects()` is a dormant, credential-free Edge client for R1 S1–S5. It is **not yet wired into `getProjects()`**: the existing Astro consumer and its configuration remain unchanged until T3b. This additive slice does not complete R1 or authorize deployment.

## Activation interface for T3b

Import `fetchPublicProjects` from `src/lib/projects-client.ts` in the existing server-only consumer. Pass trusted runtime configuration, never route/query parameters:

| Proposed site variable | Required value after activation |
| --- | --- |
| `GALIA_PROJECTS_URL` | Exact `https://<20-character-project-ref>.supabase.co/functions/v1/public-projects` URL; no port, credentials, extra path, trailing slash, query or fragment. |
| `GALIA_USER_ID` | One owner UUID, normalized to lowercase by the client. |

The interface is `fetchPublicProjects(endpoint: string | undefined, uid: string | undefined, dependencies?: ProjectsClientDependencies): Promise<PublicProject[]>`. Optional trusted test dependencies are `{ fetch: typeof fetch, timeout?: typeof AbortSignal.timeout }`; production defaults are native fetch and a ten-second deadline. The existing `PublicProject` interface is reused through a type-only import, without an Astro runtime dependency.

No API key or Authorization header is sent and no environment variable is read by this client. T3b must replace the privileged consumer's configuration reads and migrate its fixtures/docs together. The human-owned environment template has not been read or changed in T3a; its eventual site configuration must contain blank `GALIA_PROJECTS_URL=` and `GALIA_USER_ID=` assignments, not a site database key.

## Request and response guarantees

- One GET to the configured endpoint with only `uid`, `cache: 'no-store'`, `redirect: 'error'` and one shared ten-second abort signal. Invalid configuration fails before fetch; every call requests fresh data.
- A successful `200 {projects: [...]}` response is treated as unknown input. The pure `projects-response.ts` parser reconstructs only `id`, nullable `title/description/weblink`, nullable `originalLanguage` and `translations` containing `language/title/description`.
- IDs are strictly increasing, unique positive signed-bigint decimal strings, never converted to Number. Languages are `es`, `en` or `ca`; unknown original language remains null. Duplicate translation languages fail. Null/partial text stays unchanged, with no fallback or state filtering.
- Private extras are discarded. Malformed data, upstream errors, redirects and timeouts reject with exactly `Error('Projects unavailable')`, without partial output or an upstream cause.
- UID selects public data, not authorization. The DTO omits owner identity, so the client cannot independently recheck ownership. The configured shared service owns selection and database pagination; see the [Edge HTTP contract](public-projects-edge.md#http-contract-for-consumers-t3).

## Verification boundary

`node --test tests/projects-client.test.mjs` exercises the exported client using fake fetch responses, with no credentials or live requests. Tests cover exact request/DTO contracts, all-state pass-through, partial translations, bigint limits/order, freshness, unsafe configuration, failures and deadlines. `corepack pnpm check` resolves the existing Astro types when standalone TypeScript cannot resolve `astro:env/server` through the type-only DTO import.

These checks do not prove hosted grants, gateway behavior, deployment or the future Astro activation. T3b must retain server-only imports, fixed-owner selection and all three no-store headers on successful and failed HTTP/SSR responses. Parent-owned full validation and independent verification remain pending.
