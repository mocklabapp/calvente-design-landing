import type { PageId } from '@/data/pages';
import type { Locale } from './locales';
import { publishedPages } from './pages';

/** One published URL for a locale; `path` is site-relative with leading and trailing slash. */
export interface Alternate {
  locale: Locale;
  path: string;
}

/** Published path of a registry page, or `undefined` when that locale has no translation. */
export function pathFor(id: PageId, locale: Locale): string | undefined {
  return publishedPages().find((page) => page.id === id && page.locale === locale)?.path;
}

/** Published equivalents of a registry page, one per locale that translates it. */
export function alternatesFor(id: PageId): Alternate[] {
  return publishedPages()
    .filter((page) => page.id === id)
    .map(({ locale, path }) => ({ locale, path }));
}

function detailPath(base: string, childId: string): string {
  return `${base}${encodeURIComponent(childId)}/`;
}

/** Path of a detail page nested under a listing (e.g. a project or product) for one locale. */
export function childPath(parent: PageId, locale: Locale, childId: string): string | undefined {
  const base = pathFor(parent, locale);
  return base === undefined ? undefined : detailPath(base, childId);
}

/** Equivalents of a detail page: one per locale in which its listing is published. */
export function childAlternates(parent: PageId, childId: string): Alternate[] {
  return alternatesFor(parent).map(({ locale, path }) => ({ locale, path: detailPath(path, childId) }));
}
