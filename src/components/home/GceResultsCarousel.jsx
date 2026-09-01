import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import toast from "react-hot-toast";
import { useIsAdmissionOpen } from "../../api/public";
import "./GceResultsCarousel.css";

/* ══════════════════════════════════════════════════════════════
   DATA
   ══════════════════════════════════════════════════════════════ */
const YEARS = [
  {
    year: "2024",
    badge: "Best Performance Ever",
    description:
      "The 2024 graduating class demonstrated exceptional academic performance across Science, Arts and Commercial disciplines.",
    ol: 96.4,
    al: 92.1,
    AdvanceLevelcandidates: 512,
    OrdinaryLevelcandidates: 148,
    PassOlevel: 130,
    passAlevel: 495,
    highlight:
      "Our best Advanced Level Science cohort in the institution's history.",
    pdfUrl: "/results/2024-gce-results.pdf", // Add PDF URL for each year
  },
  {
    year: "2023",
    badge: "Five Perfect Scores",
    description:
      "Five subjects recorded a flawless 100% pass rate at Ordinary Level, a first in the school's GCE history.",
    ol: 94.8,
    al: 90.5,
    AdvanceLevelcandidates: 486,
    OrdinaryLevelcandidates: 131,
    PassOlevel: 115,
    passAlevel: 393,
    highlight:
      "Five subjects recorded a 100% pass at Ordinary Level — an unprecedented achievement.",
    pdfUrl: "/results/2023-gce-results.pdf",
  },
  {
    year: "2022",
    badge: "New Science Block Era",
    description:
      "The first full cohort to sit examinations in the newly commissioned science block delivered outstanding results.",
    ol: 93.2,
    al: 88.7,
    AdvanceLevelcandidates: 470,
    OrdinaryLevelcandidates: 118,
    PassOlevel: 104,
    passAlevel: 391,
    highlight:
      "The new science block immediately proved its value with record-breaking practical scores.",
    pdfUrl: "/results/2022-gce-results.pdf",
  },
  {
    year: "2021",
    badge: "ICT Record Breakers",
    description:
      "Record results in ICT and Computer Science papers cemented the school's reputation as a technology leader.",
    ol: 92.0,
    al: 87.3,
    AdvanceLevelcandidates: 441,
    OrdinaryLevelcandidates: 102,
    PassOlevel: 93,
    passAlevel: 389,
    highlight:
      "Record results in the ICT and Computer Science papers set a new benchmark for the region.",
    pdfUrl: "/results/2021-gce-results.pdf",
  },
  {
    year: "2020",
    badge: "Resilience Award",
    description:
      "Despite a severely disrupted school year, the 2020 cohort delivered resilient and commendable results.",
    ol: 90.6,
    al: 85.9,
    AdvanceLevelcandidates: 418,
    OrdinaryLevelcandidates: 394,
    PassOlevel: 273,
    passAlevel: 387,
    highlight:
      "Resilient results delivered through one of the most challenging academic years on record.",
    pdfUrl: "/results/2020-gce-results.pdf",
  },
];

const AUTOPLAY_MS = 5500;
const CIRCUMFERENCE = 2 * Math.PI * 54; // ≈ 339.292

const ACHIEVEMENTS = [
  "Outstanding GCE Results",
  "Experienced Teachers",
  "STEM Excellence",
  "ICT Certified Centre",
];

