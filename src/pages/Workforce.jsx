import { useState } from 'react';
import { Link } from 'react-router-dom';
import Photo from '../components/Photo.jsx';
import Icon from '../components/Icon.jsx';
import VideoCard from '../components/VideoCard.jsx';
import VideoModal from '../components/VideoModal.jsx';
import usePageTitle from '../components/usePageTitle.js';
import { useLibrary } from '../lib/library.js';
import { CONTACT } from '../config.js';

const TUT = '/workforce-upskilling/tutorials';
const pick = (lib) => {
  const live = lib.videos.filter((v) => v.published !== false);
  return [...live.filter((v) => v.featured), ...live.filter((v) => !v.featured)].slice(0, 4);
};

export default function Workforce() {
  usePageTitle('Workforce Upskilling');
  const lib = useLibrary();
  const [open, setOpen] = useState(null);
  const shown = lib ? pick(lib) : null;
  const toVideos = (e) => { e.preventDefault(); document.getElementById('tutorials')?.scrollIntoView({ behavior: 'smooth' }); };
  return (
    <div className="page wf">
      <section className="wf-hero dk">
        <div className="wf-copy">
          <div className="eyebrow">Skill &bull; Learn &bull; Grow</div>
          <h1>Workforce <span className="soft">Upskilling</span></h1>
          <p className="lead">Build in-demand skills with our expert-led tutorials and training programs. Upskill today for a better tomorrow.</p>
          <a className="btn-fill" href="#tutorials" onClick={toVideos}>Explore tutorials <Icon name="arrow" size={18} /></a>
        </div>
        <div className="wf-photo"><Photo name="portrait" pos="50% 28%" sizes="(max-width:860px) 100vw, 60vw" eager className="bare" /></div>
      </section>

      <section className="wf-sec dk" id="tutorials">
        <div className="wf-head">
          <div>
            <h2 className="wf-title">Tutorial <span className="soft">Video</span> Gallery</h2>
            <p className="lead" style={{ marginTop: 14 }}>Watch step-by-step tutorials and learn at your own pace.</p>
          </div>
          <Link className="pill" to={TUT}>View all videos <Icon name="arrow" size={16} /></Link>
        </div>
        <div className="vgrid">
          {shown
            ? shown.map((v) => (<VideoCard key={v.id} video={v} phase={lib.phases.find((p) => p.id === v.phaseId)} onOpen={setOpen} />))
            : [0, 1, 2, 3].map((k) => (<div className="vc sk" key={k}><div className="vthumb" /><div className="vmeta"><h3>&nbsp;</h3><p className="vcat">&nbsp;</p></div></div>))}
        </div>
        <div className="wf-more"><Link className="btn-fill" to={TUT}>Explore <Icon name="arrow" size={18} /></Link></div>
      </section>

      <section className="wf-sec dk" id="register-band">
        <div className="reg-band">
          <div className="reg-photo"><Photo name="studio" pos="36% 45%" sizes="(max-width:900px) 100vw, 45vw" className="bare" /></div>
          <div className="reg-copy">
            <span className="bar2" />
            <h2>Register With Us</h2>
            <p>Join our learning community and get access to expert tutorials, training resources and updates.</p>
            <div className="reg-row">
              <ul className="checks">
                {['Free and easy registration', 'Hands-on garment making training', 'Get training updates'].map((t) => (<li key={t}><span><Icon name="check" size={14} /></span>{t}</li>))}
              </ul>
              <Link className="btn-fill dark" to="/register">Register <Icon name="arrow" size={18} /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="wf-sec dk" id="contact-band">
        <div className="ct-grid">
          <div className="ct-copy">
            <span className="bar2" />
            <h2>Contact <span className="soft">Us</span></h2>
            <p>Have questions or need support? We&rsquo;re here to help.</p>
            <div className="ct-items">
              <div><span className="ico"><Icon name="mail" size={18} /></span><div><h3>Email us</h3><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></div></div>
              <div><span className="ico"><Icon name="phone" size={18} /></span><div><h3>Call us</h3><a href={CONTACT.phoneHref}>{CONTACT.phone}</a></div></div>
              <div><span className="ico"><Icon name="pin" size={18} /></span><div><h3>Our office</h3><span>{CONTACT.address}</span></div></div>
              <div><span className="ico"><Icon name="clock" size={18} /></span><div><h3>Hours</h3><span>{CONTACT.hours}</span></div></div>
            </div>
          </div>
          <div className="ct-div" />
          <div className="ct-card">
            <h3>Send us a message</h3>
            <p>Ask a question, book a consultation or request a quote. We will reply as soon as we can.</p>
            <Link className="btn-fill" to="/contact">Contact us now <Icon name="arrow" size={18} /></Link>
          </div>
        </div>
      </section>
      {open && <VideoModal video={open} phase={lib.phases.find((p) => p.id === open.phaseId)} onClose={() => setOpen(null)} />}
    </div>
  );
}
