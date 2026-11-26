# Project brief

Persistent source of truth for this client copy of base-landing-mocklab: **Calvente Design**. Feature plan and decision log: `odd/tasks/calvente-design.md` (L1–L6). Follow [the kickoff guide](project-kickoff.md); update this file after each answered block and resume from the next unresolved item. This reusable template contains no client answers.

## Status and fixed foundation

- Kickoff status: **in progress**. The client supplied an approved prototype and made the key decisions below; open items stay pending.
- Current implementation slice: **Calvente full site** (home, projects, collections, profile, contact and legal pages), delivered in tasks T1–T6 of the feature doc. T1 (foundation: tokens, fonts, layout, header/footer, page registry, English enabled) is implemented; T2–T6 are pending.
- Fixed technology: Astro + strict TypeScript + Tailwind CSS 4 + semantic tokens + native Astro components.
- Implemented base language contract: Spanish is mandatory and unprefixed; all other languages are optional. For this client English is **enabled** (`enabledLocales` is `es`, `en`); no other language is planned.
- Fixed URL/publication policy: prefixed optional locales, translated slugs, complete approved content only, no silent fallback or automatic translation. Missing optional translations stay unpublished; every page requires Spanish. See [the multilingual guide](i18n.md).

All client-specific entries below are unresolved unless explicitly recorded otherwise. Use **approved**, **proposed**, **pending** or **not applicable** with a reason. Supplied facts can be recorded as confirmed with a safe source; a proposal is not an approval. Do not put secrets, credentials, personal data or actual customer submissions here. Use role/team references and safe asset links.

## Confirmed facts and approved decisions

