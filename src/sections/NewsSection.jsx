import { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Scrollbar } from 'swiper/modules';
import news from '../data/news.json';
import { Icon } from '../components/Icon';
import { ContentTransition } from '../components/ContentTransition';
import { useMediaQuery } from '../hooks/useMediaQuery';

const labels = { LATEST: '最新', ANNOUNCEMENT: '公告', ACTIVITY: '活动', NEWS: '新闻' };
const date = seconds => new Date(seconds * 1000).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).replace('/', ' // ').replace(/\/(\d+)$/, ' / $1');

export default function NewsSection({ active }) {
  const [category, setCategory] = useState('LATEST');
  const portrait = useMediaQuery('(orientation: portrait)');
  const [slide, setSlide] = useState(0);
  const swiper = useRef(null);
  const banner = news.banners[slide];
  useEffect(() => { active ? swiper.current?.autoplay.start() : swiper.current?.autoplay.stop(); }, [active]);
  return <div className={`information-container ${active ? 'information-active' : ''}`}>
    <div className="information-bottomShadow" />
    <div className="information-bannerContainer" data-scrollable>
      <Swiper className="information-swiper" modules={[Autoplay, Scrollbar]} autoplay={active ? { delay: 5000 } : false} grabCursor
        scrollbar={{ el: '.information-bannerScrollBar', draggable: true }} onSwiper={instance => { swiper.current = instance; }} onSlideChange={instance => setSlide(instance.activeIndex)}>
        {news.banners.map(item => <SwiperSlide key={item.cid}><div className="information-imgWrapper"><img className="information-img" src={item.pcCover} alt={item.title} /></div></SwiperSlide>)}
      </Swiper>
    </div>
    <div className="information-bannerScrollBarContainer"><div className="information-bannerScrollBar" /></div>
    <div className="information-globalMask1" /><div className="information-globalMask2" />
    <div className="information-main"><div className="information-bgBlock" /><div className="information-mainMask" />
      <div className="information-articlesContainer"><div className="information-floatingText"><span className="information-text">BREAKING NEWS</span></div>
        <div className="information-currentBannerInfo"><ContentTransition state={banner.cid} direction="horizontal"><div>
          {!portrait && <div className="information-date">{date(banner.ts)}</div>}<h2 className="information-title">{banner.title}</h2>
          {portrait && <div className="information-date">{date(banner.ts)}</div>}<div className="information-subtitle">{banner.desc}</div><div className="information-comment">HTTPS://AK.HYPERGRYPH.COM/</div>
        </div></ContentTransition></div>
        <div className="information-tabList" role="tablist" aria-label="情报分类">
          {Object.entries(labels).map(([key, label]) => <button type="button" key={key} role="tab" aria-selected={category === key}
            className={`information-tabItem ${category === key ? 'information-active' : ''}`} onClick={() => setCategory(key)}>
            <span>{label}</span><span className="information-icon"><Icon name="icon_arrow" /></span>
          </button>)}
        </div>
        <ContentTransition state={category} direction="horizontal"><div className="information-newsList" role="tabpanel">
          {news.categories[category].map(item => <article className="information-newsItem" key={item.cid}>
            <span className="information-cate">{labels[category === 'LATEST' ? ({ '2': 'ACTIVITY', '3': 'NEWS' }[item.tab] || 'ANNOUNCEMENT') : category]}</span>
            <div className="information-newsInfo"><time className="information-date">{date(item.displayTime)}</time><h3 className="information-newsTitle">{item.title}</h3></div>
          </article>)}
        </div></ContentTransition>
      </div>
    </div>
  </div>;
}
