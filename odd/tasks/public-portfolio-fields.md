# Public portfolio fields
Extend the reusable public project DTO locally with images, category and year.
Remote rollout is excluded. Risk: item 2 (public-data projection and restricted SQL grants).

## Specs
- S1: "Ampliar el contrato público reutilizable para proporcionar los datos necesarios del portfolio, manteniendo compatibilidad con los consumidores existentes y sin exponer filas completas ni información interna."
- S2: "Estado, photoCredit y photoCreditLink lo omites. Haz la corrección" Final scope: images (ordered `{ url: string }` only), category, year; exclude authorship, collaborators and location. The supplied image_data example is a flat array with url, status and processingResult.timestamps. Only url is public output; no grouping or cover is inferred.
- S3: "category y year es text y admiten null"
- S4: "Mantén el propietario fijado por configuración de la web, las cabeceras no-store, la paginación y los errores sanitizados." "Recuerda que el UID selecciona contenido público, no constituye autorización." "Conserva el comportamiento actual de estados e idiomas salvo cambio explícitamente aprobado."
- S5: "No uses select(*) ni claves privilegiadas en las webs." "No reedites ni reapliques una migración ya desplegada; prepara una nueva migración si procede."
- S6: "Añade pruebas RED/GREEN para los nuevos campos, nulos, datos malformados, exclusión de campos internos y compatibilidad con los consumidores actuales." "Ejecuta las comprobaciones del repositorio y documenta el nuevo contrato y sus límites."
- S7: "No despliegues, apliques migraciones remotas ni cambies permisos o secretos sin autorización específica."
- S8: "No deduzcas el idioma del texto ni introduzcas un fallback silencioso."

## Tasks
- T1 [done] S1-S8 | route: bounded writer (parent context backstop) | commit: pending | implement additive contract, fixtures/tests and documentation
- T2 [done] S1-S8 | route: independent verifier (risk item 2) + local validate and SQL checks | commit: pending
- T3 [in_progress] S1-S8 | route: parent native review and local work-unit commit | commit: pending

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
