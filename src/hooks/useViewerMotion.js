import { useCallback, useEffect, useRef } from 'react';
import { reducedMotion } from '../animations/timing';

// 退出动画结束后才卸载；在同一生命周期内暂停背景音乐并恢复焦点。
export function useViewerMotion(ref, onClose, { duration = 600, scaleRef } = {}) {
  const closing = useRef(false), animations = useRef([]), callback = useRef(onClose);
  callback.current = onClose;
  const animate = useCallback(exit => {
    animations.current.forEach(animation => animation.cancel());
    const options = { duration: reducedMotion() ? 0 : duration, easing: 'ease', fill: 'both' };
    const result = [ref.current.animate([{ opacity: exit ? 1 : 0 }, { opacity: exit ? 0 : 1 }], options)];
    if (scaleRef?.current) result.push(scaleRef.current.animate([{ transform: `scale(${exit ? 1 : .88})` }, { transform: `scale(${exit ? .88 : 1})` }], options));
    animations.current = result;
    return result;
  }, [ref, duration, scaleRef]);
  useEffect(() => {
    closing.current = false;
    const previous = document.activeElement;
    const background = [...document.querySelectorAll('main, header')].map(node => [node, node.inert]);
    const music = document.querySelector('audio[data-background-music]');
    const resumeMusic = music && !music.paused;
    background.forEach(([node]) => { node.inert = true; });
    if (resumeMusic) music.pause();
    (ref.current.querySelector('[data-viewer-close]') || ref.current.querySelector('button:not(:disabled), video'))?.focus({ preventScroll: true });
    animate(false);
    return () => {
      animations.current.forEach(animation => animation.cancel());
      background.forEach(([node, inert]) => { node.inert = inert; });
      if (resumeMusic) music.play().catch(() => {});
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [animate, ref]);
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    ref.current.querySelectorAll('video, audio').forEach(media => media.pause());
    animate(true)[0].finished.then(() => callback.current()).catch(() => {});
  }, [animate, ref]);
  const onKeyDown = event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
    if (event.key === 'Tab') {
      const targets = [...ref.current.querySelectorAll('button:not(:disabled), video[controls], [tabindex="0"]')];
      const next = (targets.indexOf(document.activeElement) + (event.shiftKey ? -1 : 1) + targets.length) % targets.length;
      if (targets.length) { event.preventDefault(); targets[next].focus(); }
    }
  };
  return { close, onKeyDown };
}
