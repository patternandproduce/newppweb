import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { send, requireMethod, env } from "../server/http.js";

export default async function handler(req, res) {
  if (!requireMethod(req, res)) return;
  try {
    const bearer = req.headers.authorization || "";
    if (!bearer.startsWith("Bearer "))
      throw new Error("Please sign in to upload media.");
    const supabase = createClient(
      env("SUPABASE_URL"),
      env("SUPABASE_SECRET_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(bearer.slice(7));
    if (error || !user) throw new Error("Your session is invalid.");
    const { data: profile, error: pError } = await supabase
      .from("profiles")
      .select("role,active")
      .eq("id", user.id)
      .single();
    if (
      pError ||
      !profile?.active ||
      !["admin", "staff"].includes(profile.role)
    )
      throw new Error("You do not have permission to upload media.");
    const timestamp = Math.floor(Date.now() / 1000);
    const resourceType = req.body?.resourceType === "image" ? "image" : "video";
    const folder =
      resourceType === "image"
        ? "pattern-and-produce/thumbnails"
        : "pattern-and-produce/tutorials";
    const toSign = `folder=${folder}&timestamp=${timestamp}${env("CLOUDINARY_API_SECRET")}`;
    const signature = createHash("sha1").update(toSign).digest("hex");
    return send(res, 200, {
      ok: true,
      data: {
        timestamp,
        signature,
        folder,
        cloudName: env("CLOUDINARY_CLOUD_NAME"),
        apiKey: env("CLOUDINARY_API_KEY"),
        resourceType,
      },
    });
  } catch (e) {
    return send(res, 401, {
      ok: false,
      error: e.message || "Could not create upload signature.",
    });
  }
}
