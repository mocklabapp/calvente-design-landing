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

- T1 [S1,S2,S5] in_progress — restricted database export and isolated SQL permission checks; route: bounded writer (context backstop), independent security verification; commit: pending; writer SQL proof 62/62, independent verification in progress.
- T2 [S1-S5] pending — public Edge handler with UID validation and public DTO, tests and operator guidance; route: bounded writer, independent verification; commit: pending.
- T3 [S1-S5] pending — Astro server consumer and fixtures/docs without site privileged keys; route: bounded writer, independent verification; commit: pending.
- T4 [S1-S5] pending — full validation, independent security checks, native review and accurate rollout handoff; route: parent and independent verifier; commit: pending.

## Log

L1. Original implementation request: “Vale, procede al desarrollo de R1 con lo que hemos hablado”.
L2. Existing contract retained: all owner states public; exact existing public DTO (string id, nullable title/description/weblink, originalLanguage and translations); no private fields, no implicit translation fallback, no-store on success/error, sanitized failures, server-only Astro consumer. No UI, single-project route, visitor auth, per-site credentials, new npm dependencies or unrelated roadmap items.
L3. UID is a public selector, not authorization. Public callers may select another owner's public output. No new per-site isolation claim. SQL permissions must deny internal fields and writes to the new runtime role. Existing management-app permissions are not silently revoked; pre-existing broad access remains a separately scoped risk, preventing claims of global database hardening.
L4. Target is user-declared galia_dev / mygqfdbloqojffhsurgo, not yet technically verified by MCP. MCP exposes SQL tools only, no project identity/deployment tools. Never deploy or apply migrations from generic postgres identity.
L5. Repository baseline clean main at fcc9ac4. Node 24.22.1, node_modules present, Docker running and postgres:17 image available. No psql, Deno or Supabase CLI on PATH. SQL checks may use an isolated local postgres:17 container with fake fixtures only, no host data mounts, real credentials or external services; remove only task-created containers. Do not install tools or pull images without need/approval.
L6. Implementation direction: dedicated restricted runtime role and explicit export function, no site service-role key. Operator-only credential provisioning remains outside this local implementation; no credential values in files/logs. Confirm precise role/RPC contract before handler work. Work units approximately 400 authored lines with code/tests/docs together; each security unit separately verified. All hand-authored code files <=300 lines. Full pnpm validate required. SQL/runtime proof is not hosted Supabase/Vercel proof.
