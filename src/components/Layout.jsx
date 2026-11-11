import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { CONTACT } from '../config.js';
import { watch } from '../lib/reveal.js';

const NAV = [
  ['/fashiontech', 'FashionTech'],
  ['/garment-manufacturing', 'Garment Manufacturing'],
  ['/workforce-upskilling', 'Workforce Upskilling'],
];

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 20);
    const k = (e) => e.key === 'Escape' && setOpen(false);
    const r = () => window.innerWidth > 860 && setOpen(false);
    s();
    window.addEventListener('scroll', s, { passive: true });
    document.addEventListener('keydown', k);
    window.addEventListener('resize', r);
    return () => { window.removeEventListener('scroll', s); document.removeEventListener('keydown', k); window.removeEventListener('resize', r); };
  }, []);
  return (
    <header className={(open ? 'open ' : '') + (scrolled ? 'scrolled' : '')}>
      <Link className="logo" to="/" title="Home">Pattern &amp; Produce</Link>
      <nav id="nav">
        {NAV.map(([to, label]) => (<NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'on' : '')}>{label}</NavLink>))}
      </nav>
      <button className="menu" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="nav" onClick={() => setOpen(!open)}>
        <span /><span /><span />
      </button>
    </header>
  );
}

function Footer() {
  return (
    <footer className="dk" style={{ alignItems: 'flex-start', paddingTop: 60, paddingBottom: 60 }}>
      <div>
        <div className="logo" style={{ color: 'var(--ink)' }}>Pattern &amp; Produce</div>
        <p style={{ maxWidth: '30ch', marginTop: 8 }}>Fashion technology, manufacturing and skills.</p>
        <p style={{ marginTop: 24 }}>&copy; Pattern and Produce Limited</p>
      </div>
      <div>
        <div className="eyebrow">Explore</div>
        <Link to="/">Home</Link>
        <Link to="/fashiontech">FashionTech</Link>
        <Link to="/garment-manufacturing">Garment Manufacturing</Link>
        <Link to="/workforce-upskilling">Workforce Upskilling</Link>
      </div>
      <div>
        <div className="eyebrow">Get in touch</div>
        <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
        <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
        <Link to="/">LinkedIn</Link>
        <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      </div>
    </footer>
  );
}

function ProgressBar() {
  const ref = useRef(null);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (ref.current) ref.current.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
      });
    };
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    on();
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, []);
  return <div className="bar" ref={ref} />;
}

export default function Layout() {
  const { pathname } = useLocation();
  const main = useRef(null);
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => watch(main.current), []);
  return (
    <>
      <ProgressBar />
      <Header />
      <main ref={main}>
        <Suspense fallback={<div className="route-line" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <a className="wa" href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
    </>
  );
}
