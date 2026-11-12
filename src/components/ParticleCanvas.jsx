import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMediaQuery } from '../hooks/useMediaQuery';

export function ParticleCanvas({ active, model, detail, fallback, hover }) {
  const canvas = useRef(null), scene = useRef(null);
  const latest = useRef({ active, model, detail, hover }); latest.current = { active, model, detail, hover };
  const [failed, setFailed] = useState(false);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  useEffect(() => {
    let disposed = false;
    import('../animations/ParticleScene').then(({ ParticleScene }) => {
      if (disposed) return;
      try {
        scene.current = new ParticleScene(canvas.current, { reducedMotion });
        if (latest.current.active) scene.current.setModel(latest.current.model, latest.current.detail).then(() => scene.current?.setHover(latest.current.hover)).catch(() => setFailed(true));
        setFailed(false);
      } catch { setFailed(true); }
    });
    return () => { disposed = true; scene.current?.dispose(); scene.current = null; };
  }, [reducedMotion]);
  useEffect(() => {
    if (active) scene.current?.setModel(model, detail).catch(() => setFailed(true));
    else scene.current?.disappear();
  }, [active, model, detail]);
  useEffect(() => { scene.current?.setHover(hover); }, [hover]);
  return createPortal(<><canvas ref={canvas} className="particle-canvas" aria-hidden="true" />{active && failed && fallback ? <img className="particle-fallback" src={fallback} alt="" /> : null}</>, document.getElementById('world-effects'));
}
