import marsdenLogo from "../assets/img/marsden.jpg";
import clothingLambsLogo from "../assets/img/cllogo.jpg";

const PARTNERS = [
  { name: "Marsden", logo: marsdenLogo },
  { name: "Clothing Lambs", logo: clothingLambsLogo },
];

export default function PartnersTicker() {
  return (
    <section className="partners-section" aria-labelledby="partners-heading">
      <div className="partners-heading">
        <span className="eyebrow">OUR PARTNERS</span>
        <h2 id="partners-heading">Organisations we work with</h2>
      </div>
      <div className="partners-grid">
        {PARTNERS.map((partner) => (
          <div className="partner-card" key={partner.name}>
            <img src={partner.logo} alt={`${partner.name} logo`} loading="lazy" />
            <span>{partner.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
