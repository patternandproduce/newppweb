/* Scroll reveal. Elements matching SEL fade up one after another as they enter the screen.
   New elements (route changes, videos arriving late) are picked up automatically. */
const SEL = [
  'section > .eyebrow', 'section > h1', 'section > h2', 'section > p', 'section > .btn', 'section > .img', 'section > .slider',
  '.grid > *', '.split > .img', '.split > div:not(.img) > *', 'ul.clean li', 'details', 'form', '.mini',
  '.wf-copy > *', '.wf-head > *', '.vgrid > *', '.reg-copy > *', '.ct-copy > *', '.ct-card > *', '.ct-items > *',
  '.form-card', 'section > .reg-band', '.ct-grid > .ct-div', '.tut-head > *', '.tut-group-head', '.tut-group .vgrid > *',
].join(',');

let io = null;
const getIO = () => {
  if (io || typeof IntersectionObserver === 'undefined') return io;
  io = new IntersectionObserver(
    (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  );
  return io;
};

export function prep(root) {
  const obs = getIO();
  const counts = new Map();
  root.querySelectorAll(SEL).forEach((el) => {
    const i = counts.get(el.parentNode) || 0;
    counts.set(el.parentNode, i + 1);
    if (el.classList.contains('rv')) return;
    el.classList.add('rv');
    el.style.setProperty('--d', Math.min(i, 6) * 0.09 + 's');
    if (obs) obs.observe(el); else el.classList.add('in');
  });
}

export function watch(root) {
  let queued = false;
  const run = () => { queued = false; prep(root); };
  const mo = new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(run); } });
  mo.observe(root, { childList: true, subtree: true });
  run();
  return () => mo.disconnect();
}
