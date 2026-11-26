import { getProjects, type NormalizedPublicProject } from '@/lib/projects';
import { publishedPages, type PublishedPage } from '@/i18n/pages';
import type { Locale } from '@/i18n/locales';

export type ProjectsResult =
  | { ok: true; projects: NormalizedPublicProject[] }
  | { ok: false };

/** Live data must never be cached, on success or failure. */
export function applyNoStore(headers: Headers): void {
  for (const name of ['Cache-Control', 'CDN-Cache-Control', 'Vercel-CDN-Cache-Control']) {
    headers.set(name, 'no-store');
  }
}

/** Fetch the fixed-owner portfolio; any upstream problem collapses to a sanitized failure. */
export async function loadProjects(): Promise<ProjectsResult> {
  try {
    return { ok: true, projects: await getProjects() };
  } catch {
    return { ok: false };
  }
}

/** Registry entry of the projects listing for a locale, if that locale publishes it. */
export function projectsPage(locale: Locale): PublishedPage | undefined {
  return publishedPages().find((page) => page.id === 'projects' && page.locale === locale);
}

/** HTTP status for a detail request: upstream failure, unknown id or success. */
export function detailStatus(result: ProjectsResult, project: NormalizedPublicProject | undefined): number {
  if (!result.ok) return 503;
  return project ? 200 : 404;
}
