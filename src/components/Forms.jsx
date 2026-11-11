import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { submitForm, fieldsOf, FAIL } from "../lib/api.js";
import { CONTACT } from "../config.js";
console.log("FORMS.JSX LOADED - TEST 001");
const LGAS = [
  "Agege",
  "Ajeromi-Ifelodun",
  "Alimosho",
  "Amuwo-Odofin",
  "Apapa",
  "Badagry",
  "Epe",
  "Eti-Osa",
  "Ibeju-Lekki",
  "Ifako-Ijaiye",
  "Ikeja",
  "Ikorodu",
  "Kosofe",
  "Lagos Island",
  "Lagos Mainland",
  "Mushin",
  "Ojo",
  "Oshodi-Isolo",
  "Shomolu",
  "Surulere",
];
const MOTIVES = [
  "To become self-reliant and financially independent",
  "To be able to work and sponsor myself through tertiary education",
  "To be able to make garments for myself and family, thereby helping to save on cost",
  "To understand the industrial process of garment production, thereby gathering experience for future employment",
  "To develop a career in fashion and garment making",
];

const Row = ({ children }) => <div className="row">{children}</div>;
const Field = ({ id, label, children }) => (
  <div>
    <label htmlFor={id}>{label}</label>
    {children}
  </div>
);
const YesNo = ({ name }) => (
  <div className="yn">
    <label className="opt">
      <input type="radio" name={name} value="Yes" required />
      <span>Yes</span>
    </label>
    <label className="opt">
      <input type="radio" name={name} value="No" />
      <span>No</span>
    </label>
  </div>
);

function useSubmit(kind, build) {
  const [state, setState] = useState("idle");

  const onSubmit = (e) => {
    e.preventDefault();

    console.log("FORM SUBMITTED:", kind);

    const form = e.currentTarget;

    if (!form.checkValidity()) {
      console.error("FORM VALIDATION FAILED");

      const invalidFields = [...form.elements]
        .filter((field) => !field.validity?.valid)
        .map((field) => ({
          name: field.name,
          value: field.value,
          message: field.validationMessage,
        }));

      console.table(invalidFields);
      form.reportValidity();
      return;
    }

    const f = fieldsOf(form);

    if (f.honey) {
      console.log("Spam protection triggered");
      setState("done");
      return;
    }

    const { data } = build(f, form);

    console.log("SUBMISSION DATA:", data);

    setState("busy");

    submitForm(kind, data)
      .then((result) => {
        console.log("SUBMISSION SUCCESS:", result);
        setState("done");
      })
      .catch((error) => {
        console.error("SUBMISSION ERROR:", error);
        setState("error");
      });
  };

  return [state, onSubmit];
}

