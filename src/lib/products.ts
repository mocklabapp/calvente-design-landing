/**
 * Locales the catalog is translated into: Spanish (mandatory) and English, the only languages
 * with product route files. Other enabled locales publish no product pages, so they need none.
 */
export const productLocales = ['es', 'en'] as const;
export type ProductLocale = (typeof productLocales)[number];

/** A text available in every product locale. */
export type LocalizedText = Record<ProductLocale, string>;

export interface ProductGroup {
  id: string;
  label: LocalizedText;
}

export interface ProductCategory {
  id: string;
  /** Id of the group this category belongs to. */
  group: string;
  label: LocalizedText;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  /** Id of a category in the catalog. */
  category: string;
  year: number;
  description: LocalizedText;
  short: LocalizedText;
  /** File names under src/assets/images; the first one is the cover. */
  images: string[];
  /** Size labels only; the catalog carries no prices. */
  sizes: LocalizedText[];
  height: string;
  weight: string;
  elec: boolean;
}

export interface Catalog {
  groups: ProductGroup[];
  categories: ProductCategory[];
  products: Product[];
}

/** One group of the filter bar with its non-empty categories. */
export interface FilterGroup {
  group: ProductGroup;
  count: number;
  categories: { category: ProductCategory; count: number }[];
}

const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function localized(value: unknown): value is LocalizedText {
  return isRecord(value) && productLocales.every((locale) => text(value[locale]));
}

function list(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length > 0;
}

function parseGroup(raw: unknown, index: number): ProductGroup {
  if (!isRecord(raw) || !text(raw.id) || !slug.test(raw.id) || !localized(raw.label)) {
    throw new Error(`[products] Malformed group at index ${index}.`);
  }
  return { id: raw.id, label: raw.label };
}

function parseCategory(raw: unknown, index: number, groups: ProductGroup[]): ProductCategory {
  if (!isRecord(raw) || !text(raw.id) || !slug.test(raw.id) || !localized(raw.label) || !text(raw.group)) {
    throw new Error(`[products] Malformed category at index ${index}.`);
  }
  if (!groups.some(({ id }) => id === raw.group)) {
    throw new Error(`[products] Category "${raw.id}": unknown group "${raw.group}".`);
  }
  return { id: raw.id, group: raw.group, label: raw.label };
}

function parseProduct(
  raw: unknown,
  index: number,
  categories: ProductCategory[],
  hasImage: (name: string) => boolean,
): Product {
  if (!isRecord(raw) || !text(raw.id) || !slug.test(raw.id)) {
    throw new Error(`[products] Malformed product at index ${index}.`);
  }
  const { id } = raw;
  const invalid = (field: string) => new Error(`[products] Product "${id}": missing or invalid ${field}.`);
  if (!text(raw.code)) throw invalid('code');
  if (!text(raw.name)) throw invalid('name');
  if (!text(raw.category)) throw invalid('category');
  if (typeof raw.year !== 'number' || !Number.isInteger(raw.year)) throw invalid('year');
  if (!localized(raw.description)) throw invalid('description');
  if (!localized(raw.short)) throw invalid('short');
  if (!list(raw.images) || !raw.images.every(text)) throw invalid('images');
  if (!list(raw.sizes) || !raw.sizes.every(localized)) throw invalid('sizes');
  if (!text(raw.height)) throw invalid('height');
  if (!text(raw.weight)) throw invalid('weight');
  if (typeof raw.elec !== 'boolean') throw invalid('elec');

  const { category } = raw;
  if (!categories.some(({ id: known }) => known === category)) {
    throw new Error(`[products] Product "${id}": unknown category "${category}".`);
  }
  for (const image of raw.images) {
    if (!hasImage(image)) throw new Error(`[products] Product "${id}": unknown image "${image}".`);
  }
  return {
    id, code: raw.code, name: raw.name, category, year: raw.year,
    description: raw.description, short: raw.short, images: raw.images, sizes: raw.sizes,
    height: raw.height, weight: raw.weight, elec: raw.elec,
  };
}

/**
 * Validate external catalog data into typed products. Throws an explicit `[products]` error on
 * the first malformed entry, unknown group/category, duplicate id or image the project lacks.
 */
export function parseCatalog(raw: unknown, hasImage: (name: string) => boolean): Catalog {
  if (!isRecord(raw) || !list(raw.groups) || !list(raw.categories) || !list(raw.products)) {
    throw new Error('[products] Malformed catalog: expected groups, categories and products.');
  }
  const groups = raw.groups.map(parseGroup);
  const categories = raw.categories.map((category, index) => parseCategory(category, index, groups));
  const products = raw.products.map((product, index) => parseProduct(product, index, categories, hasImage));
  const seen = new Set<string>();
  for (const { id } of products) {
    if (seen.has(id)) throw new Error(`[products] Duplicate product id "${id}".`);
    seen.add(id);
  }
  return { groups, categories, products };
}

/** The product with this id, or `undefined`. */
export function findProduct(products: readonly Product[], id: string): Product | undefined {
  return products.find((product) => product.id === id);
}

/** The piece after `id` in catalog order, wrapping around; `undefined` for an unknown id. */
export function nextProduct(products: readonly Product[], id: string): Product | undefined {
  const index = products.findIndex((product) => product.id === id);
  return index < 0 ? undefined : products[(index + 1) % products.length];
}

/** Groups and categories that have products, with counts, in catalog order. */
export function filterGroups(catalog: Catalog): FilterGroup[] {
  const groups: FilterGroup[] = [];
  for (const group of catalog.groups) {
    const categories = catalog.categories
      .filter((category) => category.group === group.id)
      .map((category) => ({
        category,
        count: catalog.products.filter((product) => product.category === category.id).length,
      }))
      .filter(({ count }) => count > 0);
    const count = categories.reduce((total, entry) => total + entry.count, 0);
    if (count > 0) groups.push({ group, count, categories });
  }
  return groups;
}
