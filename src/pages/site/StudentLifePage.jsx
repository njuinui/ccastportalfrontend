// src/pages/site/StudentLifePage.jsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import SiteNavbar from "../../components/site/SiteNavbar";
import SiteFooter from "../../components/site/SiteFooter";
import useRevealOnScroll from "../../hooks/useRevealOnScroll";
import "./StudentLifePage.css";

const ACTIVITIES = [
    {
        id: "sports",
        category: "Sports",
        title: "Sports & Athletics",
        icon: "fas fa-basketball",
        color: "#f97316",
        image: "https://picsum.photos/seed/sl-sports/800/500",
        description: "Football, basketball, volleyball, athletics, handball and table tennis. We compete at regional and national levels.",
        schedule: "Tuesdays & Thursdays • 3:30 PM – 5:30 PM",
        participants: "200+",
        tags: ["Football", "Basketball", "Athletics", "Handball"],
    },
    {
        id: "stem-club",
        category: "STEM",
        title: "STEM & Robotics Club",
        icon: "fas fa-microchip",
        color: "#3b82f6",
        image: "https://picsum.photos/seed/sl-robotics/800/500",
        description: "Hands-on experiments, robotics builds, mathematics olympiads and science fair projects that prepare students for innovation.",
        schedule: "Wednesdays • 3:00 PM – 5:00 PM",
        participants: "150+",
        tags: ["Robotics", "Maths", "Physics", "Chemistry"],
    },
    {
        id: "ict-lab",
        category: "STEM",
        title: "ICT & Coding Lab",
        icon: "fas fa-laptop-code",
        color: "#8b5cf6",
        image: "https://picsum.photos/seed/sl-ict/800/500",
        description: "Web development, Python, scratch, networking fundamentals and preparation for international ICT certifications.",
        schedule: "Mondays & Fridays • 3:30 PM – 5:30 PM",
        participants: "120+",
        tags: ["Coding", "Web Dev", "Networking"],
    },
    {
        id: "cultural",
        category: "Arts",
        title: "Cultural & Arts",
        icon: "fas fa-masks-theater",
        color: "#ec4899",
        image: "https://picsum.photos/seed/sl-culture/800/500",
        description: "Drama, traditional and modern dance, music band, choir, fine arts and photography. Annual cultural week celebration.",
        schedule: "Fridays • 3:30 PM – 5:30 PM",
        participants: "300+",
        tags: ["Drama", "Dance", "Music", "Art"],
    },
    {
        id: "leadership",
        category: "Leadership",
        title: "Leadership & Debate",
        icon: "fas fa-people-group",
        color: "#0ea5e9",
        image: "https://picsum.photos/seed/sl-debate/800/500",
        description: "Student Government, debate club, Model UN, public speaking and youth parliament training for confident leaders.",
        schedule: "Saturdays • 10:00 AM – 12:00 PM",
        participants: "80+",
        tags: ["Debate", "Public Speaking", "Model UN"],
    },
    {
        id: "community",
        category: "Community",
        title: "Community Service",
        icon: "fas fa-hand-holding-heart",
        color: "#16a34a",
        image: "https://picsum.photos/seed/sl-community/800/500",
        description: "Environmental cleanup, hospital visits, charity drives, mentorship of younger students and outreach projects.",
        schedule: "Once a month • Saturdays",
        participants: "300+",
        tags: ["Outreach", "Environment", "Mentorship"],
    },
    {
        id: "journalism",
        category: "Arts",
        title: "Journalism & Media",
        icon: "fas fa-newspaper",
        color: "#f59e0b",
        image: "https://picsum.photos/seed/sl-journalism/800/500",
        description: "School magazine, podcast production, photography, video editing and the official CCAST news desk.",
        schedule: "Thursdays • 3:30 PM – 5:00 PM",
        participants: "60+",
        tags: ["Magazine", "Podcast", "Photography"],
    },
    {
        id: "faith",
        category: "Community",
        title: "Faith & Fellowship",
        icon: "fas fa-church",
        color: "#6366f1",
        image: "https://picsum.photos/seed/sl-faith/800/500",
        description: "Christian, Muslim and interfaith fellowships, prayer meetings, moral instruction and ethics conversations.",
        schedule: "Sundays • 4:00 PM – 5:30 PM",
        participants: "200+",
        tags: ["Fellowship", "Ethics", "Prayer"],
    },
];

