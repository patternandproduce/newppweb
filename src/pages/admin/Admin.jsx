import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import '../../styles/admin.css';
import Icon, { PHASE_ICONS } from '../../components/Icon.jsx';
import { API_BASE } from '../../config.js';
import { rpc, getSession, signIn, signOut } from '../../lib/adminApi.js';
import { uploadToCloudinary } from '../../lib/cloudinary.js';
import { loadLibrary, saveLibrary, clearPreview, hasPreview, youtubeId, thumbUrl, thumbOf, normalise } from '../../lib/library.js';
import { KINDS } from '../../lib/leads.js';
import { LeadsList, LeadDetail, Compose } from './Leads.jsx';
import Analytics from './Analytics.jsx';
import Staff from './Staff.jsx';

/* ---------- Sign in (username + password) ---------- */
function Login({ onDone }) {
  const [a, setA] = useState(''); const [b, setB] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    setBusy(true);
    try { await signIn(a.trim(), b); onDone(); }
    catch (x) { setErr(x.message || 'Sign in failed. Check your details and try again.'); }
    setBusy(false);
  };
  return (
    <div className="ad-login">
      <form className="ad-card" onSubmit={submit}>
        <div className="ad-logo">Pattern &amp; Produce</div>
        <h1>Admin sign in</h1>
        {!API_BASE && <p className="ad-note">The admin backend is not configured yet. Add the Supabase public environment variables before signing in.</p>}
        <label>Email address<input type="email" value={a} onChange={(e) => setA(e.target.value)} required autoFocus autoComplete="username" autoCapitalize="none" /></label>
        <label>Password<input type="password" value={b} onChange={(e) => setB(e.target.value)} required autoComplete="current-password" /></label>
        {err && <p className="ad-err">{err}</p>}
        <button className="ad-btn primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <Link to="/" className="ad-link">&larr; Back to the website</Link>
      </form>
    </div>
  );
}

/* ---------- Videos ---------- */
const blank = (phases) => ({ id: '', provider: 'youtube', youtubeId: '', cloudinaryPublicId: '', videoUrl: '', thumbnail: '', title: '', description: '', phaseId: phases[0]?.id || '', duration: '', published: true, featured: false });

