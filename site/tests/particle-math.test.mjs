import assert from 'node:assert/strict';
import test from 'node:test';
import { performance } from 'node:perf_hooks';
import { createParticlePhases, updateParticlePositions } from '../src/animations/particleMath.js';

// Unchanged pre-optimization frame math, kept independently as the reference.
function original(positions, targets, phases, pointer, time, blend) {
  for (let i = 0; i < positions.length / 3; i++) {
    const p = i * 3;
    const driftX = Math.sin(time * 0.0005 + i * 0.7) * 1.3;
    const driftY = Math.cos(time * 0.0004 + i * 0.3) * 1.3;
    const dx = positions[p] - pointer.x;
    const dy = positions[p + 1] - pointer.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const repel = Math.max(0, 1 - distance / 95) * 32;
    positions[p] += (targets[p] + driftX + dx / distance * repel - positions[p]) * blend;
    positions[p + 1] += (targets[p + 1] + driftY + dy / distance * repel - positions[p + 1]) * blend;
  }
}

function fixture(count, ArrayType = Float32Array) {
  let seed = 123456789;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  const positions = new ArrayType(count * 3);
  const targets = new ArrayType(count * 3);
  for (let p = 0; p < positions.length; p += 3) {
    positions[p] = (random() - 0.5) * 1800;
    positions[p + 1] = (random() - 0.5) * 1000;
    targets[p] = (random() - 0.5) * 1400;
    targets[p + 1] = (random() - 0.5) * 800;
  }
  return { positions, targets, phases: createParticlePhases(count) };
}

function maximumError(actual, expected) {
  let maximum = 0;
  for (let i = 0; i < actual.length; i++) maximum = Math.max(maximum, Math.abs(actual[i] - expected[i]));
  return maximum;
}

for (const count of [6000, 10000]) {
  test(`${count} particles: formula matches across timestamps, pointers and blend values`, () => {
    const { positions, targets, phases } = fixture(count, Float64Array);
    for (const time of [0, 16.667, 1000, 60000, 3600000, 86400000, 604800000]) {
      for (const pointer of [{ x: 100000, y: 100000 }, { x: 0, y: 0 }, { x: 413.7, y: -204.5 }]) {
        for (const blend of [0, 1 - Math.exp(-1 / 60 * 5), 1 - Math.exp(-0.05 * 5)]) {
          const expected = positions.slice();
          const actual = positions.slice();
          original(expected, targets, phases, pointer, time, blend);
          updateParticlePositions(actual, targets, phases, pointer, time, blend);
          assert.ok(maximumError(actual, expected) < 1e-9);
        }
      }
    }
  });

  test(`${count} particles: Float32 trajectories remain equivalent over 600 frames`, context => {
    const { positions, targets, phases } = fixture(count);
    const expected = positions.slice();
    let maximum = 0;
    for (let frame = 0; frame < 600; frame++) {
      const pointer = { x: Math.sin(frame / 90) * 400, y: Math.cos(frame / 75) * 200 };
      const time = frame * 1000 / 60;
      original(expected, targets, phases, pointer, time, 1 - Math.exp(-5 / 60));
      updateParticlePositions(positions, targets, phases, pointer, time, 1 - Math.exp(-5 / 60));
      maximum = Math.max(maximum, maximumError(positions, expected));
    }
    // Less than 0.001 CSS pixel, including accumulated Float32 rounding.
    assert.ok(maximum < 0.001, `maximum trajectory error: ${maximum}`);
    context.diagnostic(`maximum Float32 trajectory error: ${maximum} CSS px`);
  });
}

test('repulsion boundaries preserve center, minimum-distance clamp, radius and z', () => {
  const coordinates = [0, 1e-8, 0.999999, 1, 1.000001, 94.999999, 95, 95.000001, 1e6];
  const positions = new Float64Array(coordinates.flatMap(x => [x, 0, 7]));
  const targets = new Float64Array(positions.length);
  const phases = createParticlePhases(coordinates.length);
  const expected = positions.slice();
  original(expected, targets, phases, { x: 0, y: 0 }, 123456, 0.2);
  updateParticlePositions(positions, targets, phases, { x: 0, y: 0 }, 123456, 0.2);
  assert.ok(maximumError(positions, expected) < 1e-9);
  for (let i = 2; i < positions.length; i += 3) assert.equal(positions[i], 7);
});

// Opt-in microbenchmark: PARTICLE_BENCHMARK=1 node --test tests/particle-math.test.mjs
// CPU math only: deliberately excludes WebGL, frame scheduling and phase setup.
test('deterministic CPU microbenchmark', { skip: !process.env.PARTICLE_BENCHMARK }, () => {
  for (const count of [6000, 10000]) {
    for (const pointer of [{ x: 100000, y: 100000 }, { x: 0, y: 0 }]) {
      const { positions, targets, phases } = fixture(count);
      function measure(fn) {
        const working = positions.slice();
        for (let frame = 0; frame < 300; frame++) fn(working, targets, phases, pointer, frame * 16.667, 0.08);
        const start = performance.now();
        for (let frame = 0; frame < 1000; frame++) fn(working, targets, phases, pointer, frame * 16.667, 0.08);
        return (performance.now() - start) / 1000;
      }
      const baseline = [], optimized = [];
      for (let run = 0; run < 7; run++) {
        // Alternate order to reduce warm-up/thermal bias.
        if (run % 2) { optimized.push(measure(updateParticlePositions)); baseline.push(measure(original)); }
        else { baseline.push(measure(original)); optimized.push(measure(updateParticlePositions)); }
      }
      const median = values => values.sort((a, b) => a - b)[3];
      const before = median(baseline), after = median(optimized);
      console.log(JSON.stringify({ count, pointer: pointer.x ? 'away' : 'center', baselineMs: before, optimizedMs: after, speedup: before / after }));
      // No timing assertion: machine load and runtime versions vary.
    }
  }
});
