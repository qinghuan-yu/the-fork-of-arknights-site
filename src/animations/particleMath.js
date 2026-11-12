// 目标点随机重排，换形时保留当前粒子位置，而非重建整张画布。
export function shuffledModel(model, random = Math.random) {
  const points = model.points.map(([x, y, alpha = 255]) => [x - model.size.width / 2, model.size.height / 2 - y, 0, 1, 1, 1, alpha / 255]);
  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [points[i], points[j]] = [points[j], points[i]];
  }
  return new Float32Array(points.flat());
}

export function updateParticles(positions, colors, targets, speeds, transform, pointer, frames = 1) {
  const count = targets.length / 7;
  for (let i = 0; i < speeds.length; i++) {
    const p = i * 3, c = i * 4, t = i * 7;
    const blend = 1 - (1 - 1 / speeds[i]) ** frames;
    if (i >= count) { colors[c + 3] += (-1 - colors[c + 3]) * blend; continue; }
    const dx = pointer.active ? pointer.x - positions[p] : 0;
    const dy = pointer.active ? pointer.y - positions[p + 1] : 0;
    const force = -100 / (1 + Math.sqrt(dx * dx + dy * dy)) ** 2 * frames;
    positions[p] += (transform.scale * targets[t] + transform.x - positions[p]) * blend + dx * force;
    positions[p + 1] += (transform.scale * targets[t + 1] + transform.y - positions[p + 1]) * blend + dy * force;
    positions[p + 2] += (targets[t + 2] - positions[p + 2]) * blend;
    for (let channel = 0; channel < 4; channel++) colors[c + channel] += (targets[t + 3 + channel] - colors[c + channel]) * blend;
  }
}
