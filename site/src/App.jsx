import { useState } from 'react';
import { Header } from './components/Header';
import { Icon } from './components/Icon';
import { useSectionNavigation } from './hooks/useSectionNavigation';
import { sections } from './data/sections';
import HomeSection from './sections/HomeSection';
import NewsSection from './sections/NewsSection';
import OperatorSection from './sections/OperatorSection';
import WorldSection from './sections/WorldSection';
import MediaSection from './sections/MediaSection';
import MoreSection from './sections/MoreSection';

const components = [HomeSection, NewsSection, OperatorSection, WorldSection, MediaSection, MoreSection];
const lights = Array.from({ length: 20 }, (_, i) => ({ x: (i * 37) % 100, y: (i * 61) % 100, delay: -i * 0.7 }));

export function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { index, navigate } = useSectionNavigation(menuOpen);
  return <>
    <Header index={index} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
    <main id="main-content" className="page-sections" inert={menuOpen}>
      {components.map((Section, position) => <section key={sections[position].id} id={`section-${sections[position].id}`} aria-label={sections[position].title}
        className={`page-section ${index === position ? 'is-active' : ''}`} inert={index !== position} aria-hidden={index !== position}>
        <Section active={index === position} />
      </section>)}
    </main>
    <div className="page-grid" aria-hidden="true" />
    {index > 0 && <div className="fireflies" aria-hidden="true">{lights.map((light, i) => <i key={i} style={{ left: `${light.x}%`, top: `${light.y}%`, animationDelay: `${light.delay}s` }} />)}</div>}
    <aside className="section-marker" aria-hidden="true"><strong>{String(index).padStart(2, '0')}</strong><span>// {String(index).padStart(2, '0')} / 05</span><b>{sections[index].caption}</b></aside>
    {index < sections.length - 1 && !menuOpen && <button type="button" className="scroll-tip" aria-label={`前往${sections[index + 1].title}`} onClick={() => navigate(index + 1)}>
      {index === 0 && <Icon name="logo_rhodes_island" />}<span>SCROLL</span><Icon name="icon_dblArrow" />
    </button>}
    {index === 5 && <footer className="site-footer">ARKNIGHTS · 原站图像、音视频及品牌素材的权利归原权利人所有。</footer>}
  </>;
}
