import type { Locale } from '@/i18n/locales';

/** A run of heading text; `accent` runs render as italic serif, as in the prototype. */
export interface HeadingPart {
  text: string;
  accent?: boolean;
}

export interface WorkshopPhoto {
  /** File name under src/assets/images. */
  image: string;
  caption: string;
}

export interface HomeCopy {
  hero: {
    label: string;
    roleDescription: string;
    architecture: string;
  };
  entry: {
    /** Brand sub-labels shown beside the section names in the two entry cards. */
    projectsSub: string;
    collectionsSub: string;
  };
  workshop: {
    eyebrow: string;
    heading: HeadingPart[];
    planksAlt: string;
    detailAlt: string;
    photos: WorkshopPhoto[];
  };
}

// Approved prototype copy; English is translated for the strings the prototype left in Spanish.
export const homeCopy: Record<Locale, HomeCopy> = {
  es: {
    hero: { label: 'Proyectos destacados', roleDescription: 'carrusel', architecture: 'Arquitectura' },
    entry: { projectsSub: 'Madera y Vidrio', collectionsSub: 'Calvente Design' },
    workshop: {
      eyebrow: 'Nuestro taller · En Sevilla desde 2005',
      heading: [
        { text: 'Trabajamos la madera ' },
        { text: 'a mano y sin prisa', accent: true },
        { text: '. Somos ' },
        { text: 'artesanos', accent: true },
        { text: '.' },
      ],
      planksAlt: 'Tablones en el taller',
      detailAlt: 'Detalle de ensamble',
      photos: [
        { image: 'taller-cepillos.jpg', caption: 'Cepillos de carpintero' },
        { image: 'taller-sargentos.jpg', caption: 'Sargentos' },
        { image: 'taller-herramientas.jpg', caption: 'Herramientas de mano' },
      ],
    },
  },
  en: {
    hero: { label: 'Featured projects', roleDescription: 'carousel', architecture: 'Architecture' },
    entry: { projectsSub: 'Madera y Vidrio', collectionsSub: 'Calvente Design' },
    workshop: {
      eyebrow: 'Our workshop · In Seville since 2005',
      heading: [
        { text: 'We work wood ' },
        { text: 'by hand, without hurry', accent: true },
        { text: '. We are ' },
        { text: 'craftsmen', accent: true },
        { text: '.' },
      ],
      planksAlt: 'Planks in the workshop',
      detailAlt: 'Joint detail',
      photos: [
        { image: 'taller-cepillos.jpg', caption: 'Hand planes' },
        { image: 'taller-sargentos.jpg', caption: 'Bar clamps' },
        { image: 'taller-herramientas.jpg', caption: 'Hand tools' },
      ],
    },
  },
};
