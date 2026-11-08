// @ts-check
export const defaultProjectsUrl = 'https://mygqfdbloqojffhsurgo.supabase.co/functions/v1/public-projects';

/** @param {string[]} args */
export function parseArgs(args) {
  const allowed = ['--name', '--slug', '--uid', '--projects-url', '--confirm-plan', '--resume', '--author-name', '--author-email'];
  /** @type {Map<string, string>} */
  const values = new Map();
  for (let i = 0; i < args.length;) {
    const key = args[i];
    if (key === '--apply' && !values.has(key)) {
      values.set(key, 'true');
      i += 1;
      continue;
    }
    const value = args[i + 1];
    if (!key || !allowed.includes(key) || values.has(key) || value === undefined || value.startsWith('--')) {
      throw new Error('Unknown, duplicate or incomplete option. Use --help; apply is not supported.');
    }
    values.set(key, value);
    i += 2;
  }
  if ((values.has('--resume') && values.size !== 1) ||
    (values.has('--apply') && values.has('--confirm-plan')) ||
    (!values.has('--apply') && (values.has('--author-name') || values.has('--author-email')))) {
    throw new Error('Unknown, duplicate or incomplete option combination. Use --help.');
  }
  return values;
}

/** @param {string} name */
export function validateName(name) {
  if (!name || name !== name.trim() || name.length > 100 || /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u.test(name)) {
    throw new Error('Display name must be 1–100 characters without control characters or surrounding spaces.');
  }
  return name;
}

/** @param {string} name */
export function suggestSlug(name) {
  return name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 63).replace(/-$/, '');
}

/** @param {string} slug */
export function validateSlug(slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 63 ||
    ['node-modules', 'node_modules', 'favicon-ico', 'base-landing-mocklab'].includes(slug)) {
    throw new Error('Slug must be a new lowercase name, 1–63 letters/digits with single internal hyphens.');
  }
  return slug;
}

/** @param {string} uid @param {string | undefined} url */
export function validatePortfolio(uid, url) {
  if (!uid) {
    if (url !== undefined) throw new Error('A projects URL requires an owner UUID.');
    return undefined;
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uid)) {
    throw new Error('Portfolio owner must be a valid UUID.');
  }
  if (!url) throw new Error('Portfolio requires an explicitly selected public HTTPS service URL.');
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('Invalid public HTTPS service URL.'); }
  // Accept DNS service names only; no credentials, query tokens, local hosts or IP literals.
  const host = parsed.hostname;
  if (url !== url.trim() || /[\s\\]/.test(url) || parsed.protocol !== 'https:' ||
    parsed.username || parsed.password || parsed.search || parsed.hash || parsed.port ||
    !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(host) ||
    /\.(localhost|local|internal)$/.test(host)) {
    throw new Error('Use a public HTTPS DNS URL without credentials, query, fragment or custom port.');
  }
  return { uid, url: parsed.href };
}
