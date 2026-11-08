# Public portfolio fields
Extend the reusable public project DTO locally with images, category and year.
Authorized rollout: galia_dev / mygqfdbloqojffhsurgo, successor migration and public-projects only. Risk: items 2 and 5 (public-data grants and shared-service deployment).

## Specs
- S1: "Ampliar el contrato público reutilizable para proporcionar los datos necesarios del portfolio, manteniendo compatibilidad con los consumidores existentes y sin exponer filas completas ni información interna."
- S2: "Estado, photoCredit y photoCreditLink lo omites. Haz la corrección" Final scope: images (ordered `{ url: string }` only), category, year; exclude authorship, collaborators and location. The supplied image_data example is a flat array with url, status and processingResult.timestamps. Only url is public output; no grouping or cover is inferred.
- S3: "category y year es text y admiten null"
- S4: "Mantén el propietario fijado por configuración de la web, las cabeceras no-store, la paginación y los errores sanitizados." "Recuerda que el UID selecciona contenido público, no constituye autorización." "Conserva el comportamiento actual de estados e idiomas salvo cambio explícitamente aprobado."
- S5: "No uses select(*) ni claves privilegiadas en las webs." "No reedites ni reapliques una migración ya desplegada; prepara una nueva migración si procede."
- S6: "Añade pruebas RED/GREEN para los nuevos campos, nulos, datos malformados, exclusión de campos internos y compatibilidad con los consumidores actuales." "Ejecuta las comprobaciones del repositorio y documenta el nuevo contrato y sus límites."
- S7: "No despliegues, apliques migraciones remotas ni cambies permisos o secretos sin autorización específica."
- S8: "No deduzcas el idioma del texto ni introduzcas un fallback silencioso."

- S9: "Si, procede de una vez y acabemos con esto" — accepts the immediately preceding proposal to apply the new migration and deploy public-projects in galia_dev (mygqfdbloqojffhsurgo), with schema/recovery checks and hosted response verification. No secret or website deployments.

## Tasks
- T1 [done] S1-S8 | route: bounded writer (parent context backstop) | commit: 2ff8c751463d961e91a58937ede258e113796feb | implement additive contract, fixtures/tests and documentation
- T2 [done] S1-S8 | route: independent verifier (risk item 2) + local validate and SQL checks | commit: 2ff8c751463d961e91a58937ede258e113796feb
- T3 [done] S1-S8 | route: parent native review and local work-unit commit | commit: 2ff8c751463d961e91a58937ede258e113796feb

- T4 [done] S4-S9 | route: parent remote preflight + bounded read-only explorer | commit: pending | confirm target/schema, preserve rollback artifact, validate live data compatibility
- T5 [in_progress] S4-S9 | route: parent authorized remote migration and Edge deployment | commit: pending
- T6 [pending] S4-S9 | route: parent hosted checks and evidence review | commit: pending

