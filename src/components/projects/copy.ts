import type { Locale } from '@/i18n/locales';

// Feature copy for the live projects pages. Strings the prototype supplied are kept as
// approved; the remaining English is translated. Every locale must supply every key.
export interface ProjectsCopy {
  category: string;
  all: string;
  /** Count label next to the filter, e.g. `03 obras`. */
  worksOne: string;
  worksMany: string;
  registerTitle: string;
  registerVolume: string;
  city: string;
  archive: string;
  pageShort: string;
  notes: string;
  index: string;
  photography: string;
  photographyCredit: string;
  noDate: string;
  emptyTitle: string;
  emptyBody: string;
  emptyCollections: string;
  emptyContact: string;
  /** Shown instead of text when a project has no text in the page language. */
  missingText: string;
  unavailableTitle: string;
  unavailableBody: string;
  notFoundTitle: string;
  notFoundBody: string;
  backToProjects: string;
  nextProject: string;
  visitWebsite: string;
  year: string;
  website: string;
  noImages: string;
  openImage: string;
  galleryLabel: string;
  lightboxClose: string;
  lightboxPrevious: string;
  lightboxNext: string;
  filterLabel: string;
}

export const projectsCopy: Record<Locale, ProjectsCopy> = {
  es: {
    category: 'Categoría',
    all: 'Todo',
    worksOne: 'obra',
    worksMany: 'obras',
    registerTitle: 'Registro de obra',
    registerVolume: 'Vol. 2026',
    city: 'Sevilla',
    archive: 'Archivo',
    pageShort: 'Pág.',
    notes: 'Notas',
    index: 'Índice',
    photography: 'Fotografía',
    photographyCredit: 'J. O.',
    noDate: 's/f',
    emptyTitle: 'Estamos preparando el registro de obra',
    emptyBody: 'Todavía no hemos publicado los trabajos del taller. Mientras tanto, puedes conocer nuestras colecciones o escribirnos.',
    emptyCollections: 'Ver colecciones',
    emptyContact: 'Contactar',
    missingText: 'Este proyecto aún no tiene texto en español.',
    unavailableTitle: 'Proyectos no disponibles',
    unavailableBody: 'No hemos podido cargar los proyectos en este momento. Inténtalo de nuevo en unos minutos.',
    notFoundTitle: 'Proyecto no encontrado',
    notFoundBody: 'No existe ningún proyecto con esa dirección.',
    backToProjects: 'Volver',
    nextProject: 'Siguiente proyecto',
    visitWebsite: 'Ver sitio web',
    year: 'Año',
    website: 'Sitio web',
    noImages: 'Fotos pendientes',
    openImage: 'Ver imagen {n} en grande',
    galleryLabel: 'Galería de {title}',
    lightboxClose: 'Cerrar',
    lightboxPrevious: 'Imagen anterior',
    lightboxNext: 'Imagen siguiente',
    filterLabel: 'Filtrar por categoría',
  },
  en: {
    category: 'Category',
    all: 'All',
    worksOne: 'project',
    worksMany: 'projects',
    registerTitle: 'Project register',
    registerVolume: 'Vol. 2026',
    city: 'Seville',
    archive: 'Archive',
    pageShort: 'P.',
    notes: 'Notes',
    index: 'Index',
    photography: 'Photography',
    photographyCredit: 'J. O.',
    noDate: 'n.d.',
    emptyTitle: 'We are preparing the project register',
    emptyBody: 'We have not published the workshop projects yet. In the meantime, you can explore our collections or write to us.',
    emptyCollections: 'View collections',
    emptyContact: 'Get in touch',
    missingText: 'This project has no text in English yet.',
    unavailableTitle: 'Projects unavailable',
    unavailableBody: 'We could not load the projects right now. Please try again in a few minutes.',
    notFoundTitle: 'Project not found',
    notFoundBody: 'There is no project at this address.',
    backToProjects: 'Back',
    nextProject: 'Next project',
    visitWebsite: 'Visit website',
    year: 'Year',
    website: 'Website',
    noImages: 'Photos pending',
    openImage: 'View image {n} larger',
    galleryLabel: 'Gallery of {title}',
    lightboxClose: 'Close',
    lightboxPrevious: 'Previous image',
    lightboxNext: 'Next image',
    filterLabel: 'Filter by category',
  },
};

/** Fill `{name}` placeholders; unknown placeholders are left untouched. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.hasOwn(values, key) ? String(values[key]) : match);
}
