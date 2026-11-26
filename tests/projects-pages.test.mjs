// @ts-check
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import test, { after } from 'node:test';
import { noStoreHeaders, projects, startSite } from './helpers/projects-pages-fixture.mjs';

const site = await startSite();
after(() => site.close());

/** @param {import('./helpers/projects-pages-fixture.mjs').Reply} reply @param {number} status */
function expectReply(reply, status) {
  assert.equal(reply.status, status);
  for (const name of noStoreHeaders) assert.equal(reply.headers.get(name), 'no-store', name);
  return reply.body;
}

/** @param {string} path @param {number} [status] */
async function get(path, status = 200) {
  site.scenario(projects);
  return expectReply(await site.request(path), status);
}

test('project routes are on demand: no prerendered project pages exist', () => {
  for (const path of ['proyectos/index.html', 'en/projects/index.html', 'proyectos/1/index.html']) {
    assert.equal(existsSync(join(site.root, 'dist/client', path)), false, path);
  }
});

test('Spanish listing renders the register, chips and cards from live data', async () => {
  const before = site.calls();
  const html = await get('/proyectos/');
  assert.equal(site.calls(), before + 1, 'every request fetches fresh data');
  assert.match(html, /<html lang="es"/u);
  assert.match(html, /<h1[^>]*>Proyectos<\/h1>/u);
  assert.match(html, /Trabajos realizados en el taller/u);
  assert.match(html, /Registro de obra/u);
  assert.match(html, /Vol\. 2026/u);
  assert.match(html, /Categoría/u);
  assert.match(html, /Residencial/u);
  assert.match(html, /Cultural/u);
  assert.match(html, /Casa Patio/u);
  assert.match(html, /Solo español/u);
  assert.match(html, /03 obras/u);
  assert.match(html, /href="\/proyectos\/1\/"/u);
  assert.match(html, /<img[^>]+src="https:\/\/abcdefghijklmnopqrst\.supabase\.co\/storage\/v1\/object\/public\/projects-images\/owner\/a\.jpg"[^>]+loading="lazy"/u);
  assert.match(html, /href="\/en\/projects\/"[^>]*hreflang="en"/u);
  assert.doesNotMatch(html, /Courtyard House|First memo line/u, 'no English leaks into Spanish');
});

test('English listing uses English copy and never borrows Spanish text', async () => {
  const html = await get('/en/projects/');
  assert.match(html, /<html lang="en"/u);
  assert.match(html, /<h1[^>]*>Projects<\/h1>/u);
  assert.match(html, /Project register/u);
  assert.match(html, /Courtyard House/u);
  assert.match(html, /English only/u);
  assert.match(html, /data-content-source="missing"/u);
  assert.match(html, /This project has no text in English yet\./u);
  assert.match(html, /href="\/en\/projects\/1\/"/u);
  assert.match(html, /href="\/proyectos\/"[^>]*hreflang="es"/u);
  assert.doesNotMatch(html, /Casa Patio|Solo español|Texto que no debe/u);
});

test('category chips filter server-side; unknown categories show everything', async () => {
  const cultural = await get('/proyectos/?category=cultural');
  assert.match(cultural, /Solo español/u);
  assert.match(cultural, /01 obra</u);
  assert.doesNotMatch(cultural, /Casa Patio/u);
  assert.match(cultural, /aria-current="true"[^>]*>\s*Cultural/u);
  const unknown = await get('/proyectos/?category=sanitario');
  assert.match(unknown, /Casa Patio/u);
  assert.match(unknown, /Solo español/u);
  assert.match(await get('/proyectos/?category=%3Cscript%3E'), /Casa Patio/u);
});

