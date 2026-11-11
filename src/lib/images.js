import LQIP from './lqip.js';

/* Photos are imported through Vite, so every file gets a fingerprinted name and can be cached for a year. */
const files = import.meta.glob('../assets/img/*.webp', { eager: true, query: '?url', import: 'default' });
const url = (n, w) => files[`../assets/img/${n}-${w}.webp`];
const def = {
  techpack: { ws: [800, 1600], w: 1600, h: 900, alt: 'Tech pack overview of a linen camp-collar shirt, front and back' },
  studio: { ws: [600, 890], w: 890, h: 584, alt: 'Fashion atelier with a dress form, fabrics and sewing tools' },
  portrait: { ws: [600, 1000], w: 1000, h: 1500, alt: 'Black and white fashion photograph of a dress with a sheer back panel' },
};
export const IMG = Object.fromEntries(
  Object.entries(def).map(([n, d]) => [
    n,
    { src: url(n, d.ws[d.ws.length - 1]), srcSet: d.ws.map((w) => `${url(n, w)} ${w}w`).join(', '), w: d.w, h: d.h, alt: d.alt, lqip: LQIP[n] },
  ])
);
