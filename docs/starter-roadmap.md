# Stabilize base-landing-mocklab before reusing it at scale

This is the **internal starter-maintenance backlog**, not a client kickoff obligation, active feature specification or execution checklist. base-landing-mocklab is a sound foundation; stabilize its repeatability and security boundaries before copying it into dozens of independent websites. R2 is **Completed / verified**, including its original absence-check fix and the authorized reusable language-selection extension. R3 is **Completed / verified** after worker validation and parent focused checks. R5 is **Completed / verified** after worker self-verification, parent checks and independent fresh-copy verification. R1 is **Implemented locally / rollout blocked**, with the public Edge path and MOCKLAB-only site configuration verified locally. Its native runtime, hosted permissions and deployment gates remain open. All other R items below remain **Proposed / unstarted**. Recording a recommendation does not authorize implementation, database changes or publication.

## Resume here

1. Read the baseline and evidence limits below; recheck time-sensitive evidence before relying on it.
2. Ask the human to select an R ID and approve its minimal scope, consequential decisions and verification before implementation. No item is automatically selected, even at P1.
3. For selected work, record approval and fresh evidence in the progress log; close only against that item's acceptance checks. Leave unrelated proposals unchanged.

Client-specific decisions belong in the [working brief](project-brief.md), following the [kickoff guide](project-kickoff.md). Missing client answers must not block independent starter maintenance. This Markdown file is the canonical backlog; its full Engram recovery mirror uses the historical project `origo` (retained after the rename to `base-landing-mocklab`), topic `roadmap/starter-hardening`. Refresh that mirror after roadmap changes when Engram is available; client copies do not synchronize automatically.

## Intent and original request

Preserve a staged, resumable plan for an Astro base distributed through GitHub to colleagues building many independent websites with AI assistance, with Vercel as the intended deployment target.

User request, verbatim:

> guarda en engram y en un markdown del proyecto todo esto para afrontarlo poco a poco

User context, verbatim:

> Una vez que tienes contexto del proyecto y que ahora mismo te vuelvo a explicar: la idea es hacer una base en astro y subirla a github para que compañeros se descarguen el proyecto y lo usen como base para hacer webs mediante vibe coding, es decir que la base va a ser reutilizada para decenas de webs, he implementado instrucciones para estilos, buenas prácticas de programación, mmultiidioma, conectar en tiempo real de los proyectos que cada usuario tiene en nuestra base de supabase y SEO. Creo que no se me olvida nada pero necesito que lo revises bien todo y me propongas cosas que veas necesarias teniendo en cuenta la idea, olvidaba decir que los despliegues se harán en vercel

## Current baseline and approved constraints

The audit found a sound native Astro base: semantic Tailwind tokens, real i18n with a shared shell, typed local content, a fixed-tenant server-only public DTO and persistent client kickoff instructions. See [README](../README.md), [AGENTS](../AGENTS.md), [i18n](i18n.md) and [projects](projects.md).

- Keep native Astro, strict TypeScript, Tailwind CSS 4 and the existing Node test runner. Do **not** add React, CMS, authentication, Supabase SDK, monorepo, dark mode or new test frameworks by default.
- Spanish is mandatory at unprefixed `/`; optional locales are OFF by default (English resources are supplied). Translated routes share stable IDs, shell and metadata; no implicit language fallback.
- `MOCKLAB_USER_ID` fixes one owner UUID; `MOCKLAB_PROJECTS_URL` selects the shared public Edge endpoint. Sites hold no database credentials. **All states for that owner are intentionally public**; a draft/state filter is not an unimplemented requirement and must not be introduced silently.
- Public data is exactly `id` (string), `title`, `description`, `weblink`, `originalLanguage`, and `translations` containing only `language`, `title`, `description`. Images, keywords and other metadata are excluded.
- Preserve null/partial translations and unknown original language. Database content languages currently include `es`, `en`, `ca`; the page locale registry is independently extensible. Extra data languages do not automatically enable pages/UI.
- Dynamic data refreshes on each request without a content redeploy, with no-store on success/failure. It does **not** refresh an already-open tab automatically. Static unrelated routes stay static.
- Title/description, `lang`/`dir`, conditional canonical/hreflang and Spanish `x-default` already exist. An unset real production domain and neutral system-font defaults are intentional, not defects.
- The starter intentionally supplies data, not a designed portfolio UI. Brand, typography, page design, extra integrations and launch authorization remain client decisions.

## Evidence snapshot and limits

This section preserves the original parent-provided audit, not a new database or platform audit. Later implementation and verification results are recorded in the progress log. Source pointers identify where to revisit findings; line numbers are snapshot locations and can drift. Database metadata findings have no local SQL artifact and must be revalidated only with appropriate authorization.

