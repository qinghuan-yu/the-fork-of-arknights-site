import assert from 'node:assert/strict';
import test from 'node:test';
import { shuffledModel, updateParticles } from '../src/animations/particleMath.js';

test('模型以图像中心为原点，随机重排保持每个目标点恰好一次', () => {
  const model = { size: { width: 100, height: 80 }, points: [[0, 0, 128], [100, 80, 255], [50, 40, 0]] };
  const output = shuffledModel(model, () => 0);
  const points = Array.from({ length: 3 }, (_, i) => [...output.slice(i * 7, i * 7 + 7)]);
  assert.deepEqual(points.map(point => point.slice(0, 3)).sort((a, b) => a[0] - b[0]), [[-50, 40, 0], [0, 0, 0], [50, -40, 0]]);
  assert.equal(points.filter(point => point[6] === 0).length, 1);
  assert.ok(points.some(point => Math.abs(point[6] - 128 / 255) < 1e-7));
});

test('60 Hz 下聚拢、深度、颜色与鼠标斥力符合原站逐帧公式', () => {
  const transform = { x: -288, y: 45, scale: .9 };
  for (const speed of [20, 25, 30]) for (const active of [false, true]) {
    for (const x of [0, 1e-8, 1, 95, 1000]) {
      const positions = new Float64Array([x, 12, 50]), colors = new Float64Array([.5, .5, .5, -1]);
      const targets = new Float64Array([100, -70, 0, 1, 1, 1, .75]);
      const dx = active ? 40 - x : 0, dy = active ? -2 - 12 : 0;
      const force = -100 / (1 + Math.sqrt(dx * dx + dy * dy)) ** 2;
      updateParticles(positions, colors, targets, [speed], transform, { x: 40, y: -2, active });
      const expected = [x + (90 - 288 - x) / speed + dx * force, 12 + (-63 + 45 - 12) / speed + dy * force, 50 - 50 / speed];
      positions.forEach((value, i) => assert.ok(Math.abs(value - expected[i]) < 1e-10));
      assert.ok(Math.abs(colors[3] - (-1 + 1.75 / speed)) < 1e-10);
    }
  }
});

test('无鼠标时稳定收敛且不会额外正弦漂移，多余粒子淡出', () => {
  const positions = new Float32Array([100, 100, 30, 4, 5, 6]), colors = new Float32Array([.5, .5, .5, -1, 1, 1, 1, 1]);
  const targets = new Float32Array([0, 0, 0, 1, 1, 1, 1]);
  for (let frame = 0; frame < 600; frame++) updateParticles(positions, colors, targets, [20, 30], { x: 10, y: 20, scale: 1 }, { active: false });
  assert.ok(Math.abs(positions[0] - 10) < .001); assert.ok(Math.abs(positions[1] - 20) < .001);
  assert.ok(Math.abs(positions[2]) < .001); assert.deepEqual([...positions.slice(3)], [4, 5, 6]);
  assert.ok(colors[3] > .999); assert.ok(colors[7] < -.999);
});

test('不同帧率下静态目标的收敛时间一致', () => {
  const trajectory = frames => {
    const positions = new Float64Array([100, 100, 100]), colors = new Float64Array(4);
    for (let i = 0; i < 60 / frames; i++) updateParticles(positions, colors, new Float32Array([0, 0, 0, 1, 1, 1, 1]), [25], { x: 0, y: 0, scale: 1 }, { active: false }, frames);
    return positions[0];
  };
  assert.ok(Math.abs(trajectory(.5) - trajectory(1)) < 1e-10);
  assert.ok(Math.abs(trajectory(2) - trajectory(1)) < 1e-10);
});
