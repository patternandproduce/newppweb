import { createClient } from "@supabase/supabase-js";
import { send, requireMethod, env } from "../server/http.js";
import { buildStudentApplicationEmail } from "../server/email-templates/student-application-notification.js";

const db = () =>
  createClient(env("SUPABASE_URL"), env("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
const formTables = {
  // The Contact page is one form with three tabs; all variants are stored in
  // its own table and distinguished by data.type.
  training: "contact_submissions",
  consultations: "contact_submissions",
  quotes: "contact_submissions",
  contacts: "contact_submissions",
  checklist: "checklist_requests",
};
const contactTypeFilters = {
  training: "learn",
  consultations: "biz",
  quotes: "quote",
};
const legacyLeadKind = (kind) => (kind === "training" ? "contacts" : kind);
const leadKinds = new Set(["registrations", ...Object.keys(formTables)]);
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
  const { data: staffProfile } = await client
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  let profile = staffProfile;
  if (!profile) {
    const { data: application, error: applicationError } = await client
      .from("student_applications")
      .select("user_id,email,full_name,status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (applicationError || !application)
      throw new Error(
        "Your account is not registered as staff or an applicant.",
      );
    profile = {
      id: user.id,
      email: application.email,
      name: application.full_name,
      username: application.email,
      role: "student",
      active: application.status === "approved",
      approval_status: application.status,
    };
  }
  if (!profile.active) throw new Error("Your account is not active.");
  if (profile.role === "student" && profile.approval_status !== "approved")
    throw new Error(
      "Your student account is awaiting approval or is not authorised.",
    );
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
    if (action === "student.status") {
      const header = req.headers.authorization || "";
      const accessToken = header.startsWith("Bearer ") ? header.slice(7) : "";
      if (!accessToken) throw new Error("Please sign in to continue.");
      const client = db();
      const {
        data: { user },
        error: userError,
      } = await client.auth.getUser(accessToken);
      if (userError || !user)
        throw new Error("Your session is invalid or expired.");
      const { data: staffProfile } = await client
        .from("profiles")
        .select("id,email,name,role,active,approval_status")
        .eq("id", user.id)
        .maybeSingle();
      if (staffProfile) {
        return send(res, 200, {
          ok: true,
          data: {
            role: staffProfile.role,
            active: staffProfile.active,
            approvalStatus: staffProfile.approval_status || "approved",
          },
        });
      }
      const { data: application, error } = await client
        .from("student_applications")
        .select("user_id,email,full_name,status")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error || !application)
        throw new Error("Your student application could not be found.");
      return send(res, 200, {
        ok: true,
        data: {
          role: "student",
          active: application.status === "approved",
          approvalStatus: application.status,
        },
      });
    }

    if (action === "student.application.submit") {
      const userId = String(data.userId || "");
      const email = String(data.email || "")
        .trim()
        .toLowerCase();
      const submitted =
        data.data && typeof data.data === "object" ? data.data : {};
      const application = { ...submitted };
      delete application.password;
      delete application.confirm_password;
      delete application.company;
      delete application.website_url;
      if (!/^[0-9a-f-]{36}$/i.test(userId) || !/^\S+@\S+\.\S+$/.test(email))
        throw new Error(
          "The student account details are invalid. Please try again.",
        );
      const client = db();
      const { data: authResult, error: authError } =
        await client.auth.admin.getUserById(userId);
      if (
        authError ||
        !authResult?.user ||
        String(authResult.user.email || "").toLowerCase() !== email
      )
        throw new Error(
          "We could not verify the student account. Please try registering again.",
        );
      const { data: existing, error: existingError } = await client
        .from("student_applications")
        .select("id,status")
        .eq("user_id", userId)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existing)
        throw new Error(
          "An application already exists for this account. Please sign in or contact us for help.",
        );
      const fullName =
        `${clean(application.first_name).trim()} ${clean(application.last_name).trim()}`.trim();
      const { error: appError } = await client
        .from("student_applications")
        .insert({
          user_id: userId,
          email,
          full_name: fullName,
          data: application,
          status: "pending",
        });
      if (appError) {
        if (appError.code === "23505")
          throw new Error(
            "An application already exists for this account. Please sign in or contact us for help.",
          );
        // Do not leave an Auth account behind when its application could not be saved.
        const { error: cleanupError } =
          await client.auth.admin.deleteUser(userId);
        if (cleanupError)
          console.error(
            "Could not roll back incomplete student account:",
            cleanupError.message,
          );
        throw appError;
      }

      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env("RESEND_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: env("EMAIL_FROM"),
            to: [
              process.env.CONTACT_NOTIFY_EMAIL || "root@patternandproduce.com",
            ],
            subject: `New Student Registration – ${fullName || email}`,
            html: buildStudentApplicationEmail({
              fullName,
              email,
              application,
              submittedAt: application.submitted_at,
              adminUrl: "https://www.patternandproduce.com/admin",
            }),
          }),
        });

        if (!response.ok) {
          console.error(
            "Student application notification failed:",
            (await response.text()).slice(0, 500),
          );
        }
      } catch (mailError) {
        console.error(
          "Student application notification failed:",
          mailError?.message,
        );
      }

      return send(res, 200, {
        ok: true,
        data: { accepted: true, status: "pending" },
      });
    }

    if (action === "library.get") {
      const hasBearer = (req.headers.authorization || "").startsWith("Bearer ");
      let query = db();
      let includePlayback = false;
      let sessionRole = "visitor";
      if (hasBearer) {
        const session = await authUser(req, false);
        query = session.client;
        includePlayback = true;
        sessionRole = session.profile.role;
      }
      const { data: phases, error: pe } = await query
        .from("phases")
        .select("*")
        .order("sort_order");
      let videoQuery = query
        .from("videos")
        .select(
          includePlayback
            ? "*"
            : "id,title,description,thumbnail_url,phase_id,duration,sort_order,published,featured",
        )
        .order("sort_order");
      videoQuery = videoQuery.eq("published", true);
      const { data: videos, error: ve } = await videoQuery;
      if (pe) throw pe;
      if (ve) throw ve;
      return send(res, 200, {
        ok: true,
        data: {
          phases: (phases || []).map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description || "",
            color: p.color,
            icon: p.icon,
            order: p.sort_order,
          })),
          videos: (videos || []).map((v) => ({
            id: v.id,
            ...(includePlayback
              ? {
                  provider: v.provider,
                  youtubeId: sessionRole === "student" ? null : v.youtube_id,
                  cloudinaryPublicId: v.cloudinary_public_id,
                  videoUrl:
                    sessionRole === "student" && v.provider === "cloudinary"
                      ? null
                      : v.video_url,
                }
              : {}),
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
      const table = formTables[kind];
      if (!table) throw new Error("Invalid submission type.");
      const payload =
        data.data && typeof data.data === "object" ? data.data : {};
      if (payload.website_url)
        return send(res, 200, {
          ok: true,
          data: { accepted: true, spam: true },
        });
      const email = String(payload.email || "")
        .trim()
        .toLowerCase();
      if (kind === "checklist" && !/^\S+@\S+\.\S+$/.test(email))
        throw new Error("Please enter a valid email address.");
      const { data: saved, error } = await db()
        .from(table)
        .insert({ data: payload, status: "new", exported: false })
        .select("id")
        .single();
      if (error) throw error;

      // The checklist request is stored first, then the promised checklist is emailed to the visitor.
      let checklistEmailSent = null;
      if (kind === "checklist") {
        const checklistText = [
          "PATTERN & PRODUCE — TECH PACK CHECKLIST",
          "",
          "Before sending a garment into production, make sure your tech pack includes:",
          "1. Style name, style number, season and revision date.",
          "2. Front, back and relevant detail technical flats.",
          "3. Construction details, stitch types and seam finishes.",
          "4. Measurement specification sheet with points of measure and tolerances.",
          "5. Size range and graded measurement chart.",
          "6. Bill of materials: fabrics, trims, labels, threads and accessories.",
          "7. Fabric composition, weight, colour and approved supplier/reference.",
          "8. Colourways, artwork, print/embroidery placement and dimensions.",
          "9. Label, packaging, folding and finishing instructions.",
          "10. Sample comments, approved references and revision history.",
          "",
          "Use this list as a final hand-off check and ensure every specification is clear and approved before bulk production.",
          "",
          "Pattern & Produce Limited",
        ].join("\n");
        checklistEmailSent = false;
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env("RESEND_API_KEY")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: env("EMAIL_FROM"),
              to: [email],
              subject: "Your Pattern & Produce Tech Pack Checklist",
              text: checklistText,
            }),
          });
          checklistEmailSent = response.ok;
          if (!response.ok)
            console.error(
              "Checklist delivery failed:",
              (await response.text()).slice(0, 500),
            );
        } catch (mailError) {
          console.error("Checklist delivery failed:", mailError?.message);
        }
        // The saved request is authoritative. Do not make the visitor resubmit if email delivery is temporarily unavailable.
      }
      try {
        const response = await fetch("https://api.resend.com/emails", {
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
            subject: `New ${kind} form submission received`,
            text: `A new ${kind} submission has been received. Review it in the corresponding admin section.\nEmail: ${email || "Not provided"}\nRecord ID: ${saved.id}`,
          }),
        });
        if (!response.ok)
          console.error(
            "Form notification failed:",
            (await response.text()).slice(0, 300),
          );
      } catch (mailError) {
        console.error("Form notification failed:", mailError?.message);
      }
      return send(res, 200, {
        ok: true,
        data: { accepted: true, emailSent: checklistEmailSent, id: saved.id },
      });
    }

    if (action === "visit") {
      const sid = clean(data.sid).slice(0, 100);
      const path = clean(data.path).slice(0, 300);
      if (!sid || !path || path.startsWith("/admin"))
        return send(res, 200, { ok: true, data: true });

      const getHeader = (name) => {
        const value = req.headers[name];
        return typeof value === "string" ? value : "";
      };

      const decodeLocation = (value) => {
        try {
          return decodeURIComponent(value);
        } catch {
          return value;
        }
      };

      const { error } = await db()
        .from("visits")
        .insert({
          session_id: sid,
          path,
          device: clean(data.device).slice(0, 30),
          referrer: clean(data.ref).slice(0, 200),

          // Approximate visitor location from Vercel
          country_code: getHeader("x-vercel-ip-country").slice(0, 2),
          city: decodeLocation(getHeader("x-vercel-ip-city")).slice(0, 100),
          region: decodeLocation(getHeader("x-vercel-ip-country-region")).slice(
            0,
            100,
          ),
          timezone: getHeader("x-vercel-ip-timezone").slice(0, 100),
        });

      if (error) throw error;
      return send(res, 200, { ok: true, data: true });
    }

    // Newsletter authorization

    if (action === "newsletter.subscribe") {
      const email = String(data.email || "")
        .trim()
        .toLowerCase();
      const city = clean(data.city).trim().slice(0, 100) || null;
      const country = clean(data.country).trim().slice(0, 100) || null;
      const interests = Array.isArray(data.interests)
        ? data.interests
            .map((x) => clean(x).trim().slice(0, 80))
            .filter(Boolean)
            .slice(0, 20)
        : [];

      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return send(res, 400, {
          ok: false,
          error: "Please enter a valid email address.",
        });
      }

      // Save the subscriber in Supabase
      const { error } = await db()
        .from("newsletter_subscribers")
        .insert({ email, city, country, interests });

      // Treat an existing email as an already completed subscription
      if (error?.code === "23505") {
        return send(res, 200, {
          ok: true,
          data: { message: "You are already subscribed." },
        });
      }

      if (error) {
        console.error("Newsletter database error:", error);
        return send(res, 500, {
          ok: false,
          error: "We couldn't process your subscription. Please try again.",
        });
      }

      // Send a notification only. The subscriber record stays in Supabase.
      try {
        const response = await fetch("https://api.resend.com/emails", {
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
            subject: "New newsletter subscriber",
            text: "A new visitor has subscribed to the Pattern & Produce newsletter. Please check your admin dashboard.",
          }),
        });

        if (!response.ok) {
          console.error(
            "Newsletter notification failed:",
            await response.text(),
          );
        }
      } catch (mailError) {
        console.error("Newsletter notification failed:", mailError?.message);
      }

      return send(res, 200, {
        ok: true,
        data: { message: "Subscription successful." },
      });
    }
    //.....
    const adminNewsletterActions = new Set([
      "newsletter.list",
      "newsletter.update",
      "newsletter.delete",
      "newsletter.send",
    ]);
    const { client, user, profile } = await authUser(
      req,
      adminNewsletterActions.has(action) ||
        action === "staff.list" ||
        action === "staff.save" ||
        action === "staff.setActive" ||
        action === "students.list" ||
        action === "students.setStatus",
    );
    if (action === "me") return send(res, 200, { ok: true, data: profile });

    if (action === "newsletter.list") {
      const { data: rows, error } = await client
        .from("newsletter_subscribers")
        .select(
          "id,email,city,country,interests,tags,created_at,unsubscribed_at",
        )
        .order("created_at", { ascending: false })
        .limit(10000);
      if (error) throw error;
      return send(res, 200, { ok: true, data: rows || [] });
    }

    if (action === "newsletter.update") {
      if (!data.id) throw new Error("Subscriber ID is required.");
      const patch = {
        city: clean(data.city).trim().slice(0, 100) || null,
        country: clean(data.country).trim().slice(0, 100) || null,
        interests: Array.isArray(data.interests)
          ? data.interests
              .map((x) => clean(x).trim().slice(0, 80))
              .filter(Boolean)
              .slice(0, 20)
          : [],
        tags: Array.isArray(data.tags)
          ? data.tags
              .map((x) => clean(x).trim().slice(0, 50))
              .filter(Boolean)
              .slice(0, 30)
          : [],
      };
      const { error } = await client
        .from("newsletter_subscribers")
        .update(patch)
        .eq("id", data.id);
      if (error) throw error;
      return send(res, 200, { ok: true, data: { updated: true } });
    }

    if (action === "newsletter.delete") {
      if (!data.id) throw new Error("Subscriber ID is required.");
      const { error } = await client
        .from("newsletter_subscribers")
        .delete()
        .eq("id", data.id);
      if (error) throw error;
      return send(res, 200, { ok: true, data: { deleted: true } });
    }

    if (action === "newsletter.send") {
      const subject = clean(data.subject)
        .replace(/[\r\n]+/g, " ")
        .trim()
        .slice(0, 200);
      const body = clean(data.body).trim();
      const imageUrl = clean(data.imageUrl).trim();
      if (!subject || !body)
        throw new Error("Add an email subject and message.");
      if (imageUrl && !/^https:\/\//i.test(imageUrl))
        throw new Error("The newsletter image must use a secure HTTPS URL.");
      if (
        !Array.isArray(data.ids) ||
        !data.ids.length ||
        data.ids.length > 10000
      )
        throw new Error("Select at least one subscriber before sending.");
      let query = client
        .from("newsletter_subscribers")
        .select(
          "id,email,city,country,interests,tags,created_at,unsubscribe_token",
        )
        .is("unsubscribed_at", null)
        .order("created_at", { ascending: true });
      if (Array.isArray(data.ids) && data.ids.length)
        query = query.in("id", data.ids);
      const { data: recipients, error } = await query.limit(10000);
      if (error) throw error;
      const safeRecipients = (recipients || []).filter((r) =>
        /^\S+@\S+\.\S+$/.test(r.email || ""),
      );
      if (!safeRecipients.length)
        throw new Error("There are no active subscribers in this selection.");
      const escapeHtml = (value) =>
        String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\"/g, "&quot;")
          .replace(/'/g, "&#39;");
      const origin = `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`;
      const htmlBody = body
        .split(/\r?\n/)
        .map((line) =>
          line
            ? `<p style=\"margin:0 0 14px;line-height:1.65\">${escapeHtml(line)}</p>`
            : `<div style=\"height:8px\"></div>`,
        )
        .join("");
      const apiKey = env("RESEND_API_KEY");
      let sent = 0,
        failed = 0;
      for (let i = 0; i < safeRecipients.length; i += 100) {
        const batch = safeRecipients.slice(i, i + 100).map((r) => {
          const unsubscribe = `${origin}/api/newsletter-unsubscribe?token=${encodeURIComponent(r.unsubscribe_token || "")}`;
          const image = imageUrl
            ? `<img src=\"${escapeHtml(imageUrl)}\" alt=\"\" style=\"display:block;width:100%;max-width:640px;height:auto;margin:0 0 24px;border:0\" />`
            : "";
          return {
            from: env("EMAIL_FROM"),
            to: [r.email],
            subject,
            html: `<div style=\"font-family:Arial,sans-serif;color:#222;max-width:640px;margin:0 auto;padding:24px\">${image}${htmlBody}<hr style=\"border:0;border-top:1px solid #ddd;margin:28px 0 14px\"><p style=\"font-size:12px;color:#777;line-height:1.5\">You are receiving this email because you subscribed to Pattern &amp; Produce updates. <a href=\"${unsubscribe}\">Unsubscribe</a></p></div>`,
            text: `${body}\n\nUnsubscribe: ${unsubscribe}`,
          };
        });
        try {
          const response = await fetch("https://api.resend.com/emails/batch", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(batch),
          });
          if (!response.ok) {
            failed += batch.length;
            console.error(
              "Newsletter batch failed:",
              (await response.text()).slice(0, 500),
            );
          } else sent += batch.length;
        } catch (mailError) {
          failed += batch.length;
          console.error("Newsletter batch error:", mailError?.message);
        }
      }
      return send(res, 200, {
        ok: true,
        data: { sent, failed, total: safeRecipients.length },
      });
    }

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
      if (data.kind === "registrations") {
        const { data: rows, error } = await client
          .from("leads")
          .select("*")
          .eq("kind", "registrations")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return send(res, 200, { ok: true, data: rows.map(asLead) });
      }
      const table = formTables[data.kind];
      let query = client
        .from(table)
        .select("*")
        .order("created_at", { ascending: false });
      if (contactTypeFilters[data.kind])
        query = query.eq("data->>type", contactTypeFilters[data.kind]);
      const { data: rows, error } = await query;
      if (error) throw error;
      const { data: legacy, error: legacyError } = await client
        .from("leads")
        .select("*")
        .eq("kind", legacyLeadKind(data.kind))
        .order("created_at", { ascending: false });
      if (legacyError) throw legacyError;
      const legacyRows = (legacy || []).filter(
        (r) =>
          !contactTypeFilters[data.kind] ||
          r.data?.type === contactTypeFilters[data.kind],
      );
      const current = (rows || []).map((r) => ({
        id: r.id,
        kind: data.kind,
        data: r.data || {},
        status: r.status,
        exported: r.exported,
        createdAt: r.created_at,
      }));
      return send(res, 200, {
        ok: true,
        data: [...current, ...legacyRows.map(asLead)].sort((a, b) =>
          String(b.createdAt).localeCompare(String(a.createdAt)),
        ),
      });
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
      if (data.kind === "registrations") {
        const { error } = await client
          .from("leads")
          .update(patch)
          .eq("kind", data.kind)
          .in("id", data.ids);
        if (error) throw error;
      } else {
        const table = formTables[data.kind];
        const { error } = await client
          .from(table)
          .update(patch)
          .in("id", data.ids);
        if (error) throw error;
        // Also update historical records that were stored in the former shared leads table.
        const { error: legacyError } = await client
          .from("leads")
          .update(patch)
          .eq("kind", legacyLeadKind(data.kind))
          .in("id", data.ids);
        if (legacyError) throw legacyError;
      }
      return send(res, 200, { ok: true, data: true });
    }
    if (action === "analytics") {
      const now = new Date();
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      const { data: rows, error } = await client
        .from("visits")
        .select(
          "session_id,path,device,referrer,country_code,city,region,timezone,created_at",
        )
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
      const countries = totalRows.reduce((o, r) => {
        const k = r.country_code || "Unknown";
        o[k] = (o[k] || 0) + 1;
        return o;
      }, {});

      const locations = totalRows.reduce((o, r) => {
        const city = r.city || "Unknown city";
        const country = r.country_code || "Unknown country";
        const k = `${city}, ${country}`;
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
          countries,
          locations,
        },
      });
    }
    if (action === "students.list") {
      const { data: applications, error } = await client
        .from("student_applications")
        .select("id,user_id,email,full_name,data,status,created_at,reviewed_at")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return send(res, 200, {
        ok: true,
        data: (applications || []).map((r) => ({
          id: r.user_id,
          applicationId: r.id,
          email: r.email,
          name: r.full_name,
          data: r.data || {},
          status: r.status,
          createdAt: r.created_at,
          reviewedAt: r.reviewed_at,
        })),
      });
    }
    if (action === "students.setStatus") {
      const id = String(data.id || "");
      const status = String(data.status || "");
      if (
        !/^[0-9a-f-]{36}$/i.test(id) ||
        !["approved", "denied", "revoked"].includes(status)
      )
        throw new Error("Choose a valid student and access status.");
      const { data: updatedApplication, error: appError } = await client
        .from("student_applications")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("user_id", id)
        .select("user_id")
        .maybeSingle();
      if (appError) throw appError;
      if (!updatedApplication)
        throw new Error("Student application not found.");
      return send(res, 200, { ok: true, data: { updated: true, status } });
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
          approval_status: "approved",
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
          approval_status: "approved",
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
      let rows = [];
      if (data.kind === "registrations") {
        const { data: found, error } = await client
          .from("leads")
          .select("id,data")
          .eq("kind", data.kind)
          .in("id", data.ids);
        if (error) throw error;
        rows = found || [];
      } else {
        const table = formTables[data.kind];
        const { data: found, error } = await client
          .from(table)
          .select("id,data")
          .in("id", data.ids);
        if (error) throw error;
        rows = found || [];
        const missingIds = data.ids.filter(
          (id) => !rows.some((r) => r.id === id),
        );
        if (missingIds.length) {
          const { data: legacy, error: legacyError } = await client
            .from("leads")
            .select("id,data")
            .eq("kind", legacyLeadKind(data.kind))
            .in("id", missingIds);
          if (legacyError) throw legacyError;
          rows = rows.concat(legacy || []);
        }
      }
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
