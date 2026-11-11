import { useEffect } from 'react';

export function useHlsVideo(ref, source, active) {
  useEffect(() => {
    const video = ref.current;
    if (!active || !video) return;
    let disposed = false;
    let hls;
    const play = () => { if (!disposed) video.play().catch(() => {}); };
    video.addEventListener('loadedmetadata', play);
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
    } else {
      import('hls.js').then(({ default: Hls }) => {
        if (disposed) return;
        if (!Hls.isSupported()) { video.src = '/assets/video/preview.mp4'; return; }
        hls = new Hls({ maxBufferLength: 20 });
        hls.loadSource(source);
        hls.attachMedia(video);
      }).catch(() => { if (!disposed) video.src = '/assets/video/preview.mp4'; });
    }
    return () => {
      disposed = true;
      video.removeEventListener('loadedmetadata', play);
      video.pause();
      hls?.destroy();
      video.removeAttribute('src');
      video.load();
    };
  }, [ref, source, active]);
}
