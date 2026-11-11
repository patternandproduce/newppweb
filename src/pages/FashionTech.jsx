import { Link } from 'react-router-dom';
import Photo from '../components/Photo.jsx';
import Slider from '../components/Slider.jsx';
import { ChecklistForm } from '../components/Forms.jsx';
import usePageTitle from '../components/usePageTitle.js';

const W = '(max-width:1100px) 100vw, 1100px';
export default function FashionTech() {
  usePageTitle('FashionTech');
  const slides = [
    { caption: 'Technical flats', photo: <Photo name="techpack" className="fit" label="Technical flats" sizes={W} /> },
    { caption: 'Pattern drafting', photo: <Photo name="studio" pos="40% 40%" label="Pattern drafting" sizes={W} /> },
    { caption: 'Fabric and trims', photo: <Photo name="studio" pos="92% 85%" label="Fabric and trims" sizes={W} /> },
    { caption: 'Finished garments', photo: <Photo name="portrait" pos="50% 38%" label="Finished garments" sizes={W} /> },
  ];
  return (
    <div className="page">
      <section className="hero">
        <div className="eyebrow">FashionTech</div>
        <h1>Tech packs &amp; fashion digitization.</h1>
        <p className="lead">Clear, complete technical documentation and digital samples, so your factory builds exactly what you designed.</p>
      </section>
      <div className="band dk"><section>
        <h2>Our services</h2>
        <div className="grid">
          <div className="card"><h3>Tech Packs</h3><p>Flat sketches, measurements, construction details, bill of materials and grading.</p></div>
          <div className="card"><h3>Fashion Digitization</h3><p>Digital patterns, 3D garment samples and digital libraries of your designs.</p></div>
          <div className="card"><h3>Pattern Making</h3><p>Production-ready patterns, graded across your size range.</p></div>
        </div>
      </section></div>
      <section>
        <h2>How it works</h2>
        <ul className="clean"><li>1. Share your sketch or idea</li><li>2. We build the tech pack and digital sample</li><li>3. You review and approve</li><li>4. Hand off to production</li></ul>
        <Slider slides={slides} label="Tech pack gallery" />
        <Link className="btn" to="/contact?type=consult">Start a project</Link>
      </section>
      <div className="dk"><section>
        <div className="eyebrow">Free download</div>
        <h2>Tech pack checklist</h2>
        <p className="lead" style={{ marginTop: 0 }}>Enter your email and we will send you a checklist of everything a factory needs from your tech pack.</p>
        <ChecklistForm />
      </section></div>
    </div>
  );
}
