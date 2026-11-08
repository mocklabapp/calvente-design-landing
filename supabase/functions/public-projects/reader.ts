import { hasRole, infrastructureKey, parsePage, unavailable, type PublicProject } from './validation.ts';
export type { PublicProject } from './validation.ts';

export interface ReaderConfig {
  SUPABASE_URL: string | undefined;
  SUPABASE_ANON_KEY: string | undefined;
  SUPABASE_PUBLISHABLE_KEYS?: string | undefined;
  PUBLIC_PROJECTS_ROLE_JWT: string | undefined;
}

export interface ReaderDependencies {
  fetch: typeof fetch;
  timeout?: typeof AbortSignal.timeout;
}

/** Trusted runtime configuration only; uid is a public selector, not authorization. */
export async function readPublicProjects(
  uid: string,
  config: ReaderConfig,
  dependencies: ReaderDependencies = { fetch },
): Promise<PublicProject[]> {
  try {
    const { SUPABASE_URL: base, PUBLIC_PROJECTS_ROLE_JWT: token } = config;
    const key = infrastructureKey(config.SUPABASE_PUBLISHABLE_KEYS, config.SUPABASE_ANON_KEY);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid)
      || !base || !/^https:\/\/[a-z0-9]{20}\.supabase\.co\/?$/.test(base)
      || !hasRole(token, 'public_projects_runtime')) throw unavailable();
    const owner = uid.toLowerCase();
    const signal = (dependencies.timeout ?? AbortSignal.timeout)(10_000);
    const projects: PublicProject[] = [];
    let total: number | undefined;
    let previous = 0n;
    while (true) {
      signal.throwIfAborted();
      const offset = projects.length;
      if (offset > 1_000_000) throw unavailable();
      const response = await dependencies.fetch(new URL('/rest/v1/rpc/export_public_projects', base), {
        method: 'POST',
        headers: { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_owner: owner, p_offset: offset, p_limit: 200 }),
        signal, cache: 'no-store', redirect: 'error',
      });
      if (!response.ok || response.redirected) throw unavailable();
      const value: unknown = await response.json();
      signal.throwIfAborted();
      const page = parsePage(value, offset, new URL(base).origin);
      if (total !== undefined && page.total !== total) throw unavailable();
      total = page.total;
      if (offset + page.projects.length > total) throw unavailable();
      for (const project of page.projects) {
        const id = BigInt(project.id);
        if (id <= previous) throw unavailable();
        previous = id;
        projects.push(project);
      }
      if (projects.length === total) return projects;
      if (page.projects.length === 0) throw unavailable();
    }
  } catch {
    // Never propagate upstream bodies, credentials or validation details, even after a valid page.
    throw unavailable();
  }
}
