// ============================================================
// CCAST BAMBILI — ABOUT PAGE
// Premium Institutional Experience
// ============================================================

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import SiteNavbar from "../../components/site/SiteNavbar";
import SiteFooter from "../../components/site/SiteFooter";
import Testimonials from "../../components/home/Testimonials";
import useRevealOnScroll from "../../hooks/useRevealOnScroll";

import Bursar from "../../assets/images/about/bursar.png";
import DisciplineMaster from "../../assets/images/about/disciplinemaster.png";
import Proprietor from "../../assets/images/about/proprietor.png";
import Principal from "../../assets/images/about/principal.png";
import VicePrincipal from "../../assets/images/about/viceprincipal.png";
import Liberian from "../../assets/images/about/liberian.png";
import SenoirDisciplineMaster from "../../assets/images/about/seniordisciplinemaster.png";

import CampusImage from "../../assets/images/about/campus.png";

import "../../styles/site.css";
import "./About.css";

/* ============================================================
   MISSION / VISION / VALUES
============================================================ */

const VALUES = [
  {
    icon: "fa-bullseye",
    title: "Mission",
    short: "Purpose",
    desc:
      "To train competent professionals through quality teaching, research, practical learning, and meaningful community service.",
  },
  {
    icon: "fa-eye",
    title: "Vision",
    short: "Direction",
    desc:
      "To be a centre of excellence in technical and professional education, producing graduates equipped for Africa and the world.",
  },
  {
    icon: "fa-handshake",
    title: "Integrity",
    short: "Character",
    desc:
      "We uphold honesty, transparency, responsibility, accountability, and respect in every aspect of institutional life.",
  },
  {
    icon: "fa-lightbulb",
    title: "Innovation",
    short: "Progress",
    desc:
      "We embrace creativity, technology, research, and modern approaches that continuously improve teaching and learning.",
  },
  {
    icon: "fa-award",
    title: "Excellence",
    short: "Standard",
    desc:
      "We pursue high standards in academics, professional development, student character, leadership, and service.",
  },
];

/* ============================================================
   ADMINISTRATION / LEADERSHIP TEAM
============================================================ */

const ADMINISTRATORS = [
  {
    id: "proprietor",
    image: Proprietor,
    role: "Proprietor",
    title: "Proprietor",
    name: "CCAST Bambili",
    icon: "fa-user-tie",
    description:
      "Providing strategic leadership and institutional direction while supporting the long-term growth and development of CCAST Bambili.",
  },

  {
    id: "principal",
    image: Principal,
    role: "School Principal",
    title: "Principal",
    name: "Principal",
    icon: "fa-user-graduate",
    description:
      "Providing academic and administrative leadership while ensuring high standards of teaching, discipline, student welfare, and institutional excellence.",
  },

  {
    id: "vice-principal",
    image: VicePrincipal,
    role: "Vice Principal",
    title: "Vice Principal",
    name: "Vice Principal",
    icon: "fa-user-shield",
    description:
      "Supporting the Principal in the effective coordination of academic activities, student development, staff collaboration, and school operations.",
  },

  {
    id: "senior-discipline-master",
    image: SenoirDisciplineMaster,
    role: "Senior Discipline Master",
    title: "Senior Discipline Master",
    name: "Senior Discipline Master",
    icon: "fa-scale-balanced",
    description:
      "Promoting discipline, responsibility, respect, positive conduct, and a safe learning environment for every student.",
  },

  {
    id: "bursar",
    image: Bursar,
    role: "Bursar",
    title: "Bursar",
    name: "Bursar",
    icon: "fa-coins",
    description:
      "Managing the school's financial administration and supporting transparent, accountable, and efficient financial operations.",
  },

  {
    id: "librarian",
    image: Liberian,
    role: "Librarian",
    title: "Librarian",
    name: "Librarian",
    icon: "fa-book-open",
    description:
      "Supporting students and staff with access to learning resources, research materials, reading culture, and knowledge discovery.",
  },

  {
    id: "discipline-master",
    image: DisciplineMaster,
    role: "Discipline Master",
    title: "Discipline Master",
    name: "Discipline Master",
    icon: "fa-clipboard-check",
    description:
      "Helping students develop good conduct, accountability, respect, punctuality, and the values required for responsible citizenship.",
  },
];

