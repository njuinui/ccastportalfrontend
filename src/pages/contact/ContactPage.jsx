import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { submitContact } from "../../api/public";

import SiteNavbar from "../../components/site/SiteNavbar";
import SiteFooter from "../../components/site/SiteFooter";

import useRevealOnScroll from "../../hooks/useRevealOnScroll";

import "../../styles/site.css";
import "./Contact.css";

/* ============================================================
   CONTACT INFORMATION
   ============================================================ */

const INFO_CARDS = [
  {
    icon: "fa-location-dot",
    eyebrow: "Our campus",
    title: "Visit Us",
    lines: [
      "CCAST Bambili",
      "Bambili, Bamenda",
      "North West Region, Cameroon",
    ],
  },
  {
    icon: "fa-envelope",
    eyebrow: "Email support",
    title: "Email Us",
    lines: [
      "info@ccastbambili.cm",
      "admissions@ccastbambili.cm",
    ],
  },
  {
    icon: "fa-phone",
    eyebrow: "Let's talk",
    title: "Call Us",
    lines: [
      "+237 233 33 00 00",
      "Mon – Fri: 8:00 AM – 5:00 PM",
    ],
  },
];

/* ============================================================
   INITIAL FORM
   ============================================================ */

const INITIAL_FORM = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

/* ============================================================
   CONSTANTS
   ============================================================ */

const MAX_MESSAGE_LENGTH = 1500;

/* ============================================================
   CONTACT FIELD
   ============================================================ */

