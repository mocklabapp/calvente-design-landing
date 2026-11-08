-- Execute only in the isolated disposable fixture, after both migrations.
-- Each negative case restores fixture rows; no partial or silently dropped images.
BEGIN;
DO $$
DECLARE
  invalid jsonb;
  saved jsonb := (SELECT image_data FROM public.projects WHERE id = 1);
BEGIN
  FOREACH invalid IN ARRAY ARRAY[
    'null'::jsonb, '{}'::jsonb, '"private"'::jsonb,
    '[null]'::jsonb, '[[]]'::jsonb, '[{}]'::jsonb,
    '[{"url":null}]'::jsonb, '[{"url":123}]'::jsonb, '[{"url":""}]'::jsonb,
    '[{"url":"https://abcdefghijklmnopqrst.supabase.co/storage/v1/object/public/projects-images/valid.jpg"},{}]'::jsonb
  ] LOOP
    UPDATE public.projects SET image_data = invalid WHERE id = 1;
    BEGIN
      PERFORM public.export_public_projects('11111111-1111-1111-1111-111111111111', 0, 200);
      RAISE EXCEPTION 'Invalid image_data was accepted';
    EXCEPTION WHEN SQLSTATE '22023' THEN
      NULL;
    END;
    -- A malformed foreign owner's row must not affect an unrelated owner.
    IF public.export_public_projects('22222222-2222-2222-2222-222222222222', 0, 200)
      ->> 'total' IS DISTINCT FROM '1' THEN
      RAISE EXCEPTION 'Image validation crossed the owner boundary';
    END IF;
  END LOOP;
  UPDATE public.projects SET image_data = saved WHERE id = 1;
END $$;
ROLLBACK;