/* ============================================================
   ABOUT POINTS
============================================================ */

const ABOUT_POINTS = [
  "38+ years of institutional experience",
  "8,000+ graduates and alumni",
  "Modern laboratories and learning spaces",
  "Practical and career-oriented education",
  "Experienced and committed faculty",
  "Strong academic and professional pathways",
];

/* ============================================================
   COUNT UP COMPONENT
============================================================ */

const CountUp = ({
  end,
  suffix = "",
  duration = 1800,
}) => {
  const [count, setCount] = useState(0);

  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return undefined;
    }

    const reduceMotion =
      typeof window !== "undefined" &&
      window
        .matchMedia?.(
          "(prefers-reduced-motion: reduce)"
        )
        .matches;

    if (reduceMotion) {
      setCount(end);

      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            !entry.isIntersecting ||
            started.current
          ) {
            return;
          }

          started.current = true;

          const startTime = performance.now();

          const animate = (currentTime) => {
            const progress = Math.min(
              (currentTime - startTime) / duration,
              1
            );

            const eased =
              1 - Math.pow(1 - progress, 3);

            setCount(
              Math.round(eased * end)
            );

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        });
      },
      {
        threshold: 0.35,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
};

/* ============================================================
   ADMINISTRATOR CARD
============================================================ */

const AdministratorCard = ({
  administrator,
  index,
}) => {
  const [imageError, setImageError] =
    useState(false);

  return (
    <article
      className="about-admin-card rv-t"
      style={{
        transitionDelay: `${index * 70}ms`,
      }}
    >
      {/* IMAGE */}
      <div className="about-admin-image-wrapper">
        {!imageError ? (
          <img
            src={administrator.image}
            alt={`${administrator.role} at CCAST Bambili`}
            className="about-admin-image"
            loading={
              index < 3
                ? "eager"
                : "lazy"
            }
            onError={() =>
              setImageError(true)
            }
          />
        ) : (
          <div
            className="about-admin-image-fallback"
            aria-label={`${administrator.role} placeholder`}
          >
            <i
              className={`fas ${administrator.icon}`}
              aria-hidden="true"
            />
          </div>
        )}

        <div className="about-admin-image-overlay" />

        <div className="about-admin-number">
          {String(index + 1).padStart(2, "0")}
        </div>

        <div className="about-admin-role-badge">
          <i
            className={`fas ${administrator.icon}`}
            aria-hidden="true"
          />

          <span>
            {administrator.role}
          </span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="about-admin-content">
        <div className="about-admin-content-top">
          <span className="about-admin-label">
            SCHOOL ADMINISTRATION
          </span>

          <span className="about-admin-status">
            <span />
            Leadership
          </span>
        </div>

        <h3>
          {administrator.name}
        </h3>

        <p className="about-admin-position">
          {administrator.title}
        </p>

        <p className="about-admin-description">
          {administrator.description}
        </p>

        <div className="about-admin-footer">
          <span>
            <i
              className="fas fa-building-columns"
              aria-hidden="true"
            />
            CCAST Bambili
          </span>

          <span className="about-admin-arrow">
            <i
              className="fas fa-arrow-right"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </article>
  );
};

/* ============================================================
   ABOUT PAGE
============================================================ */

