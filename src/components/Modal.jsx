import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useViewerMotion } from '../hooks/useViewerMotion';

export function Modal({ title, onClose, children }) {
  const ref = useRef(null), content = useRef(null);
  const { close, onKeyDown } = useViewerMotion(ref, onClose, { duration: 300, scaleRef: content });
  return createPortal(<div ref={ref} className="media-dialog" role="dialog" aria-modal="true" aria-label={title} onKeyDown={onKeyDown}
    onClick={event => { if (event.target === ref.current) close(); }}>
    <div ref={content} className="topic-modalVideo"><button type="button" data-viewer-close className="dialog-close" aria-label="关闭预览" onClick={close}>关闭预览</button>{children}</div>
  </div>, document.getElementById('root'));
}
