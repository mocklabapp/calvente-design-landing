import { site } from '@/config/site';
import type { Locale } from '@/i18n/locales';
import { ui } from '@/i18n/ui';

export const pageIds = [
  'home', 'projects', 'collections', 'profile', 'contact', 'privacy', 'cookies', 'legal',
] as const;
export type PageId = (typeof pageIds)[number];

export interface PageTranslation {
  slug: string;
  title: string;
  description: string;
  body: string;
}

export interface Page {
  id: PageId;
  translations: Partial<Record<Locale, PageTranslation>>;
}

// Stable identities connect equivalents even when slugs differ. Omit an optional
// translation until approved and complete; never publish placeholder fallback copy.
// `body` is each page's intro paragraph; the prototype copy is kept as supplied and
// English is translated for the pages the prototype only wrote in Spanish.
// Legal bodies only describe the page: the real legal texts are pending (see the brief).
export const pages: Page[] = [
  {
    id: 'home',
    translations: {
      es: {
        slug: '', title: site.name, description: site.description,
        body: 'Trabajamos la madera a mano y sin prisa para arquitectos y para ti',
      },
      en: {
        slug: '', title: site.name, description: ui.en.footer,
        body: 'We work wood by hand, unhurried, for architects and for you',
      },
    },
  },
  {
    id: 'projects',
    translations: {
      es: {
        slug: 'proyectos', title: 'Proyectos',
        description: 'Proyectos de carpintería y mobiliario realizados en el taller de Calvente Design, en Sevilla.',
        body: 'Trabajos realizados en el taller por Madera y Vidrio, marca que desde 2026 unificamos con Calvente Design, con la misma filosofía, para concentrar el esfuerzo y ofrecer a nuestros clientes la mejor imagen y el mejor servicio.',
      },
      en: {
        slug: 'projects', title: 'Projects',
        description: 'Joinery and furniture projects made in the Calvente Design workshop in Seville.',
        body: 'Work made in the workshop by Madera y Vidrio, a brand we brought together with Calvente Design in 2026, with the same philosophy, to focus our efforts and give our clients the best image and service.',
      },
    },
  },
  {
    id: 'collections',
    translations: {
      es: {
        slug: 'colecciones', title: 'Colecciones',
        description: 'Colecciones de mobiliario e iluminación de Calvente Design, fabricadas por encargo en madera en Sevilla.',
        body: 'Piezas diseñadas y fabricadas por Calvente. Cada una se puede hacer en varias maderas, acabados y medidas.',
      },
      en: {
        slug: 'collections', title: 'Collections',
        description: 'Calvente Design furniture and lighting collections, made to order in wood in Seville.',
        body: 'Pieces designed and made by Calvente. Each one can be made in several woods, finishes and sizes.',
      },
    },
  },
  {
    id: 'profile',
    translations: {
      es: {
        slug: 'perfil', title: 'Perfil',
        description: 'Perfil de Juanma Calvente, ebanista sevillano, y de su taller de mobiliario artesano abierto en Sevilla en 2005.',
        body: 'Colecciones diseñadas y fabricadas por Juanma Calvente, ebanista sevillano, en su taller de Sevilla, abierto en 2005.',
      },
      en: {
        slug: 'profile', title: 'Profile',
        description: 'Profile of Seville cabinetmaker Juanma Calvente and his handmade furniture workshop, open in Seville since 2005.',
        body: 'Collections designed and made by Seville cabinetmaker Juanma Calvente in his Seville workshop, open since 2005.',
      },
    },
  },
  {
    id: 'contact',
    translations: {
      es: {
        slug: 'contacto', title: 'Contacto',
        description: 'Contacto del taller de Calvente Design en Sevilla: email, teléfono, dirección y horario.',
        body: 'Datos de contacto del taller de Calvente Design: email, teléfono, dirección y horario.',
      },
      en: {
        slug: 'contact', title: 'Contact',
        description: 'Contact details for the Calvente Design workshop in Seville: email, phone, address and opening hours.',
        body: 'Contact details for the Calvente Design workshop: email, phone, address and opening hours.',
      },
    },
  },
  {
    id: 'privacy',
    translations: {
      es: {
        slug: 'privacidad', title: 'Privacidad',
        description: 'Información sobre el tratamiento de los datos personales en el sitio web de Calvente Design.',
        body: 'Información sobre el tratamiento de los datos personales en este sitio web.',
      },
      en: {
        slug: 'privacy', title: 'Privacy',
        description: 'Information on how personal data is handled on the Calvente Design website.',
        body: 'Information on how personal data is handled on this website.',
      },
    },
  },
  {
    id: 'cookies',
    translations: {
      es: {
        slug: 'cookies', title: 'Cookies',
        description: 'Información sobre el uso de cookies en el sitio web de Calvente Design.',
        body: 'Información sobre el uso de cookies en este sitio web.',
      },
      en: {
        slug: 'cookies', title: 'Cookies',
        description: 'Information on the use of cookies on the Calvente Design website.',
        body: 'Information on the use of cookies on this website.',
      },
    },
  },
  {
    id: 'legal',
    translations: {
      es: {
        slug: 'aviso-legal', title: 'Aviso legal',
        description: 'Aviso legal del sitio web de Calvente Design.',
        body: 'Información legal sobre el titular y el uso de este sitio web.',
      },
      en: {
        slug: 'legal-notice', title: 'Legal notice',
        description: 'Legal notice for the Calvente Design website.',
        body: 'Legal information about the owner and use of this website.',
      },
    },
  },
];
