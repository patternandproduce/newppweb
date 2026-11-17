import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { send, requireMethod, env } from "../server/http.js";

const db = () => createClient(env("SUPABASE_URL"), env("SUPABASE_SECRET_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

export default async function handler(req, res) {
  if (!requireMethod(req, res)) return;
  try {
    const bearer = req.headers.authorization || "";
    if (!bearer.startsWith("Bearer ")) throw new Error("Please sign in to watch this tutorial.");
    const client = db();
    const { data: { user }, error: userError } = await client.auth.getUser(bearer.slice(7));
    if (userError || !user) throw new Error("Your session is invalid or expired.");
    const { data: profile, error: profileError } = await client.from("profiles")
      .select("role,active,approval_status").eq("id", user.id).single();
    if (profileError || !profile?.active || !["admin", "staff"].includes(profile.role) && !(profile.role === "student" && profile.approval_status === "approved"))
      throw new Error("Only approved students can watch this tutorial.");

    const publicId = String(req.body?.publicId || "").trim();
    if (!publicId || publicId.length > 500) throw new Error("Tutorial video not found.");
    const { data: video, error } = await client.from("videos")
      .select("id,provider,cloudinary_public_id,video_url,published")
      .eq("cloudinary_public_id", publicId).eq("published", true).maybeSingle();
    if (error || !video || video.provider !== "cloudinary") throw new Error("Tutorial video not found.");

    // Existing uploads with the default 'upload' delivery type are public and must be re-uploaded.
    const storedUrl = String(video.video_url || "");
    if (!storedUrl.includes("/video/authenticated/"))
      throw new Error("This tutorial is not yet stored privately. Please contact the administrator while it is being secured.");
    const pathname = new URL(storedUrl).pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]+)$/);
    const format = (match?.[1] || "mp4").toLowerCase();
    const expiresAt = Math.floor(Date.now() / 1000) + 2 * 60 * 60;
    const timestamp = Math.floor(Date.now() / 1000);
    const params = `expires_at=${expiresAt}&format=${format}&public_id=${publicId}&timestamp=${timestamp}&type=authenticated`;
    const signature = createHash("sha1").update(`${params}${env("CLOUDINARY_API_SECRET")}`).digest("hex");
    const cloud = env("CLOUDINARY_CLOUD_NAME");
    const apiKey = env("CLOUDINARY_API_KEY");
    const query = new URLSearchParams({ expires_at: String(expiresAt), format, public_id: publicId, timestamp: String(timestamp), type: "authenticated", signature, api_key: apiKey }).toString();
    const url = `https://api.cloudinary.com/v1_1/${cloud}/video/download?${query}`;
    return send(res, 200, { ok: true, data: { url, expiresAt } });
  } catch (e) {
    return send(res, 403, { ok: false, error: e.message || "Could not authorise this tutorial." });
  }
}
