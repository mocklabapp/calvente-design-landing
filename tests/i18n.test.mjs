// @ts-check
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test, { after } from 'node:test';
import { fixture } from './helpers/build-fixture.mjs';
import { site } from '../src/config/site.ts';

/** @param {string} text */
const htmlText = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const renamedSite = 'Clínica Norte & Salud';

const originals = ['astro.config.mjs', 'src/i18n/locales.ts', 'src/i18n/ui.ts', 'src/data/pages.ts'];
const before = await Promise.all(originals.map((path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')));
after(async () => {
  assert.deepEqual(await Promise.all(originals.map((path) =>
    readFile(new URL(`../${path}`, import.meta.url), 'utf8'))), before);
});
const enabled = "= ['es', 'en'];";
/** @param {import('./helpers/build-fixture.mjs').FixtureInput} input */
const disableEnglish = ({ replace }) => replace('src/i18n/locales.ts', enabled, "= ['es'];");
/**
 * Registers another locale whose UI starts as a copy of the English dictionary.
 * @param {import('./helpers/build-fixture.mjs').FixtureInput['replace']} replace
 * @param {string} entry registry entry for the new locale
 * @param {string} code locale code
 * @param {string} translation language navigation label for the new locale
 */
const addLocale = async (replace, entry, code, translation) => {
  await replace('src/i18n/locales.ts', '  en:', `${entry},\n  en:`);
  await replace('src/i18n/locales.ts', enabled, `= ['es', '${code}'];`);
  await replace('src/i18n/ui.ts', '= { es, en };', `= {
  es, en, ${code}: { ...en, languageNavigation: '${translation}' },
};`);
  await replace('src/data/pages.ts', '      en: {', `      ${code}: {
        slug: '', title: site.name, description: 'Test description.', body: 'Contenu de test.',
      },
      en: {`);
};
/** @param {string} html */
const languageLinks = (html) => {
  const toggle = html.match(/<nav class="lang"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
  return [...toggle.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
};
/** @param {Awaited<ReturnType<typeof fixture>>} result */
const success = (result) => assert.equal(result.status, 0, result.output);
/**
 * @param {Awaited<ReturnType<typeof fixture>>} result
 * @param {string} diagnostic
 */
const rejected = (result, diagnostic) => {
  assert.equal(result.status, 1, result.output);
  assert.ok(result.output.includes(diagnostic), result.output);
};
const bilingual = fixture();
const spanishOnly = fixture(disableEnglish);
const renamed = fixture(async (input) => {
  const source = await readFile(new URL('../src/config/site.ts', import.meta.url), 'utf8');
  const nameLine = source.match(/^  name: .+,$/m)?.[0];
  assert.ok(nameLine, 'site identity must remain an explicit shared configuration field');
  await input.replace('src/config/site.ts', nameLine, `  name: ${JSON.stringify(renamedSite)},`);
});

test('default build publishes Spanish at the root and English under /en/', async () => {
  const result = await bilingual;
  success(result);
  const html = await result.html();
  assert.match(html, /<html lang="es" dir="ltr">/);
  assert.ok(html.includes(`<h1 class="sr-only">${htmlText(site.name)}</h1>`));
  assert.match(html, /Trabajamos la madera a mano y sin prisa para arquitectos y para ti/);
  assert.match(html, /name="description" content="Carpintería de autor\./);
  assert.match(await result.html('en/index.html'), /<html lang="en" dir="ltr">/);
});

test('disabled English generates no output, toggle or hreflang references', async () => {
  const result = await spanishOnly;
  success(result);
  await assert.rejects(result.html('en/index.html'), { code: 'ENOENT' });
  await assert.rejects(result.html('en/collections/index.html'), { code: 'ENOENT' });
  const html = await result.html();
  assert.doesNotMatch(html, /\/en\/|hreflang="en"|class="lang"/);
  assert.match(html, /href="\/colecciones\/"/);
  assert.match(html, /rel="canonical" href="https:\/\/example.test\/"/);
});

test('renamed client build preserves opt-in English content, UI and shared identity', async () => {
  const result = await renamed;
  success(result);
  const html = await result.html('en/index.html');
  assert.match(html, /<html lang="en" dir="ltr">/);
  assert.ok(html.includes(`<title>${htmlText(renamedSite)}</title>`));
  assert.ok(html.includes(`<h1 class="sr-only">${htmlText(renamedSite)}</h1>`));
  assert.match(html, /name="description" content="Bespoke joinery\. We make pieces/);
  assert.match(html, /We work wood by hand, unhurried, for architects and for you/);
  assert.match(html, /<nav class="lang"[^>]*aria-label="Language"/);
  assert.match(html, /href="\/en\/" lang="en" hreflang="en" aria-label="English" aria-current="page"[^>]*>EN</);
  assert.match(html, /href="\/" lang="es" hreflang="es" aria-label="Español"[^>]*>ES</);
  assert.match(html, /aria-label="Calvente Design · home"/);
  const spanish = await result.html();
  assert.ok(spanish.includes(`<title>${htmlText(renamedSite)}</title>`));
  assert.ok(spanish.includes(`<h1 class="sr-only">${htmlText(renamedSite)}</h1>`));
  assert.match(spanish, /aria-label="Idioma"/);
  assert.match(spanish, /aria-label="Navegación principal"/);
});

test('canonical and reciprocal hreflang use the configured production site', async () => {
  const result = await bilingual;
  success(result);
  for (const [file, path, es, en] of [
    ['index.html', '/', '/', '/en/'],
    ['en/index.html', '/en/', '/', '/en/'],
    ['colecciones/index.html', '/colecciones/', '/colecciones/', '/en/collections/'],
    ['en/collections/index.html', '/en/collections/', '/colecciones/', '/en/collections/'],
  ]) {
    const html = await result.html(file);
    assert.ok(html.includes(`rel="canonical" href="https://example.test${path}"`));
    for (const [lang, url] of [['es', es], ['en', en], ['x-default', es]]) {
      assert.ok(html.includes(`rel="alternate" hreflang="${lang}" href="https://example.test${url}"`));
    }
  }
});

test('unset site omits absolute SEO links without disabling language navigation', async () => {
  const result = await fixture(async () => {}, { site: false });
  success(result);
  const html = await result.html();
  assert.doesNotMatch(html, /rel="canonical"|rel="alternate"/);
  assert.deepEqual(languageLinks(html), ['/', '/en/']);
});

test('a third configured language works while English remains disabled', async () => {
  const result = await fixture(({ replace }) => addLocale(
    replace, "  fr: { label: 'Français', lang: 'fr', dir: 'ltr' }", 'fr', 'Navigation des langues'));
  success(result);
  const html = await result.html('fr/index.html');
  assert.match(html, /<html lang="fr" dir="ltr">/);
  assert.match(html, /Contenu de test\./);
  assert.match(html, /Navigation des langues/);
  assert.match(html, /hreflang="fr"/);
  assert.doesNotMatch(html, /\/en\/|hreflang="en"/);
  assert.deepEqual(languageLinks(html), ['/', '/fr/']);
  await assert.rejects(result.html('en/index.html'), { code: 'ENOENT' });
});

test('a locale that translates only some pages links only to the pages it publishes', async () => {
  const result = await fixture(({ replace }) => addLocale(
    replace, "  fr: { label: 'Français', lang: 'fr', dir: 'ltr' }", 'fr', 'Navigation des langues'));
  success(result);
  const html = await result.html('fr/index.html');
  assert.doesNotMatch(html, /href="\/(?:fr\/)?(?:proyectos|colecciones|perfil|contacto|privacidad)\//);
  assert.match(html, /<a href="\/fr\/"/);
  await assert.rejects(result.html('fr/colecciones/index.html'), { code: 'ENOENT' });
});

test('registered RTL direction and HTML language reach generated markup', async () => {
  const result = await fixture(({ replace }) => addLocale(
    replace, "  ar: { label: 'العربية', lang: 'ar', dir: 'rtl' }", 'ar', 'التنقل بين اللغات'));
  success(result);
  assert.match(await result.html('ar/index.html'), /<html lang="ar" dir="rtl">/);
});

test('translated slugs preserve page identity and omit unavailable page translations', async () => {
  const result = await fixture(async (input) => {
    await input.replace('src/data/pages.ts', 'export const pages: Page[] = [', `export const pages: Page[] = [
      { id: 'about', translations: {
        es: { slug: 'acerca', title: 'Acerca', description: 'Descripción de prueba.', body: 'Contenido de prueba.' },
        en: { slug: 'about', title: 'About', description: 'Test description.', body: 'Test content.' },
      } },
      { id: 'notes', translations: {
        es: { slug: 'notas', title: 'Notas', description: 'Solo español.', body: 'Solo español.' },
      } },`);
  });
  success(result);
  const spanish = await result.html('acerca/index.html');
  const english = await result.html('en/about/index.html');
  assert.ok(spanish.includes(`<title>Acerca | ${htmlText(site.name)}</title>`));
  assert.ok(english.includes(`<title>About | ${htmlText(site.name)}</title>`));
  for (const html of [spanish, english]) {
    assert.deepEqual(languageLinks(html), ['/acerca/', '/en/about/']);
    assert.match(html, /hreflang="en" href="https:\/\/example.test\/en\/about\/"/);
  }
  // Pages without a registered view fall back to the page head: title and intro.
  assert.match(spanish, /<h1\b[^>]*>Acerca<\/h1>/);
  assert.match(english, /<p\b[^>]*>Test content\./);
  const notes = await result.html('notas/index.html');
  assert.doesNotMatch(notes, /class="lang"|hreflang="en"|\/en\//);
  await assert.rejects(result.html('en/notas/index.html'), { code: 'ENOENT' });
});

test('duplicate stable page IDs fail even with distinct published paths', async () => {
  const result = await fixture(async ({ replace }) => {
    await replace('src/data/pages.ts', 'export const pages: Page[] = [', `export const pages: Page[] = [
      { id: 'audit-duplicate', translations: {
        es: { slug: 'audit-one', title: 'First', description: 'Test description.', body: 'Test content.' },
      } },
      { id: 'audit-duplicate', translations: {
        es: { slug: 'audit-two', title: 'Second', description: 'Test description.', body: 'Test content.' },
      } },`);
  });
  rejected(result, '[i18n] Duplicate page ID audit-duplicate.');
  await assert.rejects(result.html('audit-one/index.html'), { code: 'ENOENT' });
  await assert.rejects(result.html('audit-two/index.html'), { code: 'ENOENT' });
});

test('colliding published paths fail before static generation', async () => {
  const result = await fixture(async (input) => {
    await input.replace('src/data/pages.ts', 'export const pages: Page[] = [', `export const pages: Page[] = [
      { id: 'spanish-guide', translations: {
        es: { slug: 'en', title: 'Guía', description: 'Descripción de prueba.', body: 'Contenido de prueba.' },
      } },`);
  });
  rejected(result, '[i18n] Colliding published path /en/: spanish-guide/es and home/en.');
});

test('an incomplete published translation fails with an intentional diagnostic', async () => {
  const result = await fixture(async (input) => {
    await input.replace('src/data/pages.ts',
      "body: 'We work wood by hand, unhurried, for architects and for you'", "body: ''");
  });
  rejected(result, '[i18n] Incomplete translation for home/en.');
});

test('an absent mandatory Spanish translation fails with an intentional diagnostic', async () => {
  const result = await fixture(async ({ replace }) => {
    await replace('src/data/pages.ts', 'export const pages: Page[] = [', `export const pages: Page[] = [
      { id: 'audit-no-spanish', translations: {
        en: { slug: 'audit', title: 'Audit', description: 'Test description.', body: 'Test content.' },
      } },`);
  });
  rejected(result, '[i18n] Missing Spanish translation for page audit-no-spanish.');
});

test('disabling Spanish is rejected by the public config build', async () => {
  const result = await fixture(({ replace }) =>
    replace('src/i18n/locales.ts', enabled, "= ['en'];"));
  rejected(result, '[i18n] Spanish (es) must be enabled.');
});

test('an unknown enabled locale is rejected by the public config build', async () => {
  const result = await fixture(({ replace }) =>
    replace('src/i18n/locales.ts', enabled, "= ['es', 'xx'];"));
  rejected(result, '[i18n] Unknown enabled locale: xx.');
});

test('every UI key is required for an enabled locale, including nested keys', async () => {
  for (const [from, to] of [
    ["languageNavigation: 'Language',", "languageNavigation: '',"],
    ["toastLinkedin: 'LinkedIn link pending confirmation.',", "toastLinkedin: '   ',"],
    ["home: 'Home',", "home: '',"],
    ["  photosPending: 'Photos pending',\n", ''],
  ]) {
    const result = await fixture(({ replace }) => replace('src/i18n/ui.ts', from, to));
    rejected(result, '[i18n] Incomplete UI for en.');
  }
});

test('UI strings are not required for a locale that stays disabled', async () => {
  const result = await fixture(async (input) => {
    await disableEnglish(input);
    await input.replace('src/i18n/ui.ts', "home: 'Home',", "home: '',");
  });
  success(result);
});
