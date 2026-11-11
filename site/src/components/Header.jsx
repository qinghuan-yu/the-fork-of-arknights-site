import { useEffect, useRef, useState } from 'react';
import { sections } from '../data/sections';
import { Icon } from './Icon';

export function Header({ index, menuOpen, setMenuOpen }) {
  const audio = useRef(null);
  const menuButton = useRef(null);
  const menu = useRef(null);
  const [music, setMusic] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    menu.current.querySelector('a')?.focus();
    const handleKey = event => {
      if (event.key === 'Escape') { setMenuOpen(false); menuButton.current.focus(); }
      if (event.key === 'Tab') {
        const links = [...menu.current.querySelectorAll('a'), menuButton.current];
        const current = links.indexOf(document.activeElement);
        const next = (current + (event.shiftKey ? -1 : 1) + links.length) % links.length;
        event.preventDefault(); links[next].focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [menuOpen, setMenuOpen]);
  const toggleMusic = async () => {
    if (music) { audio.current.pause(); setMusic(false); }
    else { try { await audio.current.play(); setMusic(true); } catch { setMusic(false); } }
  };
  const links = () => sections.map((section, position) => <a key={section.id} href={`#${section.id}`}
    aria-current={index === position ? 'page' : undefined} onClick={() => setMenuOpen(false)}
    className={`navigation-item ${index === position ? 'navigation-active' : ''}`}>
    <span className="navigation-subtitle">{section.english}</span><span className="navigation-title">{section.title}</span>
  </a>);
  return <>
    <header className={`header-container ${menuOpen ? 'header-menuVisible' : ''}`}>
      <a className="header-logo" href="#index" aria-label="明日方舟首页" onClick={() => setMenuOpen(false)}><Icon name="title_arknights" /></a>
      <nav className="header-nav" aria-label="主导航"><div className="navigation-container">{links()}</div></nav>
      <div className="header-buttons"><button type="button" aria-label="背景音乐" aria-pressed={music}
        className={`header-button header-switch ${music ? 'header-active' : ''}`} onClick={toggleMusic}><Icon name="icon_sound" /></button></div>
      <button ref={menuButton} type="button" aria-label={menuOpen ? '关闭菜单' : '打开菜单'} aria-expanded={menuOpen} aria-controls="mobile-navigation"
        className={`header-menuBtn ${menuOpen ? 'header-active' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
        <span className="header-icon">{[1, 2, 3].map(n => <i key={n} className={`header-line header-line${n}`} />)}</span>
      </button>
    </header>
    <div className={`header-menu ${menuOpen ? 'header-visible' : 'header-hidden'}`} inert={!menuOpen}>
      <div className="header-_menu"><nav ref={menu} id="mobile-navigation" className="header-nav" aria-label="手机导航">
        <div className={`navigation-menuNav ${menuOpen ? 'navigation-active' : ''}`}>{links()}</div>
      </nav></div>
    </div>
    <audio ref={audio} src="/assets/audio/bgm.ea4286.mp3" loop preload="none" />
  </>;
}
