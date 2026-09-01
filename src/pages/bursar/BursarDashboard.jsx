// src/pages/bursar/BursarDashboard.jsx
// ============================================================
// CCAST SCHOOL MANAGEMENT SYSTEM
// BURSAR EXECUTIVE FINANCIAL DASHBOARD V3
// ============================================================

import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

import { useAuth } from '../../context/AuthContext';
import { useBursarStats } from '../../api/bursar';
import { xaf } from '../../components/ui/formatters';

import './BursarDashboard.css';

/* ============================================================
   ROUTES
============================================================ */

const BURSAR_ROUTES = {
  studentFees: '/bursar/student-fees',
  feeStructures: '/bursar/fee-structures',
  receipts: '/bursar/receipts',

  dailyCollection: '/bursar/reports/daily-collection',
  monthlyReport: '/bursar/reports/monthly',
  revenueReport: '/bursar/reports/revenue-summary',
  defaulters: '/bursar/reports/defaulters',

  notifications: '/bursar/notifications',
  calendar: '/calendar',

  dailyAccounts: '/bursar/reports/daily-accounts/income',
};

/* ============================================================
   COLORS
============================================================ */

const CATEGORY_COLORS = [
  '#059669',
  '#2563eb',
  '#7c3aed',
  '#f59e0b',
  '#dc2626',
  '#0891b2',
];

const OUTSTANDING_COLORS = {
  current: '#059669',
  due: '#f59e0b',
  overdue: '#dc2626',
};

const STATUS = {
  verified: ['Verified', 'bd-status-success'],
  pending: ['Pending', 'bd-status-warning'],
  flagged: ['Flagged', 'bd-status-danger'],
  failed: ['Failed', 'bd-status-danger'],
  cancelled: ['Cancelled', 'bd-status-neutral'],
};

/* ============================================================
   STATUS LABELS
============================================================ */

const STATUS_LABEL = {
  online: 'Online',
  offline: 'Offline',
  connected: 'Connected',
  up_to_date: 'Up to date',
  stale: 'Stale',
  never_run: 'Never run',
  healthy: 'Healthy',
  degraded: 'Degraded',
  operational: 'Operational',
};

/* ============================================================
   BAD SYSTEM STATUSES
============================================================ */

const BAD_STATUSES = [
  'offline',
  'stale',
  'never_run',
  'failed',
  'degraded',
];

/* ============================================================
   DEFAULT DASHBOARD DATA
============================================================ */

const EMPTY = {
  session: {
    year: '-',
    term: '-',
    date: '',
    day: '',
  },

  kpis: {
    today_collection: 0,
    today_change_pct: null,

    month_collection: 0,
    month_change_pct: null,

    outstanding: 0,
    outstanding_students: 0,

    total_revenue: 0,
    revenue_change_pct: null,

    expenses_month: 0,
  },

  collection_overview: [],

  collection_overview_total: 0,

  outstanding_overview: {
    current: 0,
    due: 0,
    overdue: 0,
    total: 0,
    students: 0,
  },

  performance: [],

  recent: [],

  defaulters: [],

  quick_summary: {
    total_students: 0,
    total_invoices: 0,
    total_receipts: 0,
    pending_invoices: 0,
    expenses_month: 0,
  },

  revenue_breakdown: [],

  monthly_comparison: [],

  cash_position: {
    cash_in_hand: 0,
    bank_balance: 0,
    total_available: 0,
    updated: '',
  },

  alerts: [],

  upcoming_events: [],

  system_status: [],
};

/* ============================================================
   HELPERS
============================================================ */

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const safeArray = (value) => {
  return Array.isArray(value)
    ? value
    : [];
};

const safeObject = (value, fallback = {}) => {
  return value &&
    typeof value === 'object' &&
    !Array.isArray(value)
    ? value
    : fallback;
};

const numberFormat = (value) => {
  return safeNumber(value).toLocaleString();
};

const compact = (value) => {
  const number = safeNumber(value);

  if (Math.abs(number) >= 1_000_000_000) {
    return `${(number / 1_000_000_000).toFixed(1)}B`;
  }

  if (Math.abs(number) >= 1_000_000) {
    return `${(number / 1_000_000).toFixed(1)}M`;
  }

  if (Math.abs(number) >= 1_000) {
    return `${(number / 1_000).toFixed(0)}K`;
  }

  return String(number);
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 17) {
    return 'Good afternoon';
  }

  return 'Good evening';
};

const getFirstName = (user) => {
  if (user?.first_name) {
    return user.first_name;
  }

  if (user?.name) {
    return (
      user.name
        .trim()
        .split(/\s+/)[0] || 'there'
    );
  }

  return 'there';
};

/* ============================================================
   DATE FORMATTER
============================================================ */

const formatEventDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

/* ============================================================
   DEEP NORMALIZATION
============================================================ */

