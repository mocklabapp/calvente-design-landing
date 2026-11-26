import { projectCategoryIds, getProjectCategoryLabel, type ProjectCategoryId } from '@/lib/project-categories';
import { selectProjectContent, type ProjectContent } from '@/lib/project-content';
import type { Locale } from '@/i18n/locales';
import type { NormalizedPublicProject } from '@/lib/projects';

/** One project prepared for display in a single locale; text is never borrowed from another. */
export interface ProjectView {
  project: NormalizedPublicProject;
  content: ProjectContent;
  categoryLabel: string | null;
}

export function toView(project: NormalizedPublicProject, locale: Locale): ProjectView {
  return {
    project,
    content: selectProjectContent(project, locale),
    categoryLabel: getProjectCategoryLabel(project.category, locale),
  };
}

/** Catalog categories that at least one project uses, in catalog order. */
export function presentCategories(projects: NormalizedPublicProject[]): ProjectCategoryId[] {
  return projectCategoryIds.filter((id) => projects.some((project) => project.category === id));
}

/** A category filter is honored only when a project uses it; anything else shows all. */
export function activeCategory(
  requested: string | null,
  projects: NormalizedPublicProject[],
): ProjectCategoryId | null {
  return presentCategories(projects).find((id) => id === requested) ?? null;
}

export function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Split stored text into paragraphs on line breaks. */
export function paragraphs(text: string | null): string[] {
  return (text ?? '').split(/\r?\n+/).map((line) => line.trim()).filter(Boolean);
}

/** Only absolute http(s) links without credentials become anchors. */
export function safeWebLink(value: string | null): { href: string; label: string } | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password) return null;
    return { href: url.href, label: url.host + (url.pathname === '/' ? '' : url.pathname) };
  } catch {
    return null;
  }
}

/** Meta description: the project's own text when it has one, else the registry text. */
export function summarize(text: string | null, fallback: string, max = 160): string {
  const flat = paragraphs(text).join(' ');
  if (!flat) return fallback;
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`;
}
