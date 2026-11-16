import { Link } from "react-router-dom";
import Photo from "../components/Photo.jsx";
import Slider from "../components/Slider.jsx";
import { ChecklistForm } from "../components/Forms.jsx";
import usePageTitle from "../components/usePageTitle.js";

const W = "(max-width:1100px) 100vw, 1100px";
export default function FashionTech() {
  usePageTitle("FashionTech");
  const slides = [
    {
      caption: "Technical flats",
      photo: (
        <Photo
          name="techpack"
          className="fit"
          label="Technical flats"
          sizes={W}
        />
      ),
    },
    {
      caption: "Pattern drafting",
      photo: (
        <Photo name="studio" pos="40% 40%" label="Pattern drafting" sizes={W} />
      ),
    },
    {
      caption: "Fabric and trims",
      photo: (
        <Photo name="studio" pos="92% 85%" label="Fabric and trims" sizes={W} />
      ),
    },
    {
      caption: "Finished garments",
      photo: (
        <Photo
          name="portrait"
          pos="50% 38%"
          label="Finished garments"
          sizes={W}
        />
      ),
    },
  ];
  return (
    <div className="page">
      <section className="hero">
        {/* <div className="eyebrow">FashionTech</div> */}
        <h1>Tech packs &amp; fashion digitization.</h1>
        <p className="lead">
          Clear, complete technical documentation and digital samples, so your
          factory builds exactly what you designed.
        </p>
      </section>
      <div className="band dk">
        <section>
          <h2>Our services</h2>
          <div className="grid">
            <div className="card">
              <h3>Product Development</h3>
              <p>
                TECH PACK
                <li>
                  Flat drawings, specification sheet, construction details, and
                  BOM.
                </li>
                PATTERN MAKING <br /> PROTOTYPING <br />
Pattern Digitization <br />
                Material and textile innovation <br />
                <li>Fabric research</li>
                <li>textile sourcing</li>
                <li>material development and sustainable solution</li>

              </p>
            </div>
            <div className="card">
              <h3>Manufacturing Consultation</h3>
              <p>
                {/* Production Consultation */}
                <ul>
                  <li>Garment manufacturing operation facility setup</li>
                  <li>Equipment Purchase Advisory</li>
                  <li>BOT operational training model</li>
                </ul>
            
              </p>
            </div>
            <div className="card">
              <h3>Sustainability </h3>
              <p>
              <li>Sustainable Power Optimization Architecture </li>
              <li>Industry 4.0 </li>
              <li>Automation</li>
                {/* Production-ready patterns, graded across your size range. */}
              </p>
            </div>
          </div>
        </section>
      </div>
      <section>
        <h2>How it works</h2>
        <ul className="clean">
          <li>1. Production line process and client onboarding</li>
          <li>2. Production development</li>
          <li>3. You review and approve</li>
          <li>4. Hand off to production</li>
        </ul>
        <Slider slides={slides} label="Tech pack gallery" />
        <Link className="btn" to="/contact?type=consult">
          Start a project
        </Link>
      </section>
      <div className="dk">
        <section>
          <div className="eyebrow">Free download</div>
          <h2>Tech pack checklist</h2>
          <p className="lead" style={{ marginTop: 0 }}>
            Enter your email and we will send you a checklist of everything a
            factory needs from your tech pack.
          </p>
          <ChecklistForm />
        </section>
      </div>
    </div>
  );
}
