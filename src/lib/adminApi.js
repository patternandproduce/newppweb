import { supabase, supabaseReady } from "./supabase.js";

const KEY = "pp_admin_session";
export const getSession = () => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
};
export const setSession = (s) => {
  if (s) sessionStorage.setItem(KEY, JSON.stringify(s));
  else sessionStorage.removeItem(KEY);
};

async function token() {
  if (!supabaseReady)
    throw new Error(
      "Supabase is not configured. Add the public Supabase environment variables.",
    );
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session?.access_token)
    throw new Error("Your session has expired. Please sign in again.");
  return session.access_token;
}

export async function signIn(email, password) {
  if (!supabaseReady) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  const profile = await rpc("me", {}, { auth: true });
  if (!profile?.active) {
    await supabase.auth.signOut();
    throw new Error(
      "This account has been deactivated. Contact an administrator.",
    );
  }
  const session = {
    username: profile.username || data.user.email,
    name: profile.name || data.user.email,
    role: profile.role,
    email: data.user.email,
    userId: data.user.id,
  };
  setSession(session);
  return session;
}

export async function signOut() {
  if (supabaseReady) await supabase.auth.signOut();
  setSession(null);
}

export async function rpc(action, data = {}, { auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) headers.Authorization = `Bearer ${await token()}`;
  const response = await fetch("/api/admin", {
    method: "POST",
    headers,
    body: JSON.stringify({ action, data }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok)
    throw new Error(result.error || `Request failed (${response.status})`);
  return result.data;
}
