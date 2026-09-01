// src/pages/portals/VicePrincipalDashboard.jsx
// ============================================================
// CCAST SCHOOL MANAGEMENT SYSTEM
// Vice Principal Executive Dashboard
// ============================================================

import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useVicePrincipalDashboard } from "../../api/dashboard";
import { initials } from "../../components/ui";
import "/src/pages/portals/VicePrincipalDashboardCss.css";

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

const getStatusClass = (status) => {
    const normalized = String(
        status || "scheduled"
    ).toLowerCase();

    if (normalized === "ongoing") {
        return "vp-status-ongoing";
    }

    if (normalized === "completed") {
        return "vp-status-completed";
    }

    if (normalized === "cancelled") {
        return "vp-status-cancelled";
    }

    return "vp-status-scheduled";
};

const getSeverityClass = (severity) => {
    const normalized = String(
        severity || "minor"
    ).toLowerCase();

    if (
        ["critical", "high", "major"].includes(
            normalized
        )
    ) {
        return "vp-severity-high";
    }

    if (
        ["medium", "moderate"].includes(
            normalized
        )
    ) {
        return "vp-severity-medium";
    }

    return "vp-severity-low";
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
            className={`material-symbols-outlined ${filled ? "vp-icon-filled" : ""
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
   SKELETON
============================================================ */

function DashboardSkeleton() {
    return (
        <main className="vp-dashboard vp-loading">
            <div className="vp-skeleton-hero">
                <div>
                    <div className="vp-skeleton vp-sk-sm" />
                    <div className="vp-skeleton vp-sk-xl" />
                    <div className="vp-skeleton vp-sk-md" />
                </div>

                <div className="vp-skeleton vp-sk-button" />
            </div>

            <div className="vp-kpi-grid">
                {Array.from({
                    length: 4,
                }).map((_, index) => (
                    <div
                        className="vp-skeleton-card"
                        key={index}
                    >
                        <div className="vp-skeleton vp-sk-icon" />
                        <div className="vp-skeleton vp-sk-sm" />
                        <div className="vp-skeleton vp-sk-value" />
                        <div className="vp-skeleton vp-sk-md" />
                    </div>
                ))}
            </div>

            <div className="vp-two-column">
                <div className="vp-skeleton-panel" />
                <div className="vp-skeleton-panel" />
            </div>

            <div className="vp-skeleton-panel vp-skeleton-wide" />

            <div className="vp-two-column">
                <div className="vp-skeleton-panel" />
                <div className="vp-skeleton-panel" />
            </div>
        </main>
    );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
    icon,
    title,
    value,
    subtitle,
    trend,
    trendType = "neutral",
    variant = "blue",
}) {
    const trendIcon =
        trendType === "up"
            ? "trending_up"
            : trendType === "down"
                ? "trending_down"
                : "remove";

    return (
        <article
            className={`vp-stat vp-stat-${variant}`}
        >
            <div className="vp-stat-top">
                <div className="vp-stat-icon">
                    <Icon>{icon}</Icon>
                </div>

                {trend !== null &&
                    trend !== undefined &&
                    trend !== "" && (
                        <span
                            className={`vp-trend vp-trend-${trendType}`}
                        >
                            <Icon size={14}>
                                {trendIcon}
                            </Icon>

                            {trend}
                        </span>
                    )}
            </div>

            <div className="vp-stat-title">
                {title}
            </div>

            <div className="vp-stat-value">
                {value}
            </div>

            <div className="vp-stat-subtitle">
                {subtitle}
            </div>
        </article>
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
    to,
    badge,
}) {
    return (
        <div className="vp-section-header">
            <div className="vp-section-heading">
                <div className="vp-section-icon">
                    <Icon>{icon}</Icon>
                </div>

                <div>
                    <div className="vp-section-title-line">
                        <h2>{title}</h2>

                        {badge && (
                            <span className="vp-badge">
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
                    to={to || "#"}
                    className="vp-section-link"
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
   ATTENDANCE
============================================================ */

function AttendanceOverview({
    attendance,
}) {
    const rate = clamp(
        attendance?.rate || 0
    );

    const present = Number(
        attendance?.present || 0
    );

    const absent = Number(
        attendance?.absent || 0
    );

    const late = Number(
        attendance?.late || 0
    );

    const target = 90;

    const circumference = 2 * Math.PI * 55;

    const offset =
        circumference -
        (rate / 100) *
        circumference;

    const targetReached =
        rate >= target;

    return (
        <article className="vp-card vp-attendance">
            <SectionHeader
                icon="fact_check"
                title="Attendance Overview"
                subtitle="Today's student attendance"
                action="View attendance"
                to="/attendance"
            />

            <div className="vp-card-body">
                <div className="vp-attendance-main">
                    <div className="vp-attendance-ring">
                        <svg
                            viewBox="0 0 140 140"
                            role="img"
                            aria-label={`Attendance ${formatPercent(
                                rate
                            )}`}
                        >
                            <circle
                                cx="70"
                                cy="70"
                                r="55"
                                className="vp-ring-bg"
                            />

                            <circle
                                cx="70"
                                cy="70"
                                r="55"
                                className="vp-ring-progress"
                                strokeDasharray={
                                    circumference
                                }
                                strokeDashoffset={
                                    offset
                                }
                            />
                        </svg>

                        <div className="vp-ring-center">
                            <strong>
                                {formatPercent(
                                    rate
                                )}
                            </strong>

                            <span>Present</span>
                        </div>
                    </div>

                    <div className="vp-attendance-details">
                        <div className="vp-attendance-status">
                            <span
                                className={
                                    targetReached
                                        ? "vp-good"
                                        : "vp-warning"
                                }
                            >
                                <Icon size={16}>
                                    {targetReached
                                        ? "check_circle"
                                        : "warning"}
                                </Icon>

                                {targetReached
                                    ? "Target achieved"
                                    : "Below target"}
                            </span>

                            <small>
                                Target {target}%
                            </small>
                        </div>

                        <AttendanceRow
                            label="Present"
                            value={present}
                            dot="green"
                        />

                        <AttendanceRow
                            label="Absent"
                            value={absent}
                            dot="red"
                        />

                        <AttendanceRow
                            label="Late"
                            value={late}
                            dot="orange"
                        />
                    </div>
                </div>

                <div className="vp-attendance-progress">
                    <div className="vp-progress-heading">
                        <span>
                            Attendance target
                        </span>

                        <strong>
                            {target}%
                        </strong>
                    </div>

                    <div className="vp-progress-track">
                        <span
                            style={{
                                width: `${rate}%`,
                            }}
                        />

                        <i
                            style={{
                                left: `${target}%`,
                            }}
                        />
                    </div>

                    <small>
                        {targetReached
                            ? "The school is currently meeting its attendance target."
                            : `${(
                                target - rate
                            ).toFixed(
                                1
                            )}% more attendance is needed to reach target.`}
                    </small>
                </div>
            </div>
        </article>
    );
}

function AttendanceRow({
    label,
    value,
    dot,
}) {
    return (
        <div className="vp-attendance-row">
            <span>
                <i
                    className={`vp-dot vp-dot-${dot}`}
                />

                {label}
            </span>

            <strong>
                {formatNumber(value)}
            </strong>
        </div>
    );
}

/* ============================================================
   ATTENTION
============================================================ */

function AttentionPanel({
    data,
}) {
    const items = [
        {
            icon: "person_off",
            title: "Students absent",
            value:
                data?.absent_students || 0,
            text: "students absent today",
            color: "red",
            to: "/attendance",
        },
        {
            icon: "gpp_maybe",
            title: "Discipline cases",
            value:
                data?.discipline_cases || 0,
            text: "open cases",
            color: "orange",
            to: "/discipline",
        },
        {
            icon: "pending_actions",
            title: "Pending approvals",
            value:
                data?.pending_approvals || 0,
            text: "items awaiting review",
            color: "purple",
            to: "/approvals",
        },
        {
            icon: "assignment_late",
            title: "Teacher issues",
            value:
                data?.teacher_issues || 0,
            text: "require attention",
            color: "blue",
            to: "/staff",
        },
    ];

    return (
        <article className="vp-card vp-attention-card">
            <SectionHeader
                icon="priority_high"
                title="Requires Attention"
                subtitle="Priority items for your office"
            />

            <div className="vp-attention-list">
                {items.map((item) => (
                    <Link
                        key={item.title}
                        to={item.to}
                        className={`vp-attention-item vp-attention-${item.color}`}
                    >
                        <div className="vp-attention-icon">
                            <Icon>
                                {item.icon}
                            </Icon>
                        </div>

                        <div className="vp-attention-copy">
                            <strong>
                                {item.title}
                            </strong>

                            <span>
                                {formatNumber(
                                    item.value
                                )}{" "}
                                {item.text}
                            </span>
                        </div>

                        <Icon size={18}>
                            arrow_forward
                        </Icon>
                    </Link>
                ))}
            </div>
        </article>
    );
}

/* ============================================================
   TEACHING SCHEDULE
============================================================ */

function TeachingSchedule({
    items = [],
}) {
    return (
        <article className="vp-card">
            <SectionHeader
                icon="co_present"
                title="Teaching & Supervision"
                subtitle="Today's teaching activity"
                action="Full timetable"
                to="/classes"
                badge={`${items.length} sessions`}
            />

            <div className="vp-table-wrap">
                {items.length === 0 ? (
                    <EmptyState
                        icon="event_busy"
                        title="No teaching sessions"
                        text="There are no teaching sessions scheduled for today."
                    />
                ) : (
                    <div className="table-responsive">
                        <table className="table vp-table mb-0 align-middle">
                            <thead>
                                <tr>
                                    <th>Teacher</th>
                                    <th>Subject</th>
                                    <th>Class</th>
                                    <th>Period</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {items.map(
                                    (
                                        item,
                                        index
                                    ) => {
                                        const status =
                                            item.status ||
                                            "Scheduled";

                                        return (
                                            <tr
                                                key={
                                                    item.id ||
                                                    index
                                                }
                                            >
                                                <td>
                                                    <div className="vp-teacher">
                                                        <div className="vp-avatar">
                                                            {item.photo ? (
                                                                <img
                                                                    src={
                                                                        item.photo
                                                                    }
                                                                    alt={
                                                                        item.teacher ||
                                                                        "Teacher"
                                                                    }
                                                                />
                                                            ) : (
                                                                initials(
                                                                    item.teacher ||
                                                                    "Teacher"
                                                                )
                                                            )}
                                                        </div>

                                                        <div className="vp-teacher-copy">
                                                            <strong>
                                                                {item.teacher ||
                                                                    "Unknown Teacher"}
                                                            </strong>

                                                            <span>
                                                                {item.role ||
                                                                    "Teacher"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    <strong className="vp-subject">
                                                        {item.subject ||
                                                            "—"}
                                                    </strong>
                                                </td>

                                                <td>
                                                    <span className="vp-class">
                                                        {item.class ||
                                                            "—"}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="vp-row-period">
                                                        <Icon size={15}>schedule</Icon>
                                                        {item.period ? `Period ${item.period}` : "—"}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span
                                                        className={`vp-status ${getStatusClass(
                                                            status
                                                        )}`}
                                                    >
                                                        <i />

                                                        {
                                                            status
                                                        }
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    }
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </article>
    );
}

/* ============================================================
   ACADEMIC PERFORMANCE
============================================================ */

function AcademicPerformance({
    data = [],
}) {
    const max = Math.max(
        100,
        ...data.map((item) =>
            Number(
                item.average || 0
            )
        )
    );

    return (
        <article className="vp-card">
            <SectionHeader
                icon="school"
                title="Academic Performance"
                subtitle="Average performance by level"
                action="View results"
                to="/exams"
            />

            <div className="vp-card-body">
                {data.length === 0 ? (
                    <EmptyState
                        icon="analytics"
                        title="No performance data"
                        text="Academic performance will appear here when results are available."
                    />
                ) : (
                    <div className="vp-performance-list">
                        {data.map(
                            (
                                item,
                                index
                            ) => {
                                const average =
                                    clamp(
                                        item.average ||
                                        0
                                    );

                                return (
                                    <div
                                        className="vp-performance-item"
                                        key={
                                            item.id ||
                                            index
                                        }
                                    >
                                        <div className="vp-performance-top">
                                            <div>
                                                <span className="vp-performance-number">
                                                    {String(
                                                        index +
                                                        1
                                                    ).padStart(
                                                        2,
                                                        "0"
                                                    )}
                                                </span>

                                                <strong>
                                                    {item.name ||
                                                        "Academic level"}
                                                </strong>
                                            </div>

                                            <strong>
                                                {average.toFixed(
                                                    1
                                                )}
                                                %
                                            </strong>
                                        </div>

                                        <div className="vp-performance-track">
                                            <span
                                                style={{
                                                    width: `${(average /
                                                        max) *
                                                        100
                                                        }%`,
                                                }}
                                            />
                                        </div>

                                        <div className="vp-performance-meta">
                                            <span>
                                                {item.students
                                                    ? `${formatNumber(
                                                        item.students
                                                    )} students`
                                                    : "Current academic period"}
                                            </span>

                                            <span>
                                                {average >=
                                                    70
                                                    ? "Strong"
                                                    : average >=
                                                        50
                                                        ? "Average"
                                                        : "Needs attention"}
                                            </span>
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>
                )}
            </div>
        </article>
    );
}

/* ============================================================
   DISCIPLINE
============================================================ */

function DisciplinePanel({
    items = [],
}) {
    return (
        <article className="vp-card">
            <SectionHeader
                icon="gpp_maybe"
                title="Discipline"
                subtitle="Recent student incidents"
                action="View all"
                to="/discipline"
            />

            <div className="vp-discipline-list">
                {items.length === 0 ? (
                    <EmptyState
                        icon="verified_user"
                        title="No active incidents"
                        text="Student discipline is currently clear."
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
                                    className="vp-discipline-item"
                                    key={
                                        item.id ||
                                        index
                                    }
                                >
                                    <div className="vp-discipline-icon">
                                        <Icon>
                                            report
                                        </Icon>
                                    </div>

                                    <div className="vp-discipline-copy">
                                        <strong>
                                            {item.student ||
                                                "Student"}
                                        </strong>

                                        <span>
                                            {item.title ||
                                                "Discipline incident"}
                                        </span>

                                        {item.date && (
                                            <small>
                                                {
                                                    item.date
                                                }
                                            </small>
                                        )}
                                    </div>

                                    <span
                                        className={`vp-severity ${getSeverityClass(
                                            item.severity
                                        )}`}
                                    >
                                        {item.severity ||
                                            "Minor"}
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
   QUICK ACTIONS
============================================================ */

function QuickActions() {
    const actions = [
        {
            icon: "fact_check",
            title: "Take Attendance",
            text: "Monitor today's attendance",
            to: "/attendance",
            color: "blue",
        },
        {
            icon: "co_present",
            title: "Teaching Schedule",
            text: "Review today's timetable",
            to: "/classes",
            color: "purple",
        },
        {
            icon: "gpp_maybe",
            title: "Discipline",
            text: "Review student incidents",
            to: "/discipline",
            color: "orange",
        },
        {
            icon: "quiz",
            title: "Examinations",
            text: "Manage assessments",
            to: "/exams",
            color: "green",
        },
        {
            icon: "campaign",
            title: "Send Notice",
            text: "Communicate with school",
            to: "/notices",
            color: "pink",
        },
        {
            icon: "groups",
            title: "Students",
            text: "Manage student records",
            to: "/students",
            color: "cyan",
        },
    ];

    return (
        <article className="vp-card">
            <SectionHeader
                icon="bolt"
                title="Quick Actions"
                subtitle="Common administrative tasks"
            />

            <div className="vp-actions-grid">
                {actions.map(
                    (action) => (
                        <Link
                            to={action.to}
                            key={
                                action.title
                            }
                            className={`vp-action vp-action-${action.color}`}
                        >
                            <div className="vp-action-icon">
                                <Icon>
                                    {
                                        action.icon
                                    }
                                </Icon>
                            </div>

                            <div className="vp-action-copy">
                                <strong>
                                    {
                                        action.title
                                    }
                                </strong>

                                <span>
                                    {
                                        action.text
                                    }
                                </span>
                            </div>

                            <Icon size={17}>
                                arrow_forward
                            </Icon>
                        </Link>
                    )
                )}
            </div>
        </article>
    );
}

/* ============================================================
   EXAMS
============================================================ */

function ExamsPanel({
    items = [],
}) {
    return (
        <article className="vp-card">
            <SectionHeader
                icon="quiz"
                title="Upcoming Exams"
                subtitle="Assessment schedule"
                action="Exam management"
                to="/exams"
            />

            <div className="vp-exam-list">
                {items.length === 0 ? (
                    <EmptyState
                        icon="event_available"
                        title="No upcoming exams"
                        text="Upcoming assessments will appear here."
                    />
                ) : (
                    items
                        .slice(0, 4)
                        .map(
                            (
                                exam,
                                index
                            ) => (
                                <Link
                                    key={
                                        exam.id ||
                                        index
                                    }
                                    to={`/exams/${exam.id ||
                                        ""
                                        }`}
                                    className="vp-exam-item"
                                >
                                    <div className="vp-exam-date">
                                        <strong>
                                            {exam.day ||
                                                "—"}
                                        </strong>

                                        <span>
                                            {exam.month ||
                                                ""}
                                        </span>
                                    </div>

                                    <div className="vp-exam-copy">
                                        <strong>
                                            {exam.title ||
                                                "Academic assessment"}
                                        </strong>

                                        <span>
                                            {exam.desc ||
                                                "Assessment schedule"}
                                        </span>
                                    </div>

                                    <Icon size={18}>
                                        arrow_forward
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
   ANNOUNCEMENTS
============================================================ */

function AnnouncementsPanel({
    items = [],
}) {
    return (
        <article className="vp-card">
            <SectionHeader
                icon="campaign"
                title="School Notices"
                subtitle="Recent announcements"
                action="Manage"
                to="/notices"
            />

            <div className="vp-announcement-list">
                {items.length === 0 ? (
                    <EmptyState
                        icon="notifications_off"
                        title="No announcements"
                        text="There are no recent school notices."
                    />
                ) : (
                    items
                        .slice(0, 4)
                        .map(
                            (
                                item,
                                index
                            ) => (
                                <div
                                    className="vp-announcement"
                                    key={
                                        item.id ||
                                        index
                                    }
                                >
                                    <span className="vp-announcement-dot" />

                                    <div>
                                        <div className="vp-announcement-top">
                                            <strong>
                                                {item.title ||
                                                    "School announcement"}
                                            </strong>

                                            <small>
                                                {item.when ||
                                                    "Recently"}
                                            </small>
                                        </div>

                                        <p>
                                            {item.body ||
                                                item.description ||
                                                ""}
                                        </p>
                                    </div>
                                </div>
                            )
                        )
                )}
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
        <article className="vp-card">
            <SectionHeader
                icon="history"
                title="Recent Activity"
                subtitle="Latest administrative activity"
                action="Audit log"
                to="/audit-logs"
            />

            <div className="vp-timeline">
                {items.length === 0 ? (
                    <EmptyState
                        icon="history"
                        title="No recent activity"
                        text="Administrative activity will appear here."
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
                                    className="vp-timeline-item"
                                    key={
                                        item.id ||
                                        index
                                    }
                                >
                                    <div className="vp-timeline-marker">
                                        <Icon size={15}>
                                            {item.icon ||
                                                "bolt"}
                                        </Icon>
                                    </div>

                                    <div className="vp-timeline-content">
                                        <strong>
                                            {item.subject ||
                                                "System activity"}
                                        </strong>

                                        <span>
                                            {item.action ||
                                                ""}
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
                        )
                )}
            </div>
        </article>
    );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({
    icon = "info",
    title,
    text,
}) {
    return (
        <div className="vp-empty">
            <div className="vp-empty-icon">
                <Icon size={22}>
                    {icon}
                </Icon>
            </div>

            <strong>{title}</strong>

            <span>{text}</span>
        </div>
    );
}

/* ============================================================
   MAIN DASHBOARD
============================================================ */

export default function VicePrincipalDashboard() {
    const {
        data,
        isLoading,
        isError,
        refetch,
        isFetching,
    } = useVicePrincipalDashboard();

    const [period, setPeriod] =
        useState("today");

    const dashboard = data || {};

    const stats =
        dashboard.stats || {};

    const attendance =
        dashboard.attendance || {};

    const attention =
        dashboard.attention || {};

    const teaching = Array.isArray(
        dashboard.teaching_today
    )
        ? dashboard.teaching_today
        : [];

    const discipline =
        Array.isArray(
            dashboard.discipline_incidents
        )
            ? dashboard.discipline_incidents
            : [];

    const exams =
        Array.isArray(
            dashboard.upcoming_exams
        )
            ? dashboard.upcoming_exams
            : [];

    const announcements =
        Array.isArray(
            dashboard.announcements
        )
            ? dashboard.announcements
            : [];

    const activity =
        Array.isArray(
            dashboard.recent_activity
        )
            ? dashboard.recent_activity
            : [];

    const performance =
        Array.isArray(
            dashboard.academic_performance
        )
            ? dashboard.academic_performance
            : [];

    const periodLabel =
        useMemo(() => {
            const labels = {
                today: "today",
                week: "this week",
                month: "this month",
                term: "this term",
            };

            return (
                labels[period] ||
                "today"
            );
        }, [period]);

    if (isLoading) {
        return (
            <DashboardSkeleton />
        );
    }

    if (isError) {
        return (
            <main className="vp-dashboard">
                <div className="vp-error">
                    <div className="vp-error-icon">
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
                        Vice Principal
                        dashboard. Check your
                        connection and try
                        again.
                    </p>

                    <button
                        type="button"
                        className="vp-primary-btn"
                        onClick={() =>
                            refetch()
                        }
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

    return (
        <main className="vp-dashboard">

            {/* ==================================================
                HEADER
            ================================================== */}

            <header className="vp-hero">
                <div className="vp-hero-content">
                    <div className="vp-eyebrow">
                        <span className="vp-live-dot" />

                        Vice Principal's Office
                    </div>

                    <h1>
                        {getGreeting()},
                        <br />

                        <span>
                            Vice Principal
                        </span>
                    </h1>

                    <p>
                        Here's what's happening
                        across the school{" "}
                        <strong>
                            {periodLabel}
                        </strong>
                        .
                    </p>
                </div>

                <div className="vp-hero-actions">
                    <div className="vp-period">
                        {[
                            [
                                "today",
                                "Today",
                            ],
                            [
                                "week",
                                "Week",
                            ],
                            [
                                "month",
                                "Month",
                            ],
                            [
                                "term",
                                "Term",
                            ],
                        ].map(
                            ([
                                value,
                                label,
                            ]) => (
                                <button
                                    type="button"
                                    key={
                                        value
                                    }
                                    className={
                                        period ===
                                            value
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        setPeriod(
                                            value
                                        )
                                    }
                                >
                                    {
                                        label
                                    }
                                </button>
                            )
                        )}
                    </div>

                    <div className="vp-date">
                        <Icon size={17}>
                            calendar_today
                        </Icon>

                        {todayLabel()}
                    </div>

                    <button
                        type="button"
                        className={`vp-refresh ${isFetching
                            ? "is-refreshing"
                            : ""
                            }`}
                        onClick={() =>
                            refetch()
                        }
                        disabled={
                            isFetching
                        }
                        aria-label="Refresh dashboard"
                    >
                        <Icon>
                            refresh
                        </Icon>
                    </button>
                </div>
            </header>

            {/* ==================================================
                KPI
            ================================================== */}

            <section className="vp-kpi-grid">

                <StatCard
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
                    variant="blue"
                />

                <StatCard
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

                <StatCard
                    icon="co_present"
                    title="Teachers Active"
                    value={formatNumber(
                        stats.teachers_active
                    )}
                    subtitle={`${formatNumber(
                        stats.teachers_total
                    )} total teaching staff`}
                    trend={
                        stats.teacher_change ??
                        null
                    }
                    trendType="up"
                    variant="purple"
                />

                <StatCard
                    icon="gpp_maybe"
                    title="Open Discipline"
                    value={formatNumber(
                        stats.open_discipline
                    )}
                    subtitle={`${formatNumber(
                        stats.new_discipline
                    )} new today`}
                    trend={
                        stats.discipline_change ??
                        null
                    }
                    trendType="down"
                    variant="orange"
                />
            </section>

            {/* ==================================================
                ATTENDANCE + ATTENTION
            ================================================== */}

            <section className="vp-two-column">
                <AttendanceOverview
                    attendance={
                        attendance
                    }
                />

                <AttentionPanel
                    data={attention}
                />
            </section>

            {/* ==================================================
                TEACHING
            ================================================== */}

            <section className="vp-section">
                <TeachingSchedule
                    items={teaching}
                />
            </section>

            {/* ==================================================
                ACADEMIC + DISCIPLINE
            ================================================== */}

            <section className="vp-two-column">
                <AcademicPerformance
                    data={performance}
                />

                <DisciplinePanel
                    items={discipline}
                />
            </section>

            {/* ==================================================
                QUICK ACTIONS
            ================================================== */}

            <section className="vp-section">
                <QuickActions />
            </section>

            {/* ==================================================
                EXAMS + ANNOUNCEMENTS
            ================================================== */}

            <section className="vp-two-column">
                <ExamsPanel
                    items={exams}
                />

                <AnnouncementsPanel
                    items={announcements}
                />
            </section>

            {/* ==================================================
                ACTIVITY
            ================================================== */}

            <section className="vp-section vp-last-section">
                <ActivityTimeline
                    items={activity}
                />
            </section>
        </main>
    );
}