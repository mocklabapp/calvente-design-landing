// @ts-check
// Reads the generated static home pages: run `pnpm run build` (or `validate`) first.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { site } from '../src/config/site.ts';

// HOME_TEST_DIST lets a caller point at another build output (e.g. an isolated scratch build).
const dist = process.env.HOME_TEST_DIST ?? new URL('../dist/client/', import.meta.url).pathname;
/** @param {string} path */
const read = (path) => readFile(`${dist.replace(/\/?$/, '/')}${path}`, 'utf8');
/** @param {string} markup */
const decode = (markup) => markup.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
/** @param {string} markup @param {string} name */
const attribute = (markup, name) => markup.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

const locales = {
  es: {
    file: 'index.html',
    projects: '/proyectos/',
    collections: '/colecciones/',
    names: ['Proyectos', 'Colecciones'],
    carousel: 'carrusel',
    architecture: 'Arquitectura',
    firstKicker: 'Oficinas · 2024 · Sevilla',
    castellarKicker: 'Vivienda · Sevilla (por confirmar)',
    eyebrow: 'Nuestro taller · En Sevilla desde 2005',
    accents: ['a mano y sin prisa', 'artesanos'],
    captions: ['Cepillos de carpintero', 'Sargentos', 'Herramientas de mano'],
  },
  en: {
    file: 'en/index.html',
    projects: '/en/projects/',
    collections: '/en/collections/',
    names: ['Projects', 'Collections'],
    carousel: 'carousel',
    architecture: 'Architecture',
    firstKicker: 'Offices · 2024 · Seville',
    castellarKicker: 'Housing · Seville (to be confirmed)',
    eyebrow: 'Our workshop · In Seville since 2005',
    accents: ['by hand, without hurry', 'craftsmen'],
    captions: ['Hand planes', 'Bar clamps', 'Hand tools'],
  },
};

// Known-studio projects first (source order), then the rest, capped at five.
const titles = [
  'Sede de Caja Rural del Sur', 'Hotel Gerona 6', 'Vivienda JGP', 'Vivienda Castellar', 'Abades 18',
];

for (const [locale, expected] of Object.entries(locales)) {
  const html = await read(expected.file);
  const slides = [...html.matchAll(/(<a\b[^>]*class="hs-s[^"]*"[^>]*>)([\s\S]*?)<\/a>/g)]
    .map(([, open, body]) => ({ open, body }));

  test(`${locale}: the visually hidden h1 carries the site name`, () => {
    assert.ok(html.includes(`<h1 class="sr-only">${site.name}</h1>`));
  });

  test(`${locale}: the hero lists curated projects, known studio first, linking to the listing`, () => {
    assert.equal(slides.length, 5);
    assert.deepEqual(slides.map(({ body }) => decode(body.match(/<h2[^>]*>([^<]*)<\/h2>/)?.[1] ?? '')), titles);
    for (const { open } of slides) assert.equal(attribute(open, 'href'), expected.projects);
    assert.ok(!html.includes('Buenos Libros'), 'the sixth project is cut by the five-slide cap');
    assert.ok(!html.includes('Sacristía'), 'draft projects never reach the hero');
  });

  test(`${locale}: the hero keeps carousel semantics and exposes only the first slide`, () => {
    assert.match(html, new RegExp(`aria-roledescription="${expected.carousel}"`));
    assert.match(html, /data-hero-slideshow/);
    slides.forEach(({ open }, index) => {
      assert.equal(attribute(open, 'aria-hidden'), index === 0 ? 'false' : 'true');
      assert.equal(attribute(open, 'tabindex'), index === 0 ? '0' : '-1');
      assert.equal(/class="hs-s on"/.test(open), index === 0);
    });
    const dots = [...html.matchAll(/<button\b[^>]*data-hero-dot="(\d)"[^>]*>/g)];
    assert.equal(dots.length, 5);
    assert.deepEqual(dots.map(([tag]) => decode(attribute(tag, 'aria-label') ?? '')), titles);
  });

  test(`${locale}: slides show the kicker and the architecture line only when the studio is known`, () => {
    assert.ok(slides[0].body.includes(expected.firstKicker));
    assert.ok(slides[3].body.includes(expected.castellarKicker));
    assert.ok(slides[0].body.includes(`${expected.architecture}: arquinur + (bau)m arquitectura`));
    assert.ok(slides[3].body.includes(`${expected.architecture}: Baum Arquitectura`));
    assert.ok(!slides[4].body.includes(`${expected.architecture}:`), 'Abades 18 has no confirmed studio');
  });

  test(`${locale}: the entry cards resolve to the localized listing paths`, () => {
    const cards = [...html.matchAll(/<a\b([^>]*)>\s*<div class="k"[^>]*><span[^>]*>([^<]+)<\/span>/g)]
      .map(([, attributes, name]) => ({ href: attribute(attributes, 'href'), name }));
    assert.deepEqual(cards, [
      { href: expected.projects, name: expected.names[0] },
      { href: expected.collections, name: expected.names[1] },
    ]);
  });

  test(`${locale}: the workshop block renders its heading, images and captions`, () => {
    assert.ok(html.includes(expected.eyebrow));
    for (const accent of expected.accents) assert.match(html, new RegExp(`<span class="it"[^>]*>${accent}</span>`));
    const captions = [...html.matchAll(/<figcaption[^>]*>([^<]+)<\/figcaption>/g)].map((match) => match[1]);
    assert.deepEqual(captions, expected.captions);
    assert.match(html, /id="taller"/);
  });
}
