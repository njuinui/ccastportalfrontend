// src/pages/site/AcademicResultsPage.jsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import SiteNavbar from "../../components/site/SiteNavbar";
import SiteFooter from "../../components/site/SiteFooter";
import useRevealOnScroll from "../../hooks/useRevealOnScroll";
import toast from "react-hot-toast";
import { useIsAdmissionOpen } from "../../api/public";
import "./AcademicResultsPage.css";

/* ─── Deterministic dataset (replace with API when ready) ────────────── */
const RESULTS_DATA = [
    {
        year: 2024,
        badge: "Best Performance Ever",
        highlight: "Our best Advanced Level Science cohort in the institution's history.",
        classes: [
            { id: "2024-f1a", name: "Form 1A", level: "Ordinary", candidates: 32, passed: 31, passRate: 96.9, topSubjects: ["Mathematics", "English", "Biology"] },
            { id: "2024-f1b", name: "Form 1B", level: "Ordinary", candidates: 30, passed: 28, passRate: 93.3, topSubjects: ["Physics", "Chemistry", "Mathematics"] },
            { id: "2024-f2a", name: "Form 2A", level: "Ordinary", candidates: 28, passed: 27, passRate: 96.4, topSubjects: ["English", "Geography", "History"] },
            { id: "2024-f3a", name: "Form 3A", level: "Ordinary", candidates: 26, passed: 24, passRate: 92.3, topSubjects: ["Mathematics", "Biology", "Chemistry"] },
            { id: "2024-f4a", name: "Form 4A", level: "Ordinary", candidates: 24, passed: 22, passRate: 91.7, topSubjects: ["Physics", "Mathematics", "ICT"] },
            { id: "2024-f5a", name: "Form 5A (O-Level)", level: "Ordinary", candidates: 35, passed: 31, passRate: 88.6, topSubjects: ["Biology", "Chemistry", "Mathematics"] },
            { id: "2024-l6a", name: "Lower Sixth A", level: "Advanced", candidates: 30, passed: 28, passRate: 93.3, topSubjects: ["Physics", "Mathematics", "Chemistry"] },
            { id: "2024-u6a", name: "Upper Sixth A (A-Level)", level: "Advanced", candidates: 28, passed: 27, passRate: 96.4, topSubjects: ["Physics", "Chemistry", "Biology"] },
        ],
    },
    {
        year: 2023,
        badge: "Five Perfect Scores",
        highlight: "Five subjects recorded a 100% pass rate at Ordinary Level.",
        classes: [
            { id: "2023-f1a", name: "Form 1A", level: "Ordinary", candidates: 30, passed: 28, passRate: 93.3, topSubjects: ["Mathematics", "English", "Biology"] },
            { id: "2023-f1b", name: "Form 1B", level: "Ordinary", candidates: 29, passed: 27, passRate: 93.1, topSubjects: ["Physics", "Chemistry", "Mathematics"] },
            { id: "2023-f2a", name: "Form 2A", level: "Ordinary", candidates: 27, passed: 25, passRate: 92.6, topSubjects: ["English", "Geography", "History"] },
            { id: "2023-f3a", name: "Form 3A", level: "Ordinary", candidates: 25, passed: 23, passRate: 92.0, topSubjects: ["Mathematics", "Biology", "Chemistry"] },
            { id: "2023-f4a", name: "Form 4A", level: "Ordinary", candidates: 23, passed: 21, passRate: 91.3, topSubjects: ["Physics", "Mathematics", "ICT"] },
            { id: "2023-f5a", name: "Form 5A (O-Level)", level: "Ordinary", candidates: 33, passed: 28, passRate: 84.8, topSubjects: ["Biology", "Chemistry", "Mathematics"] },
            { id: "2023-l6a", name: "Lower Sixth A", level: "Advanced", candidates: 28, passed: 25, passRate: 89.3, topSubjects: ["Physics", "Mathematics", "Chemistry"] },
            { id: "2023-u6a", name: "Upper Sixth A (A-Level)", level: "Advanced", candidates: 27, passed: 25, passRate: 92.6, topSubjects: ["Physics", "Chemistry", "Biology"] },
        ],
    },
    {
        year: 2022,
        badge: "New Science Block Era",
        highlight: "Record-breaking practical scores from the new science block.",
        classes: [
            { id: "2022-f1a", name: "Form 1A", level: "Ordinary", candidates: 29, passed: 27, passRate: 93.1, topSubjects: ["Mathematics", "English", "Biology"] },
            { id: "2022-f1b", name: "Form 1B", level: "Ordinary", candidates: 28, passed: 26, passRate: 92.9, topSubjects: ["Physics", "Chemistry", "Mathematics"] },
            { id: "2022-f2a", name: "Form 2A", level: "Ordinary", candidates: 26, passed: 24, passRate: 92.3, topSubjects: ["English", "Geography", "History"] },
            { id: "2022-f3a", name: "Form 3A", level: "Ordinary", candidates: 24, passed: 22, passRate: 91.7, topSubjects: ["Mathematics", "Biology", "Chemistry"] },
            { id: "2022-f4a", name: "Form 4A", level: "Ordinary", candidates: 22, passed: 20, passRate: 90.9, topSubjects: ["Physics", "Mathematics", "ICT"] },
            { id: "2022-f5a", name: "Form 5A (O-Level)", level: "Ordinary", candidates: 30, passed: 25, passRate: 83.3, topSubjects: ["Biology", "Chemistry", "Mathematics"] },
            { id: "2022-l6a", name: "Lower Sixth A", level: "Advanced", candidates: 26, passed: 23, passRate: 88.5, topSubjects: ["Physics", "Mathematics", "Chemistry"] },
            { id: "2022-u6a", name: "Upper Sixth A (A-Level)", level: "Advanced", candidates: 25, passed: 22, passRate: 88.0, topSubjects: ["Physics", "Chemistry", "Biology"] },
        ],
    },
    {
        year: 2021,
        badge: "ICT Record Breakers",
        highlight: "Record ICT results set a new regional benchmark.",
        classes: [
            { id: "2021-f1a", name: "Form 1A", level: "Ordinary", candidates: 27, passed: 25, passRate: 92.6, topSubjects: ["Mathematics", "English", "ICT"] },
            { id: "2021-f1b", name: "Form 1B", level: "Ordinary", candidates: 26, passed: 24, passRate: 92.3, topSubjects: ["Physics", "Chemistry", "ICT"] },
            { id: "2021-f2a", name: "Form 2A", level: "Ordinary", candidates: 24, passed: 22, passRate: 91.7, topSubjects: ["English", "Geography", "ICT"] },
            { id: "2021-f3a", name: "Form 3A", level: "Ordinary", candidates: 22, passed: 20, passRate: 90.9, topSubjects: ["Mathematics", "Biology", "ICT"] },
            { id: "2021-f4a", name: "Form 4A", level: "Ordinary", candidates: 20, passed: 18, passRate: 90.0, topSubjects: ["Physics", "Mathematics", "ICT"] },
            { id: "2021-f5a", name: "Form 5A (O-Level)", level: "Ordinary", candidates: 28, passed: 23, passRate: 82.1, topSubjects: ["Biology", "Chemistry", "ICT"] },
            { id: "2021-l6a", name: "Lower Sixth A", level: "Advanced", candidates: 24, passed: 21, passRate: 87.5, topSubjects: ["Physics", "Mathematics", "ICT"] },
            { id: "2021-u6a", name: "Upper Sixth A (A-Level)", level: "Advanced", candidates: 23, passed: 20, passRate: 87.0, topSubjects: ["Physics", "Chemistry", "Biology"] },
        ],
    },
    {
        year: 2020,
        badge: "Resilience Award",
        highlight: "Resilient results through a challenging academic year.",
        classes: [
            { id: "2020-f1a", name: "Form 1A", level: "Ordinary", candidates: 25, passed: 22, passRate: 88.0, topSubjects: ["Mathematics", "English", "Biology"] },
            { id: "2020-f1b", name: "Form 1B", level: "Ordinary", candidates: 24, passed: 21, passRate: 87.5, topSubjects: ["Physics", "Chemistry", "Mathematics"] },
            { id: "2020-f2a", name: "Form 2A", level: "Ordinary", candidates: 22, passed: 19, passRate: 86.4, topSubjects: ["English", "Geography", "History"] },
            { id: "2020-f3a", name: "Form 3A", level: "Ordinary", candidates: 20, passed: 17, passRate: 85.0, topSubjects: ["Mathematics", "Biology", "Chemistry"] },
            { id: "2020-f4a", name: "Form 4A", level: "Ordinary", candidates: 18, passed: 15, passRate: 83.3, topSubjects: ["Physics", "Mathematics", "ICT"] },
            { id: "2020-f5a", name: "Form 5A (O-Level)", level: "Ordinary", candidates: 26, passed: 18, passRate: 69.2, topSubjects: ["Biology", "Chemistry", "Mathematics"] },
            { id: "2020-l6a", name: "Lower Sixth A", level: "Advanced", candidates: 22, passed: 19, passRate: 86.4, topSubjects: ["Physics", "Mathematics", "Chemistry"] },
            { id: "2020-u6a", name: "Upper Sixth A (A-Level)", level: "Advanced", candidates: 21, passed: 19, passRate: 90.5, topSubjects: ["Physics", "Chemistry", "Biology"] },
        ],
    },
    {
        year: 2019,
        badge: "Strong Tradition",
        highlight: "Continued streak of top regional performance.",
        classes: [
            { id: "2019-f1a", name: "Form 1A", level: "Ordinary", candidates: 24, passed: 22, passRate: 91.7, topSubjects: ["Mathematics", "English", "Biology"] },
            { id: "2019-f1b", name: "Form 1B", level: "Ordinary", candidates: 23, passed: 21, passRate: 91.3, topSubjects: ["Physics", "Chemistry", "Mathematics"] },
            { id: "2019-f2a", name: "Form 2A", level: "Ordinary", candidates: 21, passed: 19, passRate: 90.5, topSubjects: ["English", "Geography", "History"] },
            { id: "2019-f3a", name: "Form 3A", level: "Ordinary", candidates: 19, passed: 17, passRate: 89.5, topSubjects: ["Mathematics", "Biology", "Chemistry"] },
            { id: "2019-f4a", name: "Form 4A", level: "Ordinary", candidates: 17, passed: 15, passRate: 88.2, topSubjects: ["Physics", "Mathematics", "ICT"] },
            { id: "2019-f5a", name: "Form 5A (O-Level)", level: "Ordinary", candidates: 22, passed: 19, passRate: 86.4, topSubjects: ["Biology", "Chemistry", "Mathematics"] },
            { id: "2019-l6a", name: "Lower Sixth A", level: "Advanced", candidates: 18, passed: 16, passRate: 88.9, topSubjects: ["Physics", "Mathematics", "Chemistry"] },
            { id: "2019-u6a", name: "Upper Sixth A (A-Level)", level: "Advanced", candidates: 17, passed: 15, passRate: 88.2, topSubjects: ["Physics", "Chemistry", "Biology"] },
        ],
    },
];

