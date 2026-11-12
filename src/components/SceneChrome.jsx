import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { sections } from '../data/sections';
import { easeInOutQuad, reducedMotion } from '../animations/timing';

export function SectionIndicator({ index, ready }) {
  const [shown, setShown] = useState(index);
  const container = useRef(null);
  const previous = useRef(index);
  useLayoutEffect(() => {
    if (!ready) return;
    const direction = Math.sign(index - previous.current);
    previous.current = index;
    const nodes = [...container.current.children];
    const delay = [0, 100, 100, 200];
    const reduced = reducedMotion();
    let entry = [];
    const leaving = nodes.map((node, i) => node.animate([
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: `translateY(${-direction * 2}rem)` },
    ], { duration: reduced ? 80 : 300, delay: reduced ? 0 : delay[i], easing: easeInOutQuad, fill: 'forwards' }));
    const timer = setTimeout(() => {
      setShown(index);
      leaving.forEach(animation => animation.cancel());
      entry = nodes.map((node, i) => node.animate([
        { opacity: 0, transform: `translateY(${direction * 2}rem)` },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: reduced ? 80 : 300, delay: reduced ? 0 : delay[i], easing: easeInOutQuad, fill: 'backwards' }));
    }, reduced ? 80 : 500);
    return () => { clearTimeout(timer); [...leaving, ...entry].forEach(animation => animation.cancel()); };
  }, [index, ready]);
  return <aside ref={container} aria-hidden="true" className="indicator-container" data-style={shown === 0 ? 'HOME' : shown === 5 ? 'MORE' : ''}>
    <div className="indicator-primaryMark">{String(shown).padStart(2, '0')}</div>
    <div className="indicator-combinationMark">// {String(shown).padStart(2, '0')} / 05</div>
    <div className="indicator-titleMark">ARKNIGHTS</div>
    <div className="indicator-sectionMark">{ready ? sections[shown].caption : 'LOADING'}</div>
  </aside>;
}

export function SceneChrome({ index, ready, menuOpen, navigate }) {
  const grid = useRef(null);
  useEffect(() => {
    const canvas = grid.current;
    const draw = () => {
      canvas.width = innerWidth; canvas.height = innerHeight;
      const ctx = canvas.getContext('2d');
      const step = innerWidth > innerHeight ? 172 : 86;
      ctx.fillStyle = ctx.strokeStyle = '#272727'; ctx.lineWidth = 2;
      ctx.fillRect(canvas.width - 2, 0, 2, canvas.height);
      for (let col = 0; col < Math.ceil(innerWidth / step); col++) {
        for (let row = 0; row < Math.ceil(innerHeight / step); row++) {
          const x = canvas.width - (col + 1) * step, y = row * step;
          ctx.fillRect(x, y, 2, step); ctx.fillRect(x, y, step, 2);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + step, y + step);
          ctx.moveTo(x, y + step); ctx.lineTo(x + step, y); ctx.stroke();
        }
      }
    };
    draw(); window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, []);
  return <>
    <div className={`grids-container ${ready && [2, 3, 4].includes(index) ? 'grids-visible' : 'grids-hidden'}`} aria-hidden="true"><canvas ref={grid} className="grids-canvas" /></div>
    <div id="world-effects" />
    <Fireflies active={ready && [3, 4].includes(index)} />
    <div className={`coord-container ${ready ? index === 0 ? 'coord-home' : index < 3 ? 'coord-common' : 'coord-world' : ''}`} aria-hidden="true">
      <div className="coord-line coord-line2 coord-vtc" /><div className="coord-line coord-line3 coord-hrz" /><div className="coord-line coord-line4 coord-hrz" />
    </div>
    <SectionIndicator index={index} ready={ready} />
    <button type="button" className={`scroll-container ${index === 0 ? 'scroll-start' : index === 5 ? 'scroll-last' : 'scroll-common'}`} disabled={!ready || menuOpen}
      aria-label={index === 5 ? '返回首页' : `前往${sections[index + 1].title}`} onClick={() => navigate(index === 5 ? 0 : index + 1)}>
      <span className="scroll-downTip"><span className="scroll-icon"><Icon name="logo_rhodes_island" /></span><span className="scroll-scrollTip"><span className="scroll-text">SCROLL</span><span className="scroll-arrow"><Icon name="icon_arrow" rotation={90} /></span></span></span>
      <span className="scroll-upTip"><span className="scroll-arrow"><Icon name="icon_arrow" rotation={-90} /></span></span>
    </button>
  </>;
}

function Fireflies({ active }) {
  const canvas = useRef(null);
  const visible = useRef(active);
  visible.current = active;
  useEffect(() => {
    if (reducedMotion()) return;
    const element = canvas.current, ctx = element.getContext('2d');
    const sprite = new Image(); sprite.src = '/assets/particles/firefly.png';
    let frame, previous = 0;
    const random = point => Object.assign(point, { x: (Math.random() - 0.5) * innerWidth * 0.9, y: (Math.random() - 2.5) * innerHeight * 0.2, z: -Math.random() * 200, life: 60 + Math.random() * 1140, opacity: 0 });
    const points = Array.from({ length: 20 }, () => random({ speed: 0.4 + Math.random() * 0.4 }));
    const tick = time => {
      const dt = previous ? Math.min((time - previous) / (1000 / 60), 3) : 1;
      previous = time;
      if (element.width !== innerWidth || element.height !== innerHeight) { element.width = innerWidth; element.height = innerHeight; }
      ctx.clearRect(0, 0, element.width, element.height);
      for (const point of points) {
        point.life -= dt;
        if (point.life <= 0) random(point);
        point.y += point.speed * dt;
        point.opacity += ((visible.current && point.life >= 30 ? 1 : 0) - point.opacity) * (1 - 0.9 ** dt);
        const scale = 160 / (160 - point.z);
        ctx.globalAlpha = point.opacity;
        if (sprite.complete && sprite.naturalWidth) ctx.drawImage(sprite, innerWidth / 2 + point.x * scale - 3.5, innerHeight / 2 - point.y * scale - 3.5, 7, 7);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return <canvas className="firefly-canvas" ref={canvas} aria-hidden="true" />;
}
