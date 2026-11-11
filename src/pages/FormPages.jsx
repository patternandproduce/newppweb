import { RegisterForm, ContactForm, ContactList } from '../components/Forms.jsx';
import usePageTitle from '../components/usePageTitle.js';
import { Link } from 'react-router-dom';

export function Register() {
  usePageTitle('Register');
  return (
    <div className="page form-page">
      <div className="form-card">
        <div className="eyebrow">Join us</div>
        <h1 className="fh">Register with us</h1>
        <p className="lead" style={{ marginTop: 14 }}>Fill in the form below to apply for training at Pattern &amp; Produce.</p>
        <RegisterForm />
      </div>
    </div>
  );
}

const FAQ = [
  ['Do I need experience to join a course?', '[Add your answer: beginners are welcome, or list requirements.]'],
  ['How long are the courses and what do they cost?', '[Add duration, schedule and fees.]'],
  ['What is the minimum order for manufacturing?', '[Add your minimum order quantities.]'],
  ['How soon will you reply to my enquiry?', '[Add response time, for example within 24 hours.]'],
];
export function Contact() {
  usePageTitle('Contact us');
  return (
    <div className="page">
      <div className="form-page">
        <div className="form-card">
          <div className="eyebrow">Get in touch</div>
          <h1 className="fh">Contact us</h1>
          <p className="lead" style={{ marginTop: 14, marginBottom: 22 }}>Tell us what you need and we will reply as soon as we can.</p>
          <ContactForm />
        </div>
      </div>
      <section>
        <div className="two">
          <div><h3>Contact details</h3><ContactList /></div>
          <div>
            <h3>Questions</h3>
            {FAQ.map(([q, a]) => (<details key={q}><summary>{q}</summary><p>{a}</p></details>))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function NotFound() {
  usePageTitle('Page not found');
  return (
    <div className="page"><section className="hero"><div className="eyebrow">404</div><h1>Page not found.</h1><p className="lead">The page you are looking for does not exist.</p><Link className="btn" to="/">Back to home</Link></section></div>
  );
}
