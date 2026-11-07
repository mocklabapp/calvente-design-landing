import { getSecret } from 'astro:env/server';

export interface ProjectTranslation {
  language: string;
  title: string | null;
  description: string | null;
}

export interface PublicProject {
  /** Postgres bigint serialized as text, never a JavaScript number. */
  id: string;
  title: string | null;
  description: string | null;
  weblink: string | null;
  originalLanguage: string | null;
  translations: ProjectTranslation[];
}

const pageSize = 200;
const select = 'id::text,user,title,description,weblink,project_translation_settings(original_language,project_translations(language,title,description))';
const unavailable = () => new Error('Projects unavailable');

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw unavailable();
  return value as Record<string, unknown>;
}

function text(value: unknown): string | null {
  if (value === null || typeof value === 'string') return value;
  throw unavailable();
}

function language(value: unknown): string {
  if (value === 'es' || value === 'en' || value === 'ca') return value;
  throw unavailable();
}

function project(value: unknown, owner: string): PublicProject {
  const row = record(value);
  if (row.user !== owner || typeof row.id !== 'string' || !/^[1-9]\d*$/.test(row.id)) {
    throw unavailable();
  }
  let originalLanguage: string | null = null;
  let translations: ProjectTranslation[] = [];
  if (row.project_translation_settings !== null) {
    const settings = record(row.project_translation_settings);
    originalLanguage = language(settings.original_language);
    if (!Array.isArray(settings.project_translations)) throw unavailable();
    const seen = new Set<string>();
    translations = settings.project_translations.map((value: unknown) => {
      const translation = record(value);
      const locale = language(translation.language);
      if (seen.has(locale)) throw unavailable();
      seen.add(locale);
      return { language: locale, title: text(translation.title), description: text(translation.description) };
    });
  }
  return { id: row.id, title: text(row.title), description: text(row.description),
    weblink: text(row.weblink), originalLanguage, translations };
}

async function readPage(response: Response): Promise<{ rows: unknown[]; total: number }> {
  if (!response.ok) throw unavailable();
  const range = response.headers.get('content-range');
  const match = range?.match(/^(?:\d+-\d+|\*)\/(\d+)$/);
  if (!match) throw unavailable();
  const total = Number(match[1]);
  const rows: unknown = await response.json();
  if (!Number.isSafeInteger(total) || !Array.isArray(rows) || rows.length > pageSize) throw unavailable();
  return { rows, total };
}

/** Server-only, fixed-tenant public portfolio. Call from an on-demand Astro route. */
export async function getProjects(): Promise<PublicProject[]> {
  try {
    // Read at request time; never serialize these values through public env or props.
    const base = getSecret('SUPABASE_URL');
    const key = getSecret('SUPABASE_SECRET_KEY');
    const configuredOwner = getSecret('GALIA_USER_ID');
    if (!base || !/^https:\/\/[a-z0-9]{20}\.supabase\.co\/?$/.test(base)
      || !key || !configuredOwner
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(configuredOwner)) {
      throw unavailable();
    }
    const owner = configuredOwner.toLowerCase();
    const signal = AbortSignal.timeout(10_000);
    const projects: PublicProject[] = [];
    let previous = 0n;
    while (true) {
      signal.throwIfAborted();
      const url = new URL('/rest/v1/projects', base);
      url.search = new URLSearchParams({ select, user: `eq.${owner}`, order: 'id.asc',
        limit: String(pageSize), offset: String(projects.length) }).toString();
      const response = await fetch(url, {
        headers: { apikey: key, Prefer: 'count=exact', Accept: 'application/json' },
        signal, redirect: 'error', cache: 'no-store',
      });
      const { rows, total } = await readPage(response);
      for (const row of rows) {
        const mapped = project(row, owner);
        const id = BigInt(mapped.id);
        if (id <= previous) throw unavailable();
        previous = id;
        projects.push(mapped);
      }
      if (projects.length >= total) return projects;
      if (rows.length === 0) throw unavailable();
    }
  } catch {
    // Do not forward URLs, keys, response bodies or fetch/validation internals.
    throw unavailable();
  }
}