const CLASSES_PER_PAGE = 6;
const SIMULATED_LOAD_MS = 400;

const getPassRateClass = (rate) => {
    if (rate >= 90) return "arp-rate-excellent";
    if (rate >= 80) return "arp-rate-good";
    if (rate >= 70) return "arp-rate-average";
    return "arp-rate-low";
};

const AcademicResultsPage = () => {
    useRevealOnScroll();
    const { isOpen: isAdmissionOpen, isLoading: admissionLoading } =
        useIsAdmissionOpen();

    const [activeYear, setActiveYear] = useState(RESULTS_DATA[0].year);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const currentYearData = useMemo(
        () => RESULTS_DATA.find((y) => y.year === activeYear) ?? RESULTS_DATA[0],
        [activeYear]
    );

    // Simulate API latency on year change (replace with real fetch)
    useEffect(() => {
        setIsLoading(true);
        const t = setTimeout(() => setIsLoading(false), SIMULATED_LOAD_MS);
        return () => clearTimeout(t);
    }, [activeYear]);

    // Reset page when filters change
    useEffect(() => setPage(1), [activeYear, search]);

    const filteredClasses = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return currentYearData.classes;
        return currentYearData.classes.filter((c) =>
            c.name.toLowerCase().includes(q)
        );
    }, [currentYearData, search]);

    const totalPages = Math.max(1, Math.ceil(filteredClasses.length / CLASSES_PER_PAGE));

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const pagedClasses = useMemo(() => {
        const start = (page - 1) * CLASSES_PER_PAGE;
        return filteredClasses.slice(start, start + CLASSES_PER_PAGE);
    }, [filteredClasses, page]);

    const yearStats = useMemo(() => {
        const totalCandidates = currentYearData.classes.reduce(
            (acc, c) => acc + c.candidates,
            0
        );
        const totalPassed = currentYearData.classes.reduce(
            (acc, c) => acc + c.passed,
            0
        );
        const avgPass = totalCandidates
            ? ((totalPassed / totalCandidates) * 100).toFixed(1)
            : "0";
        return { totalCandidates, totalPassed, avgPass, classCount: currentYearData.classes.length };
    }, [currentYearData]);

    const handleApply = useCallback(() => {
        if (admissionLoading) {
            toast.loading("Checking admission status...", { id: "admission-check" });
            return;
        }
        if (!isAdmissionOpen) {
            toast.error(
                "Admission is not open or closed. Please contact the school administration.",
                { duration: 6000, id: "admission-check" }
            );
            return;
        }
        window.location.href = "/admission";
    }, [admissionLoading, isAdmissionOpen]);

    const goToPage = (p) => {
        setPage(Math.min(Math.max(1, p), totalPages));
        window.scrollTo({ top: 280, behavior: "smooth" });
    };

    const handleViewPdf = (cls) => {
        toast(`Downloading results for ${cls.name} (${currentYearData.year})...`, {
            icon: "📄",
        });
        // In production: window.open(`/results/${cls.id}.pdf`, "_blank", "noopener,noreferrer");
    };

    const handlePrint = () => window.print();

    return (
        <div className="arp">
            <SiteNavbar />

            {/* HERO */}
            <header className="arp-hero">
                <div className="arp-hero-blob arp-hero-blob--1" aria-hidden="true" />
                <div className="arp-hero-blob arp-hero-blob--2" aria-hidden="true" />
                <div className="container-xl arp-hero-inner rv-t">
                    <span className="arp-badge">
                        <i className="fas fa-trophy" aria-hidden="true" /> GCE Board Results Archive
                    </span>
                    <h1 className="arp-title">Academic Results by Class &amp; Year</h1>
                    <p className="arp-lead">
                        Browse through our academic performance across every class for the past six
                        years. Search by class, switch years, and download printable results.
                    </p>
                </div>
            </header>

            {/* YEAR TABS */}
            <div className="container-xl arp-tabs-wrap rv-t">
                <div className="arp-tabs" role="tablist" aria-label="Select a year">
                    {RESULTS_DATA.map((y) => (
                        <button
                            key={y.year}
                            type="button"
                            role="tab"
                            aria-selected={y.year === activeYear}
                            className={`arp-tab${y.year === activeYear ? " arp-tab--active" : ""}`}
                            onClick={() => setActiveYear(y.year)}
                        >
                            {y.year}
                        </button>
                    ))}
                </div>
            </div>

            {/* SUMMARY */}
            <section className="container-xl arp-summary rv-t" aria-label={`${activeYear} summary`}>
                <div className="arp-summary-card">
                    <div className="arp-summary-ic">
                        <i className="fas fa-medal" aria-hidden="true" />
                    </div>
                    <div>
                        <span className="arp-summary-year">{currentYearData.year}</span>
                        <span className="arp-summary-badge">{currentYearData.badge}</span>
                        <p className="arp-summary-hl">{currentYearData.highlight}</p>
                    </div>
                </div>

                <div className="arp-summary-stats">
                    <div className="arp-stat">
                        <strong>{yearStats.classCount}</strong>
                        <span>Classes</span>
                    </div>
                    <div className="arp-stat">
                        <strong>{yearStats.totalCandidates}</strong>
                        <span>Total Students</span>
                    </div>
                    <div className="arp-stat">
                        <strong>{yearStats.totalPassed}</strong>
                        <span>Passed</span>
                    </div>
                    <div className="arp-stat">
                        <strong>{yearStats.avgPass}%</strong>
                        <span>Overall Pass Rate</span>
                    </div>
                </div>
            </section>

            {/* TOOLBAR */}
            <section className="container-xl arp-toolbar-wrap rv-t">
                <div className="arp-toolbar">
                    <div className="arp-search">
                        <i className="fas fa-magnifying-glass" aria-hidden="true" />
                        <input
                            type="search"
                            placeholder="Search by class (e.g. Form 5, Upper Sixth)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label="Search classes"
                        />
                        {search && (
                            <button
                                type="button"
                                className="arp-search-clear"
                                onClick={() => setSearch("")}
                                aria-label="Clear search"
                            >
                                <i className="fas fa-xmark" aria-hidden="true" />
                            </button>
                        )}
                    </div>
                    <button type="button" className="arp-print" onClick={handlePrint}>
                        <i className="fas fa-print" aria-hidden="true" /> Print / PDF
                    </button>
                </div>

                <div className="arp-count">
                    {filteredClasses.length} class{filteredClasses.length !== 1 ? "es" : ""} found
                    {search && <> for "{search}"</>}
                </div>
            </section>

            {/* CARDS GRID */}
            <section
                className="container-xl arp-grid-wrap"
                aria-busy={isLoading}
                aria-live="polite"
            >
                {isLoading ? (
                    <div className="arp-loading" role="status">
                        <div className="arp-loading-spinner" aria-hidden="true" />
                        <p>Loading results for {activeYear}...</p>
                    </div>
                ) : pagedClasses.length === 0 ? (
                    <div className="arp-empty">
                        <i className="fas fa-magnifying-glass" aria-hidden="true" />
                        <h3>No classes found</h3>
                        <p>Try adjusting your search to find what you're looking for.</p>
                        <button
                            type="button"
                            className="arp-reset-btn"
                            onClick={() => setSearch("")}
                        >
                            Clear search
                        </button>
                    </div>
                ) : (
                    <div className="arp-grid">
                        {pagedClasses.map((c, i) => (
                            <article
                                key={c.id}
                                className="arp-card rv-t"
                                style={{ transitionDelay: `${i * 70}ms` }}
                            >
                                <div className="arp-card-header">
                                    <h3 className="arp-card-title">{c.name}</h3>
                                    <span className={`arp-level-badge arp-level-badge--${c.level.toLowerCase()}`}>
                                        {c.level === "Advanced" ? "Advanced Level" : "Ordinary Level"}
                                    </span>
                                </div>

                                <div className="arp-card-body">
                                    <div className="arp-card-stats">
                                        <div className="arp-card-stat">
                                            <span className="arp-card-stat-num">{c.candidates}</span>
                                            <span className="arp-card-stat-label">Candidates</span>
                                        </div>
                                        <div className="arp-card-stat">
                                            <span className="arp-card-stat-num arp-pass">{c.passed}</span>
                                            <span className="arp-card-stat-label">Passed</span>
                                        </div>
                                        <div className="arp-card-stat">
                                            <span className="arp-card-stat-num arp-fail">{c.candidates - c.passed}</span>
                                            <span className="arp-card-stat-label">Failed</span>
                                        </div>
                                        <div className="arp-card-stat">
                                            <span className={`arp-card-stat-num ${getPassRateClass(c.passRate)}`}>
                                                {c.passRate.toFixed(1)}%
                                            </span>
                                            <span className="arp-card-stat-label">Pass Rate</span>
                                        </div>
                                    </div>

                                    <div className="arp-bar" aria-hidden="true">
                                        <div
                                            className={`arp-bar-fill ${getPassRateClass(c.passRate)}`}
                                            style={{ width: `${c.passRate}%` }}
                                        />
                                    </div>

                                    <div className="arp-subjects">
                                        <span className="arp-subjects-label">Top Subjects:</span>
                                        {c.topSubjects.map((s) => (
                                            <span key={s} className="arp-subject-tag">{s}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="arp-card-footer">
                                    <button
                                        type="button"
                                        className="arp-view-btn"
                                        onClick={() => handleViewPdf(c)}
                                        aria-label={`View ${c.name} ${activeYear} results PDF`}
                                    >
                                        <i className="fas fa-file-pdf" aria-hidden="true" /> View Results
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {/* PAGINATION */}
            {!isLoading && filteredClasses.length > 0 && totalPages > 1 && (
                <nav className="container-xl arp-pagination" aria-label="Results pagination">
                    <button
                        type="button"
                        className="arp-page-btn"
                        onClick={() => goToPage(page - 1)}
                        disabled={page === 1}
                        aria-label="Previous page"
                    >
                        <i className="fas fa-chevron-left" aria-hidden="true" />
                    </button>

                    {Array.from({ length: totalPages }).map((_, i) => {
                        const p = i + 1;
                        // Show first, last, current ±1, with ellipsis for big ranges
                        const show =
                            p === 1 ||
                            p === totalPages ||
                            Math.abs(p - page) <= 1;
                        if (!show) {
                            if (p === 2 || p === totalPages - 1) {
                                return <span key={p} className="arp-ellipsis">…</span>;
                            }
                            return null;
                        }
                        return (
                            <button
                                key={p}
                                type="button"
                                className={`arp-page-num${p === page ? " arp-page-num--active" : ""}`}
                                onClick={() => goToPage(p)}
                                aria-current={p === page ? "page" : undefined}
                            >
                                {p}
                            </button>
                        );
                    })}

                    <button
                        type="button"
                        className="arp-page-btn"
                        onClick={() => goToPage(page + 1)}
                        disabled={page === totalPages}
                        aria-label="Next page"
                    >
                        <i className="fas fa-chevron-right" aria-hidden="true" />
                    </button>

                    <span className="arp-page-info">
                        Page {page} of {totalPages} • Showing {pagedClasses.length} of{" "}
                        {filteredClasses.length} classes
                    </span>
                </nav>
            )}

            {/* INFO NOTE */}
            <section className="container-xl arp-info-wrap rv-t">
                <div className="arp-info-note">
                    <i className="fas fa-info-circle" aria-hidden="true" />
                    <p>
                        For detailed results or official transcripts, please contact the
                        Academic Office or visit the school administration during working hours.
                    </p>
                </div>
            </section>

            {/* CTA */}
            <section className="container-xl arp-cta-wrap rv-t">
                <div className="arp-cta-card">
                    <div>
                        <h2>Join our next high-performing cohort.</h2>
                        <p>
                            Applications are reviewed on a rolling basis. Make sure admission
                            is open before submitting your form.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="arp-cta-btn"
                        onClick={handleApply}
                        disabled={admissionLoading}
                        aria-busy={admissionLoading}
                    >
                        {admissionLoading ? "Checking status..." : "Apply for Admission"}
                        {!admissionLoading && <i className="fas fa-arrow-right" aria-hidden="true" />}
                    </button>
                </div>
            </section>

            <SiteFooter />
        </div>
    );
};

export default AcademicResultsPage;