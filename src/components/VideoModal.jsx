import { useEffect } from 'react';
import Icon from './Icon.jsx';

export default function VideoModal({ video, phase, onClose }) {
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
          {video.provider === 'cloudinary' && video.videoUrl ? (
            <video src={video.videoUrl} controls autoPlay playsInline preload="metadata" poster={video.thumbnail || undefined} />
          ) : video.youtubeId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtubeId)}?autoplay=1&rel=0&modestbranding=1`}
              title={video.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen
            />
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
