import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import Icon from './Icon.jsx';

export default function VideoModal({ video, phase, onClose }) {
  const [playbackUrl, setPlaybackUrl] = useState("");
  const [playbackError, setPlaybackError] = useState("");
  const [loadingPlayback, setLoadingPlayback] = useState(false);
  useEffect(() => {
    let alive = true;
    setPlaybackUrl("");
    setPlaybackError("");
    if (video?.provider === "cloudinary" && video.cloudinaryPublicId) {
      setLoadingPlayback(true);
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) throw new Error("Please sign in again to watch this tutorial.");
          const response = await fetch("/api/tutorial-media", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ publicId: video.cloudinaryPublicId }),
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok || !result.ok) throw new Error(result.error || "This video is not available yet.");
          if (alive) setPlaybackUrl(result.data.url);
        } catch (error) { if (alive) setPlaybackError(error.message || "Could not authorise this video."); }
        finally { if (alive) setLoadingPlayback(false); }
      })();
    }
    return () => { alive = false; };
  }, [video?.id, video?.cloudinaryPublicId, video?.provider]);
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [onClose]);
  if (!video) return null;
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={video.title} onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" aria-label="Close" onClick={onClose}><Icon name="close" size={20} /></button>
        <div className="modal-video">
          {video.provider === 'cloudinary' && video.cloudinaryPublicId ? (
            playbackUrl ? <video src={playbackUrl} controls autoPlay playsInline preload="metadata" poster={video.thumbnail || undefined} /> : <div className="modal-soon">{playbackError || (loadingPlayback ? "Authorising secure playback…" : "Preparing video…")}</div>
          ) : video.youtubeId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtubeId)}?autoplay=1&rel=0&modestbranding=1`}
              title={video.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen
            />
          ) : video.provider === "youtube" ? (
            <div className="modal-soon">This older YouTube video must be replaced with a secure upload before it can be made available to students.</div>
          ) : (<div className="modal-soon">This tutorial is coming soon.</div>)}
        </div>
        <div className="modal-body">
          {phase && <p className="vcat"><i style={{ background: phase.color }} />{phase.name}{video.duration ? ` · ${video.duration}` : ''}</p>}
          <h3>{video.title}</h3>
          {video.description && <p>{video.description}</p>}
        </div>
      </div>
    </div>
  );
}
