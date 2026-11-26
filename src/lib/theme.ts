// Theme preference shared by the pre-paint head script and the toggle.
export const prefsStorageKey = 'cd-web-prefs';

export type Theme = 'light' | 'dark';

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

/** Read the saved theme from the serialized preferences, ignoring anything invalid. */
export function parseStoredTheme(raw: string | null): Theme | undefined {
  if (!raw) return undefined;
  try {
    const prefs: unknown = JSON.parse(raw);
    const theme = typeof prefs === 'object' && prefs !== null ? (prefs as { theme?: unknown }).theme : undefined;
    return isTheme(theme) ? theme : undefined;
  } catch {
    return undefined;
  }
}

/** Merge a theme into the serialized preferences, keeping unrelated keys. */
export function serializeTheme(raw: string | null, theme: Theme): string {
  let prefs: Record<string, unknown> = {};
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      prefs = parsed as Record<string, unknown>;
    }
  } catch {
    // Corrupt preferences are replaced.
  }
  return JSON.stringify({ ...prefs, theme });
}
