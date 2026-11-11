import Icon from './Icon.jsx';
import { thumbOf } from '../lib/library.js';
import { IMG } from '../lib/images.js';

/* Video card (dark, rounded, centred play button, duration badge, category dot). */
export default function VideoCard({ video, phase, onOpen, showText = false, eager = false }) {
  const live = !!(video.youtubeId || video.videoUrl);
  return (
    <article className="vc">
      <button className="vthumb" onClick={() => onOpen(video)} aria-label={`Play ${video.title}`}>
        <img
          src={thumbOf(video) || IMG.studio.src}
          alt="" width="320" height="180"
          loading={eager ? 'eager' : 'lazy'} decoding="async"
          style={thumbOf(video) ? undefined : { objectPosition: '45% 40%', filter: 'grayscale(1) brightness(.7)' }}
        />
        <span className="vplay"><Icon name="play" size={22} /></span>
        {video.duration && <span className="vdur">{video.duration}</span>}
        {!live && <span className="vsoon">Coming soon</span>}
      </button>
      <div className="vmeta">
        <h3>{video.title}</h3>
        {phase && <p className="vcat"><i style={{ background: phase.color }} />{phase.name}</p>}
        {showText && video.description && <p className="vdesc">{video.description}</p>}
      </div>
    </article>
  );
}
