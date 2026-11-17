import marsdenLogo from "../assets/img/marsden.jpg";
import clothingLambsLogo from "../assets/img/cllogo.jpg";
import aso_ase from "../assets/img/aso_ase.jpg";

const PARTNERS = [
  { name: "Marsden", logo: marsdenLogo },
  { name: "Clothing Lambs", logo: clothingLambsLogo },
  { name: "Aso Ase", logo: aso_ase }
];

export default function PartnersTicker() {
  return (
    <section className="partners-section" aria-labelledby="partners-heading">
      <div className="partners-heading">
        {/* <span className="eyebrow">OUR PARTNERS</span> */}
        <h2 id="partners-heading">OUR PARTNERS</h2>
      </div>
      <div className="partners-grid">
        {PARTNERS.map((partner) => (
          <div className="partner-card" key={partner.name}>
            <img src={partner.logo} alt={`${partner.name} logo`} loading="lazy" />
            {/* <span>{partner.name}</span> */}
          </div>
        ))}
      </div>
    </section>
  );
}