## Log
### L1 Original request (verbatim)
Quiero ampliar la integración pública de proyectos en la plantilla base reutilizable, no resolverlo únicamente en la web de e-estudio.

   Lee AGENTS.md, README.md y docs/projects.md. Esto es mantenimiento de la base: no inicies un cuestionario de cliente ni incorpores diseños o contenidos
 específicos de e-estudio.

   PROBLEMA

   Los proyectos se gestionan en Mocklab, en Supabase, y cada web utiliza la función preparada con el UID configurado del propietario.

   Actualmente getProjects() solo devuelve:
   - id
   - title
   - description
   - weblink
   - originalLanguage
   - translations

   Sin embargo, la tabla projects contiene información necesaria para construir un portfolio: image_data (jsonb), category, year, state, photoCredit,
 photoCreditLink, authors, promoter, collaborators, projectCollaborators, googleMaps y showMap.

   También contiene campos internos que no deben exponerse automáticamente: uid, prompt, assigned, nas_folder, requiredAI, publications y otros metadatos
 operativos.

   El problema no es el log: la integración reduce explícitamente la respuesta mediante listas de campos permitidos.

   OBJETIVO

   Ampliar el contrato público reutilizable para proporcionar los datos necesarios del portfolio, manteniendo compatibilidad con los consumidores
 existentes y sin exponer filas completas ni información interna.

   INVESTIGACIÓN

   Revisa la cadena completa:
   - supabase/migrations/202607300001_public_projects_read.sql
   - supabase/functions/public-projects/reader.ts
   - supabase/functions/public-projects/validation.ts
   - src/lib/projects.ts
   - src/lib/projects-response.ts
   - src/lib/projects-client.ts
   - src/lib/project-content.ts
   - Documentación y pruebas asociadas.

   Comprueba dónde se seleccionan, validan y descartan los campos. No asumas que modificar únicamente la interfaz TypeScript recuperará datos omitidos por
 Supabase o Edge.

   Antes de definir el contrato de imágenes, inspecciona un ejemplo autorizado y depurado de image_data. Necesitamos conocer su estructura, orden,
 agrupaciones y cuáles son las URLs realmente públicas. No publiques el JSON completo a ciegas ni registres credenciales, URLs firmadas o rutas internas.

   DECISIONES QUE DEBEMOS CERRAR

   Propón una lista pública mínima:
   - Imágenes mediante una estructura explícita y validada.
   - Categoría, año y estado.
   - Créditos fotográficos y su enlace.

   Consulta antes de añadir autoría, promotores, colaboradores o ubicación. En particular, no publiques localizaciones privadas automáticamente y aclara
 el comportamiento de showMap.

   También hemos observado proyectos con title/description disponibles, pero originalLanguage:null y translations:[].
   Investiga su origen y explica cómo afecta a selectProjectContent(). No deduzcas el idioma del texto ni introduzcas un fallback silencioso.

   IMPLEMENTACIÓN Y VERIFICACIÓN

   Una vez acordado el contrato:
   - Implementa los cambios locales de extremo a extremo con tipos estrictos y validación de datos externos.
   - Mantén el propietario fijado por configuración de la web, las cabeceras no-store, la paginación y los errores sanitizados.
   - Recuerda que el UID selecciona contenido público, no constituye autorización.
   - Conserva el comportamiento actual de estados e idiomas salvo cambio explícitamente aprobado.
   - No uses select(*) ni claves privilegiadas en las webs.
   - No reedites ni reapliques una migración ya desplegada; prepara una nueva migración si procede.
   - Añade pruebas RED/GREEN para los nuevos campos, nulos, datos malformados, exclusión de campos internos y compatibilidad con los consumidores
 actuales.
   - Ejecuta las comprobaciones del repositorio y documenta el nuevo contrato y sus límites.

   La función es compartida por varios clientes: distingue los cambios locales de la actualización del servicio real. No despliegues, apliques migraciones
 remotas ni cambies permisos o secretos sin autorización específica.

   Empieza con el diagnóstico y la propuesta concreta de contrato. Pregúntame solo por las decisiones o muestras de datos que realmente falten.

### L2 User correction
"Estado, photoCredit y photoCreditLink lo omites. Haz la corrección"
User provided two ordered image_data entries, each with url, status pending and processingResult.timestamps. URLs use the public Supabase Storage projects-images bucket. Full asset URLs are intentionally not copied into tracking.

### L3 User schema confirmation (verbatim)
category y year es text y admiten null

### L4 Diagnosis and execution boundary
SQL grants/projection, Edge reconstruction and site reconstruction all require changes. Missing settings can produce unknown original language despite available text; actual production cause unproven. No remote reads or deployment. Previous migration remains unchanged. Old responses normalize absent additions to images: [], category/year: null; SQL null images normalize to []. Present malformed data fails sanitized. Preserve order and strip operational image fields. Branch from clean main; feature commit(s) local only.

### L5 T1 implementation evidence
Worker completed S1-S8 local implementation. RED 0/80; final focused GREEN 238/238 including language selection, exit 0. Two worker correction rounds used; no further worker correction cycle authorized. Historical migration unchanged; git diff --check clean; code files <=300 lines. Full validate and isolated SQL remain T2 checks. Parent assumes artifact-producing verification; worker restrictions unchanged.

