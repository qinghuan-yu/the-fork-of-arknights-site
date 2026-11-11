import { useEffect, useRef } from 'react';

export function VideoPlayer({ poster, autoPlay = true, controls = true, className = '' }) {
  const ref = useRef(null);
  useEffect(() => { const video = ref.current; return () => video.pause(); }, []);
  return <div className={`video-player ${className}`}>
    <video ref={ref} src="/assets/video/preview.mp4" poster={poster} autoPlay={autoPlay} muted loop playsInline controls={controls} data-local-preview="true" />
    <span className="preview-label">循环演示</span>
  </div>;
}
