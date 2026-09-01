import React, { useState, useEffect, useRef, useCallback } from "react";
import "./LabCarousel.css";

const LABS = [
  {
    key: "biology",
    label: "Biology Lab",
    desc: "Hands-on life sciences with modern microscopy and specimen study.",
    img: "https://picsum.photos/seed/ccast-biology-lab/1000/900.jpg",
  },
  {
    key: "chemistry",
    label: "Chemistry Lab",
    desc: "Fully-equipped wet labs for safe, guided experimentation.",
    img: "https://picsum.photos/seed/ccast-chemistry-lab/1000/900.jpg",
  },
  {
    key: "physics",
    label: "Physics Lab",
    desc: "Applied mechanics, optics, and electronics workstations.",
    img: "https://picsum.photos/seed/ccast-physics-lab/1000/900.jpg",
  },
  {
    key: "computer",
    label: "Computer Lab",
    desc: "Modern workstations for programming, robotics, and digital literacy.",
    img: "https://picsum.photos/seed/ccast-computer-lab/1000/900.jpg",
  },
  {
    key: "food",
    label: "Food & Nutrition Lab",
    desc: "Practical culinary and nutrition science training kitchens.",
    img: "https://picsum.photos/seed/ccast-food-nutrition-lab/1000/900.jpg",
  },
];

const AUTOPLAY_MS = 4500;

/**
 * Auto-advancing hero carousel showcasing the school's lab facilities.
 * Pauses on hover/focus, supports arrow-key navigation, and respects
 * prefers-reduced-motion (autoplay is disabled, manual controls still work).
 */
const LabCarousel = () => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const goTo = useCallback((i) => {
    setIndex(((i % LABS.length) + LABS.length) % LABS.length);
  }, []);
  const next = useCallback(() => goTo(index + 1), [index, goTo]);
  const prev = useCallback(() => goTo(index - 1), [index, goTo]);

  useEffect(() => {
    if (paused || reduceMotion) return undefined;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % LABS.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timerRef.current);
  }, [paused, reduceMotion]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  };

  return (
    <div
      className="lc"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="School laboratories"
    >
      <div className="lc-track">
        {LABS.map((lab, i) => (
          <figure
            className={`lc-slide ${i === index ? "lc-slide--active" : ""}`}
            key={lab.key}
            aria-hidden={i !== index}
          >
            <img
              src={lab.img}
              alt={`${lab.label} at CCAST Bambili`}
              loading={i === 0 ? "eager" : "lazy"}
            />
            <div className="lc-slide-overlay"></div>
            <figcaption className="lc-slide-caption">
              <span className="lc-slide-tag">Facility Tour</span>
              <h3>{lab.label}</h3>
              <p>{lab.desc}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      <button className="lc-arrow lc-arrow--prev" onClick={prev} aria-label="Previous lab">
        <i className="fas fa-chevron-left" aria-hidden="true"></i>
      </button>
      <button className="lc-arrow lc-arrow--next" onClick={next} aria-label="Next lab">
        <i className="fas fa-chevron-right" aria-hidden="true"></i>
      </button>

      <div className="lc-dots" role="tablist" aria-label="Choose a lab">
        {LABS.map((lab, i) => (
          <button
            key={lab.key}
            className={`lc-dot ${i === index ? "lc-dot--active" : ""}`}
            role="tab"
            aria-selected={i === index}
            aria-label={`Show ${lab.label}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>

      <span className="visually-hidden" aria-live="polite">
        {LABS[index].label} facility, slide {index + 1} of {LABS.length}
      </span>
    </div>
  );
};

export default LabCarousel;