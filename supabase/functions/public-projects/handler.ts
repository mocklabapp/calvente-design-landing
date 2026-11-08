import { readPublicProjects, type ReaderConfig, type ReaderDependencies } from './reader.ts';

const headers = {
  'Cache-Control': 'no-store',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

/** Configuration and dependencies are trusted server inputs, never visitor overrides. */
export function createPublicProjectsHandler(
  getConfig: () => ReaderConfig,
  dependencies?: ReaderDependencies,
): (request: Request) => Promise<Response> {
  return async (request) => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'GET') {
      return Response.json({ error: 'Method not allowed' }, {
        status: 405, headers: { ...headers, Allow: 'GET, OPTIONS' },
      });
    }
    const query = new URL(request.url).searchParams;
    const uid = query.get('uid');
    if (query.size !== 1 || uid === null
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid)) {
      return Response.json({ error: 'Invalid query' }, { status: 400, headers });
    }
    try {
      const projects = await readPublicProjects(uid, getConfig(), dependencies);
      return Response.json({ projects }, { status: 200, headers });
    } catch {
      return Response.json({ error: 'Projects unavailable' }, { status: 503, headers });
    }
  };
}
