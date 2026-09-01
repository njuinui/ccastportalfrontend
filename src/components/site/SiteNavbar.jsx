// src/components/layout/SiteNavbar.jsx

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { usePublicVacancies } from "../../api/vacancies";
import { useIsAdmissionOpen } from "../../api/public";

import AdmissionGuardLink from "../site/AdmissionGuardLink";

import "../../styles/site.css";

/* ============================================================
   NAVIGATION LINKS
   ============================================================ */

export const NAV_LINKS = [
  {
    label: "Home",
    to: "/",
  },
  {
    label: "About",
    to: "/about",
  },
  {
    label: "Announcements",
    to: "/announcements",
  },
  {
    label: "Blog",
    to: "/blog",
  },
  {
    label: "Careers",
    to: "/careers",
  },
  {
    label: "Contact",
    to: "/contact",
  },
];

/* ============================================================
   SITE NAVBAR
   ============================================================ */

const SiteNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /* ==========================================================
     ADMISSION STATUS
  ========================================================== */

  const {
    isOpen: isAdmissionOpen,
    isLoading: isAdmissionLoading,
  } = useIsAdmissionOpen();

  /* ==========================================================
     PUBLIC VACANCIES

     The Careers badge is displayed only when the API confirms
     that at least one vacancy is available.
  ========================================================== */

  const {
    data: vacanciesData,
    isLoading: isVacanciesLoading,
    isError: isVacanciesError,
  } = usePublicVacancies();

  /* ==========================================================
     LOCAL STATE
  ========================================================== */

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  /* ==========================================================
     REFS

     navRef:
       Used for outside-click detection.

     mobileMenuRef:
       Used for focus management inside the mobile menu.

     mobileToggleRef:
       Receives focus again whenever the menu closes.

     previousMenuOpenRef:
       Lets us detect an actual OPEN → CLOSED transition
       instead of focusing the toggle on the initial render.
  ========================================================== */

  const navRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileToggleRef = useRef(null);
  const previousMenuOpenRef = useRef(false);

  /* ==========================================================
     NORMALIZE VACANCY RESPONSE

     Supports common API response structures:

     1. [...]
     2. { data: [...] }
     3. { vacancies: [...] }
  ========================================================== */

  const vacancies = useMemo(() => {
    if (Array.isArray(vacanciesData)) {
      return vacanciesData;
    }

    if (Array.isArray(vacanciesData?.data)) {
      return vacanciesData.data;
    }

    if (Array.isArray(vacanciesData?.vacancies)) {
      return vacanciesData.vacancies;
    }

    return [];
  }, [vacanciesData]);

  /* ==========================================================
     CHECK FOR AVAILABLE VACANCY

     Rules:
     - While loading → do not show badge.
     - If API fails → do not show badge.
     - If there are no vacancies → do not show badge.
     - If one or more vacancies exist → show badge.
  ========================================================== */

  const hasVacancy =
    !isVacanciesLoading &&
    !isVacanciesError &&
    vacancies.length > 0;

  /* ==========================================================
     SCROLL STATE
  ========================================================== */

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    // Set initial state immediately.
    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /* ==========================================================
     CLOSE MOBILE MENU AFTER ROUTE CHANGE

     The route change can happen before/after the click handler,
     so we make sure the menu is always closed whenever the
     pathname changes.

     We do NOT directly manipulate focus here.
     Focus restoration is handled centrally below.
  ========================================================== */

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  /* ==========================================================
     FOCUS MANAGEMENT

     Accessibility rule:

     A focused element must never remain inside an element
     that has aria-hidden="true".

     When the menu closes:
       → remove focus from the hidden menu
       → return focus to the menu toggle.

     When the menu opens:
       → move focus to the close button if available.

     This creates a predictable keyboard experience.
  ========================================================== */

  useEffect(() => {
    const wasOpen = previousMenuOpenRef.current;

    if (menuOpen && !wasOpen) {
      requestAnimationFrame(() => {
        const closeButton =
          mobileMenuRef.current?.querySelector(
            ".hp-mobile-close"
          );

        closeButton?.focus();
      });
    }

    if (!menuOpen && wasOpen) {
      requestAnimationFrame(() => {
        mobileToggleRef.current?.focus();
      });
    }

    previousMenuOpenRef.current = menuOpen;
  }, [menuOpen]);

  /* ==========================================================
     CLOSE MOBILE MENU
  ========================================================== */

  const closeMobileMenu = () => {
    setMenuOpen(false);
  };

  /* ==========================================================
     OUTSIDE CLICK / ESCAPE KEY

     All closing paths use closeMobileMenu() so focus management
     remains consistent.
  ========================================================== */

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (
        navRef.current &&
        !navRef.current.contains(event.target)
      ) {
        closeMobileMenu();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeMobileMenu();
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    // Prevent background scrolling while mobile menu is open.
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );

      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  /* ==========================================================
     CLEANUP BODY SCROLL LOCK

     Ensures that navigation/unmounting cannot accidentally
     leave the page locked.
  ========================================================== */

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  /* ==========================================================
     ACTIVE ROUTE
  ========================================================== */

  const isActive = (path) => {
    // Home should only be active on the exact root route.
    if (path === "/") {
      return location.pathname === "/";
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  /* ==========================================================
     LOGIN NAVIGATION
  ========================================================== */

  const goToLogin = () => {
    closeMobileMenu();
    navigate("/login");
  };

  /* ==========================================================
     ADMISSION LINK

     Rules:
     - While API is loading → render nothing.
     - If admission is closed → render nothing.
     - If admission is open → render the link.
  ========================================================== */

  const renderAdmissionLink = (className) => {
    if (isAdmissionLoading) {
      return null;
    }

    if (!isAdmissionOpen) {
      return null;
    }

    return (
      <AdmissionGuardLink className={className}>
        <span className="hp-admission-dot" />

        <span>
          Admissions Open
        </span>
      </AdmissionGuardLink>
    );
  };

  /* ==========================================================
     CAREERS BADGE

     Centralized so desktop and mobile use exactly the same
     vacancy logic.
  ========================================================== */

  const renderCareersBadge = (path) => {
    if (path !== "/careers") {
      return null;
    }

    if (!hasVacancy) {
      return null;
    }

    return (
      <span
        className="hp-nav-badge"
        aria-label="There are available job vacancies"
      >
        We're Hiring
      </span>
    );
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <nav
      ref={navRef}
      className={`hp-nav ${
        scrolled
          ? "hp-nav--scrolled"
          : ""
      } ${
        menuOpen
          ? "hp-nav--open"
          : ""
      }`}
      aria-label="Main navigation"
    >
      {/* ========================================================
          MAIN NAVIGATION CONTAINER
      ======================================================== */}

      <div className="container-xl hp-nav-container">

        {/* ======================================================
            BRAND
        ====================================================== */}

        <Link
          to="/"
          className="hp-brand"
          aria-label="CCAST Bambili home"
          onClick={closeMobileMenu}
        >
          <span className="hp-brand-mark">
            C
          </span>

          <span className="hp-brand-copy">
            <strong>
              CCAST Bambili
            </strong>

            <small>
              Student Management System
            </small>
          </span>
        </Link>

        {/* ======================================================
            DESKTOP NAVIGATION
        ====================================================== */}

        <div className="hp-desktop-nav">

          {/* ====================================================
              NAVIGATION LINKS
          ==================================================== */}

          <ul className="hp-nav-links">
            {NAV_LINKS.map((item) => {
              const active = isActive(item.to);

              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`hp-nav-link ${
                      active
                        ? "hp-nav-link--active"
                        : ""
                    }`}
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                  >
                    <span>
                      {item.label}
                    </span>

                    {/* Show only when vacancy exists */}
                    {renderCareersBadge(item.to)}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* ====================================================
              DESKTOP ACTIONS
          ==================================================== */}

          <div className="hp-nav-actions">

            {/* Admissions Open */}
            {renderAdmissionLink(
              "hp-admission-status"
            )}

            {/* Separator only when admission button exists */}
            {!isAdmissionLoading &&
              isAdmissionOpen && (
                <span
                  className="hp-nav-separator"
                  aria-hidden="true"
                />
              )}

            {/* Sign In */}
            <button
              type="button"
              className="hp-signin"
              onClick={goToLogin}
            >
              <span className="hp-signin-icon">
                <i
                  className="fas fa-right-to-bracket"
                  aria-hidden="true"
                />
              </span>

              <span>
                Sign In
              </span>
            </button>
          </div>
        </div>

        {/* ======================================================
            MOBILE MENU TOGGLE
        ====================================================== */}

        <button
          ref={mobileToggleRef}
          type="button"
          className={`hp-mobile-toggle ${
            menuOpen
              ? "hp-mobile-toggle--open"
              : ""
          }`}
          onClick={() => {
            setMenuOpen((value) => !value);
          }}
          aria-label={
            menuOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={menuOpen}
          aria-controls="hp-mobile-menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* ========================================================
          MOBILE MENU

          IMPORTANT ACCESSIBILITY DETAILS:

          aria-hidden:
            Communicates visibility to assistive technology.

          inert:
            Prevents keyboard focus/interactions when closed.

          These two attributes work together with the focus
          management above.
      ======================================================== */}

      <div
        ref={mobileMenuRef}
        id="hp-mobile-menu"
        className={`hp-mobile-menu ${
          menuOpen
            ? "hp-mobile-menu--open"
            : ""
        }`}
        aria-hidden={!menuOpen}
        inert={!menuOpen ? true : undefined}
      >
        <div className="hp-mobile-menu-inner">

          {/* ====================================================
              MOBILE HEADER
          ==================================================== */}

          <div className="hp-mobile-menu-header">
            <div>
              <span>
                Navigation
              </span>

              <strong>
                CCAST Bambili
              </strong>
            </div>

            <button
              type="button"
              className="hp-mobile-close"
              onClick={closeMobileMenu}
              aria-label="Close navigation"
            >
              <i
                className="fas fa-xmark"
                aria-hidden="true"
              />
            </button>
          </div>

          {/* ====================================================
              MOBILE NAVIGATION LINKS
          ==================================================== */}

          <ul className="hp-mobile-links">
            {NAV_LINKS.map((item) => {
              const active = isActive(item.to);

              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`hp-mobile-link ${
                      active
                        ? "active"
                        : ""
                    }`}
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                    onClick={closeMobileMenu}
                  >
                    <span>
                      {item.label}
                    </span>

                    {/* Show only when vacancy exists */}
                    {renderCareersBadge(item.to)}

                    <i
                      className="fas fa-arrow-right"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* ====================================================
              MOBILE ACTIONS
          ==================================================== */}

          <div className="hp-mobile-actions">

            {/* Admissions Open */}
            {renderAdmissionLink(
              "hp-mobile-admission"
            )}

            {/* Sign In */}
            <button
              type="button"
              className="hp-mobile-signin"
              onClick={goToLogin}
            >
              <i
                className="fas fa-right-to-bracket"
                aria-hidden="true"
              />

              <span>
                Sign In
              </span>
            </button>
          </div>

          {/* ====================================================
              MOBILE FOOTER
          ==================================================== */}

          <div className="hp-mobile-footer">
            <span>
              Excellence • Discipline • Innovation
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default SiteNavbar;