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



/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_ICON =
    "fas fa-briefcase";

const VACANCY_CATEGORIES = [
    {
        value: "all",
        label: "All",
    },
    {
        value: "teaching",
        label: "Teaching",
    },
    {
        value: "technical",
        label: "Technical",
    },
];



/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Safely convert a value to lowercase text.
 */
const normalizeText = (value) => {
    return String(value ?? "")
        .trim()
        .toLowerCase();
};



/**
 * Format a vacancy deadline.
 *
 * The API may return:
 * - null
 * - YYYY-MM-DD
 * - an ISO date
 */
const formatDate = (date) => {
    if (!date) {
        return "Open until filled";
    }

    try {
        /*
        |--------------------------------------------------------------------------
        | Handle date-only values safely.
        |
        | For example:
        | 2026-09-30
        |
        | Instead of allowing JavaScript timezone conversion
        | to potentially shift the displayed date, construct
        | the date explicitly.
        |--------------------------------------------------------------------------
        */

        const dateString =
            String(date);

        let parsedDate;

        if (
            /^\d{4}-\d{2}-\d{2}$/.test(
                dateString
            )
        ) {
            const [
                year,
                month,
                day,
            ] =
                dateString
                    .split("-")
                    .map(Number);

            parsedDate = new Date(
                year,
                month - 1,
                day
            );
        } else {
            parsedDate =
                new Date(dateString);
        }

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "Open until filled";
        }

        return new Intl.DateTimeFormat(
            "en-US",
            {
                month: "long",
                day: "numeric",
                year: "numeric",
            }
        ).format(parsedDate);
    } catch {
        return "Open until filled";
    }
};



/**
 * Determine whether a vacancy is currently open.
 *
 * The backend should ideally provide `is_open`.
 * The additional checks make the component
 * resilient if the property is missing.
 */