const AboutPage = () => {
  useRevealOnScroll();

  return (
    <div className="ccast-about-page">
      <SiteNavbar />

      {/* ======================================================
          HERO
      ====================================================== */}

      <header className="about-hero">
        <div
          className="about-hero-orb about-hero-orb-one"
          aria-hidden="true"
        />

        <div
          className="about-hero-orb about-hero-orb-two"
          aria-hidden="true"
        />

        <div
          className="about-hero-grid"
          aria-hidden="true"
        />

        <div className="container-xl position-relative">
          <div className="about-breadcrumb">
            <Link to="/">
              <i
                className="fas fa-house"
                aria-hidden="true"
              />

              <span>Home</span>
            </Link>

            <span className="about-breadcrumb-divider">
              <i
                className="fas fa-chevron-right"
                aria-hidden="true"
              />
            </span>

            <span>About CCAST</span>
          </div>

          <div className="about-hero-content">
            <div className="about-hero-eyebrow">
              <span className="about-eyebrow-line" />

              <span>
                ABOUT CCAST BAMBILI
              </span>
            </div>

            <h1>
              Building minds.
              <br />
              <span>Shaping futures.</span>
            </h1>

            <p>
              Discover an institution committed
              to technical excellence, professional
              development, innovation, character,
              and the transformation of young people
              into capable professionals.
            </p>

            <div className="about-hero-actions">
              <Link
                to="/programs"
                className="about-btn about-btn-primary"
              >
                Explore Our Programs

                <i
                  className="fas fa-arrow-right"
                  aria-hidden="true"
                />
              </Link>

              <Link
                to="/contact"
                className="about-btn about-btn-light"
              >
                <i
                  className="fas fa-location-dot"
                  aria-hidden="true"
                />

                Visit CCAST
              </Link>
            </div>

            <div className="about-hero-meta">
              <div className="about-hero-meta-item">
                <strong>38+</strong>

                <span>
                  Years of excellence
                </span>
              </div>

              <div className="about-meta-divider" />

              <div className="about-hero-meta-item">
                <strong>8K+</strong>

                <span>
                  Graduates
                </span>
              </div>

              <div className="about-meta-divider" />

              <div className="about-hero-meta-item">
                <strong>52+</strong>

                <span>
                  Programs
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="about-hero-bottom">
          <div className="container-xl">
            <div className="about-scroll-indicator">
              <span>
                Discover our story
              </span>

              <i
                className="fas fa-arrow-down"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </header>

      {/* ======================================================
          WHO WE ARE
      ====================================================== */}

      <section
        className="about-story"
        aria-labelledby="about-story-title"
      >
        <div
          className="about-story-decoration"
          aria-hidden="true"
        />

        <div className="container-xl">
          <div className="row align-items-center g-5">
            <div className="col-lg-6 rv-t">
              <div className="about-section-label">
                <span>
                  <i
                    className="fas fa-building-columns"
                    aria-hidden="true"
                  />
                </span>

                WHO WE ARE
              </div>

              <h2
                className="about-section-title"
                id="about-story-title"
              >
                An institution built around
                <span>
                  {" "}
                  people, purpose and possibility.
                </span>
              </h2>

              <p className="about-story-lead">
                CCAST Bambili has established
                itself as a centre for technical
                and professional education,
                creating opportunities for students
                to acquire knowledge, practical
                competence, confidence, and
                character.
              </p>

              <p className="about-story-text">
                Our approach goes beyond the
                classroom. We combine academic
                foundations with practical
                experiences that help learners
                understand how knowledge can be
                applied to real challenges in
                society, industry, technology,
                and professional life.
              </p>

              <div className="about-story-points">
                {ABOUT_POINTS.map((point) => (
                  <div
                    className="about-story-point"
                    key={point}
                  >
                    <span>
                      <i
                        className="fas fa-check"
                        aria-hidden="true"
                      />
                    </span>

                    <p>{point}</p>
                  </div>
                ))}
              </div>

              <div className="about-story-actions">
                <Link
                  to="/programs"
                  className="about-inline-link"
                >
                  Discover our academic programs

                  <i
                    className="fas fa-arrow-right"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>

            <div
              className="col-lg-6 rv-t"
              style={{
                transitionDelay: "120ms",
              }}
            >
              <div className="about-campus-visual">
                <div className="about-campus-main">
                  <img
                    src={CampusImage}
                    alt="CCAST Bambili campus"
                    className="about-campus-image"
                    loading="lazy"
                  />

                  <div className="about-campus-overlay">
                    <div>
                      <span>
                        CCAST BAMBILI
                      </span>

                      <strong>
                        Learning beyond the
                        classroom.
                      </strong>
                    </div>

                    <i
                      className="fas fa-arrow-up-right-from-square"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <div className="about-campus-experience">
                  <div className="about-campus-experience-icon">
                    <i
                      className="fas fa-award"
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <strong>38+</strong>

                    <span>
                      Years of Excellence
                    </span>
                  </div>
                </div>

                <div className="about-campus-programs">
                  <div className="about-campus-programs-icon">
                    <i
                      className="fas fa-book-open"
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <strong>52+</strong>

                    <span>
                      Academic Programs
                    </span>
                  </div>
                </div>

                <div
                  className="about-campus-dots"
                  aria-hidden="true"
                >
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          MISSION / VISION / VALUES
      ====================================================== */}

      <section
        className="about-foundation"
        aria-labelledby="about-foundation-title"
      >
        <div className="container-xl">
          <div className="about-section-heading text-center rv-t">
            <div className="about-section-label justify-content-center">
              <span>
                <i
                  className="fas fa-compass"
                  aria-hidden="true"
                />
              </span>

              OUR FOUNDATION
            </div>

            <h2
              className="about-section-title"
              id="about-foundation-title"
            >
              The principles behind
              <span>
                {" "}
                everything we do.
              </span>
            </h2>

            <p>
              Our mission, vision, and institutional
              values provide the framework for how
              we educate, lead, serve, and prepare
              students for the future.
            </p>
          </div>

          <div className="about-foundation-grid">
            {VALUES.map((value, index) => (
              <article
                className={`about-foundation-card rv-t ${
                  index === 0
                    ? "about-foundation-card-featured"
                    : ""
                }`}
                key={value.title}
                style={{
                  transitionDelay: `${index * 80}ms`,
                }}
              >
                <div className="about-foundation-card-top">
                  <div className="about-foundation-icon">
                    <i
                      className={`fas ${value.icon}`}
                      aria-hidden="true"
                    />
                  </div>

                  <span>
                    {value.short}
                  </span>
                </div>

                <h3>
                  {value.title}
                </h3>

                <p>
                  {value.desc}
                </p>

                <div className="about-foundation-number">
                  0{index + 1}
                </div>

                <div className="about-foundation-arrow">
                  <i
                    className="fas fa-arrow-up-right-from-square"
                    aria-hidden="true"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          SCHOOL ADMINISTRATION
      ====================================================== */}

      <section
        className="about-administration"
        aria-labelledby="about-administration-title"
      >
        <div
          className="about-admin-background-orb about-admin-background-orb-one"
          aria-hidden="true"
        />

        <div
          className="about-admin-background-orb about-admin-background-orb-two"
          aria-hidden="true"
        />

        <div
          className="about-admin-pattern"
          aria-hidden="true"
        />

        <div className="container-xl position-relative">
          {/* HEADER */}
          <div className="about-admin-heading rv-t">
            <div className="about-admin-heading-main">
              <div className="about-section-label about-section-label-light">
                <span>
                  <i
                    className="fas fa-users-gear"
                    aria-hidden="true"
                  />
                </span>

                SCHOOL ADMINISTRATION
              </div>

              <h2
                className="about-admin-title"
                id="about-administration-title"
              >
                Meet the people
                <br />
                <span>
                  leading CCAST Bambili.
                </span>
              </h2>
            </div>

            <div className="about-admin-heading-copy">
              <p>
                Strong institutions are built by
                people. Our school administration
                works together to provide academic
                leadership, discipline, financial
                stewardship, student support, and
                a positive environment where every
                learner can thrive.
              </p>

              <div className="about-admin-heading-line">
                <span />
                <strong>
                  Leadership • Service • Excellence
                </strong>
              </div>
            </div>
          </div>

          {/* ADMINISTRATORS */}
          <div className="about-admin-grid">
            {ADMINISTRATORS.map(
              (administrator, index) => (
                <AdministratorCard
                  key={administrator.id}
                  administrator={administrator}
                  index={index}
                />
              )
            )}
          </div>

          {/* FOOTER MESSAGE */}
          <div className="about-admin-bottom rv-t">
            <div className="about-admin-bottom-icon">
              <i
                className="fas fa-graduation-cap"
                aria-hidden="true"
              />
            </div>

            <div>
              <span>
                ONE TEAM. ONE VISION.
              </span>

              <p>
                Working together to create an
                environment where students are
                prepared academically, professionally,
                and personally for the future.
              </p>
            </div>

            <Link
              to="/contact"
              className="about-admin-contact-link"
            >
              Contact the School
              <i
                className="fas fa-arrow-right"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================
          STATISTICS
      ====================================================== */}

      <section
        className="about-statistics"
        aria-labelledby="about-statistics-title"
      >
        <div className="container-xl">
          <div className="about-statistics-heading rv-t">
            <div>
              <div className="about-section-label">
                <span>
                  <i
                    className="fas fa-chart-simple"
                    aria-hidden="true"
                  />
                </span>

                BY THE NUMBERS
              </div>

              <h2
                className="about-section-title"
                id="about-statistics-title"
              >
                A legacy you can
                <span> measure.</span>
              </h2>
            </div>

            <p>
              Decades of investment in students,
              faculty, academic programs,
              facilities, and the wider community.
            </p>
          </div>

          <div className="about-statistics-grid">
            <div
              className="about-stat-card rv-t"
              style={{
                transitionDelay: "0ms",
              }}
            >
              <div className="about-stat-icon">
                <i
                  className="fas fa-book-open"
                  aria-hidden="true"
                />
              </div>

              <div className="about-stat-number">
                <CountUp
                  end={52}
                  suffix="+"
                />
              </div>

              <h3>
                Academic Programs
              </h3>

              <p>
                Across diverse fields of study
              </p>
            </div>

            <div
              className="about-stat-card rv-t"
              style={{
                transitionDelay: "90ms",
              }}
            >
              <div className="about-stat-icon">
                <i
                  className="fas fa-building-columns"
                  aria-hidden="true"
                />
              </div>

              <div className="about-stat-number">
                <CountUp end={8} />
              </div>

              <h3>
                Departments
              </h3>

              <p>
                Supporting academic excellence
              </p>
            </div>

            <div
              className="about-stat-card rv-t"
              style={{
                transitionDelay: "180ms",
              }}
            >
              <div className="about-stat-icon">
                <i
                  className="fas fa-users"
                  aria-hidden="true"
                />
              </div>

              <div className="about-stat-number">
                <CountUp
                  end={186}
                  suffix="+"
                />
              </div>

              <h3>
                Faculty Members
              </h3>

              <p>
                Dedicated academic professionals
              </p>
            </div>

            <div
              className="about-stat-card rv-t"
              style={{
                transitionDelay: "270ms",
              }}
            >
              <div className="about-stat-icon">
                <i
                  className="fas fa-calendar-check"
                  aria-hidden="true"
                />
              </div>

              <div className="about-stat-number">
                <CountUp
                  end={38}
                  suffix="+"
                />
              </div>

              <h3>
                Years of Excellence
              </h3>

              <p>
                Building generations of learners
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          TESTIMONIAL INTRO
      ====================================================== */}

      <section className="about-testimonials-intro">
        <div className="container-xl">
          <div className="about-testimonial-heading rv-t">
            <div className="about-section-label">
              <span>
                <i
                  className="fas fa-quote-left"
                  aria-hidden="true"
                />
              </span>

              THE CCAST EXPERIENCE
            </div>

            <h2 className="about-section-title">
              Stories from the
              <span>
                {" "}
                CCAST community.
              </span>
            </h2>

            <p>
              Discover how CCAST continues to
              influence students, families, alumni,
              and the wider community.
            </p>
          </div>
        </div>
      </section>

      <Testimonials />

      {/* ======================================================
          FINAL CTA
      ====================================================== */}

      <section className="about-final-cta">
        <div
          className="about-final-cta-orb"
          aria-hidden="true"
        />

        <div className="container-xl position-relative">
          <div className="about-final-cta-content rv-t">
            <div className="about-final-cta-icon">
              <i
                className="fas fa-graduation-cap"
                aria-hidden="true"
              />
            </div>

            <div>
              <span>
                YOUR NEXT CHAPTER STARTS HERE
              </span>

              <h2>
                Ready to discover what
                <br />
                CCAST can offer?
              </h2>

              <p>
                Explore our programs, learn more
                about admissions, or get in touch
                with our team.
              </p>
            </div>

            <div className="about-final-cta-actions">
              <Link
                to="/programs"
                className="about-btn about-btn-primary"
              >
                Explore Programs

                <i
                  className="fas fa-arrow-right"
                  aria-hidden="true"
                />
              </Link>

              <Link
                to="/contact"
                className="about-btn about-btn-light"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default AboutPage;