const normalizeDashboardData = (apiData) => {
  const source = safeObject(apiData);

  const sourceKpis = safeObject(
    source.kpis
  );

  const sourceSession = safeObject(
    source.session
  );

  const sourceOutstanding = safeObject(
    source.outstanding_overview
  );

  const sourceQuickSummary = safeObject(
    source.quick_summary
  );

  const sourceCashPosition = safeObject(
    source.cash_position
  );

  const normalized = {
    ...EMPTY,

    session: {
      ...EMPTY.session,
      ...sourceSession,
    },

    kpis: {
      ...EMPTY.kpis,
      ...sourceKpis,
    },

    outstanding_overview: {
      ...EMPTY.outstanding_overview,
      ...sourceOutstanding,
    },

    quick_summary: {
      ...EMPTY.quick_summary,
      ...sourceQuickSummary,
    },

    cash_position: {
      ...EMPTY.cash_position,
      ...sourceCashPosition,
    },

    collection_overview: safeArray(
      source.collection_overview
    ),

    performance: safeArray(
      source.performance
    ),

    recent: safeArray(
      source.recent
    ),

    defaulters: safeArray(
      source.defaulters
    ),

    revenue_breakdown: safeArray(
      source.revenue_breakdown
    ),

    monthly_comparison: safeArray(
      source.monthly_comparison
    ),

    alerts: safeArray(
      source.alerts
    ),

    upcoming_events: safeArray(
      source.upcoming_events
    ),

    system_status: safeArray(
      source.system_status
    ),
  };

  return normalized;
};

/* ============================================================
   KPI CARD
============================================================ */

