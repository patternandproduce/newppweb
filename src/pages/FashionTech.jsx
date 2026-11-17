import { useState } from "react";
import { Link } from "react-router-dom";
import Photo from "../components/Photo.jsx";
import Slider from "../components/Slider.jsx";
import { ChecklistForm } from "../components/Forms.jsx";
import usePageTitle from "../components/usePageTitle.js";

const W = "(max-width:1100px) 100vw, 1100px";

const serviceGroups = [
  {
    title: "Product Development",
    items: [
      {
        title: "TECH PACK",
        description: [
          "Flat drawings",
          "Specification sheet",
          "Construction details",
          "BOM",
        ],
      },
      {
        title: "MATERIAL AND TEXTILE INNOVATION",
        description: [
          "Fabric research",
          "Textile sourcing",
          "Material development and sustainable solutions",
        ],
      },
      {
        title: "PATTERN MAKING",
      },
      {
        title: "PROTOTYPING",
      },
      {
        title: "PATTERN DIGITIZATION",
      },
    ],
  },
  {
    title: "Manufacturing Consultation",
    items: [
      {
        title: "GARMENT MANUFACTURING OPERATION FACILITY SETUP",
      },
      {
        title: "EQUIPMENT PURCHASE ADVISORY",
      },
      {
        title: "B.O.T. OPERATIONAL TRAINING MODEL",
      },
    ],
  },
  {
    title: "Sustainability",
    items: [
      {
        title: "SUSTAINABLE POWER OPTIMIZATION ARCHITECTURE",
      },
      {
        title: "INDUSTRY 4.0",
      },
      {
        title: "AUTOMATION",
      },
    ],
  },
];

export default function FashionTech() {
  usePageTitle("FashionTech");

  const [activeService, setActiveService] = useState(null);

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
        <h1>Tech packs &amp; fashion digitization.</h1>

        <p className="lead">
          Clear, complete technical documentation and digital samples, so your
          factory builds exactly what you designed.
        </p>
      </section>

      {/* OUR SERVICES */}
      <div className="band dk">
        <section>
          <h2>Our services</h2>

          <div className="grid service-grid">
            {serviceGroups.map((group, groupIndex) => (
              <div className="card service-card" key={group.title}>
                <h3>{group.title}</h3>

                <div className="service-list">
                  {group.items.map((item, itemIndex) => {
                    const itemId = `${groupIndex}-${itemIndex}`;
                    const isOpen = activeService === itemId;
                    const expandable = Boolean(item.description);
                    const descriptionId = `service-description-${itemId}`;

                    return (
                      <div
                        className={`service-item ${isOpen ? "is-open" : ""}`}
                        key={item.title}
                      >
                        {expandable ? (
                          <>
                            <button
                              type="button"
                              className="service-trigger"
                              aria-expanded={isOpen}
                              aria-controls={descriptionId}
                              onClick={() =>
                                setActiveService(isOpen ? null : itemId)
                              }
                            >
                              <span
                                className="service-marker"
                                aria-hidden="true"
                              />

                              <span className="service-title">
                                {item.title}
                              </span>

                              <span
                                className="service-plus"
                                aria-hidden="true"
                              />
                            </button>

                            {isOpen && (
                              <div
                                className="service-description"
                                id={descriptionId}
                              >
                                <ul>
                                  {item.description.map((description) => (
                                    <li key={description}>{description}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="service-static">
                            <span
                              className="service-marker"
                              aria-hidden="true"
                            />

                            <span className="service-title">{item.title}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* HOW IT WORKS */}
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

      {/* TECH PACK CHECKLIST */}
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
