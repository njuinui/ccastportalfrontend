// src/pages/portals/DisciplineMasterDashboard.jsx
// ============================================================
// CCAST SCHOOL MANAGEMENT SYSTEM
// Discipline Master Executive Dashboard
// Bootstrap 5 + Custom CSS
// ============================================================

import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    useDisciplineMasterDashboard,
} from "../../api/dashboard";
import { initials } from "../../components/ui";
import "./DisciplineMasterDashboard.css";

/* ============================================================
   HELPERS
============================================================ */

const formatNumber = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    const number = Number(value);

    return Number.isNaN(number)
        ? "—"
        : number.toLocaleString();
};

const formatPercent = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    const number = Number(value);

    return Number.isNaN(number)
        ? "—"
        : `${number.toFixed(1)}%`;
};

const clamp = (
    value,
    min = 0,
    max = 100
) => {
    const number = Number(value);

    if (Number.isNaN(number)) {
        return min;
    }

    return Math.min(
        Math.max(number, min),
        max
    );
};

const todayLabel = () =>
    new Date().toLocaleDateString(
        "en-GB",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        }
    );

const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) {
        return "Good morning";
    }

    if (hour < 17) {
        return "Good afternoon";
    }

    return "Good evening";
};

const normalizeArray = (value) =>
    Array.isArray(value) ? value : [];

const getSeverity = (severity) => {
    const value = String(
        severity || "minor"
    ).toLowerCase();

    if (
        ["critical", "high", "major"].includes(
            value
        )
    ) {
        return {
            label: severity || "High",
            className: "dm-severity-high",
            icon: "priority_high",
        };
    }

    if (
        ["medium", "moderate"].includes(
            value
        )
    ) {
        return {
            label: severity || "Medium",
            className: "dm-severity-medium",
            icon: "warning",
        };
    }

    return {
        label: severity || "Minor",
        className: "dm-severity-low",
        icon: "info",
    };
};

const getStatusClass = (status) => {
    const value = String(
        status || "Pending"
    ).toLowerCase();

    if (
        ["resolved", "completed", "closed"].includes(
            value
        )
    ) {
        return "dm-status-success";
    }

    if (
        ["ongoing", "investigating", "active"].includes(
            value
        )
    ) {
        return "dm-status-warning";
    }

    if (
        ["cancelled", "rejected"].includes(
            value
        )
    ) {
        return "dm-status-danger";
    }

    return "dm-status-neutral";
};

/* ============================================================
   ICON
============================================================ */