function KpiCard({
  tone = 'green',
  label,
  value,
  icon,
  changePct,
  sub,
  spark,
  sparkColor,
}) {
  const tones = {
    green: {
      color: '#059669',
      bg: '#ecfdf5',
    },

    blue: {
      color: '#2563eb',
      bg: '#eff6ff',
    },

    amber: {
      color: '#d97706',
      bg: '#fffbeb',
    },

    purple: {
      color: '#7c3aed',
      bg: '#faf5ff',
    },

    red: {
      color: '#dc2626',
      bg: '#fef2f2',
    },
  };

  const style =
    tones[tone] || tones.green;

  const hasChange =
    changePct !== null &&
    changePct !== undefined &&
    Number.isFinite(
      Number(changePct)
    );

  const change = safeNumber(
    changePct
  );

  const positive = change >= 0;

  return (
    <div className="bd-card bd-stat-card">
      <div className="bd-stat-top">
        <div
          className="bd-stat-icon"
          style={{
            background: style.bg,
            color: style.color,
          }}
        >
          <span className="material-symbols-outlined">
            {icon}
          </span>
        </div>

        <span className="bd-card-label">
          {label}
        </span>
      </div>

      <strong className="bd-stat-value">
        {value}
      </strong>

      {hasChange ? (
        <span
          className={`bd-stat-trend ${
            positive
              ? 'bd-trend-positive'
              : 'bd-trend-negative'
          }`}
        >
          <span className="material-symbols-outlined">
            {positive
              ? 'arrow_upward'
              : 'arrow_downward'}
          </span>

          {Math.abs(change)}%
          <span>
            {sub}
          </span>
        </span>
      ) : (
        sub && (
          <span className="bd-stat-sub">
            {sub}
          </span>
        )
      )}

      {safeArray(spark).length > 0 && (
        <div className="bd-stat-spark">
          <Sparkline
            data={spark}
            color={
              sparkColor ||
              style.color
            }
          />
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SPARKLINE
============================================================ */

function Sparkline({
  data,
  color,
}) {
  const chartData = safeArray(
    data
  ).map((value, index) => ({
    index,
    value: safeNumber(value),
  }));

  if (!chartData.length) {
    return null;
  }

  const gradientId = `spark-gradient-${String(
    color || 'green'
  ).replace(
    /[^a-zA-Z0-9]/g,
    ''
  )}`;

  return (
    <ResponsiveContainer
      width="100%"
      height={45}
    >
      <AreaChart
        data={chartData}
        margin={{
          top: 4,
          right: 0,
          bottom: 0,
          left: 0,
        }}
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor={color}
              stopOpacity={0.28}
            />

            <stop
              offset="100%"
              stopColor={color}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>

        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ============================================================
   DONUT CHART
============================================================ */

function DonutChart({
  data,
  total,
  centerLabel,
  centerSub,
  type = 'collection',
}) {
  const safeData = safeArray(
    data
  );

  if (!safeData.length) {
    return (
      <div className="bd-chart-empty">
        <span className="material-symbols-outlined">
          pie_chart
        </span>

        <span>
          No data available.
        </span>
      </div>
    );
  }

  return (
    <div className="bd-donut-wrap">
      <ResponsiveContainer
        width={175}
        height={175}
      >
        <PieChart>
          <Pie
            data={safeData}
            dataKey="amount"
            nameKey="name"
            innerRadius={55}
            outerRadius={78}
            paddingAngle={2}
            stroke="none"
          >
            {safeData.map(
              (item, index) => (
                <Cell
                  key={`${item.name || 'item'}-${index}`}
                  fill={
                    item.color ||
                    (type ===
                    'outstanding'
                      ? OUTSTANDING_COLORS[
                          item.key
                        ]
                      : CATEGORY_COLORS[
                          index %
                            CATEGORY_COLORS.length
                        ])
                  }
                />
              )
            )}
          </Pie>

          <Tooltip
            formatter={(value) =>
              xaf(value)
            }
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="bd-donut-label">
        <span>
          {centerLabel}
        </span>

        <strong>
          {total}
        </strong>

        {centerSub && (
          <small>
            {centerSub}
          </small>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SKELETON
============================================================ */

function SkeletonDashboard() {
  return (
    <div className="bd bd-loading">
      <div className="bd-row-top">
        <div className="bd-hero skeleton-box" />

        {[1, 2, 3, 4].map(
          (item) => (
            <div
              key={item}
              className="bd-card skeleton-box"
            />
          )
        )}
      </div>

      <div className="bd-row-mid">
        {[1, 2, 3].map(
          (item) => (
            <div
              key={item}
              className="bd-card skeleton-box bd-skeleton-large"
            />
          )
        )}
      </div>

      <div className="bd-row-three">
        {[1, 2, 3].map(
          (item) => (
            <div
              key={item}
              className="bd-card skeleton-box bd-skeleton-medium"
            />
          )
        )}
      </div>

      <div className="bd-row-four">
        {[1, 2, 3, 4].map(
          (item) => (
            <div
              key={item}
              className="bd-card skeleton-box bd-skeleton-small"
            />
          )
        )}
      </div>
    </div>
  );
}

/* ============================================================
   MAIN DASHBOARD
============================================================ */

export default function BursarDashboard() {
  const { user } = useAuth();

  const navigate =
    useNavigate();

  const {
    data: apiData,
    isLoading,
    isError,
  } = useBursarStats();

  const data = useMemo(
    () =>
      normalizeDashboardData(
        apiData
      ),
    [apiData]
  );

  /* ==========================================================
     KPI DATA
  ========================================================== */

  const k = data.kpis;

  /* ==========================================================
     FIRST NAME
  ========================================================== */

  const firstName =
    getFirstName(user);

  /* ==========================================================
     COLLECTION OVERVIEW
  ========================================================== */

  const collectionOverview =
    useMemo(() => {
      return data.collection_overview
        .map(
          (item, index) => ({
            name:
              item.name ||
              item.label ||
              'Other',

            amount: safeNumber(
              item.amount ??
                item.value ??
                item.collection
            ),

            pct:
              item.pct ??
              item.percentage ??
              null,

            color:
              item.color ||
              CATEGORY_COLORS[
                index %
                  CATEGORY_COLORS.length
              ],
          })
        )
        .filter(
          (item) =>
            item.amount > 0
        );
    }, [
      data.collection_overview,
    ]);

  /* ==========================================================
     COLLECTION TREND
  ========================================================== */

  const performanceData =
    useMemo(() => {
      return data.performance.map(
        (item) => ({
          month:
            item.label ??
            item.month ??
            item.period ??
            '-',

          value: safeNumber(
            item.value ??
              item.amount ??
              item.income ??
              item.collection
          ),
        })
      );
    }, [data.performance]);

  /* ==========================================================
     OUTSTANDING CHART
  ========================================================== */

  const outstandingChart =
    useMemo(() => {
      const overview =
        data.outstanding_overview;

      return [
        {
          key: 'current',
          name: 'Current (0–30 days)',
          amount: safeNumber(
            overview.current
          ),
          color:
            OUTSTANDING_COLORS.current,
        },

        {
          key: 'due',
          name: 'Due (31–60 days)',
          amount: safeNumber(
            overview.due
          ),
          color:
            OUTSTANDING_COLORS.due,
        },

        {
          key: 'overdue',
          name: 'Overdue (60+ days)',
          amount: safeNumber(
            overview.overdue
          ),
          color:
            OUTSTANDING_COLORS.overdue,
        },
      ].filter(
        (item) =>
          item.amount > 0
      );
    }, [
      data.outstanding_overview,
    ]);

  /* ==========================================================
     REVENUE BREAKDOWN
  ========================================================== */

  const revenueBreakdown =
    useMemo(() => {
      if (
        data.revenue_breakdown.length
      ) {
        return data.revenue_breakdown.map(
          (item, index) => ({
            label:
              item.label ||
              item.name ||
              'Other',

            pct: safeNumber(
              item.pct ??
                item.percentage
            ),

            value: safeNumber(
              item.value ??
                item.amount
            ),

            color:
              item.color ||
              CATEGORY_COLORS[
                index %
                  CATEGORY_COLORS.length
              ],
          })
        );
      }

      return collectionOverview;
    }, [
      data.revenue_breakdown,
      collectionOverview,
    ]);

  /* ==========================================================
     MONTHLY COMPARISON
  ========================================================== */

  const monthlyComparison =
    useMemo(() => {
      return data.monthly_comparison.map(
        (item) => ({
          month:
            item.month ??
            item.label ??
            item.period ??
            '-',

          thisYear: safeNumber(
            item.thisYear ??
              item.this_year ??
              item.current
          ),

          lastYear: safeNumber(
            item.lastYear ??
              item.last_year ??
              item.previous
          ),
        })
      );
    }, [
      data.monthly_comparison,
    ]);

  /* ==========================================================
     QUICK SUMMARY
  ========================================================== */

  const summary = data.quick_summary;

  /* ==========================================================
     LOADING
  ========================================================== */

  if (isLoading) {
    return (
      <SkeletonDashboard />
    );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="bd">

      {/* ====================================================
          ERROR / STALE DATA
      ==================================================== */}

      {isError && (
        <div
          className="bd-system-alert bd-system-alert-warning"
          role="alert"
        >
          <div className="bd-system-alert-icon">
            <span className="material-symbols-outlined">
              sync_problem
            </span>
          </div>

          <div className="bd-system-alert-content">
            <strong>
              Live figures could not
              be refreshed.
            </strong>

            <span>
              Showing the latest
              available dashboard
              data.
            </span>
          </div>

          <button
            type="button"
            className="bd-retry-btn"
            onClick={() =>
              window.location.reload()
            }
          >
            Retry
          </button>
        </div>
      )}

      {/* ====================================================
          ROW 1 — HERO + KPIs
      ==================================================== */}

      <div className="bd-row-top">

        {/* HERO */}

        <div className="bd-hero">
          <div className="bd-hero-content">

            <span className="bd-hero-eyebrow">
              Financial Overview
            </span>

            <h1>
              {getGreeting()},{' '}
              {firstName}! 👋
            </h1>

            <p>
              Here's what's happening
              with school finances
              today.
            </p>

            <div className="bd-hero-meta">

              <div>
                <span>
                  Academic Year
                </span>

                <strong>
                  {data.session.year ||
                    '-'}
                </strong>
              </div>

              <div>
                <span>
                  Term
                </span>

                <strong>
                  {data.session.term ||
                    '-'}
                </strong>
              </div>

              <div>
                <span>
                  Date
                </span>

                <strong>
                  {data.session.date ||
                    '-'}
                </strong>
              </div>

              {data.session.day && (
                <div>
                  <span>
                    Working Day
                  </span>

                  <strong>
                    {data.session.day}
                  </strong>
                </div>
              )}

            </div>
          </div>

          <div className="bd-hero-decoration">
            <span className="material-symbols-outlined">
              account_balance
            </span>
          </div>
        </div>

        {/* TODAY */}

        <KpiCard
          tone="green"
          icon="payments"
          label="Today's Collection"
          value={xaf(
            safeNumber(
              k.today_collection
            )
          )}
          changePct={
            k.today_change_pct
          }
          sub="vs yesterday"
          spark={
            k.today_spark ||
            k.today_collection_spark ||
            []
          }
          sparkColor="#22c55e"
        />

        {/* MONTH */}

        <KpiCard
          tone="blue"
          icon="calendar_month"
          label="This Month"
          value={xaf(
            safeNumber(
              k.month_collection
            )
          )}
          changePct={
            k.month_change_pct
          }
          sub="vs last month"
          spark={
            k.month_spark ||
            k.month_collection_spark ||
            []
          }
          sparkColor="#3b82f6"
        />

        {/* OUTSTANDING */}

        <KpiCard
          tone="amber"
          icon="warning"
          label="Outstanding Fees"
          value={xaf(
            safeNumber(
              k.outstanding
            )
          )}
          sub={`${numberFormat(
            k.outstanding_students
          )} students`}
          spark={
            k.outstanding_spark ||
            []
          }
          sparkColor="#f59e0b"
        />

        {/* REVENUE */}

        <KpiCard
          tone="purple"
          icon="account_balance_wallet"
          label="Revenue YTD"
          value={xaf(
            safeNumber(
              k.total_revenue
            )
          )}
          changePct={
            k.revenue_change_pct
          }
          sub="vs last year"
          spark={
            k.revenue_spark ||
            []
          }
          sparkColor="#8b5cf6"
        />
      </div>

      {/* ====================================================
          ROW 2 — CORE FINANCIAL ANALYTICS
      ==================================================== */}

      <div className="bd-row-mid">

        {/* COLLECTION OVERVIEW */}

        <div className="bd-card">

          <div className="bd-card-header">

            <div>
              <h3>
                Collection Overview
              </h3>

              <span className="bd-header-sub">
                This Month
              </span>
            </div>

            <Link
              to={
                BURSAR_ROUTES.revenueReport
              }
              className="bd-view-all"
            >
              Report
            </Link>

          </div>

          {!collectionOverview.length ? (
            <EmptyState
              icon="payments"
              title="No collections yet"
              message="Collection data will appear here once payments are recorded."
            />
          ) : (
            <div className="bd-donut-split">

              <DonutChart
                data={
                  collectionOverview
                }
                total={xaf(
                  data.collection_overview_total
                )}
                centerLabel="Collected"
                centerSub="This Month"
              />

              <div className="bd-legend-list">

                {collectionOverview.map(
                  (item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="bd-legend-row"
                    >

                      <span
                        className="bd-legend-dot"
                        style={{
                          background:
                            item.color,
                        }}
                      />

                      <div className="bd-legend-info">

                        <div className="bd-legend-name">
                          {item.name}
                        </div>

                        <div className="bd-legend-value">
                          {xaf(
                            item.amount
                          )}
                        </div>

                      </div>

                      {item.pct !=
                        null && (
                        <span className="bd-legend-pct">
                          {item.pct}%
                        </span>
                      )}

                    </div>
                  )
                )}

              </div>

            </div>
          )}

          <Link
            to={
              BURSAR_ROUTES.dailyCollection
            }
            className="bd-view-link"
          >
            View Full Collection
            Report →
          </Link>

        </div>

        {/* COLLECTION TREND */}

        <div className="bd-card">

          <div className="bd-card-header">

            <div>
              <h3>
                Collection Trend
              </h3>

              <span className="bd-header-sub">
                This Term
              </span>
            </div>

            <Link
              to={
                BURSAR_ROUTES.monthlyReport
              }
              className="bd-view-all"
            >
              Analysis
            </Link>

          </div>

          {!performanceData.length ? (
            <EmptyState
              icon="show_chart"
              title="No trend available"
              message="Collection performance will appear once transactions are recorded."
            />
          ) : (
            <div className="bd-main-chart">

              <ResponsiveContainer
                width="100%"
                height={230}
              >
                <AreaChart
                  data={
                    performanceData
                  }
                  margin={{
                    left: -20,
                    right: 10,
                    top: 10,
                    bottom: 0,
                  }}
                >

                  <defs>
                    <linearGradient
                      id="bdTrendGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#059669"
                        stopOpacity={0.25}
                      />

                      <stop
                        offset="100%"
                        stopColor="#059669"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#eef2f7"
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    tickFormatter={
                      compact
                    }
                    axisLine={false}
                    tickLine={false}
                    width={45}
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <Tooltip
                    formatter={(value) =>
                      xaf(value)
                    }
                  />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fill="url(#bdTrendGradient)"
                    dot={{
                      r: 4,
                      fill: '#ffffff',
                      stroke:
                        '#059669',
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 6,
                    }}
                  />

                </AreaChart>
              </ResponsiveContainer>

            </div>
          )}

          <Link
            to={
              BURSAR_ROUTES.monthlyReport
            }
            className="bd-view-link"
          >
            View Trend Analysis →
          </Link>

        </div>

        {/* OUTSTANDING */}

        <div className="bd-card">

          <div className="bd-card-header">

            <div>
              <h3>
                Outstanding Overview
              </h3>

              <span className="bd-header-sub">
                By ageing
              </span>
            </div>

          </div>

          {!outstandingChart.length ? (
            <EmptyState
              icon="verified"
              title="No outstanding balances"
              message="All recorded student balances are currently settled."
              success
            />
          ) : (
            <div className="bd-donut-split">

              <DonutChart
                data={
                  outstandingChart
                }
                total={xaf(
                  data.outstanding_overview.total
                )}
                centerLabel="Outstanding"
                centerSub={`${numberFormat(
                  data
                    .outstanding_overview
                    .students ||
                    k.outstanding_students
                )} students`}
                type="outstanding"
              />

              <div className="bd-legend-list">

                {outstandingChart.map(
                  (item) => (
                    <div
                      key={item.key}
                      className="bd-legend-row"
                    >

                      <span
                        className="bd-legend-dot"
                        style={{
                          background:
                            item.color,
                        }}
                      />

                      <div className="bd-legend-info">
                        <div className="bd-legend-name">
                          {item.name}
                        </div>
                      </div>

                      <strong
                        className="bd-legend-value-strong"
                        style={{
                          color:
                            item.color,
                        }}
                      >
                        {xaf(
                          item.amount
                        )}
                      </strong>

                    </div>
                  )
                )}

              </div>

            </div>
          )}

          <Link
            to={
              BURSAR_ROUTES.defaulters
            }
            className="bd-view-link"
          >
            View Defaulters →
          </Link>

        </div>
      </div>

      {/* ====================================================
          ROW 3 — TRANSACTIONS / DEFAULTERS / SUMMARY
      ==================================================== */}

      <div className="bd-row-three">

        {/* TRANSACTIONS */}

        <div className="bd-card bd-transactions-card">

          <div className="bd-card-header">

            <h3>
              Recent Transactions
            </h3>

            <Link
              to={
                BURSAR_ROUTES.receipts
              }
              className="bd-view-all"
            >
              View All
            </Link>

          </div>

          <div className="bd-table-wrap">

            <table className="bd-table">

              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Reference</th>
                  <th>Payer</th>
                  <th className="text-end">
                    Amount
                  </th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>

                {!data.recent.length ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="bd-state-cell"
                    >
                      <span className="material-symbols-outlined">
                        receipt_long
                      </span>

                      No recent
                      transactions.
                    </td>
                  </tr>
                ) : (
                  data.recent.map(
                    (
                      transaction,
                      index
                    ) => {
                      const type =
                        transaction.type ||
                        'Transaction';

                      const typeClass =
                        type
                          .toLowerCase()
                          .replace(
                            /\s+/g,
                            '-'
                          );

                      const status =
                        transaction.status ||
                        'verified';

                      const statusConfig =
                        STATUS[status] ||
                        [
                          status,
                          'bd-status-neutral',
                        ];

                      const amount =
                        safeNumber(
                          transaction.amount
                        );

                      const isExpense =
                        type
                          .toLowerCase()
                          .includes(
                            'expense'
                          );

                      return (
                        <tr
                          key={
                            transaction.id ||
                            transaction.reference ||
                            index
                          }
                        >

                          <td>
                            <span
                              className={`bd-type-badge bd-type-${typeClass}`}
                            >
                              {type}
                            </span>
                          </td>

                          <td>
                            <div className="bd-transaction-description">
                              {transaction.description ||
                                transaction.desc ||
                                '-'}
                            </div>

                            <div className="bd-transaction-sub">
                              {transaction.student ||
                                transaction.payer ||
                                'School account'}
                            </div>
                          </td>

                          <td className="bd-td-meta">
                            {transaction.receipt ||
                              transaction.reference ||
                              transaction.ref ||
                              '-'}
                          </td>

                          <td className="bd-td-payer">
                            {transaction.payer ||
                              transaction.student ||
                              '-'}
                          </td>

                          <td
                            className={`text-end ${
                              isExpense
                                ? 'bd-amount-neg'
                                : 'bd-amount-pos'
                            }`}
                          >
                            {isExpense
                              ? '-'
                              : ''}
                            {xaf(
                              amount
                            )}
                          </td>

                          <td>
                            <div className="bd-td-meta">
                              {transaction.date ||
                                transaction.when ||
                                '-'}
                            </div>

                            {transaction.status && (
                              <span
                                className={`bd-mini-status ${statusConfig[1]}`}
                              >
                                {statusConfig[0]}
                              </span>
                            )}
                          </td>

                        </tr>
                      );
                    }
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* DEFAULTERS */}

        <div className="bd-card">

          <div className="bd-card-header">

            <h3>
              Top Defaulters
            </h3>

            <Link
              to={
                BURSAR_ROUTES.defaulters
              }
              className="bd-view-all"
            >
              View All
            </Link>

          </div>

          <div className="bd-defaulters-table">

            <div className="bd-defaulters-head">
              <span>
                STUDENT
              </span>

              <span>
                CLASS
              </span>

              <span>
                OUTSTANDING
              </span>
            </div>

            {!data.defaulters.length ? (
              <div className="bd-empty-inline">
                <span className="material-symbols-outlined">
                  verified
                </span>

                No outstanding
                students.
              </div>
            ) : (
              data.defaulters
                .slice(0, 6)
                .map(
                  (
                    student,
                    index
                  ) => (
                    <div
                      key={
                        student.id ||
                        student.admission_number ||
                        index
                      }
                      className="bd-defaulter-row"
                    >

                      <div className="bd-defaulter-name">

                        <span className="bd-defaulter-avatar">
                          <span className="material-symbols-outlined">
                            person
                          </span>
                        </span>

                        <div>
                          <strong>
                            {student.name ||
                              student.student_name ||
                              '-'}
                          </strong>

                          {student.admission_number && (
                            <small>
                              {
                                student.admission_number
                              }
                            </small>
                          )}
                        </div>

                      </div>

                      <span className="bd-defaulter-class">
                        {student.class ||
                          student.class_name ||
                          '-'}
                      </span>

                      <span className="bd-defaulter-amount">
                        {xaf(
                          safeNumber(
                            student.amount ??
                              student.outstanding
                          )
                        )}
                      </span>

                    </div>
                  )
                )
            )}

          </div>

          <Link
            to={
              BURSAR_ROUTES.defaulters
            }
            className="bd-view-link"
          >
            View Defaulters Report →
          </Link>

        </div>

        {/* QUICK SUMMARY */}

        <div className="bd-card">

          <div className="bd-card-header">
            <h3>
              Quick Summary
            </h3>
          </div>

          <div className="bd-summary-list">

            <SummaryRow
              icon="groups"
              label="Total Students"
              value={numberFormat(
                summary.total_students
              )}
              tone="green"
            />

            <SummaryRow
              icon="receipt_long"
              label="Total Invoices"
              value={numberFormat(
                summary.total_invoices
              )}
              tone="blue"
            />

            <SummaryRow
              icon="payments"
              label="Total Receipts"
              value={numberFormat(
                summary.total_receipts
              )}
              tone="purple"
            />

            <SummaryRow
              icon="pending_actions"
              label="Pending Invoices"
              value={numberFormat(
                summary.pending_invoices
              )}
              tone="amber"
            />

            <SummaryRow
              icon="shopping_cart"
              label="Expenses This Month"
              value={xaf(
                safeNumber(
                  summary.expenses_month ??
                    k.expenses_month
                )
              )}
              tone="red"
              danger
            />

          </div>

        </div>

      </div>

      {/* ====================================================
          ROW 4 — REVENUE / COMPARISON / CASH / ALERTS
      ==================================================== */}

      <div className="bd-row-four">

        {/* REVENUE BREAKDOWN */}

        <div className="bd-card">

          <div className="bd-card-header">

            <div>
              <h3>
                Revenue Breakdown
              </h3>

              <span className="bd-header-sub">
                This Term
              </span>
            </div>

            <Link
              to={
                BURSAR_ROUTES.revenueReport
              }
              className="bd-view-all"
            >
              View Report
            </Link>

          </div>

          {!revenueBreakdown.length ? (
            <EmptyState
              icon="pie_chart"
              title="No revenue data"
              message="Revenue breakdown will appear when collections are recorded."
            />
          ) : (
            <div className="bd-breakdown-list">

              {revenueBreakdown.map(
                (item, index) => (
                  <div
                    key={`${item.label}-${index}`}
                    className="bd-breakdown-row"
                  >

                    <div className="bd-breakdown-top">
                      <span>
                        {item.label}
                      </span>

                      <strong>
                        {item.pct}%
                      </strong>
                    </div>

                    <div className="bd-breakdown-bar">
                      <div
                        className="bd-breakdown-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              item.pct
                            )
                          )}%`,

                          background:
                            item.color,
                        }}
                      />
                    </div>

                    <div className="bd-breakdown-value">
                      {xaf(
                        item.value
                      )}
                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>

        {/* MONTHLY COMPARISON */}

        <div className="bd-card">

          <div className="bd-card-header">

            <div>
              <h3>
                Monthly Collection
                Comparison
              </h3>

              <span className="bd-header-sub">
                This Year vs Last Year
              </span>
            </div>

            <Link
              to={
                BURSAR_ROUTES.monthlyReport
              }
              className="bd-view-all"
            >
              Report
            </Link>

          </div>

          {monthlyComparison.length ===
          0 ? (
            <EmptyState
              icon="bar_chart"
              title="No comparison data"
              message="Year-over-year collection data will appear here."
            />
          ) : (
            <>
              <div className="bd-inline-legend">

                <span>
                  <i
                    style={{
                      background:
                        '#059669',
                    }}
                  />

                  This Year
                </span>

                <span>
                  <i
                    style={{
                      background:
                        '#cbd5e1',
                    }}
                  />

                  Last Year
                </span>

              </div>

              <ResponsiveContainer
                width="100%"
                height={215}
              >
                <BarChart
                  data={
                    monthlyComparison
                  }
                  margin={{
                    left: -20,
                    right: 5,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#eef2f7"
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    tickFormatter={
                      compact
                    }
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <Tooltip
                    formatter={(value) =>
                      xaf(value)
                    }
                  />

                  <Bar
                    dataKey="lastYear"
                    fill="#cbd5e1"
                    radius={[
                      4,
                      4,
                      0,
                      0,
                    ]}
                  />

                  <Bar
                    dataKey="thisYear"
                    fill="#059669"
                    radius={[
                      4,
                      4,
                      0,
                      0,
                    ]}
                  />

                </BarChart>
              </ResponsiveContainer>
            </>
          )}

        </div>

        {/* CASH POSITION */}

        <div className="bd-card">

          <div className="bd-card-header">

            <div>
              <h3>
                Cash Position
              </h3>

              <span className="bd-header-sub">
                Current financial
                position
              </span>
            </div>

            <Link
              to={
                BURSAR_ROUTES.dailyAccounts
              }
              className="bd-view-all"
            >
              Details
            </Link>

          </div>

          <div className="bd-cash-primary">

            <span>
              Cash in Hand
            </span>

            <strong>
              {xaf(
                safeNumber(
                  data.cash_position
                    .cash_in_hand
                )
              )}
            </strong>

            {data.cash_position
              .updated && (
              <small>
                Updated:{' '}
                {
                  data
                    .cash_position
                    .updated
                }
              </small>
            )}

          </div>

          <div className="bd-cash-row">

            <div>
              <span className="bd-cash-icon">
                <span className="material-symbols-outlined">
                  account_balance
                </span>
              </span>

              <span>
                Bank Balance
              </span>
            </div>

            <strong>
              {xaf(
                safeNumber(
                  data.cash_position
                    .bank_balance
                )
              )}
            </strong>

          </div>

          <div className="bd-cash-row">

            <div>
              <span className="bd-cash-icon">
                <span className="material-symbols-outlined">
                  payments
                </span>
              </span>

              <span>
                Total Available
              </span>
            </div>

            <strong>
              {xaf(
                safeNumber(
                  data.cash_position
                    .total_available
                )
              )}
            </strong>

          </div>

        </div>

        {/* ALERTS */}

        <div className="bd-card">

          <div className="bd-card-header">

            <h3>
              Alerts &
              Notifications
            </h3>

            <Link
              to={
                BURSAR_ROUTES.notifications
              }
              className="bd-view-all"
            >
              View All
            </Link>

          </div>

          <div className="bd-alerts-list">

            {!data.alerts.length ? (
              <div className="bd-empty-inline">
                <span className="material-symbols-outlined">
                  notifications_none
                </span>

                Nothing needs
                your attention.
              </div>
            ) : (
              data.alerts
                .slice(0, 5)
                .map(
                  (
                    alert,
                    index
                  ) => (
                    <div
                      key={
                        alert.id ||
                        index
                      }
                      className="bd-alert-row"
                    >

                      <div
                        className="bd-alert-icon"
                        style={{
                          background:
                            alert.bg ||
                            '#eff6ff',

                          color:
                            alert.color ||
                            '#2563eb',
                        }}
                      >
                        <span className="material-symbols-outlined">
                          {alert.icon ||
                            'info'}
                        </span>
                      </div>

                      <div className="bd-alert-info">

                        <div className="bd-alert-text">
                          {alert.text ||
                            alert.title ||
                            '-'}
                        </div>

                        {alert.meta && (
                          <div className="bd-alert-meta">
                            {alert.meta}
                          </div>
                        )}

                      </div>

                      <span className="bd-alert-when">
                        {alert.when ||
                          ''}
                      </span>

                    </div>
                  )
                )
            )}

          </div>

        </div>

      </div>

      {/* ====================================================
          ROW 5 — EVENTS / SHORTCUTS / SYSTEM STATUS
      ==================================================== */}

      <div className="bd-row-five">

        {/* EVENTS */}

        <div className="bd-card">

          <div className="bd-card-header">

            <h3>
              Upcoming Events
            </h3>

            <Link
              to={
                BURSAR_ROUTES.calendar
              }
              className="bd-view-all"
            >
              Calendar
            </Link>

          </div>

          <div className="bd-events-list">

            {!data.upcoming_events
              .length ? (
              <div className="bd-empty-inline">
                <span className="material-symbols-outlined">
                  event
                </span>

                No upcoming
                events.
              </div>
            ) : (
              data.upcoming_events
                .slice(0, 5)
                .map(
                  (
                    event,
                    index
                  ) => {
                    const date =
                      formatEventDate(
                        event.date
                      );

                    return (
                      <div
                        key={
                          event.id ||
                          index
                        }
                        className="bd-event-row"
                      >

                        <div className="bd-event-date">

                          <span>
                            {date
                              ? date
                                  .toLocaleDateString(
                                    undefined,
                                    {
                                      month:
                                        'short',
                                    }
                                  )
                                  .toUpperCase()
                              : '-'}
                          </span>

                          <strong>
                            {date
                              ? date.getDate()
                              : '-'}
                          </strong>

                        </div>

                        <div>

                          <strong className="bd-event-title">
                            {event.title ||
                              event.name ||
                              '-'}
                          </strong>

                          {date && (
                            <span className="bd-event-meta">
                              {date.toLocaleDateString(
                                undefined,
                                {
                                  weekday:
                                    'long',
                                  year: 'numeric',
                                  month:
                                    'long',
                                  day: 'numeric',
                                }
                              )}
                            </span>
                          )}

                        </div>

                      </div>
                    );
                  }
                )
            )}

          </div>

        </div>

        {/* SHORTCUTS */}

        <div className="bd-card">

          <div className="bd-card-header">
            <h3>
              Quick Actions
            </h3>
          </div>

          <div className="bd-shortcuts-grid">

            <Shortcut
              icon="person_search"
              label="Search Student"
              onClick={() =>
                navigate(
                  BURSAR_ROUTES.studentFees
                )
              }
            />

            <Shortcut
              icon="account_balance"
              label="Fee Structure"
              onClick={() =>
                navigate(
                  BURSAR_ROUTES.feeStructures
                )
              }
            />

            <Shortcut
              icon="receipt_long"
              label="Receipts"
              onClick={() =>
                navigate(
                  BURSAR_ROUTES.receipts
                )
              }
            />

            <Shortcut
              icon="bar_chart"
              label="Monthly Report"
              onClick={() =>
                navigate(
                  BURSAR_ROUTES.monthlyReport
                )
              }
            />

            <Shortcut
              icon="summarize"
              label="Revenue Report"
              onClick={() =>
                navigate(
                  BURSAR_ROUTES.revenueReport
                )
              }
            />

            <Shortcut
              icon="warning"
              label="Defaulters"
              onClick={() =>
                navigate(
                  BURSAR_ROUTES.defaulters
                )
              }
            />

          </div>

        </div>

        {/* SYSTEM STATUS */}

        <div className="bd-card">

          <div className="bd-card-header">
            <h3>
              System Status
            </h3>
          </div>

          <div className="bd-status-list">

            {!data.system_status
              .length ? (
              <div className="bd-empty-inline">
                <span className="material-symbols-outlined">
                  monitoring
                </span>

                No status
                information.
              </div>
            ) : (
              data.system_status.map(
                (
                  status,
                  index
                ) => {
                  const currentStatus =
                    status.status ||
                    'unknown';

                  const bad =
                    BAD_STATUSES.includes(
                      currentStatus
                    );

                  const label =
                    status.detail ??
                    STATUS_LABEL[
                      currentStatus
                    ] ??
                    currentStatus;

                  return (
                    <div
                      key={
                        status.id ||
                        index
                      }
                      className="bd-status-row"
                    >

                      <span
                        className={`bd-status-dot ${
                          bad
                            ? 'danger'
                            : 'success'
                        }`}
                      />

                      <span className="bd-status-name">
                        {status.name ||
                          'System'}
                      </span>

                      <strong
                        className={
                          bad
                            ? 'danger'
                            : 'success'
                        }
                      >
                        {label}
                      </strong>

                    </div>
                  );
                }
              )
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

/* ============================================================
   SUMMARY ROW
============================================================ */

function SummaryRow({
  icon,
  label,
  value,
  tone = 'green',
  danger = false,
}) {
  const tones = {
    green: {
      background:
        '#ecfdf5',
      color:
        '#059669',
    },

    blue: {
      background:
        '#eff6ff',
      color:
        '#2563eb',
    },

    purple: {
      background:
        '#f5f3ff',
      color:
        '#7c3aed',
    },

    amber: {
      background:
        '#fffbeb',
      color:
        '#d97706',
    },

    red: {
      background:
        '#fef2f2',
      color:
        '#dc2626',
    },
  };

  const style =
    tones[tone] ||
    tones.green;

  return (
    <div className="bd-summary-row">

      <div
        className="bd-summary-icon"
        style={{
          background:
            style.background,
          color:
            style.color,
        }}
      >
        <span className="material-symbols-outlined">
          {icon}
        </span>
      </div>

      <span className="bd-summary-label">
        {label}
      </span>

      <strong
        className={`bd-summary-value ${
          danger
            ? 'danger'
            : ''
        }`}
      >
        {value}
      </strong>

    </div>
  );
}

/* ============================================================
   SHORTCUT
============================================================ */

function Shortcut({
  icon,
  label,
  onClick,
}) {
  return (
    <button
      type="button"
      className="bd-shortcut-btn"
      onClick={onClick}
    >
      <span className="bd-shortcut-icon">
        <span className="material-symbols-outlined">
          {icon}
        </span>
      </span>

      <span className="bd-shortcut-label">
        {label}
      </span>

      <span className="material-symbols-outlined bd-shortcut-arrow">
        arrow_forward
      </span>
    </button>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({
  icon = 'info',
  title = 'No data',
  message = '',
  success = false,
}) {
  return (
    <div
      className={`bd-empty-state ${
        success
          ? 'bd-empty-success'
          : ''
      }`}
    >
      <span className="material-symbols-outlined">
        {icon}
      </span>

      <strong>
        {title}
      </strong>

      {message && (
        <span>
          {message}
        </span>
      )}
    </div>
  );
}