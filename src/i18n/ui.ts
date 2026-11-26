import { site } from '@/config/site';
import type { PageId } from '@/data/pages';
import type { Locale } from './locales';

// Shared chrome strings (header, menu, footer, toasts). Feature copy lives next to
// its feature. Every enabled locale must provide every key: `publishedPages()`
// fails the build otherwise, so there is no silent fallback.
export interface UI {
  /** Navigation and link labels per page. */
  nav: Record<PageId, string>;
  mainNavigation: string;
  languageNavigation: string;
  homeLink: string;
  tagline: string;
  taglineLine1: string;
  taglineLine2: string;
  place: string;
  menu: string;
  close: string;
  footer: string;
  footerPolicies: string;
  footerLinks: string;
  footerNewsletter: string;
  footerSocial: string;
  newsletterPlaceholder: string;
  newsletterSubmit: string;
  contactHeading: string;
  emailLabel: string;
  whatsappLabel: string;
  themeToDark: string;
  themeToLight: string;
  photosPending: string;
  toastInstagram: string;
  toastLinkedin: string;
  toastNewsletter: string;
}

const es: UI = {
  nav: {
    home: 'Inicio', projects: 'Proyectos', collections: 'Colecciones', profile: 'Perfil',
    contact: 'Contacto', privacy: 'Privacidad', cookies: 'Cookies', legal: 'Aviso legal',
  },
  mainNavigation: 'Navegación principal',
  languageNavigation: 'Idioma',
  homeLink: 'Calvente Design · inicio',
  tagline: 'Carpintería en madera · Mobiliario de diseño',
  taglineLine1: 'Carpintería en madera',
  taglineLine2: 'Mobiliario de diseño',
  place: 'Sevilla · desde 2005',
  menu: 'Menú',
  close: 'Cerrar',
  footer: site.description,
  footerPolicies: 'Políticas',
  footerLinks: 'Enlaces',
  footerNewsletter: 'Boletín',
  footerSocial: 'Redes',
  newsletterPlaceholder: 'Tu email',
  newsletterSubmit: 'Enviar',
  contactHeading: 'Contacto',
  emailLabel: 'Email',
  whatsappLabel: 'WhatsApp',
  themeToDark: '◑ Oscuro',
  themeToLight: '◐ Claro',
  photosPending: 'Fotos pendientes',
  toastInstagram: 'Enlace de Instagram pendiente de confirmar.',
  toastLinkedin: 'Enlace de LinkedIn pendiente de confirmar.',
  toastNewsletter: 'Suscripción de ejemplo registrada.',
};

const en: UI = {
  nav: {
    home: 'Home', projects: 'Projects', collections: 'Collections', profile: 'Profile',
    contact: 'Contact', privacy: 'Privacy', cookies: 'Cookies', legal: 'Legal notice',
  },
  mainNavigation: 'Main navigation',
  languageNavigation: 'Language',
  homeLink: 'Calvente Design · home',
  tagline: 'Woodworking · Designer furniture',
  taglineLine1: 'Woodworking',
  taglineLine2: 'Designer furniture',
  place: 'Seville · since 2005',
  menu: 'Menu',
  close: 'Close',
  footer: 'Bespoke joinery. We make pieces for architecture projects and our own furniture collections.',
  footerPolicies: 'Policies',
  footerLinks: 'Links',
  footerNewsletter: 'Newsletter',
  footerSocial: 'Social',
  newsletterPlaceholder: 'Your email',
  newsletterSubmit: 'Send',
  contactHeading: 'Contact',
  emailLabel: 'Email',
  whatsappLabel: 'WhatsApp',
  themeToDark: '◑ Dark',
  themeToLight: '◐ Light',
  photosPending: 'Photos pending',
  toastInstagram: 'Instagram link pending confirmation.',
  toastLinkedin: 'LinkedIn link pending confirmation.',
  toastNewsletter: 'Sample subscription saved.',
};

export const ui: Record<Locale, UI> = { es, en };
