import { useRef, useState } from 'react';
import world from '../data/world.json';
import { ParticleCanvas } from '../components/ParticleCanvas';
import { BackButton } from '../components/BackButton';
import { Icon } from '../components/Icon';

export default function WorldSection({ active }) {
  const [index, setIndex] = useState(null);
  const [hover, setHover] = useState(null);
  const preview = useRef(null);
  const item = index === null ? null : world[index];
  const change = direction => setIndex((index + direction + world.length) % world.length);
  return <div className={`world-container world-active ${item ? 'world-detailVisible' : 'world-detailInvisible'}`}>
    <div className="world-bgMask" /><ParticleCanvas active={active} model={item?.id || 'rhodes'} detail={!!item} fallback={item?.image} />
    <div className="world-storyList" inert={!!item} onPointerLeave={() => setHover(null)} onPointerMove={event => {
      if (preview.current) preview.current.style.transform = `translate(${event.clientX + 24}px,${event.clientY - 150}px)`;
    }}>
      {world.map((entry, i) => <button type="button" key={entry.id} className={`world-storyItem ${!item ? 'world-visible' : ''}`} onPointerEnter={() => setHover(entry.image)} onClick={() => { setIndex(i); setHover(null); }}>
        <span className="world-shadowText">{entry.nameEn}</span><span className="world-name">{entry.name}</span><span className="world-nameEn">{entry.nameEn}</span>
      </button>)}
    </div>
    {hover && !item && <img ref={preview} className="world-hover-preview" src={hover} alt="" />}
    <div className="world-detailContainer" inert={!item}>
      <div className="world-detailContent content-enter" key={item?.id}>
        <h2 className="world-title"><span className="world-text">{item?.name}</span></h2>
        <div className="world-subtitle"><span className="world-text">{item?.nameEn}</span></div>
        <p className="world-desc"><span className="world-text">{item?.intro}</span></p>
      </div>
      <button type="button" className="world-arrowLeft" aria-label="上一个设定" onClick={() => change(-1)}><Icon name="icon_arrow" reverse /></button>
      <button type="button" className="world-arrowRight" aria-label="下一个设定" onClick={() => change(1)}><Icon name="icon_arrow" /></button>
    </div>
    <div className="world-floatingText">WORLD</div>
    {item && <><div className="world-nav"><div className="world-_nav">{world.map((entry, i) => <button type="button" key={entry.id} className="world-navItem" aria-label={entry.name} aria-pressed={i === index} onClick={() => setIndex(i)} />)}
      <div className="world-pointer" style={{ width: `${100 / world.length}%`, left: `${index * 100 / world.length}%` }} /></div></div><BackButton className="world-back" onClick={() => setIndex(null)} /></>}
  </div>;
}
