// src/components/site/HeroCarousel.jsx

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Link } from "react-router-dom";

import HeroCampus
  from "../../assets/images/hero/hero-campus.png";

import HeroClassRoom
  from "../../assets/images/hero/hero-classroom.png";

import HeroLaboratory
  from "../../assets/images/hero/hero-laboratory.png";

import HeroComputerLab
  from "../../assets/images/hero/hero-computer-lab.png";

import AdmissionGuardLink
  from "../site/AdmissionGuardLink";

import "./HeroCarousel.css";

const SLIDES = [
  {
    key: "welcome",

    badge:
      "Admissions • 2026/2027 Academic Year",

    eyebrow:
      "Welcome to CCAST Bambili",

    title:
      "Shape Your Future With Excellence",

    lead:
      "Join one of the region's leading secondary schools where academic excellence, discipline, innovation, and character development prepare students for success in university and beyond.",

    img: HeroCampus,

    primary: {
      label: "Apply for Admission",
      icon: "fa-user-graduate",
      type: "admission",
    },

    secondary: {
      label: "Schedule a Campus Tour",
      icon: "fa-calendar-days",
      type: "tour",
    },

    feature: {
      icon: "fa-sparkles",
      label: "Why CCAST?",
      value: "Admissions now open",
    },
  },

  {
    key: "academic",

    badge:
      "Academic Excellence",

    eyebrow:
      "Learning That Creates Possibilities",

    title:
      "Every Student Can Discover Their Potential",

    lead:
      "Experienced teachers, modern classrooms, personalized mentoring, and proven teaching methods help students build the confidence and knowledge needed for outstanding academic performance.",

    img: HeroClassRoom,

    primary: {
      label: "Explore Academics",
      icon: "fa-graduation-cap",
      to: "/about",
    },

    secondary: {
      label: "View Academic Results",
      icon: "fa-chart-line",
      to: "/academic-results",
    },

    feature: {
      icon: "fa-award",
      label: "Academic Focus",
      value: "Excellence in learning",
    },
  },

  {
    key: "stem",

    badge:
      "Science • Technology • Innovation",

    eyebrow:
      "Learning Beyond The Classroom",

    title:
      "Discover. Experiment. Innovate.",

    lead:
      "Students explore Physics, Chemistry, Biology and modern laboratory technologies through practical experiences that develop creativity, critical thinking, curiosity, and scientific excellence.",

    img: HeroLaboratory,

    primary: {
      label: "Explore STEM",
      icon: "fa-flask",
      to: "/about",
    },

    secondary: {
      label: "View Our Facilities",
      icon: "fa-building",
      to: "/gallery",
    },

    feature: {
      icon: "fa-microscope",
      label: "Hands-on Learning",
      value: "Science & innovation",
    },
  },

  {
    key: "ict",

    badge:
      "Digital Learning",

    eyebrow:
      "Preparing Tomorrow's Digital Leaders",

    title:
      "Build Skills For The Digital World",

    lead:
      "From programming and robotics to digital literacy and computer applications, our ICT centre equips learners with practical skills for a technology-driven future.",

    img: HeroComputerLab,

    primary: {
      label: "Discover ICT",
      icon: "fa-computer",
      to: "/about",
    },

    secondary: {
      label: "Experience Student Life",
      icon: "fa-users",
      to: "/student-life",
    },

    feature: {
      icon: "fa-lightbulb",
      label: "Future Ready",
      value: "Digital skills for tomorrow",
    },
  },
];

const AUTOPLAY_MS = 6500;

