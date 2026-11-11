import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

export function CharacterVoice({ voices, active }) {
  const audio = useRef(null);
  const [voice, setVoice] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { const element = audio.current; return () => element.pause(); }, []);
  useEffect(() => { if (!active) audio.current.pause(); }, [active]);
  const toggle = async () => {
    if (playing) audio.current.pause();
    else { try { await audio.current.play(); } catch { setPlaying(false); } }
  };
  return <div className="operator-voice">
    <audio ref={audio} src={voices[voice].audio} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
    <div className="operator-block"><button type="button" className="operator-icon" onClick={toggle} aria-label={playing ? '停止角色语音' : '播放角色语音'} aria-pressed={playing}><Icon name="icon_voice" /></button>
      <label className="voice-select"><span>CHARACTER VOICE</span><select aria-label="配音语言" value={voice} onChange={event => { audio.current.pause(); setVoice(Number(event.target.value)); }}>
        {voices.map((item, i) => <option key={item.region} value={i}>{item.actor} · {item.region === 'cn' ? '中文' : '日语'}</option>)}
      </select></label>
    </div>
    <div className={`voice-wave ${playing ? 'is-playing' : ''}`} aria-hidden="true">{Array.from({ length: 26 }, (_, i) => <i key={i} style={{ animationDelay: `${i * -0.13}s` }} />)}</div>
  </div>;
}
