import type { Locale } from '@/i18n/locales';

// S7: the client supplies the real legal texts later. Everything here is placeholder
// lorem ipsum and must be replaced before launch.
export interface LegalCopy {
  notice: string;
  section: string;
  paragraphs: readonly string[];
}

const paragraphs = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
] as const;

export const legalCopy: Record<Locale, LegalCopy> = {
  es: {
    notice: 'Texto provisional: pendiente de recibir el texto legal definitivo del cliente. El contenido de esta página es de ejemplo (lorem ipsum) y no tiene validez legal.',
    section: 'Apartado',
    paragraphs,
  },
  en: {
    notice: 'Placeholder text: pending the client’s final legal copy. The content of this page is sample text (lorem ipsum) and has no legal validity.',
    section: 'Section',
    paragraphs,
  },
};

/** Number of placeholder sections rendered on every legal page. */
export const legalSectionCount = 4;
