import { useEffect } from 'react';

const DevOverlayGuard = () => {
  useEffect(() => {
    if (!(import.meta as any).env?.DEV) return;

    const removeOverlays = () => {
      const selectors = ['vite-error-overlay', '#vite-error-overlay', '.vite-error-overlay'];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(node => node.parentElement?.removeChild(node));
      });
    };

    removeOverlays();

    const obs = new MutationObserver(() => removeOverlays());
    obs.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('error', removeOverlays, true);
    window.addEventListener('unhandledrejection', removeOverlays, true);

    return () => {
      obs.disconnect();
      window.removeEventListener('error', removeOverlays, true);
      window.removeEventListener('unhandledrejection', removeOverlays, true);
    };
  }, []);

  return null;
};

export default DevOverlayGuard;

