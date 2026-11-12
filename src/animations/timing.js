// 官网使用的二次缓动；采样成 CSS linear()，供遮罩和 Web Animations 共用。
export const easeInOutQuad = `linear(${Array.from({ length: 41 }, (_, i) => {
  const t = i / 40;
  return (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2).toFixed(5);
}).join(',')})`;
export const easeOutQuad = `linear(${Array.from({ length: 41 }, (_, i) => (1 - (1 - i / 40) ** 2).toFixed(5)).join(',')})`;
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
