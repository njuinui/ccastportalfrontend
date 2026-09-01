// src/components/home/CareersBanner.jsx

import React from "react";
import { Link } from "react-router-dom";
import "./CareersBanner.css";

const PERKS = [
    {
        icon: "fas fa-coins",
        label: "Competitive salary & benefits",
    },
    {
        icon: "fas fa-arrow-trend-up",
        label: "Professional growth & development",
    },
    {
        icon: "fas fa-microscope",
        label: "Modern labs & smart classrooms",
    },
    {
        icon: "fas fa-people-group",
        label: "Supportive academic community",
    },
];

const CAREER_STATS = [
    {
        value: "6+",
        label: "Open positions",
    },
    {
        value: "100%",
        label: "Online application",
    },
    {
        value: "24/7",
        label: "Application access",
    },
];

const CareersBanner = () => {
    return (
        <section
            className="cb"
            aria-labelledby="cb-h"
        >
            <div className="container-xl">
                <div className="cb-card">

                    {/* =====================================================
                        DECORATIVE BACKGROUND
                    ===================================================== */}

                    <div className="cb-grid" aria-hidden="true" />
                    <div className="cb-glow cb-glow--one" aria-hidden="true" />
                    <div className="cb-glow cb-glow--two" aria-hidden="true" />

                    {/* =====================================================
                        LEFT / VISUAL PANEL
                    ===================================================== */}

                    <div className="cb-media">

                        <div className="cb-media-shade" aria-hidden="true" />

                        <div className="cb-orbit cb-orbit--one" aria-hidden="true" />
                        <div className="cb-orbit cb-orbit--two" aria-hidden="true" />

                        <div className="cb-floating cb-floating--top">
                            <span className="cb-floating-icon">
                                <i
                                    className="fas fa-user-check"
                                    aria-hidden="true"
                                />
                            </span>

                            <div>
                                <strong>We're hiring</strong>
                                <span>Join our team</span>
                            </div>
                        </div>

                        <div className="cb-media-content">

                            <div className="cb-hiring-badge">
                                <span className="cb-status-dot" />
                                Recruitment currently open
                            </div>

                            <div className="cb-icon-circle">
                                <i
                                    className="fas fa-chalkboard-user"
                                    aria-hidden="true"
                                />
                            </div>

                            <span className="cb-media-kicker">
                                Careers at CCAST
                            </span>

                            <h3>
                                Make your work
                                <span> matter.</span>
                            </h3>

                            <p>
                                Join a purpose-driven institution where educators,
                                professionals and support teams work together to
                                shape the next generation.
                            </p>

                            <div className="cb-stat-row">
                                {CAREER_STATS.map((stat) => (
                                    <div
                                        className="cb-stat"
                                        key={stat.label}
                                    >
                                        <strong>{stat.value}</strong>
                                        <span>{stat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div
                            className="cb-media-bottom"
                            aria-hidden="true"
                        >
                            <span />
                            <span />
                            <span />
                        </div>
                    </div>

                    {/* =====================================================
                        RIGHT / CONTENT PANEL
                    ===================================================== */}

                    <div className="cb-body">

                        <div className="cb-eyebrow">
                            <span className="cb-eyebrow-icon">
                                <i
                                    className="fas fa-briefcase"
                                    aria-hidden="true"
                                />
                            </span>

                            <span>Careers at CCAST Bambili</span>
                        </div>

                        <h2
                            id="cb-h"
                            className="cb-title"
                        >
                            Inspire.
                            <br />

                            <span className="cb-title-accent">
                                Lead.
                            </span>{" "}

                            <span className="cb-title-muted">
                                Transform.
                            </span>
                        </h2>

                        <p className="cb-lead">
                            CCAST Bambili is looking for talented teachers,
                            laboratory technicians, ICT specialists, librarians
                            and administrative professionals who are passionate
                            about education, discipline, innovation and student
                            success.
                        </p>

                        {/* =================================================
                            PERKS
                        ================================================= */}

                        <div className="cb-perks-heading">
                            <span>Why join CCAST?</span>
                        </div>

                        <ul className="cb-perks">
                            {PERKS.map((perk) => (
                                <li
                                    key={perk.label}
                                    className="cb-perk"
                                >
                                    <span className="cb-perk-icon">
                                        <i
                                            className={perk.icon}
                                            aria-hidden="true"
                                        />
                                    </span>

                                    <span className="cb-perk-label">
                                        {perk.label}
                                    </span>

                                    <i
                                        className="fas fa-check cb-perk-check"
                                        aria-hidden="true"
                                    />
                                </li>
                            ))}
                        </ul>

                        {/* =================================================
                            ACTIONS
                        ================================================= */}

                        <div className="cb-ctas">

                            <Link
                                to="/careers"
                                className="cb-btn cb-btn--primary"
                            >
                                <span>
                                    <i
                                        className="fas fa-magnifying-glass"
                                        aria-hidden="true"
                                    />
                                </span>

                                View open positions

                                <i
                                    className="fas fa-arrow-right cb-arrow"
                                    aria-hidden="true"
                                />
                            </Link>

                            <Link
                                to="/careers/apply"
                                className="cb-btn cb-btn--ghost"
                            >
                                <span>
                                    <i
                                        className="fas fa-file-signature"
                                        aria-hidden="true"
                                    />
                                </span>

                                Submit an application
                            </Link>
                        </div>

                        {/* =================================================
                            TRUST NOTE
                        ================================================= */}

                        <div className="cb-note">
                            <span className="cb-note-icon">
                                <i
                                    className="fas fa-shield-halved"
                                    aria-hidden="true"
                                />
                            </span>

                            <span>
                                Applications are securely reviewed by the
                                CCAST Human Resources team.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CareersBanner;