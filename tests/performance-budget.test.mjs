import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const built = path.join(site, 'dist');
const html = fs.readFileSync(path.join(built, 'index.html'), 'utf8');

test('initial JavaScript stays below 230 KB and deferred sections are not preloaded', () => {
  const script = html.match(/<script[^>]+src="([^"]+)"/)[1];
  const bytes = fs.statSync(path.join(built, script)).size;
  assert.ok(bytes < 230_000, `entry JavaScript: ${bytes} B`);
  assert.doesNotMatch(html, /modulepreload[^>]*(?:Section-|scrollbar-|ParticleScene-)/);
});

test('HLS light gzip bundle stays below 125 KB', () => {
  const file = fs.readdirSync(path.join(built, 'assets')).find(name => /^hls\.light-.*\.js$/.test(name));
  assert.ok(file, 'expected the light HLS build');
  const bytes = gzipSync(fs.readFileSync(path.join(built, 'assets', file))).length;
  assert.ok(bytes < 125_000, `HLS gzip: ${bytes} B`);
});

for (const direction of ['landscape', 'portrait']) {
  test(`${direction} background retains duration and uses small independent segments`, () => {
    const root = path.join(site, 'public/assets/video');
    const manifest = fs.readFileSync(path.join(root, `PV04_${direction}.m3u8`), 'utf8');
    assert.match(manifest, /#EXT-X-ENDLIST/);
    const durations = [...manifest.matchAll(/#EXTINF:([\d.]+)/g)].map(match => Number(match[1]));
    assert.ok(durations.length > 10);
    assert.ok(Math.abs(durations.reduce((sum, duration) => sum + duration, 0) - 18.125) < 0.001);
    assert.ok(durations.every(duration => duration <= 1.251));
    const segments = manifest.split('\n').filter(line => line && !line.startsWith('#'));
    for (const segment of segments) {
      assert.ok(!segment.includes('..') && !segment.includes('://'));
      const bytes = fs.statSync(path.join(root, segment)).size;
      assert.ok(bytes < 5_000_000, `${segment}: ${bytes} B`);
    }
  });
}

test('font directory contains only referenced WOFF2 files', () => {
  const styles = fs.readFileSync(path.join(site, 'src/styles/fonts.css'), 'utf8');
  const references = [...styles.matchAll(/url\("\/assets\/fonts\/([^"/]+)"\)/g)].map(match => match[1]).sort();
  const files = fs.readdirSync(path.join(site, 'public/assets/fonts')).sort();
  assert.ok(files.length > 0);
  assert.deepEqual(files, references);
  assert.ok(files.every(file => file.endsWith('.woff2')));
});
