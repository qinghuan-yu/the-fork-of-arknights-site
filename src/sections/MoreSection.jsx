import { useState } from 'react';
import cards from '../data/more.json';
import themes from '../data/themes.json';
import { TopicView } from '../components/TopicView';
import { useMediaQuery } from '../hooks/useMediaQuery';

export default function MoreSection({ active }) {
  const [view, setView] = useState(null);
  const portrait = useMediaQuery('(orientation: portrait)');
  return <div className="more-container">
    <div className={`more-list ${view ? 'more-hidden' : ''}`} inert={!!view}><div className="more-_list">{cards.map(item => <button type="button" className="more-listItem" key={item.key} onClick={() => setView(item)}>
      <span className="more-cover" style={{ backgroundImage: `url(${portrait ? item.cover_portrait : item.cover})` }} /><span className="more-brightnessMask" /><span className="more-themeMask" style={{ color: item.themeColor }} /><span className="more-activeMask" style={{ color: item.activeColor }} /><span className="more-shadowMask" />
      <span className="more-info"><span className="more-title"><span>{item.name}</span><span className="more-icon" style={{ backgroundImage: `url(${item.icon})` }} /></span><span className="more-subtitle">{item.nameEn}</span><span className="more-desc">VIEW MORE &gt;</span></span>
    </button>)}</div><div className="more-floatingText">MORE CONTENT</div></div>
    {cards.map(item => <TopicView key={item.key} title={item.nameEn} topics={item.view === 1 ? themes.isList : themes.raList} visible={view?.key === item.key} onReturn={() => setView(null)} active={active && view?.key === item.key} />)}
  </div>;
}
