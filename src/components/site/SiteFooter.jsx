// src/components/layout/SiteFooter.jsx

import React from "react";
import { Link } from "react-router-dom";

const QUICK_LINKS = [
    {
        label: "Home",
        to: "/",
        icon: "fa-house",
    },
    {
        label: "About CCAST",
        to: "/about",
        icon: "fa-building-columns",
    },
    {
        label: "Announcements",
        to: "/announcements",
        icon: "fa-bullhorn",
    },
    {
        label: "Blog",
        to: "/blog",
        icon: "fa-newspaper",
    },
    {
        label: "Careers",
        to: "/careers",
        icon: "fa-briefcase",
        highlight: true,
    },
    {
        label: "Contact",
        to: "/contact",
        icon: "fa-envelope",
    },
];

const RESOURCES = [
    {
        label: "Student Portal",
        to: "/login",
        icon: "fa-user-graduate",
    },
    {
        label: "Faculty Portal",
        to: "/login",
        icon: "fa-chalkboard-user",
    },
    {
        label: "Admissions",
        to: "/admissions",
        icon: "fa-file-signature",
    },
    {
        label: "Teacher Applications",
        to: "/careers",
        icon: "fa-person-chalkboard",
    },
    {
        label: "Help Center",
        to: "/help",
        icon: "fa-circle-question",
    },
    {
        label: "FAQs",
        to: "/faqs",
        icon: "fa-comments",
    },
];

const SOCIALS = [
    {
        icon: "facebook-f",
        label: "Facebook",
        href: "#",
    },
    {
        icon: "x-twitter",
        label: "X",
        href: "#",
    },
    {
        icon: "linkedin-in",
        label: "LinkedIn",
        href: "#",
    },
    {
        icon: "youtube",
        label: "YouTube",
        href: "#",
    },
];

