import { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import gallery from '../data/gallery.json';
import { BackButton } from './BackButton';
import { Modal } from './Modal';
import { useMediaQuery } from '../hooks/useMediaQuery';

export function GalleryView({ onReturn }) {
  const [year, setYear] = useState(gallery.defaultYear);
  const [month, setMonth] = useState(gallery.defaultMonth);
  const [index, setIndex] = useState(0);
  const [full, setFull] = useState(null);
  const portrait = useMediaQuery('(orientation: portrait)');
  const monthsRef = useRef(null);
  const months = gallery.GROUPED_ARTWORK_LIST[year];
  const list = months[month] || [];
  const item = list[index];
  useEffect(() => {
    const container = monthsRef.current;
    const selected = container?.querySelector('[aria-pressed="true"]');
    if (!selected) return;
    const bounds = container.getBoundingClientRect();
    const target = selected.getBoundingClientRect();
    // Scroll only the month strip, never the surrounding full-screen section.
    container.scrollLeft += target.left - bounds.left - (bounds.width - target.width) / 2;
    container.scrollTop += target.top - bounds.top - (bounds.height - target.height) / 2;
  }, [year, month, portrait]);
  const selectYear = value => { setYear(value); setMonth(Math.max(...Object.keys(gallery.GROUPED_ARTWORK_LIST[value]).map(Number))); setIndex(0); };
  return <div className="gallery-celebReview gallery-active" data-scrollable>
    <div className="gallery-_celebReview">
      <button type="button" className="gallery-cover" aria-label="放大图片" onClick={() => setFull(index)}><img className="gallery-img content-enter" key={item?.cid} src={item?.content.resource.url} alt={item?.content.title} /></button>
      <div className="gallery-timeline"><div className="gallery-yearSelector"><div className="gallery-title">TIMELINE</div>
        <select className="gallery-year-input" aria-label="图集年份" value={year} onChange={event => selectYear(Number(event.target.value))}>{gallery.yearList.map(value => <option key={value}>{value}</option>)}</select>
      </div><div className="gallery-monthSelector"><div className="gallery-months" ref={monthsRef}>{Array.from({ length: 12 }, (_, i) => i + 1).map(value => <button type="button" key={value} disabled={!months[value]}
        className={`gallery-month ${month === value ? 'gallery-active' : ''}`} aria-label={`${value}月`} aria-pressed={month === value} onClick={() => { setMonth(value); setIndex(0); }}><span className="gallery-dash" /><span className="gallery-text">{String(value).padStart(2, '0')}</span></button>)}</div></div></div>
      <div className="gallery-floatingText">GALLERY</div>
      <div className="gallery-infoAndList"><div className="gallery-info"><h2 className="gallery-title">{item?.content.title}</h2><p className="gallery-desc">{item?.content.desc}</p></div>
        <div className="gallery-list"><Swiper className="gallery-swiper" slidesPerView={portrait ? 2 : 4} modules={[FreeMode]} freeMode grabCursor>
          {list.map((entry, i) => <SwiperSlide key={entry.cid}><button type="button" className={`gallery-item ${index === i ? 'gallery-active' : ''}`} aria-label={entry.content.title} aria-pressed={index === i} onClick={() => setIndex(i)}><img className="gallery-img" loading="lazy" decoding="async" src={entry.content.thumbnail?.url || entry.content.resource.url} alt={entry.content.title} /></button></SwiperSlide>)}
        </Swiper></div>
      </div>
    </div><BackButton className="gallery-back" onClick={onReturn} />
    {full !== null && <Modal title={list[full].content.title} onClose={() => setFull(null)}>
      <img className="full-artwork" src={list[full].content.resource.url} alt={list[full].content.title} />
      <div className="artwork-caption"><button type="button" aria-label="上一张图片" onClick={() => setFull((full - 1 + list.length) % list.length)}>←</button>
        <div><h3>{list[full].content.title}</h3><p>{list[full].content.desc}</p></div>
        <button type="button" aria-label="下一张图片" onClick={() => setFull((full + 1) % list.length)}>→</button></div>
    </Modal>}
  </div>;
}
