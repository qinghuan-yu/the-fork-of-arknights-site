import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { easeInOutQuad, reducedMotion } from '../animations/timing';

export function LoadingScreen({ onReady }) {
  const [finished, setFinished] = useState(false);
  const bar = useRef(null), number = useRef(null);
  useEffect(() => {
    let cancelled = false, frame, timer, animation, completed = 0, progress = 0;
    const assets = ['/assets/images/bg.c03d00a6.webp', '/assets/images/bg_m.866db098.webp', '/assets/images/bg2.e562d9ae.webp', '/assets/images/bg2_m.aa95d813.webp', '/assets/images/common_mask.55fff2e9.webp'];
    const tasks = assets.map(source => new Promise(resolve => { const image = new Image(); image.onload = image.onerror = resolve; image.src = source; }));
    tasks.push(document.fonts.ready);
    const update = () => {
      if (cancelled) return;
      completed++; animation?.cancel(); cancelAnimationFrame(frame);
      const duration = reducedMotion() ? 100 : 1000;
      const started = performance.now(), from = progress, target = completed / tasks.length;
      animation = bar.current.animate([{ transform: `scaleX(${from})` }, { transform: `scaleX(${target})` }], { duration, easing: easeInOutQuad, fill: 'forwards' });
      const tick = now => {
        const t = Math.min(1, (now - started) / duration);
        progress = from + (target - from) * (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
        number.current.textContent = Math.round(progress * 100);
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      animation.onfinish = () => { if (completed === tasks.length) timer = setTimeout(() => { setFinished(true); onReady(); }, reducedMotion() ? 0 : 300); };
    };
    tasks.forEach(task => task.then(update, update));
    return () => { cancelled = true; clearTimeout(timer); cancelAnimationFrame(frame); animation?.cancel(); };
  }, [onReady]);
  return <div className={`loading-container ${finished ? 'loading-hidden' : 'loading-active'}`} aria-hidden={finished} role={finished ? undefined : 'status'} aria-label="页面加载中">
    <div className="loading-title"><Icon name="title_arknights" /></div>
    <div className="loading-infos"><div className="loading-copyrightMini"><Icon name="copyright_mini" /></div>
      <div className="loading-progressContainer"><div className="loading-progressBar"><div className="loading-track" /><div ref={bar} className="loading-bar" /></div>
        <div className="loading-progressDetail"><div className="loading-info"><Icon name="icon_dblArrow" className="loading-icon" /><span>LOADING&nbsp;-&nbsp;<span ref={number}>0</span>% &nbsp; ......</span></div>
          <div className="loading-extra"><span className="loading-textTitle">ARKNIGHTS</span><span className="loading-location">// &nbsp;&nbsp; ak.hypergryph.com</span></div>
        </div>
      </div>
    </div>
  </div>;
}