const CATEGORIES = ["All", "Sports", "Arts", "STEM", "Leadership", "Community"];

const GALLERY = [
    { src: "https://picsum.photos/seed/sl-g1/600/450", alt: "Students playing basketball" },
    { src: "https://picsum.photos/seed/sl-g2/600/450", alt: "Students in the science lab" },
    { src: "https://picsum.photos/seed/sl-g3/600/450", alt: "Cultural dance performance" },
    { src: "https://picsum.photos/seed/sl-g4/600/450", alt: "Debate competition" },
    { src: "https://picsum.photos/seed/sl-g5/600/450", alt: "Robotics club" },
    { src: "https://picsum.photos/seed/sl-g6/600/450", alt: "Graduation ceremony" },
];

const StudentLifePage = () => {
    useRevealOnScroll();
    const [activeCategory, setActiveCategory] = useState("All");
    const [search, setSearch] = useState("");
    const [lightbox, setLightbox] = useState(null);

    // Close lightbox on Escape
    useEffect(() => {
        if (!lightbox) return undefined;
        const onEsc = (e) => e.key === "Escape" && setLightbox(null);
        document.addEventListener("keydown", onEsc);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onEsc);
            document.body.style.overflow = "";
        };
    }, [lightbox]);

    const filtered = useMemo(() => {
        let list = ACTIVITIES;
        if (activeCategory !== "All") {
            list = list.filter((a) => a.category === activeCategory);
        }
        const q = search.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (a) =>
                    a.title.toLowerCase().includes(q) ||
                    a.description.toLowerCase().includes(q) ||
                    a.tags.some((t) => t.toLowerCase().includes(q))
            );
        }
        return list;
    }, [activeCategory, search]);

    const resetFilters = useCallback(() => {
        setActiveCategory("All");
        setSearch("");
    }, []);

    return (
        <div className="slp">
            <SiteNavbar />

            {/* HERO */}
            <header className="slp-hero">
                <div className="slp-hero-blob slp-hero-blob--1" aria-hidden="true" />
                <div className="slp-hero-blob slp-hero-blob--2" aria-hidden="true" />
                <div className="container-xl slp-hero-inner rv-t">
                    <span className="slp-badge">
                        <i className="fas fa-graduation-cap" aria-hidden="true" /> Student Life at CCAST Bambili
                    </span>
                    <h1 className="slp-title">Beyond the Classroom</h1>
                    <p className="slp-lead">
                        From sports and robotics to debate, music and community service —
                        our students grow into well-rounded leaders through hands-on activities.
                    </p>
                </div>
            </header>

            {/* FILTERS */}
            <div className="container-xl slp-filters-wrap rv-t">
                <div className="slp-filters">
                    <div className="slp-categories" role="group" aria-label="Filter by category">
                        {CATEGORIES.map((c) => (
                            <button
                                key={c}
                                type="button"
                                className={`slp-cat-btn${activeCategory === c ? " slp-cat-btn--active" : ""}`}
                                onClick={() => setActiveCategory(c)}
                                aria-pressed={activeCategory === c}
                            >
                                {c}
                            </button>
                        ))}
                    </div>

                    <div className="slp-search">
                        <i className="fas fa-magnifying-glass" aria-hidden="true" />
                        <input
                            type="search"
                            placeholder="Search activities..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label="Search activities"
                        />
                        {search && (
                            <button
                                type="button"
                                className="slp-search-clear"
                                onClick={() => setSearch("")}
                                aria-label="Clear search"
                            >
                                <i className="fas fa-xmark" aria-hidden="true" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* COUNT */}
            <div className="container-xl slp-count-wrap rv-t">
                <p className="slp-count">
                    {filtered.length} activit{filtered.length === 1 ? "y" : "ies"} found
                    {activeCategory !== "All" && <> in {activeCategory}</>}
                    {search && <> matching "{search}"</>}
                </p>
            </div>

            {/* ACTIVITIES GRID */}
            <section className="container-xl slp-grid-wrap rv-t" aria-live="polite">
                {filtered.length > 0 ? (
                    <div className="slp-grid">
                        {filtered.map((a, i) => (
                            <article
                                key={a.id}
                                className="slp-card"
                                style={{ animationDelay: `${i * 80}ms` }}
                            >
                                <div className="slp-card-image">
                                    <img src={a.image} alt={a.title} loading="lazy" decoding="async" />
                                    <span className="slp-card-cat">{a.category}</span>
                                    <div className="slp-card-icon" style={{ background: a.color }}>
                                        <i className={a.icon} aria-hidden="true" />
                                    </div>
                                </div>

                                <div className="slp-card-body">
                                    <h2 className="slp-card-title">{a.title}</h2>
                                    <p className="slp-card-desc">{a.description}</p>

                                    <div className="slp-card-tags">
                                        {a.tags.map((t) => (
                                            <span key={t} className="slp-tag">{t}</span>
                                        ))}
                                    </div>

                                    <div className="slp-card-meta">
                                        <div className="slp-meta-item">
                                            <i className="fas fa-clock" aria-hidden="true" />
                                            <span>{a.schedule}</span>
                                        </div>
                                        <div className="slp-meta-item">
                                            <i className="fas fa-user-group" aria-hidden="true" />
                                            <span>{a.participants} participants</span>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="slp-empty">
                        <i className="fas fa-magnifying-glass" aria-hidden="true" />
                        <h3>No activities found</h3>
                        <p>Try adjusting your search or filter to find what you're looking for.</p>
                        <button type="button" className="slp-reset-btn" onClick={resetFilters}>
                            Reset filters
                        </button>
                    </div>
                )}
            </section>

            {/* GALLERY */}
            <section className="container-xl slp-gallery-wrap rv-t">
                <div className="slp-sec-hd">
                    <h2 className="slp-sec-title">Life in Pictures</h2>
                    <p className="slp-sec-sub">A glimpse into everyday moments on campus.</p>
                </div>
                <div className="slp-gallery">
                    {GALLERY.map((g, i) => (
                        <button
                            key={i}
                            type="button"
                            className="slp-gallery-item"
                            onClick={() => setLightbox(g)}
                            aria-label={`View image: ${g.alt}`}
                        >
                            <img src={g.src} alt={g.alt} loading="lazy" decoding="async" />
                            <span className="slp-gallery-overlay" aria-hidden="true">
                                <i className="fas fa-expand" />
                            </span>
                        </button>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="container-xl slp-cta-wrap rv-t">
                <div className="slp-cta">
                    <div>
                        <h2>Join the CCAST Community</h2>
                        <p>
                            Become part of a vibrant community where every student can find
                            their passion and develop their talents.
                        </p>
                    </div>
                    <Link to="/admission" className="slp-cta-btn">
                        Apply for Admission
                        <i className="fas fa-arrow-right" aria-hidden="true" />
                    </Link>
                </div>
            </section>

            <SiteFooter />

            {/* LIGHTBOX */}
            {lightbox && (
                <div
                    className="slp-lightbox"
                    role="dialog"
                    aria-modal="true"
                    aria-label={lightbox.alt}
                    onClick={() => setLightbox(null)}
                >
                    <button
                        type="button"
                        className="slp-lightbox-close"
                        aria-label="Close image viewer"
                        onClick={() => setLightbox(null)}
                    >
                        <i className="fas fa-xmark" aria-hidden="true" />
                    </button>
                    <img src={lightbox.src} alt={lightbox.alt} />
                </div>
            )}
        </div>
    );
};

export default StudentLifePage;