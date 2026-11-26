// @ts-check
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import { filterGroups, nextProduct, parseCatalog } from '../src/lib/products.ts';

const file = (/** @type {string} */ path) => new URL(`../${path}`, import.meta.url);
const raw = JSON.parse(await readFile(file('src/data/products.json'), 'utf8'));

const text = (/** @type {string} */ value) => ({ es: value, en: value });
const group = { id: 'mob', label: text('Mobiliario') };
const category = { id: 'mesas', group: 'mob', label: text('Mesas') };
const product = {
  id: 'mesa-x', code: 'CD-X', name: 'X', category: 'mesas', year: 2024,
  description: text('d'), short: text('s'), images: ['a.jpg'], sizes: [text('1 cm')],
  height: '1 cm', weight: '1 kg', elec: false,
};
/** @param {Record<string, unknown>} [overrides] */
const catalog = (overrides = {}) => ({
  groups: [group], categories: [category], products: [{ ...product, ...overrides }],
});
const anyImage = () => true;

test('the shipped catalog validates against the project images', async () => {
  const names = new Set();
  for (const { images } of raw.products) {
    for (const name of images) {
      await access(file(`src/assets/images/${name}`));
      names.add(name);
    }
  }
  const parsed = parseCatalog(raw, anyImage);
  assert.deepEqual(parsed.products.map(({ code }) => code),
    ['CD-M01', 'CD-S01', 'CD-M02', 'CD-A01', 'CD-L01', 'CD-X01', 'CD-M03', 'CD-A02']);
  assert.ok(names.size >= 8);
});

test('the shipped catalog carries no prices or costs', () => {
  assert.doesNotMatch(JSON.stringify(raw), /price|cost|precio|€|"fab"|"mat"/i);
});

test('a well-formed catalog is accepted and wraps to the first piece', () => {
  const parsed = parseCatalog(raw, anyImage);
  assert.equal(nextProduct(parsed.products, 'mesa-arco')?.id, 'silla-hilo');
  assert.equal(nextProduct(parsed.products, 'armario-mesa')?.id, 'mesa-arco');
  assert.equal(nextProduct(parsed.products, 'missing'), undefined);
});

test('only groups and categories with products appear in the filter', () => {
  const groups = filterGroups(parseCatalog(raw, anyImage));
  assert.deepEqual(groups.map(({ group: { id }, count }) => [id, count]), [['mob', 7], ['ilu', 1]]);
  assert.deepEqual(groups[1]?.categories.map(({ category: { id } }) => id), ['pie']);
});

test('product translations cover es and en only, whatever other locales a client enables', () => {
  assert.doesNotThrow(() => parseCatalog(catalog(), anyImage));
  assert.throws(() => parseCatalog(catalog({ short: { es: 's', fr: 's' } }), anyImage),
    /Product "mesa-x": missing or invalid short\./);
});

/** @type {[string, unknown, string][]} */
const rejected = [
  ['a non-object catalog', null, '[products] Malformed catalog: expected groups, categories and products.'],
  ['an empty product list', { ...catalog(), products: [] },
    '[products] Malformed catalog: expected groups, categories and products.'],
  ['a non-object product', { ...catalog(), products: ['x'] }, '[products] Malformed product at index 0.'],
  ['an unsafe product id', catalog({ id: 'Mesa X' }), '[products] Malformed product at index 0.'],
  ['a missing name', catalog({ name: ' ' }), '[products] Product "mesa-x": missing or invalid name.'],
  ['a missing translation', catalog({ short: { es: 's' } }),
    '[products] Product "mesa-x": missing or invalid short.'],
  ['a fractional year', catalog({ year: 2024.5 }), '[products] Product "mesa-x": missing or invalid year.'],
  ['empty sizes', catalog({ sizes: [] }), '[products] Product "mesa-x": missing or invalid sizes.'],
  ['a non-boolean elec flag', catalog({ elec: 'yes' }), '[products] Product "mesa-x": missing or invalid elec.'],
  ['an unknown category', catalog({ category: 'bancos' }),
    '[products] Product "mesa-x": unknown category "bancos".'],
  ['a category with an unknown group', { ...catalog(), categories: [{ ...category, group: 'otros' }] },
    '[products] Category "mesas": unknown group "otros".'],
  ['a duplicate id', { ...catalog(), products: [product, product] },
    '[products] Duplicate product id "mesa-x".'],
];
for (const [name, value, message] of rejected) {
  test(`parseCatalog rejects ${name}`, () => {
    assert.throws(() => parseCatalog(value, anyImage), { message });
  });
}

test('parseCatalog rejects an image the project does not have', () => {
  assert.throws(() => parseCatalog(catalog({ images: ['a.jpg', 'ghost.jpg'] }), (name) => name === 'a.jpg'),
    { message: '[products] Product "mesa-x": unknown image "ghost.jpg".' });
});

