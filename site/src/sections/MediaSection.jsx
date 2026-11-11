import { useState } from 'react';
import modules from '../data/media.json';
import { GalleryView } from '../components/GalleryView';
import { VideoView } from '../components/VideoView';
import { Icon } from '../components/Icon';
import { useMediaQuery } from '../hooks/useMediaQuery';
import '../styles/media.css';

const labels = { GALLERY: ['游戏图集', '节事回顾'], VIDEO: ['影像资料', '宣传影像与精彩瞬间'] };
const percent = (value, total) => `${value / total * 100}%`;

export default function MediaSection({ active }) {
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState(null);
  const portrait = useMediaQuery('(orientation: portrait)');
  return <div className="media-container"><div className="media-bgMask" />
    {view === null && <div className="media-home media-active"><div className="media-blurHandler" onClick={() => setSelected(null)} />
      <div className="media-_home"><div className="media-blurHandler" onClick={() => setSelected(null)} />
        <div className="media-mainStage">{modules.map(item => {
          const box = item.activeImageStyles;
          const title = portrait ? item.titleStylesPortrait : item.titleStyles;
          return <button type="button" key={item.key} className={`media-moduleItem ${selected === item.key ? 'media-active' : ''}`} aria-label={`选择${labels[item.key][0]}`}
            style={{ width: percent(box.width, 1027), height: percent(box.height, 814), left: percent(box.left, 1027), top: percent(box.top, 814) }} onClick={() => selected === item.key ? setView(item.key) : setSelected(item.key)}>
            <span className="media-blockOne" style={{ left: percent(item.blockOne.left, box.width), top: percent(item.blockOne.top, box.height) }} /><span className="media-blockTwo" style={{ left: percent(item.blockTwo.left, box.width), top: percent(item.blockTwo.top, box.height) }} />
            <img className="media-moduleImg" src={item.activeImage} alt="" /><span className="media-title" style={{ left: percent(title.left, box.width), top: percent(title.top, box.height) }}><i className="media-box" />{item.key}</span>
          </button>;
        })}</div>
        <div className="media-moduleTitle"><div className="media-title">ABOUT TERRA</div><div className="media-moduleMenu">{modules.map(item => <button type="button" key={item.key} className={`media-item ${selected === item.key ? 'media-active' : ''}`} aria-pressed={selected === item.key} onClick={() => setSelected(item.key)}><span className="media-checkbox" />{item.key}</button>)}</div></div>
        <div className="media-floatingText">ABOUT TERRA</div><div className="media-info"><div className="content-enter" key={selected}>
          <div className="media-subtitle">{selected || 'ABOUT TERRA'}</div><h2 className="media-title">{selected ? labels[selected][0] : '泰拉万象'}</h2>
          <div className="media-desc"><div className="media-mainText">{selected ? labels[selected][1] : '请选择您要查看的内容'}</div><div className="media-subText">ARKNIGHTS / ABOUT TERRA</div></div>
        </div></div>
        {selected && <button type="button" className="media-detailBtn media-visible" onClick={() => setView(selected)}><span><span className="media-mainText">查看详情</span><span className="media-subText">READ MORE</span></span><span className="media-icon"><Icon name="icon_arrow" /></span></button>}
      </div>
    </div>}
    {view === 'GALLERY' && <GalleryView onReturn={() => setView(null)} />}
    {view === 'VIDEO' && <VideoView active={active} onReturn={() => setView(null)} />}
  </div>;
}
