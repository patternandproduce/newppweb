import { Suspense, useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { CONTACT } from "../config.js";
import { watch } from "../lib/reveal.js";
import brandLogo from "../assets/img/pploogo.svg";

import {
  FaEnvelope,
  FaInstagram,
  FaRegCommentDots,
  FaNewspaper,
  FaWhatsapp,
} from "react-icons/fa";

const NAV = [
  ["/fashiontech", "FashionTech"],
  ["/garment-manufacturing", "Garment Manufacturing"],
  ["/workforce-upskilling", "Workforce Upskilling"],
];

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 20);
    const k = (e) => e.key === "Escape" && setOpen(false);
    const r = () => window.innerWidth > 860 && setOpen(false);
    s();
    window.addEventListener("scroll", s, { passive: true });
    document.addEventListener("keydown", k);
    window.addEventListener("resize", r);
    return () => {
      window.removeEventListener("scroll", s);
      document.removeEventListener("keydown", k);
      window.removeEventListener("resize", r);
    };
  }, []);
  return (
    <header className={(open ? "open " : "") + (scrolled ? "scrolled" : "")}>
      <Link className="logo brand-lockup" to="/" title="Home">
        <img src={brandLogo} alt="" aria-hidden="true" />
        <span>Pattern &amp; Produce</span>
      </Link>
      <nav id="nav">
        {NAV.map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => (isActive ? "on" : "")}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <button
        className="menu"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="nav"
        onClick={() => setOpen(!open)}
      >
        <span />
        <span />
        <span />
      </button>
    </header>
  );
}

// function Footer() {
//   return (
//     <footer className="dk" style={{ alignItems: 'flex-start', paddingTop: 60, paddingBottom: 60 }}>
//       <div>
//         <div className="logo" style={{ color: 'var(--ink)' }}>Pattern &amp; Produce</div>
//         <p style={{ maxWidth: '30ch', marginTop: 8 }}>Fashion technology, manufacturing and skills.</p>
//         <p style={{ marginTop: 24 }}>&copy; Pattern and Produce Limited</p>
//       </div>
//       <div>
//         <div className="eyebrow">Explore</div>
//         <Link to="/">Home</Link>
//         <Link to="/fashiontech">FashionTech</Link>
//         <Link to="/garment-manufacturing">Garment Manufacturing</Link>
//         <Link to="/workforce-upskilling">Workforce Upskilling</Link>
//       </div>
//       <div>
//         <div className="eyebrow">Get in touch</div>
//         <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
//         <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
//         <Link to="/">LinkedIn</Link>
//         {/* <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a> */}
//       </div>
//     </footer>
//   );
// }
// New Footer Section

function Footer() {
  const [email, setEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) return;

    setNewsletterLoading(true);
    setNewsletterMessage("");

    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "newsletter.subscribe",
          data: {
            email: cleanEmail,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || "Subscription failed. Please try again.",
        );
      }

      setNewsletterMessage("Thank you for subscribing!");
      setEmail("");
    } catch (error) {
      console.error("Newsletter subscription error:", error);

      setNewsletterMessage(
        error.message || "Something went wrong. Please try again.",
      );
    } finally {
      setNewsletterLoading(false);
    }
  };
  return (
    <footer
      className="dk site-footer"
      style={{
        padding: "40px 5%",
        display: "grid",
        gridTemplateColumns: "50% 25% 25%",
        columnGap: 0,
        rowGap: 24,
        alignItems: "start",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Stay connected */}
      <div style={{ minWidth: 0, paddingRight: 40 }}>
        <div
          className="eyebrow"
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
          <FaNewspaper size={20} />
          <span>Newsletter</span>
        </div>

        <h2 style={{ marginTop: 8, maxWidth: "100%", lineHeight: 1.1 }}>
          stay in the loop
        </h2>

        <p style={{ maxWidth: "100%", marginTop: 8, lineHeight: 1.4 }}>
          Subscribe to our newsletter for updates on fashion technology,
          manufacturing, training <br /> and new opportunities.
        </p>

        <form
          onSubmit={handleSubscribe}
          style={{
            display: "flex",
            gap: 12,
            width: "100%",
            maxWidth: 520,
            marginTop: 16,
            borderBottom: "1px solid currentColor",
            paddingBottom: 8,
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "inherit",
              font: "inherit",
            }}
          />

          <button
            type="submit"
            aria-label="Subscribe"
            disabled={newsletterLoading}
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              fontSize: 22,
            }}
          >
            {newsletterLoading ? "..." : "→"}
          </button>
        </form>

        {newsletterMessage && <p role="status">{newsletterMessage}</p>}
      </div>

      {/* Explore */}
      <div style={{ minWidth: 0, paddingLeft: 24 }}>
        <div className="eyebrow">Explore</div>

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <Link to="/">Home</Link>
          <Link to="/fashiontech">FashionTech</Link>
          <Link to="/garment-manufacturing">Garment Manufacturing</Link>
          <Link to="/workforce-upskilling">Workforce Upskilling</Link>
        </div>
      </div>

      {/* Contact */}

      <div style={{ minWidth: 0, paddingLeft: 24 }}>
        <div className="eyebrow">Contact</div>

        <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
          <a
            href={`mailto:${CONTACT.email}`}
            aria-label="Email us"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
            }}
          >
            <FaEnvelope size={18} />
            <span>Email us</span>
          </a>

          <a
            href={CONTACT.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit our Instagram"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
            }}
          >
            <FaInstagram size={18} />
            <span>Instagram</span>
          </a>

          <Link
            to="/contact"
            aria-label="Send an enquiry"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
            }}
          >
            <FaRegCommentDots size={18} />
            <span>Send an enquiry</span>
          </Link>
        </div>
      </div>

      {/* Copyright */}
      <div
        style={{
          gridColumn: "1 / -1",
          borderTop: "1px solid rgba(255,255,255,0.18)",
          paddingTop: 14,
          marginTop: 4,
        }}
      >
        <p>© {new Date().getFullYear()} PATTERN & PRODUCE LIMITED</p>
      </div>
    </footer>
  );
}

function ProgressBar() {
  const ref = useRef(null);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (ref.current)
          ref.current.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
      });
    };
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    on();
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, []);
  return <div className="bar" ref={ref} />;
}

export default function Layout() {
  const { pathname } = useLocation();
  const main = useRef(null);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  useEffect(() => watch(main.current), []);
  return (
    <>
      <ProgressBar />
      <Header />
      <main ref={main}>
        <Suspense fallback={<div className="route-line" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <a
        className="wa"
        href={CONTACT.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        title="Chat on WhatsApp"
      >
        <FaWhatsapp />
      </a>
    </>
  );
}
