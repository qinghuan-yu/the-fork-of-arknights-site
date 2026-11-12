import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ContentTransition } from './ContentTransition';
import { VideoPlayer } from './VideoPlayer';
import { Icon } from './Icon';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useViewerMotion } from '../hooks/useViewerMotion';

export function VideoFullViewer({ list, initialIndex, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const ref = useRef(null);
  const portrait = useMediaQuery('(orientation: portrait)');
  const { close, onKeyDown } = useViewerMotion(ref, onClose);
  const item = list[index].content;
  const move = delta => setIndex(value => (value + delta + list.length) % list.length);
  return createPortal(<div ref={ref} className="video-fullViewer video-visible" role="dialog" aria-modal="true" aria-label={item.title} onKeyDown={event => {
    onKeyDown(event);
    if (event.target.tagName !== 'VIDEO') {
      if (event.key === 'ArrowLeft') move(-1);
      if (event.key === 'ArrowRight') move(1);
    }
  }}>
    <ContentTransition state={index} appear><div className="video-bg" style={{ backgroundImage: `url(${item.coverSrc.url})` }} /></ContentTransition><div className="video-bgMask" />
    <div className="video-_fullViewer"><div className="video-layer"><ContentTransition state={index} appear><div>
      <div className="video-primary"><VideoPlayer className="video-media" poster={item.coverSrc.url} /></div>
      <div className="video-titleAndDateAndDesc"><div className="video-titleAndDate"><h2 className="video-title">{item.title}</h2><time className="video-date">{new Date(item.displayTime).toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })}</time></div><p className="video-desc">{item.intro}</p></div>
    </div></ContentTransition></div>
      {!portrait && list.length > 1 && <><button type="button" className="video-arrowLeft" aria-label="上一个视频" onClick={() => move(-1)}><Icon name="icon_arrow" reverse /></button><button type="button" className="video-arrowRight" aria-label="下一个视频" onClick={() => move(1)}><Icon name="icon_arrow" /></button></>}
    </div>
    {portrait && <><div className="video-floatingText">VIDEO</div><div className="video-coordMark" /></>}
    <button type="button" data-viewer-close className={portrait ? 'video-closeBtnPortrait' : 'video-closeBtn'} aria-label="关闭预览" onClick={close}>{portrait && <><span className="video-icon"><Icon name="icon_arrow_hrz" /></span><span className="video-btnText"><span className="video-main">返回</span><span className="video-sub">GO BACK</span></span></>}</button>
  </div>, document.getElementById('root'));
}
