import React, { useState, useEffect, useRef, useCallback } from "react";
import "./Testimonials.css";
import Testimonial1 from "../../assets/images/testimonials/testimonial-1.png";
import Testimonial2 from "../../assets/images/testimonials/testimonial-2.png";
import Testimonial3 from "../../assets/images/testimonials/testimonial-3.png";
import Testimonial4 from "../../assets/images/testimonials/testimonial-4.png";

/**
 * Student Success Stories — premium glass testimonial carousel.
 * Auto-advancing, direction-aware slide+scale+blur transitions,
 * full keyboard support, pause-on-hover/focus.
 *
 * Drop real photos into: /assets/images/testimonials/Student1.jpg … Student4.jpg
 * and a faint backdrop at:   /assets/images/testimonials/students-bg.jpg
 */
const TESTIMONIALS = [
  {
    quote:
      "Before joining CCAST, I lacked confidence in Physics and Mathematics. Thanks to the dedication of my teachers and access to modern laboratories, I graduated with distinction and secured admission into the University of Buea. Choosing CCAST was one of the best decisions of my life.",
    name: "Ngwa Brandon",
    department: "Computer Engineering",
    grad: "Class of 2025 · GCE Advanced Level",
    rating: 5,
    avatar: Testimonial1,
  },
  {
    quote:
      "Beyond the classroom, the robotics club gave me a place to build, fail, and try again. Through CCAST's innovation programs I earned a national award and a full scholarship to study Mechatronics at the University of Douala.",
    name: "Achidi Laura",
    department: "Electrical Engineering",
    grad: "Class of 2024 · GCE Advanced Level",
    rating: 5,
    avatar: Testimonial2,
  },
  {
    quote:
      "What I value most is how well the school knows each student. My progress was tracked closely through personalized mentoring, and my parents could follow everything from home. I'm now studying Accounting at the University of Bamenda.",
    name: "Tabi Emmanuel",
    department: "Accounting",
    grad: "Class of 2024 · Commercial Section",
    rating: 5,
    avatar: Testimonial3,
  },
  {
    quote:
      "Coming from another town, I settled in quickly thanks to the warm community. The study support during GCE exam season genuinely made a difference — I passed with four A-grades and earned admission into ENSPT Maroua.",
    name: "Mbah Precious",
    department: "Mechanical Engineering",
    grad: "Class of 2023 · GCE Advanced Level",
    rating: 5,
    avatar: Testimonial4,
  },
];

const SUCCESS_STATS = [
  { value: 98, label: "Student Satisfaction" },
  { value: 92, label: "University Admission" },
  { value: 96, label: "Parents Recommend Us" },
];

const TRUSTED_BY = [
  "University of Buea",
  "MINESUP",
  "GCE Board",
  "Cisco Academy",
  "Microsoft",
];

const AUTOPLAY_MS = 7000;

const Stars = ({ count = 5 }) => (
  <span className="tst-stars" aria-label={`${count} out of 5 stars`}>
    {"★".repeat(count)}
  </span>
);

const VerifiedBadge = () => (
  <span className="tst-verified">
    <i className="fas fa-check-circle" aria-hidden="true"></i>
    Verified Graduate
  </span>
);

const Testimonials = () => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const goTo = useCallback((i, dir = 1) => {
    setDirection(dir);
    setIndex(((i % TESTIMONIALS.length) + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  const next = useCallback(() => goTo(index + 1, 1), [index, goTo]);
  const prev = useCallback(() => goTo(index - 1, -1), [index, goTo]);

  useEffect(() => {
    if (paused || reduceMotion) return undefined;
    timerRef.current = setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timerRef.current);
  }, [paused, reduceMotion]);

  const t = TESTIMONIALS[index];

  return (
    <section className="tst" aria-labelledby="tst-h">
      <div className="container-xl">
        {/* Heading */}
        <div className="tst-hd">
          <span className="tst-tag">
            <i className="fas fa-graduation-cap" aria-hidden="true"></i>
            Student Success Stories
          </span>
          <h2 className="tst-h2" id="tst-h">
            Real Experiences. Real Achievements. Real Impact.
          </h2>
          <p className="tst-desc">
            Hear directly from graduates whose journey at CCAST Bambili prepared
            them for university and beyond.
          </p>

          <div className="tst-rating-summary">
            <span className="tst-rating-stars">★★★★★</span>
            <span className="tst-rating-num">4.9</span>
            <span className="tst-rating-lbl">Average Student Satisfaction</span>
          </div>
        </div>

        {/* Carousel */}
        <div
          className="tst-stage"
          role="region"
          aria-roledescription="carousel"
          aria-label="Student testimonials"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") next();
            if (e.key === "ArrowLeft") prev();
          }}
        >
          <button className="tst-arrow tst-arrow--prev" onClick={prev} aria-label="Previous testimonial">
            <i className="fas fa-chevron-left" aria-hidden="true"></i>
          </button>

          <figure
            className={`tst-card ${direction === 1 ? "tst-card--rtl" : "tst-card--ltr"}`}
            key={index}
          >
            <span className="tst-quote-bg" aria-hidden="true">❝</span>
            <Stars count={t.rating} />
            <blockquote className="tst-quote">{t.quote}</blockquote>
            <figcaption className="tst-person">
              <img
                className="tst-avatar"
                src={t.avatar}
                alt={`Portrait of ${t.name}`}
                loading="lazy"
              />
              <div className="tst-person-info">
                <div className="tst-name-row">
                  <span className="tst-name">{t.name}</span>
                  <VerifiedBadge />
                </div>
                <span className="tst-dept">{t.department}</span>
                <span className="tst-grad">{t.grad}</span>
              </div>
            </figcaption>
          </figure>

          <button className="tst-arrow tst-arrow--next" onClick={next} aria-label="Next testimonial">
            <i className="fas fa-chevron-right" aria-hidden="true"></i>
          </button>
        </div>

        {/* Dots */}
        <div className="tst-dots" role="tablist" aria-label="Choose a testimonial">
          {TESTIMONIALS.map((item, i) => (
            <button
              key={item.name}
              className={`tst-dot ${i === index ? "tst-dot--active" : ""}`}
              role="tab"
              aria-selected={i === index}
              aria-label={`Testimonial from ${item.name}`}
              onClick={() => goTo(i, i > index ? 1 : -1)}
            />
          ))}
        </div>

        {/* Student success stats */}
        <div className="tst-success">
          {SUCCESS_STATS.map((s, i) => (
            <div
              className="tst-success-card rv-t"
              key={s.label}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="tst-success-n">{s.value}%</div>
              <div className="tst-success-l">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Trusted by */}
        <div className="tst-trusted">
          <div className="tst-trusted-lbl">Trusted By</div>
          <div className="tst-trusted-logos">
            {TRUSTED_BY.map((logo) => (
              <span className="tst-trusted-logo" key={logo}>{logo}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;