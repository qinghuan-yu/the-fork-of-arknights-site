import { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Scrollbar } from 'swiper/modules';
import gallery from '../data/gallery.json';
import { BackButton } from './BackButton';
import { ArtworkViewer } from './ArtworkViewer';
import { ContentTransition } from './ContentTransition';
import { Icon } from './Icon';
import { useMediaQuery } from '../hooks/useMediaQuery';

export function GalleryView({ onReturn, visible, active }) {
  const [year, setYear] = useState(gallery.defaultYear), [month, setMonth] = useState(gallery.defaultMonth);
  const [index, setIndex] = useState(0), [full, setFull] = useState(null), [yearsOpen, setYearsOpen] = useState(true);
  const portrait = useMediaQuery('(orientation: portrait)');
  const monthsRef = useRef(null), listRef = useRef(null), scrollbar = useRef(null);
  const months = gallery.GROUPED_ARTWORK_LIST[year], list = months[month] || [], item = list[index];
  useEffect(() => { monthsRef.current?.slideTo(0, 300); }, [year, portrait]);
  useEffect(() => { listRef.current?.slideTo(portrait ? Math.floor(index / 2) : Math.max(0, index - 1)); }, [index, portrait]);
  const selectYear = value => { if (value == null) return; setYear(value); setMonth(Math.max(...Object.keys(gallery.GROUPED_ARTWORK_LIST[value]).map(Number))); setIndex(0); setYearsOpen(false); };
  const yearIndex = gallery.yearList.indexOf(year);
  const monthButton = value => <button type="button" disabled={!months[value]} className={`gallery-month ${month === value ? 'gallery-active' : ''} ${!months[value] ? 'gallery-disabled' : ''}`} aria-label={`${value}月`} aria-pressed={month === value} onClick={() => { setMonth(value); setIndex(0); }}><span className="gallery-dash" /><span className="gallery-text">{String(value).padStart(2, '0')}</span></button>;
  const thumbnail = (entry, i) => <button type="button" key={entry.cid} className={`gallery-item ${index === i ? 'gallery-active' : ''}`} aria-label={entry.content.title} aria-pressed={index === i} onClick={() => setIndex(i)}><img className="gallery-img" loading="lazy" decoding="async" src={entry.content.thumbnail?.url || entry.content.resource.url} alt={entry.content.title} />{portrait && <><span className="gallery-itemName">{entry.content.title}</span><span className="gallery-tip">VIEW NOW</span></>}</button>;
  return <div className={`gallery-celebReview ${visible ? 'gallery-active' : ''}`} inert={!visible} data-scrollable>
    <div className="gallery-_celebReview">
      <button type="button" className="gallery-cover" aria-label="放大图片" onClick={() => setFull(index)}><ContentTransition state={item?.cid}><img className="gallery-img" src={item?.content.resource.url} alt={item?.content.title} /></ContentTransition></button>
      <div className="gallery-timeline"><div className="gallery-yearSelector">
        {portrait ? <div className="gallery-mobileSelector">
          <button className="gallery-arrowLeft" type="button" aria-label="上一个图集年份" disabled={yearIndex === 0} onClick={() => selectYear(gallery.yearList[yearIndex - 1])}><Icon name="icon_arrow" reverse /></button>
          <div className="gallery-titleAndCurrent"><div className="gallery-title">TIMELINE</div><div className="gallery-current">{year}</div></div>
          <button className="gallery-arrowRight" type="button" aria-label="下一个图集年份" disabled={yearIndex === gallery.yearList.length - 1} onClick={() => selectYear(gallery.yearList[yearIndex + 1])}><Icon name="icon_arrow" /></button>
        </div> : <><div className="gallery-title">TIMELINE</div><button className="gallery-landscapeSelector" type="button" aria-label="图集年份" aria-expanded={yearsOpen} onClick={() => setYearsOpen(!yearsOpen)}><span className="gallery-current">{year}</span><span className={`gallery-arrow ${yearsOpen ? 'gallery-reverse' : ''}`}><Icon name="icon_arrow" /></span></button>
          <div className={`gallery-yearList ${yearsOpen ? 'gallery-visible' : ''}`} inert={!yearsOpen}>{gallery.yearList.map(value => <button className={`gallery-yearItem ${year === value ? 'gallery-active' : ''}`} type="button" key={value} aria-pressed={year === value} onClick={() => selectYear(value)}>{value}</button>)}</div></>}
      </div><div className="gallery-monthSelector">
        {portrait ? <div className="gallery-months">{Array.from({ length: 12 }, (_, i) => <div key={i} className={`gallery-slide ${i === 0 ? 'gallery-first' : i === 11 ? 'gallery-last' : ''}`}>{monthButton(i + 1)}</div>)}</div> : <Swiper className="gallery-monthSwiper" direction="vertical" slidesPerView={6} modules={[FreeMode]} freeMode grabCursor onSwiper={instance => { monthsRef.current = instance; }}>{Array.from({ length: 12 }, (_, i) => <SwiperSlide key={i}><div className={`gallery-slide ${i === 0 ? 'gallery-first' : i === 11 ? 'gallery-last' : ''}`}>{monthButton(i + 1)}</div></SwiperSlide>)}</Swiper>}
      </div></div>
      <div className="gallery-floatingText">GALLERY</div>
      <div className="gallery-infoAndList">{!portrait && <div className="gallery-info"><ContentTransition state={item?.cid} direction="horizontal"><div><h2 className="gallery-title">{item?.content.title}</h2><p className="gallery-desc">{item?.content.desc}</p></div></ContentTransition></div>}
        <div className="gallery-list"><Swiper key={`${portrait}-${year}-${month}`} className="gallery-swiper" slidesPerView={portrait ? 2 : 4} modules={[FreeMode, Scrollbar]} freeMode grabCursor onSwiper={instance => { listRef.current = instance; }} scrollbar={portrait ? { el: scrollbar.current, draggable: true } : false}>
          {portrait ? Array.from({ length: Math.ceil(list.length / 2) }, (_, column) => <SwiperSlide key={column}><div className="gallery-items">{list.slice(column * 2, column * 2 + 2).map((entry, row) => thumbnail(entry, column * 2 + row))}</div></SwiperSlide>) : list.map((entry, i) => <SwiperSlide key={entry.cid}>{thumbnail(entry, i)}</SwiperSlide>)}
        </Swiper>{portrait ? <div className="gallery-scrollbar" ref={scrollbar} /> : list.length > 4 && <><button type="button" className="gallery-arrowLeft" aria-label="上一个图集缩略图" disabled={index === 0} onClick={() => setIndex(index - 1)}><Icon name="icon_arrow" reverse /></button><button type="button" className="gallery-arrowRight" aria-label="下一个图集缩略图" disabled={index === list.length - 1} onClick={() => setIndex(index + 1)}><Icon name="icon_arrow" /></button></>}</div>
      </div>
    </div><BackButton className="gallery-back" onClick={onReturn} />
    {full !== null && active && visible && <ArtworkViewer list={list} index={full} onChange={setFull} onClose={() => setFull(null)} />}
  </div>;
}
