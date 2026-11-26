import type { Locale } from '@/i18n/locales';

/** A curated project shown in the home hero (local data: the home stays static). */
export interface HeroProject {
  id: string;
  title: string;
  /** First project image, a file name under src/assets/images. */
  image: string;
  category: Record<Locale, string>;
  year: number | null;
  location: Record<Locale, string>;
  /** Architecture studio, or `null` when not yet confirmed. */
  studio: string | null;
}

export interface HeroSlide {
  id: string;
  title: string;
  image: string;
  /** Kicker line: category · year · location. */
  kicker: string;
  studio: string | null;
}

const seville = { es: 'Sevilla', en: 'Seville' };

// Published prototype projects that have images. Studios the prototype marks "por completar"
// are `null`. The prototype shows the draft projects (Sacristía, FG20) nowhere on the home.
const projects: HeroProject[] = [
  {
    id: 'caja-rural', title: 'Sede de Caja Rural del Sur', image: 'jo0432-005.jpg',
    category: { es: 'Oficinas', en: 'Offices' }, year: 2024, location: seville,
    studio: 'arquinur + (bau)m arquitectura',
  },
  {
    id: 'hotel-gerona', title: 'Hotel Gerona 6', image: 'jo0165-001.jpg',
    category: { es: 'Hotel', en: 'Hotel' }, year: null, location: seville, studio: 'Morales Lombardo',
  },
  {
    id: 'vivienda-jgp', title: 'Vivienda JGP', image: 'jo0280-005.jpg',
    category: { es: 'Vivienda', en: 'Housing' }, year: null, location: seville, studio: '(bau)m arquitectura',
  },
  {
    id: 'abades-18', title: 'Abades 18', image: 'jo0413-002.jpg',
    category: { es: 'Vivienda', en: 'Housing' }, year: null, location: seville, studio: null,
  },
  {
    id: 'buenos-libros', title: 'Vivienda Virgen de los Buenos Libros', image: 'jo0425-006.jpg',
    category: { es: 'Vivienda', en: 'Housing' }, year: null, location: seville, studio: null,
  },
  {
    id: 'castellar', title: 'Vivienda Castellar', image: 'castellar-1.png',
    category: { es: 'Vivienda', en: 'Housing' }, year: null,
    location: { es: 'Sevilla (por confirmar)', en: 'Seville (to be confirmed)' }, studio: 'Baum Arquitectura',
  },
];

export const maxHeroSlides = 5;

/** Known-studio projects first, in source order, then the rest; at most five. */
export function heroSlides(locale: Locale, source: HeroProject[] = projects): HeroSlide[] {
  const known = source.filter((project) => project.studio !== null);
  const unknown = source.filter((project) => project.studio === null);
  return [...known, ...unknown].slice(0, maxHeroSlides).map((project) => ({
    id: project.id,
    title: project.title,
    image: project.image,
    kicker: [project.category[locale], project.year, project.location[locale]]
      .filter((part) => part !== null).join(' · '),
    studio: project.studio,
  }));
}
