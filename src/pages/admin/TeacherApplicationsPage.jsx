import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Eye,
    FileDown,
    RefreshCw,
    Search,
    SlidersHorizontal,
    X,
} from "lucide-react";

import {
    getTeacherApplications,
    getTeacherApplicationStatistics,
    TEACHER_APPLICATION_STATUS_META,
} from "../../api/teacherApplications";

import TeacherApplicationDetailsModal from "../../components/admin/TeacherApplicationDetailsModal";

import "./TeacherApplicationsPage.css";


const EMPTY_STATS = {
    total: 0,
    submitted: 0,
    under_review: 0,
    shortlisted: 0,
    interview: 0,
    accepted: 0,
    rejected: 0,
    this_month: 0,
};


const STATUS_FILTERS = [
    {
        value: "",
        label: "All Applications",
    },

    {
        value: "submitted",
        label: "Submitted",
    },

    {
        value: "under_review",
        label: "Under Review",
    },

    {
        value: "shortlisted",
        label: "Shortlisted",
    },

    {
        value: "interview",
        label: "Interview",
    },

    {
        value: "accepted",
        label: "Accepted",
    },

    {
        value: "rejected",
        label: "Rejected",
    },

    {
        value: "withdrawn",
        label: "Withdrawn",
    },
];


function formatDate(value) {
    if (!value) {
        return "—";
    }

    try {
        return new Intl.DateTimeFormat(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        ).format(new Date(value));
    } catch {
        return value;
    }
}


function formatDateTime(value) {
    if (!value) {
        return "—";
    }

    try {
        return new Intl.DateTimeFormat(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        ).format(new Date(value));
    } catch {
        return value;
    }
}


function getStatusMeta(status) {
    return (
        TEACHER_APPLICATION_STATUS_META[status] || {
            label: status || "Unknown",
            icon: "bx bx-help-circle",
        }
    );
}


function getApplicationName(application) {
    if (
        application?.applicant_name
    ) {
        return application.applicant_name;
    }

    const first =
        application?.first_name || "";

    const last =
        application?.last_name || "";

    return `${first} ${last}`.trim() || "Unknown Applicant";
}


function getPosition(application) {
    return (
        application?.position?.title ||
        application?.vacancy?.title ||
        application?.subject ||
        "—"
    );
}


