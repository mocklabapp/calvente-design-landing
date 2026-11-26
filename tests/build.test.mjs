import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import { site } from '../src/config/site.ts';
import { fixture } from './helpers/build-fixture.mjs';

const read = (path) => readFile(new URL(`../dist/client/${path}`, import.meta.url), 'utf8');
const html = await read('index.html');
const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const hrefs = (markup) => [...markup.matchAll(/<a\b[^>]*?href="([^"]+)"/g)].map((match) => match[1]);
/** Links inside the first element whose opening tag matches `open` (e.g. `<footer`). */
const linksIn = (markup, open, close) => {
  const start = markup.indexOf(open);
  assert.ok(start >= 0, `${open} missing`);
  return hrefs(markup.slice(start, markup.indexOf(close, start)));
};

test('the home page renders the shared site identity', () => {
  assert.ok(html.includes(`<title>${escapeHtml(site.name)}</title>`));
  assert.ok(html.includes(`<h1 class="sr-only">${escapeHtml(site.name)}</h1>`));
  assert.ok(html.includes(escapeHtml(site.description)));
  assert.match(site.contact.email, /^[^@\s]+@[^@\s]+$/);
  assert.match(site.contact.whatsappUrl, /^https:\/\/wa\.me\/\d+$/);
});

test('the layout renders document language and metadata', () => {
  assert.ok(html.includes(`<html lang="${site.language}" dir="ltr">`));
  assert.ok(html.includes('name="viewport"'));
  assert.ok(html.includes(`name="description" content="${escapeHtml(site.description)}"`));
  assert.ok(html.includes('<main'));
});

const inlineStyles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)]
  .map((match) => match[1]);
const stylesheets = await Promise.all(
  [...html.matchAll(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/g)].map((match) => read(match[1])),
);
const css = [...inlineStyles, ...stylesheets].join('\n');

