import { useCallback, useEffect, useRef, useState } from 'react';
import { sections } from '../data/sections';

const readIndex = () => Math.max(0, sections.findIndex(section => section.id === location.hash.slice(1)));

export function useSectionNavigation(locked) {
  const [index, setIndex] = useState(readIndex);
  const lastTransition = useRef(0);
  const touch = useRef(null);
  const navigate = useCallback((next) => {
    const bounded = Math.max(0, Math.min(sections.length - 1, next));
    location.hash = sections[bounded].id;
    setIndex(bounded);
  }, []);
  useEffect(() => {
    const sync = () => setIndex(readIndex());
    window.addEventListener('hashchange', sync);
    if (!location.hash) history.replaceState(null, '', '#index');
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => {
    const blocked = target => locked || !!document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]') || target.closest('[data-scrollable], input, select, textarea');
    const step = direction => {
      if (performance.now() - lastTransition.current < (matchMedia('(orientation: portrait)').matches ? 600 : 1000)) return;
      lastTransition.current = performance.now();
      navigate(index + direction);
    };
    const wheel = event => {
      if (blocked(event.target) || Math.abs(event.deltaY) < 12) return;
      event.preventDefault();
      step(Math.sign(event.deltaY));
    };
    const touchStart = event => { touch.current = blocked(event.target) ? null : event.touches[0]; };
    const touchEnd = event => {
      if (!touch.current) return;
      const point = event.changedTouches[0];
      const dx = point.clientX - touch.current.clientX;
      const dy = point.clientY - touch.current.clientY;
      if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx)) step(dy < 0 ? 1 : -1);
      touch.current = null;
    };
    const key = event => {
      if (blocked(event.target) || event.target.closest('button, a')) return;
      if (event.key === 'PageDown' || event.key === 'PageUp') {
        event.preventDefault(); step(event.key === 'PageDown' ? 1 : -1);
      }
    };
    window.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('touchstart', touchStart, { passive: true });
    window.addEventListener('touchend', touchEnd, { passive: true });
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('wheel', wheel);
      window.removeEventListener('touchstart', touchStart);
      window.removeEventListener('touchend', touchEnd);
      window.removeEventListener('keydown', key);
    };
  }, [index, locked, navigate]);
  return { index, navigate };
}
