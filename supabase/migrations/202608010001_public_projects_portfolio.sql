-- Additive successor to 202607300001_public_projects_read.sql; never replay that migration.
BEGIN;
-- Refuse an unexpected ownership/temporary-privilege baseline rather than adopting it.
DO $$
BEGIN
  IF (SELECT pg_catalog.pg_get_userbyid(proowner) FROM pg_catalog.pg_proc
      WHERE oid = 'public.export_public_projects(uuid,integer,integer)'::regprocedure)
      IS DISTINCT FROM 'public_projects_export_owner'
    OR pg_catalog.pg_has_role(current_user, 'public_projects_export_owner', 'MEMBER')
    OR pg_catalog.has_schema_privilege('public_projects_export_owner', 'public', 'CREATE') THEN
    RAISE EXCEPTION 'Unexpected public projects export baseline' USING ERRCODE = '22023';
  END IF;
END $$;

-- Only these additional columns are needed. Runtime still receives no table access.
GRANT SELECT (image_data, category, year) ON public.projects TO public_projects_export_owner;
GRANT public_projects_export_owner TO CURRENT_USER;
GRANT CREATE ON SCHEMA public TO public_projects_export_owner;

-- Replacement retains the existing owner and EXECUTE ACL, including management access.
CREATE OR REPLACE FUNCTION public.export_public_projects(p_owner uuid, p_offset integer, p_limit integer)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  result jsonb;
  images jsonb;
  image jsonb;
BEGIN
  IF p_owner IS NULL OR p_offset IS NULL OR p_offset NOT BETWEEN 0 AND 1000000
    OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'Invalid public projects page' USING ERRCODE = '22023';
  END IF;
  -- Validate the selected page before projection. SQL NULL means no images;
  -- JSON null, nonarrays and invalid entries must not become empty/partial success.
  -- STABLE keeps both reads on the calling statement's snapshot.
  FOR images IN
    SELECT p.image_data FROM public.projects p WHERE p."user" = p_owner
    ORDER BY p.id LIMIT p_limit OFFSET p_offset
  LOOP
    IF images IS NULL THEN CONTINUE; END IF;
    IF jsonb_typeof(images) IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Invalid public project images' USING ERRCODE = '22023';
    END IF;
    FOR image IN SELECT value FROM jsonb_array_elements(images)
    LOOP
      IF jsonb_typeof(image) IS DISTINCT FROM 'object'
        OR jsonb_typeof(image -> 'url') IS DISTINCT FROM 'string'
        OR length(image ->> 'url') = 0 THEN
        RAISE EXCEPTION 'Invalid public project images' USING ERRCODE = '22023';
      END IF;
    END LOOP;
  END LOOP;
  WITH owned AS MATERIALIZED (
    SELECT p.id, p.title, p.description, p.weblink, p.image_data, p.category, p.year
    FROM public.projects p WHERE p."user" = p_owner
  ), page AS (
    SELECT id, title, description, weblink, image_data, category, year
    FROM owned ORDER BY id LIMIT p_limit OFFSET p_offset
  ), items AS (
    SELECT p.id, jsonb_build_object(
      'id', p.id::text, 'title', p.title, 'description', p.description, 'weblink', p.weblink,
      'category', p.category, 'year', p.year,
      'images', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('url', i.value ->> 'url') ORDER BY i.ordinality)
        FROM jsonb_array_elements(p.image_data) WITH ORDINALITY AS i(value, ordinality)
      ), '[]'::jsonb),
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

REVOKE CREATE ON SCHEMA public FROM public_projects_export_owner;
REVOKE public_projects_export_owner FROM CURRENT_USER;
COMMIT;
