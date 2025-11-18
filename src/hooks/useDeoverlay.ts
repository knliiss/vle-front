import { useEffect } from 'react';

export function useDeoverlay() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const debug = params.get('debugOverlay') === '1';

    const removeKnown = () => {
      document.querySelectorAll('.modal-backdrop, .sidebar-overlay-backdrop, vite-error-overlay, #vite-error-overlay, .vite-error-overlay')
        .forEach(node => {
          const el = node as HTMLElement;
          const hasDialog = el.querySelector('.modal-content');
          if (!hasDialog || el.tagName.toLowerCase().includes('vite-error-overlay') || el.id.includes('vite-error-overlay')) {
            el.parentElement?.removeChild(el);
          }
        });
    };

    removeKnown();

    if (debug) {
      const candidates: { el: HTMLElement; info: any }[] = [];
      document.querySelectorAll('body *').forEach(n => {
        const el = n as HTMLElement;
        if (!el || el.id === 'root') return;
        const style = getComputedStyle(el);
        const isPos = style.position === 'fixed' || style.position === 'sticky' || style.position === 'absolute';
        if (!isPos) return;
        const rect = el.getBoundingClientRect();
        const covers = rect.width >= window.innerWidth * 0.8 && rect.height >= window.innerHeight * 0.8;
        if (!covers) return;
        const z = style.zIndex;
        const bg = style.backgroundColor;
        const pe = style.pointerEvents;
        const opacity = style.opacity;
        candidates.push({ el, info: { tag: el.tagName, id: el.id, className: el.className, zIndex: z, bg, opacity, pointerEvents: pe, w: rect.width, h: rect.height } });
      });
      (window as any).__overlayCandidates = candidates.map(c => c.el);
      (window as any).__overlayCandidatesData = candidates.map(c => c.info);
      console.log('[OverlayDebug] candidates data:', (window as any).__overlayCandidatesData);
    }
  }, []);
}