const SiteFooter = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="hp-ft">

            {/* ======================================================
                DECORATIVE BACKGROUND
            ====================================================== */}

            <div className="hp-ft-glow hp-ft-glow--one" />
            <div className="hp-ft-glow hp-ft-glow--two" />

            <div className="container-xl position-relative">

                {/* ==================================================
                    TOP CTA
                ================================================== */}

                <div className="hp-ft-cta">

                    <div className="hp-ft-cta-content">

                        <div className="hp-ft-cta-icon">
                            <i
                                className="fas fa-graduation-cap"
                                aria-hidden="true"
                            />
                        </div>

                        <div>
                            <span className="hp-ft-cta-eyebrow">
                                Start your journey
                            </span>

                            <h3 className="hp-ft-cta-title">
                                Shape your future with CCAST Bambili
                            </h3>

                            <p className="hp-ft-cta-text">
                                Discover quality education, innovation,
                                discipline and opportunities for excellence.
                            </p>
                        </div>

                    </div>

                    <div className="hp-ft-cta-actions">

                        <Link
                            to="/admissions"
                            className="hp-ft-cta-primary"
                        >
                            <i
                                className="fas fa-file-signature"
                                aria-hidden="true"
                            />

                            Apply for Admission

                            <i
                                className="fas fa-arrow-right"
                                aria-hidden="true"
                            />
                        </Link>

                        <Link
                            to="/about"
                            className="hp-ft-cta-secondary"
                        >
                            Explore CCAST
                        </Link>

                    </div>

                </div>

                {/* ==================================================
                    DIVIDER
                ================================================== */}

                <div className="hp-ft-divider" />

                {/* ==================================================
                    MAIN FOOTER
                ================================================== */}

                <div className="hp-ft-grid">

                    {/* ==================================================
                        BRAND
                    ================================================== */}

                    <div className="hp-ft-brand">

                        <Link
                            to="/"
                            className="hp-ft-brand-link"
                            aria-label="CCAST Bambili home"
                        >

                            <div className="hp-ft-brand-mark">
                                C
                            </div>

                            <div className="hp-ft-brand-copy">

                                <strong>
                                    CCAST Bambili
                                </strong>

                                <span>
                                    Student Management System
                                </span>

                            </div>

                        </Link>

                        <p className="hp-ft-about">
                            Empowering academic excellence through
                            technology, innovation and discipline.
                            The official digital platform connecting
                            students, teachers, parents and administrators
                            at CCAST Bambili.
                        </p>

                        {/* Mission */}
                        <div className="hp-ft-mission">

                            <span className="hp-ft-mission-icon">
                                <i
                                    className="fas fa-sparkles"
                                    aria-hidden="true"
                                />
                            </span>

                            <div>
                                <span className="hp-ft-mission-label">
                                    Our commitment
                                </span>

                                <strong>
                                    Excellence • Discipline • Innovation
                                </strong>
                            </div>

                        </div>

                        {/* Social */}
                        <div className="hp-ft-social-wrap">

                            <span className="hp-ft-social-title">
                                Follow CCAST
                            </span>

                            <div className="hp-ft-soc">

                                {SOCIALS.map((social) => (
                                    <a
                                        href={social.href}
                                        key={social.icon}
                                        className="hp-ft-si"
                                        aria-label={social.label}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <i
                                            className={`fab fa-${social.icon}`}
                                            aria-hidden="true"
                                        />
                                    </a>
                                ))}

                            </div>

                        </div>

                    </div>

                    {/* ==================================================
                        QUICK LINKS
                    ================================================== */}

                    <div className="hp-ft-column">

                        <h6 className="hp-ft-h">
                            <span>Explore</span>
                        </h6>

                        <ul className="hp-ft-ul">

                            {QUICK_LINKS.map((link) => (
                                <li key={link.to}>

                                    <Link
                                        to={link.to}
                                        className={
                                            link.highlight
                                                ? "hp-ft-link-highlight"
                                                : ""
                                        }
                                    >

                                        <span className="hp-ft-link-icon">
                                            <i
                                                className={`fas ${link.icon}`}
                                                aria-hidden="true"
                                            />
                                        </span>

                                        <span className="hp-ft-link-label">
                                            {link.label}
                                        </span>

                                        {link.highlight && (
                                            <span className="hp-ft-new">
                                                Hiring
                                            </span>
                                        )}

                                        <i
                                            className="fas fa-arrow-right hp-ft-link-arrow"
                                            aria-hidden="true"
                                        />

                                    </Link>

                                </li>
                            ))}

                        </ul>

                    </div>

                    {/* ==================================================
                        RESOURCES
                    ================================================== */}

                    <div className="hp-ft-column">

                        <h6 className="hp-ft-h">
                            <span>Resources</span>
                        </h6>

                        <ul className="hp-ft-ul">

                            {RESOURCES.map((resource) => (
                                <li
                                    key={
                                        resource.to +
                                        resource.label
                                    }
                                >

                                    <Link to={resource.to}>

                                        <span className="hp-ft-link-icon">
                                            <i
                                                className={`fas ${resource.icon}`}
                                                aria-hidden="true"
                                            />
                                        </span>

                                        <span className="hp-ft-link-label">
                                            {resource.label}
                                        </span>

                                        <i
                                            className="fas fa-arrow-right hp-ft-link-arrow"
                                            aria-hidden="true"
                                        />

                                    </Link>

                                </li>
                            ))}

                        </ul>

                    </div>

                    {/* ==================================================
                        CONTACT
                    ================================================== */}

                    <div className="hp-ft-column hp-ft-contact-column">

                        <h6 className="hp-ft-h">
                            <span>Contact Us</span>
                        </h6>

                        <ul className="hp-ft-ct">

                            <li>

                                <span className="hp-ft-contact-icon">
                                    <i
                                        className="fas fa-location-dot"
                                        aria-hidden="true"
                                    />
                                </span>

                                <div>
                                    <small>Campus</small>

                                    <span>
                                        Bambili, Bamenda
                                        <br />
                                        North West Region, Cameroon
                                    </span>
                                </div>

                            </li>

                            <li>

                                <span className="hp-ft-contact-icon">
                                    <i
                                        className="fas fa-envelope"
                                        aria-hidden="true"
                                    />
                                </span>

                                <div>
                                    <small>Email</small>

                                    <a href="mailto:info@ccastbambili.cm">
                                        info@ccastbambili.cm
                                    </a>
                                </div>

                            </li>

                            <li>

                                <span className="hp-ft-contact-icon">
                                    <i
                                        className="fas fa-phone"
                                        aria-hidden="true"
                                    />
                                </span>

                                <div>
                                    <small>Phone</small>

                                    <a href="tel:+237233330000">
                                        +237 233 33 00 00
                                    </a>
                                </div>

                            </li>

                            <li>

                                <span className="hp-ft-contact-icon">
                                    <i
                                        className="fas fa-clock"
                                        aria-hidden="true"
                                    />
                                </span>

                                <div>
                                    <small>Office hours</small>

                                    <span>
                                        Monday – Friday
                                        <br />
                                        8:00 AM – 5:00 PM
                                    </span>
                                </div>

                            </li>

                        </ul>

                        {/* Careers CTA */}

                        <Link
                            to="/careers"
                            className="hp-ft-apply"
                        >

                            <span className="hp-ft-apply-icon">
                                <i
                                    className="fas fa-person-chalkboard"
                                    aria-hidden="true"
                                />
                            </span>

                            <span className="hp-ft-apply-copy">

                                <small>
                                    Join our team
                                </small>

                                <strong>
                                    Teaching opportunities
                                </strong>

                            </span>

                            <i
                                className="fas fa-arrow-right hp-ft-apply-arrow"
                                aria-hidden="true"
                            />

                        </Link>

                    </div>

                </div>

                {/* ==================================================
                    BOTTOM BAR
                ================================================== */}

                <div className="hp-ft-bot">

                    <div className="hp-ft-copyright">

                        <span className="hp-ft-copyright-mark">
                            ©
                        </span>

                        <span>
                            {year} CCAST Bambili.
                            All rights reserved.
                        </span>

                    </div>

                    <div className="hp-ft-bot-links">

                        <Link to="/privacy">
                            Privacy Policy
                        </Link>

                        <span className="hp-ft-dot" />

                        <Link to="/terms">
                            Terms of Service
                        </Link>

                        <span className="hp-ft-dot" />

                        <Link to="/sitemap">
                            Sitemap
                        </Link>

                    </div>

                    <div className="hp-ft-powered">
                        <span>Built for</span>
                        <strong>CCAST Bambili</strong>
                    </div>

                </div>

            </div>
        </footer>
    );
};

export default SiteFooter;