/* ══════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════ */
const GceResultsCarousel = () => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [slideExiting, setSlideExiting] = useState(false);

  /* ── Refs ── */
  const transitioningRef = useRef(false);
  const timerRef = useRef(null);
  const exitTimeoutRef = useRef(null);
  const unlockTimeoutRef = useRef(null);
  const indexRef = useRef(0);
  const pausedRef = useRef(false);
  const cardRef = useRef(null);
  const olCircleRef = useRef(null);
  const alCircleRef = useRef(null);
  const olValueRef = useRef(null);
  const alValueRef = useRef(null);
  const statDistRef = useRef(null);
  const statCandRef = useRef(null);
  const statHundRef = useRef(null);
  const statUnivRef = useRef(null);

  const reduceMotion =
    typeof window !== "undefined"
      ? (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ??
        false)
      : false;

  /* ── Keep refs in sync with state ── */
  useEffect(() => {
    indexRef.current = index;
  }, [index]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  /* ════════════════════════════════════════════════════════════
     HANDLE VIEW RESULTS (opens PDF in new tab)
     ════════════════════════════════════════════════════════════ */
  const handleViewResults = useCallback(() => {
    const currentYear = YEARS[indexRef.current];
    const pdfUrl = currentYear.pdfUrl;

    // Open PDF in new tab
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  }, []);

  const {
    isOpen: isAdmissionOpen,
    isLoading: admissionLoading,
  } = useIsAdmissionOpen();


  /* ════════════════════════════════════════════════════════════
     HANDLE APPLY (navigates to application page)
     ════════════════════════════════════════════════════════════ */
  const handleApply = useCallback(() => {
    if (admissionLoading) {
      toast.loading("Checking admission status...", { id: "adm-check" });
      return;
    }
    if (!isAdmissionOpen) {
      toast.error(
        "Admission is not open or closed. Please contact the school administration.",
        { duration: 6000, id: "adm-check" }
      );
      return;
    }
    navigate("/admission");
  }, [admissionLoading, isAdmissionOpen, navigate]);


  /* ════════════════════════════════════════════════════════════
     ANIMATED COUNTER  (ref-based, no re-renders)
     ════════════════════════════════════════════════════════════ */
  const animateCounter = useCallback(
    (ref, target, duration, decimals, suffix) => {
      const el = ref.current;
      if (!el) return;

      if (reduceMotion) {
        el.textContent = target.toFixed(decimals) + suffix;
        return;
      }

      const startTime = performance.now();
      const tick = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    [reduceMotion],
  );

  /* ════════════════════════════════════════════════════════════
     CIRCULAR PROGRESS  (ref-based)
     ════════════════════════════════════════════════════════════ */
  const setProgress = useCallback(
    (ref, percentage) => {
      const circle = ref.current;
      if (!circle) return;

      const targetOffset = CIRCUMFERENCE * (1 - percentage / 100);

      if (reduceMotion) {
        circle.style.transition = "none";
        circle.style.strokeDashoffset = String(targetOffset);
        return;
      }

      // Reset to empty
      circle.classList.remove("ring-animated");
      circle.style.transition = "none";
      circle.style.strokeDashoffset = String(CIRCUMFERENCE);

      // Force reflow so the browser registers the "empty" state
      void circle.getBoundingClientRect();

      // Animate to target
      circle.classList.add("ring-animated");
      circle.style.strokeDashoffset = String(targetOffset);
    },
    [reduceMotion],
  );

  /* ════════════════════════════════════════════════════════════
     UPDATE SLIDE ANIMATIONS
     ════════════════════════════════════════════════════════════ */
  const updateSlideContent = useCallback(() => {
    const d = YEARS[indexRef.current];

    setProgress(olCircleRef, d.ol);
    setProgress(alCircleRef, d.al);

    animateCounter(olValueRef, d.ol, 1400, 1, "%");
    animateCounter(alValueRef, d.al, 1400, 1, "%");
    animateCounter(statDistRef, d.OrdinaryLevelcandidates, 1200, 0, "");
    animateCounter(statCandRef, d.AdvanceLevelcandidates, 1200, 0, "");
    animateCounter(statHundRef, d.PassOlevel, 1000, 0, "");
    animateCounter(statUnivRef, d.passAlevel, 1200, 0, "");
  }, [setProgress, animateCounter]);

  // Fire animations whenever the slide index changes
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      updateSlideContent();
    });
    return () => cancelAnimationFrame(raf);
  }, [index, updateSlideContent]);

  /* ════════════════════════════════════════════════════════════
     GO TO SLIDE
     ════════════════════════════════════════════════════════════ */
  const goToSlide = useCallback(
    (newIndex) => {
      if (transitioningRef.current) return;

      newIndex = ((newIndex % YEARS.length) + YEARS.length) % YEARS.length;
      if (newIndex === indexRef.current) return;

      transitioningRef.current = true;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Fade out
      setSlideExiting(true);

      exitTimeoutRef.current = setTimeout(() => {
        indexRef.current = newIndex;
        setIndex(newIndex);
        setSlideExiting(false);

        // Unlock after fade-in completes.
        unlockTimeoutRef.current = setTimeout(() => {
          transitioningRef.current = false;

          if (!pausedRef.current && !reduceMotion) {
            timerRef.current = setInterval(() => {
              goToSlide(indexRef.current + 1);
            }, AUTOPLAY_MS);
          }
        }, 380);
      }, 350);
    },
    [reduceMotion],
  );

  /* ════════════════════════════════════════════════════════════
     AUTOPLAY
     ════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (paused || reduceMotion) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      goToSlide(indexRef.current + 1);
    }, AUTOPLAY_MS);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [paused, goToSlide]);

  /* ════════════════════════════════════════════════════════════
     CLEANUP
     ════════════════════════════════════════════════════════════ */
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }

      if (unlockTimeoutRef.current) {
        clearTimeout(unlockTimeoutRef.current);
        unlockTimeoutRef.current = null;
      }
    };
  }, []);

  /* ════════════════════════════════════════════════════════════
     KEYBOARD
     ════════════════════════════════════════════════════════════ */
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goToSlide(indexRef.current + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToSlide(indexRef.current - 1);
      }
    },
    [goToSlide],
  );

  /* ════════════════════════════════════════════════════════════
     DERIVED
     ════════════════════════════════════════════════════════════ */
  const cur = YEARS[index];

  /* ════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════ */
  return (
    <section className="section-bg mb-md-5" id="academic-excellence">
      {/* ── Background Decorations ── */}
      <div className="dot-pattern" aria-hidden="true" />
      <div
        className="geo-ring"
        style={{ width: 400, height: 400, top: -100, left: -100 }}
        aria-hidden="true"
      />
      <div
        className="geo-ring"
        style={{ width: 250, height: 250, bottom: 60, right: -60 }}
        aria-hidden="true"
      />
      <div
        className="geo-ring"
        style={{ width: 150, height: 150, top: "40%", left: "10%" }}
        aria-hidden="true"
      />

      <div className="container-xl position-relative" style={{ zIndex: 10 }}>
        {/* ═══════════ Section Header ═══════════ */}
        <div className="text-center mb-5">
          <div className="section-tag mb-4">
            <i className="bi bi-trophy-fill" style={{ fontSize: "0.75rem" }} />
            GCE Board Results
          </div>

          <h2 className="gradient-heading mb-3">Academic Excellence</h2>

          <p
            className="fw-medium mb-2"
            style={{
              fontSize: "1.125rem",
              color: "rgba(255,255,255,0.8)",
            }}
          >
            Outstanding Results. Exceptional Students. Unlimited Opportunities.
          </p>

          <p
            className="mx-auto"
            style={{
              fontSize: "0.9rem",
              color: "#a3a3a3",
              maxWidth: "42rem",
              lineHeight: 1.7,
            }}
          >
            Our consistent academic performance reflects the dedication of our
            students, the commitment of our teachers, and an environment
            designed for excellence.
          </p>
        </div>

        {/* ═══════════ Carousel ═══════════ */}
        <div
          className="position-relative mx-auto"
          style={{ maxWidth: "64rem" }}
        >
          <div
            className="carousel-wrapper position-relative"
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label="GCE results by year"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
            }}
            onKeyDown={handleKeyDown}
          >
            {/* ── Glass Card ── */}
            <div
              ref={cardRef}
              className={`glass-card${slideExiting ? " slide-exit" : ""}`}
              id={`gce-slide-${cur.year}`}
              role="tabpanel"
              aria-labelledby={`gce-tab-${cur.year}`}
            >
              <div
                className="carousel-inner d-grid"
                style={{ gridTemplateColumns: "260px 1fr" }}
              >
                {/* ── Trophy Panel (Left) ── */}
                <div className="trophy-panel">
                  <div className="trophy-icon-wrap">
                    <i
                      className="bi bi-trophy-fill"
                      style={{
                        fontSize: "2rem",
                        color: "#f97316",
                      }}
                    />
                  </div>

                  <div className="trophy-year">{cur.year}</div>

                  <div className="trophy-badge-label">{cur.badge}</div>

                  <div className="trophy-line d-none d-lg-block" />

                  <div className="trophy-stars d-none d-lg-flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <i
                        key={i}
                        className="bi bi-star-fill"
                        style={{
                          fontSize: "0.8rem",
                          color: "#f97316",
                        }}
                      />
                    ))}
                  </div>

                  <div className="trophy-subtitle d-none d-lg-block">
                    Top Performing
                    <br />
                    Institution
                  </div>
                </div>

                {/* ── Content Panel (Right) ── */}
                <div className="p-4 p-md-5 d-flex flex-column gap-4">
                  {/* Circular Progress */}
                  <div className="d-flex align-items-start gap-4 justify-content-center flex-wrap">
                    {/* OL Circle */}
                    <div className="d-flex flex-column align-items-center gap-2">
                      <div
                        className="position-relative"
                        style={{ width: 130, height: 130 }}
                      >
                        <svg viewBox="0 0 120 120" width="130" height="130">
                          <defs>
                            <linearGradient
                              id="olGrad"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="100%"
                            >
                              <stop offset="0%" stopColor="#f97316" />
                              <stop offset="100%" stopColor="#ea580c" />
                            </linearGradient>
                          </defs>
                          <circle
                            cx="60"
                            cy="60"
                            r="54"
                            className="progress-ring-bg"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r="54"
                            className="progress-ring-fill ring-animated"
                            ref={olCircleRef}
                            stroke="url(#olGrad)"
                            strokeDasharray={CIRCUMFERENCE}
                            strokeDashoffset={CIRCUMFERENCE}
                          />
                        </svg>
                        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center">
                          <span
                            ref={olValueRef}
                            className="fw-bold"
                            style={{
                              fontSize: "1.5rem",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            0%
                          </span>
                        </div>
                      </div>
                      <span
                        className="fw-medium text-uppercase"
                        style={{
                          fontSize: "0.7rem",
                          letterSpacing: "0.08em",
                          color: "#a3a3a3",
                        }}
                      >
                        Ordinary Level
                      </span>
                    </div>

                    {/* AL Circle */}
                    <div className="d-flex flex-column align-items-center gap-2">
                      <div
                        className="position-relative"
                        style={{ width: 130, height: 130 }}
                      >
                        <svg viewBox="0 0 120 120" width="130" height="130">
                          <defs>
                            <linearGradient
                              id="alGrad"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="100%"
                            >
                              <stop offset="0%" stopColor="#3b82f6" />
                              <stop offset="100%" stopColor="#6366f1" />
                            </linearGradient>
                          </defs>
                          <circle
                            cx="60"
                            cy="60"
                            r="54"
                            className="progress-ring-bg"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r="54"
                            className="progress-ring-fill ring-animated"
                            ref={alCircleRef}
                            stroke="url(#alGrad)"
                            strokeDasharray={CIRCUMFERENCE}
                            strokeDashoffset={CIRCUMFERENCE}
                          />
                        </svg>
                        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center">
                          <span
                            ref={alValueRef}
                            className="fw-bold"
                            style={{
                              fontSize: "1.5rem",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            0
                          </span>
                        </div>
                      </div>
                      <span
                        className="fw-medium text-uppercase"
                        style={{
                          fontSize: "0.7rem",
                          letterSpacing: "0.08em",
                          color: "#a3a3a3",
                        }}
                      >
                        Advanced Level
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p
                    className="text-center mx-auto"
                    style={{
                      fontSize: "0.875rem",
                      color: "#737373",
                      maxWidth: "32rem",
                      lineHeight: 1.7,
                    }}
                  >
                    {cur.description}
                  </p>

                  {/* Stat Cards */}
                  <div className="row g-2">
                    <div className="col-6">
                      <div className="stat-card">
                        <div
                          className="stat-icon"
                          style={{
                            background: "rgba(59,130,246,0.1)",
                            color: "#f97316",
                          }}

                        >
                          <i
                            className="bi bi-people"
                            style={{
                              fontSize: "1.3rem",
                            }}
                          />
                        </div>
                        <div>
                          <div
                            ref={statDistRef}
                            className="fw-bold"
                            style={{
                              fontSize: "1.25rem",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            0
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#737373",
                              fontWeight: 500,
                            }}
                          >
                            Ordinary Level Candidates
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-6">
                      <div className="stat-card">
                        <div
                          className="stat-icon"
                          style={{
                            background: "rgba(59,130,246,0.1)",
                            color: "#60a5fa",
                          }}
                        >
                          <i
                            className="bi bi-people"
                            style={{
                              fontSize: "1.3rem",
                            }}
                          />
                        </div>
                        <div>
                          <div
                            ref={statCandRef}
                            className="fw-bold"
                            style={{
                              fontSize: "1.25rem",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            0
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#737373",
                              fontWeight: 500,
                            }}
                          >
                            Advanced Level Candidates
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-6">
                      <div className="stat-card">
                        <div
                          className="stat-icon"
                          style={{
                            background: "rgba(16,185,129,0.1)",
                            color: "#34d399",
                          }}
                        >
                          <i
                            className="bi bi-mortarboard"
                            style={{
                              fontSize: "1.3rem",
                            }}
                          />
                        </div>
                        <div>
                          <div
                            ref={statHundRef}
                            className="fw-bold"
                            style={{
                              fontSize: "1.25rem",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            0
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#737373",
                              fontWeight: 500,
                            }}
                          >
                            Pass in 4 subjects and above
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-6">
                      <div className="stat-card">
                        <div
                          className="stat-icon"
                          style={{
                            background: "rgba(168,85,247,0.1)",
                            color: "#c084fc",
                          }}
                        >
                          <i
                            className="bi bi-mortarboard"
                            style={{
                              fontSize: "1.3rem",
                            }}
                          />
                        </div>
                        <div>
                          <div
                            ref={statUnivRef}
                            className="fw-bold"
                            style={{
                              fontSize: "1.25rem",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            0
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#737373",
                              fontWeight: 500,
                              display: "block",
                            }}
                          >
                            <p>
                              Pass in 2 subjects and above
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quote */}
                  <div className="text-center pt-1">
                    <div className="d-flex align-items-center justify-content-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <i
                          key={i}
                          className="bi bi-star-fill"
                          style={{
                            fontSize: "0.7rem",
                            color: "#f97316",
                          }}
                        />
                      ))}
                    </div>
                    <p
                      className="fst-italic mx-auto"
                      style={{
                        fontSize: "0.875rem",
                        color: "#a3a3a3",
                        maxWidth: "28rem",
                        lineHeight: 1.7,
                      }}
                    >
                      {cur.highlight}
                    </p>
                  </div>

                  {/* CTA Buttons - FIXED ROUTING */}
                  <div className="d-flex align-items-center justify-content-center gap-3 flex-column flex-md-row pt-1">
                    <button
                      className="btn-outline-custom"
                      type="button"
                      onClick={handleViewResults}
                      aria-label={`View ${cur.year} GCE results PDF in new tab`}
                    >
                      <i
                        className="bi bi-file-earmark-text"
                        style={{ fontSize: "1rem" }}
                      />
                      View Full Results
                      <i
                        className="bi bi-box-arrow-up-right"
                        style={{ fontSize: "0.75rem" }}
                      />
                    </button>
                    <button
                      className="btn-primary-custom"
                      type="button"
                      onClick={handleApply}
                      disabled={admissionLoading}
                      aria-busy={admissionLoading}
                      aria-label="Apply for admission"
                    >
                      {admissionLoading ? "Checking status..." : "Apply for Admission"}
                      {!admissionLoading && (
                        <i className="bi bi-arrow-right" style={{ fontSize: "1rem" }} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Arrows ── */}
            <button
              className="carousel-arrow carousel-arrow--prev"
              type="button"
              aria-label="Previous year"
              disabled={transitioningRef.current}
              onClick={() => goToSlide(indexRef.current - 1)}
            >
              <i
                className="bi bi-chevron-left"
                style={{ fontSize: "1.3rem" }}
              />
            </button>
            <button
              className="carousel-arrow carousel-arrow--next"
              type="button"
              aria-label="Next year"
              disabled={transitioningRef.current}
              onClick={() => goToSlide(indexRef.current + 1)}
            >
              <i
                className="bi bi-chevron-right"
                style={{ fontSize: "1.3rem" }}
              />
            </button>
          </div>

          {/* ── Year Tabs ── */}
          <div
            className="d-flex justify-content-center flex-wrap gap-2 mt-4"
            role="tablist"
            aria-label="Choose a year"
          >
            {YEARS.map((y, i) => (
              <button
                key={y.year}
                className={`year-tab${i === index ? " active" : ""}`}
                role="tab"
                aria-selected={i === index}
                aria-controls={`gce-slide-${y.year}`}
                id={`gce-tab-${y.year}`}
                type="button"
                onClick={() => goToSlide(i)}
              >
                {y.year}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════ Achievement Badges ═══════════ */}
        <div
          className="badges-row d-flex justify-content-center flex-wrap gap-2 mt-4 mx-auto"
          style={{ maxWidth: "48rem" }}
        >
          {ACHIEVEMENTS.map((text) => (
            <div key={text} className="achieve-badge">
              <i
                className="bi bi-check-circle-fill"
                style={{
                  fontSize: "0.85rem",
                  color: "#10b981",
                }}
              />
              {text}
            </div>
          ))}
        </div>

        {/* ── Screen-reader live region ── */}
        <span className="visually-hidden" aria-live="polite">
          GCE results for {cur.year}: Ordinary Level {cur.ol}% pass, Advanced
          Level {cur.al}% pass.
        </span>
      </div>
    </section>
  );
};

export default GceResultsCarousel;