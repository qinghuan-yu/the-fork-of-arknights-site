import { useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';

export function ParticleCanvas({ active, model, detail, fallback }) {
  const canvas = useRef(null);
  const scene = useRef(null);
  const latest = useRef({ model, detail });
  const [failed, setFailed] = useState(false);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  useEffect(() => {
    latest.current = { model, detail };
    scene.current?.setModel(model, detail);
  }, [model, detail]);
  useEffect(() => {
    if (!active) return;
    let disposed = false;
    import('../animations/ParticleScene').then(({ ParticleScene }) => {
      if (disposed) return;
      try {
        scene.current = new ParticleScene(canvas.current, { reducedMotion });
        scene.current.setModel(latest.current.model, latest.current.detail);
        setFailed(false);
      } catch { setFailed(true); }
    });
    return () => { disposed = true; scene.current?.dispose(); scene.current = null; };
  }, [active, reducedMotion]);
  return <><canvas ref={canvas} className="particle-canvas" aria-hidden="true" />{failed && fallback ? <img className="particle-fallback" src={fallback} alt="" /> : null}</>;
}
