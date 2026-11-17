import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import usePageTitle from "../components/usePageTitle.js";
import { supabase, supabaseReady } from "../lib/supabase.js";
import { rpc } from "../lib/adminApi.js";

export function StudentLogin() {
  usePageTitle("Student Login");
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!supabaseReady) return;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!alive || !session) return;
      try {
        const status = await rpc("student.status", {}, { auth: true });
        if (status?.role === "student") {
          if (status?.approvalStatus === "approved" && status?.active) navigate("/tutorials", { replace: true });
          else await supabase.auth.signOut();
        }
      } catch { /* show the login form if the current session is not an approved student */ }
    });
    return () => { alive = false; };
  }, [navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (!supabaseReady) throw new Error("Student access is not configured yet. Please contact Pattern & Produce.");
      const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (loginError) throw loginError;
      const status = await rpc("student.status", {}, { auth: true });
      if (status?.role !== "student") {
        throw new Error("This login is for student accounts. Please use the appropriate account.");
      }
      if (status.approvalStatus !== "approved" || !status.active) {
        await supabase.auth.signOut();
        if (status.approvalStatus === "denied") throw new Error("Your application was not approved. Please contact Pattern & Produce for assistance.");
        if (status.approvalStatus === "revoked") throw new Error("Your tutorial access has been suspended. Please contact Pattern & Produce.");
        throw new Error("Your registration is still awaiting approval. You will be able to log in once your application has been approved.");
      }
      navigate("/tutorials", { replace: true });
    } catch (e) {
      setError(e.message || "Unable to sign in. Check your email and password.");
    } finally { setBusy(false); }
  };

  return <div className="page student-access-page"><div className="student-access-card">
    <div className="eyebrow">Workforce Upskilling</div>
    <h1>Student <span className="soft">Access</span></h1>
    <p className="lead">Sign in to continue to the Pattern &amp; Produce tutorial library. Access is available to students whose registrations have been approved.</p>
    <form className="student-login-form" onSubmit={submit}>
      <label>Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
      <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
      {error && <p className="student-form-error" role="alert">{error}</p>}
      <button className="btn-fill" disabled={busy}>{busy ? "Checking access…" : "Log in"}</button>
    </form>
    <div className="student-register-prompt"><span>Not registered yet?</span><Link className="btn" to="/register?next=%2Ftutorials">Register here</Link></div>
    <Link className="student-back" to="/workforce-upskilling">← Back to Workforce Upskilling</Link>
  </div></div>;
}

export function ProtectedTutorials({ children }) {
  const [state, setState] = useState("checking");
  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { if (alive) setState("unauthenticated"); return; }
        const status = await rpc("student.status", {}, { auth: true });
        if (!alive) return;
        setState(status?.role === "student" && status?.active && status?.approvalStatus === "approved" ? "approved" : "blocked");
      } catch { if (alive) setState("blocked"); }
    };
    check();
    return () => { alive = false; };
  }, []);
  if (state === "checking") return <div className="page"><section><p className="lead">Verifying student access…</p></section></div>;
  if (state !== "approved") return <Navigate to="/student-access" replace />;
  return children;
}
