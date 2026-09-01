// src/portals/AdminDashboard.jsx

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  useDashboardStats,
  useAdminFeed,
} from "../../api/dashboard";
import { xaf, initials } from "../../components/ui";
import "./AdminDashboard.css";

/* =========================================================
   CONSTANTS
========================================================= */

const MAX_CONTENT_WIDTH = 1400;

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const PIPELINE_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#16a34a",
];

const STREAM_COLORS = [
  "#00236f",
  "#3b82f6",
  "#93c5fd",
  "#c7d2fe",
  "#a5b4fc",
];

const SEVERITY_PILL = {
  minor: "pill-gray",
  medium: "pill-amber",
  high: "pill-red",
  critical: "pill-red",
};

const STATUS_PILL = {
  open: "pill-blue",
  escalated: "pill-red",
  resolved: "pill-green",
  closed: "pill-green",
  pending: "pill-amber",
};

const ACTIONS = [
  {
    icon: "person_add",
    label: "Add Student",
    color: "#1E40AF",
    bg: "#EFF6FF",
    to: "/students/new",
  },
  {
    icon: "group_add",
    label: "Add Teacher",
    color: "#7C3AED",
    bg: "#F5F3FF",
    to: "/staff/new",
  },
  {
    icon: "receipt_long",
    label: "Create Invoice",
    color: "#0EA5E9",
    bg: "#F0F9FF",
    to: "/finance",
  },
  {
    icon: "fact_check",
    label: "Attendance",
    color: "#16A34A",
    bg: "#F0FDF4",
    to: "/attendance",
  },
  {
    icon: "campaign",
    label: "Send Notice",
    color: "#D97706",
    bg: "#FFFBEB",
    to: "/notices",
  },
  {
    icon: "how_to_reg",
    label: "Admit Student",
    color: "#DB2777",
    bg: "#FDF2F8",
    to: "/admissions",
  },
];

/* =========================================================
   HELPERS
========================================================= */

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

const clamp = (value, min = 0, max = 100) =>
  Math.min(max, Math.max(min, toNumber(value)));

const formatNumber = (value) =>
  toNumber(value).toLocaleString();

const formatPercent = (value, decimals = 0) => {
  const number = toNumber(value);

  return `${number.toFixed(decimals)}%`;
};

const todayStr = () =>
  new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const greeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";

  return "Good Evening";
};

const normalizeArray = (value) =>
  Array.isArray(value) ? value : [];

const getItemId = (item, index) =>
  item?.id ?? item?.uuid ?? `${index}-${item?.title ?? "item"}`;

/*
 * Generates deterministic chart data.
 *
 * IMPORTANT:
 * The previous implementation used Math.random() during render.
 * That means every React render could produce a different chart.
 *
 * This function intentionally produces stable values from the base.
 */
const buildTrend = (base, count = 7) => {
  const safeBase = Math.max(1, toNumber(base));

  return Array.from({ length: count }, (_, index) => {
    const variation = ((index * 17 + 13) % 11) - 5;

    return Math.max(
      0,
      Math.round(safeBase + safeBase * (variation / 100)),
    );
  });
};

const getAttendanceColor = (attendance) => {
  const value = toNumber(attendance);

  if (value >= 90) return "#16A34A";
  if (value >= 75) return "#D97706";

  return "#DC2626";
};

const getAttendanceBg = (attendance) => {
  const value = toNumber(attendance);

  if (value >= 90) return "#F0FDF4";
  if (value >= 75) return "#FFFBEB";

  return "#FEF2F2";
};

const getAttendanceStatus = (attendance) => {
  const value = toNumber(attendance);

  if (value >= 90) {
    return {
      cls: "ad-badge-green",
      icon: "check_circle",
      text: "Target Met",
    };
  }

  if (value >= 75) {
    return {
      cls: "ad-badge-amber",
      icon: "monitoring",
      text: "Monitor",
    };
  }

  return {
    cls: "ad-badge-red",
    icon: "warning",
    text: "Below Target",
  };
};

const safeXaf = (value) => {
  const number = toNumber(value);

  return xaf(number);
};

/* =========================================================
   COUNT UP
========================================================= */

function useCountUp(end, duration = 700) {
  const safeEnd = toNumber(end);
  const [value, setValue] = useState(safeEnd);
  const previous = useRef(safeEnd);
  const frame = useRef(null);

  useEffect(() => {
    if (!Number.isFinite(safeEnd)) return;

    const start = previous.current;
    const startTime = performance.now();

    const tick = (currentTime) => {
      const progress = Math.min(
        (currentTime - startTime) / duration,
        1,
      );

      const eased =
        1 - Math.pow(1 - progress, 3);

      const next =
        start + (safeEnd - start) * eased;

      setValue(next);

      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        previous.current = safeEnd;
      }
    };

    frame.current = requestAnimationFrame(tick);

    return () => {
      if (frame.current) {
        cancelAnimationFrame(frame.current);
      }
    };
  }, [safeEnd, duration]);

  return Math.round(value);
}

/* =========================================================
   SPARKLINE
========================================================= */

function Sparkline({
  data = [],
  color = "#3b82f6",
  height = 24,
  width = 90,
}) {
  const values = normalizeArray(data).map((item) =>
    toNumber(item),
  );

  if (values.length < 2) {
    return null;
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const points = values
    .map((value, index) => {
      const x =
        (index / (values.length - 1)) * width;

      const y =
        height -
        ((value - min) / range) *
          (height - 4) -
        2;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{
        display: "block",
        overflow: "visible",
      }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =========================================================
   MINI DONUT
========================================================= */

function MiniDonut({
  data = [],
  size = 80,
  stroke = 10,
}) {
  const normalized = normalizeArray(data).map(
    (item) => ({
      ...item,
      value: Math.max(0, toNumber(item.value)),
    }),
  );

  const total =
    normalized.reduce(
      (sum, item) => sum + item.value,
      0,
    ) || 1;

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Distribution chart"
    >
      {normalized.map((item, index) => {
        const length =
          (item.value / total) *
          circumference;

        const element = (
          <circle
            key={`${item.label ?? "segment"}-${index}`}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={item.color}
            strokeWidth={stroke}
            strokeDasharray={`${length} ${
              circumference - length
            }`}
            strokeDashoffset={-offset}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
              transition:
                "stroke-dasharray .6s ease",
            }}
          />
        );

        offset += length;

        return element;
      })}
    </svg>
  );
}

/* =========================================================
   SKELETON
========================================================= */

function DashboardSkeleton() {
  return (
    <>
      <div className="ad-qstats">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="ad-qstat"
            aria-hidden="true"
          >
            <div
              className="ad-skel"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                marginBottom: 8,
              }}
            />

            <div
              className="ad-skel"
              style={{
                width: "60%",
                height: 20,
                marginBottom: 5,
              }}
            />

            <div
              className="ad-skel"
              style={{
                width: "42%",
                height: 12,
              }}
            />
          </div>
        ))}
      </div>

      <div className="row g-3 mb-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="col-12 col-sm-6 col-xl-3"
          >
            <div className="ad-skel-card">
              <div
                className="ad-skel"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  marginBottom: 14,
                }}
              />

              <div
                className="ad-skel"
                style={{
                  width: "50%",
                  height: 11,
                  marginBottom: 7,
                }}
              />

              <div
                className="ad-skel"
                style={{
                  width: "70%",
                  height: 28,
                  marginBottom: 8,
                }}
              />

              <div
                className="ad-skel"
                style={{
                  width: "90%",
                  height: 6,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <div
            className="ad-skel-card"
            style={{ height: 300 }}
          />
        </div>

        <div className="col-12 col-lg-3">
          <div
            className="ad-skel-card"
            style={{ height: 300 }}
          />
        </div>

        <div className="col-12 col-lg-3">
          <div
            className="ad-skel-card"
            style={{ height: 300 }}
          />
        </div>
      </div>
    </>
  );
}

/* =========================================================
   KPI CARD
========================================================= */