const HeroCarousel = () => {
  const [index, setIndex] = useState(0);

  const [paused, setPaused] =
    useState(false);

  const [showTourModal, setShowTourModal] =
    useState(false);

  const [isTransitioning, setIsTransitioning] =
    useState(false);

  const timerRef = useRef(null);

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

  /* ============================================================
     SLIDE NAVIGATION
  ============================================================ */

  const goTo = useCallback((nextIndex) => {
    if (isTransitioning) {
      return;
    }

    setIsTransitioning(true);

    setIndex(
      ((nextIndex % SLIDES.length) +
        SLIDES.length) %
      SLIDES.length
    );

    window.setTimeout(() => {
      setIsTransitioning(false);
    }, reduceMotion ? 0 : 700);
  }, [isTransitioning, reduceMotion]);

  const next = useCallback(() => {
    setIndex((current) =>
      (current + 1) % SLIDES.length
    );
  }, []);

  const prev = useCallback(() => {
    setIndex((current) =>
      (current - 1 + SLIDES.length) %
      SLIDES.length
    );
  }, []);

  /* ============================================================
     AUTOPLAY
  ============================================================ */

  useEffect(() => {
    if (
      paused ||
      reduceMotion ||
      showTourModal
    ) {
      return undefined;
    }

    timerRef.current =
      window.setInterval(
        next,
        AUTOPLAY_MS
      );

    return () => {
      if (timerRef.current) {
        window.clearInterval(
          timerRef.current
        );
      }
    };
  }, [
    paused,
    reduceMotion,
    showTourModal,
    next,
  ]);

  /* ============================================================
     KEYBOARD
  ============================================================ */

  const handleKeyDown = (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      prev();
    }

    if (event.key === " ") {
      event.preventDefault();
      setPaused((value) => !value);
    }
  };

  /* ============================================================
     TOUR MODAL
  ============================================================ */

  useEffect(() => {
    if (!showTourModal) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowTourModal(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [showTourModal]);

  /* ============================================================
     CTA RENDERING
  ============================================================ */

  const renderPrimaryCTA = (cta) => {
    if (!cta) {
      return null;
    }

    if (cta.type === "admission") {
      return (
        <AdmissionGuardLink
          className="hc-btn hc-btn--primary"
        >
          <span className="hc-btn-icon">
            <i
              className={`fas ${cta.icon}`}
              aria-hidden="true"
            />
          </span>

          <span>{cta.label}</span>

          {/* <i
            className="fas fa-arrow-right hc-btn-arrow"
            aria-hidden="true"
          /> */}
        </AdmissionGuardLink>
      );
    }

    if (cta.to) {
      return (
        <Link
          to={cta.to}
          className="hc-btn hc-btn--primary"
        >
          <span className="hc-btn-icon">
            <i
              className={`fas ${cta.icon}`}
              aria-hidden="true"
            />
          </span>

          <span>{cta.label}</span>

          <i
            className="fas fa-arrow-right hc-btn-arrow"
            aria-hidden="true"
          />
        </Link>
      );
    }

    return null;
  };

  const renderSecondaryCTA = (cta) => {
    if (!cta) {
      return null;
    }

    if (cta.type === "tour") {
      return (
        <button
          type="button"
          className="hc-btn hc-btn--secondary"
          onClick={() =>
            setShowTourModal(true)
          }
        >
          <span className="hc-btn-icon">
            <i
              className={`fas ${cta.icon}`}
              aria-hidden="true"
            />
          </span>

          <span>{cta.label}</span>
        </button>
      );
    }

    if (cta.to) {
      return (
        <Link
          to={cta.to}
          className="hc-btn hc-btn--secondary"
        >
          <span className="hc-btn-icon">
            <i
              className={`fas ${cta.icon}`}
              aria-hidden="true"
            />
          </span>

          <span>{cta.label}</span>

          <i
            className="fas fa-arrow-up-right-from-square hc-btn-external"
            aria-hidden="true"
          />
        </Link>
      );
    }

    return null;
  };

  const currentSlide =
    SLIDES[index];

  const progress =
    ((index + 1) / SLIDES.length) * 100;

  return (
    <>
      <section
        className="hc"
        aria-roledescription="carousel"
        aria-label="CCAST Bambili highlights"
        tabIndex={0}
        onMouseEnter={() =>
          setPaused(true)
        }
        onMouseLeave={() =>
          setPaused(false)
        }
        onFocus={() =>
          setPaused(true)
        }
        onBlur={(event) => {
          if (
            !event.currentTarget.contains(
              event.relatedTarget
            )
          ) {
            setPaused(false);
          }
        }}
        onKeyDown={handleKeyDown}
      >

        {/* ======================================================
            BACKGROUND SLIDES
        ====================================================== */}

        {SLIDES.map(
          (slide, slideIndex) => (
            <div
              key={slide.key}
              className={`hc-slide ${slideIndex === index
                  ? "hc-slide--active"
                  : ""
                }`}
              aria-hidden={
                slideIndex !== index
              }
            >
              <img
                src={slide.img}
                alt=""
                className="hc-bg"
                loading={
                  slideIndex === 0
                    ? "eager"
                    : "lazy"
                }
                aria-hidden="true"
              />

              <div
                className="hc-image-overlay"
                aria-hidden="true"
              />

              <div
                className="hc-gradient"
                aria-hidden="true"
              />
            </div>
          )
        )}

        {/* ======================================================
            DECORATIVE GRID
        ====================================================== */}

        <div
          className="hc-grid"
          aria-hidden="true"
        />

        {/* ======================================================
            MAIN CONTENT
        ====================================================== */}

        <div className="hc-inner container-xl">

          <div
            className={`hc-copy ${isTransitioning
                ? "hc-copy--transitioning"
                : ""
              }`}
            key={currentSlide.key}
          >

            {/* EYEBROW */}

            <div className="hc-eyebrow">
              <span className="hc-eyebrow-line" />

              <span>
                {currentSlide.eyebrow}
              </span>
            </div>

            {/* BADGE */}

            <div className="hc-badge">
              <span className="hc-badge-dot" />

              <span>
                {currentSlide.badge}
              </span>
            </div>

            {/* TITLE */}

            <h1 className="hc-title">
              {currentSlide.title}
            </h1>

            {/* DESCRIPTION */}

            <p className="hc-lead">
              {currentSlide.lead}
            </p>

            {/* STATISTICS */}

            <div className="hc-stats">

              <div className="hc-stat">
                <strong>98%</strong>
                <span>
                  GCE Pass Rate
                </span>
              </div>

              <span className="hc-stat-divider" />

              <div className="hc-stat">
                <strong>30+</strong>
                <span>
                  Qualified Teachers
                </span>
              </div>

              <span className="hc-stat-divider" />

              <div className="hc-stat">
                <strong>2K+</strong>
                <span>
                  Graduates
                </span>
              </div>

            </div>

            {/* CTAS */}

            <div className="hc-ctas">

              {renderPrimaryCTA(
                currentSlide.primary
              )}

              {renderSecondaryCTA(
                currentSlide.secondary
              )}

            </div>

          </div>

          {/* ====================================================
              FEATURE CARD
          ==================================================== */}

          <div className="hc-feature-card">

            <div className="hc-feature-icon">
              <i
                className={`fas ${currentSlide.feature.icon}`}
                aria-hidden="true"
              />
            </div>

            <div className="hc-feature-copy">
              <span>
                {currentSlide.feature.label}
              </span>

              <strong>
                {currentSlide.feature.value}
              </strong>
            </div>

            <span className="hc-feature-arrow">
              <i
                className="fas fa-arrow-right"
                aria-hidden="true"
              />
            </span>

          </div>

        </div>

        {/* ======================================================
            ARROWS
        ====================================================== */}

        <button
          type="button"
          className="hc-arrow hc-arrow--prev"
          onClick={prev}
          aria-label="Previous slide"
        >
          <i
            className="fas fa-arrow-left"
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          className="hc-arrow hc-arrow--next"
          onClick={next}
          aria-label="Next slide"
        >
          <i
            className="fas fa-arrow-right"
            aria-hidden="true"
          />
        </button>

        {/* ======================================================
            BOTTOM CONTROLS
        ====================================================== */}

        <div className="hc-controls">

          <div className="hc-slide-count">
            <strong>
              {String(index + 1).padStart(
                2,
                "0"
              )}
            </strong>

            <span>/</span>

            <span>
              {String(
                SLIDES.length
              ).padStart(2, "0")}
            </span>
          </div>

          <div className="hc-progress">
            <span
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="hc-dots">
            {SLIDES.map(
              (slide, slideIndex) => (
                <button
                  key={slide.key}
                  type="button"
                  className={`hc-dot ${slideIndex === index
                      ? "hc-dot--active"
                      : ""
                    }`}
                  onClick={() =>
                    goTo(slideIndex)
                  }
                  aria-label={`Show slide ${slideIndex + 1
                    }: ${slide.title
                    }`}
                  aria-current={
                    slideIndex === index
                      ? "true"
                      : undefined
                  }
                />
              )
            )}
          </div>

          <button
            type="button"
            className="hc-pause"
            onClick={() =>
              setPaused(
                (value) => !value
              )
            }
            aria-label={
              paused
                ? "Resume slideshow"
                : "Pause slideshow"
            }
          >
            <i
              className={`fas ${paused
                  ? "fa-play"
                  : "fa-pause"
                }`}
              aria-hidden="true"
            />
          </button>

        </div>

        {/* ======================================================
            SCROLL INDICATOR
        ====================================================== */}

        <div
          className="hc-scroll"
          aria-hidden="true"
        >
          <span>
            Explore CCAST
          </span>

          <i className="fas fa-chevron-down" />
        </div>

        {/* ======================================================
            ACCESSIBILITY
        ====================================================== */}

        <span
          className="visually-hidden"
          aria-live="polite"
        >
          {currentSlide.title},
          slide {index + 1} of{" "}
          {SLIDES.length}
        </span>

      </section>

      {/* ========================================================
          CAMPUS TOUR MODAL
      ======================================================== */}

      {showTourModal && (
        <div
          className="hc-modal-backdrop"
          onMouseDown={() =>
            setShowTourModal(false)
          }
        >
          <div
            className="hc-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tour-modal-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="hc-modal-close"
              onClick={() =>
                setShowTourModal(false)
              }
              aria-label="Close campus tour dialog"
            >
              <i
                className="fas fa-xmark"
                aria-hidden="true"
              />
            </button>

            <div className="hc-modal-icon">
              <i
                className="fas fa-calendar-days"
                aria-hidden="true"
              />
            </div>

            <span className="hc-modal-label">
              VISIT CCAST BAMBILI
            </span>

            <h2 id="tour-modal-title">
              Plan Your Campus Visit
            </h2>

            <p>
              Come and experience our learning
              environment, classrooms,
              laboratories, ICT facilities and
              school community in person.
            </p>

            <div className="hc-modal-info">

              <div>
                <i
                  className="fas fa-location-dot"
                  aria-hidden="true"
                />

                <span>
                  CCAST Bambili
                </span>
              </div>

              <div>
                <i
                  className="fas fa-clock"
                  aria-hidden="true"
                />

                <span>
                  Monday – Friday
                </span>
              </div>

            </div>

            <div className="hc-modal-actions">

              <Link
                to="/contact"
                className="hc-modal-primary"
                onClick={() =>
                  setShowTourModal(false)
                }
              >
                <span>
                  Contact Us
                </span>

                <i
                  className="fas fa-arrow-right"
                  aria-hidden="true"
                />
              </Link>

              <button
                type="button"
                className="hc-modal-secondary"
                onClick={() =>
                  setShowTourModal(false)
                }
              >
                Maybe Later
              </button>

            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default HeroCarousel;