import { useEffect, useMemo, useState } from "react";
import { rpc } from "../../lib/adminApi.js";

const niceDate = (value) => value ? new Date(value).toLocaleString() : "—";
export default function Students() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(null);
  const reload = async () => {
    setError("");
    try { setRows(await rpc("students.list", {}, { auth: true }) || []); }
    catch (e) { setError(e.message || "Could not load student applications."); }
  };
  useEffect(() => { reload(); }, []);
  const filtered = useMemo(() => rows.filter((r) => (filter === "all" || r.status === filter) && `${r.name} ${r.email}`.toLowerCase().includes(query.toLowerCase())), [rows, filter, query]);
  const update = async (row, status) => {
    const action = status === "approved" ? "approve" : status === "denied" ? "deny" : "revoke access for";
    if (!window.confirm(`Are you sure you want to ${action} ${row.name || row.email}?`)) return;
    setBusy(row.id); setError(""); setNotice("");
    try {
      await rpc("students.setStatus", { id: row.id, status }, { auth: true });
      setNotice(`Student access ${status === "approved" ? "approved" : status === "denied" ? "denied" : "revoked"}.`);
      await reload();
      if (selected?.id === row.id) setSelected(null);
    } catch (e) { setError(e.message || "Could not update student access."); }
    finally { setBusy(""); }
  };
  return <div className="ad-students">
    <div className="ad-student-intro"><p>Review training applications and control access to the protected tutorial library. Only approved students can sign in and view tutorials.</p><button className="ad-btn" onClick={reload}>Refresh</button></div>
    <div className="ad-student-stats">{["pending", "approved", "denied", "revoked"].map((s) => <button key={s} className={filter === s ? "on" : ""} onClick={() => setFilter(s)}><span>{rows.filter((r) => r.status === s).length}</span>{s[0].toUpperCase() + s.slice(1)}</button>)}</div>
    <div className="ad-bar"><select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="denied">Denied</option><option value="revoked">Revoked</option><option value="all">All applications</option></select><input className="ad-student-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by student name or email" /></div>
    {error && <p className="ad-err">{error}</p>}{notice && <p className="ad-student-notice">{notice}</p>}
    <div className="ad-list">{filtered.map((r) => <article className="ad-student-row" key={r.id}>
      <div className="ad-student-person"><strong>{r.name || "Student applicant"}</strong><span>{r.email}</span><small>Submitted {niceDate(r.createdAt)}</small></div>
      <span className={`ad-student-status ${r.status}`}>{r.status}</span>
      <div className="ad-ops"><button className="ad-btn" onClick={() => setSelected(r)}>View</button>{r.status !== "approved" && <button className="ad-btn primary" disabled={!!busy} onClick={() => update(r, "approved")}>{busy === r.id ? "Saving…" : "Approve"}</button>}{r.status === "pending" && <button className="ad-btn" disabled={!!busy} onClick={() => update(r, "denied")}>Deny</button>}{r.status === "approved" && <button className="ad-btn" disabled={!!busy} onClick={() => update(r, "revoked")}>Revoke access</button>}</div>
    </article>)}{!filtered.length && <p className="ad-empty">No {filter === "all" ? "applications" : filter + " applications"} found.</p>}</div>
    {selected && <div className="ad-modal" onClick={() => setSelected(null)}><div className="ad-sheet ad-student-detail" onClick={(e) => e.stopPropagation()}><div className="ad-sheet-head"><h2>Student application</h2><button className="ad-x" onClick={() => setSelected(null)}>×</button></div><dl className="ad-dl">{Object.entries(selected.data || {}).filter(([key]) => !["page", "submitted_at"].includes(key)).map(([key, value]) => <div key={key}><dt>{key.replaceAll("_", " ")}</dt><dd>{Array.isArray(value) ? value.join(", ") : String(value ?? "—")}</dd></div>)}</dl><div className="ad-actions">{selected.status !== "approved" && <button className="ad-btn primary" onClick={() => update(selected, "approved")}>Approve application</button>}{selected.status === "pending" && <button className="ad-btn" onClick={() => update(selected, "denied")}>Deny application</button>}{selected.status === "approved" && <button className="ad-btn" onClick={() => update(selected, "revoked")}>Revoke access</button>}</div></div></div>}
  </div>;
}
