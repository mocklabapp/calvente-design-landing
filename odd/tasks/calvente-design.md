# Calvente Design website

Port the approved Calvente Design prototype (`~/Desktop/Calvente Design/index.html`, read-only source with `img/` and `logo.png`) into this Astro starter.
Branch `feat/calvente-design`. Client brief: `docs/project-brief.md`.

## Specs

- S1 — Visual fidelity: reproduce the prototype's approved design and copy "tal cual" (user: "Sí, diseño y textos"): light palette (`--bg #F5EFE4`, `--bg2 #ECE4D5`, `--paper #FAF6EE`, `--tile #E9E2D5`, `--fg #8A3517`, `--fg2 #A4603F`, `--ink #2D2D23`, `--muted #7C7458`, `--oak #B48954`), dark palette (auto via `prefers-color-scheme` plus a manual toggle), IBM Plex Mono (body), IBM Plex Sans, EB Garamond (serif accents), Jost (logo). Colors only in `src/styles/tokens.css`; fonts self-hosted WOFF2 (no Google Fonts request).
- S2 — Routes replace hash routing: Inicio `/`, Proyectos `/proyectos/`, project detail `/proyectos/<id>/`, Colecciones `/colecciones/`, product detail `/colecciones/<id>/`, Perfil `/perfil/`, Contacto `/contacto/`, and legal pages (Privacidad, Cookies, Aviso legal). English equivalents under `/en/` with translated slugs.
- S3 — Languages: "Español e inglés" are both published. Missing English copy is translated by the agent ("los textos en inglés tradúcelos tú").
- S4 — Projects come from MockLab live: "los proyectos vendrán de mocklab". Owner UUID `6c70b07d-c7fe-4269-9e8f-2dd2ab6cfa5a` via `MOCKLAB_USER_ID` (runtime env, never committed). Project routes use `getProjects()` with `prerender = false` and the no-store contract.
- S5 — Products: "los productos será un json que irá en código". The 8 collection products (CD-M01…CD-X01: Arco, Hilo, Aspa, Línea, Grúa, Percha, Lámina, Caja) are local JSON validated at build. The listing has a Mobiliario/Iluminación filter. The detail page shows dimensions, a "Fabricación por encargo" CTA to contacto, and an image with thumbnails. No prices or cart.
- S6 — Forms: "Formulario visible, envío pendiente". The contact form (Nombre*, Email*, Estudio/empresa, Motivo, Mensaje*) and the footer newsletter render but send nothing to any provider and do not store data.
- S7 — Legal texts: "los textos legales deja un lorem ipsum y ya los completo más adelante". Placeholder copy; blocks launch.
- S8 — Interactions keep JS minimal: hero slideshow (auto, dots, swipe, reduced motion), project gallery lightbox (arrows/Escape), product thumbnails, collection filter, mobile menu, theme toggle. Language switch uses real localized links.
- S9 — Quality: `pnpm run validate` passes, with every hand-authored file ≤300 lines. Generated-HTML tests are updated for the client content. Browser review of affected pages on desktop and mobile, in light and dark mode.

## Tasks

- T1 — S1, S2, S3, S9: foundation (tokens, fonts, layout, header, footer, i18n page registry and renderer, EN enabled, assets copied, starter tests adapted). Route: inline. Commit: pending.
- T2 — S1, S8: Inicio (hero slideshow from projects, two entry cards, Taller block). Route: writer. Commit: pending.
- T3 — S4, S8: Proyectos listing, category chips and SSR detail with gallery lightbox. Route: writer. Commit: pending.
- T4 — S5, S8: Colecciones JSON, listing filter and static product detail pages. Route: writer. Commit: pending.
- T5 — S6, S7: Perfil, Contacto (form) and legal pages. Route: writer. Commit: pending.
- T6 — S9: verification and browser review. Route: inline/verify. Commit: n/a.

## Log

