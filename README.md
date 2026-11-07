# base-landing-mocklab

A minimal Astro foundation for building multiple independent websites with AI-assisted development. Start here, then adapt each site's identity, content and design without changing the architecture.

## Quick start

Requires Node.js **24.x** (`nvm use`) and an **available Corepack** executable; Corepack is not supplied by this project or guaranteed by every Node installation. `packageManager` pins **pnpm 12.16.1**. Keep `pnpm-lock.yaml` and `pnpm-workspace.yaml`; this is a single-package starter, not a monorepo. No global pnpm installation, Corepack activation or project shim is needed for this path.

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm run validate
corepack pnpm dev
```

Install explicitly before version/exec probes on a fresh copy. After installation, `node --version` should report 24.x and `corepack pnpm --version` should report `12.16.1`. Scripts resolve local Astro binaries directly, without invoking another package manager.

Open the URL printed by Astro (normally http://localhost:4321). Static pages, development, type checks, builds and tests need no credentials. Only optional live portfolio data needs configuration: copy the canonical blank [`.env.example`](.env.example) to a local `.env` yourself (`cp .env.example .env`), then fill it locally following [the projects guide](docs/projects.md). Never put credentials in the example or browser code.

## Commands

| Command | Purpose |
| --- | --- |
| `corepack pnpm dev` | Start the development server. |
| `corepack pnpm check` | Check Astro and TypeScript types. |
| `corepack pnpm build` | Build static pages in `dist/client/` and Vercel functions/routing in `.vercel/output/`. |
| `corepack pnpm preview` | Unsupported by the Vercel adapter; use `corepack pnpm dev` locally. |
| `corepack pnpm test` | Build and test HTML, multilingual builds and the projects integration. |
| `corepack pnpm run validate` | Run type checking, build and all output/i18n/projects tests. |
| `corepack pnpm astro --help` | Show Astro CLI help. |

Other guides may use `pnpm` shorthand: invoke those commands with the same `corepack pnpm` prefix. An existing pnpm installation that already reports exactly `12.16.1` can run the same scripts directly.

## Structure

| Location | Responsibility |
| --- | --- |
| `src/pages/` | Routes: compose layouts and sections, not large reusable components. |
| `src/layouts/` | Shared document structure and metadata. |
| `src/components/ui/` | Small reusable presentation components. |
| `src/components/sections/` | Page-level sections composed from UI components. |
| `src/config/site.ts` | Site name, default description and document language. |
| `src/data/` | Typed local page translations and other approved content. |
| `src/i18n/` | Locale registry, enabled languages, typed UI and publication rules. |
| `src/assets/` | Images and assets imported and processed by Astro. |
| `src/styles/` | Tailwind entry point and shared semantic design tokens. |
| `src/lib/` | Shared non-visual utilities, including server-only portfolio access. |
| `public/` | Files served unchanged, such as favicons. |
| `tests/` | Generated HTML, isolated builds and fixture-backed public data/runtime checks. |

Git does not preserve empty directories. Create directories from this structure as needed when adding files.

## Start a new website

1. Copy this project into a separate directory or repository, excluding `node_modules/`, `.astro/`, `dist/`, `.vercel/`, local `.env`/`.env.*` files (retain the blank `.env.example`), ignored local tools/shims and any `.git/` directory. Retain the package, lock and workspace files.
2. Use Node 24.x, available Corepack and the pinned pnpm. Change `name` in `package.json`; a rename alone does not change pnpm's lockfile. Reuse the lock with `corepack pnpm install --frozen-lockfile`. For intentional dependency/config changes, run `corepack pnpm install --lockfile-only`, inspect the diff and commit the lock alongside the change; do not regenerate it merely to copy the starter.
3. Have your coding host load [AGENTS.md](AGENTS.md), or explicitly request it with the prompt below. Follow [the guided kickoff](docs/project-kickoff.md), recording answers in [the project brief](docs/project-brief.md) before client implementation. If the site uses the portfolio integration, also resolve [its data kickoff checklist](docs/projects.md#client-kickoff-checklist): owner UUID, public fields/states, partial translations and refresh/error presentation.
4. Once the first slice's scope and visual decisions are approved, edit `src/config/site.ts`, replace the favicon/assets and set agreed tokens in `src/styles/tokens.css`. Add native Astro UI and section components as needed.
5. Add approved page translations in `src/data/pages.ts` and enable agreed languages in `src/i18n/locales.ts`. Reuse the shared renderer and `BaseLayout` for localized metadata.
6. Run `corepack pnpm run validate` after the explicit frozen install above. Inspect the site in a browser and obtain separate launch authorization before publishing.

Copy this starter prompt into your coding tool (translate it to your preferred language):

```text
Read AGENTS.md and follow docs/project-kickoff.md to start a new client website.
Reuse my supplied information and docs/project-brief.md, ask only 1–3 relevant
questions at a time in my language, and wait for my answers. Update the brief
after each block. Do not implement client UI until the needed decisions are approved.
```

Spanish is mandatory and unprefixed (`/`). English resources are supplied but OFF by default; all additional languages are optional. Native Astro i18n, typed UI dictionaries and separate typed page content generate only enabled, complete translations with translated slugs and current-page language links. There is no silent fallback or automatic translation. See [the multilingual guide](docs/i18n.md) to enable English or add another language independently.

During kickoff, agree additional languages, page-by-language coverage, translation readiness/suppliers and approvers. Missing optional page translations stay unpublished; Spanish is required for every page. URL prefixes and no-fallback behavior are already fixed by the base.

Markdown does not mechanically launch a wizard in every coding tool: host instruction loading or an explicit request controls whether the interview is followed. To resume, ask the agent to read the brief and continue from its next unresolved item. For starter maintenance or exploration, say so; missing client answers must not trigger an interview or block that work.

Keep the home page's name and description connected to the shared configuration; the smoke tests enforce this convention. Extend those tests if the new site changes that contract.

## Live public projects

Use `getProjects()` from server-only native Astro frontmatter or fetch `GET /api/projects.json` from a browser component. No React hook is required. The environment UUID fixes one owner; all project states are public. The exact return allowlist is `id`, `title`, `description`, `weblink`, `originalLanguage` and `translations` containing only `language`, `title`, `description`; images and keywords are not included. Missing/partial translations are preserved without fallback or enabling site locales.

For a future localized live page, use `selectProjectContent(project, page.locale)` alongside the same published page's local copy/UI. Native language links load the whole selected-language page; missing/partial project text never silently falls back. Follow the [copyable SSR example](docs/projects.md#consume-in-native-astro-frontmatter) and [locale registration/UI/content/enable steps](docs/i18n.md#add-another-language-independently); data languages do not enable site locales.

Routes rendering this data must use `prerender = false` and no-store response headers so dashboard changes appear on subsequent requests without rebuilding. The existing pages remain static. See [the projects guide](docs/projects.md) for examples, runtime setup, security boundaries and the **unresolved bundled-Zod dependency advisory**. This integration does not create a visual portfolio page or authorize deployment.

## Styling contract

**Tailwind CSS 4 + semantic tokens + native Astro components** is the shared foundation. The client's palette is deliberately not decided by this starter.

- `src/styles/global.css` imports Tailwind (including Preflight) and the token file. Do not maintain a second global reset.
- `src/styles/tokens.css` is the single source for the site's theme. Black/white and derived neutral values are technical fallbacks, not an approved brand identity. The default Tailwind color palette is disabled.
- Use semantic utilities such as `bg-canvas`, `text-ink`, `text-muted`, `border-line`, `bg-brand` and `text-on-brand`. Keep raw color values in the token file, not in components.
- Tailwind provides the base spacing, type-size and breakpoint scales. Add project-specific tokens centrally when justified; do not scatter arbitrary values through page markup.
- Keep reusable UI and its variants in `src/components/ui/`, composed sections in `src/components/sections/`, and route composition in `src/pages/`. Keep complete Tailwind class names in source rather than constructing fragments dynamically.
- Use scoped Astro CSS for genuinely custom component behavior; do not duplicate the theme or turn every utility combination into a new abstraction.

Before starting a client design, ask for the palette or brand guidelines. If none exist, propose options and obtain agreement instead of silently choosing a palette. Resolve typography and visual direction in that project's brief as well. Check text, interactive, focus and border contrast after assigning colors; semantic token names alone do not guarantee accessibility.

No component library, sample brand, dark-mode theme or visual direction is imposed. Build concrete components when the first site's requirements justify them.

## AI-assisted changes

The [starter-maintenance roadmap](docs/starter-roadmap.md) preserves the proposed internal backlog for improving this reusable base; it is not a client kickoff obligation. Select and approve an item explicitly before implementation.

Read [AGENTS.md](AGENTS.md) before requesting or applying changes. Describe the goal, affected routes and acceptance criteria. Keep each change focused and run validation afterward.

Astro, strict TypeScript and Tailwind CSS are the foundation. Output is static by default, with the Vercel adapter and one on-demand public projects endpoint. There is no client-side framework, Supabase SDK or analytics. Add further integrations only when a site's requirements justify them.

Set Astro's `site` URL in `astro.config.mjs` once the real production domain is known, before launch. Localized canonical/hreflang links are implemented but omitted while `site` is unset; no domain or sitemap integration is assumed. Locale direction metadata supports RTL markup, not automatic RTL design/font/browser approval.

[Astro documentation](https://docs.astro.build/)
