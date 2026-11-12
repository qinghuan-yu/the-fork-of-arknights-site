import { useEffect, useState } from 'react';
import world from '../data/world.json';
import { ParticleCanvas } from '../components/ParticleCanvas';
import { BackButton } from '../components/BackButton';
import { Icon } from '../components/Icon';
import { WorldDetail } from '../components/WorldDetail';
import { useMediaQuery } from '../hooks/useMediaQuery';

export default function WorldSection({ active }) {
  const portrait = useMediaQuery('(orientation: portrait)');
  const [index, setIndex] = useState(() => matchMedia('(orientation: portrait)').matches ? 0 : null);
  const [hover, setHover] = useState(null);
  const [direction, setDirection] = useState(1);
  useEffect(() => { if (portrait) setIndex(0); }, [portrait]);
  const item = index === null ? null : world[index];
  const change = direction => { setDirection(direction); setIndex((index + direction + world.length) % world.length); };
  return <div className={`world-container ${active ? 'world-active' : ''} ${item ? 'world-detailVisible' : 'world-detailInvisible'}`}>
    <div className="world-bgMask" /><ParticleCanvas active={active} model={item?.id || 'rhodes'} detail={!!item} fallback={item?.image} hover={item || !active ? null : hover} />
    <div className="world-storyList" inert={!!item} onPointerLeave={() => setHover(null)}>
      {world.map((entry, i) => <button type="button" key={entry.id} style={{ transitionDelay: `${i * 200}ms` }} className={`world-storyItem ${active && !item ? 'world-visible' : ''}`} onPointerEnter={() => setHover(entry.image)} onClick={() => { setIndex(i); setHover(null); }}>
        <span className="world-shadowText">{entry.nameEn}</span><span className="world-name">{entry.name}</span><span className="world-nameEn">{entry.nameEn}</span>
      </button>)}
    </div>
    <div className="world-detailContainer" inert={!item}>
      <WorldDetail item={item} direction={direction} />
      <button type="button" className="world-arrowLeft" aria-label="上一个设定" onClick={() => change(-1)}><Icon name="icon_arrow" reverse /></button>
      <button type="button" className="world-arrowRight" aria-label="下一个设定" onClick={() => change(1)}><Icon name="icon_arrow" /></button>
    </div>
    <div className="world-floatingText">WORLD</div>
    <div className="world-nav" inert={!item}><div className="world-_nav">{world.map((entry, i) => <button type="button" key={entry.id} className="world-navItem" aria-label={entry.name} aria-pressed={i === index} onClick={() => change(i - index)} />)}
      <div className="world-pointer" style={{ width: `${100 / world.length}%`, left: `${(index || 0) * 100 / world.length}%` }} /></div></div>
    {!portrait && <BackButton className="world-back" onClick={() => setIndex(null)} />}
  </div>;
}
