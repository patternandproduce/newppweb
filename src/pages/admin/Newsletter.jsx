import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { rpc } from '../../lib/adminApi.js';
import { uploadToCloudinary } from '../../lib/cloudinary.js';
import { downloadXlsx } from '../../lib/xlsx.js';

const INTERESTS = ['Fashion technology', 'Garment manufacturing', 'Training and upskilling', 'Partnerships', 'Business updates'];
const dateLabel = (value) => value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const monthKey = (value) => value ? new Date(value).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'Unknown date';
const weekKey = (value) => {
  if (!value) return 'Unknown week';
  const d = new Date(value); const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `Week ${week}, ${date.getUTCFullYear()}`;
};
const groupLabel = (r, by) => {
  if (by === 'month') return monthKey(r.created_at);
  if (by === 'week') return weekKey(r.created_at);
  if (by === 'location') return [r.city, r.country].filter(Boolean).join(', ') || 'Location not provided';
  if (by === 'interest') return (r.interests || []).join(', ') || 'No interests selected';
  if (by === 'tag') return (r.tags || []).join(', ') || 'No tags';
  return 'All subscribers';
};
const safeName = (s) => String(s || '').replace(/[\\/:*?"<>|]+/g, '-');

export default function Newsletter() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [groupBy, setGroupBy] = useState('month');
  const [groupValue, setGroupValue] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [showComposer, setShowComposer] = useState(false);

  const load = async () => {
    setError('');
    try { setRows(await rpc('newsletter.list', {}, { auth: true })); }
    catch (e) { setError(e.message || 'Could not load subscribers.'); }
  };
  useEffect(() => { load(); }, []);

  const options = useMemo(() => {
    if (!rows) return [];
    const values = groupBy === 'interest' ? rows.flatMap((r) => r.interests || []) : groupBy === 'tag' ? rows.flatMap((r) => r.tags || []) : rows.map((r) => groupLabel(r, groupBy));
    return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [rows, groupBy]);
  const filtered = useMemo(() => (rows || []).filter((r) => {
    const text = `${r.email} ${r.city || ''} ${r.country || ''} ${(r.interests || []).join(' ')} ${(r.tags || []).join(' ')}`.toLowerCase();
    const matchesQuery = !query || text.includes(query.toLowerCase());
    const matchesGroup = groupValue === 'all' || (groupBy === 'interest' ? (r.interests || []).includes(groupValue) : groupBy === 'tag' ? (r.tags || []).includes(groupValue) : groupLabel(r, groupBy) === groupValue);
    return matchesQuery && matchesGroup;
  }), [rows, query, groupBy, groupValue]);
  const active = filtered.filter((r) => !r.unsubscribed_at);
  const allSelected = active.length > 0 && active.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected((old) => {
    const next = new Set(old);
    if (allSelected) active.forEach((r) => next.delete(r.id));
    else active.forEach((r) => next.add(r.id));
    return next;
  });
  const toggle = (id) => setSelected((old) => { const next = new Set(old); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const recipients = (rows || []).filter((r) => selected.has(r.id) && !r.unsubscribed_at);

  const exportRows = (list, name) => {
    const data = [['Email', 'City', 'Country', 'Interests', 'Tags', 'Date subscribed', 'Status'], ...list.map((r) => [r.email, r.city || '', r.country || '', (r.interests || []).join('; '), (r.tags || []).join('; '), dateLabel(r.created_at), r.unsubscribed_at ? 'Unsubscribed' : 'Subscribed'])];
    downloadXlsx(data, `Pattern-and-Produce-${safeName(name)}-${new Date().toISOString().slice(0, 10)}.xlsx`, 'Subscribers');
  };
  const exportCsv = (list) => {
    const data = [['Email', 'City', 'Country', 'Interests', 'Tags', 'Date subscribed', 'Status'], ...list.map((r) => [r.email, r.city || '', r.country || '', (r.interests || []).join('; '), (r.tags || []).join('; '), dateLabel(r.created_at), r.unsubscribed_at ? 'Unsubscribed' : 'Subscribed'])];
    const csv = data.map((row) => row.map((v) => { let value = String(v ?? ''); if (/^[=+\-@]/.test(value)) value = `'${value}`; return `"${value.replace(/"/g, '""')}"`; }).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `Pattern-and-Produce-subscribers-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  const editProfile = async (r) => {
    const city = window.prompt('Subscriber city:', r.city || '');
    if (city === null) return;
    const country = window.prompt('Subscriber country:', r.country || '');
    if (country === null) return;
    const interests = window.prompt('Interests (separate multiple interests with commas):', (r.interests || []).join(', '));
    if (interests === null) return;
    const tags = window.prompt('Custom tags (separate multiple tags with commas):', (r.tags || []).join(', '));
    if (tags === null) return;
    try {
      await rpc('newsletter.update', { id: r.id, city, country, interests: interests.split(',').map((x) => x.trim()).filter(Boolean), tags: tags.split(',').map((x) => x.trim()).filter(Boolean) }, { auth: true });
      await load();
    } catch (e) { setError(e.message); }
  };
  const remove = async (r) => {
    if (!window.confirm(`Remove ${r.email} from the subscriber list?`)) return;
    try { await rpc('newsletter.delete', { id: r.id }, { auth: true }); setSelected((old) => { const n = new Set(old); n.delete(r.id); return n; }); await load(); }
    catch (e) { setError(e.message); }
  };
  const uploadImage = async (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Choose an image file.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Image must be 10 MB or smaller.'); return; }
    setError(''); setUploading(true); setProgress(0);
    try { const result = await uploadToCloudinary(file, 'image', setProgress); setImageUrl(result.url); }
    catch (e2) { setError(e2.message || 'Image upload failed.'); }
    finally { setUploading(false); }
  };
  const sendCampaign = async () => {
    if (!subject.trim() || !body.trim()) { setError('Add an email subject and message.'); return; }
    if (!recipients.length) { setError('Select at least one active subscriber.'); return; }
    if (!window.confirm(`Send this newsletter to ${recipients.length} subscriber(s)?`)) return;
    setSending(true); setError(''); setMessage('');
    try {
      const result = await rpc('newsletter.send', { ids: recipients.map((r) => r.id), subject, body, imageUrl }, { auth: true });
      setMessage(`Campaign complete: ${result.sent} sent${result.failed ? `, ${result.failed} failed` : ''}.`);
      setShowComposer(false); setSelected(new Set());
    } catch (e) { setError(e.message || 'Could not send the newsletter.'); }
    finally { setSending(false); }
  };

  return <div className="ad-newsletter">
    <p className="ad-note">Manage your newsletter audience, organise subscribers and send custom campaigns.</p>
    {error && <p className="ad-err">{error}</p>}
    {message && <p className="ad-newsletter-success" role="status">{message}</p>}
    <div className="ad-stats">
      <div><span>Total subscribers</span><strong>{rows?.length ?? '—'}</strong></div>
      <div><span>Active subscribers</span><strong>{rows?.filter((r) => !r.unsubscribed_at).length ?? '—'}</strong></div>
      <div><span>Unsubscribed</span><strong>{rows?.filter((r) => !!r.unsubscribed_at).length ?? '—'}</strong></div>
    </div>
    <div className="ad-bar">
      <label className="ad-search"><Icon name="search" size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search email, location, interest or tag" /></label>
      <select value={groupBy} onChange={(e) => { setGroupBy(e.target.value); setGroupValue('all'); }} aria-label="Group subscribers"><option value="month">Group by month</option><option value="week">Group by week</option><option value="location">Group by location</option><option value="interest">Group by interests</option><option value="tag">Group by custom tags</option></select>
      <select value={groupValue} onChange={(e) => setGroupValue(e.target.value)} aria-label="Choose group"><option value="all">All groups</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>
    </div>
    <div className="ad-actions left ad-newsletter-actions">
      <button className="ad-btn" onClick={toggleAll} disabled={!active.length}><Icon name="check" size={17}/>{allSelected ? 'Clear group selection' : `Select all shown (${active.length})`}</button>
      <button className="ad-btn primary" onClick={() => setShowComposer(true)} disabled={!selected.size}><Icon name="mail" size={17}/>Compose email ({selected.size})</button>
      <button className="ad-btn" onClick={() => exportRows(filtered, 'filtered-subscribers')} disabled={!filtered.length}><Icon name="download" size={17}/>Export Excel</button>
      <button className="ad-btn" onClick={() => exportCsv(filtered)} disabled={!filtered.length}><Icon name="download" size={17}/>Google Sheets CSV</button>
    </div>
    {!rows && !error && <p className="ad-note">Loading subscribers…</p>}
    {rows && !filtered.length && <p className="ad-empty">No subscribers match this selection.</p>}
    <div className="ad-newsletter-list">
      {filtered.map((r) => <article className="ad-newsletter-row" key={r.id}>
        <input type="checkbox" checked={selected.has(r.id)} disabled={!!r.unsubscribed_at} onChange={() => toggle(r.id)} aria-label={`Select ${r.email}`}/>
        <div className="ad-newsletter-person"><strong>{r.email}</strong><span>{[r.city, r.country].filter(Boolean).join(', ') || 'Location not provided'} · Joined {dateLabel(r.created_at)}</span><small>{(r.interests || []).join(' · ') || 'No interests'}{(r.tags || []).length ? ` · Tags: ${r.tags.join(', ')}` : ''}</small></div>
        <span className={`ad-st ${r.unsubscribed_at ? 'contacted' : 'new'}`}>{r.unsubscribed_at ? 'Unsubscribed' : 'Active'}</span>
        <div className="ad-newsletter-row-actions"><button className="ad-btn" onClick={() => editProfile(r)}>Edit details</button><button className="ad-btn" onClick={() => remove(r)}>Remove</button></div>
      </article>)}
    </div>
    {showComposer && <div className="ad-modal" onClick={() => !sending && setShowComposer(false)}><form className="ad-sheet ad-newsletter-composer" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); sendCampaign(); }}>
      <div className="ad-sheet-head"><h2>Compose newsletter</h2><button type="button" className="ad-x" onClick={() => setShowComposer(false)} aria-label="Close"><Icon name="close" size={20}/></button></div>
      <div className="ad-to"><strong>Recipients: {recipients.length}</strong><span>{recipients.slice(0, 5).map((r) => r.email).join(', ')}{recipients.length > 5 ? ` and ${recipients.length - 5} more` : ''}</span></div>
      <label>Subject<input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} required placeholder="Newsletter subject"/></label>
      <label>Message<textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} required placeholder="Write your newsletter message. Use a new line for each paragraph."/></label>
      <label className="ad-btn ad-upload"><Icon name="image" size={18}/>{uploading ? `Uploading image… ${progress}%` : imageUrl ? 'Replace newsletter image' : 'Upload newsletter image'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden disabled={uploading} onChange={uploadImage}/></label>
      {imageUrl && <div className="ad-newsletter-image"><img src={imageUrl} alt="Newsletter upload preview"/><button type="button" className="ad-btn" onClick={() => setImageUrl('')}>Remove image</button></div>}
      <p className="ad-note">Images are hosted on Cloudinary. Active subscribers receive an unsubscribe link automatically.</p>
      <div className="ad-newsletter-preview"><strong>Email preview</strong>{imageUrl && <img src={imageUrl} alt=""/>}<h3>{subject || 'Your subject will appear here'}</h3><p>{body || 'Your message will appear here.'}</p></div>
      <div className="ad-actions left"><button className="ad-btn primary" type="submit" disabled={sending || uploading || !recipients.length}>{sending ? 'Sending…' : `Send to ${recipients.length} subscribers`}</button><button className="ad-btn" type="button" onClick={() => setShowComposer(false)} disabled={sending}>Cancel</button></div>
    </form></div>}
  </div>;
}
