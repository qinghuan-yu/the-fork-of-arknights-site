import { cloneElement, useLayoutEffect, useRef, useState } from 'react';
import { reducedMotion } from '../animations/timing';

// 与原站一致：先退出旧内容，再替换内容并入场，避免瞬间换字或叠加两张立绘。
export function ContentTransition({ state, children, direction = 'fade', reverse = false, slow = false, appear = false }) {
  const [displayed, setDisplayed] = useState({ key: state, element: children, revision: 0 });
  const latest = useRef({ key: state, element: children });
  latest.current = { key: state, element: children };
  const node = useRef(null);
  const motion = useRef(null);
  const phase = useRef('idle');
  const translate = sign => direction === 'fade' || reducedMotion() ? 'none' : `translate${direction === 'vertical' ? 'Y' : 'X'}(${sign * (reverse ? -1 : 1) * 1.5}rem)`;
  const duration = reducedMotion() ? 80 : slow ? 600 : 300;
  const frame = (opacity, sign) => direction === 'fade' ? { opacity } : { opacity, transform: sign ? translate(sign) : 'none' };

  const animate = (element, frames, delay, onfinish) => {
    const previous = motion.current;
    const animation = element.animate(frames, { duration, delay, easing: 'ease', fill: 'both' });
    motion.current = animation;
    if (previous) { previous.onfinish = null; previous.cancel(); }
    animation.onfinish = () => { if (motion.current === animation) onfinish(animation); };
  };

  // 使用提交次数触发入场：退出途中返回原项时，内容 key 不变也需要重新淡入。
  useLayoutEffect(() => {
    const element = node.current;
    if (!element || (!displayed.revision && !appear)) return;
    phase.current = 'enter';
    element.dataset.transition = 'enter';
    animate(element, [frame(0, 1), frame(1, 0)], !displayed.revision && !reducedMotion() ? duration : 0, animation => {
      phase.current = 'idle';
      element.dataset.transition = 'idle';
      motion.current = null;
      animation.cancel();
    });
  }, [displayed.revision]);

  useLayoutEffect(() => {
    if (Object.is(state, displayed.key) || phase.current === 'exit' || phase.current === 'swap' || !node.current) return;
    const element = node.current;
    const style = getComputedStyle(element);
    // 入场被打断时从当前画面退出，不能先重置为完全可见和零位移。
    const current = direction === 'fade' ? { opacity: style.opacity } : { opacity: style.opacity, transform: style.transform };
    phase.current = 'exit';
    element.dataset.transition = 'exit';
    animate(element, [current, frame(0, -1)], 0, () => {
      phase.current = 'swap';
      const next = latest.current;
      setDisplayed(previous => ({ ...next, revision: previous.revision + 1 }));
      // 保持退出的最后一帧，直到 React 提交新内容并在 layout effect 中接续入场。
    });
  }, [state, displayed.key, displayed.revision]);

  useLayoutEffect(() => () => {
    if (motion.current) { motion.current.onfinish = null; motion.current.cancel(); motion.current = null; }
  }, []);
  const element = Object.is(state, displayed.key) ? children : displayed.element;
  return cloneElement(element, { ref: node, key: String(displayed.key) });
}
