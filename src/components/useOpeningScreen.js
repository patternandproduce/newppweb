import { useEffect } from 'react';

/* The opening screen is painted by index.html; here we just fade it away once the page is ready. */
export default function useOpeningScreen() {
  useEffect(() => {
    const el = document.getElementById('loader');
    if (!el) return undefined;
    const t0 = performance.now();
    const fonts = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve();
    fonts.then(() => setTimeout(() => { el.classList.add('done'); setTimeout(() => el.remove(), 600); }, Math.max(0, 350 - (performance.now() - t0))));
  }, []);
}

