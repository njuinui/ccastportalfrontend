import React, {
    useMemo,
    useState,
} from "react";

import { Link } from "react-router-dom";

import SiteNavbar from "../../components/site/SiteNavbar";
import SiteFooter from "../../components/site/SiteFooter";

import {
    usePublicVacancies,
} from "../../api/vacancies";

import "./CareersPage.css";


const formatDate = (date) => {
    if (!date) {
        return "Open until filled";
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "long",
            day: "numeric",
            year: "numeric",
        }
    ).format(new Date(date));
};


const CareersPage = () => {
    const [category, setCategory] =
        useState("all");

    const [search, setSearch] =
        useState("");

    const {
        data,
        isLoading,
        isError,
    } = usePublicVacancies();


    const vacancies =
        data?.data ?? [];


    const filteredVacancies =
        useMemo(() => {
            const normalizedSearch =
                search
                    .trim()
                    .toLowerCase();

            return vacancies.filter(
                (vacancy) => {
                    const title =
                        vacancy.title
                            ?.toLowerCase() ??
                        "";

                    const department =
                        vacancy.department
                            ?.toLowerCase() ??
                        "";

                    const matchesSearch =
                        !normalizedSearch ||
                        title.includes(
                            normalizedSearch
                        ) ||
                        department.includes(
                            normalizedSearch
                        );

                    const matchesCategory =
                        category === "all" ||
                        (
                            category ===
                                "teaching" &&
                            title.includes(
                                "teacher"
                            )
                        ) ||
                        (
                            category ===
                                "technical" &&
                            (
                                title.includes(
                                    "technician"
                                ) ||
                                department.includes(
                                    "ict"
                                )
                            )
                        );

                    return (
                        matchesSearch &&
                        matchesCategory
                    );
                }
            );
        }, [
            vacancies,
            category,
            search,
        ]);


    return (
        <main className="careers-page">

            <SiteNavbar />


            {/* ==================================================
                HERO
            ================================================== */}

            <section className="careers-hero">

                <div className="container-xl">

                    <div className="careers-hero-inner">

                        <span className="careers-eyebrow">
                            <i className="fas fa-briefcase" />

                            CCAST Bambili Careers
                        </span>


                        <h1>
                            Build your career.
                            <span>
                                {" "}
                                Shape the future.
                            </span>
                        </h1>


                        <p>
                            Join a community of educators
                            and professionals committed
                            to academic excellence,
                            discipline, innovation and
                            student success.
                        </p>


                        <div className="careers-hero-actions">

                            <a
                                href="#vacancies"
                                className="btn btn-primary btn-lg"
                            >
                                Explore Vacancies

                                <i className="fas fa-arrow-down ms-2" />
                            </a>


                            <Link
                                to="/careers/apply"
                                className="btn btn-outline-light btn-lg"
                            >
                                Submit General Application
                            </Link>

                        </div>

                    </div>

                </div>

            </section>


            {/* ==================================================
                CONTENT
            ================================================== */}

            <section
                id="vacancies"
                className="careers-content"
            >

                <div className="container-xl">

                    <div className="careers-section-heading">

                        <div>

                            <span>
                                OPPORTUNITIES
                            </span>

                            <h2>
                                Current Open Positions
                            </h2>

                            <p>
                                Find an opportunity
                                that matches your
                                skills and experience.
                            </p>

                        </div>


                        <div className="careers-count">

                            <strong>
                                {filteredVacancies.length}
                            </strong>

                            <span>
                                Open Positions
                            </span>

                        </div>

                    </div>


                    {/* ==================================================
                        FILTERS
                    ================================================== */}

                    <div className="careers-filters">

                        <div className="careers-search">

                            <i className="fas fa-search" />

                            <input
                                type="text"
                                placeholder="Search positions..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target
                                            .value
                                    )
                                }
                            />

                        </div>


                        <div className="careers-filter-buttons">

                            <button
                                className={
                                    category ===
                                    "all"
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setCategory(
                                        "all"
                                    )
                                }
                            >
                                All
                            </button>


                            <button
                                className={
                                    category ===
                                    "teaching"
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setCategory(
                                        "teaching"
                                    )
                                }
                            >
                                Teaching
                            </button>


                            <button
                                className={
                                    category ===
                                    "technical"
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setCategory(
                                        "technical"
                                    )
                                }
                            >
                                Technical
                            </button>

                        </div>

                    </div>


                    {/* ==================================================
                        LOADING
                    ================================================== */}

                    {isLoading && (
                        <div className="careers-empty">

                            <div
                                className="spinner-border"
                                role="status"
                            />

                            <h3>
                                Loading vacancies...
                            </h3>

                        </div>
                    )}


                    {/* ==================================================
                        ERROR
                    ================================================== */}

                    {isError && (
                        <div className="careers-empty">

                            <i className="fas fa-circle-exclamation" />

                            <h3>
                                Unable to load vacancies
                            </h3>

                            <p>
                                Please try again
                                later.
                            </p>

                        </div>
                    )}


                    {/* ==================================================
                        VACANCIES
                    ================================================== */}

                    {!isLoading &&
                        !isError &&
                        filteredVacancies.length >
                            0 && (
                            <div className="vacancy-grid">

                                {filteredVacancies.map(
                                    (vacancy) => (
                                        <article
                                            className="vacancy-card"
                                            key={
                                                vacancy.id
                                            }
                                        >

                                            <div className="vacancy-top">

                                                <div className="vacancy-icon">

                                                    <i
                                                        className={
                                                            vacancy.icon ||
                                                            "fas fa-briefcase"
                                                        }
                                                    />

                                                </div>


                                                <span className="vacancy-status">

                                                    <span />

                                                    Open

                                                </span>

                                            </div>


                                            <h3>
                                                {
                                                    vacancy.title
                                                }
                                            </h3>


                                            <div className="vacancy-department">

                                                <i className="fas fa-building" />

                                                {
                                                    vacancy.department
                                                }

                                            </div>


                                            <p>
                                                {
                                                    vacancy.description
                                                }
                                            </p>


                                            <div className="vacancy-meta">

                                                <span>
                                                    <i className="fas fa-clock" />

                                                    {
                                                        vacancy.employment_type
                                                    }
                                                </span>


                                                <span>
                                                    <i className="fas fa-graduation-cap" />

                                                    {
                                                        vacancy.level
                                                    }
                                                </span>


                                                {vacancy.experience && (
                                                    <span>
                                                        <i className="fas fa-user-clock" />

                                                        {
                                                            vacancy.experience
                                                        }
                                                    </span>
                                                )}

                                            </div>


                                            <div className="vacancy-footer">

                                                <div>

                                                    <small>
                                                        Application Deadline
                                                    </small>

                                                    <strong>
                                                        {formatDate(
                                                            vacancy.deadline
                                                        )}
                                                    </strong>

                                                </div>


                                                <Link
                                                    to={`/careers/apply?position=${vacancy.id}`}
                                                    className="vacancy-apply"
                                                >
                                                    Apply Now

                                                    <i className="fas fa-arrow-right" />

                                                </Link>

                                            </div>

                                        </article>
                                    )
                                )}

                            </div>
                        )}


                    {/* ==================================================
                        EMPTY
                    ================================================== */}

                    {!isLoading &&
                        !isError &&
                        filteredVacancies.length ===
                            0 && (
                            <div className="careers-empty">

                                <i className="fas fa-folder-open" />

                                <h3>
                                    No vacancies found
                                </h3>

                                <p>
                                    Try changing your
                                    search or category
                                    filter.
                                </p>

                            </div>
                        )}


                    {/* ==================================================
                        GENERAL APPLICATION
                    ================================================== */}

                    <div className="general-application">

                        <div className="general-application-icon">

                            <i className="fas fa-paper-plane" />

                        </div>


                        <div>

                            <span>
                                DON'T SEE YOUR ROLE?
                            </span>

                            <h3>
                                Submit a General Application
                            </h3>

                            <p>
                                We are always interested
                                in meeting talented
                                educators and
                                professionals. Send us
                                your CV and we will keep
                                your profile for future
                                opportunities.
                            </p>

                        </div>


                        <Link
                            to="/careers/apply"
                            className="btn btn-primary"
                        >
                            Apply Generally

                            <i className="fas fa-arrow-right ms-2" />
                        </Link>

                    </div>

                </div>

            </section>


            <SiteFooter />

        </main>
    );
};


export default CareersPage;