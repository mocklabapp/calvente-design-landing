import type { ImageMetadata } from 'astro';

// Every image under src/assets/images is bundled and processed by astro:assets.
const modules = import.meta.glob<ImageMetadata>('/src/assets/images/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
});

const images = new Map<string, ImageMetadata>(
  Object.entries(modules).map(([path, metadata]) => [path.slice(path.lastIndexOf('/') + 1), metadata]),
);

/** Resolve a file name such as `jo0361-001.jpg` to its metadata; unknown names throw. */
export function getLocalImage(name: string): ImageMetadata {
  const image = images.get(name);
  if (!image) throw new Error(`[images] Unknown image "${name}" in src/assets/images.`);
  return image;
}
