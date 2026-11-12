import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Scrollbar } from 'swiper/modules';
import operators from '../data/operators.json';
import camps from '../data/camps.json';
import { CharacterVoice } from '../components/CharacterVoice';
import { Icon } from '../components/Icon';
import { ContentTransition } from '../components/ContentTransition';
import { BorderText } from '../components/BorderText';

export default function OperatorSection({ active }) {
  const [index, setIndex] = useState(0);
  const [phases, setPhases] = useState({});
  const operator = operators[index];
  const phase = phases[operator.code] || 0;
  const illustration = operator.illustList[phase];
  const focus = illustration.focus || {};
  return <div className="operator-container">
    <div className="operator-bgMask" /><div className="operator-illustStyled"><ContentTransition state={`${index}-${phase}`} direction="horizontal"><div className="operator-img" style={{ backgroundImage: illustration.illustStyled ? `url(${illustration.illustStyled})` : undefined }} /></ContentTransition></div>
    <ContentTransition state={`${index}-${phase}`} direction="horizontal" reverse><div className="operator-illust"><div className="operator-imgWrapper"><img className="operator-img" src={illustration.illust} alt={`${operator.name} 精英化 ${illustration.phase}`}
      style={{ transformOrigin: `${(focus.ox ?? 0.5) * 100}% ${(focus.oy ?? 0.5) * 100}%`, transform: `translate(${(focus.tx || 0) * 100}%,${(focus.ty || 0) * 100}%) scale(${focus.scale || 1})` }} /></div></div></ContentTransition>
    <div className="operator-bottomBlock" /><div className="operator-moduleTitle"><div className="operator-title">RHODES ISLAND ://</div><div className="operator-subtitle">PROFILE</div></div>
    <div className="operator-main"><div className="operator-_main">
      <ContentTransition state={operator.code} direction="horizontal" reverse><div className="operator-charInfo">
        <div className="operator-codenameShadowed"><div className="operator-text">{operator.codename}</div><BorderText>{operator.codename}</BorderText></div>
        <div className="operator-charNameAndCamp"><div className="operator-charName"><div className="operator-codename">{operator.codename}</div><h2 className="operator-name">{operator.name}</h2></div>
          <div className="operator-camp"><img className="operator-img" src={camps[operator.camp]} alt={operator.camp} /></div></div>
        <div className="operator-voiceContainer"><CharacterVoice voices={operator.voices} active={active} /></div>
        <p className="operator-intro">{operator.intro}</p>
      </div></ContentTransition>
      <div className="operator-list" data-scrollable><Swiper className="operator-scrollView" slidesPerView={4} modules={[FreeMode, Scrollbar]} freeMode grabCursor scrollbar={{ el: '.operator-scrollbar', draggable: true }}>
        {operators.map((item, i) => <SwiperSlide key={item.code}><button type="button" className={`operator-charAvatar ${i === index ? 'operator-active' : ''}`} aria-label={`选择干员 ${item.name}`} aria-pressed={i === index} onClick={() => setIndex(i)}>
          <span className="operator-flag" /><span className="operator-border" /><span className="operator-avatar"><img className="operator-img" src={item.avatar} alt="" /></span>
          <span className="operator-info"><span className="operator-charName">{item.name}</span></span>
        </button></SwiperSlide>)}
      </Swiper></div><div className="operator-scrollbar" />
    </div></div>
    <div className="operator-phaseSelector">{operator.illustList.map((item, i) => <button type="button" key={item.phase} aria-label={`精英化 ${item.phase}`} aria-pressed={phase === i}
      className={`operator-phaseItem ${phase === i ? 'operator-active' : ''}`} onClick={() => setPhases(previous => ({ ...previous, [operator.code]: i }))}><span className="operator-icon"><Icon name={`elite_phase_${item.phase}`} /></span></button>)}</div>
  </div>;
}