function Icon({
    children,
    size = 20,
    filled = false,
}) {
    return (
        <span
            className={`material-symbols-outlined ${
                filled
                    ? "dm-icon-filled"
                    : ""
            }`}
            style={{
                fontSize: size,
            }}
            aria-hidden="true"
        >
            {children}
        </span>
    );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({
    icon = "info",
    title = "Nothing to display",
    text = "There is currently no information available.",
}) {
    return (
        <div className="dm-empty">
            <div className="dm-empty-icon">
                <Icon size={24}>
                    {icon}
                </Icon>
            </div>

            <strong>{title}</strong>

            <span>{text}</span>
        </div>
    );
}

/* ============================================================
   SECTION HEADER
============================================================ */

function SectionHeader({
    icon,
    title,
    subtitle,
    action,
    to = "#",
    badge,
}) {
    return (
        <div className="dm-section-header">
            <div className="dm-section-heading">
                <div className="dm-section-icon">
                    <Icon>{icon}</Icon>
                </div>

                <div>
                    <div className="dm-section-title">
                        <h2>{title}</h2>

                        {badge && (
                            <span className="dm-section-badge">
                                {badge}
                            </span>
                        )}
                    </div>

                    {subtitle && (
                        <p>{subtitle}</p>
                    )}
                </div>
            </div>

            {action && (
                <Link
                    to={to}
                    className="dm-section-action"
                >
                    {action}

                    <Icon size={16}>
                        arrow_forward
                    </Icon>
                </Link>
            )}
        </div>
    );
}

/* ============================================================
   KPI CARD
============================================================ */

function KpiCard({
    icon,
    title,
    value,
    subtitle,
    trend,
    trendType = "neutral",
    variant = "red",
}) {
    const trendIcon =
        trendType === "up"
            ? "trending_up"
            : trendType === "down"
                ? "trending_down"
                : "remove";

    return (
        <article
            className={`dm-kpi-card dm-kpi-${variant}`}
        >
            <div className="dm-kpi-top">
                <div className="dm-kpi-icon">
                    <Icon>{icon}</Icon>
                </div>

                {trend !== null &&
                    trend !== undefined &&
                    trend !== "" && (
                        <span
                            className={`dm-kpi-trend dm-trend-${trendType}`}
                        >
                            <Icon size={14}>
                                {trendIcon}
                            </Icon>

                            {trend}
                        </span>
                    )}
            </div>

            <div className="dm-kpi-label">
                {title}
            </div>

            <div className="dm-kpi-value">
                {value}
            </div>

            <div className="dm-kpi-subtitle">
                {subtitle}
            </div>
        </article>
    );
}

/* ============================================================
   HERO
============================================================ */

function DashboardHero({
    period,
    setPeriod,
    onRefresh,
    isFetching,
}) {
    const periods = [
        ["today", "Today"],
        ["week", "Week"],
        ["month", "Month"],
        ["term", "Term"],
    ];

    return (
        <header className="dm-hero">
            <div className="dm-hero-main">
                <div className="dm-hero-eyebrow">
                    <span className="dm-live-indicator" />
                    Discipline Master's Office
                </div>

                <h1>
                    {getGreeting()},
                    <br />

                    <span>
                        Discipline Master
                    </span>
                </h1>

                <p>
                    Monitor student behaviour,
                    attendance and disciplinary
                    activity across the school.
                </p>

                <div className="dm-hero-meta">
                    <span>
                        <Icon size={16}>
                            calendar_today
                        </Icon>

                        {todayLabel()}
                    </span>

                    <span>
                        <Icon size={16}>
                            shield
                        </Icon>

                        Discipline monitoring active
                    </span>
                </div>
            </div>

            <div className="dm-hero-controls">
                <div className="dm-period-switcher">
                    {periods.map(
                        ([value, label]) => (
                            <button
                                type="button"
                                key={value}
                                className={
                                    period === value
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setPeriod(
                                        value
                                    )
                                }
                            >
                                {label}
                            </button>
                        )
                    )}
                </div>

                <button
                    type="button"
                    className={`dm-refresh-btn ${
                        isFetching
                            ? "is-refreshing"
                            : ""
                    }`}
                    onClick={onRefresh}
                    disabled={isFetching}
                    title="Refresh dashboard"
                >
                    <Icon>
                        refresh
                    </Icon>
                </button>
            </div>
        </header>
    );
}

/* ============================================================
   ATTENDANCE OVERVIEW
============================================================ */

function AttendanceOverview({
    attendance = {},
}) {
    const rate = clamp(
        attendance.rate ?? 0
    );

    const present = Number(
        attendance.present ?? 0
    );

    const absent = Number(
        attendance.absent ?? 0
    );

    const late = Number(
        attendance.late ?? 0
    );

    const target = Number(
        attendance.target ?? 90
    );

    const radius = 52;
    const circumference =
        2 * Math.PI * radius;

    const offset =
        circumference -
        (rate / 100) *
            circumference;

    return (
        <article className="dm-card">
            <SectionHeader
                icon="fact_check"
                title="Attendance Today"
                subtitle="Student attendance monitoring"
                action="View attendance"
                to="/attendance"
            />

            <div className="dm-card-body">
                <div className="row g-4 align-items-center">
                    <div className="col-md-5">
                        <div className="dm-attendance-ring">
                            <svg
                                viewBox="0 0 140 140"
                                aria-label={`Attendance ${formatPercent(
                                    rate
                                )}`}
                            >
                                <circle
                                    cx="70"
                                    cy="70"
                                    r={radius}
                                    className="dm-ring-background"
                                />

                                <circle
                                    cx="70"
                                    cy="70"
                                    r={radius}
                                    className="dm-ring-progress"
                                    strokeDasharray={
                                        circumference
                                    }
                                    strokeDashoffset={
                                        offset
                                    }
                                />
                            </svg>

                            <div className="dm-ring-content">
                                <strong>
                                    {formatPercent(
                                        rate
                                    )}
                                </strong>

                                <span>
                                    Present
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-7">
                        <div className="dm-attendance-stats">
                            <AttendanceStat
                                label="Present"
                                value={present}
                                type="success"
                            />

                            <AttendanceStat
                                label="Absent"
                                value={absent}
                                type="danger"
                            />

                            <AttendanceStat
                                label="Late"
                                value={late}
                                type="warning"
                            />
                        </div>

                        <div className="dm-target-box">
                            <div>
                                <span>
                                    Attendance target
                                </span>

                                <strong>
                                    {target}%
                                </strong>
                            </div>

                            <div className="progress dm-progress">
                                <div
                                    className="progress-bar"
                                    style={{
                                        width: `${rate}%`,
                                    }}
                                />
                            </div>

                            <small>
                                {rate >= target
                                    ? "Target achieved"
                                    : `${(
                                          target -
                                          rate
                                      ).toFixed(
                                          1
                                      )}% below target`}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}

function AttendanceStat({
    label,
    value,
    type,
}) {
    return (
        <div className="dm-attendance-stat">
            <span
                className={`dm-stat-dot dm-dot-${type}`}
            />

            <span>{label}</span>

            <strong>
                {formatNumber(value)}
            </strong>
        </div>
    );
}

/* ============================================================
   DISCIPLINE OVERVIEW
============================================================ */

function DisciplineOverview({
    data = {},
}) {
    const items = [
        {
            label: "Open cases",
            value: data.open_cases ?? 0,
            icon: "gavel",
            type: "red",
            to: "/discipline/cases",
        },
        {
            label: "Investigations",
            value:
                data.pending_investigations ?? 0,
            icon: "manage_search",
            type: "purple",
            to: "/discipline/investigations",
        },
        {
            label: "Suspensions",
            value:
                data.active_suspensions ?? 0,
            icon: "block",
            type: "orange",
            to: "/discipline/suspensions",
        },
        {
            label: "Repeat offenders",
            value:
                data.repeat_offenders ?? 0,
            icon: "history",
            type: "blue",
            to: "/discipline/repeat-offenders",
        },
    ];

    return (
        <article className="dm-card">
            <SectionHeader
                icon="gavel"
                title="Discipline Overview"
                subtitle="Current disciplinary workload"
                action="Open discipline"
                to="/discipline/cases"
            />

            <div className="dm-card-body">
                <div className="row g-3">
                    {items.map((item) => (
                        <div
                            className="col-6"
                            key={item.label}
                        >
                            <Link
                                to={item.to}
                                className={`dm-overview-box dm-overview-${item.type}`}
                            >
                                <div className="dm-overview-icon">
                                    <Icon>
                                        {item.icon}
                                    </Icon>
                                </div>

                                <div>
                                    <strong>
                                        {formatNumber(
                                            item.value
                                        )}
                                    </strong>

                                    <span>
                                        {item.label}
                                    </span>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </article>
    );
}

/* ============================================================
   INCIDENT TREND
============================================================ */

function IncidentTrend({
    data = [],
}) {
    const values = data.map((item) =>
        Number(
            item.value ??
                item.count ??
                item.total ??
                0
        )
    );

    const max = Math.max(
        1,
        ...values
    );

    return (
        <article className="dm-card">
            <SectionHeader
                icon="monitoring"
                title="Incident Trend"
                subtitle="Disciplinary activity over time"
                action="Detailed report"
                to="/discipline/reports/incidents"
            />

            <div className="dm-card-body">
                {data.length === 0 ? (
                    <EmptyState
                        icon="monitoring"
                        title="No trend data"
                        text="Incident activity will appear here once records are available."
                    />
                ) : (
                    <div className="dm-trend-chart">
                        <div className="dm-chart-grid">
                            {[100, 75, 50, 25, 0].map(
                                (value) => (
                                    <div
                                        key={value}
                                        className="dm-grid-line"
                                        style={{
                                            bottom: `${value}%`,
                                        }}
                                    >
                                        <span>
                                            {Math.round(
                                                (max *
                                                    value) /
                                                    100
                                            )}
                                        </span>
                                    </div>
                                )
                            )}
                        </div>

                        <div className="dm-chart-bars">
                            {data
                                .slice(-12)
                                .map(
                                    (
                                        item,
                                        index
                                    ) => {
                                        const value =
                                            Number(
                                                item.value ??
                                                    item.count ??
                                                    item.total ??
                                                    0
                                            );

                                        const height =
                                            (value /
                                                max) *
                                            100;

                                        return (
                                            <div
                                                className="dm-chart-column"
                                                key={
                                                    item.id ||
                                                    index
                                                }
                                            >
                                                <div className="dm-chart-value">
                                                    {
                                                        value
                                                    }
                                                </div>

                                                <div
                                                    className="dm-chart-bar"
                                                    style={{
                                                        height: `${Math.max(
                                                            height,
                                                            4
                                                        )}%`,
                                                    }}
                                                />

                                                <span>
                                                    {item.label ||
                                                        item.date ||
                                                        item.month ||
                                                        `P${
                                                            index +
                                                            1
                                                        }`}
                                                </span>
                                            </div>
                                        );
                                    }
                                )}
                        </div>
                    </div>
                )}
            </div>
        </article>
    );
}

/* ============================================================
   INCIDENT CATEGORIES
============================================================ */

function IncidentCategories({
    data = [],
}) {
    const total = data.reduce(
        (sum, item) =>
            sum +
            Number(
                item.value ??
                    item.count ??
                    0
            ),
        0
    );

    const palette = [
        "dm-category-red",
        "dm-category-orange",
        "dm-category-amber",
        "dm-category-purple",
        "dm-category-blue",
        "dm-category-cyan",
    ];

    return (
        <article className="dm-card">
            <SectionHeader
                icon="category"
                title="Incident Categories"
                subtitle="Most common discipline issues"
                action="Analyze"
                to="/discipline/reports/incidents"
            />

            <div className="dm-card-body">
                {data.length === 0 ? (
                    <EmptyState
                        icon="category"
                        title="No categories"
                        text="Incident categories will appear here."
                    />
                ) : (
                    data
                        .slice(0, 6)
                        .map((item, index) => {
                            const value =
                                Number(
                                    item.value ??
                                        item.count ??
                                        0
                                );

                            const percentage =
                                total > 0
                                    ? (value /
                                          total) *
                                      100
                                    : 0;

                            return (
                                <div
                                    className="dm-category-row"
                                    key={
                                        item.id ||
                                        index
                                    }
                                >
                                    <div className="dm-category-heading">
                                        <span>
                                            {item.name ||
                                                item.category ||
                                                "Other"}
                                        </span>

                                        <strong>
                                            {formatNumber(
                                                value
                                            )}
                                        </strong>
                                    </div>

                                    <div className="progress dm-category-progress">
                                        <div
                                            className={`progress-bar ${palette[
                                                index %
                                                    palette.length
                                            ]}`}
                                            style={{
                                                width: `${clamp(
                                                    percentage
                                                )}%`,
                                            }}
                                        />
                                    </div>

                                    <small>
                                        {percentage.toFixed(
                                            1
                                        )}
                                        %
                                    </small>
                                </div>
                            );
                        })
                )}
            </div>
        </article>
    );
}

/* ============================================================
   RECENT INCIDENTS
============================================================ */

function RecentIncidents({
    items = [],
}) {
    return (
        <article className="dm-card">
            <SectionHeader
                icon="report_problem"
                title="Recent Incidents"
                subtitle="Latest disciplinary reports"
                action="View all"
                to="/discipline/incidents"
                badge={
                    items.length
                        ? `${items.length} recent`
                        : null
                }
            />

            <div className="dm-list">
                {items.length === 0 ? (
                    <EmptyState
                        icon="verified_user"
                        title="No recent incidents"
                        text="There are no recent disciplinary incidents."
                    />
                ) : (
                    items
                        .slice(0, 6)
                        .map(
                            (
                                item,
                                index
                            ) => {
                                const severity =
                                    getSeverity(
                                        item.severity
                                    );

                                return (
                                    <div
                                        className="dm-list-item"
                                        key={
                                            item.id ||
                                            index
                                        }
                                    >
                                        <div className="dm-avatar">
                                            {item.photo ? (
                                                <img
                                                    src={
                                                        item.photo
                                                    }
                                                    alt={
                                                        item.student ||
                                                        "Student"
                                                    }
                                                />
                                            ) : (
                                                initials(
                                                    item.student ||
                                                        "Student"
                                                )
                                            )}
                                        </div>

                                        <div className="dm-list-content">
                                            <strong>
                                                {item.student ||
                                                    "Student"}
                                            </strong>

                                            <span>
                                                {item.title ||
                                                    item.type ||
                                                    "Disciplinary incident"}
                                            </span>

                                            <small>
                                                {item.class ||
                                                    "Class not specified"}

                                                {item.date
                                                    ? ` · ${item.date}`
                                                    : ""}
                                            </small>
                                        </div>

                                        <span
                                            className={`dm-severity ${severity.className}`}
                                        >
                                            <Icon size={13}>
                                                {
                                                    severity.icon
                                                }
                                            </Icon>

                                            {
                                                severity.label
                                            }
                                        </span>
                                    </div>
                                );
                            }
                        )
                )}
            </div>
        </article>
    );
}

/* ============================================================
   PENDING CASES
============================================================ */

function PendingCases({
    items = [],
}) {
    return (
        <article className="dm-card">
            <SectionHeader
                icon="pending_actions"
                title="Pending Cases"
                subtitle="Cases requiring follow-up"
                action="Review cases"
                to="/discipline/cases"
            />

            <div className="dm-list">
                {items.length === 0 ? (
                    <EmptyState
                        icon="task_alt"
                        title="No pending cases"
                        text="All disciplinary cases are currently up to date."
                    />
                ) : (
                    items
                        .slice(0, 5)
                        .map(
                            (
                                item,
                                index
                            ) => (
                                <Link
                                    to={
                                        item.id
                                            ? `/discipline/cases/${item.id}`
                                            : "/discipline/cases"
                                    }
                                    className="dm-case-item"
                                    key={
                                        item.id ||
                                        index
                                    }
                                >
                                    <div className="dm-case-number">
                                        <Icon>
                                            gavel
                                        </Icon>
                                    </div>

                                    <div className="dm-list-content">
                                        <strong>
                                            {item.title ||
                                                item.case_number ||
                                                "Disciplinary case"}
                                        </strong>

                                        <span>
                                            {item.student ||
                                                "Student"}

                                            {item.class
                                                ? ` · ${item.class}`
                                                : ""}
                                        </span>

                                        <small>
                                            {item.status ||
                                                "Pending review"}
                                        </small>
                                    </div>

                                    <span
                                        className={`dm-status ${getStatusClass(
                                            item.status
                                        )}`}
                                    >
                                        {item.status ||
                                            "Pending"}
                                    </span>

                                    <Icon size={17}>
                                        chevron_right
                                    </Icon>
                                </Link>
                            )
                        )
                )}
            </div>
        </article>
    );
}

/* ============================================================
   UPCOMING HEARINGS
============================================================ */

function UpcomingHearings({
    items = [],
}) {
    return (
        <article className="dm-card">
            <SectionHeader
                icon="gavel"
                title="Upcoming Hearings"
                subtitle="Scheduled disciplinary hearings"
                action="View hearings"
                to="/discipline/hearings"
            />

            <div className="dm-list">
                {items.length === 0 ? (
                    <EmptyState
                        icon="event_available"
                        title="No upcoming hearings"
                        text="Scheduled disciplinary hearings will appear here."
                    />
                ) : (
                    items
                        .slice(0, 5)
                        .map(
                            (
                                item,
                                index
                            ) => (
                                <div
                                    className="dm-hearing-item"
                                    key={
                                        item.id ||
                                        index
                                    }
                                >
                                    <div className="dm-hearing-date">
                                        <strong>
                                            {item.day ||
                                                "—"}
                                        </strong>

                                        <span>
                                            {item.month ||
                                                "DATE"}
                                        </span>
                                    </div>

                                    <div className="dm-list-content">
                                        <strong>
                                            {item.title ||
                                                "Disciplinary hearing"}
                                        </strong>

                                        <span>
                                            {item.student ||
                                                "Student"}

                                            {item.time
                                                ? ` · ${item.time}`
                                                : ""}
                                        </span>

                                        <small>
                                            {item.location ||
                                                "Discipline office"}
                                        </small>
                                    </div>

                                    <Icon size={17}>
                                        chevron_right
                                    </Icon>
                                </div>
                            )
                        )
                )}
            </div>
        </article>
    );
}

/* ============================================================
   STUDENTS REQUIRING ATTENTION
============================================================ */

function StudentsAttention({
    items = [],
}) {
    return (
        <article className="dm-card">
            <SectionHeader
                icon="person_alert"
                title="Students Requiring Attention"
                subtitle="Priority student monitoring"
                action="View students"
                to="/students"
            />

            <div className="dm-list">
                {items.length === 0 ? (
                    <EmptyState
                        icon="sentiment_satisfied"
                        title="No students flagged"
                        text="No students currently require special attention."
                    />
                ) : (
                    items
                        .slice(0, 6)
                        .map(
                            (
                                item,
                                index
                            ) => (
                                <div
                                    className="dm-list-item"
                                    key={
                                        item.id ||
                                        index
                                    }
                                >
                                    <div className="dm-avatar dm-avatar-warning">
                                        {item.photo ? (
                                            <img
                                                src={
                                                    item.photo
                                                }
                                                alt={
                                                    item.student ||
                                                    "Student"
                                                }
                                            />
                                        ) : (
                                            initials(
                                                item.student ||
                                                    "Student"
                                            )
                                        )}
                                    </div>

                                    <div className="dm-list-content">
                                        <strong>
                                            {item.student ||
                                                "Student"}
                                        </strong>

                                        <span>
                                            {item.reason ||
                                                "Requires monitoring"}
                                        </span>

                                        <small>
                                            {item.class ||
                                                "Class not specified"}
                                        </small>
                                    </div>

                                    <span className="dm-attention-badge">
                                        {item.count ??
                                            item.incidents ??
                                            "Review"}
                                    </span>
                                </div>
                            )
                        )
                )}
            </div>
        </article>
    );
}

/* ============================================================
   REPEAT OFFENDERS
============================================================ */

function RepeatOffenders({
    items = [],
}) {
    return (
        <article className="dm-card">
            <SectionHeader
                icon="history"
                title="Repeat Offenders"
                subtitle="Recurring disciplinary patterns"
                action="View all"
                to="/discipline/repeat-offenders"
            />

            <div className="dm-list">
                {items.length === 0 ? (
                    <EmptyState
                        icon="verified"
                        title="No repeat offenders"
                        text="No recurring discipline patterns are currently flagged."
                    />
                ) : (
                    items
                        .slice(0, 5)
                        .map(
                            (
                                item,
                                index
                            ) => (
                                <div
                                    className="dm-list-item"
                                    key={
                                        item.id ||
                                        index
                                    }
                                >
                                    <div className="dm-avatar dm-avatar-orange">
                                        {item.photo ? (
                                            <img
                                                src={
                                                    item.photo
                                                }
                                                alt={
                                                    item.student ||
                                                    "Student"
                                                }
                                            />
                                        ) : (
                                            initials(
                                                item.student ||
                                                    "Student"
                                            )
                                        )}
                                    </div>

                                    <div className="dm-list-content">
                                        <strong>
                                            {item.student ||
                                                "Student"}
                                        </strong>

                                        <span>
                                            {item.reason ||
                                                "Recurring disciplinary incidents"}
                                        </span>

                                        <small>
                                            {item.class ||
                                                "Class not specified"}
                                        </small>
                                    </div>

                                    <span className="dm-repeat-count">
                                        {item.count ??
                                            item.incidents ??
                                            0}{" "}
                                        incidents
                                    </span>
                                </div>
                            )
                        )
                )}
            </div>
        </article>
    );
}

/* ============================================================
   COMMUNICATION
============================================================ */

function CommunicationPanel({
    notifications = [],
    messages = [],
}) {
    return (
        <article className="dm-card">
            <SectionHeader
                icon="forum"
                title="Communication"
                subtitle="Parent and school communication"
                action="Open messages"
                to="/discipline/messages"
            />

            <div className="dm-card-body">
                <div className="row g-3 mb-3">
                    <div className="col-sm-6">
                        <Link
                            to="/discipline/parents"
                            className="dm-communication-box dm-communication-red"
                        >
                            <div className="dm-communication-icon">
                                <Icon>
                                    family_restroom
                                </Icon>
                            </div>

                            <div>
                                <strong>
                                    Parent Contact
                                </strong>

                                <span>
                                    {
                                        notifications.length
                                    }{" "}
                                    notifications
                                </span>
                            </div>
                        </Link>
                    </div>

                    <div className="col-sm-6">
                        <Link
                            to="/discipline/messages"
                            className="dm-communication-box dm-communication-blue"
                        >
                            <div className="dm-communication-icon">
                                <Icon>
                                    chat
                                </Icon>
                            </div>

                            <div>
                                <strong>
                                    Messages
                                </strong>

                                <span>
                                    {
                                        messages.length
                                    }{" "}
                                    recent messages
                                </span>
                            </div>
                        </Link>
                    </div>
                </div>

                {notifications.length ===
                0 ? (
                    <EmptyState
                        icon="notifications_none"
                        title="No parent notifications"
                        text="Parent communication updates will appear here."
                    />
                ) : (
                    <div className="dm-notification-list">
                        {notifications
                            .slice(0, 4)
                            .map(
                                (
                                    item,
                                    index
                                ) => (
                                    <div
                                        className="dm-notification"
                                        key={
                                            item.id ||
                                            index
                                        }
                                    >
                                        <div className="dm-notification-icon">
                                            <Icon size={17}>
                                                notifications
                                            </Icon>
                                        </div>

                                        <div>
                                            <strong>
                                                {item.title ||
                                                    "Parent notification"}
                                            </strong>

                                            <span>
                                                {item.text ||
                                                    item.body ||
                                                    "Notification"}
                                            </span>
                                        </div>
                                    </div>
                                )
                            )}
                    </div>
                )}
            </div>
        </article>
    );
}

/* ============================================================
   QUICK ACTIONS
============================================================ */

function QuickActions() {
    const actions = [
        {
            to: "/discipline/incidents/new",
            icon: "add_circle",
            title: "Record Incident",
            description:
                "Create disciplinary record",
            color: "red",
        },
        {
            to: "/attendance/take",
            icon: "how_to_reg",
            title: "Take Attendance",
            description:
                "Record student attendance",
            color: "blue",
        },
        {
            to: "/discipline/cases",
            icon: "gavel",
            title: "Review Cases",
            description:
                "Manage disciplinary cases",
            color: "purple",
        },
        {
            to: "/discipline/warnings",
            icon: "warning",
            title: "Issue Warning",
            description:
                "Record student warning",
            color: "orange",
        },
        {
            to: "/discipline/parents",
            icon: "family_restroom",
            title: "Contact Parent",
            description:
                "Communicate with parents",
            color: "green",
        },
        {
            to: "/discipline/reports",
            icon: "assessment",
            title: "Generate Report",
            description:
                "Create discipline reports",
            color: "cyan",
        },
    ];

    return (
        <article className="dm-card">
            <SectionHeader
                icon="bolt"
                title="Quick Actions"
                subtitle="Common discipline operations"
            />

            <div className="dm-card-body">
                <div className="row g-3">
                    {actions.map(
                        (action) => (
                            <div
                                className="col-sm-6 col-lg-4"
                                key={
                                    action.title
                                }
                            >
                                <Link
                                    to={
                                        action.to
                                    }
                                    className={`dm-action dm-action-${action.color}`}
                                >
                                    <div className="dm-action-icon">
                                        <Icon>
                                            {
                                                action.icon
                                            }
                                        </Icon>
                                    </div>

                                    <div className="dm-action-copy">
                                        <strong>
                                            {
                                                action.title
                                            }
                                        </strong>

                                        <span>
                                            {
                                                action.description
                                            }
                                        </span>
                                    </div>

                                    <Icon size={17}>
                                        arrow_forward
                                    </Icon>
                                </Link>
                            </div>
                        )
                    )}
                </div>
            </div>
        </article>
    );
}

/* ============================================================
   ACTIVITY
============================================================ */

function ActivityTimeline({
    items = [],
}) {
    return (
        <article className="dm-card">
            <SectionHeader
                icon="history"
                title="Recent Activity"
                subtitle="Latest discipline administration activity"
                action="Audit log"
                to="/audit-logs"
            />

            <div className="dm-card-body">
                {items.length === 0 ? (
                    <EmptyState
                        icon="history"
                        title="No recent activity"
                        text="Recent administrative activity will appear here."
                    />
                ) : (
                    <div className="dm-timeline">
                        {items
                            .slice(0, 7)
                            .map(
                                (
                                    item,
                                    index
                                ) => (
                                    <div
                                        className="dm-timeline-item"
                                        key={
                                            item.id ||
                                            index
                                        }
                                    >
                                        <div className="dm-timeline-icon">
                                            <Icon size={17}>
                                                {item.icon ||
                                                    "bolt"}
                                            </Icon>
                                        </div>

                                        <div className="dm-timeline-content">
                                            <strong>
                                                {item.subject ||
                                                    "System activity"}
                                            </strong>

                                            <span>
                                                {item.action ||
                                                    "Administrative activity"}
                                            </span>

                                            <small>
                                                {item.when ||
                                                    "Recently"}

                                                {item.causer
                                                    ? ` · By ${item.causer}`
                                                    : ""}
                                            </small>
                                        </div>
                                    </div>
                                )
                            )}
                    </div>
                )}
            </div>
        </article>
    );
}

/* ============================================================
   LOADING
============================================================ */

function DashboardSkeleton() {
    return (
        <main className="dm-dashboard">
            <div className="dm-skeleton dm-skeleton-hero" />

            <div className="row g-3 mb-4">
                {Array.from({
                    length: 8,
                }).map((_, index) => (
                    <div
                        className="col-6 col-xl-3"
                        key={index}
                    >
                        <div className="dm-skeleton dm-skeleton-kpi" />
                    </div>
                ))}
            </div>

            <div className="row g-4">
                {Array.from({
                    length: 6,
                }).map((_, index) => (
                    <div
                        className="col-lg-6"
                        key={index}
                    >
                        <div className="dm-skeleton dm-skeleton-card" />
                    </div>
                ))}
            </div>
        </main>
    );
}

/* ============================================================
   ERROR
============================================================ */

function DashboardError({
    onRetry,
}) {
    return (
        <main className="dm-dashboard">
            <div className="dm-error">
                <div className="dm-error-icon">
                    <Icon size={34}>
                        cloud_off
                    </Icon>
                </div>

                <span>
                    CONNECTION ERROR
                </span>

                <h2>
                    Dashboard unavailable
                </h2>

                <p>
                    We couldn't load the
                    Discipline Master dashboard.
                    Check your connection and
                    try again.
                </p>

                <button
                    type="button"
                    className="btn dm-primary-btn"
                    onClick={onRetry}
                >
                    <Icon size={18}>
                        refresh
                    </Icon>

                    Try Again
                </button>
            </div>
        </main>
    );
}

/* ============================================================
   MAIN DASHBOARD
============================================================ */

export default function DisciplineMasterDashboard() {
    const {
        data,
        isLoading,
        isError,
        refetch,
        isFetching,
    } = useDisciplineMasterDashboard();

    const [period, setPeriod] =
        useState("today");

    const dashboard = data || {};

    const stats =
        dashboard.stats || {};

    const attendance =
        dashboard.attendance || {};

    const disciplineOverview =
        dashboard.discipline_overview ||
        {};

    const incidentsTrend =
        normalizeArray(
            dashboard.incidents_trend
        );

    const incidentCategories =
        normalizeArray(
            dashboard.incident_categories
        );

    const recentIncidents =
        normalizeArray(
            dashboard.recent_incidents
        );

    const pendingCases =
        normalizeArray(
            dashboard.pending_cases
        );

    const upcomingHearings =
        normalizeArray(
            dashboard.upcoming_hearings
        );

    const studentsAttention =
        normalizeArray(
            dashboard.students_requiring_attention
        );

    const repeatOffenders =
        normalizeArray(
            dashboard.repeat_offenders
        );

    const parentNotifications =
        normalizeArray(
            dashboard.parent_notifications
        );

    const messages =
        normalizeArray(
            dashboard.messages
        );

    const recentActivities =
        normalizeArray(
            dashboard.recent_activities
        );

    const periodLabel = useMemo(() => {
        const labels = {
            today: "today",
            week: "this week",
            month: "this month",
            term: "this term",
        };

        return labels[period] || "today";
    }, [period]);

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    if (isError) {
        return (
            <DashboardError
                onRetry={() => refetch()}
            />
        );
    }

    return (
        <main className="dm-dashboard">
            {/* ==================================================
                HERO
            ================================================== */}

            <DashboardHero
                period={period}
                setPeriod={setPeriod}
                onRefresh={() => refetch()}
                isFetching={isFetching}
            />

            {/* ==================================================
                KPI CARDS
            ================================================== */}

            <section className="row g-3 mb-4">
                <div className="col-6 col-xl-3">
                    <KpiCard
                        icon="groups"
                        title="Total Students"
                        value={formatNumber(
                            stats.total_students
                        )}
                        subtitle={`${formatNumber(
                            stats.active_students
                        )} active students`}
                        trend={
                            stats.student_change ??
                            null
                        }
                        trendType="up"
                        variant="red"
                    />
                </div>

                <div className="col-6 col-xl-3">
                    <KpiCard
                        icon="fact_check"
                        title="Attendance Today"
                        value={formatPercent(
                            attendance.rate
                        )}
                        subtitle={`${formatNumber(
                            attendance.absent
                        )} absent today`}
                        trend={
                            attendance.change ??
                            null
                        }
                        trendType={
                            Number(
                                attendance.change
                            ) >= 0
                                ? "up"
                                : "down"
                        }
                        variant="green"
                    />
                </div>

                <div className="col-6 col-xl-3">
                    <KpiCard
                        icon="person_off"
                        title="Absent Today"
                        value={formatNumber(
                            attendance.absent
                        )}
                        subtitle="Students absent"
                        trend={
                            attendance.absent_change ??
                            null
                        }
                        trendType="down"
                        variant="orange"
                    />
                </div>

                <div className="col-6 col-xl-3">
                    <KpiCard
                        icon="schedule"
                        title="Late Arrivals"
                        value={formatNumber(
                            attendance.late
                        )}
                        subtitle="Late students today"
                        trend={
                            attendance.late_change ??
                            null
                        }
                        trendType="down"
                        variant="amber"
                    />
                </div>

                <div className="col-6 col-xl-3">
                    <KpiCard
                        icon="gavel"
                        title="Open Cases"
                        value={formatNumber(
                            stats.open_cases ??
                                disciplineOverview.open_cases
                        )}
                        subtitle="Cases requiring action"
                        trend={
                            stats.case_change ??
                            null
                        }
                        trendType="down"
                        variant="purple"
                    />
                </div>

                <div className="col-6 col-xl-3">
                    <KpiCard
                        icon="manage_search"
                        title="Investigations"
                        value={formatNumber(
                            stats.pending_investigations ??
                                disciplineOverview.pending_investigations
                        )}
                        subtitle="Pending investigations"
                        trend={
                            stats.investigation_change ??
                            null
                        }
                        trendType="down"
                        variant="blue"
                    />
                </div>

                <div className="col-6 col-xl-3">
                    <KpiCard
                        icon="block"
                        title="Suspensions"
                        value={formatNumber(
                            stats.active_suspensions ??
                                disciplineOverview.active_suspensions
                        )}
                        subtitle="Currently active"
                        trend={
                            stats.suspension_change ??
                            null
                        }
                        trendType="down"
                        variant="redDark"
                    />
                </div>

                <div className="col-6 col-xl-3">
                    <KpiCard
                        icon="history"
                        title="Repeat Offenders"
                        value={formatNumber(
                            stats.repeat_offenders ??
                                disciplineOverview.repeat_offenders
                        )}
                        subtitle="Students with recurring cases"
                        trend={
                            stats.repeat_change ??
                            null
                        }
                        trendType="down"
                        variant="slate"
                    />
                </div>
            </section>

            {/* ==================================================
                ATTENDANCE + DISCIPLINE
            ================================================== */}

            <section className="row g-4 mb-4">
                <div className="col-xl-7">
                    <AttendanceOverview
                        attendance={
                            attendance
                        }
                    />
                </div>

                <div className="col-xl-5">
                    <DisciplineOverview
                        data={
                            disciplineOverview
                        }
                    />
                </div>
            </section>

            {/* ==================================================
                ANALYTICS
            ================================================== */}

            <section className="row g-4 mb-4">
                <div className="col-xl-7">
                    <IncidentTrend
                        data={
                            incidentsTrend
                        }
                    />
                </div>

                <div className="col-xl-5">
                    <IncidentCategories
                        data={
                            incidentCategories
                        }
                    />
                </div>
            </section>

            {/* ==================================================
                CASE MANAGEMENT
            ================================================== */}

            <section className="row g-4 mb-4">
                <div className="col-xl-6">
                    <RecentIncidents
                        items={
                            recentIncidents
                        }
                    />
                </div>

                <div className="col-xl-6">
                    <PendingCases
                        items={
                            pendingCases
                        }
                    />
                </div>
            </section>

            {/* ==================================================
                HEARINGS + STUDENTS
            ================================================== */}

            <section className="row g-4 mb-4">
                <div className="col-xl-6">
                    <UpcomingHearings
                        items={
                            upcomingHearings
                        }
                    />
                </div>

                <div className="col-xl-6">
                    <StudentsAttention
                        items={
                            studentsAttention
                        }
                    />
                </div>
            </section>

            {/* ==================================================
                REPEAT OFFENDERS
            ================================================== */}

            <section className="row g-4 mb-4">
                <div className="col-xl-6">
                    <RepeatOffenders
                        items={
                            repeatOffenders
                        }
                    />
                </div>

                <div className="col-xl-6">
                    <CommunicationPanel
                        notifications={
                            parentNotifications
                        }
                        messages={
                            messages
                        }
                    />
                </div>
            </section>

            {/* ==================================================
                QUICK ACTIONS
            ================================================== */}

            <section className="mb-4">
                <QuickActions />
            </section>

            {/* ==================================================
                ACTIVITY
            ================================================== */}

            <section className="mb-5">
                <ActivityTimeline
                    items={
                        recentActivities
                    }
                />
            </section>
        </main>
    );
}