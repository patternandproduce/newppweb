import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { SHEET_URL } from '../../config.js';
import { KINDS, LABELS, fullName, initials, when, fieldsOf, listLeads, markLeads, sendEmail, exportLeads } from '../../lib/leads.js';

function useLeads(kind) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { setRows(null); setErr(''); listLeads(kind).then(setRows).catch((e) => setErr(e.message)); }, [kind]);
  return { rows, setRows, err };
}

/* Drop-down button */
function Menu({ label, icon, items, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const f = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', f);
    return () => document.removeEventListener('mousedown', f);
  }, [open]);
  return (
    <div className="ad-menu" ref={ref}>
      <button className="ad-btn" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu" disabled={disabled}><Icon name={icon} size={18} />{label}<Icon name="down" size={16} /></button>
      {open && (
        <div className="ad-drop" role="menu">
          {items.map((it, i) => it.href
            ? <a key={i} role="menuitem" href={it.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>{it.label}</a>
            : <button key={i} role="menuitem" disabled={it.disabled} onClick={() => { setOpen(false); it.run(); }}>{it.label}</button>)}
        </div>
      )}
    </div>
  );
}

const preview = (kind, r) => {
  const d = r.data;
  if (kind === 'registrations') return [[d.age && `${d.age} yrs`, d.sex, d.lga].filter(Boolean).join(' · '), d.phone || d.email];
  return [d.interest, [d.quantity, d.message].filter(Boolean).join(' · ') || d.email];
};
const SampleNote = () => null;