// Generated-HTML checks read the build output, so they need the parent's build first.
const read = (/** @type {string} */ path) => readFile(file(`dist/client/${path}/index.html`), 'utf8');
const hrefs = (/** @type {string} */ markup) =>
  [...markup.matchAll(/<a\b[^>]*?href="([^"]+)"/g)].map((match) => match[1]);

test('the listing renders the intro, filter, count and one card per product', async () => {
  const html = await read('colecciones');
  assert.match(html, /<html lang="es"/);
  assert.match(html, /<h1[^>]*>Colecciones<\/h1>/);
  assert.ok(html.includes('Piezas diseñadas y fabricadas por Calvente.'));
  for (const label of ['Todo', 'Mobiliario', 'Iluminación', 'Mesas', 'Sillas', 'Almacenaje', 'Accesorios',
    'Lámparas de pie']) {
    assert.ok(html.includes(label), `${label} filter missing`);
  }
  assert.ok(!html.includes('Lámparas de techo') && !html.includes('Lámparas de escritorio'));
  assert.match(html, /<span data-count[^>]*>8<\/span> productos/);
  assert.equal((html.match(/data-category="/g) ?? []).length, 8);
  assert.equal((html.match(/data-filter="/g) ?? []).length, 1 + 2 + 5);
  assert.ok(html.includes('Mesa de roble con patas curvas · 160 × 80 cm'));
  assert.ok(hrefs(html).includes('/colecciones/mesa-arco/'));
  assert.doesNotMatch(html, /€|carrito/i);
});

test('the Spanish product page renders the detail, order box and gallery', async () => {
  const html = await read('colecciones/mesa-arco');
  assert.match(html, /<html lang="es"/);
  assert.match(html, /<title>Arco · Mesas \| Calvente Design<\/title>/);
  assert.match(html, /name="description" content="Mesa de trabajo o comedor con patas curvas laminadas\./);
  assert.match(html, /<h1[^>]*><small[^>]*>Mesas<\/small>Arco<\/h1>/);
  for (const size of ['160 × 80 cm', '180 × 90 cm', '220 × 100 cm', '75 cm', '38 kg']) {
    assert.ok(html.includes(size), `${size} missing`);
  }
  assert.ok(html.includes('Fabricación por encargo'));
  assert.match(html, /<a[^>]*href="\/contacto\/"[^>]*>Consultar disponibilidad<\/a>/);
  assert.ok(html.includes('CD-M01'));
  assert.equal((html.match(/<button[^>]*data-view-button/g) ?? []).length, 4);
  assert.equal((html.match(/<div[^>]*data-view-panel/g) ?? []).length, 4);
  assert.equal((html.match(/<div[^>]*data-view-panel[^>]*hidden/g) ?? []).length, 3);
  assert.match(html, /aria-pressed="true"/);
  assert.ok(html.includes('Vista 1 / 4'));
  assert.ok(html.includes('Siguiente pieza'));
  assert.ok(hrefs(html).includes('/colecciones/silla-hilo/'));
  assert.ok(hrefs(html).includes('/colecciones/'));
  assert.ok(hrefs(html).includes('/en/collections/mesa-arco/'));
  assert.doesNotMatch(html, /€|carrito|descargas?/i);
});

test('the English product page uses the English copy and localized links', async () => {
  const html = await read('en/collections/mesa-arco');
  assert.match(html, /<html lang="en"/);
  assert.match(html, /<title>Arco · Tables \| Calvente Design<\/title>/);
  assert.match(html, /<h1[^>]*><small[^>]*>Tables<\/small>Arco<\/h1>/);
  assert.ok(html.includes('Work or dining table with laminated curved legs.'));
  assert.ok(html.includes('Made to order'));
  assert.match(html, /<a[^>]*href="\/en\/contact\/"[^>]*>Check availability<\/a>/);
  assert.ok(html.includes('View 1 / 4'));
  assert.ok(html.includes('Next piece'));
  assert.ok(hrefs(html).includes('/en/collections/'));
  assert.ok(hrefs(html).includes('/en/collections/silla-hilo/'));
  assert.ok(hrefs(html).includes('/colecciones/mesa-arco/'));
  assert.doesNotMatch(html, /Fabricación por encargo|Consultar disponibilidad/);
});

test('the English listing and a translated size label are published', async () => {
  const listing = await read('en/collections');
  assert.ok(listing.includes('Pieces designed and made by Calvente.'));
  assert.ok(listing.includes('products'));
  const chair = await read('en/collections/silla-hilo');
  assert.ok(chair.includes('Seat 65 cm · stool'));
});
