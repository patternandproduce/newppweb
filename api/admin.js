import { createClient } from "@supabase/supabase-js";
import { send, requireMethod, env } from "../server/http.js";

const db = () =>
  createClient(env("SUPABASE_URL"), env("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
const leadKinds = new Set([
  "registrations",
  "consultations",
  "quotes",
  "contacts",
]);
const clean = (v) => String(v ?? "").slice(0, 10000);

async function authUser(req, adminOnly = false) {
  const header = req.headers.authorization || "";
  const accessToken = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!accessToken) throw new Error("Please sign in to continue.");
  const client = db();
  const {
    data: { user },
    error,
  } = await client.auth.getUser(accessToken);
  if (error || !user) throw new Error("Your session is invalid or expired.");
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (profileError || !profile || !profile.active)
    throw new Error("Your account is not active.");
  if (adminOnly && profile.role !== "admin")
    throw new Error("Only administrators can perform this action.");
  return { client, user, profile };
}

function asLead(row) {
  return {
    id: row.id,
    kind: row.kind,
    data: row.data || {},
    status: row.status,
    exported: row.exported,
    createdAt: row.created_at,
  };
}

export default async function handler(req, res) {
  if (!requireMethod(req, res)) return;
  try {
    const { action, data = {} } = req.body || {};
    if (action === "library.get") {
      let query = db();
      let includeHidden = false;
      if ((req.headers.authorization || "").startsWith("Bearer ")) {
        const session = await authUser(req, false);
        query = session.client;
        includeHidden = true;
      }
      const { data: phases, error: pe } = await query
        .from("phases")
        .select("*")
        .order("sort_order");
      let videoQuery = query.from("videos").select("*").order("sort_order");
      if (!includeHidden) videoQuery = videoQuery.eq("published", true);
      const { data: videos, error: ve } = await videoQuery;
      if (pe) throw pe;
      if (ve) throw ve;
      return send(res, 200, {
        ok: true,
        data: {
          phases: phases.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description || "",
            color: p.color,
            icon: p.icon,
            order: p.sort_order,
          })),
          videos: videos.map((v) => ({
            id: v.id,
            provider: v.provider,
            youtubeId: v.youtube_id,
            cloudinaryPublicId: v.cloudinary_public_id,
            videoUrl: v.video_url,
            thumbnail: v.thumbnail_url,
            title: v.title,
            description: v.description || "",
            phaseId: v.phase_id,
            duration: v.duration || "",
            order: v.sort_order,
            published: v.published,
            featured: v.featured,
          })),
        },
      });
    }
    if (action === "lead.create") {
      const kind = data.kind;
      if (!leadKinds.has(kind)) throw new Error("Invalid submission type.");
      const payload =
        data.data && typeof data.data === "object" ? data.data : {};
      if (payload.company)
        return send(res, 200, { ok: true, data: { accepted: true } });
      const { error } = await db()
        .from("leads")
        .insert({ kind, data: payload, status: "new", exported: false });
      if (error) throw error;
      // Notify the business through Resend. Database acceptance remains authoritative if email is temporarily unavailable.
      try {
        const subject = `${kind[0].toUpperCase()}${kind.slice(1)}: ${payload.first_name || payload.email || "New website submission"}`;
        const lines = Object.entries(payload)
          .filter(([k]) => !["company"].includes(k))
          .map(([k, v]) => `${k.replace(/_/g, " ")}: ${String(v ?? "")}`)
          .join("\n");
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env("RESEND_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: env("EMAIL_FROM"),
            to: [
              process.env.CONTACT_NOTIFY_EMAIL || "patternandproduce@gmail.com",
            ],
            reply_to: payload.email || undefined,
            subject,
            text: lines,
          }),
        });
      } catch (mailError) {
        console.error(
          "Submission notification email failed:",
          mailError?.message,
        );
      }
      return send(res, 200, { ok: true, data: { accepted: true } });
    }
    if (action === "visit") {
      const sid = clean(data.sid).slice(0, 100);
      const path = clean(data.path).slice(0, 300);
      if (!sid || !path || path.startsWith("/admin"))
        return send(res, 200, { ok: true, data: true });
      const { error } = await db()
        .from("visits")
        .insert({
          session_id: sid,
          path,
          device: clean(data.device).slice(0, 30),
          referrer: clean(data.ref).slice(0, 200),
        });
      if (error) throw error;
      return send(res, 200, { ok: true, data: true });
    }

    const { client, user, profile } = await authUser(
      req,
      action === "staff.list" ||
        action === "staff.save" ||
        action === "staff.setActive",
    );
    if (action === "me") return send(res, 200, { ok: true, data: profile });

    if (action === "library.save") {
      const phases = Array.isArray(data.phases) ? data.phases : [];
      const videos = Array.isArray(data.videos) ? data.videos : [];
      const phaseRows = phases.map((p, i) => ({
        id: String(p.id),
        name: clean(p.name),
        description: clean(p.description),
        color: /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : "#777777",
        icon: clean(p.icon).slice(0, 40),
        sort_order: i + 1,
      }));
      const videoRows = videos.map((v, i) => ({
        id: String(v.id),
        provider: v.provider === "cloudinary" ? "cloudinary" : "youtube",
        youtube_id: v.youtubeId || null,
        cloudinary_public_id: v.cloudinaryPublicId || null,
        video_url: v.videoUrl || null,
        thumbnail_url: v.thumbnail || null,
        title: clean(v.title),
        description: clean(v.description),
        phase_id: v.phaseId || null,
        duration: clean(v.duration),
        sort_order: i + 1,
        published: v.published !== false,
        featured: Boolean(v.featured),
        created_by: user.id,
      }));
      const phaseIds = new Set(phaseRows.map((p) => p.id));
      if (
        videoRows.some(
          (v) => !v.title || (v.phase_id && !phaseIds.has(v.phase_id)),
        )
      )
        throw new Error(
          "A video has a missing title or references a phase that does not exist.",
        );
      if (phaseRows.length) {
        const { error } = await client.from("phases").upsert(phaseRows);
        if (error) throw error;
      }
      if (videoRows.length) {
        const { error } = await client.from("videos").upsert(videoRows);
        if (error) throw error;
      }
      const { data: oldVideos, error: oldVideoError } = await client
        .from("videos")
        .select("id");
      if (oldVideoError) throw oldVideoError;
      const videoIds = new Set(videoRows.map((v) => v.id));
      const obsoleteVideos = oldVideos
        .map((x) => x.id)
        .filter((id) => !videoIds.has(id));
      if (obsoleteVideos.length) {
        const { error } = await client
          .from("videos")
          .delete()
          .in("id", obsoleteVideos);
        if (error) throw error;
      }
      const { data: oldPhases, error: oldPhaseError } = await client
        .from("phases")
        .select("id");
      if (oldPhaseError) throw oldPhaseError;
      const obsoletePhases = oldPhases
        .map((x) => x.id)
        .filter((id) => !phaseIds.has(id));
      if (obsoletePhases.length) {
        const { error } = await client
          .from("phases")
          .delete()
          .in("id", obsoletePhases);
        if (error) throw error;
      }
      return send(res, 200, { ok: true, data: { saved: true } });
    }
    if (action === "leads.list") {
      if (!leadKinds.has(data.kind)) throw new Error("Invalid lead category.");
      const { data: rows, error } = await client
        .from("leads")
        .select("*")
        .eq("kind", data.kind)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return send(res, 200, { ok: true, data: rows.map(asLead) });
    }
    if (action === "leads.mark") {
      if (
        !leadKinds.has(data.kind) ||
        !Array.isArray(data.ids) ||
        !data.ids.length
      )
        throw new Error("Invalid lead update.");
      const patch = {};
      if (
        typeof data.status === "string" &&
        ["new", "contacted"].includes(data.status)
      )
        patch.status = data.status;
      if (typeof data.exported === "boolean") patch.exported = data.exported;
      if (!Object.keys(patch).length)
        throw new Error("No valid update provided.");
      const { error } = await client
        .from("leads")
        .update(patch)
        .eq("kind", data.kind)
        .in("id", data.ids);
      if (error) throw error;
      return send(res, 200, { ok: true, data: true });
    }
    if (action === "analytics") {
      const now = new Date();
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      const { data: rows, error } = await client
        .from("visits")
        .select("session_id,path,device,referrer,created_at")
        .gte("created_at", start.toISOString())
        .order("created_at")
        .limit(10000);
      if (error) throw error;
      const unique = (arr) => new Set(arr.map((x) => x.session_id)).size;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const week = new Date();
      week.setDate(week.getDate() - 6);
      const month = new Date();
      month.setDate(month.getDate() - 29);
      const year = new Date();
      year.setFullYear(year.getFullYear() - 1);
      const totalRows = rows || [];
      const count = (since) =>
        unique(totalRows.filter((r) => new Date(r.created_at) >= since));
      const chartStart = new Date(now);
      if (data.range === "day") chartStart.setHours(0, 0, 0, 0);
      else if (data.range === "week")
        chartStart.setDate(chartStart.getDate() - 6);
      else if (data.range === "month")
        chartStart.setDate(chartStart.getDate() - 29);
      else chartStart.setFullYear(chartStart.getFullYear() - 1);
      const chartRows = totalRows.filter(
        (r) => new Date(r.created_at) >= chartStart,
      );
      const bins = new Map();
      chartRows.forEach((r) => {
        const d = new Date(r.created_at);
        const key =
          data.range === "day"
            ? `${String(d.getHours()).padStart(2, "0")}:00`
            : data.range === "year"
              ? d.toLocaleDateString("en", { month: "short" })
              : data.range === "week"
                ? d.toLocaleDateString("en", { weekday: "short" })
                : String(d.getDate());
        if (!bins.has(key)) bins.set(key, new Set());
        bins.get(key).add(r.session_id);
      });
      const series =
        data.range === "day"
          ? Array.from({ length: 24 }, (_, i) => {
              const k = `${String(i).padStart(2, "0")}:00`;
              return { label: k, visitors: bins.get(k)?.size || 0 };
            })
          : [...bins].map(([label, s]) => ({ label, visitors: s.size }));
      const tally = (key) =>
        totalRows.reduce((o, r) => {
          const k = r[key] || "Direct";
          o[k] = (o[k] || 0) + 1;
          return o;
        }, {});
      const sources = totalRows.reduce((o, r) => {
        const k = r.referrer || "Direct";
        o[k] = (o[k] || 0) + 1;
        return o;
      }, {});
      return send(res, 200, {
        ok: true,
        data: {
          totals: {
            today: count(today),
            week: count(week),
            month: count(month),
            year: count(year),
          },
          series,
          devices: tally("device"),
          pages: tally("path"),
          sources,
        },
      });
    }
    if (action === "staff.list") {
      const { data: profiles, error } = await client
        .from("profiles")
        .select("id,name,username,role,active,email")
        .order("created_at");
      if (error) throw error;
      return send(res, 200, {
        ok: true,
        data: profiles.map((p) => ({
          id: p.id,
          name: p.name,
          username: p.username || p.email,
          email: p.email,
          role: p.role,
          active: p.active,
        })),
      });
    }
    if (action === "staff.save") {
      const email = String(data.email || data.username || "")
        .trim()
        .toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email))
        throw new Error("Enter a valid employee email address.");
      if (data.id) {
        if (data.password) {
          if (String(data.password).length < 8)
            throw new Error("Password must be at least 8 characters.");
          const { error } = await client.auth.admin.updateUserById(data.id, {
            password: data.password,
          });
          if (error) throw error;
        }
        const patch = {
          name: clean(data.name),
          username: clean(data.username || email),
          role: data.role === "admin" ? "admin" : "staff",
        };
        const { error } = await client
          .from("profiles")
          .update(patch)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        if (String(data.password || "").length < 8)
          throw new Error("Password must be at least 8 characters.");
        const { data: created, error } = await client.auth.admin.createUser({
          email,
          password: data.password,
          email_confirm: true,
          user_metadata: {
            name: clean(data.name),
            username: clean(data.username || email),
          },
        });
        if (error) throw error;
        const { error: pError } = await client.from("profiles").upsert({
          id: created.user.id,
          email,
          name: clean(data.name),
          username: clean(data.username || email),
          role: data.role === "admin" ? "admin" : "staff",
          active: true,
        });
        if (pError) throw pError;
      }
      return send(res, 200, { ok: true, data: { saved: true } });
    }
    if (action === "staff.setActive") {
      if (!data.id) throw new Error("Employee ID is required.");
      if (data.id === user.id && data.active === false)
        throw new Error("You cannot deactivate your own account.");
      const { error } = await client
        .from("profiles")
        .update({ active: Boolean(data.active) })
        .eq("id", data.id);
      if (error) throw error;
      return send(res, 200, { ok: true, data: true });
    }
    if (action === "email.send") {
      const apiKey = env("RESEND_API_KEY");
      if (!leadKinds.has(data.kind)) throw new Error("Invalid lead category.");
      if (!Array.isArray(data.ids) || !data.ids.length || data.ids.length > 100)
        throw new Error("Select between 1 and 100 recipients.");
      const { data: rows, error } = await client
        .from("leads")
        .select("id,data")
        .eq("kind", data.kind)
        .in("id", data.ids);
      if (error) throw error;
      const recipients = rows
        .map((r) => ({
          id: r.id,
          email: r.data?.email,
          name: `${r.data?.first_name || ""} ${r.data?.last_name || ""}`.trim(),
        }))
        .filter((r) => /^\S+@\S+\.\S+$/.test(r.email || ""));
      const messages = recipients.map((r) => ({
        from: env("EMAIL_FROM"),
        to: [r.email],
        subject: clean(data.subject).slice(0, 200),
        text: String(data.body || "")
          .replace(/\{\{\s*first_name\s*\}\}/g, r.name.split(" ")[0] || "there")
          .replace(/\{\{\s*name\s*\}\}/g, r.name || "there"),
      }));
      if (!messages.length)
        return send(res, 200, {
          ok: true,
          data: { sent: 0, failed: 0, skipped: data.ids.length },
        });
      const response = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(
          `Email provider rejected the batch: ${detail.slice(0, 300)}`,
        );
      }
      return send(res, 200, {
        ok: true,
        data: {
          sent: recipients.length,
          failed: 0,
          skipped: data.ids.length - recipients.length,
        },
      });
    }
    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    console.error("admin api:", error);
    const message = error?.message || "Unexpected server error.";
    const status = /only administrators|only admins|permission/i.test(message)
      ? 403
      : /sign in|session|account|deactivated|invalid/i.test(message)
        ? 401
        : 400;
    return send(res, status, { ok: false, error: message });
  }
}
