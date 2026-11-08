-- Exercise pre-existing application access using fake data only, then undo all writes.
BEGIN;
SET SESSION AUTHORIZATION authenticated;
DO $$
BEGIN
  IF public.fixture_management_count() <> 4 THEN
    RAISE EXCEPTION 'Existing authenticated project read changed';
  END IF;
END $$;
INSERT INTO public.projects (id, "user", title, state)
VALUES (77, '11111111-1111-1111-1111-111111111111', 'Management', 'draft');
UPDATE public.projects SET state = 'published' WHERE id = 77;
INSERT INTO public.project_translation_settings (project_id, original_language)
VALUES (77, 'es');
INSERT INTO public.project_translations (project_id, original_language, language, title)
VALUES (77, 'es', 'en', 'Initial');
INSERT INTO public.project_translations (project_id, original_language, language, title)
VALUES (77, 'es', 'en', 'Updated')
ON CONFLICT (project_id, original_language, language) DO UPDATE SET title = EXCLUDED.title;
DO $$
BEGIN
  IF (SELECT state FROM public.projects WHERE id = 77) IS DISTINCT FROM 'published'
    OR (SELECT title FROM public.project_translations WHERE project_id = 77) IS DISTINCT FROM 'Updated'
    OR (SELECT original_language FROM public.project_translation_settings WHERE project_id = 77)
      IS DISTINCT FROM 'es' THEN
    RAISE EXCEPTION 'Existing project/translation writes changed';
  END IF;
END $$;
DELETE FROM public.project_translations WHERE project_id = 77;
DELETE FROM public.project_translation_settings WHERE project_id = 77;
DELETE FROM public.projects WHERE id = 77;
DO $$
BEGIN
  IF public.fixture_management_count() <> 4
    OR EXISTS (SELECT FROM public.projects WHERE id = 77)
    OR EXISTS (SELECT FROM public.project_translation_settings WHERE project_id = 77)
    OR EXISTS (SELECT FROM public.project_translations WHERE project_id = 77) THEN
    RAISE EXCEPTION 'Existing management delete changed';
  END IF;
END $$;
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION service_role;
DO $$
BEGIN
  IF public.fixture_management_count() <> 4
    OR (SELECT count(*) FROM public.project_translations) <> 3 THEN
    RAISE EXCEPTION 'Existing service role reads changed';
  END IF;
END $$;
RESET SESSION AUTHORIZATION;
ROLLBACK;
