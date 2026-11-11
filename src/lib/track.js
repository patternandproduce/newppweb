import { rpc } from './adminApi.js';

/* Counts visits and page views (no names, no cookies). One random visit ID lives in the browser tab until it is closed.
   Skipped for the admin pages, while developing, and when the visitor sends Do Not Track. */
let last = '';
export function trackVisit(path) {
  if (import.meta.env.DEV) return;
  if (path.startsWith('/admin') || navigator.doNotTrack === '1' || path === last) return;
  last = path;
  try {
    let sid = sessionStorage.getItem('pp_visit');
    const first = !sid;
    if (first) { sid = (crypto.randomUUID && crypto.randomUUID()) || String(Math.random()).slice(2); sessionStorage.setItem('pp_visit', sid); }
    let ref = '';
    if (first) { try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch { /* ignore */ } }
    const w = window.innerWidth;
    rpc('visit', { sid, path, device: w < 700 ? 'Mobile' : w < 1100 ? 'Tablet' : 'Desktop', ref }).catch(() => {});
  } catch { /* never block the page */ }
}
