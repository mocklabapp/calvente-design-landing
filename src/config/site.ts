import { defaultLocale, locales, type Locale } from '../i18n/locales.ts';

// Shared identity for Calvente Design. Contact details come from the approved prototype.
export const site = {
  name: 'Calvente Design',
  description: 'Carpintería de autor. Fabricamos piezas para obras de arquitectura y colecciones propias de mobiliario.',
  language: locales[defaultLocale].lang,
  contact: {
    email: 'info@calventedesign.com',
    phone: '+34 635 996 882',
    phoneHref: 'tel:+34635996882',
    whatsappUrl: 'https://wa.me/34635996882',
    address: 'C/ Química, nave 42 · PEASS · Sevilla',
    hours: { es: 'L–V · 8:00–15:00', en: 'Mon–Fri · 8:00–15:00' } satisfies Partial<Record<Locale, string>>,
  },
} as const;
