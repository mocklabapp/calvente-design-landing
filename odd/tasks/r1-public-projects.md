# R1 — Public projects by owner UID

Develop a shared public Supabase Edge Function and migrate the Astro server consumer.
Local implementation only; live permission changes and deployment require separate authorization.

## Specs

S1. Read-only websites: “no, las webs que se vayan a crear unicamente van a mostrar los proyectos, no habrá nada de edición”.
S2. Simple owner selection: “Vamos a ver, no te compliques. La idea es que la web de un usuario lea sus proyectos alojados en supabase y ya está, con el uid sería suficiente creo yo”.
S3. Shared function: “entonces que propones? por ejemplo una edge function de supabase? que al invocarla mandando el uid te devuelva los proyectos?”.
S4. Multi-site target: “tienes conexión vía mcp al proyecto galia_dev que es donde quiero alojar la edge function, puedo alojarla ahí aunque el acceso sea desde diferentes webs?”; “es el proyecto de supabase con id mygqfdbloqojffhsurgo”.
S5. Implementation approval: “Vale, procede al desarrollo de R1 con lo que hemos hablado”.

## Tasks

- T1 [S1,S2,S5] done — restricted database export and isolated SQL permission checks; route: bounded writer and independent security verifier; commit: 48dd03859614c5803c6cddbd47197072d80bd915.
- T2a [S1-S5] in_progress — Edge RPC reader, public DTO validation and pagination with focused tests and contract docs; route: writer GREEN 41/41 and strict types, independent verification pending; commit: pending.
- T2b [S1-S5] pending — public HTTP handler, checked Deno entry, gateway config and tests/operator guide; route: bounded writer, independent verification; commit: pending.
- T3 [S1-S5] pending — Astro server consumer and fixtures/docs without site privileged keys; route: bounded writer, independent verification; commit: pending.
- T4 [S1-S5] pending — full validation, independent security checks, native review and accurate rollout handoff; route: parent and independent verifier; commit: pending.

## Log

L1. Original implementation request: “Vale, procede al desarrollo de R1 con lo que hemos hablado”.
L2. Existing contract retained: all owner states public; exact existing public DTO (string id, nullable title/description/weblink, originalLanguage and translations); no private fields, no implicit translation fallback, no-store on success/error, sanitized failures, server-only Astro consumer. No UI, single-project route, visitor auth, per-site credentials, new npm dependencies or unrelated roadmap items.
L3. UID is a public selector, not authorization. Public callers may select another owner's public output. No new per-site isolation claim. SQL permissions must deny internal fields and writes to the new runtime role. Existing management-app permissions are not silently revoked; pre-existing broad access remains a separately scoped risk, preventing claims of global database hardening.
L4. Target is user-declared galia_dev / mygqfdbloqojffhsurgo, not yet technically verified by MCP. MCP exposes SQL tools only, no project identity/deployment tools. Never deploy or apply migrations from generic postgres identity.
L5. Repository baseline clean main at fcc9ac4. Node 24.22.1, node_modules present, Docker running and postgres:17 image available. No psql, Deno or Supabase CLI on PATH. SQL checks may use an isolated local postgres:17 container with fake fixtures only, no host data mounts, real credentials or external services; remove only task-created containers. Do not install tools or pull images without need/approval.
L6. Implementation direction: dedicated restricted runtime role and explicit export function, no site service-role key. Operator-only credential provisioning remains outside this local implementation; no credential values in files/logs. Confirm precise role/RPC contract before handler work. Work units approximately 400 authored lines with code/tests/docs together; each security unit separately verified. All hand-authored code files <=300 lines. Full pnpm validate required. SQL/runtime proof is not hosted Supabase/Vercel proof.
L7. T1 evidence: writer observed missing-migration RED (40 tests, 1 pass/39 failures after role-ready guard), then GREEN and expanded 62/62. Independent verifier ran once, exit 0, 62/62; full parent validate exit 0, 40/40. Native review review-e0c5929f7f7bd93a approved, exact acknowledgement burned authority. Nonblocking informational advisory R3-001 at scripts/test-projects-sql.mjs:151 did not open correction. Commit 48dd03859614c5803c6cddbd47197072d80bd915. Hosted owner-transfer capability and effective PUBLIC privileges remain rollout gates. T2 worker mw6tjtqn-6-ldh0 launched; no live changes.
L8. T2 worker returned interaction_required before edits/tests, estimating 500–650 lines. Parent splits by cohesive behavior, not code versus tests: T2a reader/validation/pagination + tests/docs, T2b HTTP adapter/native entry + tests/docs. Both retain original scope and correction limit; no setup or code correction attempts consumed. Exact focused Node/TypeScript commands supplied in continuation. No human product decision is needed for this internal split.

L9. T2a writer-reported RED: node --test tests/public-projects-edge-reader.test.mjs before module creation, exit 1, 0 passed/1 failed. First implementation attempt: 1/35 due fixture JWT padding; corrected fixtures 36/36; expanded final coverage 41/41. Strict TypeScript initially failed fixture annotations (exit 2), then passed (exit 0). Parent retains attributed worker evidence, not independently replayed RED. Independent focused run 41/41 and strict types passed once; final structural verdict pending. Parent full validate exit 0, 81/81, no skipped tests. No runtime or live deployment proof.