export default function TeacherApplicationsPage() {
    const [
        applications,
        setApplications,
    ] = useState([]);

    const [
        statistics,
        setStatistics,
    ] = useState(EMPTY_STATS);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        statsLoading,
        setStatsLoading,
    ] = useState(true);

    const [
        refreshing,
        setRefreshing,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        searchInput,
        setSearchInput,
    ] = useState("");

    const [
        search,
        setSearch,
    ] = useState("");

    const [
        status,
        setStatus,
    ] = useState("");

    const [
        page,
        setPage,
    ] = useState(1);

    const [
        pagination,
        setPagination,
    ] = useState(null);

    const [
        selectedApplication,
        setSelectedApplication,
    ] = useState(null);

    const [
        detailsOpen,
        setDetailsOpen,
    ] = useState(false);


    /*
    |--------------------------------------------------------------------------
    | Load statistics
    |--------------------------------------------------------------------------
    */

    const loadStatistics = useCallback(
        async () => {
            setStatsLoading(true);

            try {
                const response =
                    await getTeacherApplicationStatistics();

                setStatistics(
                    response?.data ||
                    EMPTY_STATS
                );
            } catch (exception) {
                console.error(
                    "Failed to load teacher application statistics:",
                    exception
                );
            } finally {
                setStatsLoading(false);
            }
        },
        []
    );


    /*
    |--------------------------------------------------------------------------
    | Load applications
    |--------------------------------------------------------------------------
    */

    const loadApplications = useCallback(
        async ({
            showRefresh = false,
        } = {}) => {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            try {
                const response =
                    await getTeacherApplications({
                        page,
                        per_page: 20,
                        search,
                        status,
                    });

                /*
                |--------------------------------------------------------------------------
                | Laravel Resource collection
                |--------------------------------------------------------------------------
                */

                setApplications(
                    response?.data || []
                );

                setPagination(
                    response?.meta || null
                );
            } catch (exception) {
                console.error(
                    "Failed to load teacher applications:",
                    exception
                );

                setError(
                    exception?.response?.data?.message ||
                    "Unable to load teacher applications."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [
            page,
            search,
            status,
        ]
    );


    /*
    |--------------------------------------------------------------------------
    | Initial load
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        loadStatistics();
    }, [
        loadStatistics,
    ]);


    /*
    |--------------------------------------------------------------------------
    | Applications
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        loadApplications();
    }, [
        loadApplications,
    ]);


    /*
    |--------------------------------------------------------------------------
    | Search debounce
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const timer =
            window.setTimeout(() => {
                setPage(1);
                setSearch(
                    searchInput.trim()
                );
            }, 450);

        return () => {
            window.clearTimeout(timer);
        };
    }, [
        searchInput,
    ]);


    /*
    |--------------------------------------------------------------------------
    | Refresh
    |--------------------------------------------------------------------------
    */

    const handleRefresh = async () => {
        await Promise.all([
            loadApplications({
                showRefresh: true,
            }),
            loadStatistics(),
        ]);
    };


    /*
    |--------------------------------------------------------------------------
    | Open application
    |--------------------------------------------------------------------------
    */

    const handleOpenApplication = (
        application
    ) => {
        setSelectedApplication(
            application
        );

        setDetailsOpen(true);
    };


    /*
    |--------------------------------------------------------------------------
    | Close modal
    |--------------------------------------------------------------------------
    */

    const handleCloseDetails = () => {
        setDetailsOpen(false);
        setSelectedApplication(null);
    };


    /*
    |--------------------------------------------------------------------------
    | Status counts
    |--------------------------------------------------------------------------
    */

    const statusCards = useMemo(
        () => [
            {
                key: "total",
                label: "Total Applications",
                value: statistics.total,
                icon: "bx bx-group",
            },

            {
                key: "submitted",
                label: "New Applications",
                value: statistics.submitted,
                icon: "bx bx-send",
            },

            {
                key: "under_review",
                label: "Under Review",
                value: statistics.under_review,
                icon: "bx bx-search-alt",
            },

            {
                key: "shortlisted",
                label: "Shortlisted",
                value: statistics.shortlisted,
                icon: "bx bx-list-check",
            },

            {
                key: "interview",
                label: "Interviews",
                value: statistics.interview,
                icon: "bx bx-conversation",
            },

            {
                key: "accepted",
                label: "Accepted",
                value: statistics.accepted,
                icon: "bx bx-check-circle",
            },

            {
                key: "rejected",
                label: "Rejected",
                value: statistics.rejected,
                icon: "bx bx-x-circle",
            },

            {
                key: "this_month",
                label: "This Month",
                value: statistics.this_month,
                icon: "bx bx-calendar",
            },
        ],
        [
            statistics,
        ]
    );


    /*
    |--------------------------------------------------------------------------
    | Pagination helpers
    |--------------------------------------------------------------------------
    */

    const currentPage =
        pagination?.current_page ||
        page;

    const lastPage =
        pagination?.last_page ||
        1;

    const canPrevious =
        currentPage > 1;

    const canNext =
        currentPage < lastPage;


    return (
        <div className="teacher-applications-page">

            {/* ==========================================================
                PAGE HEADER
            ========================================================== */}

            <header className="ta-page-header">

                <div>
                    <div className="ta-breadcrumb">
                        <span>Administration</span>
                        <i className="bx bx-chevron-right" />
                        <strong>Teacher Applications</strong>
                    </div>

                    <h1>
                        Teacher Applications
                    </h1>

                    <p>
                        Review, manage and track
                        teacher recruitment applications.
                    </p>
                </div>


                <button
                    type="button"
                    className="ta-refresh-button"
                    onClick={handleRefresh}
                    disabled={refreshing}
                >
                    <RefreshCw
                        size={17}
                        className={
                            refreshing
                                ? "ta-spin"
                                : ""
                        }
                    />

                    <span>
                        Refresh
                    </span>
                </button>

            </header>


            {/* ==========================================================
                STATISTICS
            ========================================================== */}

            <section className="ta-stat-grid">

                {statusCards.map((card) => (
                    <div
                        className="ta-stat-card"
                        key={card.key}
                    >
                        <div className="ta-stat-icon">
                            <i
                                className={
                                    card.icon
                                }
                            />
                        </div>

                        <div className="ta-stat-content">

                            <span>
                                {card.label}
                            </span>

                            <strong>
                                {statsLoading
                                    ? "—"
                                    : card.value}
                            </strong>

                        </div>
                    </div>
                ))}

            </section>


            {/* ==========================================================
                TOOLBAR
            ========================================================== */}

            <section className="ta-toolbar">

                <div className="ta-search">

                    <Search size={18} />

                    <input
                        type="search"
                        value={searchInput}
                        onChange={(event) =>
                            setSearchInput(
                                event.target.value
                            )
                        }
                        placeholder="Search applicant, reference, email or subject..."
                    />

                    {searchInput && (
                        <button
                            type="button"
                            onClick={() =>
                                setSearchInput("")
                            }
                            aria-label="Clear search"
                        >
                            <X size={16} />
                        </button>
                    )}

                </div>


                <div className="ta-filter">

                    <SlidersHorizontal
                        size={17}
                    />

                    <select
                        value={status}
                        onChange={(event) => {
                            setStatus(
                                event.target.value
                            );

                            setPage(1);
                        }}
                    >
                        {STATUS_FILTERS.map(
                            (filter) => (
                                <option
                                    key={
                                        filter.value
                                    }
                                    value={
                                        filter.value
                                    }
                                >
                                    {filter.label}
                                </option>
                            )
                        )}
                    </select>

                </div>

            </section>


            {/* ==========================================================
                ERROR
            ========================================================== */}

            {error && (
                <div className="ta-error">

                    <i className="bx bx-error-circle" />

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            loadApplications()
                        }
                    >
                        Try again
                    </button>

                </div>
            )}


            {/* ==========================================================
                TABLE
            ========================================================== */}

            <section className="ta-table-card">

                <div className="ta-table-header">

                    <div>
                        <h2>
                            Applications
                        </h2>

                        <span>
                            {pagination?.total ??
                                applications.length}{" "}
                            application
                            {(
                                pagination?.total ??
                                applications.length
                            ) !== 1
                                ? "s"
                                : ""}
                        </span>
                    </div>

                </div>


                <div className="ta-table-wrapper">

                    <table className="ta-table">

                        <thead>
                            <tr>

                                <th>
                                    Applicant
                                </th>

                                <th>
                                    Reference
                                </th>

                                <th>
                                    Position
                                </th>

                                <th>
                                    Subject
                                </th>

                                <th>
                                    Submitted
                                </th>

                                <th>
                                    Status
                                </th>

                                <th className="ta-action-column">
                                    Action
                                </th>

                            </tr>
                        </thead>


                        <tbody>

                            {loading ? (
                                Array.from({
                                    length: 7,
                                }).map(
                                    (_, index) => (
                                        <tr
                                            key={
                                                index
                                            }
                                            className="ta-skeleton-row"
                                        >
                                            <td>
                                                <span />
                                            </td>

                                            <td>
                                                <span />
                                            </td>

                                            <td>
                                                <span />
                                            </td>

                                            <td>
                                                <span />
                                            </td>

                                            <td>
                                                <span />
                                            </td>

                                            <td>
                                                <span />
                                            </td>

                                            <td>
                                                <span />
                                            </td>
                                        </tr>
                                    )
                                )
                            ) : applications.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="ta-empty"
                                    >
                                        <div>

                                            <div className="ta-empty-icon">
                                                <i className="bx bx-folder-open" />
                                            </div>

                                            <h3>
                                                No applications found
                                            </h3>

                                            <p>
                                                Try changing
                                                your search
                                                or filter.
                                            </p>

                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                applications.map(
                                    (
                                        application
                                    ) => {

                                        const meta =
                                            getStatusMeta(
                                                application.status
                                            );

                                        return (
                                            <tr
                                                key={
                                                    application.id
                                                }
                                            >

                                                <td>
                                                    <div className="ta-applicant">

                                                        <div className="ta-avatar">
                                                            {getApplicationName(
                                                                application
                                                            )
                                                                .charAt(
                                                                    0
                                                                )
                                                                .toUpperCase()}
                                                        </div>

                                                        <div>
                                                            <strong>
                                                                {getApplicationName(
                                                                    application
                                                                )}
                                                            </strong>

                                                            <span>
                                                                {application.email ||
                                                                    "No email"}
                                                            </span>
                                                        </div>

                                                    </div>
                                                </td>


                                                <td>
                                                    <code>
                                                        {
                                                            application.reference
                                                        }
                                                    </code>
                                                </td>


                                                <td>
                                                    <strong className="ta-position">
                                                        {getPosition(
                                                            application
                                                        )}
                                                    </strong>

                                                    {application
                                                        ?.position
                                                        ?.department && (
                                                        <span className="ta-sub-text">
                                                            {
                                                                application
                                                                    .position
                                                                    .department
                                                            }
                                                        </span>
                                                    )}
                                                </td>


                                                <td>
                                                    {
                                                        application.subject ||
                                                        "—"
                                                    }
                                                </td>


                                                <td>
                                                    <span className="ta-date">
                                                        {formatDate(
                                                            application.submitted_at
                                                        )}
                                                    </span>
                                                </td>


                                                <td>
                                                    <span
                                                        className={`ta-status ta-status-${application.status}`}
                                                    >
                                                        <i
                                                            className={
                                                                meta.icon
                                                            }
                                                        />

                                                        {
                                                            meta.label
                                                        }
                                                    </span>
                                                </td>


                                                <td>

                                                    <button
                                                        type="button"
                                                        className="ta-view-button"
                                                        onClick={() =>
                                                            handleOpenApplication(
                                                                application
                                                            )
                                                        }
                                                        title="View application"
                                                    >
                                                        <Eye
                                                            size={17}
                                                        />

                                                        <span>
                                                            View
                                                        </span>
                                                    </button>

                                                </td>

                                            </tr>
                                        );
                                    }
                                )
                            )}

                        </tbody>

                    </table>

                </div>


                {/* ======================================================
                    PAGINATION
                ====================================================== */}

                {!loading &&
                    applications.length > 0 && (
                        <div className="ta-pagination">

                            <span>
                                Page{" "}
                                <strong>
                                    {currentPage}
                                </strong>{" "}
                                of{" "}
                                <strong>
                                    {lastPage}
                                </strong>
                            </span>


                            <div>

                                <button
                                    type="button"
                                    disabled={
                                        !canPrevious
                                    }
                                    onClick={() =>
                                        setPage(
                                            (value) =>
                                                value - 1
                                        )
                                    }
                                >
                                    <i className="bx bx-chevron-left" />
                                    Previous
                                </button>


                                <button
                                    type="button"
                                    disabled={
                                        !canNext
                                    }
                                    onClick={() =>
                                        setPage(
                                            (value) =>
                                                value + 1
                                        )
                                    }
                                >
                                    Next
                                    <i className="bx bx-chevron-right" />
                                </button>

                            </div>

                        </div>
                    )}

            </section>


            {/* ==========================================================
                DETAILS MODAL
            ========================================================== */}

            {detailsOpen && (
                <TeacherApplicationDetailsModal
                    application={
                        selectedApplication
                    }
                    onClose={
                        handleCloseDetails
                    }
                    onUpdated={() => {
                        handleCloseDetails();

                        loadApplications();

                        loadStatistics();
                    }}
                />
            )}

        </div>
    );
}