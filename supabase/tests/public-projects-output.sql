SET SESSION AUTHORIZATION authenticator;
SET ROLE public_projects_runtime;
DO $$
DECLARE
  page jsonb := public.export_public_projects('11111111-1111-1111-1111-111111111111', 0, 2);
  expected jsonb := '{"total":"3","count":2,"offset":0,"limit":2,"projects":[
    {"id":"1","title":"Draft","description":null,"weblink":null,"originalLanguage":"es",
     "translations":[{"language":"ca","title":"Català","description":null},
                     {"language":"en","title":null,"description":"Partial"}]},
    {"id":"2","title":null,"description":"Published","weblink":"https://example.test",
     "originalLanguage":"ca","translations":[]}]}'::jsonb;
BEGIN
  IF page IS DISTINCT FROM expected THEN RAISE EXCEPTION 'First page mismatch: %', page; END IF;
  page := public.export_public_projects('11111111-1111-1111-1111-111111111111', 2, 2);
  expected := '{"total":"3","count":1,"offset":2,"limit":2,"projects":[
    {"id":"9007199254740993","title":"Archived","description":null,"weblink":null,
     "originalLanguage":null,"translations":[]}]}'::jsonb;
  IF page IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Last page mismatch: %', page; END IF;
  page := public.export_public_projects('22222222-2222-2222-2222-222222222222', 0, 200);
  expected := '{"total":"1","count":1,"offset":0,"limit":200,"projects":[
    {"id":"3","title":"Other","description":null,"weblink":null,"originalLanguage":"en",
     "translations":[{"language":"es","title":"Otro","description":"Other owner"}]}]}'::jsonb;
  IF page IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Other owner mismatch: %', page; END IF;
  page := public.export_public_projects('33333333-3333-3333-3333-333333333333', 0, 200);
  IF page IS DISTINCT FROM '{"total":"0","count":0,"offset":0,"limit":200,"projects":[]}'::jsonb
    THEN RAISE EXCEPTION 'Empty owner mismatch'; END IF;
  page := public.export_public_projects('11111111-1111-1111-1111-111111111111', 1000000, 200);
  IF page IS DISTINCT FROM '{"total":"3","count":0,"offset":1000000,"limit":200,"projects":[]}'::jsonb
    THEN RAISE EXCEPTION 'Exhausted page mismatch'; END IF;
END $$;
