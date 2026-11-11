import { useEffect, useState } from 'react';
import { rpc } from '../../lib/adminApi.js';


const RANGES = [['day', 'Today', 'Visitors per hour'], ['week', 'Last 7 days', 'Visitors per day'], ['month', 'Last 30 days', 'Visitors per day'], ['year', 'Last 12 months', 'Visitors per month']];
const PAL = ['#111111', '#6d6d6d', '#b0b0b0', '#d4a24c', '#4fb3a9', '#e0768a', '#7c8cf5'];

function Bars({ series }) {
  const W = 760, H = 220, P = 30, max = Math.max(1, ...series.map((s) => s.visitors));
  const bw = (W - P * 2) / series.length, step = Math.ceil(series.length / 12);
  return (
    <svg viewBox={`0 0 ${W} ${H + 40}`} className="ad-chart" role="img" aria-label="Visitors chart">
      {[0, 0.5, 1].map((t) => (<g key={t}><line x1={P} x2={W - P} y1={H - t * H + 10} y2={H - t * H + 10} stroke="#e5e5e1" /><text x={P - 6} y={H - t * H + 14} fontSize="11" textAnchor="end" fill="#888">{Math.round(max * t)}</text></g>))}
      {series.map((s, i) => {
        const h = (s.visitors / max) * H, x = P + i * bw;
        return (<g key={i}><rect x={x + bw * 0.16} y={H - h + 10} width={bw * 0.68} height={h} rx="3" fill="#111"><title>{s.label}: {s.visitors}</title></rect>{i % step === 0 && <text x={x + bw / 2} y={H + 30} fontSize="11" textAnchor="middle" fill="#666">{s.label}</text>}</g>);
      })}
    </svg>
  );
}

function Pie({ title, data }) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const total = entries.reduce((n, [, v]) => n + v, 0);
  const R = 70, C = 80;
  let a0 = -Math.PI / 2;
  const slices = entries.map(([k, v], i) => {
    const f = v / total, a1 = a0 + f * 2 * Math.PI;
    const d = f >= 0.999 ? `M${C - R} ${C}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0` : `M${C} ${C}L${C + R * Math.cos(a0)} ${C + R * Math.sin(a0)}A${R} ${R} 0 ${f > 0.5 ? 1 : 0} 1 ${C + R * Math.cos(a1)} ${C + R * Math.sin(a1)}Z`;
    a0 = a1;
    return { k, v, f, d, color: PAL[i % PAL.length] };
  });
  return (
    <div className="ad-pie">
      <h3>{title}</h3>
      {total ? (<div className="ad-pie-row"><svg viewBox="0 0 160 160" width="150" height="150" role="img" aria-label={title}>{slices.map((s) => (<path key={s.k} d={s.d} fill={s.color} stroke="#fff" strokeWidth="1.5"><title>{s.k}: {s.v}</title></path>))}</svg>
        <ul>{slices.map((s) => (<li key={s.k}><i style={{ background: s.color }} /><span>{s.k}</span><b>{Math.round(s.f * 100)}%</b></li>))}</ul></div>) : <p className="ad-note">No data yet.</p>}
    </div>
  );
}

export default function Analytics() {
  const [range, setRange] = useState('week');
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    let live = true; setD(null); setErr('');
    rpc('analytics', { range }, { auth: true }).then((x) => live && setD(x)).catch((e) => live && setErr(e.message));
    return () => { live = false; };
  }, [range]);
  const meta = RANGES.find((r) => r[0] === range);
  return (
    <>
      <div className="ad-tabs" role="tablist">{RANGES.map(([k, l]) => (<button key={k} role="tab" aria-selected={range === k} className={range === k ? 'on' : ''} onClick={() => setRange(k)}>{l}</button>))}</div>
      {err && <p className="ad-err">{err}</p>}
      {!d && !err && <p className="ad-note">Loading…</p>}
      {d && (<>
        <div className="ad-stats">{[['Today', d.totals.today], ['This week', d.totals.week], ['This month', d.totals.month], ['This year', d.totals.year]].map(([l, v]) => (<div key={l}><span>{l}</span><strong>{Number(v).toLocaleString()}</strong></div>))}</div>
        <div className="ad-box"><h3>{meta[2]}</h3><Bars series={d.series} /></div>
        <div className="ad-pies"><Pie title="Devices" data={d.devices} /><Pie title="Most visited pages" data={d.pages} /><Pie title="Where visitors came from" data={d.sources} /></div>
        <p className="ad-note">A visitor is counted once per visit. The same person on two devices counts twice.</p>
      </>)}
    </>
  );
}