function VideoForm({ initial, phases, onSave, onClose }) {
  const [v, setV] = useState({ ...initial, provider: initial.provider || 'youtube' });
  const [link, setLink] = useState(initial.youtubeId || '');
  const [up, setUp] = useState(false);
  const [thumbErr, setThumbErr] = useState('');
  const [progress, setProgress] = useState(0);
  const id = youtubeId(link);
  const bad = v.provider === 'youtube' && link.trim() && !id;
  const set = (k) => (e) => setV({ ...v, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const submit = (e) => { e.preventDefault(); if (bad) return; if (v.provider === 'youtube' && !id) { setThumbErr('Add a valid YouTube video link or ID.'); return; } if (v.provider === 'cloudinary' && !v.videoUrl) { setThumbErr('Upload a video to Cloudinary first.'); return; } onSave({ ...v, youtubeId: v.provider === 'youtube' ? id : '', cloudinaryPublicId: v.provider === 'cloudinary' ? v.cloudinaryPublicId : '', videoUrl: v.provider === 'cloudinary' ? v.videoUrl : '' }); };
  const shown = v.thumbnail || (v.provider === 'youtube' && id ? thumbUrl(id) : '');
  const pick = async (e, type) => {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
    setThumbErr(''); setUp(true); setProgress(0);
    try {
      if (type === 'video' && !file.type.startsWith('video/')) throw new Error('Choose a video file.');
      if (type === 'image' && !file.type.startsWith('image/')) throw new Error('Choose an image file.');
      if (file.size > (type === 'video' ? 100 : 10) * 1024 * 1024) throw new Error(type === 'video' ? 'Video must be 100 MB or smaller.' : 'Image must be 10 MB or smaller.');
      const result = await uploadToCloudinary(file, type, setProgress);
      if (type === 'video') {
        const poster = result.url.replace('/video/upload/','/video/upload/so_0/').replace(/\.[^/.?]+(?=\?|$)/,'.jpg');
        setV((x) => ({ ...x, provider: 'cloudinary', videoUrl: result.url, cloudinaryPublicId: result.publicId, duration: result.duration || x.duration, thumbnail: x.thumbnail || poster }));
      } else setV((x) => ({ ...x, thumbnail: result.url }));
    } catch (x) { setThumbErr(x.message || 'Upload failed.'); }
    setUp(false);
  };
  return (
    <div className="ad-modal" onClick={onClose}>
      <form className="ad-sheet" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="ad-sheet-head"><h2>{initial.id ? 'Edit video' : 'Add video'}</h2><button type="button" className="ad-x" onClick={onClose} aria-label="Close"><Icon name="close" size={20} /></button></div>
        <label>Video source<select value={v.provider || 'youtube'} onChange={(e) => { const provider=e.target.value; setV(x => ({ ...x, provider, youtubeId:'', cloudinaryPublicId:'', videoUrl:'' })); setLink(''); }}><option value="youtube">YouTube link</option><option value="cloudinary">Upload to Cloudinary</option></select></label>
        {v.provider === 'youtube' ? <>
          <label>YouTube ID or link<input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://youtu.be/..." /></label>
          {bad && <p className="ad-err">That does not look like a YouTube ID or link.</p>}
        </> : <>
          <label className="ad-btn ad-upload"><Icon name="upload" size={18} />{up ? `Uploading… ${progress}%` : (v.videoUrl ? 'Replace Cloudinary video' : 'Upload video to Cloudinary')}<input type="file" accept="video/mp4,video/webm,video/quicktime" hidden disabled={up} onChange={(e) => pick(e,'video')} /></label>
          {v.videoUrl && <p className="ad-note">Video uploaded successfully. Cloudinary public ID: <code>{v.cloudinaryPublicId}</code></p>}
          <p className="ad-note">MP4, WebM or MOV · maximum 100 MB. Uploads are signed by the backend.</p>
        </>}
        <div className="ad-thumb">{shown ? <img src={shown} alt="Video thumbnail" /> : <span>Thumbnail preview appears here</span>}</div>
        <div className="ad-thumbtools">
          <label className="ad-btn ad-upload"><Icon name="upload" size={18} />{up ? 'Uploading…' : 'Upload custom thumbnail'}<input type="file" accept="image/*" hidden disabled={up} onChange={(e) => pick(e,'image')} /></label>
          {v.thumbnail && <button type="button" className="ad-btn" onClick={() => setV({ ...v, thumbnail: '' })}>Use provider thumbnail</button>}
        </div>
        <label>Or paste an image link (optional)<input value={v.thumbnail && !v.thumbnail.startsWith('data:') ? v.thumbnail : ''} onChange={set('thumbnail')} placeholder="https://…" /></label>
        {thumbErr && <p className="ad-err">{thumbErr}</p>}
        <label>Title<input value={v.title} onChange={set('title')} required /></label>
        <label>Description<textarea rows="4" value={v.description} onChange={set('description')} placeholder="Type what this tutorial covers" /></label>
        <div className="ad-grid2"><label>Phase<select value={v.phaseId} onChange={set('phaseId')}>{phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Duration (optional)<input value={v.duration} onChange={set('duration')} placeholder="e.g. 15:30" /></label></div>
        <div className="ad-checks"><label className="ad-check"><input type="checkbox" checked={v.published} onChange={set('published')} /> Published (visible on the website)</label><label className="ad-check"><input type="checkbox" checked={v.featured} onChange={set('featured')} /> Show on the Workforce Upskilling page</label></div>
        <div className="ad-actions"><button type="button" className="ad-btn" onClick={onClose}>Cancel</button><button className="ad-btn primary" disabled={up}>Save video</button></div>
      </form>
    </div>
  );
}

function VideosTab({ lib, commit }) {
  const [q, setQ] = useState(''); const [ph, setPh] = useState('all'); const [edit, setEdit] = useState(null);
  const list = lib.videos.filter((v) => (ph === 'all' || v.phaseId === ph) && (!q || v.title.toLowerCase().includes(q.toLowerCase())));
  const reindex = (arr) => arr.map((v, i) => ({ ...v, order: i + 1 }));
  const save = (v) => {
    const next = v.id ? lib.videos.map((x) => (x.id === v.id ? v : x)) : [...lib.videos, { ...v, id: 'v' + Date.now() }];
    commit({ ...lib, videos: reindex(next) }, 'Video saved'); setEdit(null);
  };
  const move = (id, d) => {
    const a = lib.videos.slice(); const i = a.findIndex((x) => x.id === id); const j = i + d;
    if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; commit({ ...lib, videos: reindex(a) });
  };
  const toggle = (v) => commit({ ...lib, videos: lib.videos.map((x) => (x.id === v.id ? { ...x, published: !x.published } : x)) });
  const remove = (v) => { if (confirm(`Delete "${v.title}"?`)) commit({ ...lib, videos: reindex(lib.videos.filter((x) => x.id !== v.id)) }, 'Video deleted'); };
  return (
    <>
      <div className="ad-bar">
        <label className="ad-search"><Icon name="search" size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search videos" /></label>
        <select value={ph} onChange={(e) => setPh(e.target.value)} aria-label="Filter by phase"><option value="all">All phases</option>{lib.phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <button className="ad-btn primary" onClick={() => setEdit(blank(lib.phases))}><Icon name="plus" size={18} /> Add video</button>
      </div>
      <div className="ad-list">
        {!list.length && <p className="ad-empty">No videos yet. Click &ldquo;Add video&rdquo; to add your first YouTube tutorial.</p>}
        {list.map((v) => {
          const p = lib.phases.find((x) => x.id === v.phaseId);
          return (
            <div className={'ad-row' + (v.published === false ? ' off' : '')} key={v.id}>
              <div className="ad-th">{thumbOf(v) ? <img src={thumbOf(v)} alt="" loading="lazy" /> : <span>No ID yet</span>}</div>
              <div className="ad-info">
                <strong>{v.title}</strong>
                <span>{p ? <><i style={{ background: p.color }} />{p.name}</> : 'No phase'}{v.duration ? ` · ${v.duration}` : ''}{v.featured ? ' · On Workforce page' : ''}</span>
                {v.description && <em>{v.description}</em>}
              </div>
              <div className="ad-ops">
                <button onClick={() => toggle(v)} className={'ad-chip' + (v.published === false ? '' : ' on')} title="Show or hide on the website">{v.published === false ? 'Hidden' : 'Published'}</button>
                <button onClick={() => move(v.id, -1)} aria-label="Move up"><Icon name="up" size={18} /></button>
                <button onClick={() => move(v.id, 1)} aria-label="Move down"><Icon name="down" size={18} /></button>
                <button onClick={() => setEdit(v)} aria-label="Edit"><Icon name="edit" size={18} /></button>
                <button onClick={() => remove(v)} aria-label="Delete"><Icon name="trash" size={18} /></button>
              </div>
            </div>
          );
        })}
      </div>
      {edit && <VideoForm initial={edit} phases={lib.phases} onSave={save} onClose={() => setEdit(null)} />}
    </>
  );
}

/* ---------- Phases ---------- */
function PhasesTab({ lib, commit }) {
  const [d, setD] = useState(lib.phases);
  const dirty = JSON.stringify(d) !== JSON.stringify(lib.phases);
  const upd = (id, k, val) => setD(d.map((p) => (p.id === id ? { ...p, [k]: val } : p)));
  const add = () => setD([...d, { id: 'phase-' + Date.now(), name: `Phase ${d.length + 1}`, description: '', icon: 'book', color: '#d4a24c', order: d.length + 1 }]);
  const move = (i, dir) => { const a = d.slice(); const j = i + dir; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; setD(a); };
  const del = (p) => {
    const n = lib.videos.filter((v) => v.phaseId === p.id).length;
    if (d.length < 2) return alert('Keep at least one phase.');
    if (confirm(n ? `"${p.name}" has ${n} video(s). They will move to the first phase. Delete it?` : `Delete "${p.name}"?`)) setD(d.filter((x) => x.id !== p.id));
  };
  const save = () => {
    const phases = d.map((p, i) => ({ ...p, order: i + 1 }));
    const ids = new Set(phases.map((p) => p.id));
    const videos = lib.videos.map((v) => (ids.has(v.phaseId) ? v : { ...v, phaseId: phases[0].id }));
    commit({ phases, videos }, 'Phases saved');
  };
  return (
    <>
      <p className="ad-note">Phases are the groups shown in the tutorial library sidebar. Their names are yours to decide: rename them any time.</p>
      <div className="ad-list">
        {d.map((p, i) => (
          <div className="ad-phase" key={p.id}>
            <div className="ad-phase-top">
              <span className="ad-ico" style={{ '--c': p.color }}><Icon name={p.icon} size={22} /></span>
              <input className="ad-name" value={p.name} onChange={(e) => upd(p.id, 'name', e.target.value)} aria-label="Phase name" />
              <div className="ad-ops">
                <button onClick={() => move(i, -1)} aria-label="Move up"><Icon name="up" size={18} /></button>
                <button onClick={() => move(i, 1)} aria-label="Move down"><Icon name="down" size={18} /></button>
                <button onClick={() => del(p)} aria-label="Delete phase"><Icon name="trash" size={18} /></button>
              </div>
            </div>
            <input value={p.description} onChange={(e) => upd(p.id, 'description', e.target.value)} placeholder="Short description (optional)" aria-label="Phase description" />
            <div className="ad-iconrow">
              {PHASE_ICONS.map((n) => (<button key={n} type="button" className={p.icon === n ? 'on' : ''} style={{ '--c': p.color }} onClick={() => upd(p.id, 'icon', n)} aria-label={n}><Icon name={n} size={20} /></button>))}
              <label className="ad-color">Colour <input type="color" value={p.color} onChange={(e) => upd(p.id, 'color', e.target.value)} /></label>
            </div>
          </div>
        ))}
      </div>
      <div className="ad-actions left"><button className="ad-btn" onClick={add}><Icon name="plus" size={18} /> Add phase</button><button className="ad-btn primary" onClick={save} disabled={!dirty}>Save phases</button></div>
    </>
  );
}

/* ---------- Publish and backup ---------- */
function PublishTab({ lib, commit, reload }) {
  const download = () => {
    const blob = new Blob([JSON.stringify(normalise(lib), null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'videos.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const upload = (e) => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then((t) => { try { const d = JSON.parse(t); if (!Array.isArray(d.phases) || !Array.isArray(d.videos)) throw new Error(); commit(normalise(d), 'Imported'); } catch { alert('That file is not a valid videos.json.'); } });
    e.target.value = '';
  };
  return (
    <div className="ad-publish">
      {API_BASE ? (
        <div className="ad-box"><h3>Connected to the dashboard</h3><p>Every change is saved to the server straight away and appears on the website. Nothing else to do.</p></div>
      ) : (<>
        <div className="ad-box warn"><h3>Preview mode</h3><p>Changes are saved in this browser only, so visitors cannot see them yet. To make them live, download <code>videos.json</code>, replace the file at <code>public/data/videos.json</code> in your project, then push to GitHub. Vercel updates the website within a minute or two.</p></div>
        <div className="ad-actions left">
          <button className="ad-btn primary" onClick={download}><Icon name="download" size={18} /> Download videos.json</button>
          <label className="ad-btn"><Icon name="upload" size={18} /> Import videos.json<input type="file" accept="application/json" onChange={upload} hidden /></label>
          {hasPreview() && <button className="ad-btn" onClick={() => { if (confirm('Discard your changes and go back to the published videos?')) { clearPreview(); reload(); } }}>Discard preview changes</button>}
        </div>
      </>)}
    </div>
  );
}

/* ---------- Shell ---------- */
const NAV = [
  { to: '/admin', label: 'Analytics', icon: 'grid', end: true },
  { to: '/admin/leads/registrations', label: 'Registered users', icon: 'book' },
  { to: '/admin/leads/consultations', label: 'Consultation requests', icon: 'chat' },
  { to: '/admin/leads/quotes', label: 'Quote requests', icon: 'ruler' },
  { to: '/admin/leads/contacts', label: 'Contact messages', icon: 'mail' },
  { to: '/admin/videos', label: 'Tutorial videos', icon: 'play' },
  { to: '/admin/phases', label: 'Phases', icon: 'layers' },
  { to: '/admin/publish', label: 'Publish & backup', icon: 'upload' },
  { to: '/admin/staff', label: 'Staff', icon: 'lock', admin: true },
];
function titleFor(path) {
  const p = path.replace(/^\/admin\/?/, '').split('/');
  if (!p[0]) return 'Visitors & analytics';
  if (p[0] === 'leads') return p[2] ? 'Details' : KINDS[p[1]]?.label || 'List';
  return { message: 'Write a message', videos: 'Tutorial videos', phases: 'Phases', publish: 'Publish & backup', staff: 'Staff' }[p[0]] || 'Admin';
}

function Dashboard({ session, onLogout }) {
  const [lib, setLib] = useState(null); const [libError, setLibError] = useState(''); const [toast, setToast] = useState('');
  const { pathname } = useLocation();
  const reload = () => loadLibrary(true).then((value) => { setLibError(''); setLib(value); }).catch((error) => setLibError(error.message || 'Could not load the video library.')); 
  useEffect(() => { reload(); }, []);
  useEffect(() => { document.title = 'Admin | Pattern & Produce'; window.scrollTo(0, 0); }, [pathname]);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2200); };
  const commit = (next, msg) => saveLibrary(next).then((l) => { setLib(l); if (msg) flash(msg); }).catch((e) => flash(e.message || 'Could not save'));
  const wait = <p className="ad-note">{libError || 'Loading video library…'}</p>;
  return (
    <div className="ad">
      <aside className="ad-side">
        <div className="ad-logo">Pattern &amp; Produce<small>Admin</small></div>
        <div className="ad-who">Signed in as {session.name || session.username}</div>
        {NAV.filter((n) => !n.admin || session.role === 'admin').map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'on' : '')}><Icon name={n.icon} size={20} />{n.label}</NavLink>
        ))}
        <div className="ad-spacer" />
        <Link className="ad-sidelink" to="/" target="_blank">View website</Link>
        <button className="ad-sidelink" onClick={async () => { await signOut(); onLogout(); }}>Sign out</button>
      </aside>
      <section className="ad-main">
        <div className="ad-top"><h1>{titleFor(pathname)}</h1>{!API_BASE && <span className="ad-mode">Backend not configured</span>}</div>
        <Routes>
          <Route index element={<Analytics />} />
          <Route path="leads/:kind" element={<LeadsList />} />
          <Route path="leads/:kind/:id" element={<LeadDetail />} />
          <Route path="message" element={<Compose />} />
          <Route path="videos" element={lib ? <VideosTab lib={lib} commit={commit} /> : wait} />
          <Route path="phases" element={lib ? <PhasesTab key={JSON.stringify(lib.phases)} lib={lib} commit={commit} /> : wait} />
          <Route path="publish" element={lib ? <PublishTab lib={lib} commit={commit} reload={reload} /> : wait} />
          <Route path="staff" element={<Staff />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </section>
      {toast && <div className="ad-toast">{toast}</div>}
    </div>
  );
}

export default function Admin() {
  const [session, setS] = useState(() => getSession());
  useEffect(() => { if (!session) return; rpc('me', {}, { auth: true }).catch(async () => { await signOut(); setS(null); }); }, []);
  if (!API_BASE) {
    return (<div className="ad-login"><div className="ad-card"><div className="ad-logo">Pattern &amp; Produce</div><h1>Admin is not enabled</h1><p className="ad-note">The dashboard has not been connected yet.</p><Link to="/" className="ad-link">&larr; Back to the website</Link></div></div>);
  }
  return session ? <Dashboard session={session} onLogout={() => setS(null)} /> : <Login onDone={() => setS(getSession())} />;
}
