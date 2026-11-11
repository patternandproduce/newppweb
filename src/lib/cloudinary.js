import { supabase } from "./supabase.js";

export async function uploadToCloudinary(
  file,
  resourceType = "video",
  onProgress,
) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token)
    throw new Error("Please sign in again before uploading.");
  const signatureResponse = await fetch("/api/cloudinary-signature", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ resourceType }),
  });
  const signed = await signatureResponse.json();
  if (!signatureResponse.ok || !signed.ok)
    throw new Error(signed.error || "Could not prepare the upload.");
  const { timestamp, signature, folder, cloudName, apiKey } = signed.data;
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("folder", folder);
  body.append("signature", signature);
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
  const result = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      let parsed = {};
      try {
        parsed = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) resolve(parsed);
      else
        reject(new Error(parsed.error?.message || "Cloudinary upload failed."));
    };
    xhr.onerror = () =>
      reject(new Error("Network error while uploading to Cloudinary."));
    xhr.onabort = () => reject(new Error("Cloudinary upload was cancelled."));
    xhr.send(body);
  });
  onProgress?.(100);
  return {
    url: result.secure_url,
    publicId: result.public_id,
    duration: result.duration ? formatDuration(result.duration) : "",
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    format: result.format,
  };
}

function formatDuration(seconds) {
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}