| Evidence | Observed in the supplied audit | Limit / attribution |
| --- | --- | --- |
| Focused Node checks | 8/8 passed for projects, dependency and toolchain checks in the audit session | Not rerun for this documentation unit. |
| Previous full suite | Latest previous full run: 28/28 passed | Historical result, not an audit-session or documentation-session rerun. |
| Duplicate page ID probe | Parent's pure process-only fixture accepted two Spanish paths, `/audit-one/` and `/audit-two/`, with the same `audit-duplicate` ID in `publishedPages`/equivalents | No files changed; demonstrates ID ambiguity, not broken current publication. |
| Supabase metadata | Fresh read-only MCP metadata from `galia_dev`; no customer records or secret values read | Grants/policies/indexes only; no live REST credentials or endpoint exploitation tested. |
| Cold install | Earlier worker observed explicit cold frozen-install success | Independent verifier first auto-installed through a version probe, then observed only a warm explicit frozen install; do not conflate these proofs. |
| Platform/browser | No browser or live Vercel deployment verification | Actual platform settings/protections unknown; no ranking, indexing, visual or accessibility guarantee. |
| Scope | Audit made no code or database changes | This persistence unit changes documentation only; no new functional checks, dependency audit or latest-version claim. |

## Proposed work register

Priorities express suggested sequencing: **P1** before broad reuse/publication, **P2** repeatability and maintenance, **P3** measured or client-dependent follow-up. They do not confer permission. Closure checks below are acceptance criteria; observed results are recorded separately in the progress log. R2's original acceptance checks and authorized extension are verified. R3 and R5 are verified; R1 is implemented locally but blocked on rollout proof; other items remain proposed.

| ID | Priority | Status | Minimal outcome | Dependencies / boundary |
| --- | --- | --- | --- | --- |
| R1 | P1 | Implemented locally / rollout blocked | Restricted SQL export, public Edge Function and MOCKLAB-only site consumer | Local validation150/150, independent consumer16/16, native reviews approved; native runtime/hosted permission proof and deployment approval outstanding. |
| R2 | P1 | Completed / verified | Trustworthy absence checks and reusable route-language project selection | Original evidence preserved; opt-in selector and documented SSR composition verified; full suite 33/33, parent focused checks 5/5. |
| R3 | P1 | Completed / verified | Reject duplicate stable page IDs | Full suite 34/34 and parent focused checks 3/3; stricter slug policy NOT selected. |
| R4 | P2 | Proposed / unstarted | Remove inherited client-copy test assumptions | Coordinate with R2/R3, preserve behavioral coverage. |
| R5 | P1 | Completed / verified | Provide one reproducible fresh-copy startup path | Direct Corepack validation 40/40 in original and independent fresh copies; canonical blank template; no hidden local shim. |
| R6 | P2 | Proposed / unstarted | Enforce authored-code typing and file-size policy in CI | R5 for reproducible runner; no new test framework. |
| R7 | P1 | Proposed / unstarted | Prepare safe GitHub distribution and copy maintenance | License/terms and publication need explicit decisions. |
| R8 | P1 | Proposed / unstarted | Resolve or explicitly assess remaining dependency risk | Preserve narrow routing override; separate deployment approval. |
| R9 | P3 | Proposed / unstarted | Decide justified public DTO/language extensions | Confirmed shared/client need; R1 access boundary. |
| R10 | P2 | Proposed / unstarted | Verify a repeatable Vercel handoff | R1/R5/R8 decisions; live platform authorization separate. |
| R11 | P3 | Proposed / unstarted | Select client SEO and quality requirements | Real routes/domain/content and client brief required. |
| R12 | P3 | Proposed / unstarted | Clarify refresh expectations before realtime work | Decision first; no automatic polling/subscription. |
| R13 | P3 | Proposed / unstarted | Measure tenant-query scaling before indexing | R1 access shape; separately authorized DB work only. |

### R1 — Least privilege and deployment trust

**Original finding (historical).** The former server key was not browser-exposed, and endpoint owner/public-field checks worked. However, that privileged key bypassed RLS. The local R1 implementation now removes this key from website configuration. Read-only `galia_dev` metadata showed broad projects SELECT for authenticated users and anon access to rows including coordinates, not owner-only access. Translation tables deny anon SELECT and use owner/admin access. This is a **pre-existing database risk, not a demonstrated base-landing-mocklab endpoint leak**.

