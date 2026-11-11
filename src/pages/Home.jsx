import { useState } from 'react';
import { Link } from 'react-router-dom';
import Photo from '../components/Photo.jsx';
import Icon from '../components/Icon.jsx';
import VideoModal from '../components/VideoModal.jsx';
import usePageTitle from '../components/usePageTitle.js';
import { useLibrary, thumbOf } from '../lib/library.js';

const HALF = '(max-width:900px) 100vw, 50vw';
const FULL = '100vw';

/* Home video tile: shows the featured tutorial when one has been added in the admin, otherwise "coming soon". */
function HomeVideo({ lib }) {
  const [open, setOpen] = useState(null);
  const v = lib?.videos.find((x) => x.published !== false && x.youtubeId);
  if (!v) {
    return (
      <Photo name="studio" pos="50% 40%" sizes={HALF} className="video flat soon" style={{ '--ar': 1.7778 }} label="Tutorial video">
        <span className="tag">Tutorial video coming soon</span>
      </Photo>
    );
  }
  return (
    <>
      <div className="img video flat" style={{ '--ar': 1.7778 }} data-ready="" data-label={v.title}>
        <img src={thumbOf(v)} alt={v.title} width="320" height="180" loading="lazy" decoding="async" data-loaded="" />
        <button className="home-play" onClick={() => setOpen(v)} aria-label={`Play ${v.title}`}><span className="play"><Icon name="play" size={26} /></span></button>
        <span className="tag">{v.title}</span>
      </div>
      {open && <VideoModal video={open} phase={lib.phases.find((p) => p.id === open.phaseId)} onClose={() => setOpen(null)} />}
    </>
  );
}

export default function Home() {
  usePageTitle('');
  const lib = useLibrary();
  return (
    <div className="page">
      <section className="hero">
        <div className="eyebrow">Fashion Technology &middot; Manufacturing &middot; Skills</div>
        <h1>Where fashion design meets production.</h1>
        <p className="lead">Pattern &amp; Produce helps fashion brands turn ideas into precise, production-ready garments, and trains the people who make them. [Replace with your own words]</p>
        <Link className="btn" to="/contact?type=consult">Book a consultation</Link>
      </section>

      <div className="band dk"><section className="bleed">
        <div className="split">
          <HomeVideo lib={lib} />
          <div>
            <div className="eyebrow">Learn with us</div>
            <h2>Watch, learn and start creating.</h2>
            <p className="lead" style={{ marginTop: 0 }}>Short tutorials on pattern making, tech packs and garment construction. [Replace with your own words]</p>
            <Link className="btn" to="/workforce-upskilling">Explore</Link>
          </div>
        </div>
      </section></div>

      <section className="bleed">
        <div className="split">
          <Photo name="techpack" pos="50% 50%" sizes={HALF} className="flat" style={{ '--ar': 1.7778 }} label="FashionTech"><span className="tag">01 &nbsp;FashionTech</span></Photo>
          <div>
            <div className="eyebrow">FashionTech</div>
            <h2>From sketch to production-ready.</h2>
            <p className="lead" style={{ marginTop: 0 }}>Tech packs and fashion digitization that remove guesswork between design and factory.</p>
            <Link className="btn" to="/fashiontech">Learn more</Link>
          </div>
        </div>
      </section>

      <div className="dk"><section className="bleed">
        <div className="split rev">
          <Photo name="studio" pos="88% 70%" sizes={HALF} className="flat" style={{ '--ar': 1.524 }} label="Garment Manufacturing"><span className="tag">02 &nbsp;Manufacturing</span></Photo>
          <div>
            <div className="eyebrow">Garment Manufacturing</div>
            <h2>Production that scales with you.</h2>
            <p className="lead" style={{ marginTop: 0 }}>B2B manufacturing, fabric sourcing and automation for brands that want to grow.</p>
            <Link className="btn" to="/garment-manufacturing">Learn more</Link>
          </div>
        </div>
      </section></div>

      <section className="bleed">
        <div className="split">
          <Photo name="portrait" pos="50% 42%" sizes={HALF} className="flat" style={{ '--ar': 0.6667 }} label="Workforce Upskilling"><span className="tag">03 &nbsp;Workforce Upskilling</span></Photo>
          <div>
            <div className="eyebrow">Workforce Upskilling</div>
            <h2>Learn the skill. Grow the business.</h2>
            <p className="lead" style={{ marginTop: 0 }}>Train in fashion, book a consultation, or get guidance to upgrade your business.</p>
            <Link className="btn" to="/workforce-upskilling">Learn more</Link>
          </div>
        </div>
      </section>

      <div className="dk"><section>
        <div className="eyebrow">About us</div>
        <h2>About Pattern &amp; Produce</h2>
        <p className="lead">[Your brand story goes here: who you are, why you started, and what makes your approach different.]</p>
        <Photo name="studio" pos="50% 38%" sizes={FULL} className="framed" label="Lookbook" />
      </section></div>

      <section>
        <div className="eyebrow">Our work</div><h2>Selected projects</h2>
        <div className="grid">
          <figure className="work"><Photo name="techpack" pos="22% 50%" sizes="(max-width:720px) 100vw, 33vw" style={{ marginTop: 0 }} label="Tech pack" /><figcaption><span>01</span>FashionTech</figcaption></figure>
          <figure className="work"><Photo name="studio" pos="20% 92%" sizes="(max-width:720px) 100vw, 33vw" style={{ marginTop: 0 }} label="Production run" /><figcaption><span>02</span>Manufacturing</figcaption></figure>
          <figure className="work"><Photo name="portrait" pos="50% 30%" sizes="(max-width:720px) 100vw, 33vw" style={{ marginTop: 0 }} label="Training class" /><figcaption><span>03</span>Workforce Upskilling</figcaption></figure>
        </div>
      </section>

      <div className="dk banner">
        <Photo name="studio" pos="50% 40%" sizes={FULL} label="Banner" />
        <div className="shade" />
        <section style={{ textAlign: 'center' }}>
          <div className="eyebrow">Ready when you are</div>
          <h2>Let&rsquo;s start your project.</h2>
          <Link className="btn" to="/contact">Get in touch</Link>
        </section>
      </div>
    </div>
  );
}
