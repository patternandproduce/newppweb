import { useEffect, useRef, useState } from 'react';
import { IMG } from '../lib/images.js';

/* A photo that fills its box without stretching. Blurred preview first, then a soft fade-in.
   pos = which part of the photo stays visible when the box is a different shape. */
export default function Photo({ name, pos = '50% 50%', sizes = '100vw', label, eager = false, className = '', style, alt, children }) {
  const m = IMG[name];
  const ref = useRef(null);
  const [ok, setOk] = useState(false);
  const [bad, setBad] = useState(false);
  useEffect(() => { const i = ref.current; if (i && i.complete && i.naturalWidth) setOk(true); }, []);
  const shimmer = 'linear-gradient(110deg,transparent 35%,rgba(128,128,128,.14) 50%,transparent 65%)';
  return (
    <div
      className={'img ' + className}
      data-label={label}
      data-ready={ok ? '' : undefined}
      data-failed={bad ? '' : undefined}
      style={{ backgroundImage: `${shimmer}, url(${m.lqip})`, backgroundSize: '250% 100%, cover', ...style }}
    >
      {!bad && (
        <img
          ref={ref}
          src={m.src}
          srcSet={m.srcSet}
          sizes={sizes}
          alt={alt ?? m.alt}
          width={m.w}
          height={m.h}
          loading={eager ? 'eager' : 'lazy'}
          fetchpriority={eager ? 'high' : undefined}
          decoding="async"
          style={{ objectPosition: pos }}
          data-loaded={ok ? '' : undefined}
          onLoad={() => setOk(true)}
          onError={() => setBad(true)}
        />
      )}
      {children}
    </div>
  );
}
