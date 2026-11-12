import { useLayoutEffect, useRef, useState } from 'react';
import { easeOutQuad, reducedMotion } from '../animations/timing';

export function WorldDetail({ item, direction }) {
  const [shown, setShown] = useState(item);
  const container = useRef(null), previous = useRef(null);
  useLayoutEffect(() => {
    const groups = [...container.current.children], animations = [];
    const wasVisible = !!previous.current, visible = !!item;
    previous.current = item;
    let timer;
    if (!wasVisible || !visible) {
      if (item) setShown(item);
      groups.forEach((group, i) => {
        const from = `translateY(${i === 2 ? -100 : 100}%)`;
        animations.push(group.firstElementChild.animate([{ transform: visible ? from : 'none' }, { transform: visible ? 'none' : from }], {
          duration: reducedMotion() ? 80 : 600, delay: visible && !reducedMotion() ? 600 + i * 200 : 0, easing: easeOutQuad, fill: 'both',
        }));
      });
    } else if (item.id !== shown?.id) {
      const dir = Math.sign(direction) || 1;
      groups.forEach((group, i) => animations.push(group.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * 2}rem)` }], {
        duration: reducedMotion() ? 80 : 300, delay: reducedMotion() ? 0 : i * 100, easing: easeOutQuad, fill: 'forwards',
      })));
      timer = setTimeout(() => {
        setShown(item); animations.splice(0).forEach(animation => animation.cancel());
        groups.forEach((group, i) => animations.push(group.animate([{ opacity: 0, transform: `translateX(${dir * 2}rem)` }, { opacity: 1, transform: 'none' }], {
          duration: reducedMotion() ? 80 : 300, delay: reducedMotion() ? 0 : i * 100, easing: easeOutQuad, fill: 'backwards',
        })));
      }, reducedMotion() ? 80 : 500);
    }
    return () => { clearTimeout(timer); animations.forEach(animation => animation.cancel()); };
  }, [item, direction]);
  return <div ref={container} className="world-detailContent">
    <h2 className="world-title"><span className="world-text">{shown?.name}</span></h2>
    <div className="world-subtitle"><span className="world-text">{shown?.nameEn}</span></div>
    <p className="world-desc"><span className="world-text">{shown?.intro}</span></p>
  </div>;
}
