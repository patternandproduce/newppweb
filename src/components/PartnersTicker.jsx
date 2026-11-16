
const PARTNERS = [
  {
    // name: "CLOTHING LAMBS",
    logo: "/images/partners/clothinglambs.png",
  },
  {
//    name: "CLOTHING LAMBS",
    logo: "/images/partners/clothinglambs.png",

  },
  {
//  name: "CLOTHING LAMBS",
    logo: "/images/partners/clothinglambs.png",

  },
];

export default function PartnersTicker() {
  return (
    <section className="partners-section">
      <div className="partners-heading">
        <span className="eyebrow">OUR PARTNERS</span>
        <h2>COMPANIES WE WORK WITH</h2>
      </div>

      <div className="partners-grid">
        {PARTNERS.map((partner) => (
          <div className="partner-card" key={partner.name}>
            <img
              src={partner.logo}
              alt={`${partner.name} logo`}
              loading="lazy"
            />
            {/* <span>{partner.name}</span> */}
          </div>
        ))}
      </div>
    </section>
  );
}