function KpiCard({
  icon,
  label,
  value,
  color,
  bg,
  sparkData,
  trend,
  trendDir = "neutral",
  compare,
  progress,
  progressColor,
  hint,
  badge,
}) {
  const isNumber = typeof value === "number";
  const count = useCountUp(
    isNumber ? value : 0,
  );

  const display = isNumber
    ? count.toLocaleString()
    : value ?? "—";

  const sparkValues = normalizeArray(
    sparkData,
  );

  const sparkMax = Math.max(
    ...sparkValues.map(toNumber),
    1,
  );

  return (
    <div
      className="ad-kpi"
      style={
        color
          ? {
              "--ad-kpi-color": color,
            }
          : undefined
      }
      tabIndex={0}
    >
      <div className="ad-kpi-top">
        <div
          className="ad-kpi-ic"
          style={{
            background:
              bg || "var(--primary)",
            color: "#fff",
          }}
        >
          <span className="material-symbols-outlined">
            {icon}
          </span>
        </div>

        {badge && (
          <span
            className={`ad-badge ${badge.cls || ""}`}
          >
            {badge.icon && (
              <span className="material-symbols-outlined">
                {badge.icon}
              </span>
            )}

            {badge.text}
          </span>
        )}
      </div>

      <div className="ad-kpi-label">
        {label}
      </div>

      <div className="ad-kpi-value">
        {display}
      </div>

      {trend && (
        <div className="ad-kpi-row">
          <span
            className={`ad-kpi-trend ${trendDir}`}
          >
            <span className="material-symbols-outlined">
              {trendDir === "up"
                ? "trending_up"
                : trendDir === "down"
                  ? "trending_down"
                  : "remove"}
            </span>

            {trend}
          </span>

          {compare && (
            <span className="ad-kpi-compare">
              {compare}
            </span>
          )}
        </div>
      )}

      {sparkValues.length > 1 && (
        <div className="ad-kpi-spark">
          {sparkValues.map((item, index) => (
            <div
              key={index}
              style={{
                height: `${Math.max(
                  6,
                  (toNumber(item) /
                    sparkMax) *
                    100,
                )}%`,
                background:
                  color ||
                  "var(--primary)",
                opacity:
                  index >=
                  sparkValues.length - 2
                    ? 1
                    : 0.3,
              }}
            />
          ))}
        </div>
      )}

      {progress != null && (
        <div
          className="ad-progress"
          role="progressbar"
          aria-valuenow={clamp(progress)}
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <span
            style={{
              width: `${clamp(progress)}%`,
              background:
                progressColor ||
                "linear-gradient(90deg, var(--primary), var(--ad-info))",
            }}
          />
        </div>
      )}

      {hint &&
        !sparkValues.length &&
        progress == null && (
          <div className="ad-kpi-hint">
            {hint}
          </div>
        )}
    </div>
  );
}

/* =========================================================
   QUICK STAT
========================================================= */

