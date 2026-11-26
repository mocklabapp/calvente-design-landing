import type { Locale } from '@/i18n/locales';

/** Collections copy; the prototype wording is kept and English is translated. */
export interface CollectionsCopy {
  all: string;
  items: string;
  filterLabel: string;
  empty: string;
  dimensions: string;
  height: string;
  weight: string;
  madeToOrder: string;
  madeToOrderNote: string;
  availability: string;
  collection: string;
  brand: string;
  reference: string;
  /** `{n}` and `{total}` are replaced by the current and total view numbers. */
  viewCount: string;
  viewLabel: string;
  views: string;
  next: string;
}

export const copy: Record<Locale, CollectionsCopy> = {
  es: {
    all: 'Todo',
    items: 'productos',
    filterLabel: 'Filtrar por categoría',
    empty: 'No hay piezas en esta categoría todavía.',
    dimensions: 'Medidas',
    height: 'Altura',
    weight: 'Peso',
    madeToOrder: 'Fabricación por encargo',
    madeToOrderNote: 'Cada pieza se fabrica a mano en nuestro taller de Sevilla.',
    availability: 'Consultar disponibilidad',
    collection: 'Colección',
    brand: 'Calvente Design',
    reference: 'Ref.',
    viewCount: 'Vista {n} / {total}',
    viewLabel: 'Vista {n}',
    views: 'Vistas del producto',
    next: 'Siguiente pieza',
  },
  en: {
    all: 'All',
    items: 'products',
    filterLabel: 'Filter by category',
    empty: 'No pieces in this category yet.',
    dimensions: 'Size',
    height: 'Height',
    weight: 'Weight',
    madeToOrder: 'Made to order',
    madeToOrderNote: 'Each piece is handmade in our Seville workshop.',
    availability: 'Check availability',
    collection: 'Collection',
    brand: 'Calvente Design',
    reference: 'Ref.',
    viewCount: 'View {n} / {total}',
    viewLabel: 'View {n}',
    views: 'Product views',
    next: 'Next piece',
  },
};

/** Fill the `{name}` placeholders of a copy template. */
export function fill(template: string, values: Record<string, number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}
