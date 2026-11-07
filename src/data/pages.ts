import { site } from '../config/site';
import type { Locale } from '../i18n/locales';

export interface PageTranslation {
  slug: string;
  title: string;
  description: string;
  body: string;
}

export interface Page {
  id: string;
  translations: Partial<Record<Locale, PageTranslation>>;
}

// Stable identities connect equivalents even when slugs differ. Omit an optional
// translation until approved and complete; never publish placeholder fallback copy.
export const pages: Page[] = [
  {
    id: 'home',
    translations: {
      es: { slug: '', title: site.name, description: site.description, body: site.description },
      en: {
        slug: '', title: site.name,
        description: 'A clear starting point for your next website.',
        body: 'A clear starting point for your next website.',
      },
    },
  },
];
