// @ts-check
// Reads the static output, so it runs after `astro build` (the parent's full build).
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { site } from '../src/config/site.ts';

/** @param {string} path */
const read = (path) => readFile(new URL(`../dist/client/${path}/index.html`, import.meta.url), 'utf8');
/** @param {string} html */
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
/** @param {string} html */
const formOf = (html) => {
  const match = html.match(/<form\b[^>]*data-contact-form[^>]*>[\s\S]*?<\/form>/);
  assert.ok(match, 'contact form missing');
  return match[0];
};
/** @param {string} form @param {string} id */
const control = (form, id) => {
  const match = form.match(new RegExp(`<(?:input|select|textarea)\\b[^>]*\\bid="${id}"[^>]*>`));
  assert.ok(match, `control ${id} missing`);
  return match[0];
};
/** @param {string} form @param {string} id */
const label = (form, id) => {
  const match = form.match(new RegExp(`<label\\b[^>]*for="${id}"[^>]*>([\\s\\S]*?)</label>`));
  assert.ok(match, `label for ${id} missing`);
  return text(match[1]).trim();
};

const profiles = [
  ['perfil', 'Artesano carpintero · Sevilla, 1983', 'Trabaja la madera desde joven', 'Madera y Vidrio'],
  ['en/profile', 'Craftsman carpenter · Seville, 1983', 'He has worked with wood since he was young', 'Madera y Vidrio'],
];
for (const [path, kicker, firstParagraph, lastParagraph] of profiles) {
  test(`/${path}/ renders the author profile`, async () => {
    const html = await read(path);
    assert.match(html, /<h1\b[^>]*>Juanma Calvente<\/h1>/);
    assert.ok(text(html).includes(kicker));
    assert.ok(text(html).includes(firstParagraph));
    assert.ok(text(html).includes(lastParagraph));
    assert.equal(html.match(/<div class="bio[^"]*"[^>]*>([\s\S]*?)<\/div>/)?.[1].match(/<p\b/g)?.length, 5);
  });
}

test('the portrait placeholder is labelled in each language', async () => {
  const es = await read('perfil');
  const en = await read('en/profile');
  assert.ok(es.includes('aria-label="Retrato pendiente"') && es.includes('FOTO PENDIENTE'));
  assert.ok(en.includes('aria-label="Portrait pending"') && en.includes('PHOTO PENDING'));
});

const contacts = [
  {
    path: 'contacto',
    title: 'Contacto', name: 'Nombre *', studio: 'Estudio o empresa', subject: 'Motivo',
    message: 'Mensaje *', send: 'Enviar', labels: ['Teléfono', 'Taller', 'Horario'],
    subjects: ['Proyecto de obra', 'Pieza a medida', 'Colecciones', 'Otro'],
    toast: 'Mensaje de ejemplo: en la web real llegará al email del taller.',
    hours: site.contact.hours.es,
  },
  {
    path: 'en/contact',
    title: 'Contact', name: 'Name *', studio: 'Studio or company', subject: 'Subject',
    message: 'Message *', send: 'Send', labels: ['Phone', 'Workshop', 'Hours'],
    subjects: ['Building project', 'Made-to-measure piece', 'Collections', 'Other'],
    toast: 'Sample message: on the live site it will reach the workshop’s email.',
    hours: site.contact.hours.en,
  },
];
for (const expected of contacts) {
  const { path } = expected;
  test(`/${path}/ renders the workshop details`, async () => {
    const html = await read(path);
    assert.match(html, new RegExp(`<h1\\b[^>]*>${expected.title}</h1>`));
    const content = text(html);
    for (const value of [site.contact.email, site.contact.phone, expected.hours,
      'C/ Química, nave 42 · PEASS', ...expected.labels]) {
      assert.ok(content.includes(value), `${value} missing`);
    }
  });

  test(`/${path}/ form has labelled, validated fields and no submission target`, async () => {
    const form = formOf(await read(path));
    assert.equal(label(form, 'contact-name'), expected.name);
    assert.equal(label(form, 'contact-email'), 'Email *');
    assert.equal(label(form, 'contact-studio'), expected.studio);
    assert.equal(label(form, 'contact-subject'), expected.subject);
    assert.equal(label(form, 'contact-message'), expected.message);
    assert.match(control(form, 'contact-name'), /\brequired\b/);
    const email = control(form, 'contact-email');
    assert.match(email, /\brequired\b/);
    assert.match(email, /type="email"/);
    assert.match(control(form, 'contact-message'), /\brequired\b/);
    assert.doesNotMatch(control(form, 'contact-studio'), /\brequired\b/);
    const options = [...form.matchAll(/<option\b[^>]*>([^<]*)<\/option>/g)].map((match) => match[1]);
    assert.deepEqual(options, expected.subjects);
    assert.match(form, new RegExp(`<button\\b[^>]*type="submit"[^>]*>${expected.send}</button>`));
    assert.ok(form.includes(`data-toast-submit="${expected.toast}"`));
  });

  test(`/${path}/ form sends nothing: no action, method, field names or provider`, async () => {
    const form = formOf(await read(path));
    const opening = form.slice(0, form.indexOf('>') + 1);
    assert.doesNotMatch(opening, /\baction=/);
    assert.doesNotMatch(opening, /\bmethod=/);
    assert.doesNotMatch(form, /\bname="/);
  });
}

const legal = [
  ['privacidad', 'Privacidad', 'Texto provisional', 'Apartado 1'],
  ['cookies', 'Cookies', 'Texto provisional', 'Apartado 1'],
  ['aviso-legal', 'Aviso legal', 'Texto provisional', 'Apartado 1'],
  ['en/privacy', 'Privacy', 'Placeholder text', 'Section 1'],
  ['en/cookies', 'Cookies', 'Placeholder text', 'Section 1'],
  ['en/legal-notice', 'Legal notice', 'Placeholder text', 'Section 1'],
];
for (const [path, title, notice, section] of legal) {
  test(`/${path}/ shows the placeholder legal text with a pending notice`, async () => {
    const html = await read(path);
    assert.match(html, new RegExp(`<h1\\b[^>]*>${title}</h1>`));
    assert.match(html, /<p\b[^>]*data-legal-placeholder[^>]*>/);
    const content = text(html);
    assert.ok(content.includes(notice));
    assert.ok(content.includes(section));
    assert.ok(content.includes('Lorem ipsum dolor sit amet'));
    assert.doesNotMatch(html, /<form\b[^>]*data-contact-form/);
  });
}