function ContactField({
  label,
  field,
  type = "text",
  placeholder,
  required = false,
  col = "12",
  rows,
  value,
  error,
  onChange,
  disabled = false,
  maxLength,
}) {
  const id = `hp-cf-${field}`;
  const errorId = `${id}-err`;

  const commonProps = {
    id,
    name: field,
    value,
    placeholder,
    disabled,
    required,
    maxLength,
    autoComplete:
      field === "name"
        ? "name"
        : field === "email"
          ? "email"
          : field === "subject"
            ? "off"
            : undefined,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? errorId : undefined,
    onChange: (event) =>
      onChange(field, event.target.value),
  };

  return (
    <div className={`col-md-${col} mb-3`}>
      <div className="hp-cf-field">
        <label
          className="hp-cf-label"
          htmlFor={id}
        >
          <span>{label}</span>

          {required && (
            <span
              className="hp-cf-req"
              aria-label="required"
            >
              *
            </span>
          )}
        </label>

        <div
          className={`hp-cf-control ${
            error ? "hp-cf-control--error" : ""
          }`}
        >
          {field === "message" ? (
            <textarea
              {...commonProps}
              rows={rows || 6}
              className="hp-cf-input hp-cf-textarea"
            />
          ) : (
            <input
              {...commonProps}
              type={type}
              className="hp-cf-input"
            />
          )}

          {error && (
            <span
              className="hp-cf-error-icon"
              aria-hidden="true"
            >
              <i className="fas fa-circle-exclamation" />
            </span>
          )}
        </div>

        {error && (
          <div
            className="hp-cf-err"
            id={errorId}
            role="alert"
          >
            <i
              className="fas fa-circle-exclamation"
              aria-hidden="true"
            />

            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   CONTACT INFO CARD
   ============================================================ */

function ContactInfoCard({ card, index }) {
  const isEmail = card.title === "Email Us";
  const isPhone = card.title === "Call Us";

  return (
    <div
      className="hp-ct-card-row rv-t"
      style={{
        transitionDelay: `${index * 90}ms`,
      }}
    >
      <div
        className="hp-ct-card-ic"
        aria-hidden="true"
      >
        <span className="hp-ct-card-ic-ring">
          <i className={`fas ${card.icon}`} />
        </span>
      </div>

      <div className="hp-ct-card-body">
        <span className="hp-ct-card-eyebrow">
          {card.eyebrow}
        </span>

        <h3 className="hp-ct-card-t">
          {card.title}
        </h3>

        <div className="hp-ct-card-lines">
          {card.lines.map((line, lineIndex) => {
            if (isEmail && line.includes("@")) {
              return (
                <p
                  key={`${card.title}-${lineIndex}`}
                  className="hp-ct-card-l"
                >
                  <a
                    href={`mailto:${line}`}
                    style={{
                      color: "inherit",
                    }}
                    aria-label={`Email ${line}`}
                  >
                    {line}
                  </a>
                </p>
              );
            }

            if (
              isPhone &&
              line.startsWith("+237")
            ) {
              return (
                <p
                  key={`${card.title}-${lineIndex}`}
                  className="hp-ct-card-l"
                >
                  <a
                    href={`tel:${line.replace(
                      /\s+/g,
                      "",
                    )}`}
                    style={{
                      color: "inherit",
                    }}
                    aria-label={`Call ${line}`}
                  >
                    {line}
                  </a>
                </p>
              );
            }

            return (
              <p
                key={`${card.title}-${lineIndex}`}
                className="hp-ct-card-l"
              >
                {line}
              </p>
            );
          })}
        </div>
      </div>

      <span
        className="hp-ct-card-arrow"
        aria-hidden="true"
      >
        <i className="fas fa-arrow-up-right-from-square" />
      </span>
    </div>
  );
}

/* ============================================================
   MAP CARD
   ============================================================ */

function ContactMapCard() {
  return (
    <div
      className="hp-map rv-t"
      style={{
        transitionDelay: "300ms",
      }}
      aria-label="CCAST Bambili campus location"
    >
      <div className="hp-map-inner">
        <div
          className="hp-map-pattern"
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="hp-map-content">
          <div
            className="hp-map-pin"
            aria-hidden="true"
          >
            <i className="fas fa-location-dot" />
          </div>

          <div>
            <span className="hp-map-title">
              CCAST Bambili Campus
            </span>

            <small className="hp-map-location">
              Bambili, North West Region,
              Cameroon
            </small>
          </div>
        </div>

        <div className="hp-map-badge">
          <i
            className="fas fa-compass"
            aria-hidden="true"
          />

          <span>Our location</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FORM HEADER
   ============================================================ */

function ContactFormHeader() {
  return (
    <div className="hp-cf-head">
      <div
        className="hp-cf-head-icon"
        aria-hidden="true"
      >
        <i className="fas fa-paper-plane" />
      </div>

      <div>
        <span className="hp-cf-kicker">
          Get in touch
        </span>

        <h2>Send Us a Message</h2>

        <p>
          Have a question, suggestion, or need
          assistance? Complete the form and our
          team will get back to you.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   SUCCESS STATE
   ============================================================ */

function ContactSuccess({ onAnother }) {
  const successButtonRef = useRef(null);

  useEffect(() => {
    successButtonRef.current?.focus();
  }, []);

  return (
    <div
      className="hp-cf-success"
      role="status"
      aria-live="polite"
    >
      <div className="hp-cf-success-visual">
        <div className="hp-cf-success-ring">
          <i
            className="fas fa-check"
            aria-hidden="true"
          />
        </div>

        <span
          className="hp-cf-success-orbit hp-cf-success-orbit--one"
          aria-hidden="true"
        />

        <span
          className="hp-cf-success-orbit hp-cf-success-orbit--two"
          aria-hidden="true"
        />
      </div>

      <span className="hp-cf-success-kicker">
        Message received
      </span>

      <h2>Thank You for Reaching Out!</h2>

      <p>
        Your message has been sent successfully.
        Our team will review your request and get
        back to you within 1–2 business days.
      </p>

      <div className="hp-cf-success-note">
        <i
          className="fas fa-circle-info"
          aria-hidden="true"
        />

        <span>
          If your request is urgent, please contact
          us directly by phone.
        </span>
      </div>

      <button
        ref={successButtonRef}
        type="button"
        className="btn hp-cf-another"
        onClick={onAnother}
      >
        <i
          className="fas fa-pen"
          aria-hidden="true"
        />

        <span>Send Another Message</span>
      </button>
    </div>
  );
}

/* ============================================================
   CONTACT PAGE
   ============================================================ */

const ContactPage = () => {
  useRevealOnScroll();

  const [contactForm, setContactForm] =
    useState(INITIAL_FORM);

  const [contactSending, setContactSending] =
    useState(false);

  const [contactSent, setContactSent] =
    useState(false);

  const [contactErrors, setContactErrors] =
    useState({});

  const firstErrorRef = useRef(null);

  /* ----------------------------------------------------------
     Update field
  ---------------------------------------------------------- */

  const updateContact = useCallback(
    (field, value) => {
      setContactForm((previous) => ({
        ...previous,
        [field]: value,
      }));

      setContactErrors((previous) => {
        if (
          !previous[field] &&
          !previous.form
        ) {
          return previous;
        }

        const next = {
          ...previous,
        };

        delete next[field];
        delete next.form;

        return next;
      });
    },
    [],
  );

  /* ----------------------------------------------------------
     Validation
  ---------------------------------------------------------- */

  const validateContact = useCallback(() => {
    const errors = {};

    const name = contactForm.name.trim();
    const email = contactForm.email.trim();
    const subject = contactForm.subject.trim();
    const message = contactForm.message.trim();

    /* Name */

    if (!name) {
      errors.name =
        "Please enter your full name.";
    } else if (name.length < 2) {
      errors.name =
        "Your name must contain at least 2 characters.";
    } else if (name.length > 100) {
      errors.name =
        "Your name is too long.";
    }

    /* Email */

    if (!email) {
      errors.email =
        "Please enter your email address.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email,
      )
    ) {
      errors.email =
        "Please enter a valid email address.";
    }

    /* Subject */

    if (!subject) {
      errors.subject =
        "Please enter a subject.";
    } else if (subject.length < 3) {
      errors.subject =
        "Subject must contain at least 3 characters.";
    } else if (subject.length > 150) {
      errors.subject =
        "Subject must contain no more than 150 characters.";
    }

    /* Message */

    if (!message) {
      errors.message =
        "Please enter your message.";
    } else if (message.length < 10) {
      errors.message =
        "Your message should contain at least 10 characters.";
    } else if (
      message.length > MAX_MESSAGE_LENGTH
    ) {
      errors.message =
        `Your message must contain no more than ${MAX_MESSAGE_LENGTH} characters.`;
    }

    setContactErrors(errors);

    return errors;
  }, [contactForm]);

  /* ----------------------------------------------------------
     Focus first invalid field
  ---------------------------------------------------------- */

  useEffect(() => {
    if (
      Object.keys(contactErrors).length === 0
    ) {
      return;
    }

    const firstErrorField =
      [
        "name",
        "email",
        "subject",
        "message",
      ].find(
        (field) => contactErrors[field],
      );

    if (!firstErrorField) {
      return;
    }

    const element =
      document.getElementById(
        `hp-cf-${firstErrorField}`,
      );

    if (element) {
      firstErrorRef.current = element;

      requestAnimationFrame(() => {
        element.focus();
      });
    }
  }, [contactErrors]);

  /* ----------------------------------------------------------
     Submit
  ---------------------------------------------------------- */

  const handleContactSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (contactSending) {
      return;
    }

    const errors = validateContact();

    if (Object.keys(errors).length > 0) {
      toast.error(
        "Please correct the highlighted fields.",
      );

      return;
    }

    setContactSending(true);
    setContactErrors({});

    try {
      await submitContact({
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        subject: contactForm.subject.trim(),
        message: contactForm.message.trim(),
      });

      setContactSent(true);
      setContactForm(INITIAL_FORM);
      setContactErrors({});

      toast.success(
        "Message sent — we'll be in touch soon!",
      );
    } catch (error) {
      const fieldErrors =
        error?.fieldErrors ||
        error?.response?.data?.errors;

      if (
        fieldErrors &&
        typeof fieldErrors === "object"
      ) {
        const serverErrors = {};

        Object.entries(fieldErrors).forEach(
          ([field, value]) => {
            serverErrors[field] =
              Array.isArray(value)
                ? value[0]
                : String(value);
          },
        );

        setContactErrors(serverErrors);

        toast.error(
          "Please check the highlighted fields.",
        );
      } else {
        const message =
          error?.response?.data?.message ||
          "Something went wrong while sending your message. Please try again or contact us directly.";

        setContactErrors({
          form: message,
        });

        toast.error(
          "Couldn't send your message. Please try again.",
        );
      }
    } finally {
      setContactSending(false);
    }
  };

  /* ----------------------------------------------------------
     Reset success
  ---------------------------------------------------------- */

  const handleAnotherMessage = () => {
    setContactSent(false);
    setContactErrors({});
    setContactForm(INITIAL_FORM);
  };

  /* ----------------------------------------------------------
     Message character count
  ---------------------------------------------------------- */

  const messageLength =
    contactForm.message.length;

  /* ----------------------------------------------------------
     Render
  ---------------------------------------------------------- */

  return (
    <div className="hp hp-contact-page">
      <SiteNavbar />

      {/* ======================================================
          HERO
      ====================================================== */}

      <header className="hp-page-hero hp-contact-hero">
        <div
          className="hp-page-hero-grid"
          aria-hidden="true"
        />

        <div
          className="hp-contact-hero-glow hp-contact-hero-glow--one"
          aria-hidden="true"
        />

        <div
          className="hp-contact-hero-glow hp-contact-hero-glow--two"
          aria-hidden="true"
        />

        <div className="container-xl">
          <div className="hp-page-crumb">
            <Link to="/">
              <i
                className="fas fa-house"
                aria-hidden="true"
              />

              <span>Home</span>
            </Link>

            <i
              className="fas fa-chevron-right"
              aria-hidden="true"
            />

            <span aria-current="page">
              Contact
            </span>
          </div>

          <div className="hp-contact-hero-content">
            <span className="hp-contact-hero-kicker">
              <span
                className="hp-contact-hero-kicker-icon"
                aria-hidden="true"
              >
                <i className="fas fa-comments" />
              </span>

              We're here to help
            </span>

            <h1 className="hp-page-title">
              Let's Start a Conversation
            </h1>

            <p className="hp-page-sub">
              Have questions about CCAST Bambili,
              admissions, academics, or campus life?
              Reach out to our team and we'll be happy
              to assist you.
            </p>
          </div>
        </div>
      </header>

      {/* ======================================================
          CONTACT CONTENT
      ====================================================== */}

      <main className="hp-contact-main">
        <section
          className="hp-sec hp-contact-section"
          aria-labelledby="contact-section-title"
        >
          <div className="container-xl">
            {/* Section intro */}

            <div className="hp-contact-intro rv-t">
              <div>
                <span className="hp-section-kicker">
                  <i
                    className="fas fa-address-card"
                    aria-hidden="true"
                  />

                  Contact information
                </span>

                <h2
                  id="contact-section-title"
                  className="hp-contact-heading"
                >
                  Connect with CCAST Bambili
                </h2>
              </div>

              <p className="hp-contact-intro-text">
                Whether you're a prospective student,
                parent, current student, or member of
                our community, we're ready to hear from
                you.
              </p>
            </div>

            <div className="row g-4 g-xl-5 align-items-start">
              {/* ==================================================
                  LEFT COLUMN
              ================================================== */}

              <div className="col-lg-5">
                <div className="hp-ct-stack">
                  {INFO_CARDS.map(
                    (card, index) => (
                      <ContactInfoCard
                        key={card.title}
                        card={card}
                        index={index}
                      />
                    ),
                  )}
                </div>

                <ContactMapCard />

                {/* Office note */}

                <div
                  className="hp-contact-office-note rv-t"
                  style={{
                    transitionDelay: "360ms",
                  }}
                >
                  <div
                    className="hp-contact-office-icon"
                    aria-hidden="true"
                  >
                    <i className="fas fa-clock" />
                  </div>

                  <div>
                    <strong>
                      Office hours
                    </strong>

                    <p>
                      Monday – Friday · 8:00 AM –
                      5:00 PM
                    </p>
                  </div>
                </div>
              </div>

              {/* ==================================================
                  RIGHT COLUMN — FORM
              ================================================== */}

              <div
                className="col-lg-7 rv-t"
                style={{
                  transitionDelay: "120ms",
                }}
              >
                <div className="hp-cf-card">
                  {!contactSent ? (
                    <>
                      <ContactFormHeader />

                      {/* Form error */}

                      {contactErrors.form && (
                        <div
                          className="hp-cf-err hp-cf-err--form"
                          role="alert"
                        >
                          <span className="hp-cf-form-error-icon">
                            <i
                              className="fas fa-triangle-exclamation"
                              aria-hidden="true"
                            />
                          </span>

                          <span>
                            {contactErrors.form}
                          </span>
                        </div>
                      )}

                      <form
                        onSubmit={
                          handleContactSubmit
                        }
                        noValidate
                      >
                        <div className="row gx-3">
                          <ContactField
                            label="Full Name"
                            field="name"
                            placeholder="Enter your full name"
                            required
                            col="6"
                            value={
                              contactForm.name
                            }
                            error={
                              contactErrors.name
                            }
                            onChange={
                              updateContact
                            }
                            disabled={
                              contactSending
                            }
                            maxLength={100}
                          />

                          <ContactField
                            label="Email Address"
                            field="email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            col="6"
                            value={
                              contactForm.email
                            }
                            error={
                              contactErrors.email
                            }
                            onChange={
                              updateContact
                            }
                            disabled={
                              contactSending
                            }
                            maxLength={150}
                          />

                          <ContactField
                            label="Subject"
                            field="subject"
                            placeholder="How can we help?"
                            required
                            value={
                              contactForm.subject
                            }
                            error={
                              contactErrors.subject
                            }
                            onChange={
                              updateContact
                            }
                            disabled={
                              contactSending
                            }
                            maxLength={150}
                          />

                          <ContactField
                            label="Message"
                            field="message"
                            placeholder="Tell us how we can help..."
                            required
                            rows={6}
                            value={
                              contactForm.message
                            }
                            error={
                              contactErrors.message
                            }
                            onChange={
                              updateContact
                            }
                            disabled={
                              contactSending
                            }
                            maxLength={
                              MAX_MESSAGE_LENGTH
                            }
                          />

                          {/* Character count */}

                          <div className="col-12 mb-3">
                            <div
                              style={{
                                display: "flex",
                                justifyContent:
                                  "flex-end",
                                marginTop:
                                  "-0.55rem",
                                color:
                                  messageLength >
                                  MAX_MESSAGE_LENGTH *
                                    0.9
                                    ? "#dc2626"
                                    : "#94a3b8",
                                fontSize:
                                  "0.65rem",
                                fontWeight: 600,
                              }}
                              aria-live="polite"
                            >
                              {messageLength} /{" "}
                              {
                                MAX_MESSAGE_LENGTH
                              }
                            </div>
                          </div>
                        </div>

                        {/* Form footer */}

                        <div className="hp-cf-footer">
                          <div className="hp-cf-privacy">
                            <i
                              className="fas fa-shield-halved"
                              aria-hidden="true"
                            />

                            <span>
                              Your information is
                              handled securely and
                              used only to respond to
                              your request.
                            </span>
                          </div>

                          <button
                            type="submit"
                            className="btn hp-cf-submit"
                            disabled={
                              contactSending
                            }
                            aria-busy={
                              contactSending
                            }
                          >
                            {contactSending ? (
                              <>
                                <span
                                  className="login-spinner"
                                  aria-hidden="true"
                                />

                                <span>
                                  Sending message...
                                </span>
                              </>
                            ) : (
                              <>
                                <span>
                                  Send Message
                                </span>

                                <span
                                  className="hp-cf-submit-icon"
                                  aria-hidden="true"
                                >
                                  <i className="fas fa-arrow-right" />
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <ContactSuccess
                      onAnother={
                        handleAnotherMessage
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            BOTTOM CTA
        ====================================================== */}

        <section
          className="hp-contact-cta"
          aria-labelledby="contact-cta-title"
        >
          <div className="container-xl">
            <div className="hp-contact-cta-card rv-t">
              <div
                className="hp-contact-cta-pattern"
                aria-hidden="true"
              />

              <div
                className="hp-contact-cta-icon"
                aria-hidden="true"
              >
                <i className="fas fa-graduation-cap" />
              </div>

              <div className="hp-contact-cta-content">
                <span className="hp-contact-cta-kicker">
                  Thinking about joining us?
                </span>

                <h2 id="contact-cta-title">
                  Ready to become part of CCAST
                  Bambili?
                </h2>

                <p>
                  Explore our admissions information
                  and discover the opportunities waiting
                  for you at CCAST.
                </p>
              </div>

              <Link
                to="/admissions"
                className="hp-contact-cta-btn"
              >
                <span>
                  Explore Admissions
                </span>

                <i
                  className="fas fa-arrow-right"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default ContactPage;