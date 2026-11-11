import { Link } from 'react-router-dom';
import Photo from '../components/Photo.jsx';
import usePageTitle from '../components/usePageTitle.js';
import { useContent } from '../lib/library.js';

export default function Manufacturing() {
  usePageTitle('Garment Manufacturing');
  const c = useContent().manufacturing;
  return (
    <div className="page">
      <section className="hero">
        <div className="eyebrow">Garment Manufacturing</div>
        <h1>B2B manufacturing built to scale.</h1>
        <p className="lead">From fabric to finished garment, we manage production for fashion brands with quality, consistency and speed.</p>
      </section>
      <div className="band dk"><section>
        <h2>What we offer</h2>
        <div className="grid">
          <div className="card"><h3>B2B Fashion Manufacturing</h3><p>Small-batch to bulk production with quality control at every stage.</p></div>
          <div className="card"><h3>Fabric Sourcing</h3><p>Vetted suppliers, fabric matching and fair pricing for your collection.</p></div>
          <div className="card"><h3>Automation</h3><p>Smarter workflows and machinery that cut waste and lead times.</p></div>
        </div>
      </section></div>
      <section>
        <h2>Working with us</h2>
        <ul className="clean">
          <li><strong>Minimum order quantity:</strong> <span>{c.moq}</span></li>
          <li><strong>Typical lead time:</strong> <span>{c.leadTime}</span></li>
          <li><strong>Product categories:</strong> <span>{c.categories}</span></li>
        </ul>
        <Photo name="studio" pos="75% 75%" sizes="(max-width:1100px) 100vw, 1100px" label="Factory floor" />
        <Link className="btn" to="/contact?type=quote">Request a quote</Link>
      </section>
    </div>
  );
}
