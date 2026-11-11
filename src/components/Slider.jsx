import { useEffect, useRef, useState } from 'react';

export default function Slider({ slides, label }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const x0 = useRef(null);
  const n = slides.length;
  const go = (k) => setI((k + n) % n);
  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(() => { if (!document.hidden) setI((v) => (v + 1) % n); }, 5000);
    return () => clearInterval(t);
  }, [paused, n]);
  return (
    <div
      className="slider" role="region" aria-roledescription="carousel" aria-label={label}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { x0.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (x0.current === null) return;
        const dx = e.changedTouches[0].clientX - x0.current; x0.current = null;
        if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="track" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s, k) => (<figure className="slide" key={k}>{s.photo}<figcaption>{s.caption}</figcaption></figure>))}
      </div>
      <button className="sn prev" aria-label="Previous slide" onClick={() => go(i - 1)}>&#8592;</button>
      <button className="sn next" aria-label="Next slide" onClick={() => go(i + 1)}>&#8594;</button>
      <div className="dots">{slides.map((_, k) => (<button key={k} className={k === i ? 'on' : ''} aria-label={`Go to slide ${k + 1}`} onClick={() => go(k)} />))}</div>
    </div>
  );
}
