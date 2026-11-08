export interface ProjectImage {
  url: string;
}

const unavailable = () => new Error('Projects unavailable');

/** Keep in parity with the site's project-images.ts without crossing deployment roots. */
function imageUrl(value: unknown, origin: string): string {
  const prefix = `${origin}/storage/v1/object/public/projects-images/`;
  if (!/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(origin)
    || typeof value !== 'string' || !value.startsWith(prefix)
    || /[\u0000-\u0020\u007f\\?#]/.test(value)) throw unavailable();
  const path = value.slice(prefix.length);
  if (!path || path.endsWith('/')) throw unavailable();
  // Inspect before URL normalization can erase dot segments. Decode object names,
  // not the URL: encoded spaces, Unicode, %, # and ? are legitimate name content.
  let decoded: string;
  try { decoded = decodeURIComponent(path); } catch { throw unavailable(); }
  while (true) {
    if (/[\u0000-\u001f\u007f\\]/.test(decoded)
      || decoded.split('/').some((part) => part === '.' || part === '..')) throw unavailable();
    // Inspect nested escapes even beside a literal percent in the same name.
    // ASCII security checks need octets, not another whole-string URI decode.
    const next = decoded.replace(/%([0-9a-f]{2})/gi,
      (_escape: string, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)));
    if (next === decoded) break;
    decoded = next;
  }
  return value;
}

/** Missing fields are handled by the caller; present null/invalid images fail closed. */
export function parseProjectImages(value: unknown, origin: string): ProjectImage[] {
  if (!Array.isArray(value)) throw unavailable();
  return value.map((image: unknown) => {
    if (!image || typeof image !== 'object' || Array.isArray(image) || !('url' in image)) {
      throw unavailable();
    }
    return { url: imageUrl(image.url, origin) };
  });
}