/* ---------- Cards page ---------- */
export function LeadsList() {
  const { kind } = useParams();
  const meta = KINDS[kind];
  const nav = useNavigate();
  const { rows, setRows, err } = useLeads(kind);
  const [q, setQ] = useState('');
  const [f, setF] = useState('all');
  const [sel, setSel] = useState(new Set());
  const [msg, setMsg] = useState('');
  useEffect(() => { setSel(new Set()); setQ(''); setF('all'); }, [kind]);
  if (!meta) return <p className="ad-note">That list does not exist.</p>;
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 2600); };
  const all = rows || [];
  const shown = all.filter((r) => (f === 'all' || (f === 'new' && r.status === 'new') || (f === 'contacted' && r.status === 'contacted') || (f === 'fresh' && !r.exported) || (f === 'done' && r.exported))
    && (!q || JSON.stringify(r.data).toLowerCase().includes(q.toLowerCase())));
  const toggle = (id) => { const s = new Set(sel); s.has(id) ? s.delete(id) : s.add(id); setSel(s); };
  const allShownSelected = shown.length > 0 && shown.every((r) => sel.has(r.id));

  const compose = (ids) => nav('/admin/message', { state: { kind, ids } });
  const doExport = async (which) => {
    const subset = all.filter((r) => (which === 'fresh' ? !r.exported : which === 'done' ? r.exported : true));
    if (!subset.length) return flash(which === 'fresh' ? 'Nothing new to export.' : 'Nothing to export.');
    exportLeads(kind, subset);
    const toMark = subset.filter((r) => !r.exported).map((r) => r.id);
    if (toMark.length) { await markLeads(kind, toMark, { exported: true }); setRows(await listLeads(kind)); }
    flash(`Exported ${subset.length}. Check your Downloads folder.`);
  };
  const nFresh = all.filter((r) => !r.exported).length;
  return (
    <>
      <SampleNote />
      <p className="ad-note">{meta.blurb} Click a card to see the full details.</p>
      <div className="ad-bar">
        <div className="ad-search"><Icon name="search" size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email, phone…" aria-label="Search" /></div>
        <select value={f} onChange={(e) => setF(e.target.value)} aria-label="Filter">
          <option value="all">Everyone</option><option value="new">New</option><option value="contacted">Contacted</option><option value="fresh">Not exported yet</option><option value="done">Already exported</option>
        </select>
        <Menu label="Message" icon="mail" disabled={!all.length} items={[
          { label: `All users (${all.length})`, run: () => compose(all.map((r) => r.id)) },
          { label: `Selected users (${sel.size})`, disabled: !sel.size, run: () => compose([...sel]) },
        ]} />
        <Menu label="Export to Excel" icon="download" disabled={!all.length} items={[
          { label: `New only, not exported yet (${nFresh})`, run: () => doExport('fresh') },
          { label: `Already exported (${all.length - nFresh})`, run: () => doExport('done') },
          { label: `Everything (${all.length})`, run: () => doExport('all') },
          ...(SHEET_URL ? [{ label: 'Open my Google Sheet', href: SHEET_URL }] : []),
        ]} />
      </div>
      {!!shown.length && (
        <label className="ad-check ad-selall"><input type="checkbox" checked={allShownSelected} onChange={() => setSel(allShownSelected ? new Set() : new Set(shown.map((r) => r.id)))} /> Select all shown ({shown.length}){sel.size ? ` · ${sel.size} selected` : ''}</label>
      )}
      {err && <p className="ad-err">{err}</p>}
      {!rows && !err && <p className="ad-note">Loading…</p>}
      {rows && !shown.length && <p className="ad-empty">Nothing here yet.</p>}
      <div className="ad-leads">
        {shown.map((r) => {
          const [l1, l2] = preview(kind, r);
          return (
            <article className={'ad-lead' + (sel.has(r.id) ? ' sel' : '')} key={r.id}>
              <label className="ad-pick" title="Select"><input type="checkbox" checked={sel.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Select ${fullName(r)}`} /></label>
              <Link to={`/admin/leads/${kind}/${encodeURIComponent(r.id)}`} className="ad-lead-body">
                <div className="ad-av">{initials(r)}</div>
                <div className="ad-lead-main"><strong>{fullName(r)}</strong><span>{l1}</span><span>{l2}</span></div>
                <div className="ad-lead-foot">
                  <span className={'ad-st ' + r.status}>{r.status === 'new' ? 'New' : 'Contacted'}</span>
                  {r.exported && <span className="ad-st exp">Exported</span>}
                  <time>{when(r.createdAt)}</time>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
      {msg && <div className="ad-toast">{msg}</div>}
    </>
  );
}

/* ---------- Full details page ---------- */
const waLink = (p) => { const d = String(p || '').replace(/\D/g, ''); return d ? `https://wa.me/${d.startsWith('0') ? '234' + d.slice(1) : d}` : ''; };
export function LeadDetail() {
  const { kind, id } = useParams();
  const nav = useNavigate();
  const { rows, setRows, err } = useLeads(kind);
  if (!KINDS[kind]) return <p className="ad-note">That list does not exist.</p>;
  const r = rows?.find((x) => x.id === id);
  const set = async (patch) => { await markLeads(kind, [r.id], patch); setRows(await listLeads(kind)); };
  return (
    <>
      <Link className="ad-back" to={`/admin/leads/${kind}`}><Icon name="chevL" size={16} /> {KINDS[kind].label}</Link>
      <SampleNote />
      {err && <p className="ad-err">{err}</p>}
      {!rows && !err && <p className="ad-note">Loading…</p>}
      {rows && !r && <p className="ad-empty">This record was not found.</p>}
      {r && (
        <div className="ad-detail">
          <div className="ad-detail-head">
            <div className="ad-av big">{initials(r)}</div>
            <div><h2>{fullName(r)}</h2><p>Submitted {when(r.createdAt)} · <span className={'ad-st ' + r.status}>{r.status === 'new' ? 'New' : 'Contacted'}</span>{r.exported && <> <span className="ad-st exp">Exported</span></>}</p></div>
          </div>
          <div className="ad-actions left">
            <button className="ad-btn primary" onClick={() => nav('/admin/message', { state: { kind, ids: [r.id] } })}><Icon name="mail" size={18} /> Message</button>
            {waLink(r.data.phone) && <a className="ad-btn" href={waLink(r.data.phone)} target="_blank" rel="noopener noreferrer"><Icon name="chat" size={18} /> WhatsApp</a>}
            {r.data.phone && <a className="ad-btn" href={`tel:${r.data.phone}`}><Icon name="phone" size={18} /> Call</a>}
            <button className="ad-btn" onClick={() => set({ status: r.status === 'new' ? 'contacted' : 'new' })}>{r.status === 'new' ? 'Mark as contacted' : 'Mark as new'}</button>
          </div>
          <dl className="ad-dl">
            {fieldsOf(r).map((k) => (<div key={k}><dt>{LABELS[k] || k}</dt><dd>{String(r.data[k])}</dd></div>))}
          </dl>
        </div>
      )}
    </>
  );
}

/* ---------- Write an email to everyone chosen ---------- */
export function Compose() {
  const { state } = useLocation();
  const { kind, ids } = state || {};
  const { rows } = useLeads(kind || 'registrations');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('Hello {{first_name}},\n\n\n\nBest wishes,\nPattern & Produce');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  if (!kind || !ids?.length) return (<><p className="ad-empty">Choose people first: open a list, then use the Message button.</p><Link className="ad-back" to="/admin/leads/registrations">Go to Registered users</Link></>);
  const people = (rows || []).filter((r) => ids.includes(r.id));
  const withEmail = people.filter((r) => /\S+@\S+\.\S+/.test(r.data.email || ''));
  const first = withEmail[0];
  const fill = (t, r) => t.replace(/\{\{\s*first_name\s*\}\}/g, r?.data.first_name || '').replace(/\{\{\s*name\s*\}\}/g, r ? fullName(r) : '');
  const send = async () => {
    if (!subject.trim() || !body.trim()) return setErr('Please add a subject and a message.');
    if (!confirm(`Send this email to ${withEmail.length} ${withEmail.length === 1 ? 'person' : 'people'}?`)) return;
    setErr(''); setStatus('busy');
    try { setResult(await sendEmail({ kind, ids: withEmail.map((r) => r.id), subject, body })); setStatus('done'); }
    catch (e) { setErr(e.message || 'Could not send.'); setStatus('idle'); }
  };
  return (
    <>
      <Link className="ad-back" to={`/admin/leads/${kind}`}><Icon name="chevL" size={16} /> {KINDS[kind].label}</Link>
      <SampleNote />
      {status === 'done' ? (
        <div className="ad-box"><h3>{result?.sample ? 'Sample only: nothing was really sent' : 'Email sent'}</h3><p>{result?.sent} sent{result?.failed ? `, ${result.failed} failed` : ''}.</p><div className="ad-actions left"><Link className="ad-btn primary" to={`/admin/leads/${kind}`}>Back to the list</Link></div></div>
      ) : (
        <div className="ad-compose">
          <div className="ad-to"><strong>To:</strong> {rows ? `${withEmail.length} ${withEmail.length === 1 ? 'person' : 'people'}` : '…'}
            <span>{withEmail.slice(0, 4).map(fullName).join(', ')}{withEmail.length > 4 ? ` and ${withEmail.length - 4} more` : ''}</span>
            {rows && people.length > withEmail.length && <em>{people.length - withEmail.length} without an email address will be skipped.</em>}
          </div>
          <label>Subject<input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" /></label>
          <label>Message<textarea rows="10" value={body} onChange={(e) => setBody(e.target.value)} /></label>
          <p className="ad-note">Type <code>{'{{first_name}}'}</code> to add each person&rsquo;s first name. Email is sent securely through the configured mail provider.</p>
          {first && <div className="ad-box"><h3>Preview for {fullName(first)}</h3><p style={{ whiteSpace: 'pre-wrap' }}><strong>{fill(subject, first) || '(no subject)'}</strong>{'\n\n'}{fill(body, first)}</p></div>}
          {err && <p className="ad-err">{err}</p>}
          <div className="ad-actions left"><button className="ad-btn primary" onClick={send} disabled={status === 'busy' || !withEmail.length}>{status === 'busy' ? 'Sending…' : 'Send email'}</button><Link className="ad-btn" to={`/admin/leads/${kind}`}>Cancel</Link></div>
        </div>
      )}
    </>
  );
}