test('Tailwind compiles the semantic utilities used by the shared layout', () => {
  assert.match(html, /<body\b[^>]*class="[^"]*bg-canvas[^"]*"/);
  assert.match(css, /\.bg-canvas\s*\{/);
  assert.match(css, /\.text-ink\s*\{/);
  assert.match(css, /\.font-mono\s*\{/);
  assert.doesNotMatch(css, /@(?:import\s*["']tailwindcss|theme\b)/);
});

test('the generated theme exposes semantic tokens instead of a default color palette', () => {
  for (const name of ['canvas', 'surface', 'ink', 'muted', 'line', 'brand', 'on-brand']) {
    assert.match(css, new RegExp(`--color-${name}\\s*:`));
  }
  for (const role of ['mono', 'sans', 'serif', 'logo']) assert.match(css, new RegExp(`--font-${role}\\s*:`));
  assert.doesNotMatch(css, /--color-(?:red|blue|green)-\d+\s*:/);
});

test('the approved light and dark palettes are exposed, with dark following the system or the toggle', () => {
  const light = { bg: 'f5efe4', bg2: 'ece4d5', paper: 'faf6ee', tile: 'e9e2d5', fg: '8a3517', fg2: 'a4603f', ink: '2d2d23', muted: '7c7458', oak: 'b48954' };
  const dark = { bg: '1e1b16', bg2: '29251e', paper: '25211b', tile: '2e2a22', fg: 'e38c68', fg2: 'c98564', ink: 'ece4d6', muted: 'aba282', oak: 'c99b63' };
  const [root, ...rest] = css.split(/@media\s*\(prefers-color-scheme:\s*dark\)/);
  const [system, manual] = rest.join('').split(':root[data-theme=dark]');
  assert.ok(system && manual, 'dark palette must exist for the system preference and the manual toggle');
  assert.match(system, /:root:not\(\[data-theme=light\]\)/);
  for (const [name, value] of Object.entries(light)) assert.match(root, new RegExp(`--cd-${name}:#${value}`));
  for (const [name, value] of Object.entries(dark)) {
    assert.match(system, new RegExp(`--cd-${name}:#${value}`));
    assert.match(manual, new RegExp(`--cd-${name}:#${value}`));
  }
});

test('fonts are self-hosted WOFF2 files with swap and no external font request', async () => {
  const everything = html + css;
  assert.doesNotMatch(everything, /fonts\.(?:googleapis|gstatic)\.com/);
  const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((match) => match[1]);
  const families = new Set(faces.map((face) => face.match(/font-family:\s*"?([^;"]+)/)?.[1]));
  assert.deepEqual([...families].sort(), ['EB Garamond', 'IBM Plex Mono', 'IBM Plex Sans', 'Jost']);
  assert.equal(faces.length, 7);
  for (const face of faces) {
    assert.match(face, /font-display:\s*swap/);
    assert.match(face, /unicode-range:\s*U\+/);
    const url = face.match(/url\(([^)]+\.woff2)\)/)?.[1];
    assert.ok(url?.startsWith('/_astro/'), face);
    await access(new URL(`../dist/client${url}`, import.meta.url));
  }
});

test('a saved theme is applied before first paint and the toggle is wired', () => {
  const script = html.indexOf('cd-web-prefs');
  assert.ok(script > 0 && script < html.indexOf('rel="stylesheet"'), 'head script must precede the stylesheet');
  assert.match(html, /data-theme-toggle[^>]*data-label-dark="◑ Oscuro" data-label-light="◐ Claro"/);
});

const registry = [
  ['colecciones', 'Colecciones', 'Piezas diseñadas y fabricadas por Calvente.'],
  ['perfil', 'Perfil', 'Colecciones diseñadas y fabricadas por Juanma Calvente'],
  ['contacto', 'Contacto', 'Datos de contacto del taller de Calvente Design'],
  ['privacidad', 'Privacidad', 'tratamiento de los datos personales'],
  ['cookies', 'Cookies', 'uso de cookies en este sitio web.'],
  ['aviso-legal', 'Aviso legal', 'Información legal sobre el titular'],
  ['en/collections', 'Collections', 'Pieces designed and made by Calvente.'],
  ['en/profile', 'Profile', 'Collections designed and made by Seville cabinetmaker'],
  ['en/contact', 'Contact', 'Contact details for the Calvente Design workshop'],
  ['en/privacy', 'Privacy', 'how personal data is handled on this website.'],
  ['en/cookies', 'Cookies', 'use of cookies on this website.'],
  ['en/legal-notice', 'Legal notice', 'Legal information about the owner'],
];

test('every published registry page renders a single h1 with its title and intro', async () => {
  for (const [path, title, intro] of registry) {
    const page = await read(`${path}/index.html`);
    assert.equal(page.match(/<h1\b/g)?.length, 1, path);
    assert.match(page, new RegExp(`<h1\\b[^>]*>${title}</h1>`), path);
    assert.match(page, new RegExp(`<p\\b[^>]*>[^<]*${intro}`), path);
    assert.match(page, new RegExp(`<title>${title} \\| ${site.name}</title>`), path);
  }
});

test('the project routes are not prerendered by the registry renderer', async () => {
  for (const path of ['proyectos', 'en/projects']) {
    await assert.rejects(read(`${path}/index.html`), { code: 'ENOENT' });
  }
});

test('desktop menu, mobile menu and footer link to published translated routes', async () => {
  const sections = ['/proyectos/', '/colecciones/', '/perfil/', '/contacto/'];
  const legal = ['/privacidad/', '/cookies/', '/aviso-legal/'];
  assert.deepEqual(linksIn(html, '<nav class="sections"', '</nav>'), sections);
  assert.deepEqual(linksIn(html, '<nav class="links"', '</nav>'), ['/', ...sections]);
  assert.deepEqual(linksIn(html, '<footer', '</footer>').filter((href) => href.startsWith('/')), [
    ...legal, ...sections,
  ]);
  const english = await read('en/index.html');
  assert.deepEqual(linksIn(english, '<nav class="sections"', '</nav>'),
    ['/en/projects/', '/en/collections/', '/en/profile/', '/en/contact/']);
  assert.deepEqual(linksIn(english, '<footer', '</footer>').filter((href) => href.startsWith('/')),
    ['/en/privacy/', '/en/cookies/', '/en/legal-notice/',
      '/en/projects/', '/en/collections/', '/en/profile/', '/en/contact/']);
});

test('the language toggle links to the published equivalent and marks the current language', async () => {
  const spanish = await read('colecciones/index.html');
  const english = await read('en/collections/index.html');
  for (const page of [spanish, english]) {
    assert.match(page, /<a href="\/colecciones\/" lang="es" hreflang="es"/);
    assert.match(page, /<a href="\/en\/collections\/" lang="en" hreflang="en"/);
  }
  assert.match(spanish, /href="\/colecciones\/"[^>]*aria-current="page"[^>]*>ES</);
  assert.match(english, /href="\/en\/collections\/"[^>]*aria-current="page"[^>]*>EN</);
  assert.match(english, /<nav class="lang"[^>]*aria-label="Language"/);
});

test('the mobile menu is a hidden labelled dialog opened by the header button', () => {
  assert.match(html, /<button[^>]*data-menu-open[^>]*aria-expanded="false"[^>]*aria-controls="mmenu"/);
  assert.match(html, /<div id="mmenu"[^>]*role="dialog"[^>]*aria-modal="true"[^>]*aria-label="Menú"[^>]*hidden/);
  assert.match(html, /data-menu-close[^>]*aria-label="Cerrar"/);
  assert.match(html, /href="tel:\+34635996882"/);
  assert.match(html, /href="https:\/\/wa\.me\/34635996882" target="_blank" rel="noopener"/);
});

test('social placeholders show the pending toast and the newsletter sends nothing', async () => {
  for (const [page, instagram, linkedin, sample] of [
    [html, 'Enlace de Instagram pendiente de confirmar.', 'Enlace de LinkedIn pendiente de confirmar.', 'Suscripción de ejemplo registrada.'],
    [await read('en/index.html'), 'Instagram link pending confirmation.', 'LinkedIn link pending confirmation.', 'Sample subscription saved.'],
  ]) {
    assert.ok(page.includes(`data-toast="${instagram}"`) && page.includes(`data-toast="${linkedin}"`));
    const form = page.match(/<form\b[^>]*>[\s\S]*?<\/form>/)?.[0] ?? '';
    assert.ok(form.includes(`data-toast-submit="${sample}"`));
    assert.doesNotMatch(form, /\saction=|\sname=/, 'the newsletter must not submit any field');
  }
  assert.match(html, /id="toast"[^>]*role="status"[^>]*hidden/);
});

test('an unknown local image name fails the build instead of rendering a broken tile', async () => {
  const result = await fixture(({ replace }) =>
    replace('src/components/shared/MobileMenu.astro', 'jo0285-001.jpg', 'missing-photo.jpg'));
  assert.equal(result.status, 1, result.output);
  assert.ok(result.output.includes('[images] Unknown image "missing-photo.jpg"'), result.output);
});