test('Spanish detail renders the sheet, gallery, lightbox, memo, link and next project', async () => {
  const html = await get('/proyectos/1/');
  assert.match(html, /<html lang="es"/u);
  assert.match(html, /<title>Casa Patio \| /u);
  assert.match(html, /<h1 class="c[^"]*"[^>]*>Casa Patio<\/h1>/u);
  assert.match(html, /Residencial/u);
  assert.match(html, /2024/u);
  assert.match(html, /<p[^>]*>Primera línea del memo\.<\/p>\s*<p[^>]*>Segunda línea del memo\.<\/p>/u);
  assert.equal(html.match(/data-index="\d"/gu)?.length, 3);
  assert.match(html, /aria-label="Ver imagen 2 en grande"/u);
  assert.match(html, /<div class="lb"[^>]*role="dialog"[^>]*aria-modal="true"/u);
  assert.match(html, /aria-label="Imagen siguiente"/u);
  assert.match(html, /href="https:\/\/example\.com\/casa"[^>]*rel="noopener noreferrer"/u);
  assert.match(html, /href="\/proyectos\/"[^>]*>⟵ Volver/u);
  assert.match(html, /Siguiente proyecto/u);
  assert.match(html, /href="\/proyectos\/2\/"/u);
  assert.match(html, /href="\/en\/projects\/1\/"[^>]*hreflang="en"/u);
  assert.match(html, /<script[^>]+type="module"/u, 'gallery script is bundled');
});

test('English detail uses the translation and English chrome', async () => {
  const html = await get('/en/projects/1/');
  assert.match(html, /<html lang="en"/u);
  assert.match(html, /Courtyard House/u);
  assert.match(html, /First memo line\./u);
  assert.match(html, /Back/u);
  assert.match(html, /Next project/u);
  assert.match(html, /href="\/proyectos\/1\/"[^>]*hreflang="es"/u);
  assert.doesNotMatch(html, /Casa Patio|Primera línea/u);
});

test('missing locale text renders the explicit missing state; unsafe links are dropped', async () => {
  const english = await get('/en/projects/2/');
  assert.match(english, /data-content-source="missing"/u);
  assert.match(english, /This project has no text in English yet\./u);
  assert.doesNotMatch(english, /Solo español|Texto que no debe/u);
  const spanish = await get('/proyectos/2/');
  assert.match(spanish, /Solo español/u);
  assert.match(spanish, /Fotos pendientes/u, 'no images gives the empty photo tile');
  assert.doesNotMatch(spanish, /javascript:/u);
  assert.doesNotMatch(spanish, /<div class="lb"/u);
});

test('empty portfolio shows the approved empty state in both languages', async () => {
  site.scenario([]);
  const spanish = expectReply(await site.request('/proyectos/'), 200);
  assert.match(spanish, /Estamos preparando el registro de obra/u);
  assert.match(spanish, /href="\/colecciones\/"/u);
  assert.match(spanish, /href="\/contacto\/"/u);
  assert.doesNotMatch(spanish, /Registro de obra/u);
  const english = expectReply(await site.request('/en/projects/'), 200);
  assert.match(english, /We are preparing the project register/u);
  assert.match(english, /href="\/en\/collections\/"/u);
  expectReply(await site.request('/proyectos/1/'), 404);
});

test('unknown or malformed ids return 404 with the no-store headers', async () => {
  const spanish = await get('/proyectos/999/', 404);
  assert.match(spanish, /Proyecto no encontrado/u);
  assert.match(spanish, /<html lang="es"/u);
  assert.match(await get('/en/projects/999/', 404), /Project not found/u);
  assert.match(await get('/proyectos/abc/', 404), /Proyecto no encontrado/u);
  assert.match(await get('/proyectos/1%20OR%201/', 404), /Proyecto no encontrado/u);
});

test('upstream failure gives a sanitized 503 with the no-store headers', async () => {
  site.scenario('failure');
  /** @type {[string, RegExp][]} */
  const cases = [
    ['/proyectos/', /Proyectos no disponibles/u],
    ['/en/projects/', /Projects unavailable/u],
    ['/proyectos/1/', /Proyectos no disponibles/u],
    ['/en/projects/1/', /Projects unavailable/u],
  ];
  for (const [path, text] of cases) {
    const html = expectReply(await site.request(path), 503);
    assert.match(html, text);
    assert.doesNotMatch(html, /private-upstream-detail/u);
  }
});

test('static pages stay prerendered and unaffected by the project routes', async () => {
  for (const path of ['colecciones/index.html', 'en/collections/index.html', 'index.html']) {
    assert.equal(existsSync(join(site.root, 'dist/client', path)), true, path);
  }
});
