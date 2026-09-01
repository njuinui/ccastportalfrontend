import React, {
    useMemo,
    useState,
} from "react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import {
    useAdminVacancies,
    useCloseVacancy,
    useDeleteVacancy,
    usePublishVacancy,
} from "../../api/vacancies";

import AppShell from "../../components/AppShell";

import "./CareersVacanciesPage.css";


/* ============================================================
   STATUS FILTERS
============================================================ */

const STATUS_FILTERS = [
    {
        value: "",
        label: "All",
        icon: "work",
    },
    {
        value: "published",
        label: "Published",
        icon: "public",
    },
    {
        value: "draft",
        label: "Draft",
        icon: "edit_note",
    },
    {
        value: "closed",
        label: "Closed",
        icon: "lock",
    },
];


/* ============================================================
   HELPERS
============================================================ */

const formatDate = (date) => {
    if (!date) {
        return "No deadline";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return "Invalid date";
    }

    return new Intl.DateTimeFormat(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    ).format(parsed);
};


const getStatusClass = (status) => {
    switch (status) {
        case "published":
            return "is-published";

        case "draft":
            return "is-draft";

        case "closed":
            return "is-closed";

        default:
            return "";
    }
};


const getStatusLabel = (status) => {
    switch (status) {
        case "published":
            return "Published";

        case "draft":
            return "Draft";

        case "closed":
            return "Closed";

        default:
            return status || "Unknown";
    }
};


/* ============================================================
   PAGE
============================================================ */

