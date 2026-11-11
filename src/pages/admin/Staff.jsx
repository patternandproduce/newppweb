import { useEffect, useState } from 'react';
import { API_BASE } from '../../config.js';
import { rpc } from '../../lib/adminApi.js';

export default function Staff() {
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');
  const [f, setF] = useState({ name: '', email: '', username: '', password: '', role: 'staff' });
  const load = () => rpc('staff.list', {}, { auth: true }).then(setList).catch((e) => setErr(e.message));
  useEffect(() => { if (API_BASE) load(); }, []);
  if (!API_BASE) return <div className="ad-box warn"><h3>Supabase is not configured</h3><p>Add the Supabase environment variables to enable employee management.</p></div>;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const add = async (e) => {
    e.preventDefault(); setErr('');
    try { await rpc('staff.save', f, { auth: true }); setF({ name: '', email: '', username: '', password: '', role: 'staff' }); load(); } catch (x) { setErr(x.message); }
  };
  const act = (fn) => fn().then(load).catch((x) => setErr(x.message));
  return (
    <>
      <p className="ad-note">Employees you add here can sign in at /admin with their own email address and password. Staff can manage leads and videos. Only admins can open this page.</p>
      {err && <p className="ad-err">{err}</p>}
      <div className="ad-list">
        {(list || []).map((u) => (
          <div className="ad-row ad-staff" key={u.username}>
            <div className="ad-av">{(u.name || u.username).slice(0, 2).toUpperCase()}</div>
            <div className="ad-info"><strong>{u.name || u.username}</strong><span>{u.email || u.username} · {u.role}{u.active ? '' : ' · deactivated'}</span></div>
            <div className="ad-ops">
              <button className="ad-chip on" onClick={() => { const p = prompt(`New password for ${u.email || u.username} (at least 8 characters)`); if (p) act(() => rpc('staff.save', { ...u, password: p }, { auth: true })); }}>Reset password</button>
              <button className="ad-chip" onClick={() => act(() => rpc('staff.setActive', { id: u.id, active: !u.active }, { auth: true }))}>{u.active ? 'Deactivate' : 'Activate'}</button>
            </div>
          </div>
        ))}
      </div>
      <form className="ad-sheet inline" onSubmit={add}>
        <h2>Add an employee</h2>
        <div className="ad-grid2"><label>Full name<input value={f.name} onChange={set('name')} required /></label><label>Login email<input type="email" value={f.email} onChange={set('email')} required autoCapitalize="none" /></label></div>
        <div className="ad-grid2"><label>Display username (optional)<input value={f.username} onChange={set('username')} autoCapitalize="none" /></label><label>Password<input type="password" value={f.password} onChange={set('password')} required minLength={8} /></label><label>Role<select value={f.role} onChange={set('role')}><option value="staff">Staff</option><option value="admin">Admin</option></select></label></div>
        <div className="ad-actions left"><button className="ad-btn primary">Add employee</button></div>
      </form>
    </>
  );
}