Fill only from supplied facts or explicit approvals. Record status, safe source and approval reference alongside each answer; leave missing answers pending rather than inventing defaults. See [progressive discovery](project-kickoff.md#progressive-discovery).

| Area | Client answer, status and source/approval |
| --- | --- |
| Business/project identity and offering | **Confirmed.** Calvente Design: bespoke joinery and designer furniture, Seville workshop open since 2005 (Madera y Vidrio and Calvente unified under Calvente Design in 2026). Source: supplied prototype and its copy (feature doc L1). |
| Purpose, audience, primary conversion and success measure | **Confirmed from the prototype copy:** show joinery work for architects and design studios plus the studio's own furniture collections. **Proposed, not yet confirmed:** the primary conversion is a made-to-order enquiry through Contacto. Success measure: pending. |
| First-release scope, exclusions, sitemap/pages and navigation | **Confirmed scope** ("Sí, diseño y textos", L2): Inicio, Proyectos (listing and detail), Colecciones (listing and product detail), Perfil, Contacto, Privacidad, Cookies and Aviso legal. Navigation: Proyectos, Colecciones, Perfil, Contacto. URLs are Spanish at `/…` and English at `/en/…` with translated slugs (decided in feature doc L6). Not in this slice (absent from the feature doc): cart, prices, checkout, the prototype's guest-designer catalogue and admin panel. |
| Additional languages (English and/or others), page-by-language coverage and launch priorities | **Confirmed** (L2, "Español e inglés"): both languages are published, every page in both. No other language is planned. |
| Translation suppliers, content/UI/metadata readiness and approvers | **Confirmed** (L3): English copy missing from the prototype is translated by the development agent. **Pending:** client review of the agent-translated English before launch. |
| RTL design/font/browser review if relevant | Not applicable: no RTL language. |
| Brand guidelines, approved palette, typography and references | **Approved** with the prototype (L2): light and dark palettes, IBM Plex Mono (body), IBM Plex Sans, EB Garamond (serif accents) and Jost, plus the supplied wordmark `logo.png`. Fonts are self-hosted latin WOFF2 under the SIL Open Font License. Dark mode follows the system with a manual toggle in the mobile menu. |
| Assets, usage rights/licensing and restrictions | Prototype photographs and `logo.png` are copied into `src/assets/`. **Pending:** client confirmation of usage rights and of photo credits (several credits are marked "por confirmar" in the prototype). |
| Copy/assets available, missing content, content owner and approver | **Confirmed** (L2): prototype design and Spanish copy are used as supplied. Legal texts: placeholder (lorem ipsum) until the client supplies them (L3). Content owner and final approver: the client; named role pending. |
| Required interactions; integrations only when justified | **Confirmed** from the prototype: home slideshow, project gallery lightbox, product thumbnails, Mobiliario/Iluminación filter, mobile menu, theme toggle. Language switch uses real localized links. |
| Forms if needed: fields, recipient role/provider, success/error flow | **Confirmed** (L2, "Formulario visible, envío pendiente"): contact form (name, email, studio/company, reason, message) and footer newsletter are visible but send nothing and store nothing. **Pending:** recipient role, provider and success/error flow. |
| Data purpose/storage/retention, privacy/consent and legal review owner if relevant | **Pending.** No personal data is collected while the forms do not send. Legal pages hold placeholder text (L3) and block launch. |
| Conditional CMS/booking/payments/auth/analytics requirements | Projects come from MockLab live (L2, L3): owner UUID `6c70b07d-c7fe-4269-9e8f-2dd2ab6cfa5a` via `MOCKLAB_USER_ID` at runtime, never committed. The public endpoint returned no projects when checked (L5), so project pages need an empty state and show only public DTO fields. Products are a local JSON validated at build. Payments, booking and auth: not applicable. CMS: not applicable. Analytics: pending. |
| SEO metadata owner, production domain and indexing intent | **Pending.** Production domain not supplied; Astro `site` stays unset until it is, so canonical and hreflang are omitted. Indexing intent for previews: pending. |
| Migration/old URLs/redirects if applicable | Pending: no existing site or redirects were mentioned. |
| Accessibility, responsive/browser and performance expectations | Pending client expectations. Desktop and mobile review in light and dark mode is a delivery check (feature doc S9). |
| Hosting/domain responsibility, delivery timing and final approver | Pending. The base targets Vercel; domain, timing and approver not supplied. |
| Maintenance owner and handover expectations | Pending. |

## Proposed choices and unresolved items

Keep suggestions separate from approvals. Include only relevant items; do not treat pending rows above as a questionnaire to send all at once.

| Item | Proposed / pending / not applicable, and reason | Affected work / approval needed |
| --- | --- | --- |
| Legal texts (Privacidad, Cookies, Aviso legal) | Pending: placeholder text until the client delivers the real texts (L3) | Blocks launch (T5) |
| Production domain and indexing | Pending: none supplied | Canonical/hreflang, sitemap and launch |
| Newsletter and contact recipient/provider | Pending: forms send nothing | Form delivery slice after launch decision |
| Instagram and LinkedIn links | Pending: icons show a "pending" notice | Header/footer social links |
| Photo credits and image rights | Pending confirmation | Public project and product pages |
| Empty MockLab portfolio | Proposed: render an empty state until projects exist (L5) | T3, client to publish projects |
| Repository initialisation and GitHub | Deferred: `init-client` needs the `gh` CLI; the human chose to continue without it (L4) | Later, before publishing the repository |

### Next unresolved question or block

- Next 1–3 questions: (1) production domain and whether previews may be indexed; (2) recipient/provider for the contact form and newsletter; (3) Instagram and LinkedIn URLs and photo credits.
- Work blocked by these answers: launch, canonical/hreflang, form delivery and the social links.
- Safe work that can continue independently: tasks T2–T6 of the feature doc (home, projects, collections, profile/contact/legal placeholders, verification).

## Next slice and acceptance criteria

Complete with the human before marking this slice ready. See [the approval gate](project-kickoff.md#approval-gate).

- Named slice and included pages/features: **Calvente full site**: home, projects (listing and detail), collections (listing and product detail), profile, contact and the three legal pages, in Spanish and English.
- Approved scope, visual direction and required content/interaction decisions: prototype design and copy approved as supplied (L2); interactions listed above; English translated by the agent (L3).
- Proposed choices awaiting explicit agreement: made-to-order enquiry as the primary conversion; client review of the English copy.
- Blockers and excluded/deferred work: launch is blocked by legal texts, production domain and rights confirmation. Deferred: form delivery, social links, analytics, sitemap/robots and structured data.
- Observable acceptance criteria: feature doc S1–S9 (visual fidelity, routes, languages, live projects, local products, visible forms, placeholder legal texts, minimal JS, `pnpm run validate` plus desktop and mobile browser review in light and dark mode).
- Implementation checks: Node 24.x, pnpm 12.16.1, `pnpm run validate`, the 300-line review of touched files and affected-page browser checks per [AGENTS.md](../AGENTS.md#verification).
- Human agreement reference and readiness for this named slice: design and copy approved in L2 ("Sí, diseño y textos"); implementation in progress. Not approved for launch.

Noncritical pending items may remain visible, but readiness never authorizes affected deferred work. Reopen only dependent decisions and checks when requirements change.

## Separate launch and data permissions

No permission is granted by this blank template or by design approval.

- Deployment/publication authorization, destination, permitted actions and authorizing role: pending; not granted. Design approval does not authorize launch.
- Personal-data collection authorization and review ownership, if applicable: pending; not granted.
- Remaining launch restrictions and required checks: pending.

## Decisions and changes record

Add a short entry after each answered block or change; preserve unrelated approvals.

| Date / conversation reference | Confirmed fact, approval or change | Source / approver role | Affected decisions, checks and next step |
| --- | --- | --- | --- |
| Feature doc L1–L2 | Prototype supplied; design and copy approved as is ("Sí, diseño y textos"); projects live from MockLab, products as local JSON; forms visible with sending pending; Spanish and English | Client, via the human owner | Implemented across T1–T5; browser review in T6 |
| Feature doc L3 | Owner UUID supplied; English translated by the agent; legal texts as placeholder | Client, via the human owner | Review of English copy and real legal texts pending |
| Feature doc L4 | `init-client --apply` could not run (`gh` missing); continue on branch `feat/calvente-design` with identity set manually | Human owner | Initialisation and GitHub left for later |
| Feature doc L5 | Public projects endpoint returned no projects for the owner | Verified by the development agent | Projects pages need an empty state |
| Feature doc L6 | Static pages, SSR only for project routes, local product JSON, theme and font decisions | Development agent (architecture) | Binding for tasks T2–T5 |
