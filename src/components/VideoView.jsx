import { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Scrollbar } from 'swiper/modules';
import videos from '../data/videos.json';
import { VideoPlayer } from './VideoPlayer';
import { VideoFullViewer } from './VideoFullViewer';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { ContentTransition } from './ContentTransition';
import { Icon } from './Icon';

export function VideoView({ onReturn, active, visible }) {
  const [index, setIndex] = useState(0);
  const [full, setFull] = useState(false);
  const swiper = useRef(null);
  const portrait = useMediaQuery('(orientation: portrait)');
  const item = videos[index].content;
  const categories = ['版本PV', 'CG动画', '泰拉探索', '特别映像', '干员PV'];
  const date = new Date(item.displayTime).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).replace('/', ' // ').replace(/\/(\d+)$/, ' / $1');
  useEffect(() => { swiper.current?.slideTo(Math.max(0, index - 1)); }, [index]);
  useEffect(() => { if (!active) setFull(false); }, [active]);
  return <div className={`video-videoHall ${visible ? 'video-active' : ''}`} inert={!visible} data-scrollable>
    <div className="video-_videoHall"><ContentTransition state={index}><div className="video-preview">
      <div className="video-videoWrapper">{active && !full && <VideoPlayer key={index} poster={item.coverSrc.url} controls={false} />}
        <button type="button" className="video-playBtn" aria-label="播放完整预览" onClick={() => setFull(true)}><Icon name="icon_play_btn" /></button>
      </div>
      {portrait && <><div className="video-info"><h2 className="video-title">{item.title}</h2><div className="video-cateAndDate"><span className="video-cate">{categories[item.cate]}</span><time className="video-date">{date}</time></div><p className="video-intro">{item.intro}</p></div><div className="video-officialHref">HTTPS://AK.HYPERGRYPH.COM/</div></>}
    </div></ContentTransition><div className="video-floatingText">VIDEO</div>
      <div className="video-infoAndList"><div className="video-list"><Swiper className="video-swiper" onSwiper={instance => { swiper.current = instance; }} slidesPerView={portrait ? 3 : 4} modules={[FreeMode, Scrollbar]} freeMode grabCursor scrollbar={{ el: '.video-scrollbar' }}>
        {videos.map((entry, i) => <SwiperSlide className="video-slide" key={entry.cid}><button type="button" className={`video-item ${index === i ? 'video-active' : ''}`} aria-label={entry.content.title} aria-pressed={index === i} onClick={() => index === i ? setFull(true) : setIndex(i)}><img className="video-img" src={entry.content.coverSrc.url} alt={entry.content.title} /></button></SwiperSlide>)}
      </Swiper><div className="video-scrollbar" />{!portrait && <><button type="button" className="video-arrowLeft" aria-label="上一个视频" disabled={index === 0} onClick={() => setIndex(index - 1)}><Icon name="icon_arrow" reverse /></button><button type="button" className="video-arrowRight" aria-label="下一个视频" disabled={index === videos.length - 1} onClick={() => setIndex(index + 1)}><Icon name="icon_arrow" /></button></>}</div></div>
    </div><div className="video-buttonGroup"><button type="button" className="video-button video-returnBtn" onClick={onReturn}><span className="video-icon"><Icon name="icon_arrow_hrz" /></span><span className="video-btnText"><span className="video-main">返回</span><span className="video-sub">GO BACK</span></span></button></div>
    {full && active && <VideoFullViewer list={videos} initialIndex={index} onClose={() => setFull(false)} />}
  </div>;
}
