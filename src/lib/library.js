import { useEffect, useState } from 'react';
import { API_BASE } from '../config.js';
import { rpc, getSession } from './adminApi.js';

/* The tutorial library (phases + videos).
   Source order: dashboard API (when connected) -> preview copy saved by the admin in this browser -> public/data/videos.json */
const LOCAL_KEY = 'pp_library_preview';
let cache = null;

const byOrder = (a, b) => (a.order || 0) - (b.order || 0);
export function normalise(raw) {
  const phases = (raw?.phases || []).slice().sort(byOrder);
  const videos = (raw?.videos || []).slice().sort(byOrder);
  return { phases, videos };
}
const readLocal = () => {
  try { const s = localStorage.getItem(LOCAL_KEY); return s ? normalise(JSON.parse(s)) : null; } catch { return null; }
};

export function loadLibrary(force = false) {
  if (cache && !force) return cache;
  cache = (async () => {
    if (API_BASE) {
      const d = await rpc('library.get', {}, { auth: Boolean(getSession()) });
      if (d && d.phases) return normalise(d);
    }
    const local = readLocal(); if (local) return local;
    const r = await fetch('/data/videos.json');
    return normalise(await r.json());
  })();
  return cache;
}

export function useLibrary() {
  const [lib, setLib] = useState(null);
  useEffect(() => {
    let alive = true;
    loadLibrary().then((l) => alive && setLib(l)).catch(() => alive && setLib({ phases: [], videos: [] }));
    return () => { alive = false; };
  }, []);
  return lib;
}

export async function saveLibrary(lib) {
  const clean = normalise(lib);
  if (API_BASE) {
    await rpc('library.save', clean, { auth: true });
  } else {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(clean));
  }
  cache = Promise.resolve(clean);
  return clean;
}
export function clearPreview() { localStorage.removeItem(LOCAL_KEY); cache = null; }
export const hasPreview = () => !!readLocal();

/* Accepts a full YouTube link or a bare 11-character ID and returns the ID ('' if it does not look valid). */
export function youtubeId(input) {
  const s = (input || '').trim();
  if (!s) return '';
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/);
  return m ? m[1] : '';
}
/* A video's thumbnail: the custom one if the admin added it, otherwise YouTube's own picture. */
export const thumbOf = (v) => v.thumbnail || (v.youtubeId ? thumbUrl(v.youtubeId) : '');
export const thumbUrl = (id) => `https://i.ytimg.com/vi/${encodeURIComponent(id)}/mqdefault.jpg`;

/* Page text that the dashboard can edit later (falls back to the built-in wording). */
const DEFAULT_CONTENT = {
  manufacturing: {
    moq: '50 pieces per style for small batches, 500+ pieces per style for bulk orders.',
    leadTime: 'Samples in 7 to 10 working days. Production in 3 to 5 weeks after sample approval.',
    categories: 'Shirts and tops, dresses, trousers and skirts, uniforms and workwear, jackets, kidswear.',
  },
};
export function useContent() {
  const [c, setC] = useState(DEFAULT_CONTENT);
  useEffect(() => {
    fetch('/data/content.json').then((r) => (r.ok ? r.json() : null)).then((d) => d && setC({ ...DEFAULT_CONTENT, ...d })).catch(() => {});
  }, []);
  return c;
}
