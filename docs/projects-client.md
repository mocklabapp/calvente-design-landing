# Public projects client and Astro activation — T3a/T3b

`getProjects()` now delegates to the credential-free `fetchPublicProjects()` Edge client for R1 S1–S6. The server-only boundary is retained. The portfolio extension adds normalized images/category/year while preserving text-only construction compatibility. It is deployed on the authorized shared `galia_dev` service; [hosted evidence](public-projects-edge.md#portfolio-rollout) is separate from each website's deployment, which this work does not authorize.

## Site configuration

The server wrapper reads both values through `getSecret` on every call, never from route/query parameters:

| Site variable | Required value |
| --- | --- |
| `MOCKLAB_PROJECTS_URL` | Exact `https://<20-character-project-ref>.supabase.co/functions/v1/public-projects` URL; no port, credentials, extra path, trailing slash, query or fragment. |
| `MOCKLAB_USER_ID` | One owner UUID, normalized to lowercase by the client. |

The interface is `fetchPublicProjects(endpoint: string | undefined, uid: string | undefined, dependencies?: ProjectsClientDependencies): Promise<NormalizedPublicProject[]>`. Optional trusted test dependencies are `{ fetch: typeof fetch, timeout?: typeof AbortSignal.timeout }`; production defaults are native fetch and a ten-second deadline. `NormalizedPublicProject` extends `PublicProject` with required `images`, `category` and `year`. Those additions are optional on `PublicProject` so existing text-only objects remain valid. Type-only imports avoid an Astro runtime dependency.

No API key or Authorization header is sent and no environment variable is read by the pure client; the wrapper alone reads configuration. There is no fallback to old site variable names or Supabase credentials. The human-owned template must contain blank `MOCKLAB_PROJECTS_URL=` and `MOCKLAB_USER_ID=` assignments only; agents do not read or edit its contents. The semantic test reports only safe mismatch classes. See [setup and migration](projects.md#configure-one-portfolio) for the operator-owned configuration change.

## Request and response guarantees

- One GET to the configured endpoint with only `uid`, `cache: 'no-store'`, `redirect: 'error'` and one shared ten-second abort signal. Invalid configuration fails before fetch; every call requests fresh data.
- A successful `200 {projects: [...]}` response is treated as unknown input. The pure `projects-response.ts` parser reconstructs only `id`, nullable `title/description/weblink`, nullable `originalLanguage`, `translations` containing `language/title/description`, ordered `images` containing only `url`, and nullable text `category`/`year`. It receives the validated endpoint origin, never a host taken from the response.
- IDs are strictly increasing, unique positive signed-bigint decimal strings, never converted to Number. Languages are `es`, `en` or `ca`; unknown original language remains null. Duplicate translation languages fail. Null/partial text stays unchanged, with no fallback or state filtering.
- Missing legacy additions normalize to `[]`/`null`; present null images, nonarrays, malformed entries or non-text category/year reject the entire response. `project-images.ts` validates trusted-origin public `projects-images` and `user-media` object URLs, rejecting credentials, ports, query/fragment, signed/private paths and traversal while preserving valid encoded names. No images are silently filtered. See the [exact contract](projects.md#exact-data-contract).
- Private extras are discarded. Malformed data, upstream errors, redirects and timeouts reject with exactly `Error('Projects unavailable')`, without partial output or an upstream cause.
- UID selects public data, not authorization. The DTO omits owner identity, so the client cannot independently recheck ownership. The configured shared service owns selection and database pagination; see the [Edge HTTP contract](public-projects-edge.md#http-contract-for-consumers-t3).

## Verification boundary

`node --test tests/projects-client.test.mjs` exercises the exported client using fake fetch responses, with no credentials or live requests. Tests cover exact request/DTO contracts, all-state pass-through, partial translations, bigint limits/order, freshness, unsafe configuration, failures and deadlines. `node --test tests/projects-portfolio.test.mjs` exercises the same new-field/URL matrix against both site and Edge, including old responses, ordered projection, malformed additions, encoded object names and later-page rejection. Both commands are non-writing fixture checks; full validation and isolated SQL checks remain separate. `corepack pnpm check` resolves the existing Astro types when standalone TypeScript cannot resolve `astro:env/server` through the type-only DTO import.

`tests/projects.test.mjs` verifies the real wrapper/API with an isolated runtime environment bridge: only two configuration reads, fresh public requests, ignored visitor overrides and no secret fallback. HTTP/SSR fixtures now serve `{projects: DTO[]}` and retain all three no-store headers, locale selection and client-import rejection. Database owner selection and capped pagination remain covered by T1/T2a, not duplicated as site REST logic.

These checks do not prove native Deno, hosted grants, gateway behavior or deployment. Operator rollout gates and parent-owned independent verification remain required; local T3b activation is not R1 closure.
