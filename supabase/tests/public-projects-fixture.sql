-- Isolated disposable database only; never apply this fixture to Supabase.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE authenticator NOLOGIN NOINHERIT;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE ROLE fixture_deployer LOGIN CREATEROLE NOSUPERUSER NOBYPASSRLS;
GRANT anon, authenticated, service_role TO authenticator;
-- Own only this disposable database; model schema authority without superuser execution.
ALTER DATABASE postgres OWNER TO fixture_deployer;
CREATE SCHEMA auth;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE
AS $$ SELECT current_setting('request.jwt.claim.role', true) $$;
CREATE TABLE public.projects (
  id bigint PRIMARY KEY, "user" uuid NOT NULL, title text, description text,
  weblink text, state text, prompt text DEFAULT 'private',
  image_data jsonb, category text, year text,
  "photoCredit" text DEFAULT 'private', "photoCreditLink" text DEFAULT 'private',
  authors text DEFAULT 'private', collaborators text DEFAULT 'private',
  "googleMaps" text DEFAULT 'private', "showMap" boolean DEFAULT true
);
CREATE TABLE public.project_translation_settings (
  project_id bigint PRIMARY KEY REFERENCES public.projects,
  original_language text NOT NULL, internal_note text DEFAULT 'private',
  UNIQUE (project_id, original_language)
);
CREATE TABLE public.project_translations (
  project_id bigint, original_language text, language text,
  title text, description text, internal_note text DEFAULT 'private',
  PRIMARY KEY (project_id, original_language, language),
  FOREIGN KEY (project_id, original_language)
    REFERENCES public.project_translation_settings (project_id, original_language)
);
ALTER TABLE public.projects OWNER TO fixture_deployer;
ALTER TABLE public.project_translation_settings OWNER TO fixture_deployer;
ALTER TABLE public.project_translations OWNER TO fixture_deployer;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects,
  public.project_translation_settings, public.project_translations TO authenticated, service_role;
GRANT SELECT ON public.projects TO anon;
CREATE FUNCTION public.fixture_management_count() RETURNS bigint LANGUAGE sql STABLE
AS $$ SELECT count(*) FROM public.projects $$;
REVOKE ALL ON FUNCTION public.fixture_management_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fixture_management_count() TO authenticated, service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_translation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_translations ENABLE ROW LEVEL SECURITY;
-- Broad pre-existing row policies must not defeat column privilege restrictions.
CREATE POLICY legacy ON public.projects TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY legacy ON public.project_translation_settings TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY legacy ON public.project_translations TO PUBLIC USING (true) WITH CHECK (true);
INSERT INTO public.projects (id, "user", title, description, weblink, state) VALUES
  (1, '11111111-1111-1111-1111-111111111111', 'Draft', null, null, 'draft'),
  (2, '11111111-1111-1111-1111-111111111111', null, 'Published', 'https://example.test', 'published'),
  (9007199254740993, '11111111-1111-1111-1111-111111111111', 'Archived', null, null, 'archived'),
  (3, '22222222-2222-2222-2222-222222222222', 'Other', null, null, 'draft');
UPDATE public.projects SET image_data = '[
  {"url":"https://abcdefghijklmnopqrst.supabase.co/storage/v1/object/public/projects-images/second%20photo.jpg",
   "status":"pending","processingResult":{"timestamps":"private"}},
  {"url":"https://abcdefghijklmnopqrst.supabase.co/storage/v1/object/public/projects-images/first.jpg",
   "status":"done"}]', category = 'Architecture', year = '2024–2025' WHERE id = 1;
UPDATE public.projects SET image_data = '[]', category = '', year = '' WHERE id = 2;
INSERT INTO public.project_translation_settings (project_id, original_language)
VALUES (1, 'es'), (2, 'ca'), (3, 'en');
INSERT INTO public.project_translations (project_id, original_language, language, title, description)
VALUES (1, 'es', 'en', null, 'Partial'), (1, 'es', 'ca', 'Català', null),
       (3, 'en', 'es', 'Otro', 'Other owner');
