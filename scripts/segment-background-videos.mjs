#!/usr/bin/env node
/**
 * Optional asset-maintenance tool; never runs during npm build.
 * Requires Node.js, ffmpeg and ffprobe on PATH. No encoding is performed.
 *
 * From the repository root: node scripts/segment-background-videos.mjs
 *   Reads the original assets from Git checkpoint 13606c6.
 * Or: node scripts/segment-background-videos.mjs --source-dir /path/to/original/video
 * Or: node scripts/segment-background-videos.mjs --git-ref 13606c6 --output-dir /tmp/video
 *
 * Both complete videos must pass decoded-frame checks before any destination
 * playlist is replaced or obsolete original segments are removed. Original
 * assets remain recoverable from Git. preview.mp4 is intentionally untouched.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const options = { '--git-ref': '13606c6ebe8e77a88d59aee4bd0c3184e021903f', '--output-dir': path.join(site, 'public/assets/video') };
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i += 2) {
  if (!['--source-dir', '--git-ref', '--output-dir'].includes(args[i]) || !args[i + 1]) {
    throw new Error('Usage: node segment-background-videos.mjs [--source-dir DIR] [--git-ref REF] [--output-dir DIR]');
  }
  options[args[i]] = args[i + 1];
}
const run = (command, args, encoding = 'utf8') => execFileSync(command, args, {
  cwd: site, encoding, maxBuffer: 128 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
});
run('ffmpeg', ['-version']);
run('ffprobe', ['-version']);
const scratch = mkdtempSync(path.join(tmpdir(), 'arknights-video-'));
const output = path.resolve(options['--output-dir']);
const names = ['PV04_landscape', 'PV04_portrait'];
const segmentNames = (playlist) => playlist.split(/\r?\n/).filter((line) => line && !line.startsWith('#'));
const duration = (playlist) => [...playlist.matchAll(/^#EXTINF:([\d.]+)/gm)].reduce((sum, match) => sum + Number(match[1]), 0);
const decodedFrames = (file) => run('ffmpeg', [
  '-v', 'error', '-i', file, '-map', '0:v:0', '-an', '-f', 'framemd5', '-',
]).split(/\r?\n/).filter((line) => line && !line.startsWith('#')).map((line) => {
  // Compare decoded pixel hashes and sizes in presentation order. Container
  // timestamp offsets are not image differences and can change during remux.
  const fields = line.split(',').map((field) => field.trim());
  return fields.slice(4).join(',');
});
const videoInfo = (file) => JSON.parse(run('ffprobe', [
  '-v', 'error', '-select_streams', 'v:0', '-show_entries',
  'stream=codec_name,width,height,pix_fmt,r_frame_rate,color_range,color_space,color_transfer,color_primaries',
  '-of', 'json', file,
])).streams[0];
const safeName = (name) => {
  if (path.basename(name) !== name || !name.endsWith('.ts')) throw new Error(`Unsafe segment filename: ${name}`);
  return name;
};
try {
  const results = [];
  for (const name of names) {
    const source = path.join(scratch, name, 'source');
    const target = path.join(scratch, name, 'target');
    mkdirSync(source, { recursive: true });
    mkdirSync(target, { recursive: true });
    // The original Git checkpoint predates the root-level frontend layout.
    const fetch = (filename) => options['--source-dir']
      ? readFileSync(path.join(path.resolve(options['--source-dir']), filename))
      : run('git', ['show', `${options['--git-ref']}:site/public/assets/video/${filename}`], null);
    const original = fetch(`${name}.m3u8`).toString();
    const oldSegments = segmentNames(original).map(safeName);
    writeFileSync(path.join(source, `${name}.m3u8`), original);
    for (const segment of oldSegments) writeFileSync(path.join(source, segment), fetch(segment));
    const input = path.join(source, `${name}.m3u8`);
    const playlistPath = path.join(target, `${name}.m3u8`);
    run('ffmpeg', [
      '-v', 'error', '-nostdin', '-y', '-i', input, '-map', '0:v:0', '-c:v', 'copy', '-an',
      '-f', 'hls', '-hls_time', '1.25', '-hls_list_size', '0', '-hls_playlist_type', 'vod',
      '-hls_flags', 'independent_segments', '-hls_segment_filename', path.join(target, `${name}-short-%03d.ts`),
      playlistPath,
    ]);
    const playlist = readFileSync(playlistPath, 'utf8');
    const segments = segmentNames(playlist).map(safeName);
    const framesBefore = decodedFrames(input);
    const framesAfter = decodedFrames(playlistPath);
    if (!framesBefore.length || JSON.stringify(framesBefore) !== JSON.stringify(framesAfter)) {
      throw new Error(`${name}: decoded frames differ; destination has not been changed`);
    }
    const info = videoInfo(input);
    if (JSON.stringify(info) !== JSON.stringify(videoInfo(playlistPath))) throw new Error(`${name}: video format changed`);
    if (Math.abs(duration(original) - duration(playlist)) > 0.000001) throw new Error(`${name}: playlist duration changed`);
    const sizes = segments.map((segment) => readFileSync(path.join(target, segment)).length);
    if (sizes.some((size) => size >= 25 * 1024 * 1024)) throw new Error(`${name}: segment exceeds Pages 25 MiB limit`);
    const oldSizes = oldSegments.map((segment) => readFileSync(path.join(source, segment)).length);
    results.push({ name, target, oldSegments, segments, metrics: {
      name, durationSeconds: duration(playlist), frames: framesAfter.length, decodedFramesIdentical: true,
      video: info, originalSegmentCount: oldSegments.length, segmentCount: segments.length,
      originalFirstSegmentBytes: oldSizes[0], firstSegmentBytes: sizes[0], largestSegmentBytes: Math.max(...sizes),
      originalTotalBytes: oldSizes.reduce((a, b) => a + b, 0), totalBytes: sizes.reduce((a, b) => a + b, 0),
    } });
  }
  mkdirSync(output, { recursive: true });
  for (const { name, target, oldSegments, segments } of results) {
    for (const segment of segments) copyFileSync(path.join(target, segment), path.join(output, segment));
    copyFileSync(path.join(target, `${name}.m3u8`), path.join(output, `${name}.m3u8`));
    for (const old of oldSegments) if (!segments.includes(old) && existsSync(path.join(output, old))) rmSync(path.join(output, old));
  }
  process.stdout.write(`${JSON.stringify(results.map(({ metrics }) => metrics), null, 2)}\n`);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
