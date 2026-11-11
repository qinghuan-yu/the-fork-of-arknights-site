import { useRef } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useHlsVideo } from '../hooks/useHlsVideo';
import { Icon } from '../components/Icon';
import assets from '../data/assets.json';
import '../styles/home.css';

export default function HomeSection({ active }) {
  const video = useRef(null);
  const portrait = useMediaQuery('(orientation: portrait)');
  useHlsVideo(video, portrait ? assets.homePortrait : assets.homeLandscape, active);
  return <div className={`home-container ${active ? 'home-active' : ''}`}>
    <div className="home-bg" /><video ref={video} className="home-background-video" muted loop playsInline />
    <div className="home-maskBlock" /><div className="home-maskBlock2" /><div className="home-bottomShadow" />
    <div className="home-infos"><div className="home-main"><div className="home-primaryText">ARKNIGHTS</div>
      <div className="home-subBox"><div className="home-secondaryText">RHODES ISLAND</div><div className="home-linkText">ARKNIGHTS / LOCAL ARCHIVE</div></div>
    </div><div className="home-copyright"><Icon name="copyright_mini" /></div></div>
  </div>;
}
