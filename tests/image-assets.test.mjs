import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const images = path.join(root, 'public/assets/images');
function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}
function dimensions(file) {
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  const type = bytes.toString('ascii', 12, 16);
  if (type === 'VP8X') return [1 + bytes.readUIntLE(24, 3), 1 + bytes.readUIntLE(27, 3)];
  if (type === 'VP8 ') return [bytes.readUInt16LE(26) & 0x3fff, bytes.readUInt16LE(28) & 0x3fff];
  assert.equal(type, 'VP8L');
  const bits = bytes.readUInt32LE(21);
  return [1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff)];
}

test('every local image reference exists and every image is used', () => {
  const sources = [...filesIn(path.join(root, 'src')), path.join(root, 'index.html')];
  const references = new Set(sources.flatMap(file => [...fs.readFileSync(file, 'utf8').matchAll(/\/assets\/images\/([^\s"'()<>`#]+)/g)].map(match => match[1])));
  for (const name of references) assert.ok(fs.existsSync(path.join(images, name)), `Missing image: ${name}`);
  for (const name of fs.readdirSync(images)) assert.ok(references.has(name), `Unused image: ${name}`);
});

test('image collection stays compact and within display-sized bounds', () => {
  const files = filesIn(images);
  let total = 0;
  for (const file of files) {
    total += fs.statSync(file).size;
    if (file.endsWith('.svg')) continue;
    assert.equal(path.extname(file), '.webp', `Expected optimized image: ${file}`);
    const [width, height] = dimensions(file);
    assert.ok(Math.max(width, height) <= 1600, `Oversized image: ${file}`);
    assert.ok(fs.statSync(file).size < 500_000, `Image over 500 KB: ${file}`);
  }
  assert.ok(total < 10_000_000, `Image collection exceeds 10 MB: ${total}`);
});

test('gallery thumbnails are separate small images with accurate metadata', () => {
  const gallery = JSON.parse(fs.readFileSync(path.join(root, 'src/data/gallery.json'), 'utf8'));
  for (const months of Object.values(gallery.GROUPED_ARTWORK_LIST)) {
    for (const list of Object.values(months)) {
      for (const { content } of list) {
        assert.notEqual(content.thumbnail.url, content.resource.url);
        for (const image of [content.resource, content.thumbnail]) {
          const file = path.join(root, 'public', image.url);
          assert.deepEqual(dimensions(file), [image.width, image.height]);
          assert.equal(fs.statSync(file).size, image.size);
        }
        assert.ok(Math.max(content.thumbnail.width, content.thumbnail.height) <= 480);
      }
    }
  }
});
