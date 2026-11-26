import { pages, type Page, type PageId, type PageTranslation } from '../data/pages';
import { defaultLocale, getEnabledLocales, locales, type Locale } from './locales';
import { ui } from './ui';

export interface PublishedPage {
  id: PageId;
  locale: Locale;
  content: PageTranslation;
  path: string;
}

/** Paths of every string leaf in a UI dictionary, e.g. `nav.home` or `menu`. */
function leafPaths(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key));
}

function leafAt(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) =>
    typeof node === 'object' && node !== null ? (node as Record<string, unknown>)[key] : undefined, value);
}

// Every enabled locale must supply a non-empty string for every UI key that the
// default (Spanish) dictionary defines; nothing falls back to Spanish silently.
function assertCompleteUi(enabled: Locale[]): void {
  const keys = leafPaths(ui[defaultLocale]);
  for (const locale of enabled) {
    const dictionary: unknown = ui[locale];
    const complete = typeof dictionary === 'object' && dictionary !== null && keys.every((key) => {
      const text = leafAt(dictionary, key);
      return typeof text === 'string' && text.trim() !== '';
    });
    if (!complete) throw new Error(`[i18n] Incomplete UI for ${locale}.`);
  }
}

export function publishedPages(): PublishedPage[] {
  const enabled = getEnabledLocales();
  assertCompleteUi(enabled);
  const ids = new Set<string>();
  for (const page of pages) {
    if (ids.has(page.id)) {
      throw new Error(`[i18n] Duplicate page ID ${page.id}.`);
    }
    ids.add(page.id);
  }
  const published = pages.flatMap((page: Page) => {
    if (!page.translations[defaultLocale]) {
      throw new Error(`[i18n] Missing Spanish translation for page ${page.id}.`);
    }
    return enabled.flatMap((locale) => {
      const content = page.translations[locale];
      if (!content) return [];
      if (typeof content.slug !== 'string' ||
          !content.title?.trim() || !content.description?.trim() || !content.body?.trim()) {
        throw new Error(`[i18n] Incomplete translation for ${page.id}/${locale}.`);
      }
      const prefix = locale === defaultLocale ? '' : `${locale}/`;
      const path = `/${prefix}${content.slug ? `${content.slug}/` : ''}`;
      return [{ id: page.id, locale, content, path }];
    });
  });
  const paths = new Map<string, PublishedPage>();
  for (const page of published) {
    const previous = paths.get(page.path);
    if (previous) {
      throw new Error(`[i18n] Colliding published path ${page.path}: ${previous.id}/${previous.locale} and ${page.id}/${page.locale}.`);
    }
    paths.set(page.path, page);
  }
  return published;
}

export function equivalents(page: PublishedPage): PublishedPage[] {
  return publishedPages().filter(({ id }) => id === page.id);
}

export { locales };
