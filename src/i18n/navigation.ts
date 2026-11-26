import type { PageId } from '@/data/pages';
import type { Locale } from './locales';
import { pathFor } from './routes';
import { ui } from './ui';

export interface NavItem {
  id: PageId;
  label: string;
  href: string;
  current: boolean;
}

const sectionIds: readonly PageId[] = ['projects', 'collections', 'profile', 'contact'];
const legalIds: readonly PageId[] = ['privacy', 'cookies', 'legal'];

function itemsFor(ids: readonly PageId[], locale: Locale, current?: PageId): NavItem[] {
  return ids.flatMap((id) => {
    const href = pathFor(id, locale);
    // Pages this locale does not publish are omitted instead of linking elsewhere.
    return href === undefined ? [] : [{ id, label: ui[locale].nav[id], href, current: id === current }];
  });
}

/** Main sections shown in the desktop header and footer. */
export function sectionItems(locale: Locale, current?: PageId): NavItem[] {
  return itemsFor(sectionIds, locale, current);
}

/** Home plus the main sections, as listed in the mobile menu. */
export function menuItems(locale: Locale, current?: PageId): NavItem[] {
  return itemsFor(['home', ...sectionIds], locale, current);
}

/** Privacy, cookies and legal notice links for the footer. */
export function legalItems(locale: Locale, current?: PageId): NavItem[] {
  return itemsFor(legalIds, locale, current);
}

/** Home URL for a locale; falls back to the locale root when home is unpublished. */
export function homeHref(locale: Locale): string {
  return pathFor('home', locale) ?? '/';
}