export function RegisterForm() {
  const [age, setAge] = useState("");
  const [state, onSubmit] = useSubmit("registrations", (f) => {
    const d = {
      first_name: f.g("first_name"),
      last_name: f.g("last_name"),
      dob: f.g("dob"),
      age: f.g("age"),
      sex: f.g("sex"),
      school: f.g("school"),
      phone: f.g("phone"),
      email: f.g("email"),
      address: f.g("address"),
      lga: f.g("lga"),
      motivation: f.g("motivation"),
      can_devote: f.g("can_devote"),
      availability: f.g("availability"),
      parents_afford: f.g("parents_afford"),
      guardian_name: f.g("guardian_name"),
      guardian_phone: f.g("guardian_phone"),
      guardian_address: f.g("guardian_address"),
      page: location.href,
      submitted_at: new Date().toISOString(),
    };
    const name = `${d.first_name} ${d.last_name}`;
    const message = [
      `Name: ${name}`,
      `Date of birth: ${d.dob}`,
      `Age: ${d.age}`,
      `Sex: ${d.sex}`,
      `School: ${d.school}`,
      `Mobile: ${d.phone}`,
      `Email: ${d.email}`,
      `Address: ${d.address}`,
      `LGA: ${d.lga}`,
      "",
      `Why a garment industry skill will help: ${d.motivation}`,
      `Can devote time to learn: ${d.can_devote}`,
      `Availability: ${d.availability}`,
      `Parents can afford the training: ${d.parents_afford}`,
      "",
      `Parent/guardian: ${d.guardian_name}`,
      `Guardian mobile: ${d.guardian_phone}`,
      `Guardian address: ${d.guardian_address}`,
    ].join("\n");
    return { data: d };
  });
  if (state === "done")
    return (
      <div className="notice">
        Thank you for registering. We will contact you soon.
      </div>
    );
  const onDob = (e) => {
    if (!e.target.value) return;
    const d = new Date(e.target.value),
      n = new Date();
    let a = n.getFullYear() - d.getFullYear();
    const m = n.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && n.getDate() < d.getDate())) a--;
    if (a >= 0 && a < 120) setAge(String(a));
  };
  return (
    <form className="reg" onSubmit={onSubmit} noValidate>
      <fieldset>
        <Row>
          <Field id="r-first" label="First name">
            <input
              id="r-first"
              name="first_name"
              required
              autoComplete="given-name"
            />
          </Field>
          <Field id="r-last" label="Last name">
            <input
              id="r-last"
              name="last_name"
              required
              autoComplete="family-name"
            />
          </Field>
        </Row>
        <Row>
          <Field id="r-dob" label="Date of birth">
            <input
              id="r-dob"
              type="date"
              name="dob"
              required
              autoComplete="bday"
              onChange={onDob}
            />
          </Field>
          <Field id="r-age" label="Age">
            <input
              id="r-age"
              type="number"
              min="5"
              max="99"
              name="age"
              required
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </Field>
        </Row>
        <Row>
          <Field id="r-sex" label="Sex">
            <select id="r-sex" name="sex" required defaultValue="">
              <option value="">Select</option>
              <option>Female</option>
              <option>Male</option>
            </select>
          </Field>
          <Field id="r-school" label="School">
            <input id="r-school" name="school" required />
          </Field>
        </Row>
        <Row>
          <Field id="r-phone" label="Mobile number">
            <input
              id="r-phone"
              type="tel"
              name="phone"
              required
              autoComplete="tel"
            />
          </Field>
          <Field id="r-email" label="Email address">
            <input
              id="r-email"
              type="email"
              name="email"
              required
              autoComplete="email"
            />
          </Field>
        </Row>
        <Row>
          <Field id="r-address" label="Address">
            <input
              id="r-address"
              name="address"
              required
              autoComplete="street-address"
            />
          </Field>
          <Field id="r-lga" label="LGA">
            <input id="r-lga" name="lga" list="lgas" required />
            <datalist id="lgas">
              {LGAS.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </Field>
        </Row>
      </fieldset>
      <fieldset>
        <legend>
          Why do you think acquiring an operational skill in the garment
          industry would help you to be better equipped for the future?
        </legend>
        {MOTIVES.map((m) => (
          <label className="opt" key={m}>
            <input type="radio" name="motivation" value={m} required />
            <span>{m}</span>
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>
          Will you be able to devote your time to learn garment making if given
          the opportunity to learn at Pattern &amp; Produce?
        </legend>
        <YesNo name="can_devote" />
      </fieldset>
      <fieldset>
        <legend>How often will you be available to learn?</legend>
        <input
          name="availability"
          required
          placeholder="e.g. Monday to Friday, 10am to 2pm"
          aria-label="How often will you be available to learn?"
        />
      </fieldset>
      <fieldset>
        <legend>
          Will your parents be able to afford the cost of the training?
        </legend>
        <YesNo name="parents_afford" />
      </fieldset>
      <fieldset>
        <legend>Parent / guardian contact</legend>
        <Row>
          <Field id="g-name" label="Full name">
            <input id="g-name" name="guardian_name" required />
          </Field>
          <Field id="g-phone" label="Mobile number">
            <input id="g-phone" type="tel" name="guardian_phone" required />
          </Field>
        </Row>
        <Field id="g-address" label="Address">
          <input id="g-address" name="guardian_address" required />
        </Field>
      </fieldset>
      <input
        className="hp"
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      <p className={"err" + (state === "error" ? " show" : "")} role="alert">
        {FAIL}
      </p>
      <button
        className={"btn" + (state === "busy" ? " busy" : "")}
        style={{ marginTop: 0 }}
      >
        Register now
      </button>
    </form>
  );
}

export function ContactForm() {
  const [sp] = useSearchParams();
  const first =
    { quote: "quote", consult: "biz", learn: "learn" }[sp.get("type")] ||
    "learn";
  const [tab, setTab] = useState(first);
  const [state, onSubmit] = useSubmit("enquiries", (f) => {
    const type = {
      learn: "Learn fashion (training)",
      biz: "Consultation / business enquiry",
      quote: "Get quote",
    }[tab];
    const interest = f.g(
      tab === "learn"
        ? "interest_learn"
        : tab === "biz"
          ? "interest_biz"
          : "interest_quote",
    );
    const qty = tab === "quote" ? f.g("quantity") : "";
    const name = `${f.g("first_name")} ${f.g("last_name")}`.trim();
    const d = {
      first_name: f.g("first_name"),
      last_name: f.g("last_name"),
      email: f.g("reply_to"),
      phone: f.g("phone"),
      type: tab,
      enquiry_type: type,
      interest,
      quantity: qty,
      message: f.g("message"),
      page: location.href,
      submitted_at: new Date().toISOString(),
    };
    const message =
      (qty ? `Estimated quantity: ${qty}\n\n` : "") +
      (d.message || "(no message)");
    return { data: d };
  });
  if (state === "done")
    return <div className="notice">Thank you. We will be in touch soon.</div>;
  return (
    <>
      <div className="tabs" role="tablist">
        {[
          ["learn", "I want to learn fashion"],
          ["biz", "I need a consultation"],
          ["quote", "Get quote"],
        ].map(([k, l]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            className={tab === k ? "on" : ""}
            onClick={() => setTab(k)}
          >
            {l}
          </button>
        ))}
      </div>
      <form id="form" className="cf" onSubmit={onSubmit} noValidate>
        <Row>
          <Field id="f-first" label="First name">
            <input
              id="f-first"
              name="first_name"
              required
              autoComplete="given-name"
            />
          </Field>
          <Field id="f-last" label="Last name">
            <input
              id="f-last"
              name="last_name"
              required
              autoComplete="family-name"
            />
          </Field>
        </Row>
        <Row>
          <Field id="f-email" label="Email">
            <input
              id="f-email"
              type="email"
              name="reply_to"
              required
              autoComplete="email"
            />
          </Field>
          <Field id="f-phone" label="Phone / WhatsApp">
            <input id="f-phone" type="tel" name="phone" autoComplete="tel" />
          </Field>
        </Row>
        {tab === "learn" && (
          <Field id="f-learn" label="What would you like to learn?">
            <select id="f-learn" name="interest_learn">
              <option>Pattern making</option>
              <option>Sewing &amp; garment construction</option>
              <option>Tech packs &amp; digitization</option>
              <option>Not sure yet</option>
            </select>
          </Field>
        )}
        {tab === "biz" && (
          <Field id="f-biz" label="What do you need?">
            <select id="f-biz" name="interest_biz">
              <option>Fashion manufacturing enquiry</option>
              <option>Business consultation</option>
              <option>Upgrade my business</option>
            </select>
          </Field>
        )}
        {tab === "quote" && (
          <Row>
            <Field id="f-quote" label="Quote for">
              <select id="f-quote" name="interest_quote">
                <option>B2B garment manufacturing</option>
                <option>Fabric sourcing</option>
                <option>Tech packs &amp; digitization</option>
                <option>Automation</option>
                <option>Other</option>
              </select>
            </Field>
            <Field id="f-qty" label="Estimated quantity">
              <input id="f-qty" name="quantity" placeholder="e.g. 200 pieces" />
            </Field>
          </Row>
        )}
        <Field id="f-msg" label="Message">
          <textarea id="f-msg" name="message" rows="3" />
        </Field>
        <input
          className="hp"
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <p className={"err" + (state === "error" ? " show" : "")} role="alert">
          {FAIL}
        </p>
        <button
          className={"btn" + (state === "busy" ? " busy" : "")}
          style={{ marginTop: 0 }}
        >
          Send
        </button>
      </form>
    </>
  );
}

export function ChecklistForm() {
  const [state, setState] = useState("idle");
  if (state === "done")
    return <p>Thank you. We will send the checklist to your email.</p>;
  const onSubmit = (e) => {
    e.preventDefault();
    const em = new FormData(e.currentTarget).get("reply_to");
    setState("busy");
    submitForm("checklist", {
      email: em,
      page: location.href,
      submitted_at: new Date().toISOString(),
    })
      .then(() => setState("done"))
      .catch(() => {
        setState("idle");
        alert(FAIL);
      });
  };
  return (
    <form className="mini" onSubmit={onSubmit}>
      <input
        type="email"
        name="reply_to"
        placeholder="Your email"
        required
        aria-label="Your email"
      />
      <button className={"btn" + (state === "busy" ? " busy" : "")}>
        Send me the checklist
      </button>
    </form>
  );
}

export const ContactList = () => (
  <ul className="clean">
    <li>
      <strong>Email:</strong>{" "}
      <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
    </li>
    <li>
      <strong>Phone / WhatsApp:</strong>{" "}
      <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
    </li>
    <li>
      <strong>Address:</strong> {CONTACT.address}
    </li>
    <li>
      <strong>Hours:</strong> {CONTACT.hours}
    </li>
  </ul>
);
