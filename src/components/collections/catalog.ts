import data from '@/data/products.json';
import type { Locale } from '@/i18n/locales';
import { pathFor } from '@/i18n/routes';
import { getLocalImage } from '@/lib/images';
import {
  filterGroups, findProduct, nextProduct, parseCatalog, type Product, type ProductCategory,
} from '@/lib/products';

function imageExists(name: string): boolean {
  try {
    getLocalImage(name);
    return true;
  } catch {
    return false;
  }
}

// Validated once at build; a malformed entry, unknown category or missing image fails it.
const catalog = parseCatalog(data as unknown, imageExists);

/** Every published product, in catalog order. */
export const products: readonly Product[] = catalog.products;

/** Filter bar entries: only groups and categories that have products. */
export const filters = filterGroups(catalog);

export const byId = (id: string): Product | undefined => findProduct(products, id);
export const next = (id: string): Product | undefined => nextProduct(products, id);

export function categoryOf(product: Product): ProductCategory {
  const category = catalog.categories.find(({ id }) => id === product.category);
  if (!category) throw new Error(`[products] Product "${product.id}": unknown category.`);
  return category;
}

/**
 * Static paths of the product pages for one locale. Empty unless that locale publishes both the
 * collections and contact pages (disabled languages and partial registries generate nothing).
 */
export function productPaths(locale: Locale) {
  if (pathFor('collections', locale) === undefined || pathFor('contact', locale) === undefined) return [];
  return products.map((product) => ({ params: { id: product.id }, props: { product } }));
}
