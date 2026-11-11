import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import VideoCard from '../components/VideoCard.jsx';
import VideoModal from '../components/VideoModal.jsx';
import usePageTitle from '../components/usePageTitle.js';
import { useLibrary } from '../lib/library.js';

export default function Tutorials() {
  usePageTitle('Tutorials');
  const lib = useLibrary();
  const [min, setMin] = useState(() => typeof window !== 'undefined' && window.innerWidth < 900);
  const [q, setQ] = useState('');
  const [active, setActive] = useState('all');
  const [open, setOpen] = useState(null);
  const lock = useRef(0); /* ignore the scroll-spy while a click-scroll is running */

  const groups = useMemo(() => {
    if (!lib) return [];
    const term = q.trim().toLowerCase();
    const first = lib.phases[0]?.id;
    return lib.phases.map((p) => {
      const vids = lib.videos.filter((v) => v.published !== false && (v.phaseId === p.id || (!lib.phases.some((x) => x.id === v.phaseId) && p.id === first)))
        .filter((v) => !term || (v.title + ' ' + (v.description || '')).toLowerCase().includes(term));
      return { ...p, vids };
    }).filter((g) => !term || g.vids.length);
  }, [lib, q]);
  const total = groups.reduce((n, g) => n + g.vids.length, 0);

  useEffect(() => {
    if (!groups.length || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((es) => {
      if (Date.now() < lock.current) return;
      const vis = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis) setActive(vis.target.dataset.id);
    }, { rootMargin: '-90px 0px -65% 0px' });
    document.querySelectorAll('.tut-group').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [groups]);

  const jump = (id) => {
    setActive(id);
    lock.current = Date.now() + 900;
    if (id === 'all') window.scrollTo({ top: 0, behavior: 'smooth' });
    else document.getElementById('grp-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="page tut">
      <aside className={'tut-side' + (min ? ' min' : '')} aria-label="Tutorial phases">
        <div className="side-top">
          <span className="t">Phases</span>
          <button className="side-toggle" onClick={() => setMin(!min)} aria-label={min ? 'Expand sidebar' : 'Minimise sidebar'} aria-expanded={!min} title={min ? 'Expand' : 'Minimise'}>
            <Icon name="panel" size={20} />
          </button>
        </div>
        <button className={'side-item' + (active === 'all' ? ' on' : '')} style={{ '--c': '#ffffff' }} onClick={() => jump('all')} title="All videos">
          <span className="side-ico"><Icon name="grid" size={20} /></span>
          <span className="side-label">All videos</span>
          <span className="side-count">{total}</span>
        </button>
        {groups.map((g) => (
          <button key={g.id} className={'side-item' + (active === g.id ? ' on' : '')} style={{ '--c': g.color }} onClick={() => jump(g.id)} title={g.name}>
            <span className="side-ico"><Icon name={g.icon} size={20} /></span>
            <span className="side-label">{g.name}</span>
            <span className="side-count">{g.vids.length}</span>
          </button>
        ))}
      </aside>

      <div className="tut-main">
        <div className="tut-head">
          <div>
            <Link className="back" to="/workforce-upskilling"><Icon name="chevL" size={16} /> Workforce Upskilling</Link>
            <h1>Tutorial <span className="soft">Library</span></h1>
            <p className="lead">Step-by-step tutorials, arranged by phase. Pick a phase on the left and learn at your own pace.</p>
          </div>
          <label className="tut-search"><Icon name="search" size={18} /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tutorials" aria-label="Search tutorials" /></label>
        </div>

        {!lib && <div className="vgrid">{[0, 1, 2, 3].map((k) => (<div className="vc sk" key={k}><div className="vthumb" /><div className="vmeta"><h3>&nbsp;</h3><p className="vcat">&nbsp;</p></div></div>))}</div>}
        {lib && !groups.length && <p className="lead">No tutorials match &ldquo;{q}&rdquo;.</p>}
        {groups.map((g) => (
          <section className="tut-group" id={'grp-' + g.id} data-id={g.id} key={g.id}>
            <div className="tut-group-head">
              <span className="gico" style={{ '--c': g.color }}><Icon name={g.icon} size={22} /></span>
              <div><h2>{g.name}</h2>{g.description && <p>{g.description}</p>}</div>
              <span className="gcount">{g.vids.length} {g.vids.length === 1 ? 'video' : 'videos'}</span>
            </div>
            {g.vids.length ? (
              <div className="vgrid">{g.vids.map((v) => (<VideoCard key={v.id} video={v} phase={g} showText onOpen={setOpen} />))}</div>
            ) : (<p className="empty">Videos for this phase are coming soon.</p>)}
          </section>
        ))}
      </div>
      {open && <VideoModal video={open} phase={lib.phases.find((p) => p.id === open.phaseId)} onClose={() => setOpen(null)} />}
    </div>
  );
}
