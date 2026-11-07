-- Isolated disposable database only; never apply this fixture to Supabase.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE authenticator NOLOGIN NOINHERIT;
CREATE SCHEMA auth;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE
AS $$ SELECT current_setting('request.jwt.claim.role', true) $$;
CREATE TABLE public.projects (
  id bigint PRIMARY KEY, "user" uuid NOT NULL, title text, description text,
  weblink text, state text, prompt text DEFAULT 'private'
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
INSERT INTO public.project_translation_settings (project_id, original_language)
VALUES (1, 'es'), (2, 'ca'), (3, 'en');
INSERT INTO public.project_translations (project_id, original_language, language, title, description)
VALUES (1, 'es', 'en', null, 'Partial'), (1, 'es', 'ca', 'Català', null),
       (3, 'en', 'es', 'Otro', 'Other owner');