const CareersVacanciesPage = () => {
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);

    /* --------------------------------------------------------
       API PARAMS
    -------------------------------------------------------- */

    const params = useMemo(
        () => ({
            page,
            per_page: 15,

            ...(search.trim()
                ? {
                      search: search.trim(),
                  }
                : {}),

            ...(status
                ? {
                      status,
                  }
                : {}),
        }),
        [
            page,
            search,
            status,
        ]
    );


    /* --------------------------------------------------------
       QUERIES
    -------------------------------------------------------- */

    const {
        data,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useAdminVacancies(params);


    /* --------------------------------------------------------
       MUTATIONS
    -------------------------------------------------------- */

    const publishMutation =
        usePublishVacancy();

    const closeMutation =
        useCloseVacancy();

    const deleteMutation =
        useDeleteVacancy();


    /* --------------------------------------------------------
       NORMALIZE RESPONSE
    -------------------------------------------------------- */

    const vacancies =
        data?.data?.data ??
        data?.data ??
        [];


    const pagination =
        data?.data ?? {};


    /* --------------------------------------------------------
       DERIVED STATISTICS
    -------------------------------------------------------- */

    const statistics = useMemo(() => {
        return {
            total:
                pagination.total ??
                vacancies.length,

            published:
                vacancies.filter(
                    (vacancy) =>
                        vacancy.status ===
                        "published"
                ).length,

            draft:
                vacancies.filter(
                    (vacancy) =>
                        vacancy.status ===
                        "draft"
                ).length,

            closed:
                vacancies.filter(
                    (vacancy) =>
                        vacancy.status ===
                        "closed"
                ).length,
        };
    }, [
        pagination.total,
        vacancies,
    ]);


    /* ========================================================
       ACTIONS
    ======================================================== */

    const handlePublish = async (id) => {
        const confirmed = window.confirm(
            "Publish this vacancy on the public Careers page?"
        );

        if (!confirmed) {
            return;
        }

        try {
            await publishMutation.mutateAsync(id);
        } catch {
            // Mutation hook handles notification.
        }
    };


    const handleClose = async (id) => {
        const confirmed = window.confirm(
            "Close this vacancy?\n\nIt will no longer appear as an open position on the public Careers page."
        );

        if (!confirmed) {
            return;
        }

        try {
            await closeMutation.mutateAsync(id);
        } catch {
            // Mutation hook handles notification.
        }
    };


    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Delete this vacancy permanently?\n\nThis action cannot be undone."
        );

        if (!confirmed) {
            return;
        }

        try {
            await deleteMutation.mutateAsync(id);
        } catch {
            // Mutation hook handles notification.
        }
    };


    const handleSearchChange = (event) => {
        setPage(1);
        setSearch(event.target.value);
    };


    const handleStatusChange = (value) => {
        setPage(1);
        setStatus(value);
    };


    /* ========================================================
       RENDER
    ======================================================== */

    return (
        <AppShell>

            <div className="sa-vacancies-page">

                {/* ==================================================
                    PAGE HEADER
                ================================================== */}

                <header className="sa-vacancies-header">

                    <div className="sa-vacancies-header-content">

                        <div className="sa-breadcrumb">

                            <Link to="/super-admin">
                                Super Admin
                            </Link>

                            <span className="material-symbols-rounded">
                                chevron_right
                            </span>

                            <span>
                                Careers & Vacancies
                            </span>

                        </div>


                        <div className="sa-title-row">

                            <div className="sa-title-icon">

                                <span className="material-symbols-rounded">
                                    work
                                </span>

                            </div>


                            <div className="sa-title-content">

                                <div className="sa-title-kicker">
                                    Recruitment Management
                                </div>

                                <h1>
                                    Careers & Vacancies
                                </h1>

                                <p>
                                    Manage employment opportunities
                                    published on the CCAST public
                                    website.
                                </p>

                            </div>

                        </div>

                    </div>


                    <div className="sa-header-actions">

                        <button
                            type="button"
                            className="sa-secondary-action"
                            onClick={() => refetch()}
                            disabled={isFetching}
                        >
                            <span className="material-symbols-rounded">
                                refresh
                            </span>

                            <span>
                                Refresh
                            </span>
                        </button>


                        <Link
                            to="/careers/vacancies/new"
                            className="sa-primary-action"
                        >
                            <span className="material-symbols-rounded">
                                add
                            </span>

                            <span>
                                Post Vacancy
                            </span>
                        </Link>

                    </div>

                </header>


                {/* ==================================================
                    QUICK INFO
                ================================================== */}

                <div className="sa-vacancy-info">

                    <div className="sa-vacancy-info-icon">
                        <span className="material-symbols-rounded">
                            info
                        </span>
                    </div>

                    <div>

                        <strong>
                            Public Careers Page
                        </strong>

                        <p>
                            Published vacancies are automatically
                            made available to candidates through
                            the public CCAST Careers page.
                        </p>

                    </div>

                    <Link
                        to="/careers"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sa-view-public"
                    >
                        View public page
                        <span className="material-symbols-rounded">
                            open_in_new
                        </span>
                    </Link>

                </div>


                {/* ==================================================
                    STATISTICS
                ================================================== */}

                <section className="sa-vacancy-stats">

                    <div className="sa-vacancy-stat">

                        <div className="stat-icon total">
                            <span className="material-symbols-rounded">
                                work
                            </span>
                        </div>

                        <div className="stat-content">

                            <span className="stat-label">
                                Total Vacancies
                            </span>

                            <strong>
                                {statistics.total}
                            </strong>

                            <small>
                                All recruitment records
                            </small>

                        </div>

                    </div>


                    <div className="sa-vacancy-stat">

                        <div className="stat-icon published">
                            <span className="material-symbols-rounded">
                                public
                            </span>
                        </div>

                        <div className="stat-content">

                            <span className="stat-label">
                                Published
                            </span>

                            <strong>
                                {statistics.published}
                            </strong>

                            <small>
                                Visible to applicants
                            </small>

                        </div>

                    </div>


                    <div className="sa-vacancy-stat">

                        <div className="stat-icon draft">
                            <span className="material-symbols-rounded">
                                edit_note
                            </span>
                        </div>

                        <div className="stat-content">

                            <span className="stat-label">
                                Drafts
                            </span>

                            <strong>
                                {statistics.draft}
                            </strong>

                            <small>
                                Not publicly visible
                            </small>

                        </div>

                    </div>


                    <div className="sa-vacancy-stat">

                        <div className="stat-icon closed">
                            <span className="material-symbols-rounded">
                                lock
                            </span>
                        </div>

                        <div className="stat-content">

                            <span className="stat-label">
                                Closed
                            </span>

                            <strong>
                                {statistics.closed}
                            </strong>

                            <small>
                                No longer accepting applications
                            </small>

                        </div>

                    </div>

                </section>


                {/* ==================================================
                    MAIN PANEL
                ================================================== */}

                <section className="sa-vacancies-panel">

                    {/* ==================================================
                        PANEL HEADER
                    ================================================== */}

                    <div className="sa-vacancies-panel-header">

                        <div>

                            <span className="panel-kicker">
                                Recruitment
                            </span>

                            <h2>
                                Vacancy Management
                            </h2>

                            <p>
                                Create, publish, edit and manage
                                current employment opportunities.
                            </p>

                        </div>

                        <div className="panel-record-count">

                            <strong>
                                {statistics.total}
                            </strong>

                            <span>
                                records
                            </span>

                        </div>

                    </div>


                    {/* ==================================================
                        TOOLBAR
                    ================================================== */}

                    <div className="sa-vacancies-toolbar">

                        <div className="sa-vacancy-search">

                            <span className="material-symbols-rounded">
                                search
                            </span>

                            <input
                                type="search"
                                placeholder="Search by title or department..."
                                value={search}
                                onChange={handleSearchChange}
                                aria-label="Search vacancies"
                            />

                            {search && (
                                <button
                                    type="button"
                                    className="search-clear"
                                    onClick={() => {
                                        setSearch("");
                                        setPage(1);
                                    }}
                                    aria-label="Clear search"
                                >
                                    <span className="material-symbols-rounded">
                                        close
                                    </span>
                                </button>
                            )}

                        </div>


                        <div
                            className="sa-vacancy-filters"
                            role="tablist"
                            aria-label="Vacancy status"
                        >

                            {STATUS_FILTERS.map(
                                (item) => (
                                    <button
                                        type="button"
                                        key={item.value}
                                        className={
                                            status ===
                                            item.value
                                                ? "active"
                                                : ""
                                        }
                                        onClick={() =>
                                            handleStatusChange(
                                                item.value
                                            )
                                        }
                                        role="tab"
                                        aria-selected={
                                            status ===
                                            item.value
                                        }
                                    >

                                        <span className="material-symbols-rounded">
                                            {item.icon}
                                        </span>

                                        <span>
                                            {item.label}
                                        </span>

                                    </button>
                                )
                            )}

                        </div>

                    </div>


                    {/* ==================================================
                        LOADING
                    ================================================== */}

                    {isLoading && (
                        <div className="sa-vacancy-loading">

                            <div className="loading-spinner">
                                <span className="material-symbols-rounded">
                                    progress_activity
                                </span>
                            </div>

                            <strong>
                                Loading vacancies
                            </strong>

                            <span>
                                Please wait while recruitment
                                records are retrieved.
                            </span>

                        </div>
                    )}


                    {/* ==================================================
                        ERROR
                    ================================================== */}

                    {!isLoading && isError && (
                        <div className="sa-vacancy-error">

                            <div className="error-icon">
                                <span className="material-symbols-rounded">
                                    cloud_off
                                </span>
                            </div>

                            <h3>
                                Unable to load vacancies
                            </h3>

                            <p>
                                {error?.response?.data?.message ||
                                    "Something went wrong while loading vacancies. Please try again."}
                            </p>

                            <button
                                type="button"
                                className="sa-error-retry"
                                onClick={() => refetch()}
                            >
                                <span className="material-symbols-rounded">
                                    refresh
                                </span>

                                Try Again
                            </button>

                        </div>
                    )}


                    {/* ==================================================
                        EMPTY STATE
                    ================================================== */}

                    {!isLoading &&
                        !isError &&
                        vacancies.length === 0 && (
                            <div className="sa-vacancy-empty">

                                <div className="empty-icon">

                                    <span className="material-symbols-rounded">
                                        work_off
                                    </span>

                                </div>

                                <span className="empty-kicker">
                                    No Recruitment Records
                                </span>

                                <h3>
                                    No vacancies found
                                </h3>

                                <p>
                                    {search || status
                                        ? "Try changing your search or status filter."
                                        : "Create your first vacancy to publish an employment opportunity on the CCAST Careers page."}
                                </p>

                                <div className="empty-actions">

                                    {(search || status) && (
                                        <button
                                            type="button"
                                            className="sa-secondary-action"
                                            onClick={() => {
                                                setSearch("");
                                                setStatus("");
                                                setPage(1);
                                            }}
                                        >
                                            Clear Filters
                                        </button>
                                    )}

                                    <Link
                                        to="/careers/vacancies/new"
                                        className="sa-primary-action"
                                    >
                                        <span className="material-symbols-rounded">
                                            add
                                        </span>

                                        Post Vacancy
                                    </Link>

                                </div>

                            </div>
                        )}


                    {/* ==================================================
                        DESKTOP TABLE
                    ================================================== */}

                    {!isLoading &&
                        !isError &&
                        vacancies.length > 0 && (
                            <div className="sa-vacancy-table-wrapper">

                                <div className="table-responsive">

                                    <table className="sa-vacancy-table">

                                        <thead>

                                            <tr>
                                                <th>
                                                    Position
                                                </th>

                                                <th>
                                                    Department
                                                </th>

                                                <th>
                                                    Employment
                                                </th>

                                                <th>
                                                    Deadline
                                                </th>

                                                <th>
                                                    Status
                                                </th>

                                                <th className="actions-column">
                                                    Actions
                                                </th>
                                            </tr>

                                        </thead>


                                        <tbody>

                                            {vacancies.map(
                                                (vacancy) => (
                                                    <tr
                                                        key={
                                                            vacancy.id
                                                        }
                                                    >

                                                        {/* POSITION */}

                                                        <td>
                                                            <div className="position-cell">

                                                                <div className="position-icon">

                                                                    <span className="material-symbols-rounded">
                                                                        work
                                                                    </span>

                                                                </div>

                                                                <div className="position-details">

                                                                    <strong>
                                                                        {
                                                                            vacancy.title ||
                                                                            "Untitled Vacancy"
                                                                        }
                                                                    </strong>

                                                                    <div className="position-meta">

                                                                        {vacancy.level && (
                                                                            <span>
                                                                                {
                                                                                    vacancy.level
                                                                                }
                                                                            </span>
                                                                        )}

                                                                        {vacancy.featured && (
                                                                            <span className="featured-label">
                                                                                <span className="material-symbols-rounded">
                                                                                    star
                                                                                </span>

                                                                                Featured
                                                                            </span>
                                                                        )}

                                                                    </div>

                                                                </div>

                                                            </div>
                                                        </td>


                                                        {/* DEPARTMENT */}

                                                        <td>
                                                            <span className="department-cell">

                                                                <span className="material-symbols-rounded">
                                                                    apartment
                                                                </span>

                                                                {
                                                                    vacancy.department ||
                                                                    "—"
                                                                }

                                                            </span>
                                                        </td>


                                                        {/* EMPLOYMENT */}

                                                        <td>
                                                            <span className="employment-cell">

                                                                <span className="material-symbols-rounded">
                                                                    schedule
                                                                </span>

                                                                {
                                                                    vacancy.employment_type ||
                                                                    "—"
                                                                }

                                                            </span>
                                                        </td>


                                                        {/* DEADLINE */}

                                                        <td>
                                                            <div className="deadline-cell">

                                                                <span className="material-symbols-rounded">
                                                                    event
                                                                </span>

                                                                <div>

                                                                    <strong>
                                                                        {formatDate(
                                                                            vacancy.deadline
                                                                        )}
                                                                    </strong>

                                                                    {vacancy.deadline && (
                                                                        <small>
                                                                            Application deadline
                                                                        </small>
                                                                    )}

                                                                </div>

                                                            </div>
                                                        </td>


                                                        {/* STATUS */}

                                                        <td>

                                                            <span
                                                                className={`sa-vacancy-status ${getStatusClass(
                                                                    vacancy.status
                                                                )}`}
                                                            >

                                                                <span className="status-dot" />

                                                                {
                                                                    getStatusLabel(
                                                                        vacancy.status
                                                                    )
                                                                }

                                                            </span>

                                                        </td>


                                                        {/* ACTIONS */}

                                                        <td>

                                                            <div className="vacancy-actions">

                                                                {vacancy.status ===
                                                                    "draft" && (
                                                                    <button
                                                                        type="button"
                                                                        className="action-publish"
                                                                        title="Publish vacancy"
                                                                        aria-label={`Publish ${vacancy.title}`}
                                                                        onClick={() =>
                                                                            handlePublish(
                                                                                vacancy.id
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            publishMutation.isPending
                                                                        }
                                                                    >
                                                                        <span className="material-symbols-rounded">
                                                                            public
                                                                        </span>
                                                                    </button>
                                                                )}


                                                                {vacancy.status ===
                                                                    "published" && (
                                                                    <button
                                                                        type="button"
                                                                        className="action-close"
                                                                        title="Close vacancy"
                                                                        aria-label={`Close ${vacancy.title}`}
                                                                        onClick={() =>
                                                                            handleClose(
                                                                                vacancy.id
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            closeMutation.isPending
                                                                        }
                                                                    >
                                                                        <span className="material-symbols-rounded">
                                                                            lock
                                                                        </span>
                                                                    </button>
                                                                )}


                                                                <button
                                                                    type="button"
                                                                    className="action-edit"
                                                                    title="Edit vacancy"
                                                                    aria-label={`Edit ${vacancy.title}`}
                                                                    onClick={() =>
                                                                        navigate(
                                                                            `/careers/vacancies/${vacancy.id}/edit`
                                                                        )
                                                                    }
                                                                >
                                                                    <span className="material-symbols-rounded">
                                                                        edit
                                                                    </span>
                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    className="action-delete"
                                                                    title="Delete vacancy"
                                                                    aria-label={`Delete ${vacancy.title}`}
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            vacancy.id
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        deleteMutation.isPending
                                                                    }
                                                                >
                                                                    <span className="material-symbols-rounded">
                                                                        delete
                                                                    </span>
                                                                </button>

                                                            </div>

                                                        </td>

                                                    </tr>
                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>


                                {/* ==================================================
                                    MOBILE CARDS
                                ================================================== */}

                                <div className="sa-vacancy-mobile-list">

                                    {vacancies.map(
                                        (vacancy) => (
                                            <article
                                                className="sa-vacancy-mobile-card"
                                                key={
                                                    `mobile-${vacancy.id}`
                                                }
                                            >

                                                <div className="mobile-card-header">

                                                    <div className="position-cell">

                                                        <div className="position-icon">

                                                            <span className="material-symbols-rounded">
                                                                work
                                                            </span>

                                                        </div>

                                                        <div className="position-details">

                                                            <strong>
                                                                {
                                                                    vacancy.title ||
                                                                    "Untitled Vacancy"
                                                                }
                                                            </strong>

                                                            <small>
                                                                {
                                                                    vacancy.department ||
                                                                    "No department"
                                                                }
                                                            </small>

                                                        </div>

                                                    </div>


                                                    <span
                                                        className={`sa-vacancy-status ${getStatusClass(
                                                            vacancy.status
                                                        )}`}
                                                    >
                                                        <span className="status-dot" />

                                                        {
                                                            getStatusLabel(
                                                                vacancy.status
                                                            )
                                                        }
                                                    </span>

                                                </div>


                                                <div className="mobile-card-grid">

                                                    <div>
                                                        <small>
                                                            Employment
                                                        </small>

                                                        <strong>
                                                            {
                                                                vacancy.employment_type ||
                                                                "—"
                                                            }
                                                        </strong>
                                                    </div>


                                                    <div>
                                                        <small>
                                                            Level
                                                        </small>

                                                        <strong>
                                                            {
                                                                vacancy.level ||
                                                                "—"
                                                            }
                                                        </strong>
                                                    </div>


                                                    <div>
                                                        <small>
                                                            Deadline
                                                        </small>

                                                        <strong>
                                                            {formatDate(
                                                                vacancy.deadline
                                                            )}
                                                        </strong>
                                                    </div>

                                                </div>


                                                <div className="mobile-card-actions">

                                                    {vacancy.status ===
                                                        "draft" && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handlePublish(
                                                                    vacancy.id
                                                                )
                                                            }
                                                        >
                                                            <span className="material-symbols-rounded">
                                                                public
                                                            </span>

                                                            Publish
                                                        </button>
                                                    )}


                                                    {vacancy.status ===
                                                        "published" && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleClose(
                                                                    vacancy.id
                                                                )
                                                            }
                                                        >
                                                            <span className="material-symbols-rounded">
                                                                lock
                                                            </span>

                                                            Close
                                                        </button>
                                                    )}


                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(
                                                                `/careers/vacancies/${vacancy.id}/edit`
                                                            )
                                                        }
                                                    >
                                                        <span className="material-symbols-rounded">
                                                            edit
                                                        </span>

                                                        Edit
                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="danger"
                                                        onClick={() =>
                                                            handleDelete(
                                                                vacancy.id
                                                            )
                                                        }
                                                    >
                                                        <span className="material-symbols-rounded">
                                                            delete
                                                        </span>

                                                        Delete
                                                    </button>

                                                </div>

                                            </article>
                                        )
                                    )}

                                </div>

                            </div>
                        )}


                    {/* ==================================================
                        PAGINATION
                    ================================================== */}

                    {!isLoading &&
                        !isError &&
                        pagination.last_page > 1 && (
                            <div className="sa-vacancy-pagination">

                                <div className="pagination-info">

                                    Showing page{" "}

                                    <strong>
                                        {
                                            pagination.current_page
                                        }
                                    </strong>

                                    {" "}of{" "}

                                    <strong>
                                        {
                                            pagination.last_page
                                        }
                                    </strong>

                                </div>


                                <div className="pagination-controls">

                                    <button
                                        type="button"
                                        disabled={
                                            pagination.current_page <=
                                            1
                                        }
                                        onClick={() =>
                                            setPage(
                                                (current) =>
                                                    current - 1
                                            )
                                        }
                                        aria-label="Previous page"
                                    >
                                        <span className="material-symbols-rounded">
                                            chevron_left
                                        </span>
                                    </button>


                                    <span className="current-page">
                                        {
                                            pagination.current_page
                                        }
                                    </span>


                                    <button
                                        type="button"
                                        disabled={
                                            pagination.current_page >=
                                            pagination.last_page
                                        }
                                        onClick={() =>
                                            setPage(
                                                (current) =>
                                                    current + 1
                                            )
                                        }
                                        aria-label="Next page"
                                    >
                                        <span className="material-symbols-rounded">
                                            chevron_right
                                        </span>
                                    </button>

                                </div>

                            </div>
                        )}


                    {/* ==================================================
                        BACKGROUND REFRESH
                    ================================================== */}

                    {isFetching &&
                        !isLoading && (
                            <div className="sa-vacancy-refreshing">

                                <span className="material-symbols-rounded">
                                    sync
                                </span>

                                Updating vacancy records...

                            </div>
                        )}

                </section>

            </div>

        </AppShell>
    );
};


export default CareersVacanciesPage;