- L1 (user, original request): "esto es una plantilla para sacar webs de manera rápida y fluida para una tipologia de clientes, tengo este artefacto de claude: https://claude.ai/artifact/67ECX9wod448dAqykgtHV5#inicio eres capaz de ver todo lo que hay en él e implementar el diseño en la plantilla?" — then: "/Users/miguelangellucenaaguilar/Desktop/Calvente\ Design aquí tienes la web, es la de un cliente".
- L2 (user decisions): new clone + init-client; prototype "Sí, diseño y textos"; "los proyectos vendrán de mocklab pero los productos será un json que irá en código"; forms "Formulario visible, envío pendiente"; "Español e inglés"; legal "Hay textos".
- L3 (user): "este es el uuid 6c70b07d-c7fe-4269-9e8f-2dd2ab6cfa5a y los textos en inglés traducelos tú, los textos legales deja un lorem ipsum y ya los completo más adelante".
- L4: init-client --apply failed before any change ("GitHub authentication unavailable or denied; no changes made."): `gh` is not installed. User chose "Seguir sin inicializar": work on branch `feat/calvente-design`, set the identity manually, and leave init and GitHub for later.
- L5 (evidence): `GET https://mygqfdbloqojffhsurgo.supabase.co/functions/v1/public-projects?uid=6c70b07d-…` returns `count 0` projects today. The MockLab DTO has only id/title/description/weblink/originalLanguage/translations/images/category/year: no studio, location, credits or scope. Project pages therefore show only DTO fields and need an empty state.
- L6 (parent architecture decisions, binding for all tasks):
  - Static by default. Only project routes are SSR: `src/pages/proyectos/index.astro`, `src/pages/proyectos/[id].astro`, `src/pages/en/projects/index.astro`, `src/pages/en/projects/[id].astro` (thin; `prerender = false`; no-store headers). `[...path].astro` keeps generating every other registry page statically and excludes id `projects`.
  - Registry `src/data/pages.ts` has 8 page ids with es/en slugs: home ''/'', projects proyectos/projects, collections colecciones/collections, profile perfil/profile, contact contacto/contact, privacy privacidad/privacy, cookies cookies/cookies, legal aviso-legal/legal-notice. `body` = the page intro paragraph.
  - Home hero slideshow uses LOCAL curated slides (prototype project titles and first images, from `heroSlides`), linking to the projects listing, because live project ids are unknown or empty. The home stays static.
  - Product details are static: `src/pages/colecciones/[id].astro` and `src/pages/en/collections/[id].astro` via `getStaticPaths`; the id is the product id (e.g. `mesa-arco`) in both languages.
  - Images: prototype `img/*` copied to `src/assets/images/`, `logo.png` to `src/assets/logo.png`. `src/lib/images.ts` resolves a file name to `ImageMetadata` via `import.meta.glob` and throws on unknown names. Render with `astro:assets` `<Image>`.
  - Colors: raw values only in `src/styles/tokens.css`. Raw `--cd-*` vars on `:root` with dark overrides (`prefers-color-scheme` when `[data-theme]` is absent, plus `[data-theme=dark|light]`). `@theme static` maps semantic `--color-*` to them; the overlay/scrim/lightbox colors are tokens too. Components use semantic utilities or `var(--color-*)` in scoped CSS; porting prototype CSS into scoped component `<style>` is fine.
  - Fonts: WOFF2 latin subset in `src/assets/fonts/`, `@font-face` in `src/styles/fonts.css` (imported once by global.css), `font-display: swap`. Tokens `--font-mono` (body), `--font-sans`, `--font-serif`, `--font-logo`.
  - Copy ownership: shared chrome strings in `src/i18n/ui.ts` (T1 only). Each feature keeps its own typed es/en copy module inside its component folder, so parallel writers never edit shared files.
  - View stubs owned by later tasks (T1 creates minimal ones, the dispatcher imports them): `src/components/home/HomeView.astro` (T2), `src/components/collections/CollectionsView.astro` (T4), `src/components/profile/ProfileView.astro`, `src/components/contact/ContactView.astro`, `src/components/legal/LegalView.astro` (T5). Each receives `page: PublishedPage`.
  - Theme: saved preference in localStorage key `cd-web-prefs` (`theme`), else follow the system. An inline head script sets `data-theme` before paint. The toggle appears in the mobile menu, as in the prototype.