const isVacancyOpen = (vacancy) => {
    /*
    |--------------------------------------------------------------------------
    | If the API explicitly provides is_open,
    | trust that value.
    |--------------------------------------------------------------------------
    */

    if (
        typeof vacancy?.is_open ===
        "boolean"
    ) {
        return vacancy.is_open;
    }


    /*
    |--------------------------------------------------------------------------
    | If the backend provides status,
    | closed vacancies should not be treated as open.
    |--------------------------------------------------------------------------
    */

    if (
        normalizeText(
            vacancy?.status
        ) === "closed"
    ) {
        return false;
    }


    /*
    |--------------------------------------------------------------------------
    | If a deadline exists, compare it with today.
    |--------------------------------------------------------------------------
    */

    if (vacancy?.deadline) {
        const deadline =
            new Date(
                `${vacancy.deadline}T23:59:59`
            );

        if (
            !Number.isNaN(
                deadline.getTime()
            )
        ) {
            return (
                deadline.getTime() >=
                Date.now()
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | If there is no information saying
    | that the vacancy is closed, treat it
    | as open.
    |--------------------------------------------------------------------------
    */

    return true;
};



/**
 * Determine a vacancy category.
 *
 * Preferred:
 *     vacancy.category
 *
 * Fallback:
 *     infer from existing data.
 *
 * The backend should eventually provide
 * a dedicated `category` field.
 */
const getVacancyCategory = (
    vacancy
) => {
    const explicitCategory =
        normalizeText(
            vacancy?.category
        );

    if (explicitCategory) {
        return explicitCategory;
    }


    const title =
        normalizeText(
            vacancy?.title
        );

    const department =
        normalizeText(
            vacancy?.department
        );

    const employmentType =
        normalizeText(
            vacancy?.employment_type
        );


    /*
    |--------------------------------------------------------------------------
    | Teaching fallback
    |--------------------------------------------------------------------------
    */

    const teachingKeywords = [
        "teacher",
        "teaching",
        "lecturer",
        "instructor",
        "educator",
        "professor",
    ];

    if (
        teachingKeywords.some(
            (keyword) =>
                title.includes(keyword)
        )
    ) {
        return "teaching";
    }


    /*
    |--------------------------------------------------------------------------
    | Technical fallback
    |--------------------------------------------------------------------------
    */

    const technicalKeywords = [
        "technician",
        "developer",
        "engineer",
        "software",
        "network",
        "ict",
        "it support",
        "computer",
        "technical",
    ];

    if (
        technicalKeywords.some(
            (keyword) =>
                title.includes(keyword) ||
                department.includes(keyword) ||
                employmentType.includes(keyword)
        )
    ) {
        return "technical";
    }


    return "other";
};



/**
 * Safely truncate vacancy descriptions
 * for use inside cards.
 */
const truncateText = (
    value,
    maxLength = 180
) => {
    const text =
        String(value ?? "").trim();

    if (!text) {
        return "No description available for this position.";
    }

    if (
        text.length <= maxLength
    ) {
        return text;
    }

    return `${text.slice(
        0,
        maxLength
    ).trim()}...`;
};



/*
|--------------------------------------------------------------------------
| Careers Page
|--------------------------------------------------------------------------
*/

const CareersPage = () => {
    const [category, setCategory] =
        useState("all");

    const [search, setSearch] =
        useState("");


    /*
    |--------------------------------------------------------------------------
    | Fetch public vacancies
    |--------------------------------------------------------------------------
    */

    const {
        data,
        isLoading,
        isError,
        refetch,
        isFetching,
    } = usePublicVacancies();


    /*
    |--------------------------------------------------------------------------
    | Normalize API response
    |--------------------------------------------------------------------------
    |
    | Depending on your React Query/API implementation,
    | the response may be:
    |
    | data.data
    |
    | or simply:
    |
    | data
    |
    */

    const vacancies = useMemo(() => {
        if (
            Array.isArray(data?.data)
        ) {
            return data.data;
        }

        if (
            Array.isArray(data)
        ) {
            return data;
        }

        return [];
    }, [data]);


    /*
    |--------------------------------------------------------------------------
    | Filter vacancies
    |--------------------------------------------------------------------------
    */

    const filteredVacancies =
        useMemo(() => {
            const normalizedSearch =
                normalizeText(
                    search
                );


            return vacancies.filter(
                (vacancy) => {
                    /*
                    |--------------------------------------------------------------------------
                    | Build searchable text.
                    |--------------------------------------------------------------------------
                    */

                    const searchableText = [
                        vacancy?.title,
                        vacancy?.department,
                        vacancy?.category,
                        vacancy?.employment_type,
                        vacancy?.level,
                        vacancy?.experience,
                        vacancy?.description,
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    const matchesSearch =
                        !normalizedSearch ||
                        searchableText.includes(
                            normalizedSearch
                        );


                    /*
                    |--------------------------------------------------------------------------
                    | Category matching.
                    |--------------------------------------------------------------------------
                    */

                    const vacancyCategory =
                        getVacancyCategory(
                            vacancy
                        );

                    const matchesCategory =
                        category ===
                            "all" ||
                        vacancyCategory ===
                            category;


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


    /*
    |--------------------------------------------------------------------------
    | Clear filters
    |--------------------------------------------------------------------------
    */

    const clearFilters = () => {
        setSearch("");
        setCategory("all");
    };


    /*
    |--------------------------------------------------------------------------
    | Determine whether the user has
    | actively filtered the vacancies.
    |--------------------------------------------------------------------------
    */

    const hasActiveFilters =
        Boolean(
            search.trim()
        ) ||
        category !== "all";


    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <main className="careers-page">

            <SiteNavbar />


            {/* ==========================================================
                HERO
            ========================================================== */}

            <section className="careers-hero">

                <div className="container-xl">

                    <div className="careers-hero-inner">

                        <span className="careers-eyebrow">

                            <i
                                className="fas fa-briefcase"
                                aria-hidden="true"
                            />

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
                            Join a community of
                            educators and
                            professionals committed
                            to academic excellence,
                            discipline, innovation
                            and student success.
                        </p>


                        <div className="careers-hero-actions">

                            <a
                                href="#vacancies"
                                className="btn btn-primary btn-lg"
                            >
                                Explore Vacancies

                                <i
                                    className="fas fa-arrow-down ms-2"
                                    aria-hidden="true"
                                />
                            </a>


                            <Link
                                to="/careers/apply"
                                className="btn btn-outline-light btn-lg"
                            >
                                Submit General
                                Application
                            </Link>

                        </div>

                    </div>

                </div>

            </section>



            {/* ==========================================================
                CONTENT
            ========================================================== */}

            <section
                id="vacancies"
                className="careers-content"
            >

                <div className="container-xl">


                    {/* ======================================================
                        SECTION HEADING
                    ====================================================== */}

                    <div className="careers-section-heading">

                        <div>

                            <span>
                                OPPORTUNITIES
                            </span>

                            <h2>
                                Current Open
                                Positions
                            </h2>

                            <p>
                                Find an opportunity
                                that matches your
                                skills and experience.
                            </p>

                        </div>


                        {!isLoading &&
                            !isError && (
                                <div
                                    className="careers-count"
                                    aria-live="polite"
                                >

                                    <strong>
                                        {
                                            filteredVacancies.length
                                        }
                                    </strong>

                                    <span>
                                        {filteredVacancies.length ===
                                        1
                                            ? "Open Position"
                                            : "Open Positions"}
                                    </span>

                                </div>
                            )}

                    </div>



                    {/* ======================================================
                        FILTERS
                    ====================================================== */}

                    <div className="careers-filters">


                        {/* ==================================================
                            SEARCH
                        ================================================== */}

                        <div className="careers-search">

                            <i
                                className="fas fa-search"
                                aria-hidden="true"
                            />


                            <label
                                htmlFor="vacancy-search"
                                className="visually-hidden"
                            >
                                Search vacancies
                            </label>


                            <input
                                id="vacancy-search"
                                type="search"
                                placeholder="Search positions..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                autoComplete="off"
                            />


                            {search && (
                                <button
                                    type="button"
                                    className="careers-search-clear"
                                    onClick={() =>
                                        setSearch("")
                                    }
                                    aria-label="Clear vacancy search"
                                    title="Clear search"
                                >
                                    <i
                                        className="fas fa-times"
                                        aria-hidden="true"
                                    />
                                </button>
                            )}

                        </div>



                        {/* ==================================================
                            CATEGORY FILTERS
                        ================================================== */}

                        <div
                            className="careers-filter-buttons"
                            role="group"
                            aria-label="Filter vacancies by category"
                        >

                            {VACANCY_CATEGORIES.map(
                                (filter) => (
                                    <button
                                        key={
                                            filter.value
                                        }
                                        type="button"
                                        className={
                                            category ===
                                            filter.value
                                                ? "active"
                                                : ""
                                        }
                                        aria-pressed={
                                            category ===
                                            filter.value
                                        }
                                        onClick={() =>
                                            setCategory(
                                                filter.value
                                            )
                                        }
                                    >
                                        {
                                            filter.label
                                        }
                                    </button>
                                )
                            )}

                        </div>

                    </div>



                    {/* ======================================================
                        LOADING
                    ====================================================== */}

                    {isLoading && (
                        <div
                            className="careers-empty"
                            role="status"
                            aria-live="polite"
                        >

                            <div
                                className="spinner-border"
                                aria-hidden="true"
                            />

                            <h3>
                                Loading vacancies...
                            </h3>

                            <p>
                                Please wait while we
                                retrieve the latest
                                opportunities.
                            </p>

                        </div>
                    )}



                    {/* ======================================================
                        ERROR
                    ====================================================== */}

                    {isError && (
                        <div
                            className="careers-empty"
                            role="alert"
                        >

                            <i
                                className="fas fa-circle-exclamation"
                                aria-hidden="true"
                            />

                            <h3>
                                Unable to load
                                vacancies
                            </h3>

                            <p>
                                We could not retrieve
                                the current job
                                opportunities.
                                Please check your
                                connection and try
                                again.
                            </p>


                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() =>
                                    refetch()
                                }
                                disabled={isFetching}
                            >

                                {isFetching ? (
                                    <>
                                        <span
                                            className="spinner-border spinner-border-sm me-2"
                                            aria-hidden="true"
                                        />

                                        Retrying...
                                    </>
                                ) : (
                                    <>
                                        <i
                                            className="fas fa-rotate-right me-2"
                                            aria-hidden="true"
                                        />

                                        Try Again
                                    </>
                                )}

                            </button>

                        </div>
                    )}



                    {/* ======================================================
                        VACANCIES
                    ====================================================== */}

                    {!isLoading &&
                        !isError &&
                        filteredVacancies.length >
                            0 && (
                            <div
                                className="vacancy-grid"
                                aria-live="polite"
                            >

                                {filteredVacancies.map(
                                    (vacancy) => {
                                        const open =
                                            isVacancyOpen(
                                                vacancy
                                            );


                                        const icon =
                                            vacancy?.icon ||
                                            DEFAULT_ICON;


                                        const department =
                                            vacancy?.department ||
                                            "General";


                                        const employmentType =
                                            vacancy?.employment_type ||
                                            "Not specified";


                                        const level =
                                            vacancy?.level ||
                                            "Not specified";


                                        const experience =
                                            vacancy?.experience ||
                                            "";


                                        const description =
                                            truncateText(
                                                vacancy?.description
                                            );


                                        return (
                                            <article
                                                className={`vacancy-card ${
                                                    open
                                                        ? ""
                                                        : "vacancy-card-closed"
                                                }`}
                                                key={
                                                    vacancy.id
                                                }
                                            >


                                                {/* ==========================================
                                                    CARD TOP
                                                ========================================== */}

                                                <div className="vacancy-top">

                                                    <div className="vacancy-icon">

                                                        <i
                                                            className={
                                                                icon
                                                            }
                                                            aria-hidden="true"
                                                        />

                                                    </div>


                                                    <span
                                                        className={`vacancy-status ${
                                                            open
                                                                ? "is-open"
                                                                : "is-closed"
                                                        }`}
                                                        aria-label={
                                                            open
                                                                ? "Vacancy is open"
                                                                : "Vacancy is closed"
                                                        }
                                                    >

                                                        <span
                                                            aria-hidden="true"
                                                        />

                                                        {
                                                            open
                                                                ? "Open"
                                                                : "Closed"
                                                        }

                                                    </span>

                                                </div>



                                                {/* ==========================================
                                                    TITLE
                                                ========================================== */}

                                                <h3>
                                                    {
                                                        vacancy?.title ||
                                                        "Untitled Position"
                                                    }
                                                </h3>



                                                {/* ==========================================
                                                    DEPARTMENT
                                                ========================================== */}

                                                <div className="vacancy-department">

                                                    <i
                                                        className="fas fa-building"
                                                        aria-hidden="true"
                                                    />

                                                    {
                                                        department
                                                    }

                                                </div>



                                                {/* ==========================================
                                                    DESCRIPTION
                                                ========================================== */}

                                                <p>
                                                    {
                                                        description
                                                    }
                                                </p>



                                                {/* ==========================================
                                                    META
                                                ========================================== */}

                                                <div className="vacancy-meta">

                                                    <span>

                                                        <i
                                                            className="fas fa-clock"
                                                            aria-hidden="true"
                                                        />

                                                        {
                                                            employmentType
                                                        }

                                                    </span>


                                                    <span>

                                                        <i
                                                            className="fas fa-graduation-cap"
                                                            aria-hidden="true"
                                                        />

                                                        {
                                                            level
                                                        }

                                                    </span>


                                                    {experience && (
                                                        <span>

                                                            <i
                                                                className="fas fa-user-clock"
                                                                aria-hidden="true"
                                                            />

                                                            {
                                                                experience
                                                            }

                                                        </span>
                                                    )}

                                                </div>



                                                {/* ==========================================
                                                    FOOTER
                                                ========================================== */}

                                                <div className="vacancy-footer">

                                                    <div>

                                                        <small>
                                                            Application
                                                            Deadline
                                                        </small>

                                                        <strong>
                                                            {formatDate(
                                                                vacancy?.deadline
                                                            )}
                                                        </strong>

                                                    </div>



                                                    {open ? (
                                                        <Link
                                                            to={`/careers/apply?vacancy_id=${vacancy.id}`}
                                                            className="vacancy-apply"
                                                            aria-label={`Apply for ${
                                                                vacancy?.title ||
                                                                "this position"
                                                            }`}
                                                        >
                                                            Apply Now

                                                            <i
                                                                className="fas fa-arrow-right"
                                                                aria-hidden="true"
                                                            />

                                                        </Link>
                                                    ) : (
                                                        <span
                                                            className="vacancy-apply vacancy-apply-disabled"
                                                            aria-disabled="true"
                                                        >
                                                            Closed

                                                            <i
                                                                className="fas fa-lock"
                                                                aria-hidden="true"
                                                            />
                                                        </span>
                                                    )}

                                                </div>

                                            </article>
                                        );
                                    }
                                )}

                            </div>
                        )}



                    {/* ======================================================
                        FILTERED EMPTY STATE
                    ====================================================== */}

                    {!isLoading &&
                        !isError &&
                        vacancies.length > 0 &&
                        filteredVacancies.length ===
                            0 &&
                        hasActiveFilters && (
                            <div
                                className="careers-empty"
                                role="status"
                                aria-live="polite"
                            >

                                <i
                                    className="fas fa-filter-circle-xmark"
                                    aria-hidden="true"
                                />

                                <h3>
                                    No matching
                                    vacancies
                                </h3>

                                <p>
                                    We could not find
                                    any positions
                                    matching your
                                    current search
                                    or category
                                    filter.
                                </p>


                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={
                                        clearFilters
                                    }
                                >
                                    <i
                                        className="fas fa-filter-circle-xmark me-2"
                                        aria-hidden="true"
                                    />

                                    Clear Filters
                                </button>

                            </div>
                        )}



                    {/* ======================================================
                        NO VACANCIES AT ALL
                    ====================================================== */}

                    {!isLoading &&
                        !isError &&
                        vacancies.length ===
                            0 && (
                            <div
                                className="careers-empty"
                                role="status"
                                aria-live="polite"
                            >

                                <i
                                    className="fas fa-folder-open"
                                    aria-hidden="true"
                                />

                                <h3>
                                    No Current
                                    Vacancies
                                </h3>

                                <p>
                                    There are
                                    currently no
                                    open positions.
                                    Please check
                                    back later or
                                    submit a
                                    general
                                    application.
                                </p>


                                <Link
                                    to="/careers/apply"
                                    className="btn btn-primary"
                                >
                                    <i
                                        className="fas fa-paper-plane me-2"
                                        aria-hidden="true"
                                    />

                                    Submit General
                                    Application
                                </Link>

                            </div>
                        )}



                    {/* ======================================================
                        GENERAL APPLICATION
                    ====================================================== */}

                    <div className="general-application">

                        <div className="general-application-icon">

                            <i
                                className="fas fa-paper-plane"
                                aria-hidden="true"
                            />

                        </div>


                        <div>

                            <span>
                                DON'T SEE YOUR ROLE?
                            </span>

                            <h3>
                                Submit a General
                                Application
                            </h3>

                            <p>
                                We are always
                                interested in
                                meeting talented
                                educators and
                                professionals.
                                Send us your CV
                                and we will keep
                                your profile for
                                future
                                opportunities.
                            </p>

                        </div>


                        <Link
                            to="/careers/apply"
                            className="btn btn-primary"
                        >
                            Apply Generally

                            <i
                                className="fas fa-arrow-right ms-2"
                                aria-hidden="true"
                            />

                        </Link>

                    </div>

                </div>

            </section>



            {/* ==========================================================
                FOOTER
            ========================================================== */}

            <SiteFooter />

        </main>
    );
};


export default CareersPage;