**Pointers:** [data access](../src/lib/projects.ts), [public endpoint](../src/pages/api/projects.json.ts), [security guidance](projects.md#configure-one-portfolio), [boundary tests](../tests/projects-boundary.test.mjs).

**Approved local implementation.** The [R1 specification and evidence](../odd/tasks/r1-public-projects.md) record the authorized shared public Edge Function and restricted SQL RPC. Sites use only `MOCKLAB_PROJECTS_URL` and `MOCKLAB_USER_ID`; the Edge runtime holds a separately provisioned restricted-role credential, never a site service-role fallback. UID is a public selector, not authorization: callers may select any owner's public projects. All states remain public. Production/preview credential policy, remote permissions and deployment remain operator decisions under the [access gates](public-projects-access.md#operator-only-gates--all-pending).

**Remaining closure checks.** Verify the intended hosted project, native Deno/PostgREST/gateway behavior, effective privileges and role provisioning before separately authorized deployment. Owner selection must return only the selected owner's public output, but choosing another public owner is intentionally allowed; private-field and write access must remain denied. Record credential ownership, rotation and environment/preview trust policy without secret values. Local SQL fixtures do not establish installed hosted restrictions or global hardening.

### R2 — Correct absence checks and share the route language

**Original finding (resolved).** [tests/i18n.test.mjs](../tests/i18n.test.mjs) audit snapshot lines 35, 95 and 137 checked absence under `dist/en/...`, while the adapter emits under `dist/client/en/...`; [build fixture helper](../tests/helpers/build-fixture.mjs) line 41 identifies actual output. These checks can pass without examining forbidden output. This is not proof that current publication is broken.

**Implemented outcome.** All three negative assertions now use the existing `result.html()` reader, sharing the actual `dist/client/` output root with positive checks. The affected test/helper are checked with `@ts-check` and JSDoc; user-approved `@types/node` 24.19.2 is development-only. No application route or publication behavior changed.

**Closure checks.** A deterministic regression fails when forbidden optional-locale output is present in the real output root, then passes with correct absence; cover disabled language and partial-translation absence without weakening positive route checks.

**Authorized extension (verbatim requests).**

> Vale, vamos a ver hay dos tipos de contenido: el estático que se guarda en json en el proyecto de cada idioma y lo que se trae de supabase (los proyectos). En ambos casos se debe recargar la página con el idioma seleccionado

> Te recuerdo que esto es una base para vibe conding, la idea es dejarlo lo más preparado posible

> pues procede entonces para cerrar R2

**Extended acceptance.** One active route locale drives local content/UI and a typed, pure opt-in project-text selector. Native anchors load full documents. Exact original-language matches win; otherwise select the exact translation, preserving null partials and explicit absence without fallback or mutation. No new portfolio UI, enabled locales, database-language changes, dependencies or privileged runtime changes. Local content remains typed TS, not a requested JSON migration.

**Extension outcome.** `src/lib/project-content.ts` imports only the existing public DTO type and exposes `selectProjectContent`. Copyable SSR guidance reuses the shared shell/current-page equivalents, 404 for unavailable pages, sanitized 503 and all three no-store headers. An isolated fixture builds and type-checks that exact example, then requests Spanish/English HTML and verifies missing translations and subsequent changed project text without rebuilding. Original absence assertions are untouched. Parent readback and focused verification passed; R2 is closed and the full Engram mirror is maintained separately.

### R3 — Validate stable IDs and agree slug policy

**Original finding (resolved and verified).** [src/i18n/pages.ts](../src/i18n/pages.ts) snapshot lines 36–48 did not reject duplicate page IDs with different paths. The parent's process-only probe accepted/grouped both `/audit-one/` and `/audit-two/` for `audit-duplicate`. The new public-build regression reproduced that acceptance before the guard and now verifies rejection. Path-collision protection remains separate and unchanged.

**Minimal proposal.** Reject duplicate IDs before publication/equivalent grouping and add focused behavioral regressions. Separately agree whether a stricter slug format is needed; do not invent a new URL policy implicitly.

**Closure checks.** Observe a duplicate-ID regression fail before the fix; then verify explicit rejection even for distinct paths, valid distinct IDs/equivalents, and existing path-collision behavior. If slug validation is selected, record accepted/rejected examples and regression evidence against the agreed policy.

**Selected scope.** User request, verbatim: “Vale, procede con R3 pero antes explicame en que consiste la corrección”. The parent explained the duplicate-ID ambiguity before implementation. Only exact duplicate page-entry IDs are rejected, using `[i18n] Duplicate page ID <id>.` before translation flattening. Multiple translations of one entry remain valid. No ID normalization/format rules or stricter slug policy were selected; dependencies, routes and other diagnostics are unchanged. Worker and parent verification evidence is below; the duplicate-ID correction is closed.

### R4 — Make tests reusable across client copies

**Finding.** Several [i18n tests](../tests/i18n.test.mjs) hardcode base-landing-mocklab/default Spanish copy. Correct client renaming or customization can break inherited expectations. The shared [build smoke tests](../tests/build.test.mjs) already derive identity from site configuration; preserve that useful pattern.

**Minimal proposal.** Derive identity expectations from configuration where that relationship is the contract; use explicit stable fixtures for publication/translation behavior instead of assuming client content.

**Closure checks.** A legitimate site-name/default-copy change passes inherited contract checks; intentionally broken identity linkage, metadata or translation publication still fails. Do not remove assertions merely to accommodate customization.

### R5 — One fresh-copy startup and non-secret configuration path

**Original finding (historical, resolved).** [package.json](../package.json) already pinned Node 24.x and `packageManager` pnpm 12.16.1, but audit snapshot script lines 12–13 nested pnpm. An outer Corepack 12 invocation could execute global pnpm 10 through nested PATH. An earlier proof's generated ignored local shim was not distributed. At audit time the [README quick start](../README.md#quick-start) documented that prerequisite and a Corepack-only sequential alternative; R5 replaces the workaround with direct reproducible scripts.

The original audit reported a zero-byte environment-example file while [projects configuration](projects.md#configure-one-portfolio) supplied an inline template and claimed no example existed. Those are historical observations, not the current state. During R5 the human supplied the canonical blank example; sanitized functional checks validated it without printing values. Agents did not edit the protected file or access real `.env` credentials.

**Selected implementation.** `test` now runs build → tests and `validate` runs check → build → tests with direct local Astro commands, never nested pnpm. Node 24/pnpm 12.16.1, dependencies, lockfile and scoped routing override are unchanged. The README uses one Corepack startup path; the human-owned blank `.env.example` is the single canonical template, linked from the projects guide instead of duplicated values. Static development/check/build/tests need no credentials. Worker, parent and independent risk-5 verification evidence is recorded below; R5 is closed against its acceptance checks.

**Closure checks.** On a genuinely fresh copy, explicitly run a frozen install **before** any `pnpm exec` version probe, since exec can auto-install dependencies. Verify exact Node/pnpm and validation without credentials, hidden generated tools or global changes. Distinguish earlier worker cold-frozen evidence from the independent verifier's auto-install-then-warm-frozen evidence. Confirm configuration documentation is consistent and contains no secrets.

### R6 — Close policy enforcement gaps with existing tools

**Finding.** Effective TypeScript options inherited through [tsconfig.json](../tsconfig.json) were `strict: true`, `allowJs: true`, `checkJs: false`; nine JS files were in the program. Only [astro.config.mjs](../astro.config.mjs) used `@ts-check`; eight tests/helper MJS files were unchecked. The 300-line rule in [AGENTS](../AGENTS.md#file-size-and-completion-checks) was manual, with no CI or `.github` found. All 21 authored source/test files were at most 185 lines: **no existing cap violation**.

**Minimal proposal.** Type-check authored MJS via TypeScript or checked JSDoc; add a simple physical-line check with explicit justified exceptions and generated/lockfile exclusions. Add CI for exact Node 24/pnpm 12, frozen install, type check, build and existing Node tests. A future `.github` workflow is proposed, not an existing artifact.

**Closure checks.** Deliberate authored-JS type errors and an unjustified >300-line fixture are detected; justified exclusions remain narrow. CI performs explicit frozen installation before exec probes and runs existing checks on a fresh checkout. Preserve behavioral coverage without introducing a framework/tool wishlist.

### R7 — Distribution, provenance and update ownership

**Finding.** The audit found no LICENSE or `.github`, and an unborn `main`. Essential new API, pnpm locks, tests and docs were untracked; older staged npm-lock/gitkeep entries reflected working-tree deletions. See [copy instructions](../README.md#start-a-new-website). This is a snapshot, not an instruction to repair or publish Git state now.

**Minimal proposal.** Before separately authorized GitHub publication, choose license/internal-use terms and template-repository settings; review the intended complete tree and secret exclusions. Define version/tag/base provenance and security update/backport instructions for independent copies, which do not inherit starter improvements automatically.

**Closure checks.** Human approves terms, distribution model and maintenance owner; intended publication tree includes required API/lock/test/doc files and excludes secrets/generated output. Document how a copied site identifies its base version and receives/adapts security fixes. Publication permission remains separate; this roadmap performs no staging, commits or publishing.

### R8 — Preserve dependency mitigation and track unresolved tooling risk

**Finding.** Keep the narrow [pnpm workspace override](../pnpm-workspace.yaml) for `@vercel/routing-utils>path-to-regexp` 6.3.0 and its [compatibility test](../tests/projects-dependencies.test.mjs). The prior bundled-Zod trusted-tooling advisory remains unresolved. Historical inspection found no endpoint reachability and excluded the affected tooling from the generated function; that is candidate-specific evidence, **not a clean dependency-tree claim**.

**Pointers:** [dependency security limitation](projects.md#dependency-security-limitation) records the historical advisory chain, bundled implementation and why dependency-only overrides or blind adapter downgrades are not demonstrated fixes.

**Minimal proposal.** Track a compatible upstream bundled-code correction or separately evaluated resolution; preserve the scoped routing mitigation and evaluate deployment risk explicitly. No new audit, forced fix or dependency mutation is authorized here.

**Closure checks.** For a future approved resolution, record exact versions/advisory evidence and show the vulnerable bundled implementation is actually replaced or otherwise addressed; run relevant compatibility/build/runtime checks. Until then retain an explicit unresolved status and separately documented deployment-risk disposition, not a false claim of remediation.

### R9 — Extend public data only for confirmed needs

**Finding.** The [exact data contract](projects.md#exact-data-contract) intentionally omits images, keywords and other metadata. It preserves the nested `projects -> project_translation_settings -> project_translations` relation, partial/null content and unknown language. Data languages `es/en/ca` and [page locales](../src/i18n/locales.ts) are independent.

**Minimal proposal.** Only after confirming shared or client requirements, extend a typed public allowlist, runtime validation and tests; never `select *`. Keep client UI implementation in the client copy, not an assumed starter obligation. Align any additional data-language support with explicit presentation/page-locale decisions.

**Closure checks.** Approved fields alone cross the boundary; private fields/other tenants remain excluded. Tests retain string IDs, null/partial translations, unknown language, all-state inclusion and no silent fallback/locale enabling. Any changed publication-state policy requires explicit approval rather than a silent filter.

### R10 — Repeatable Vercel handoff, not assumed live configuration

**Finding.** [deployment guidance](projects.md#build-local-checks-and-deployment-boundary) specifies adapter artifacts/settings, but actual Vercel protections, environment settings and deployments were not audited. Do not treat guidance as applied platform configuration.

**Minimal proposal.** Document/verify the chosen repository layout and authorized target: rootDirectory `.` for an independent repo versus the actual nested project root; Node 24, Corepack/exact pnpm (`ENABLE_EXPERIMENTAL_COREPACK=1` per current guide), frozen install and build; complete functions/routing artifacts rather than static-only upload. Resolve environment values per target, trusted previews, production domain/indexing and redirects.

**Closure checks.** On a separately authorized target, record observed settings and artifact completeness, runtime endpoint/no-store behavior and failure handling without exposing secrets. Verify production versus preview access/indexing and secret trust boundaries. Local handler fixtures do not count as live Vercel proof.

### R11 — Choose client SEO and browser quality work

**Finding.** [BaseLayout](../src/layouts/BaseLayout.astro) already implements metadata/lang/dir and conditional canonical/hreflang/x-default. Sitemap, robots policy, preview noindex, OG/social cards and JSON-LD are **not implemented** merely because [AGENTS SEO guidance](../AGENTS.md#seo-and-indexing) describes them. Neutral fonts/unset domain are intentional.

**Minimal proposal.** Select only relevant client requirements in the brief: real domain, indexable routes, preview policy, redirects, sitemap/robots, social assets or truthful structured data. No install-everything baseline. Project translations do not automatically create detail routes. Any future sitemap containing live project routes must remain fresh without content-only redeploys.

**Closure checks.** For selected features, verify actual canonical routes, enabled/available locale equivalents, statuses, truthful metadata and approved assets. For preview exclusion, verify crawler-readable noindex; robots blocking alone is not reliable deindexing or access control. For live routes/sitemap, verify content changes without redeploy. Perform client browser checks for keyboard/focus, contrast, mobile layouts, images, font loading and layout shift. Neither builds nor metadata guarantee accessibility, performance, rankings or indexing.

### R12 — Clarify “realtime” before adding mechanisms

**Finding.** [refresh contract](projects.md#exact-data-contract) is per-request freshness without redeploy, not automatic changes in already-open tabs. No polling/subscription is installed or required by the approved baseline.

**Minimal proposal.** Ask whether users actually need open-tab updates, what delay is acceptable, and what loading/failure behavior is expected. Preserve per-request behavior if sufficient; consider mechanisms only for an approved concrete need.

**Closure checks.** Record an explicit decision distinguishing request freshness from push/poll refresh. If later selected, approve scope and verify open-tab updates, failure behavior and security/resource boundaries; otherwise record that no mechanism is needed, without claiming implementation.

### R13 — Measure indexing needs, do not migrate automatically

**Finding.** Read-only database metadata showed only the projects ID primary-key index, with no user index. The [data access implementation](../src/lib/projects.ts) filters owner and orders/pages by ID.

**Minimal proposal.** Measure representative tenant-query performance and consider a `(user, id)` index only if supported by the chosen access shape and scale. This is a scaling follow-up, not a required automatic migration.

**Closure checks.** With separate database authorization, record representative plans/timings and workload assumptions; compare costs and benefits of a proposed index. Document the decision even if no index is justified. Any migration/production measurement needs its own approved scope.

## Suggested order and open decisions

Suggested sequence, **subject to human selection**: R2/R3 for trustworthy i18n checks, R5 for repeatable startup, R1/R8 for security/deployment decisions, then R6/R4 for durable enforcement. R7 gates actual distribution; R10 gates an authorized deployment handoff. R9/R11/R12 are need-driven; R13 follows measured scale and R1's access design. Independent documentation/design decisions may proceed separately once selected.

| Decision to resolve | Related IDs | Current position |
| --- | --- | --- |
| Data-owner-approved least-privilege interface and preview trust model | R1, R10 | Pending; current endpoint safeguards are not DB least privilege. |
| Whether stricter slug rules are desired | R3 | NOT selected for this fix; any future slug policy needs separate approval. |
| One non-secret template source and fresh-copy runner | R5 | Selected: human-owned blank `.env.example` and direct Corepack scripts; worker proof passed, parent checking pending. |
| Distribution license/internal terms, template setting, versioning and backport owner | R7 | Pending; GitHub publication not authorized. |
| Disposition/resolution of bundled-Zod tooling advisory | R8, R10 | Unresolved; historical reachability limits do not erase risk. |
| Additional public fields/content languages, client SEO/UI, open-tab updates | R9, R11, R12 | Optional, not default obligations; select only for confirmed needs. |
| Actual Vercel settings/protections and query-scale requirements | R10, R13 | Unknown/unmeasured, not assumed incorrect. |

## Progress and evidence log

This log records persistence separately from implementation. R2's original fix and newly authorized extension passed their closure checks. R3 passed worker and parent checks; R5 passed worker, parent and independent verification. The remaining 10 R items remain unstarted. Earlier blocker entries are historical and superseded by the later verification results.

| Entry | Scope | Evidence / result | Next action |
| --- | --- | --- | --- |
| Initial persistence | Documentation only | Audit captured above; source/doc pointers retained and document links checked. Historical test/install results are attributed, not rerun. | Human selects an R ID; keep the full Engram mirror current after future roadmap changes. |
| R2 authorized implementation | User: “comienza con R2 y dime en que consiste este arreglo” | Replaced three `dist/en/...` absence checks with the existing `result.html()` reader rooted at `dist/client/`. Runtime-only injection of forbidden English/partial-translation HTML in isolated build fixtures: old checks passed 3/3 (exit 0); corrected checks failed 3/3 as expected (exit 1); without injection, focused checks passed 3/3. No application publication code changed. | Finish validation before closing R2. |
| R2 verification blocker | Typing and local toolchain | Added `@ts-check`/JSDoc to the affected test and fixture helper to satisfy authored-code typing. `corepack pnpm check` failed with 11 errors because Node type definitions are absent; build/full suite were not reached. Local `pnpm --version` also fails with ENOEXEC; the documented Corepack sequential validation avoids that runner issue without implementing R5. Native assessment was unassessable due to undeclared pre-existing untracked files; no native review verdict exists. | Human decides whether to add `@types/node` as a development dependency or keep R2 limited to assertion paths with the inherited unchecked-test limitation deferred to R6. No dependency change, commit or publication has occurred. |
| R2 typing-scope approval | User selected “Añadir @types/node” | Added `@types/node` 24.19.2 as a development dependency with the pnpm lockfile. No runtime dependency or publication behavior was intentionally changed. | Complete type/build/test validation and one independent dependency-scope verification. |
| R2 parent verification | Approved assertion and typing scope | `corepack pnpm check && corepack pnpm build && node --test tests/*.test.mjs` exited 0; 28/28 tests passed. Missing Node typing errors are resolved. Focused dependency/toolchain spot check passed 2/2; whitespace checks passed. Authored code files are 191, 52 and 29 lines, below 300. | Independent verification before closure. |
| R2 independent verification and closure | Task `mvwkjm98-1-btwq`; Risk: item 5 (approved development dependency) | In an isolated copy without credentials, inherited dependencies or output: explicit `corepack pnpm install --frozen-lockfile` exited 0 (349 packages reused, zero downloaded; not cold-download evidence), then Node 24.22.1/pnpm 12.16.1, type check (0 errors/warnings, one pre-existing hint), build and 28/28 tests passed, exit 0. Verifier confirmed assertion roots, positive checks, dev-only Node types and preserved routing override. No blockers; 42 original non-secret/non-generated files and Git index hashes unchanged. Mutation results above are parent evidence, not independently rerun. | R2 completed. R3 is the next suggested item, subject to explicit selection. No browser/deployment proof or native review verdict; local pnpm ENOEXEC remains outside R2 under R5. No commits or publication. |

### R2 language-selection extension — completed verification

- Authorization: the three verbatim requests above and the approved narrow reusable-helper/SSR-guidance proposal; no client design or publication.
- RED: `node --test tests/project-content.test.mjs` exited 1 with `ERR_MODULE_NOT_FOUND` for the not-yet-created public selector module.
- GREEN: the same command exited 0, 4/4; `node --test tests/project-content.test.mjs tests/project-language-runtime.test.mjs` exited 0, 5/5, including the exact guide example's isolated type check/build and HTTP fixture.
- Full check: Node 24.22.1 / Corepack pnpm 12.16.1; `corepack pnpm check && corepack pnpm build && node --test tests/*.test.mjs` exited 0, 33/33. Type check: 0 errors/warnings, one inherited numeric-literal hint. Original absence regressions still pass.
- Structural check: scoped tracked whitespace diff and an eight-file whitespace/newline scan passed; new cross-document anchors exist. Authored code totals 218 lines across four new files (20/55/93/50), each below 300; all eight changed files were read back.
- Parent check: read the selector, all new tests/helpers and changed guidance; `node --test tests/project-content.test.mjs tests/project-language-runtime.test.mjs` exited 0, 5/5, including the isolated documented example's type check/build and full-document HTTP requests. Clarified that the server-only restriction applies to `getProjects()`, not the pure selector. No application visual/interaction markup changed, so browser review was not applicable to this extension.
- Review disposition: native assessment was unassessable due to pre-existing untracked files; its plan retained writer verification and required no independent verifier. No native review verdict is claimed. Risk: none for this additive opt-in extension; existing privileged/shared runtime and dependencies were not modified. The earlier Node development dependency had its separate independent verification above.
- Limits and closure: fixture HTTP is not browser, live Supabase or Vercel deployment proof. Global pnpm ENOEXEC remains outside scope under R5. No dependency, owner/public DTO, data-language validator, current route or enabled-locale changes. R2 completed; R3 is the next suggested item, subject to explicit selection. No staging, commits or publication.

### R3 duplicate stable IDs — completed verification

- Authorization and scope: the verbatim request above, after the parent's explanation; duplicate page-entry IDs only. Stricter slug policy NOT selected. Only `src/i18n/pages.ts`, `tests/i18n.test.mjs`, this roadmap and the i18n guide changed in this work unit.
- RED: `node --test --test-name-pattern='duplicate stable page IDs' tests/i18n.test.mjs` exited 1: the fixture build returned 0 where 1 was expected and generated both `/audit-one/` and `/audit-two/` for `audit-duplicate`.
- GREEN / non-regression: `node --test --test-name-pattern='duplicate stable page IDs|translated slugs|colliding published paths' tests/i18n.test.mjs` exited 0, 3/3. The duplicate fixture now reports the exact diagnostic and neither invalid HTML path exists under `dist/client/`. Existing translated-slug checks preserve distinct-ID equivalents and one-entry es/en translations; the existing distinct-ID path-collision diagnostic still passes.
- Full check: Node 24.22.1 / Corepack pnpm 12.16.1; `corepack pnpm check && corepack pnpm build && node --test tests/*.test.mjs` exited 0, 34/34. Type check: 0 errors/warnings, one inherited numeric-literal hint. The after hook confirms original config/content unchanged.
- Limits: isolated public Astro builds and generated-HTML checks only; no production markup/interaction changes, so browser inspection is not applicable. No live services, deployment or native review verdict claimed. Global pnpm ENOEXEC remains outside scope under R5; the authorized Corepack sequential equivalent avoids it without repair. No dependency, Git/index, DTO/security or R2 changes. Risk: none identified for rejecting invalid duplicate entries.
- Parent verification: read the exact-equality guard, regression and changed guidance; reran `node --test --test-name-pattern='duplicate stable page IDs|translated slugs|colliding published paths' tests/i18n.test.mjs`, exit 0, 3/3. Both Git whitespace checks passed; 35 local documentation links/anchors checked. Touched code files are 58/206 lines, below 300.
- Review disposition: native assessment was unassessable due to pre-existing untracked files; its returned plan retained writer verification and required no independent verifier. No native review verdict is claimed. Risk: none for the requested invalid-input guard; no unrequested shared behavior change was identified.
- Closure: R3 completed. R2 remains completed and the remaining 11 items remain proposed; R5 is the next suggested item, subject to explicit selection. Parent maintains the full Engram roadmap mirror. No staging, commits or publication.

### R5 reproducible startup — completed verification

- Authorization, verbatim: “Vale, procede con R5 y al terminar dame de nuevo el resumen y el siguiente paso”. This is starter maintenance only; no client kickoff, dependency/CI changes, Git publication or deployment.
- Canonical template and safety history: agent and approved-parent writes to `.env.example` were blocked. The safer plan made all template edits human-only; no shell/rename fallback or actual `.env` creation was used. Human confirmations included “ya he añadido manualmente al .env.example lo que me has pedido” and finally “Ya está, la plantilla está vacía”. Earlier opaque checks failed; no values were printed. The final sanitized semantic check passed 1/1, exit 0.
- Authorized gate correction: user selected “Corregir la validación de la plantilla (recomendado)”, with effect “Validar nombres y valores vacíos según la sintaxis .env, sin exigir orden ni espacios concretos. Informar solo del tipo de fallo, nunca de valores. Sin modificar .env.example.” A synthetic legitimate reordered/spaced/export/empty-quoted/CRLF fixture failed under the exact-line comparison (exit 1), then passed with Node `parseEnv` (exit 0, 1/1). Missing/extra keys and nonempty values still fail with sanitized classes. A subsequent real-template check reported only `nonempty values`; human emptied it before the final passing check. Comments are not a security gate.
- Script RED: before implementation, `node --test tests/toolchain.test.mjs` exited 1, 0/6; public Corepack script execution hit hostile PATH pnpm and returned 91 for both scripts. Script fixtures now remove inherited `NODE_TEST_CONTEXT` only from the child environment; reporter-independent failure checks passed 4/4. Success/order, all relevant failure stages, exit codes, absence of extra calls and unchanged fixture manifest are checked without installing dependencies in these fixtures.
- Focused GREEN: `node --test tests/toolchain.test.mjs` exited 0, 7/7. Existing Node/pnpm/script pins, scoped routing override and absent npm-lock checks remain. Isolated public `git check-ignore` confirms real environment paths are ignored and the example is distributable, without reading any real `.env`.
- Original-tree proof: `env -u SUPABASE_URL -u SUPABASE_SECRET_KEY -u GALIA_USER_ID corepack pnpm run validate` initially exited 1 at type checking because `parseEnv` returns `Dict<string>`. The annotation now derives `ReturnType<typeof parseEnv>` without assertions. The same direct command then exited 0, 40/40 (baseline 34 plus six additions); 0 type errors/warnings and one inherited numeric-literal hint. No original-tree install, sequential workaround or global pnpm repair.
- Explicit fresh-install chronology: copied 45 distributable source files, retaining the existing blank example by ordinary copy; no `.git`, inherited `node_modules`, `.astro`, `dist`, `.vercel`, actual environment files or ignored local shims. Confirmed `node_modules` absent. FIRST ran `env -u SUPABASE_URL -u SUPABASE_SECRET_KEY -u GALIA_USER_ID corepack pnpm install --frozen-lockfile`, exit 0, before any pnpm exec/version probe. It added 349 packages, **349 reused / 0 downloaded**: fresh source/dependency directory, warm package store, not cold-download evidence. Then `node --version` / `corepack pnpm --version` reported 24.22.1 / 12.16.1; the same direct sanitized `corepack pnpm run validate` exited 0, 40/40, 0 type errors/warnings and the inherited hint. No generated project shim or global mutation. This does not replace or conflate the earlier audit's cold-install versus verifier auto-install history above.
- Integrity: original and fresh-copy SHA-256 remain `81adaafcab373fcaca0c8819f51ecdb935d6ef044cf90573029b9528b6a2863a` for `pnpm-lock.yaml` and `10d744f42d57923b149bd6173b3eab25352df9a0681eb60e321357b7a7eea718` for `pnpm-workspace.yaml`. Worker source/index preservation and structural checks are recorded in the handoff.
- Parent checks: read all changed code and startup/configuration guidance. `env -u SUPABASE_URL -u SUPABASE_SECRET_KEY -u GALIA_USER_ID node --test tests/toolchain.test.mjs` exited 0, 7/7. Both Git whitespace checks passed; authored code counts are 29/71/102 lines, all below 300. The final parent structural check passed 54 local links/anchors and confirmed only R2/R3/R5 completed, with 10 items still proposed.
- Independent verification: task `mw6ltqh2-a-a8zy` reported no blockers after one pass in its own 45-file isolated source copy, with `node_modules` absent before installation. FIRST `env -u SUPABASE_URL -u SUPABASE_SECRET_KEY -u GALIA_USER_ID corepack pnpm install --frozen-lockfile`, then `node --version && corepack pnpm --version`, then the direct sanitized `corepack pnpm run validate`: all exit 0; Node 24.22.1 / pnpm 12.16.1; 40/40 tests with none skipped, 0 type errors/warnings and the inherited hint. Installation reused 349 packages, downloaded 0: independent fresh dependency directory with a warm store, not cold-download proof. No sequential workaround, original-tree install, global repair or extra sweep.
- Independent integrity: 44 non-sensitive source files and Git index hashes were unchanged; copy contents matched after execution. Lock/workspace retained the initial hashes above. The seven toolchain cases, scoped routing compatibility and data/server-client checks passed. The verifier checked 51 local links/anchors. Template validation used only the sanitized functional test, without direct inspection or edits; historical RED belongs to the worker, not the verifier.
- Review disposition and closure: Risk **item 5**, package scripts/toolchain/configuration instructions; independent verification completed. Native assessment was unassessable because of pre-existing untracked files; its plan required the separate verifier, and no native approval is claimed. R5 is **Completed / verified**. R2/R3 remain completed and the remaining 10 items remain proposed. R1 least-privilege access is the next recommended item, subject to selection and separately scoped data-owner authorization; the R8 dependency advisory is still unresolved.
- Limits: no browser check applies to these nonvisual changes. Fixture HTTP/build evidence is not live Supabase/Vercel or deployment proof; no new security audit was performed. Parent maintains the full Engram mirror. No staging, commits or publication.

### R1 — Local implementation verified; rollout remains blocked

- Approval and naming correction are preserved verbatim as S1–S6 in the [feature log](../odd/tasks/r1-public-projects.md). Implementation commits: T1 `48dd038`, T2a `1d7a97a`, T2b `558bb85`, T3a `ee12e21`, T3b `3b77c63`. No remote mutation, push or deployment occurred.
- Local SQL proof: independent62/62 against isolated fake PostgreSQL data. Edge reader/HTTP checks and strict types passed; fake Deno entry wiring is not native-runtime proof.
- Final writer validation: `corepack pnpm run validate` with all old/new project and infrastructure variables unset, exit0,150/150, no skips; types/build passed with two hints. S6 RED2/6 before rename became GREEN6/6. The human-owned blank template passed sanitized checks, without direct agent reading/editing.
- Independent T3b verification:16/16, exit0, no skips,19.296s, covering credential-free fixed-owner reads, freshness, exact errors/status/no-store, localized SSR, server-only rejection and MOCKLAB-only configuration. All touched code files remain below300 lines. Full150/150 was writer-observed, not independently replayed.
- Procedural deviation: the authorized fixture tests copied dependencies into temporary storage through the existing build helper despite the parent's literal no-copy restriction. The run was not mutation-free; no extra setup, cleanup, retry or external-artifact inspection was performed. This is retained separately from the passing code verdict.
- All five implementation slices received native approval and exact acknowledgement. The T3b commit tree exactly matched its reviewed candidate. This documentation-only handoff uses structural checks, not another functional suite.
- R1 is **not closed or deployed**. Native Deno, hosted target identity, effective/default permissions and definer-function exposure, custom-role provisioning/rotation, gateway/PostgREST and real Supabase/Vercel behavior remain unverified. Existing broad management policies and the R8 dependency advisory are not fixed by this feature.
- Next decision: authorize a separately scoped operator rollout preparation for the intended project, establishing identity, privileges and credential ownership before any migration or deployment. Do not infer remote write authority from local implementation approval; never send secret values in the task log or chat.

For future entries, record: selected R ID, explicit human approval and scope, evidence date/context, exact authorized checks and observed results, remaining gaps and the next bounded action. Preserve superseded evidence as historical rather than silently presenting it as current. Do not record secrets, customer records or invented completion.
