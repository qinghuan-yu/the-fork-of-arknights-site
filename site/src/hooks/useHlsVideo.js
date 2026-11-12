import { useEffect } from 'react';

export function useHlsVideo(ref, source, active) {
  useEffect(() => {
    const video = ref.current;
    if (!active || !video) return;
    let disposed = false;
    let hls;
    const play = () => {
      if (!disposed && !document.hidden) video.play().catch(() => {});
    };
    const visibility = () => {
      if (document.hidden) {
        video.pause();
        hls?.stopLoad();
      } else {
        hls?.startLoad(-1);
        play();
      }
    };
    video.addEventListener('loadedmetadata', play);
    document.addEventListener('visibilitychange', visibility);
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
    } else {
      // These local H.264 playlists do not need alternate audio, subtitles or DRM.
      import('hls.js/light').then(({ default: Hls }) => {
        if (disposed) return;
        if (!Hls.isSupported()) { video.src = '/assets/video/preview.mp4'; return; }
        hls = new Hls({
          autoStartLoad: !document.hidden,
          maxBufferLength: 4,
          maxMaxBufferLength: 6,
          backBufferLength: 3,
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      }).catch(() => { if (!disposed) video.src = '/assets/video/preview.mp4'; });
    }
    return () => {
      disposed = true;
      video.removeEventListener('loadedmetadata', play);
      document.removeEventListener('visibilitychange', visibility);
      video.pause();
      hls?.destroy();
      video.removeAttribute('src');
      video.load();
    };
  }, [ref, source, active]);
}
