-- Additive, one-shot migration; collisions fail rather than adopt existing roles/objects.
BEGIN;
CREATE ROLE public_projects_export_owner NOLOGIN NOINHERIT NOSUPERUSER
  NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE public_projects_runtime NOLOGIN NOINHERIT NOSUPERUSER
  NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;

-- PUBLIC privileges bypass NOINHERIT. Refuse unsafe table grants without changing them.
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_catalog.pg_class c
    WHERE c.oid IN ('public.projects'::regclass,
      'public.project_translation_settings'::regclass, 'public.project_translations'::regclass)
      AND (NOT c.relrowsecurity
        OR pg_catalog.has_any_column_privilege('public_projects_runtime', c.oid, 'SELECT,INSERT,UPDATE,REFERENCES')
        OR pg_catalog.has_table_privilege('public_projects_runtime', c.oid, 'DELETE,TRUNCATE,TRIGGER'))
  ) THEN
    RAISE EXCEPTION 'Export requires existing RLS and no PUBLIC table/column privileges';
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO public_projects_export_owner, public_projects_runtime;
GRANT SELECT (id, "user", title, description, weblink) ON public.projects TO public_projects_export_owner;
GRANT SELECT (project_id, original_language) ON public.project_translation_settings TO public_projects_export_owner;
GRANT SELECT (project_id, original_language, language, title, description)
  ON public.project_translations TO public_projects_export_owner;
CREATE POLICY public_projects_export_select ON public.projects
  FOR SELECT TO public_projects_export_owner USING (true);
CREATE POLICY public_projects_export_select ON public.project_translation_settings
  FOR SELECT TO public_projects_export_owner USING (true);
CREATE POLICY public_projects_export_select ON public.project_translations
  FOR SELECT TO public_projects_export_owner USING (true);

CREATE FUNCTION public.export_public_projects(p_owner uuid, p_offset integer, p_limit integer)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_owner IS NULL OR p_offset IS NULL OR p_offset NOT BETWEEN 0 AND 1000000
    OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'Invalid public projects page' USING ERRCODE = '22023';
  END IF;
  WITH owned AS MATERIALIZED (
    SELECT p.id, p.title, p.description, p.weblink
    FROM public.projects p WHERE p."user" = p_owner
  ), page AS (
    SELECT * FROM owned ORDER BY id LIMIT p_limit OFFSET p_offset
  ), items AS (
    SELECT p.id, jsonb_build_object(
      'id', p.id::text, 'title', p.title, 'description', p.description, 'weblink', p.weblink,
      'originalLanguage', s.original_language,
      'translations', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'language', t.language, 'title', t.title, 'description', t.description
        ) ORDER BY t.language COLLATE "C")
        FROM public.project_translations t
        WHERE t.project_id = s.project_id AND t.original_language = s.original_language
      ), '[]'::jsonb)
    ) AS dto
    FROM page p LEFT JOIN public.project_translation_settings s ON s.project_id = p.id
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*)::text FROM owned), 'count', count(*),
    'offset', p_offset, 'limit', p_limit,
    'projects', COALESCE(jsonb_agg(dto ORDER BY id), '[]'::jsonb)
  ) INTO result FROM items;
  RETURN result;
END $$;

ALTER FUNCTION public.export_public_projects(uuid, integer, integer) OWNER TO public_projects_export_owner;
REVOKE ALL ON FUNCTION public.export_public_projects(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.export_public_projects(uuid, integer, integer) TO public_projects_runtime;
-- PostgreSQL 16+: PostgREST must SET ROLE; authenticator does not inherit EXECUTE.
GRANT public_projects_runtime TO authenticator WITH INHERIT FALSE, SET TRUE;
COMMIT;