function QuickStat({
  icon,
  label,
  value,
  color,
  bg,
  sparkData,
  trend,
  trendDir = "neutral",
}) {
  const isNumber = typeof value === "number";

  const count = useCountUp(
    isNumber ? value : 0,
  );

  const values = normalizeArray(sparkData);

  const sparkMax = Math.max(
    ...values.map(toNumber),
    1,
  );

  return (
    <div
      className="ad-qstat"
      tabIndex={0}
    >
      <div className="ad-qstat-top">
        <div
          className="ad-qstat-ic"
          style={{
            background: bg,
            color,
          }}
        >
          <span className="material-symbols-outlined">
            {icon}
          </span>
        </div>

        {trend && (
          <span
            className={`ad-qstat-trend ${trendDir}`}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 11 }}
            >
              {trendDir === "up"
                ? "arrow_upward"
                : trendDir === "down"
                  ? "arrow_downward"
                  : "remove"}
            </span>

            {trend}
          </span>
        )}
      </div>

      <div className="ad-qstat-val">
        {isNumber
          ? count.toLocaleString()
          : value ?? "—"}
      </div>

      <div className="ad-qstat-label">
        {label}
      </div>

      {values.length > 1 && (
        <div className="ad-qstat-spark">
          {values.map((item, index) => (
            <div
              key={index}
              style={{
                height: `${Math.max(
                  6,
                  (toNumber(item) /
                    sparkMax) *
                    100,
                )}%`,
                background: color,
                opacity:
                  index >= values.length - 2
                    ? 1
                    : 0.3,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   QUICK ACTIONS
========================================================= */

function QuickActions() {
  return (
    <div className="ad-actions-grid">
      {ACTIONS.map((action) => (
        <Link
          key={action.to}
          to={action.to}
          className="ad-act-btn"
        >
          <div
            className="ad-act-btn-ic"
            style={{
              background: action.bg,
              color: action.color,
            }}
          >
            <span className="material-symbols-outlined">
              {action.icon}
            </span>
          </div>

          <span className="ad-act-btn-label">
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

/* =========================================================
   ADMISSION PIPELINE
========================================================= */

function AdmissionPipeline({
  data = {},
}) {
  const submitted = toNumber(
    data?.submitted,
  );

  const reviewed = Math.min(
    submitted,
    toNumber(data?.reviewed),
  );

  const interviewed = Math.min(
    reviewed,
    toNumber(data?.interviewed),
  );

  const admitted = Math.min(
    interviewed,
    toNumber(data?.admitted),
  );

  const total = Math.max(
    submitted,
    1,
  );

  const segments = [
    {
      label: "Submitted",
      value: submitted,
    },
    {
      label: "Reviewed",
      value: reviewed,
    },
    {
      label: "Interview",
      value: interviewed,
    },
    {
      label: "Admitted",
      value: admitted,
    },
  ].map((item) => ({
    ...item,
    percentage:
      (item.value / total) * 100,
  }));

  return (
    <div className="ad-pipeline">
      <div className="ad-pipeline-label">
        Application progression
      </div>

      <div
        className="ad-pipeline-bar"
        aria-label="Admission pipeline"
      >
        {segments.map((segment, index) => (
          <div
            key={segment.label}
            className="ad-pipeline-seg"
            style={{
              width: `${segment.percentage}%`,
              background:
                PIPELINE_COLORS[index],
            }}
            title={`${segment.label}: ${segment.value}`}
          >
            {segment.value > 0
              ? segment.value
              : ""}
          </div>
        ))}
      </div>

      <div className="ad-pipeline-legend">
        {segments.map((segment, index) => (
          <div
            key={segment.label}
            className="ad-pipeline-leg"
          >
            <div
              className="ad-pipeline-leg-dot"
              style={{
                background:
                  PIPELINE_COLORS[index],
              }}
            />

            <span>{segment.label}</span>

            <strong>
              {formatNumber(
                segment.value,
              )}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   FEE PROGRESS
========================================================= */

function FeeProgress({
  collected = 0,
  goal = 0,
}) {
  const safeCollected = Math.max(
    0,
    toNumber(collected),
  );

  const safeGoal = Math.max(
    0,
    toNumber(goal),
  );

  const percentage =
    safeGoal > 0
      ? clamp(
          (safeCollected /
            safeGoal) *
            100,
        )
      : 0;

  const radius = 42;
  const circumference =
    2 * Math.PI * radius;

  const offset =
    circumference -
    (percentage / 100) *
      circumference;

  const percentageColor =
    percentage >= 70
      ? "var(--ad-success)"
      : percentage >= 40
        ? "var(--ad-warning)"
        : "var(--ad-danger)";

  return (
    <div style={{ textAlign: "center" }}>
      <div className="ad-fee-circle">
        <svg
          width={100}
          height={100}
          viewBox="0 0 100 100"
          role="img"
          aria-label={`Fee collection ${Math.round(
            percentage,
          )}%`}
        >
          <circle
            className="ad-fee-circle-bg"
            cx="50"
            cy="50"
            r={radius}
          />

          <circle
            className="ad-fee-circle-fill"
            cx="50"
            cy="50"
            r={radius}
            stroke="var(--primary)"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition:
                "stroke-dashoffset .7s ease",
            }}
          />
        </svg>

        <div className="ad-fee-center">
          <span
            className="ad-fee-pct"
            style={{
              color: percentageColor,
            }}
          >
            {Math.round(
              percentage,
            )}
            %
          </span>

          <span className="ad-fee-label">
            Collected
          </span>
        </div>
      </div>

      <div className="ad-fee-amounts">
        <div className="ad-fee-amt-item">
          <div
            className="ad-fee-amt-val"
            style={{
              color:
                "var(--ad-success)",
            }}
          >
            {safeXaf(
              safeCollected,
            )}
          </div>

          <div className="ad-fee-amt-label">
            Collected
          </div>
        </div>

        <div className="ad-fee-amt-item">
          <div className="ad-fee-amt-val">
            {safeXaf(safeGoal)}
          </div>

          <div className="ad-fee-amt-label">
            Goal
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   URGENT CARD
========================================================= */

function UrgentCard({
  sev,
  icon,
  iconBg,
  iconColor,
  title,
  desc,
  count,
  to,
}) {
  const content = (
    <>
      <div
        className="ad-urgent-ic"
        style={{
          background:
            iconBg ||
            "var(--ad-surface)",
          color:
            iconColor ||
            "var(--ad-text-3)",
        }}
      >
        <span className="material-symbols-outlined">
          {icon}
        </span>
      </div>

      <div className="ad-urgent-body">
        <div className="t">
          {title}
        </div>

        <div className="d">
          {desc}
        </div>
      </div>

      <div className="ad-urgent-count">
        {count}
      </div>

      {to && (
        <span
          className="ad-urgent-action"
          title={`View ${title}`}
          aria-hidden="true"
        >
          <span className="material-symbols-outlined">
            arrow_forward
          </span>
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={`ad-urgent-card sev-${sev}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      className={`ad-urgent-card sev-${sev}`}
    >
      {content}
    </div>
  );
}

/* =========================================================
   CALENDAR
========================================================= */

function CalendarWidget({
  events = [],
}) {
  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    now.getMonth();

  const today =
    now.getDate();

  const firstDaySundayBased =
    new Date(
      year,
      month,
      1,
    ).getDay();

  /*
   * Convert Sunday-first JS index:
   *
   * Sunday = 0
   * Monday = 1
   *
   * to Monday-first:
   *
   * Monday = 0
   * Sunday = 6
   */
  const firstDay =
    (firstDaySundayBased + 6) %
    7;

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0,
    ).getDate();

  const previousMonthDays =
    new Date(
      year,
      month,
      0,
    ).getDate();

  const monthName =
    now.toLocaleString(
      "en-US",
      {
        month: "long",
      },
    );

  const normalizedEvents =
    normalizeArray(events);

  const eventDays = new Set(
    normalizedEvents
      .map((event) =>
        toNumber(event.day),
      )
      .filter(
        (day) =>
          day >= 1 &&
          day <= daysInMonth,
      ),
  );

  const cells = [];

  for (
    let index = firstDay - 1;
    index >= 0;
    index--
  ) {
    cells.push({
      day:
        previousMonthDays -
        index,
      other: true,
    });
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    cells.push({
      day,
      today: day === today,
      hasEvent:
        eventDays.has(day),
    });
  }

  let nextMonthDay = 1;

  while (cells.length < 42) {
    cells.push({
      day: nextMonthDay++,
      other: true,
    });
  }

  return (
    <div className="ad-cal">
      <div className="ad-cal-hd">
        <span>
          {monthName} {year}
        </span>
      </div>

      <div className="ad-cal-grid">
        {[
          "Mo",
          "Tu",
          "We",
          "Th",
          "Fr",
          "Sa",
          "Su",
        ].map((day) => (
          <div
            key={day}
            className="ad-cal-day-hd"
          >
            {day}
          </div>
        ))}

        {cells.map((cell, index) => (
          <div
            key={`${cell.day}-${index}`}
            className={[
              "ad-cal-day",
              cell.today
                ? "today"
                : "",
              cell.other
                ? "other"
                : "",
              cell.hasEvent
                ? "has-event"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {cell.day}
          </div>
        ))}
      </div>

      <div className="ad-cal-events">
        {normalizedEvents
          .filter((event) => {
            const day =
              toNumber(event.day);

            return (
              day >= 1 &&
              day <= daysInMonth
            );
          })
          .slice(0, 5)
          .map((event, index) => (
            <div
              key={
                event.id ??
                `${event.label}-${index}`
              }
              className="ad-cal-ev"
            >
              <div
                className="ad-cal-ev-dot"
                style={{
                  background:
                    event.color ||
                    "var(--ad-info)",
                }}
              />

              <span>
                {event.label}
              </span>
            </div>
          ))}

        {normalizedEvents.length === 0 && (
          <div
            className="text-secondary"
            style={{
              fontSize: 11,
            }}
          >
            No calendar events.
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   ANNOUNCEMENTS
========================================================= */

function AnnouncementsCard({
  items = [],
}) {
  const announcements =
    normalizeArray(items);

  if (!announcements.length) {
    return (
      <div
        className="ad-empty"
        style={{
          padding: "20px 10px",
        }}
      >
        <span className="material-symbols-outlined">
          campaign
        </span>

        <div className="t">
          No announcements
        </div>

        <div className="d">
          Published notices will
          appear here.
        </div>
      </div>
    );
  }

  const colors = [
    "var(--ad-danger)",
    "var(--ad-info)",
    "var(--ad-success)",
    "var(--ad-warning)",
  ];

  return (
    <div>
      {announcements
        .slice(0, 5)
        .map((announcement, index) => (
          <div
            key={getItemId(
              announcement,
              index,
            )}
            className="ad-announce-item"
          >
            <div
              className="ad-announce-dot"
              style={{
                background:
                  announcement.color ||
                  colors[
                    index %
                      colors.length
                  ],
              }}
            />

            <div className="ad-announce-body">
              <div className="ad-announce-t">
                {announcement.title ||
                  "Announcement"}
              </div>

              <div className="ad-announce-d">
                {announcement.body ||
                  announcement.description ||
                  "No additional details."}
              </div>
            </div>

            <div className="ad-announce-when">
              {announcement.when ||
                announcement.created_at ||
                "—"}
            </div>
          </div>
        ))}
    </div>
  );
}

/* =========================================================
   BIRTHDAYS
========================================================= */

function BirthdaysCard({
  items = [],
}) {
  const birthdays =
    normalizeArray(items);

  if (!birthdays.length) {
    return (
      <div
        style={{
          fontSize: 12,
          color:
            "var(--ad-text-3)",
          padding: "8px 0",
        }}
      >
        No birthdays today
      </div>
    );
  }

  return birthdays.map(
    (birthday, index) => (
      <div
        key={getItemId(
          birthday,
          index,
        )}
        className="ad-bday-item"
      >
        <div className="ad-bday-avatar">
          {initials(
            birthday.name ||
              "Student",
          )}
        </div>

        <div>
          <div className="ad-bday-name">
            {birthday.name ||
              "Unknown"}
          </div>

          <div className="ad-bday-class">
            {birthday.class ||
              birthday.form ||
              "—"}
          </div>
        </div>
      </div>
    ),
  );
}

/* =========================================================
   EXAMS
========================================================= */

function ExamsCard({
  items = [],
}) {
  const exams =
    normalizeArray(items);

  if (!exams.length) {
    return (
      <div
        style={{
          fontSize: 12,
          color:
            "var(--ad-text-3)",
          padding: "8px 0",
        }}
      >
        No upcoming exams
      </div>
    );
  }

  return exams.map(
    (exam, index) => (
      <div
        key={getItemId(
          exam,
          index,
        )}
        className="ad-exam-item"
      >
        <div className="ad-exam-date">
          <span className="ad-exam-date-d">
            {exam.day ??
              exam.date_day ??
              "—"}
          </span>

          <span className="ad-exam-date-m">
            {exam.month ??
              exam.date_month ??
              ""}
          </span>
        </div>

        <div className="ad-exam-body">
          <div className="ad-exam-t">
            {exam.title ||
              "Examination"}
          </div>

          <div className="ad-exam-d">
            {exam.desc ||
              exam.description ||
              "—"}
          </div>
        </div>
      </div>
    ),
  );
}

/* =========================================================
   ACTIVITY TIMELINE
========================================================= */

function ActivityTimeline({
  items = [],
}) {
  const activities =
    normalizeArray(items);

  if (!activities.length) {
    return (
      <div className="ad-empty">
        <span className="material-symbols-outlined">
          bolt
        </span>

        <div className="t">
          No recent activity
        </div>

        <div className="d">
          Administrative actions
          will appear here.
        </div>
      </div>
    );
  }

  const classMap = {
    created: "tl-created",
    updated: "tl-updated",
    deleted: "tl-deleted",
  };

  return (
    <div className="ad-timeline">
      {activities
        .slice(0, 10)
        .map((activity, index) => (
          <div
            key={getItemId(
              activity,
              index,
            )}
            className={`ad-tl-item ${
              classMap[
                activity.action
              ] || ""
            }`}
          >
            <div className="ad-tl-dot" />

            {index <
              activities.length -
                1 && (
              <div className="ad-tl-line" />
            )}

            <div className="ad-tl-time">
              {activity.when ||
                activity.created_at ||
                "—"}
            </div>

            <div className="ad-tl-body">
              <strong>
                {activity.subject ||
                  "System"}
              </strong>{" "}
              {activity.action ||
                "updated"}
            </div>

            <div className="ad-tl-by">
              By{" "}
              {activity.causer ||
                activity.user ||
                "System"}
            </div>
          </div>
        ))}
    </div>
  );
}

/* =========================================================
   STUDENT DISTRIBUTION
========================================================= */

function StudentDistribution({
  boys = 0,
  girls = 0,
  arts = 0,
  science = 0,
  technical = 0,
}) {
  const male = Math.max(
    0,
    toNumber(boys),
  );

  const female = Math.max(
    0,
    toNumber(girls),
  );

  const total =
    male + female;

  const malePercentage =
    total > 0
      ? Math.round(
          (male / total) * 100,
        )
      : 0;

  const femalePercentage =
    total > 0
      ? 100 - malePercentage
      : 0;

  const programmes = [
    {
      label: "Arts",
      value: Math.max(
        0,
        toNumber(arts),
      ),
      color: "#8b5cf6",
    },
    {
      label: "Science",
      value: Math.max(
        0,
        toNumber(science),
      ),
      color: "#3b82f6",
    },
    {
      label: "Technical",
      value: Math.max(
        0,
        toNumber(technical),
      ),
      color: "#0ea5e9",
    },
  ];

  const programmeMax = Math.max(
    ...programmes.map(
      (item) => item.value,
    ),
    1,
  );

  return (
    <div>
      <div
        className="ad-gender-wrap"
        style={{
          marginBottom: 14,
        }}
      >
        <MiniDonut
          data={[
            {
              label: "Male",
              value: male,
              color: "#3b82f6",
            },
            {
              label: "Female",
              value: female,
              color: "#ec4899",
            },
          ]}
          size={60}
          stroke={8}
        />

        <div className="ad-gender-bars">
          <div className="ad-gender-row">
            <span className="ad-gender-label">
              Male
            </span>

            <div className="ad-gender-track">
              <div
                className="ad-gender-fill"
                style={{
                  width: `${malePercentage}%`,
                  background:
                    "#3b82f6",
                }}
              >
                {malePercentage >=
                  10 && (
                  <span>
                    {malePercentage}%
                  </span>
                )}
              </div>
            </div>

            <span className="ad-gender-count">
              {formatNumber(male)}
            </span>
          </div>

          <div className="ad-gender-row">
            <span className="ad-gender-label">
              Female
            </span>

            <div className="ad-gender-track">
              <div
                className="ad-gender-fill"
                style={{
                  width: `${femalePercentage}%`,
                  background:
                    "#ec4899",
                }}
              >
                {femalePercentage >=
                  10 && (
                  <span>
                    {femalePercentage}%
                  </span>
                )}
              </div>
            </div>

            <span className="ad-gender-count">
              {formatNumber(female)}
            </span>
          </div>
        </div>
      </div>

      <div className="ad-hbar">
        {programmes.map(
          (programme) => (
            <div
              key={programme.label}
              className="ad-hbar-row"
            >
              <span className="ad-hbar-label">
                {programme.label}
              </span>

              <div className="ad-hbar-track">
                <div
                  className="ad-hbar-fill"
                  style={{
                    width: `${
                      (programme.value /
                        programmeMax) *
                      100
                    }%`,
                    background:
                      programme.color,
                  }}
                />
              </div>

              <span className="ad-hbar-val">
                {formatNumber(
                  programme.value,
                )}
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

/* =========================================================
   TEACHING MOBILE CARDS
========================================================= */

function TeachingMobileCards({
  items = [],
}) {
  const sessions =
    normalizeArray(items);

  if (!sessions.length) {
    return (
      <div className="ad-empty">
        <span className="material-symbols-outlined">
          co_present
        </span>

        <div className="t">
          No sessions today
        </div>
      </div>
    );
  }

  return sessions.map(
    (session, index) => {
      const present =
        toNumber(
          session.present,
        );

      const absent =
        toNumber(
          session.absent,
        );

      return (
        <div
          key={getItemId(
            session,
            index,
          )}
          className="ad-mcard"
        >
          <div className="ad-mcard-top">
            <div className="ad-avatar">
              {session.photo ? (
                <img
                  src={session.photo}
                  alt=""
                />
              ) : (
                initials(
                  session.teacher ||
                    "Teacher",
                )
              )}
            </div>

            <div>
              <div
                className="fw-semibold"
                style={{
                  fontSize: 13,
                }}
              >
                {session.teacher ||
                  "Teacher"}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color:
                    "var(--ad-text-3)",
                }}
              >
                {session.role ||
                  "Teacher"}
              </div>
            </div>

            <span
              className="ad-period"
              style={{
                marginLeft:
                  "auto",
              }}
            >
              #
              {session.period ??
                "—"}
            </span>
          </div>

          <div className="ad-mcard-body">
            <div>
              <span className="ad-mcard-label">
                Subject
              </span>

              <span className="ad-subject-pill">
                {session.subject ||
                  "—"}
              </span>
            </div>

            <div>
              <span className="ad-mcard-label">
                Class
              </span>

              {session.class ||
                "—"}
            </div>

            <div>
              <span className="ad-mcard-label">
                Topic
              </span>

              <span
                className="ad-topic"
                title={
                  session.lesson_topic ||
                  ""
                }
              >
                {session.lesson_topic ||
                  "—"}
              </span>
            </div>

            <div>
              <span className="ad-mcard-label">
                Attendance
              </span>

              <div className="ad-att">
                <span className="ad-att-p">
                  {present}P
                </span>

                <span className="ad-att-a">
                  {absent}A
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    },
  );
}

/* =========================================================
   DISCIPLINE MOBILE CARDS
========================================================= */

function DisciplineMobileCards({
  items = [],
}) {
  const incidents =
    normalizeArray(items);

  if (!incidents.length) {
    return (
      <div className="ad-empty">
        <span className="material-symbols-outlined">
          verified_user
        </span>

        <div className="t">
          No incidents
        </div>
      </div>
    );
  }

  return incidents.map(
    (incident, index) => (
      <div
        key={getItemId(
          incident,
          index,
        )}
        className="ad-mcard"
      >
        <div className="ad-mcard-top">
          <div>
            <div
              className="fw-semibold"
              style={{
                fontSize: 13,
              }}
            >
              {incident.student ||
                "Student"}
            </div>

            <div
              style={{
                fontSize: 11,
                color:
                  "var(--ad-text-3)",
              }}
            >
              {incident.title ||
                "Discipline case"}
            </div>
          </div>

          <span
            className={`pill ${
              SEVERITY_PILL[
                incident.severity
              ] ||
              "pill-gray"
            }`}
          >
            {incident.severity ||
              "unknown"}
          </span>
        </div>

        <div className="ad-mcard-body">
          <div>
            <span className="ad-mcard-label">
              Status
            </span>

            <span
              className={`pill ${
                STATUS_PILL[
                  incident.status
                ] ||
                "pill-gray"
              }`}
            >
              {incident.status ||
                "unknown"}
            </span>
          </div>

          {incident.date && (
            <div>
              <span className="ad-mcard-label">
                Date
              </span>

              {incident.date}
            </div>
          )}
        </div>
      </div>
    ),
  );
}

/* =========================================================
   WEEKLY COLLECTION
========================================================= */

function WeeklyChart({
  data = [],
}) {
  const collection =
    normalizeArray(data).map(
      (item) => ({
        ...item,
        amount: Math.max(
          0,
          toNumber(item.amount),
        ),
      }),
    );

  if (!collection.length) {
    return (
      <div className="text-secondary small text-center w-100 py-4">
        No collection data available.
      </div>
    );
  }

  const max = Math.max(
    1,
    ...collection.map(
      (item) => item.amount,
    ),
  );

  const peakIndex =
    collection.reduce(
      (maxIndex, item, index, array) =>
        item.amount >
        array[maxIndex].amount
          ? index
          : maxIndex,
      0,
    );

  return (
    <div className="ad-bars">
      {collection.map(
        (item, index) => (
          <div
            className="ad-bar-col"
            key={
              item.id ??
              item.label ??
              index
            }
            title={safeXaf(
              item.amount,
            )}
          >
            <div
              className="ad-bar-val"
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "#64748b",
                lineHeight: 1,
              }}
            >
              {(
                item.amount / 1000
              ).toFixed(0)}
              k
            </div>

            <div
              className={`ad-bar ${
                index ===
                  peakIndex &&
                item.amount > 0
                  ? "peak"
                  : ""
              }`}
              style={{
                height: `${Math.max(
                  4,
                  (item.amount /
                    max) *
                    110,
                )}px`,
              }}
            />

            <div className="ad-bar-lbl">
              {item.label ||
                "—"}
            </div>
          </div>
        ),
      )}
    </div>
  );
}

/* =========================================================
   REVENUE STREAMS
========================================================= */

function RevenueStreams({
  data = [],
  total: totalProp,
}) {
  const streams =
    normalizeArray(data).map(
      (item) => ({
        ...item,
        amount: Math.max(
          0,
          toNumber(item.amount),
        ),
      }),
    );

  const calculatedTotal =
    streams.reduce(
      (sum, item) =>
        sum + item.amount,
      0,
    );

  const total =
    totalProp != null
      ? Math.max(
          0,
          toNumber(totalProp),
        )
      : calculatedTotal;

  let accumulated = 0;

  const stops = streams.map(
    (stream, index) => {
      const start =
        total > 0
          ? (accumulated /
              total) *
            360
          : 0;

      accumulated +=
        stream.amount;

      const end =
        total > 0
          ? (accumulated /
              total) *
            360
          : 0;

      return `${
        STREAM_COLORS[
          index %
            STREAM_COLORS.length
        ]
      } ${start}deg ${end}deg`;
    },
  );

  const gradient = stops.length
    ? `conic-gradient(${stops.join(
        ", ",
      )})`
    : "conic-gradient(#e5e7eb 0deg 360deg)";

  return (
    <div className="ad-donut-wrap">
      <div
        className="ad-donut"
        style={{
          background: gradient,
          width: 90,
          height: 90,
        }}
        role="img"
        aria-label="Revenue streams"
      >
        <div className="ad-donut-center">
          <span
            className="lbl"
            style={{
              fontSize: 8,
            }}
          >
            Total
          </span>

          <span
            className="val"
            style={{
              fontSize: 14,
            }}
          >
            {safeXaf(total)}
          </span>
        </div>
      </div>

      <div className="ad-legend">
        {streams.map(
          (stream, index) => {
            const calculatedPercentage =
              total > 0
                ? Math.round(
                    (stream.amount /
                      total) *
                      100,
                  )
                : 0;

            const percentage =
              stream.pct != null
                ? toNumber(
                    stream.pct,
                  )
                : calculatedPercentage;

            return (
              <div
                className="ad-legend-row"
                key={
                  stream.id ??
                  stream.name ??
                  index
                }
              >
                <span
                  className="ad-legend-dot"
                  style={{
                    background:
                      STREAM_COLORS[
                        index %
                          STREAM_COLORS.length
                      ],
                  }}
                />

                <span
                  className="nm"
                  style={{
                    fontSize: 11.5,
                  }}
                >
                  {stream.name ||
                    "Other"}
                </span>

                <span className="pc">
                  {percentage}%
                </span>
              </div>
            );
          },
        )}

        {!streams.length && (
          <div
            className="text-secondary"
            style={{
              fontSize: 11.5,
            }}
          >
            No revenue data.
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   NOTIFICATION PANEL
========================================================= */

function NotificationPanel({
  items = [],
  onClose,
}) {
  return (
    <div
      className="ad-notification-panel"
      role="dialog"
      aria-label="Dashboard alerts"
    >
      <div className="ad-notification-head">
        <div>
          <strong>Alerts</strong>
          <div
            style={{
              fontSize: 11,
              color:
                "var(--ad-text-3)",
            }}
          >
            Items requiring
            attention
          </div>
        </div>

        <button
          type="button"
          className="ad-eye"
          onClick={onClose}
          aria-label="Close alerts"
        >
          <span className="material-symbols-outlined">
            close
          </span>
        </button>
      </div>

      <div className="ad-notification-list">
        {items.length === 0 ? (
          <div className="ad-empty">
            <span className="material-symbols-outlined">
              notifications_off
            </span>

            <div className="t">
              No alerts
            </div>
          </div>
        ) : (
          items.map(
            (item, index) => (
              <div
                key={
                  item.id ??
                  `${item.title}-${index}`
                }
                className="ad-notification-item"
              >
                <div
                  className="ad-notification-icon"
                  style={{
                    color:
                      item.color,
                    background:
                      item.bg,
                  }}
                >
                  <span className="material-symbols-outlined">
                    {item.icon}
                  </span>
                </div>

                <div
                  style={{
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {item.title}
                  </div>

                  <div
                    style={{
                      fontSize: 10.5,
                      color:
                        "var(--ad-text-3)",
                      marginTop: 2,
                    }}
                  >
                    {item.when}
                  </div>
                </div>
              </div>
            ),
          )
        )}
      </div>

      <div className="ad-notification-foot">
        <Link
          to="/notifications"
          className="ad-link"
          onClick={onClose}
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN DASHBOARD
========================================================= */

export default function AdminDashboard() {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useDashboardStats();

  const {
    data: feed,
    isLoading: feedLoading,
    isError: feedError,
    refetch: refetchFeed,
  } = useAdminFeed();

  const [period, setPeriod] =
    useState("today");

  const [showNotif, setShowNotif] =
    useState(false);

  const notifRef =
    useRef(null);

  const isLoading =
    statsLoading || feedLoading;

  /*
   * -------------------------------------------------------
   * NORMALIZED DATA
   * -------------------------------------------------------
   */

  const s = stats || {};

  const teachingToday =
    normalizeArray(
      feed?.teaching_today,
    );

  const disciplineIncidents =
    normalizeArray(
      feed?.discipline_incidents,
    );

  const recentActivity =
    normalizeArray(
      feed?.recent_activity,
    );

  const announcements =
    normalizeArray(
      s?.announcements,
    );

  const upcomingExams =
    normalizeArray(
      s?.upcoming_exams,
    );

  /*
   * -------------------------------------------------------
   * CORE METRICS
   * -------------------------------------------------------
   */

  const attendance = toNumber(
    s?.attendance_overall ??
      s?.attendance_rate,
  );

  const totalStudents =
    toNumber(
      s?.total_students,
    );

  const totalStaff =
    toNumber(
      s?.total_staff,
    );

  const totalClasses =
    toNumber(
      s?.total_classes,
    );

  const pendingAdmissions =
    toNumber(
      s?.pending_admissions,
    );

  const absentToday =
    toNumber(
      s?.absent_today,
    );

  const overdueInvoices =
    toNumber(
      s?.overdue_invoices,
    );

  const collectedToday =
    toNumber(
      s?.collected_today,
    );

  const disciplineCount =
    disciplineIncidents.length;

  /*
   * -------------------------------------------------------
   * NOTIFICATIONS
   * -------------------------------------------------------
   */

  const notificationItems =
    useMemo(
      () => [
        {
          id: "absent",
          icon: "person_off",
          color:
            "var(--ad-danger)",
          bg:
            "var(--ad-danger-50)",
          title: `${formatNumber(
            absentToday,
          )} students absent today`,
          when: "Today",
        },
        {
          id: "overdue",
          icon: "request_quote",
          color:
            "var(--ad-warning)",
          bg:
            "var(--ad-warning-50)",
          title: `${formatNumber(
            overdueInvoices,
          )} invoices overdue`,
          when: "Today",
        },
        {
          id: "admissions",
          icon: "description",
          color:
            "var(--ad-info)",
          bg:
            "var(--ad-info-50)",
          title: `${formatNumber(
            pendingAdmissions,
          )} admissions pending`,
          when: "Today",
        },
        {
          id: "discipline",
          icon: "gpp_maybe",
          color:
            "var(--ad-purple)",
          bg:
            "var(--ad-purple-50)",
          title: `${formatNumber(
            disciplineCount,
          )} discipline cases`,
          when: "Today",
        },
      ],
      [
        absentToday,
        overdueInvoices,
        pendingAdmissions,
        disciplineCount,
      ],
    );

  const notificationCount =
    absentToday +
    overdueInvoices +
    pendingAdmissions +
    disciplineCount;

  /*
   * -------------------------------------------------------
   * OUTSIDE CLICK
   * -------------------------------------------------------
   */

  useEffect(() => {
    const handleOutsideClick = (
      event,
    ) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(
          event.target,
        )
      ) {
        setShowNotif(false);
      }
    };

    if (showNotif) {
      document.addEventListener(
        "mousedown",
        handleOutsideClick,
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, [showNotif]);

  /*
   * -------------------------------------------------------
   * ESC KEY
   * -------------------------------------------------------
   */

  useEffect(() => {
    const handleKeyDown = (
      event,
    ) => {
      if (
        event.key === "Escape"
      ) {
        setShowNotif(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, []);

  /*
   * -------------------------------------------------------
   * STABLE CHART DATA
   * -------------------------------------------------------
   */

  const studentTrend = useMemo(
    () =>
      buildTrend(
        totalStudents,
      ),
    [totalStudents],
  );

  const staffTrend = useMemo(
    () =>
      buildTrend(
        totalStaff,
      ),
    [totalStaff],
  );

  const classTrend = useMemo(
    () =>
      buildTrend(
        totalClasses,
      ),
    [totalClasses],
  );

  const attendanceTrend =
    useMemo(
      () =>
        buildTrend(
          attendance || 0,
        ),
      [attendance],
    );

  const revenueTrend = useMemo(
    () =>
      buildTrend(
        collectedToday,
      ),
    [collectedToday],
  );

  const admissionsTrend =
    useMemo(
      () =>
        buildTrend(
          pendingAdmissions,
        ),
      [pendingAdmissions],
    );

  /*
   * -------------------------------------------------------
   * DERIVED VALUES
   * -------------------------------------------------------
   */

  const attendanceColor =
    getAttendanceColor(
      attendance,
    );

  const attendanceBg =
    getAttendanceBg(
      attendance,
    );

  const attendanceStatus =
    getAttendanceStatus(
      attendance,
    );

  const feeCollected =
    toNumber(
      s?.fees_collected,
    );

  const feeGoal =
    toNumber(
      s?.fees_goal,
    );

  /*
   * -------------------------------------------------------
   * PERIOD HANDLER
   *
   * This currently controls the UI state.
   *
   * If your useDashboardStats hook supports a period
   * parameter, pass `period` there as well.
   * -------------------------------------------------------
   */

  const handlePeriodChange =
    useCallback(
      (nextPeriod) => {
        setPeriod(nextPeriod);
      },
      [],
    );

  /*
   * -------------------------------------------------------
   * REFRESH
   * -------------------------------------------------------
   */

  const handleRefresh =
    useCallback(async () => {
      await Promise.allSettled([
        refetchStats?.(),
        refetchFeed?.(),
      ]);
    }, [
      refetchStats,
      refetchFeed,
    ]);

  /*
   * -------------------------------------------------------
   * ERROR STATE
   * -------------------------------------------------------
   */

  if (
    !isLoading &&
    statsError &&
    !stats
  ) {
    return (
      <div
        className="container-fluid px-0"
        style={{
          maxWidth:
            MAX_CONTENT_WIDTH,
        }}
      >
        <div
          className="ad-card"
          style={{
            padding: 32,
            textAlign: "center",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 44,
              color:
                "var(--ad-danger)",
            }}
          >
            cloud_off
          </span>

          <h2
            style={{
              marginTop: 12,
              fontSize: 18,
            }}
          >
            Unable to load dashboard
          </h2>

          <p
            className="text-secondary"
            style={{
              fontSize: 13,
            }}
          >
            The dashboard data could
            not be loaded from the
            server.
          </p>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleRefresh}
          >
            <span className="material-symbols-outlined">
              refresh
            </span>

            Retry
          </button>
        </div>
      </div>
    );
  }

  /*
   * -------------------------------------------------------
   * LOADING
   * -------------------------------------------------------
   */

  if (isLoading) {
    return (
      <div
        className="container-fluid px-0"
        style={{
          maxWidth:
            MAX_CONTENT_WIDTH,
        }}
      >
        <div className="ad-head">
          <div>
            <div
              className="ad-skel"
              style={{
                width: 220,
                height: 28,
                marginBottom: 6,
              }}
            />

            <div
              className="ad-skel"
              style={{
                width: 320,
                height: 16,
              }}
            />
          </div>
        </div>

        <DashboardSkeleton />
      </div>
    );
  }

  /*
   * -------------------------------------------------------
   * RENDER
   * -------------------------------------------------------
   */

  return (
    <div
      className="container-fluid px-0"
      style={{
        maxWidth:
          MAX_CONTENT_WIDTH,
      }}
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="ad-head">
        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <div className="ad-greeting">
            {greeting()},{" "}
            <strong>
              Administrator
            </strong>{" "}
            👋
          </div>

          <h1>
            Dashboard Overview
          </h1>

          <p>
            Here's your school
            summary for{" "}
            <strong>
              {period ===
              "today"
                ? "today"
                : `this ${period}`}
            </strong>
            .
          </p>

          <div className="ad-head-summary">
            <div className="ad-head-sum-item danger">
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 14,
                  color:
                    "var(--ad-danger)",
                }}
              >
                warning
              </span>

              <strong>
                {formatNumber(
                  absentToday,
                )}
              </strong>{" "}
              Absent
            </div>

            <div className="ad-head-sum-item">
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 14,
                }}
              >
                notifications
              </span>

              <strong>
                {formatNumber(
                  notificationCount,
                )}
              </strong>{" "}
              Alerts
            </div>

            <div className="ad-head-sum-item">
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 14,
                }}
              >
                fact_check
              </span>

              <strong>
                {formatPercent(
                  attendance,
                )}
              </strong>{" "}
              Attendance
            </div>

            <div className="ad-head-sum-item">
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 14,
                }}
              >
                payments
              </span>

              <strong>
                {safeXaf(
                  collectedToday,
                )}
              </strong>{" "}
              Revenue
            </div>
          </div>
        </div>

        <div className="ad-head-right">
          <div className="ad-periods">
            {PERIODS.map(
              (item) => (
                <button
                  key={
                    item.value
                  }
                  type="button"
                  className={`ad-period-btn ${
                    period ===
                    item.value
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    handlePeriodChange(
                      item.value,
                    )
                  }
                >
                  {item.label}
                </button>
              ),
            )}
          </div>

          <span className="ad-datechip">
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 16,
              }}
            >
              calendar_today
            </span>

            {todayStr()}
          </span>

          <button
            type="button"
            className="btn btn-light d-flex align-items-center gap-2"
            style={{
              fontSize: 13,
              padding:
                "7px 12px",
            }}
            onClick={
              handleRefresh
            }
            title="Refresh dashboard"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 17,
              }}
            >
              refresh
            </span>

            Refresh
          </button>

          <div
            ref={notifRef}
            style={{
              position:
                "relative",
            }}
          >
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center gap-2"
              style={{
                fontSize: 13,
                padding:
                  "7px 13px",
              }}
              onClick={() =>
                setShowNotif(
                  (current) =>
                    !current,
                )
              }
              aria-expanded={
                showNotif
              }
              aria-haspopup="dialog"
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 17,
                }}
              >
                notifications
              </span>

              Alerts

              {notificationCount >
                0 && (
                <span
                  className="badge rounded-pill bg-danger"
                  style={{
                    fontSize: 9,
                  }}
                >
                  {notificationCount >
                  99
                    ? "99+"
                    : notificationCount}
                </span>
              )}
            </button>

            {showNotif && (
              <NotificationPanel
                items={
                  notificationItems
                }
                onClose={() =>
                  setShowNotif(
                    false,
                  )
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Feed warning */}
      {feedError && (
        <div
          className="alert alert-warning d-flex align-items-center justify-content-between"
          style={{
            fontSize: 12,
          }}
        >
          <span>
            Some live dashboard
            activity could not be
            loaded.
          </span>

          <button
            type="button"
            className="btn btn-sm btn-outline-warning"
            onClick={() =>
              refetchFeed?.()
            }
          >
            Retry
          </button>
        </div>
      )}

      {/* ===================================================
          QUICK STATS
      =================================================== */}

      <div className="ad-qstats">
        <QuickStat
          icon="groups"
          label="Students"
          value={totalStudents}
          color="#1E40AF"
          bg="#EFF6FF"
          sparkData={
            studentTrend
          }
          trend="+24"
          trendDir="up"
        />

        <QuickStat
          icon="school"
          label="Teachers"
          value={totalStaff}
          color="#7C3AED"
          bg="#F5F3FF"
          sparkData={
            staffTrend
          }
          trend={
            s?.staff_on_leave != null
              ? `${formatNumber(
                  s.staff_on_leave,
                )} on leave`
              : undefined
          }
          trendDir="neutral"
        />

        <QuickStat
          icon="menu_book"
          label="Classes"
          value={totalClasses}
          color="#0EA5E9"
          bg="#F0F9FF"
          sparkData={
            classTrend
          }
          trend={
            s?.ongoing_classes !=
            null
              ? `${formatNumber(
                  s.ongoing_classes,
                )} ongoing`
              : undefined
          }
          trendDir="neutral"
        />

        <QuickStat
          icon="fact_check"
          label="Attendance"
          value={
            attendance > 0
              ? formatPercent(
                  attendance,
                )
              : "—"
          }
          color={
            attendanceColor
          }
          bg={
            attendanceBg
          }
          sparkData={
            attendanceTrend
          }
        />

        <QuickStat
          icon="payments"
          label="Revenue"
          value={
            collectedToday >
            0
              ? safeXaf(
                  collectedToday,
                )
              : "—"
          }
          color="#16A34A"
          bg="#F0FDF4"
          sparkData={
            revenueTrend
          }
          trend={
            s?.revenue_trend
              ? `${s.revenue_trend}`
              : undefined
          }
          trendDir={
            s?.revenue_trend_direction ||
            "up"
          }
        />

        <QuickStat
          icon="description"
          label="Pending Apps"
          value={
            pendingAdmissions
          }
          color="#DB2777"
          bg="#FDF2F8"
          sparkData={
            admissionsTrend
          }
          trend={
            pendingAdmissions >
            0
              ? "Needs review"
              : "All clear"
          }
          trendDir="neutral"
        />
      </div>

      {/* ===================================================
          MAIN KPIs
      =================================================== */}

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <KpiCard
            icon="groups"
            label="Total Enrollment"
            value={
              totalStudents
            }
            color="#1E40AF"
            bg="#EFF6FF"
            sparkData={
              studentTrend
            }
            trend={
              s?.enrollment_trend
                ? `${s.enrollment_trend}`
                : undefined
            }
            trendDir={
              s?.enrollment_trend_direction ||
              "up"
            }
            compare="vs last period"
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <KpiCard
            icon="badge"
            label="Faculty & Staff"
            value={totalStaff}
            color="#7C3AED"
            bg="#F5F3FF"
            sparkData={
              staffTrend
            }
            trend={
              s?.staff_status ||
              "Stable"
            }
            trendDir="neutral"
            hint="Teaching + support staff"
            badge={{
              cls:
                "ad-badge-gray",
              text:
                "Active",
            }}
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <KpiCard
            icon="fact_check"
            label="Attendance Average"
            value={
              attendance > 0
                ? formatPercent(
                    attendance,
                  )
                : "—"
            }
            color={
              attendanceColor
            }
            bg={
              attendanceBg
            }
            progress={
              attendance
            }
            progressColor={
              attendanceColor
            }
            badge={
              attendanceStatus
            }
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <KpiCard
            icon="payments"
            label="Today's Revenue"
            value={
              collectedToday >
              0
                ? safeXaf(
                    collectedToday,
                  )
                : "—"
            }
            color="#16A34A"
            bg="#F0FDF4"
            sparkData={
              revenueTrend
            }
            trend={
              s?.revenue_trend
                ? `${s.revenue_trend}`
                : undefined
            }
            trendDir={
              s?.revenue_trend_direction ||
              "up"
            }
            compare="vs previous period"
            badge={{
              cls:
                "ad-badge-blue",
              text:
                "Live",
            }}
          />
        </div>
      </div>

      {/* ===================================================
          QUICK ACTIONS / ADMISSIONS / FEES
      =================================================== */}

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-4">
          <div
            className="ad-card"
            style={{
              height: "100%",
            }}
          >
            <div className="ad-card-hd">
              <h2 className="ad-sec-title">
                <span
                  className="material-symbols-outlined"
                  style={{
                    color:
                      "var(--ad-primary)",
                  }}
                >
                  bolt
                </span>

                Quick Actions
              </h2>
            </div>

            <div
              style={{
                padding: 14,
              }}
            >
              <QuickActions />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div
            className="ad-card"
            style={{
              height: "100%",
            }}
          >
            <div className="ad-card-hd">
              <h2 className="ad-sec-title">
                <span
                  className="material-symbols-outlined"
                  style={{
                    color:
                      "var(--ad-info)",
                  }}
                >
                  how_to_reg
                </span>

                Admission Pipeline
              </h2>

              <div className="ad-live">
                <span className="ad-live-dot" />
                Live
              </div>
            </div>

            <div
              style={{
                padding:
                  "14px 18px 18px",
              }}
            >
              <AdmissionPipeline
                data={
                  s?.admission_pipeline
                }
              />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-3">
          <div
            className="ad-card"
            style={{
              height: "100%",
            }}
          >
            <div className="ad-card-hd">
              <h2 className="ad-sec-title">
                <span
                  className="material-symbols-outlined"
                  style={{
                    color:
                      "var(--ad-success)",
                  }}
                >
                  account_balance_wallet
                </span>

                Fee Collection
              </h2>
            </div>

            <div
              style={{
                padding:
                  "14px 18px 18px",
              }}
            >
              <FeeProgress
                collected={
                  feeCollected
                }
                goal={
                  feeGoal
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          ATTENTION / ANNOUNCEMENTS
      =================================================== */}

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-7">
          <h2
            className="ad-sec-title mb-3"
            style={{
              color:
                "var(--ad-warning)",
            }}
          >
            <span className="material-symbols-outlined">
              warning
            </span>

            Requires Attention
          </h2>

          <div className="ad-urgent">
            <UrgentCard
              sev="red"
              icon="person_off"
              iconBg="var(--ad-danger-50)"
              iconColor="var(--ad-danger)"
              title="Students Absent"
              desc="Marked absent today"
              count={formatNumber(
                absentToday,
              )}
              to="/attendance"
            />

            <UrgentCard
              sev="amber"
              icon="request_quote"
              iconBg="var(--ad-warning-50)"
              iconColor="var(--ad-warning)"
              title="Overdue Invoices"
              desc="Unpaid or partially paid"
              count={formatNumber(
                overdueInvoices,
              )}
              to="/finance"
            />

            <UrgentCard
              sev="blue"
              icon="description"
              iconBg="var(--ad-info-50)"
              iconColor="var(--ad-info)"
              title="Pending Admissions"
              desc="Applications to review"
              count={formatNumber(
                pendingAdmissions,
              )}
              to="/admissions"
            />

            <UrgentCard
              sev="purple"
              icon="gpp_maybe"
              iconBg="var(--ad-purple-50)"
              iconColor="var(--ad-purple)"
              title="Discipline Cases"
              desc="Recent incidents"
              count={formatNumber(
                disciplineCount,
              )}
              to="/students"
            />
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div
            className="ad-card"
            style={{
              height: "100%",
            }}
          >
            <div className="ad-card-hd">
              <h2 className="ad-sec-title">
                <span
                  className="material-symbols-outlined"
                  style={{
                    color:
                      "var(--ad-purple)",
                  }}
                >
                  campaign
                </span>

                Announcements
              </h2>

              <Link
                to="/notices"
                className="ad-link"
              >
                View All
              </Link>
            </div>

            <div
              style={{
                padding:
                  "4px 18px 14px",
              }}
            >
              <AnnouncementsCard
                items={
                  announcements
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          TEACHING / DISTRIBUTION / CALENDAR
      =================================================== */}

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-8">
          <div
            className="ad-card"
            style={{
              height: "100%",
            }}
          >
            <div className="ad-card-hd">
              <div className="ad-card-hd-col">
                <h2 className="ad-sec-title">
                  <span
                    className="material-symbols-outlined"
                    style={{
                      color:
                        "var(--ad-primary)",
                    }}
                  >
                    co_present
                  </span>

                  Teaching Today
                </h2>

                <div className="ad-sec-subtitle">
                  Live status across
                  all blocks{" "}
                  <span
                    className="ad-live"
                    style={{
                      marginLeft: 8,
                    }}
                  >
                    <span className="ad-live-dot" />
                    Live
                  </span>
                </div>
              </div>

              <Link
                to="/classes"
                className="ad-link"
              >
                View Schedule
              </Link>
            </div>

            {/* Desktop */}
            <div className="table-responsive d-none d-md-block">
              <table className="table table-clean align-middle mb-0">
                <thead>
                  <tr>
                    <th>
                      Teacher
                    </th>

                    <th>
                      Subject &amp;
                      Class
                    </th>

                    <th className="text-center">
                      Period
                    </th>

                    <th>
                      Topic
                    </th>

                    <th>
                      Attendance
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {teachingToday.map(
                    (
                      session,
                      index,
                    ) => {
                      const present =
                        toNumber(
                          session.present,
                        );

                      const absent =
                        toNumber(
                          session.absent,
                        );

                      const totalAttendance =
                        present +
                        absent;

                      return (
                        <tr
                          key={getItemId(
                            session,
                            index,
                          )}
                        >
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="ad-avatar">
                                {session.photo ? (
                                  <img
                                    src={
                                      session.photo
                                    }
                                    alt=""
                                  />
                                ) : (
                                  initials(
                                    session.teacher ||
                                      "Teacher",
                                  )
                                )}
                              </div>

                              <div>
                                <div
                                  className="fw-semibold"
                                  style={{
                                    fontSize: 13,
                                  }}
                                >
                                  {session.teacher ||
                                    "Teacher"}
                                </div>

                                <div
                                  className="text-secondary"
                                  style={{
                                    fontSize: 11,
                                  }}
                                >
                                  {session.role ||
                                    "Teacher"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className="ad-subject-pill">
                              {session.subject ||
                                "—"}
                            </span>

                            <div
                              className="text-secondary mt-1"
                              style={{
                                fontSize:
                                  11.5,
                              }}
                            >
                              {session.class ||
                                "—"}
                            </div>
                          </td>

                          <td className="text-center">
                            <span className="ad-period">
                              #
                              {session.period ??
                                "—"}
                            </span>
                          </td>

                          <td>
                            <span
                              className="ad-topic"
                              title={
                                session.lesson_topic ||
                                ""
                              }
                            >
                              {session.lesson_topic ||
                                "—"}
                            </span>
                          </td>

                          <td>
                            {totalAttendance >
                            0 ? (
                              <div className="ad-att">
                                <span className="ad-att-p">
                                  {present}{" "}
                                  Present
                                </span>

                                <span className="ad-att-a">
                                  {absent}{" "}
                                  Absent
                                </span>
                              </div>
                            ) : (
                              <span
                                className="text-secondary"
                                style={{
                                  fontSize:
                                    12,
                                }}
                              >
                                No
                                attendance
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    },
                  )}

                  {!teachingToday.length && (
                    <tr>
                      <td
                        colSpan={5}
                        className="state-cell"
                      >
                        No sessions
                        scheduled for
                        today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div
              className="ad-mobile-cards d-md-none"
              style={{
                padding: 12,
              }}
            >
              <TeachingMobileCards
                items={
                  teachingToday
                }
              />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="ad-card mb-3">
            <div className="ad-card-hd">
              <h2
                className="ad-sec-title"
                style={{
                  fontSize: 14,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    color: "#3b82f6",
                    fontSize: 18,
                  }}
                >
                  pie_chart
                </span>

                Student
                Distribution
              </h2>
            </div>

            <div
              style={{
                padding:
                  "12px 16px",
              }}
            >
              <StudentDistribution
                boys={s?.boys}
                girls={s?.girls}
                arts={s?.arts}
                science={
                  s?.science
                }
                technical={
                  s?.technical
                }
              />
            </div>
          </div>

          <div className="ad-card">
            <div
              className="ad-card-hd"
              style={{
                padding:
                  "12px 14px",
              }}
            >
              <h2
                className="ad-sec-title"
                style={{
                  fontSize: 13,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 16,
                    color:
                      "var(--ad-primary)",
                  }}
                >
                  calendar_month
                </span>

                Calendar
              </h2>
            </div>

            <div
              style={{
                padding:
                  "8px 14px 12px",
              }}
            >
              <CalendarWidget
                events={
                  s?.calendar_events
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          WEEKLY COLLECTION / ATTENDANCE / EXAMS
      =================================================== */}

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-5">
          <div
            className="ad-card"
            style={{
              height: "100%",
            }}
          >
            <div className="ad-card-hd">
              <h2
                className="ad-sec-title"
                style={{
                  fontSize: 14,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    color:
                      "var(--ad-primary)",
                  }}
                >
                  bar_chart
                </span>

                Weekly Collection
              </h2>
            </div>

            <div
              style={{
                padding:
                  "10px 16px 14px",
              }}
            >
              <WeeklyChart
                data={
                  s?.weekly_collection
                }
              />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div
            className="ad-card"
            style={{
              height: "100%",
            }}
          >
            <div className="ad-card-hd">
              <h2
                className="ad-sec-title"
                style={{
                  fontSize: 14,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    color:
                      "var(--ad-success)",
                  }}
                >
                  fact_check
                </span>

                Attendance
              </h2>
            </div>

            <div
              style={{
                padding:
                  "14px 16px",
              }}
            >
              <div className="ad-att-breakdown">
                <div className="ad-att-stat">
                  <div
                    className="ad-att-stat-val"
                    style={{
                      color:
                        "var(--ad-success)",
                    }}
                  >
                    {formatNumber(
                      s?.attendance_present,
                    )}
                  </div>

                  <div className="ad-att-stat-label">
                    Present
                  </div>
                </div>

                <div className="ad-att-stat">
                  <div
                    className="ad-att-stat-val"
                    style={{
                      color:
                        "var(--ad-danger)",
                    }}
                  >
                    {formatNumber(
                      s?.attendance_absent,
                    )}
                  </div>

                  <div className="ad-att-stat-label">
                    Absent
                  </div>
                </div>

                <div className="ad-att-stat">
                  <div
                    className="ad-att-stat-val"
                    style={{
                      color:
                        "var(--ad-warning)",
                    }}
                  >
                    {formatNumber(
                      s?.attendance_late,
                    )}
                  </div>

                  <div className="ad-att-stat-label">
                    Late
                  </div>
                </div>
              </div>

              <RevenueStreams
                data={
                  s?.revenue_streams
                }
                total={
                  s?.revenue_total
                }
              />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-3">
          <div
            className="ad-card"
            style={{
              height: "100%",
            }}
          >
            <div className="ad-sec-card">
              <div className="ad-sec-card-hd">
                <span
                  className="material-symbols-outlined"
                  style={{
                    color:
                      "var(--ad-danger)",
                  }}
                >
                  quiz
                </span>

                <span>
                  Upcoming Exams
                </span>
              </div>

              <ExamsCard
                items={
                  upcomingExams
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          ACTIVITY / DISCIPLINE
      =================================================== */}

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-5">
          <div
            className="ad-card"
            style={{
              height: "100%",
            }}
          >
            <div className="ad-card-hd">
              <h2 className="ad-sec-title">
                <span
                  className="material-symbols-outlined"
                  style={{
                    color:
                      "var(--ad-primary)",
                  }}
                >
                  receipt_long
                </span>

                Recent Activity
              </h2>

              <span className="ad-badge ad-badge-gray">
                Audit Log
              </span>
            </div>

            <div
              style={{
                padding:
                  "14px 18px",
              }}
            >
              <ActivityTimeline
                items={
                  recentActivity
                }
              />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div
            className="ad-card"
            style={{
              height: "100%",
            }}
          >
            <div className="ad-card-hd">
              <h2 className="ad-sec-title">
                <span
                  className="material-symbols-outlined"
                  style={{
                    color:
                      "var(--ad-warning)",
                  }}
                >
                  gpp_maybe
                </span>

                Recent Discipline
                Incidents
              </h2>

              <Link
                to="/students"
                className="ad-link"
              >
                View All
              </Link>
            </div>

            {/* Desktop */}
            <div className="table-responsive d-none d-md-block">
              <table className="table table-clean align-middle mb-0">
                <thead>
                  <tr>
                    <th>
                      Severity
                    </th>

                    <th>
                      Student &amp;
                      Case
                    </th>

                    <th>
                      Status
                    </th>

                    <th className="text-end">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {disciplineIncidents
                    .slice(0, 10)
                    .map(
                      (
                        incident,
                        index,
                      ) => (
                        <tr
                          key={getItemId(
                            incident,
                            index,
                          )}
                        >
                          <td>
                            <span
                              className={`pill ${
                                SEVERITY_PILL[
                                  incident
                                    .severity
                                ] ||
                                "pill-gray"
                              }`}
                            >
                              {incident.severity ||
                                "unknown"}
                            </span>
                          </td>

                          <td>
                            <div
                              className="fw-semibold"
                              style={{
                                fontSize:
                                  13,
                              }}
                            >
                              {incident.student ||
                                "Student"}
                            </div>

                            <div
                              className="text-secondary"
                              style={{
                                fontSize:
                                  11.5,
                              }}
                            >
                              {incident.title ||
                                "Discipline case"}

                              {incident.date
                                ? ` · ${incident.date}`
                                : ""}
                            </div>
                          </td>

                          <td>
                            <span
                              className={`pill ${
                                STATUS_PILL[
                                  incident
                                    .status
                                ] ||
                                "pill-gray"
                              }`}
                            >
                              {incident.status ||
                                "unknown"}
                            </span>
                          </td>

                          <td className="text-end">
                            <Link
                              to={
                                incident.id
                                  ? `/students/${incident.student_id || incident.id}`
                                  : "/students"
                              }
                              className="ad-eye"
                              title="View incident"
                              aria-label="View incident"
                            >
                              <span className="material-symbols-outlined">
                                visibility
                              </span>
                            </Link>
                          </td>
                        </tr>
                      ),
                    )}
                </tbody>
              </table>

              {!disciplineIncidents.length && (
                <div className="ad-empty">
                  <span className="material-symbols-outlined">
                    verified_user
                  </span>

                  <div className="t">
                    No incidents
                    recorded
                  </div>

                  <div className="d">
                    Everything looks
                    good.
                  </div>
                </div>
              )}
            </div>

            {/* Mobile */}
            <div
              className="ad-mobile-cards d-md-none"
              style={{
                padding: 12,
              }}
            >
              <DisciplineMobileCards
                items={
                  disciplineIncidents
                }
              />
            </div>

            {disciplineIncidents.length >
              0 && (
              <div className="ad-card-foot">
                <Link
                  to="/students"
                  className="ad-link"
                >
                  View All Incident
                  Records
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}