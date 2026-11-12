import { cloneElement, useLayoutEffect, useRef, useState } from 'react';
import { reducedMotion } from '../animations/timing';

// 与原站一致：先退出旧内容，再替换内容并入场，避免瞬间换字或叠加两张立绘。
export function ContentTransition({ state, children, direction = 'fade', reverse = false, slow = false, appear = false }) {
  const [displayed, setDisplayed] = useState({ key: state, element: children });
  const latest = useRef({ key: state, element: children });
  latest.current = { key: state, element: children };
  const node = useRef(null);
  const entering = useRef(false);
  const exit = useRef(null);
  const translate = sign => direction === 'fade' || reducedMotion() ? 'none' : `translate${direction === 'vertical' ? 'Y' : 'X'}(${sign * (reverse ? -1 : 1) * 1.5}rem)`;
  const duration = reducedMotion() ? 80 : slow ? 600 : 300;
  const frame = (opacity, sign) => direction === 'fade' ? { opacity } : { opacity, transform: sign ? translate(sign) : 'none' };

  useLayoutEffect(() => {
    if (!appear) return;
    const animation = node.current.animate([frame(0, 1), frame(1, 0)], { duration, delay: reducedMotion() ? 0 : duration, easing: 'ease', fill: 'backwards' });
    return () => animation.cancel();
  }, []);

  useLayoutEffect(() => {
    if (Object.is(state, displayed.key) || exit.current || !node.current) return;
    const element = node.current;
    const animation = element.animate([frame(1, 0), frame(0, -1)], { duration, easing: 'ease', fill: 'forwards' });
    element.dataset.transition = 'exit';
    exit.current = animation;
    animation.onfinish = () => {
      entering.current = true;
      exit.current = null;
      setDisplayed(latest.current);
      animation.cancel();
    };
  }, [state, displayed.key]);

  useLayoutEffect(() => {
    if (!entering.current || !node.current) return;
    entering.current = false;
    const element = node.current;
    element.dataset.transition = 'enter';
    const animation = element.animate([frame(0, 1), frame(1, 0)], { duration, easing: 'ease' });
    animation.onfinish = () => { element.dataset.transition = 'idle'; };
    return () => animation.cancel();
  }, [displayed.key]);

  useLayoutEffect(() => () => { exit.current?.cancel(); }, []);
  const element = Object.is(state, displayed.key) ? children : displayed.element;
  return cloneElement(element, { ref: node, key: String(displayed.key) });
}
