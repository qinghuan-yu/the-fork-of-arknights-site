import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Scrollbar } from 'swiper/modules';
import videos from '../data/videos.json';
import { VideoPlayer } from './VideoPlayer';
import { Modal } from './Modal';
import { BackButton } from './BackButton';
import { useMediaQuery } from '../hooks/useMediaQuery';

export function VideoView({ onReturn, active }) {
  const [index, setIndex] = useState(0);
  const [full, setFull] = useState(false);
  const portrait = useMediaQuery('(orientation: portrait)');
  const item = videos[index].content;
  return <div className="video-videoHall video-active" data-scrollable>
    <div className="video-_videoHall"><div className="video-preview">
      <div className="video-videoWrapper">{active && !full && <VideoPlayer key={index} poster={item.coverSrc.url} controls={false} />}
        <button type="button" className="video-playBtn" aria-label="播放完整预览" onClick={() => setFull(true)}>▷</button>
      </div>
      <div className="video-info"><h2 className="video-title">{item.title}</h2><p className="video-intro">{item.intro}</p></div>
    </div><div className="video-floatingText">VIDEO</div>
      <div className="video-infoAndList"><div className="video-list"><Swiper className="video-swiper" slidesPerView={portrait ? 3 : 4} modules={[FreeMode, Scrollbar]} freeMode grabCursor scrollbar={{ el: '.video-scrollbar' }}>
        {videos.map((entry, i) => <SwiperSlide key={entry.cid}><button type="button" className={`video-item ${index === i ? 'video-active' : ''}`} aria-label={entry.content.title} aria-pressed={index === i} onClick={() => index === i ? setFull(true) : setIndex(i)}><img className="video-img" src={entry.content.coverSrc.url} alt={entry.content.title} /></button></SwiperSlide>)}
      </Swiper><div className="video-scrollbar" /></div></div>
    </div><BackButton className="video-back" onClick={onReturn} />
    {full && active && <Modal title={item.title} onClose={() => setFull(false)}><VideoPlayer poster={item.coverSrc.url} /><h2 className="player-title">{item.title}</h2></Modal>}
  </div>;
}
