// @ts-check
import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchPublicProjects } from '../src/lib/projects-client.ts';
import { readPublicProjects } from '../supabase/functions/public-projects/reader.ts';
import { config, fixture, owner, page, project } from './helpers/public-projects-edge.mjs';

const origin = config.SUPABASE_URL;
const prefix = `${origin}/storage/v1/object/public/projects-images/`;
const endpoint = `${origin}/functions/v1/public-projects`;
const legacy = { id: '1', title: 'Original', description: null, weblink: null,
  originalLanguage: null, translations: [] };
const defaults = { images: [], category: null, year: null };
/** @param {unknown} error */
function sanitized(error) {
  assert.ok(error instanceof Error);
  assert.equal(error.message, 'Projects unavailable');
  assert.equal(error.cause, undefined);
  return true;
}

/** @param {unknown[]} projects */
const site = (projects) => fetchPublicProjects(endpoint, owner, {
  fetch: async () => Response.json({ projects }),
});
/** @param {unknown[]} projects */
const edge = (projects) => readPublicProjects(owner, config, fixture([page(projects)]));

/** @type {[string, (projects: unknown[]) => Promise<unknown>][]} */
const boundaries = [['site', site], ['Edge', edge]];
for (const [boundary, read] of boundaries) {
  test(`${boundary}: ordered images and nullable text are projected without internal fields`, async () => {
    const images = [
      { url: `${origin}/storage/v1/object/public/user-media/owner/second%20image.jpg`,
        status: 'pending', processingResult: { timestamps: 'PRIVATE' } },
      { url: `${prefix}owner/first.jpg`, status: 'done', prompt: 'PRIVATE' },
    ];
    const result = await read([{ ...legacy, images, category: 'Architecture', year: '2024–2025',
      state: 'draft', photoCredit: 'PRIVATE', photoCreditLink: 'PRIVATE', authors: 'PRIVATE',
      collaborators: 'PRIVATE', googleMaps: 'PRIVATE', showMap: true, image_data: images }]);
    assert.deepEqual(result, [{ ...legacy, images: images.map(({ url }) => ({ url })),
      category: 'Architecture', year: '2024–2025' }]);
  });

  test(`${boundary}: absent additions normalize legacy responses; null/empty text stays exact`, async () => {
    assert.deepEqual(await read([legacy]), [{ ...legacy, ...defaults }]);
    for (const category of [null, '']) {
      assert.deepEqual(await read([{ ...legacy, images: [], category, year: '' }]),
        [{ ...legacy, images: [], category, year: '' }]);
    }
  });

  const malformed = [
    { images: null }, { images: {} }, { images: 'PRIVATE' }, { images: [null] },
    { images: [[]] }, { images: [{}] }, { images: [{ url: null }] },
    { images: [{ url: 42 }] }, { images: [{ url: '' }] },
    { category: 2024 }, { category: [] }, { category: {} },
    { year: 2024 }, { year: false }, { year: {} },
  ];
  for (const [index, patch] of malformed.entries()) {
    test(`${boundary}: malformed addition ${index} rejects the whole portfolio`, async () => {
      await assert.rejects(read([{ ...legacy, ...defaults }, { ...legacy, id: '2', ...patch }]), sanitized);
    });
  }

  const unsafe = [
    `${prefix}../private.jpg`, `${prefix}%2e%2e/private.jpg`, `${prefix}%252e%252e/private.jpg`,
    `${prefix}folder%2f..%2fprivate.jpg`, `${prefix}folder%5cprivate.jpg`,
    `${prefix}photo.jpg?token=PRIVATE`, `${prefix}photo.jpg#PRIVATE`,
    `${prefix}photo.jpg?`, `${prefix}photo.jpg#`, `${prefix}photo.jpg\n`,
    `${prefix}photo%0a.jpg`, `${prefix}bad%zz.jpg`, prefix,
    `${prefix}100%25literal/%252e%252e/private.jpg`,
    prefix.replace('/public/', '/sign/') + 'photo.jpg',
    prefix.replace('/public/', '/authenticated/') + 'photo.jpg',
    prefix.replace('projects-images/', 'private/') + 'photo.jpg',
    prefix.replace(origin, 'https://tsrqponmlkjihgfedcba.supabase.co') + 'photo.jpg',
    prefix.replace('https:', 'http:') + 'photo.jpg',
    prefix.replace('.co/', '.co:443/') + 'photo.jpg',
    prefix.replace('https://', 'https://user:PRIVATE@') + 'photo.jpg',
    prefix.replace('.co/', '.co.evil.test/') + 'photo.jpg',
  ];
  for (const bucket of ['projects-images', 'user-media']) {
    for (const [index, candidate] of unsafe.entries()) {
      const url = candidate.replace('/projects-images/', `/${bucket}/`);
      test(`${boundary}: ${bucket} unsafe image URL ${index} fails rather than dropping an image`, async () => {
        await assert.rejects(read([{ ...legacy, images: [{ url: `${prefix}valid.jpg` }, { url }] }]), sanitized);
      });
    }
  }

  for (const bucket of ['user-media-private', 'user-media-extra', 'arbitrary']) {
    test(`${boundary}: rejects unapproved bucket ${bucket}`, async () => {
      const url = `${origin}/storage/v1/object/public/${bucket}/photo.jpg`;
      await assert.rejects(read([{ ...legacy, images: [{ url }] }]), sanitized);
    });
  }

  test(`${boundary}: valid encoded object names remain intact`, async () => {
    const images = ['projects-images', 'user-media'].flatMap((bucket) =>
      ['caf%C3%A9%20front.jpg', '100%25.jpg', 'a%23b%3Fc.jpg',
        'owner%2Fphoto.jpg', '%E6%97%A5%E6%9C%AC.jpg', 'photo..jpg']
        .map((name) => ({ url: `${origin}/storage/v1/object/public/${bucket}/${name}` })));
    assert.deepEqual(await read([{ ...legacy, images }]), [{ ...legacy, ...defaults, images }]);
  });
}

test('Edge rejects an invalid later page without exposing the valid first page', async () => {
  const rpc = fixture([page([{ ...project('1'), ...defaults }], '2'),
    page([{ ...project('2'), images: [{ url: `${prefix}photo.jpg?token=PRIVATE` }] }], '2', 1)]);
  await assert.rejects(readPublicProjects(owner, config, rpc), { message: 'Projects unavailable' });
  assert.equal(rpc.calls.length, 2);
});

test('each boundary derives image trust from its configured Supabase origin', async () => {
  const other = 'https://tsrqponmlkjihgfedcba.supabase.co';
  const value = { ...legacy, images: ['projects-images', 'user-media']
    .map((bucket) => ({ url: `${other}/storage/v1/object/public/${bucket}/photo.jpg` })) };
  const result = await readPublicProjects(owner, { ...config, SUPABASE_URL: `${other}/` }, fixture([page([value])]));
  assert.deepEqual(result, [{ ...value, category: null, year: null }]);
  assert.deepEqual(await fetchPublicProjects(`${other}/functions/v1/public-projects`, owner, {
    fetch: async () => Response.json({ projects: [value] }),
  }), result);
});
