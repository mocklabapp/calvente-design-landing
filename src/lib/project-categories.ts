import type { Locale } from '../i18n/locales.ts';

/** Stored form values, in presentation order; never translate these identifiers. */
export const projectCategoryIds = Object.freeze([
  'residencial',
  'docente',
  'oficinas',
  'planeamiento',
  'industrial',
  'cultural',
  'publico',
  'rehabilitacion',
  'interiorismo',
  'sanitario',
] as const);

export type ProjectCategoryId = (typeof projectCategoryIds)[number];

const labels: Record<Locale, Record<ProjectCategoryId, string>> = {
  es: {
    residencial: 'Residencial',
    docente: 'Docente',
    oficinas: 'Oficinas',
    planeamiento: 'Planeamiento',
    industrial: 'Industrial',
    cultural: 'Cultural',
    publico: 'Espacio público',
    rehabilitacion: 'Rehabilitación',
    interiorismo: 'Interiorismo',
    sanitario: 'Sanitario',
  },
  en: {
    residencial: 'Residential',
    docente: 'Educational',
    oficinas: 'Offices',
    planeamiento: 'Urban planning',
    industrial: 'Industrial',
    cultural: 'Cultural',
    publico: 'Public space',
    rehabilitacion: 'Rehabilitation',
    interiorismo: 'Interior design',
    sanitario: 'Healthcare',
  },
};

/** Resolve exact stored values and languages only, without fallback or normalization. */
export function getProjectCategoryLabel(
  category: string | null | undefined,
  language: string,
): string | null {
  const id = projectCategoryIds.find((value) => value === category);
  const dictionary = Object.entries(labels).find(([locale]) => locale === language)?.[1];
  return id && dictionary ? dictionary[id] : null;
}

/** Fresh options can be adapted by a consumer without mutating the catalog. */
export function getProjectCategoryOptions(locale: Locale): { value: ProjectCategoryId; label: string }[] {
  return projectCategoryIds.map((value) => ({ value, label: labels[locale][value] }));
}
