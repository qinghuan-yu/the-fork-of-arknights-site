import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

export function CharacterVoice({ voices, active }) {
  const audio = useRef(null);
  const [voice, setVoice] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(false);
  const waveform = useRef(null), selector = useRef(null), trigger = useRef(null);
  const samples = useRef(Array(26).fill(0));
  useEffect(() => { const element = audio.current; return () => element.pause(); }, []);
  useEffect(() => { if (!active) audio.current.pause(); }, [active]);
  useEffect(() => {
    if (!active) return;
    const canvas = waveform.current, ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 210, 0);
    gradient.addColorStop(0, '#fff'); gradient.addColorStop(1, '#18d1ff');
    let frame, last = 0;
    const draw = time => {
      if (time - last >= 1000 / 60) {
        last = time; samples.current.shift(); samples.current.push(playing ? Math.floor(Math.random() * 19) : 0);
        ctx.clearRect(0, 0, 210, 24); ctx.fillStyle = gradient;
        samples.current.forEach((height, i) => ctx.fillRect(i * 8, 24 - (5 + height), 3, 24));
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [active, playing]);
  useEffect(() => {
    if (!open) return;
    const close = event => { if (!selector.current.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  const toggle = async () => {
    if (playing) audio.current.pause();
    else { try { await audio.current.play(); } catch { setPlaying(false); } }
  };
  return <div className="operator-voice">
    <audio ref={audio} src={voices[voice].audio} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
    <div className="operator-block"><button type="button" className="operator-icon" onClick={toggle} aria-label={playing ? '停止角色语音' : '播放角色语音'} aria-pressed={playing}><Icon name="icon_voice" /></button>
      <div ref={selector} className={`operator-selector ${open ? 'operator-dropdownVisible' : ''}`} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); trigger.current.focus(); } }}>
        <button ref={trigger} type="button" className="operator-trigger" aria-label="配音语言" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen(!open)}>
          <span className="operator-label"><span className="operator-text">CHARACTER VOICE</span><span className="operator-arrow"><Icon name="icon_arrow" rotation={90} /></span></span><span className="operator-current">{voices[voice].actor}</span>
        </button>
        <div className="operator-dropdown" role="listbox" aria-label="配音语言选项" inert={!open}>{voices.map((item, i) => i === voice ? null : <button type="button" className="operator-option" role="option" aria-selected={false} key={item.region} onClick={() => { audio.current.pause(); setVoice(i); setOpen(false); trigger.current.focus(); }}>{item.actor}</button>)}</div>
      </div>
    </div>
    <canvas ref={waveform} className="operator-waveform" width="210" height="24" aria-hidden="true" />
  </div>;
}
