# Use live public portfolio data

base-landing-mocklab provides a server-only `getProjects()` function and a dynamic public `GET /api/projects.json` endpoint for the configured Supabase owner. Native Astro frontmatter is the reusable alternative to a React hook; no React or Supabase SDK is needed. This integration supplies data, not a portfolio design.

## Configure one portfolio

1. Only for live projects, copy the canonical blank [`.env.example`](../.env.example) to `.env` in the project root yourself (`cp .env.example .env`). Fill the URL, owner UUID and private key locally; do not paste credentials into chat or source code. Keep the reusable example empty. All three values are server-only; comments in a file do not enforce that boundary.
2. Follow the [README quick start](../README.md#quick-start): Node 24.x, available Corepack and pinned pnpm 12.16.1; explicitly run `corepack pnpm install --frozen-lockfile`, then `corepack pnpm dev`. Static pages, checks, builds and tests need no credentials. The projects endpoint fails closed until all values are valid.
3. Before an authorized Vercel deployment, configure the same variables separately for each intended environment. Do not deploy merely to test configuration.

| Variable | Local and Vercel treatment |
| --- | --- |
| `SUPABASE_URL` | Non-secret configuration, but server-only. Use the canonical HTTPS Supabase project URL, not a REST path, custom domain, query or fragment. |
| `GALIA_USER_ID` | Non-secret configuration, but server-only. One owner UUID; never taken from browser/query input. |
| `SUPABASE_SECRET_KEY` | Private Supabase secret key, not an anon/publishable key. Use Vercel Secret/Sensitive handling, not ordinary visible configuration text. |

Vercel supports [Sensitive environment variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables) for Production, Preview and Development. Configure the environments deliberately; do not expose a production database key to untrusted preview code. Sensitive storage reduces disclosure through configuration access; it does not make malicious application code safe. Never prefix credentials with `PUBLIC_`, commit `.env`, log keys or serialize them into HTML, props or browser bundles. Existing `.gitignore` rules exclude local `.env` files.

A server-side environment key is viable only with trusted code, restricted project access and careful output handling. This key bypasses RLS and has broad database privileges under current grants. The owner filter and returned-field allowlist are application safeguards, not database-enforced least privilege. A dedicated read-only, tenant-scoped export/RPC or service is a later improvement requiring separate database authorization. No database changes are part of this integration.

## Consume in native Astro frontmatter

Use this pattern in a future approved on-demand route (for example its index and rest route), reusing the shared shell. Register approved local page equivalents first, following [the language guide](i18n.md). This is a composition example, not a new starter route or portfolio design:

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.astro';
import { publishedPages } from '@/i18n/pages';
import { getProjects, type PublicProject } from '@/lib/projects';
import { selectProjectContent } from '@/lib/project-content';

export const prerender = false;

// Apply to success AND failure responses from any page using live data.
for (const name of ['Cache-Control', 'CDN-Cache-Control', 'Vercel-CDN-Cache-Control']) {
  Astro.response.headers.set(name, 'no-store');
}
const page = publishedPages().find(({ path }) => path === Astro.url.pathname);
if (!page) {
  return new Response('Not found', { status: 404, headers: Astro.response.headers });
}
let projects: PublicProject[] = [];
let unavailable = false;
try {
  projects = await getProjects();
} catch {
  unavailable = true;
  Astro.response.status = 503;
}
---
<BaseLayout page={page} title={page.content.title} description={page.content.description}>
  <main>
    <h1>{page.content.title}</h1>
    <p>{page.content.body}</p>
    <LanguageSwitcher page={page} />
    {unavailable ? <p>Projects unavailable</p> : projects.map((project) => {
      const text = selectProjectContent(project, page.locale);
      return <article data-content-source={text.source}>
        {text.source === 'missing' ? null : <>
          {text.title !== null && <h2>{text.title}</h2>}
          {text.description !== null && <p>{text.description}</p>}
        </>}
      </article>;
    })}
  </main>
</BaseLayout>
```

The **route** must export `prerender = false`; importing the function inside a component does not change the parent route's rendering mode. Calling it from a prerendered page would fetch at build time, defeating live updates and potentially requiring build credentials. Existing pages remain static and unchanged. Keep these three no-store headers on any SSR page that renders live portfolio data, including its error response; `getProjects()` cannot set the calling page's headers for you.

### One route language for both content sources

Local copy lives in typed `src/data/pages.ts`, not JSON; no migration is needed. The URL lookup above supplies **one `page.locale`** for local body, UI, metadata and project selection. `LanguageSwitcher` uses ordinary equivalent-page anchors: following one loads a complete new document and fetches current projects again. No SPA router, language persistence, automatic translation or open-tab refresh is added.

`selectProjectContent(project, language)` is pure and imports only the `PublicProject` type, never privileged runtime code. It returns `{ language, source, title, description }`: exact original matches win, otherwise an exact translation is selected; absence returns `source: 'missing'` with both fields null. Unknown original language is not Spanish. Partial selected fields stay null; there is no per-field fallback, trimming or synthesis. Arbitrary exact keys are supported, but this does **not** extend the database validator or publish site locales.

The example explicitly renders no text for `missing`, leaving an empty article marker; it does not discard the DTO. Choose the client's approved absence/partial/error presentation in their copy. The fixed sanitized 503 message is a technical example, not approved translated client UI. Do not fill missing fields from originals or leak error details. An unavailable localized page returns 404 rather than another language's content. Existing routes that do not use live projects remain static.

Import `getProjects()` only in server frontmatter or server modules. Never import it in an Astro `<script>` or other browser module: its `astro:env/server` dependency causes Astro to reject client builds. The pure `selectProjectContent()` helper does not import that privileged runtime. A React-style client hook is unnecessary in this native-component stack.

## Consume from the browser

A custom browser component can call the public endpoint without any Supabase credentials:

```js
async function loadProjects() {
  const response = await fetch('/api/projects.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Projects unavailable');
  const { projects } = await response.json();
  return projects;
}
```

Success is `200` with `{ "projects": [...] }`; an empty portfolio returns an empty array. Missing/invalid configuration, upstream errors, timeout or invalid data return `503` with `{ "error": "Projects unavailable" }`. All endpoint responses set `Cache-Control`, `CDN-Cache-Control` and `Vercel-CDN-Cache-Control` to `no-store`. Query parameters cannot change the owner, URL or key. The endpoint is intentionally public, not authenticated; every returned field must be approved for public distribution. Render text safely rather than injecting descriptions as raw HTML, and validate external URLs before making clickable links.

## Exact data contract

The return value of `getProjects()` is `PublicProject[]`; the endpoint wraps the same array in `projects`. Only these fields are returned:

| Field | Meaning |
| --- | --- |
| `id` | Decimal string from Postgres bigint via `id::text`; do not convert to Number. |
| `title`, `description`, `weblink` | Original project values, each string or null. |
| `originalLanguage` | `es`, `en` or `ca` when settings exist; null means unknown. |
| `translations` | Array of objects with **only** `language`, `title`, `description`; content fields may be null. |

This intentionally small initial allowlist supports text/link composition without promising all database columns. Images (`image_data`), keywords, map coordinates and other portfolio fields are not fetched or returned. Prompt, NAS folder, owner UUID and internal automation/assignment metadata are not public output. Extending the contract requires a separately reviewed allowlist, validation and tests.

- All projects belonging to the one environment UUID are included, regardless of state. There is no draft/published filter. Never use a query parameter to select another tenant.
- The verified relation is `projects -> project_translation_settings -> project_translations`, not a direct projects/translations join. Settings connect using `project_id`; translations use the settings' `project_id` and `original_language` relationship.
- Missing settings remain `originalLanguage: null` and `translations: []`; Spanish is not inferred. Settings without translations preserve the known original language and an empty array.
- Partial translations remain partial: a null title or description stays null. No locale fallback, translation synthesis or automatic locale enabling occurs. Database content languages (`es`, `en`, `ca`) are independent of the site's enabled-page locale registry; the existing [i18n contract](i18n.md) still governs routes and UI.

Each call reads runtime configuration, fetches with no-store and rejects redirects before credentials can follow a foreign host. Owner values and received data are checked before returning the allowlisted shape. Requests use ascending bigint IDs, pages of up to 200 and exact counts to avoid silently stopping at an upstream row cap. A shared ten-second abort signal bounds upstream fetching. Errors expose no raw upstream details. There is no cross-request data cache, ISR or persistent caching. Pagination is not a transactional snapshot across simultaneous database edits; very large portfolios can time out rather than return a knowingly truncated result.

Dashboard content changes appear on subsequent requests to the dynamic endpoint or an on-demand page without rebuilding. Already open browser components must fetch again to observe changes; no realtime subscription or polling is installed. Configuration/code changes still follow the normal deployment lifecycle.

## Build, local checks and deployment boundary

The official `@astrojs/vercel` adapter supports Astro 7. Before an authorized deployment, select Node.js 24.x in Vercel Project Settings (the package's `engines.node: 24.x` selects this major), set `ENABLE_EXPERIMENTAL_COREPACK=1` to honor the exact `packageManager` version, and use `corepack pnpm install --frozen-lockfile` and `corepack pnpm build` for install/build commands. These are required platform settings to check, not changes made remotely or proof of a live deployment. Static output is in `dist/client/` and copied to `.vercel/output/static`; Vercel functions and routing metadata live under `.vercel/output/`. Uploading static assets alone cannot serve the dynamic endpoint. Do not copy `.vercel/` into a new client project.

`corepack pnpm preview` is **not supported** by this adapter and exits with an explanatory error. Use `corepack pnpm dev` for local interactive work. The automated runtime test wraps the built Vercel handler in local HTTP with fake upstream responses; it is not a Vercel deployment emulator or proof of live platform behavior.

`corepack pnpm run validate` checks types, builds without real configuration, and runs identity/styling, multilingual, data/security, dependency-compatibility and public-HTTP tests. Fixtures never call live Supabase. Coverage includes owner isolation, all-state inclusion, absent/partial translations, nested relation selection, pagination, sanitized failures, no-store, runtime changes without rebuilding and client-import rejection. Neither a passing build nor these tests prove live Supabase grants, Vercel configuration or visual approval.

### Dependency security limitation

A narrow pnpm override in `pnpm-workspace.yaml` (`'@vercel/routing-utils>path-to-regexp': '6.3.0'`) pins `@vercel/routing-utils`'s `path-to-regexp` dependency to **6.3.0**, addressing the reported backtracking advisory without a major API change. A focused test compares expressions, keys and options to routing-utils' own patched 6.3.0 alias, including adjacent parameters; the adapter build/runtime tests protect integration compatibility.

The remaining Zod advisory is **unresolved**: the available `@vercel/cli-config` 0.3.5 pins Zod 4.1.11 and its distributed runtime also bundles that version. Merely overriding the declared dependency to patched Zod would not replace the bundled implementation. The historical npm-based integration audit (before the pnpm migration), `npm audit --json`, exited 1 with **five high findings**, all from that Zod dependency chain; the routing advisory is gone.

Independent isolated verification found no reachable path from this public endpoint to the vulnerable bundled parser: the generated function excludes `@vercel/functions`, `@vercel/oidc` and `@vercel/cli-config`, while its separate Astro Zod is 4.6.7. The inspected CLI-config parsers consume local configuration/authentication JSON, and their application schemas do not define constrained collection validators. This is evidence about this generated candidate, not a clean dependency tree or a guarantee for future adapter features. The trusted-tooling advisory remains unresolved.

The installed adapter is 11.0.17. The initial audit's suggested adapter 8.0.4 requires Astro 5, not Astro 7. After the routing correction, audit instead suggests adapter 11.0.8: it supports Astro 7, but its declared `@vercel/functions: ^3.4.3` range still permits the currently vulnerable chain, so downgrading the adapter alone is not a demonstrated fix. No downgrade or Zod override was applied. Do not use forced audit fixes or claim the dependency tree is clean. A compatible upstream correction replacing the vulnerable bundled implementation, or another separately evaluated and tested resolution, remains necessary; deployment approval must explicitly account for this unresolved dependency risk.

## Client kickoff checklist

Alongside the [kickoff guide](project-kickoff.md) and [working brief](project-brief.md), confirm:

- [ ] The exact public portfolio owner UUID and approved public content, including every state.
- [ ] Which current allowlisted fields and partial translations the page should present, without implicit language fallback.
- [ ] Server-rendered versus browser-fetched composition, refresh behavior and failure presentation.
- [ ] Environment ownership, trusted preview access and acknowledgement of the privileged-key/dependency risks.

Client design, additional data fields, authentication, database changes and deployment remain separate approvals. Return to the [README](../README.md) for starter setup.
