// Float64 phases preserve the precision of the original Math.sin/cos expressions.
export function createParticlePhases(count) {
  const phases = new Float64Array(count * 4);
  for (let i = 0; i < count; i++) {
    const p = i * 4;
    phases[p] = Math.sin(i * 0.7);
    phases[p + 1] = Math.cos(i * 0.7);
    phases[p + 2] = Math.sin(i * 0.3);
    phases[p + 3] = Math.cos(i * 0.3);
  }
  return phases;
}

export function updateParticlePositions(positions, targets, phases, pointer, time, blend) {
  const sinX = Math.sin(time * 0.0005);
  const cosX = Math.cos(time * 0.0005);
  const sinY = Math.sin(time * 0.0004);
  const cosY = Math.cos(time * 0.0004);
  for (let i = 0, p = 0; p < positions.length; i++, p += 3) {
    const phase = i * 4;
    const driftX = (sinX * phases[phase + 1] + cosX * phases[phase]) * 1.3;
    const driftY = (cosY * phases[phase + 3] - sinY * phases[phase + 2]) * 1.3;
    const dx = positions[p] - pointer.x;
    const dy = positions[p + 1] - pointer.y;
    let repelX = 0;
    let repelY = 0;
    // Outside the original 95px radius, repulsion is exactly zero. Retain hypot
    // inside it, including the original minimum-distance clamp and force curve.
    if (dx * dx + dy * dy < 95 * 95) {
      const distance = Math.max(1, Math.hypot(dx, dy));
      const repel = Math.max(0, 1 - distance / 95) * 32;
      repelX = dx / distance * repel;
      repelY = dy / distance * repel;
    }
    positions[p] += (targets[p] + driftX + repelX - positions[p]) * blend;
    positions[p + 1] += (targets[p + 1] + driftY + repelY - positions[p + 1]) * blend;
  }
}
