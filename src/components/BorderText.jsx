import { useEffect, useState } from 'react';

export function BorderText({ children }) {
  const [image, setImage] = useState('');
  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
      ctx.font = '152px Oswald-DemiBold';
      canvas.width = ctx.measureText(children).width + 6; canvas.height = 158;
      ctx.font = '152px Oswald-DemiBold'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round'; ctx.miterLimit = 4; ctx.lineWidth = 2; ctx.strokeStyle = '#b4b4b4';
      ctx.strokeText(children, 1, canvas.height / 2);
      ctx.globalCompositeOperation = 'destination-out'; ctx.fillText(children, 1, canvas.height / 2);
      setImage(canvas.toDataURL());
    });
    return () => { cancelled = true; };
  }, [children]);
  return image ? <img className="operator-img" src={image} alt="" /> : null;
}