### L6 T2 verification evidence
Full validate exit 0: Astro 0 errors/warnings (2 existing bigint fixture hints), build and 301/301 tests. Isolated PostgreSQL 15 successor/ACL/data checks: 75/75 exit 0. Independent verifier: 238/238 focused tests, no actionable code/security defects; S1-S5/S7-S8 pass. S6 GREEN and functional proof pass; RED was observed/reported by writer (0/80), but its supplied ephemeral log is unavailable (ENOENT), so independent RED replay/provenance is not claimed. No requirement mandates independent re-execution of RED; preserve this limitation rather than fabricate evidence. Explicit strict MJS tsc initially lacked Astro ambient declarations (TS2307); including existing .astro/types.d.ts passed with exit 0. All touched code <=300 lines, historical migration unchanged. Native/hosted runtime and real image existence/rights are not established and are outside local scope.

### L7 Close and slice boundary
Local work-unit commit: 2ff8c751463d961e91a58937ede258e113796feb on feat/public-portfolio-fields. One cohesive end-to-end data contract slice: 594 authored diff lines including approximately 115 tracking lines; implementation/tests/docs approximately 479. This exceeds the approximate 400-line target; no code was compressed or tests dropped. Delivery strategy: retain this local cohesive unit; no push/PR/merge authorized. The next commit only records verification/closure, not additional behavior.
Native review consent declined for this exact candidate; lineage_created false, no authority mutation. Outside-view review is skipped, not approved. Independent security verification and local checks completed as L6 records. Risk: item 2 (public-data boundary and SQL column grants). No remote migration, deployment, permission or secret changes. New migration remains local; operational rollout requires separate human authorization. URL validation does not establish image existence or usage rights. RED provenance limitation remains disclosed.

### L8 Remote rollout authorization
Human: "necesito que esto funcione ya, es desesperante"
Accepted proposal: "¿Autorizas aplicar la migración nueva y desplegar public-projects en galia_dev (mygqfdbloqojffhsurgo), el proyecto de las imágenes que compartiste?" Scope includes schema/recovery preflight and real-response verification, not secrets or websites.
Human authorization (verbatim): "Si, procede de una vez y acabemos con esto"
Runtime target evidence: existing public-projects ID e01e10b4-d2c9-4dbc-87d1-814bb77327cf, ACTIVE version 3, verify_jwt false, entrypoint identifies mygqfdbloqojffhsurgo, deployment hash matches historical cc21dadec1b5b015554af1d0c87ed29655edc8811126536af47d134749f06910. Successor migration absent from remote migration ledger. No remote mutation yet.

### L9 Remote preflight discovers actual storage shape
Read-only remote schema proves image_data is PostgreSQL jsonb[] (_jsonb), not jsonb as originally described. category/year are nullable text; server is PostgreSQL15.8. Initial aggregate query failed with 42883 before any mutation. 357 projects contain 2352 image entries: 361 under public projects-images and 1991 under public user-media, all same authorized Supabase origin. Both buckets public=true. Approved owner's 185 images use user-media. No malformed elements, raw query/fragment or other origins/path classes observed. Correct the un-applied successor to normalize with to_jsonb and allow only these two evidenced public buckets at both validators. No stored-data/type mutation, no new DTO fields or private exposure. This correction is required to safely execute S9, not a change of product scope. Source-only old Edge deployment and exact SQL definition/ACL/grants backed up under .git/portfolio-rollout-backup; no credentials or project payloads saved.

### L10 Corrected rollout readiness
Parent-observed RED: SQL72/75 (3 failures22P02 on actual jsonb[]), Node127/132 (5 expected user-media acceptance failures). GREEN: SQL75/75, full validate351/351 with zero errors/warnings (2 existing hints), explicit strict tsc exit0. Independent local verifier PASS S1-S8/readiness S9, focused246/246. Both RED logs inspected. Scope: to_jsonb normalization at validation/projection reads, exact two public buckets at both validators; no stored schema/data conversion. Native assess reviewDue=false under_budget; no extra review started. Original historical migration remains unchanged. Recovery closure5 files validated against historical source; exact RPC definition, ACL and grants retained in local .git backup. Parent pre-deployment hosted8/8 passed and legacy response digest stored without customer payloads. Ready for authorized T5.
