import { getSecret } from 'astro:env/server';
import { fetchPublicProjects } from './projects-client.ts';

export interface ProjectTranslation {
  language: string;
  title: string | null;
  description: string | null;
}

export interface PublicProject {
  /** Postgres bigint serialized as text, never a JavaScript number. */
  id: string;
  title: string | null;
  description: string | null;
  weblink: string | null;
  originalLanguage: string | null;
  translations: ProjectTranslation[];
}

/** Server-only, fixed-owner public portfolio. Call from an on-demand Astro route. */
export async function getProjects(): Promise<PublicProject[]> {
  // Resolve trusted configuration per request; never accept visitor overrides.
  return fetchPublicProjects(getSecret('MOCKLAB_PROJECTS_URL'), getSecret('MOCKLAB_USER_ID'));
}
