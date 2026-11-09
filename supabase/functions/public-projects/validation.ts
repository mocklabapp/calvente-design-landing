import { parseProjectImages, type ProjectImage } from './images.ts';

export interface PublicProject {
  id: string;
  title: string | null;
  description: string | null;
  weblink: string | null;
  images: ProjectImage[];
  category: string | null;
  year: string | null;
  originalLanguage: 'es' | 'en' | 'ca' | null;
  translations: { language: 'es' | 'en' | 'ca'; title: string | null; description: string | null }[];
}

export const unavailable = () => new Error('Projects unavailable');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function record(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw unavailable();
  return value;
}

function text(value: unknown): string | null {
  if (value === null || typeof value === 'string') return value;
  throw unavailable();
}

function language(value: unknown): 'es' | 'en' | 'ca' {
  if (value === 'es' || value === 'en' || value === 'ca') return value;
  throw unavailable();
}

function project(value: unknown, origin: string): PublicProject {
  const row = record(value);
  if (typeof row.id !== 'string' || !/^[1-9]\d{0,18}$/.test(row.id)
    || BigInt(row.id) > 9223372036854775807n || !Array.isArray(row.translations)) throw unavailable();
  const seen = new Set<string>();
  const translations = row.translations.map((item: unknown) => {
    const translation = record(item);
    const locale = language(translation.language);
    if (seen.has(locale)) throw unavailable();
    seen.add(locale);
    return { language: locale, title: text(translation.title), description: text(translation.description) };
  });
  return {
    id: row.id, title: text(row.title), description: text(row.description), weblink: text(row.weblink),
    originalLanguage: row.originalLanguage === null ? null : language(row.originalLanguage), translations,
    images: Object.hasOwn(row, 'images') ? parseProjectImages(row.images, origin) : [],
    category: Object.hasOwn(row, 'category') ? text(row.category) : null,
    year: Object.hasOwn(row, 'year') ? text(row.year) : null,
  };
}

export function parsePage(value: unknown, offset: number, origin: string) {
  const row = record(value);
  if (typeof row.total !== 'string' || !/^(0|[1-9]\d{0,6})$/.test(row.total)
    || Number(row.total) > 1_000_200 || row.offset !== offset || row.limit !== 200
    || !Array.isArray(row.projects) || row.count !== row.projects.length
    || row.projects.length > 200) throw unavailable();
  return { total: Number(row.total), projects: row.projects.map((item: unknown) => project(item, origin)) };
}

/** An explicit publishable dictionary must be valid; only absence permits legacy fallback. */
export function infrastructureKey(publishableKeys: string | undefined, legacyKey: string | undefined): string {
  if (publishableKeys === undefined) {
    if (!hasRole(legacyKey, 'anon')) throw unavailable();
    return legacyKey;
  }
  const decoded: unknown = JSON.parse(publishableKeys);
  const key = record(decoded).default;
  const prefix = 'sb_publishable_';
  if (typeof key !== 'string' || !key.startsWith(prefix) || key.length === prefix.length
    || /[^A-Za-z0-9_-]/.test(key)) throw unavailable();
  return key;
}

/** Claim checks prevent accidental privileged-key configuration; PostgREST verifies signatures. */
export function hasRole(token: string | undefined, role: string): token is string {
  if (!token || !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) return false;
  const payload = token.split('.')[1];
  if (!payload) return false;
  const decoded: unknown = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  return record(decoded).role === role;
}
