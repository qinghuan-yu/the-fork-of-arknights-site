import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { ContentTransition } from './ContentTransition';
import { Icon } from './Icon';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useViewerMotion } from '../hooks/useViewerMotion';

export function ArtworkViewer({ list, index, onChange, onClose }) {
  const ref = useRef(null);
  const { close, onKeyDown } = useViewerMotion(ref, onClose, { duration: 300 });
  const portrait = useMediaQuery('(orientation: portrait)');
  const item = list[index].content;
  const handleKey = event => {
    onKeyDown(event);
    if (event.key === 'ArrowLeft') onChange(Math.max(0, index - 1));
    if (event.key === 'ArrowRight') onChange(Math.min(list.length - 1, index + 1));
  };
  return createPortal(<div ref={ref} className="gallery-fullViewer gallery-visible" role="dialog" aria-modal="true" aria-label={item.title} onKeyDown={handleKey}>
    <ContentTransition state={item.resource.url} appear><div className="gallery-bg" style={{ backgroundImage: `url(${item.thumbnail?.url || item.resource.url})` }} /></ContentTransition><div className="gallery-bgMask" />
    <div className="gallery-_fullViewer"><div className="gallery-layer"><ContentTransition state={item.resource.url} appear><div>
      <div className="gallery-primary"><img className="gallery-img" src={item.resource.url} alt={item.title} /></div>
      <div className="gallery-titleAndDateAndDesc"><div className="gallery-titleAndDate"><h2 className="gallery-title">{item.title}</h2><time className="gallery-date">{new Date(item.displayTime).toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })}</time></div><p className="gallery-desc">{item.desc}</p></div>
    </div></ContentTransition></div>
      {!portrait && <><button type="button" className="gallery-arrowLeft" aria-label="上一张图片" disabled={index === 0} onClick={() => onChange(index - 1)}><Icon name="icon_arrow" reverse /></button><button type="button" className="gallery-arrowRight" aria-label="下一张图片" disabled={index === list.length - 1} onClick={() => onChange(index + 1)}><Icon name="icon_arrow" /></button></>}
    </div>
    <button type="button" data-viewer-close className={portrait ? 'gallery-closeBtnPortrait' : 'gallery-closeBtn'} aria-label="关闭预览" onClick={close}>{portrait && <><span className="gallery-icon"><Icon name="icon_arrow" reverse /></span><span className="gallery-btnText"><span className="gallery-main">返回</span><span className="gallery-sub">GO BACK</span></span></>}</button>
    {portrait && <><div className="gallery-floatingText">GALLERY</div><div className="gallery-coordMark" /></>}
  </div>, document.getElementById('root'));
}
