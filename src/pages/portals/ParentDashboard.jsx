// src/pages/portals/ParentDashboard.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { useAuth } from '../../context/AuthContext';
import {
  useParentDashboard,
  useParentChildren,
} from '../../api/dashboard';

import Avatar from '../../components/Avatar';
import { xaf } from '../../components/ui/formatters';

import './ParentDashboard.css';

/* =========================================================
   CONSTANTS
========================================================= */

const COLORS = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  purple: '#7c3aed',
  cyan: '#0891b2',
  pink: '#db2777',
  indigo: '#4f46e5',
  slate: '#64748b',
};

const DEFAULT_ACADEMIC_YEAR = '2026/2027';
const DEFAULT_TERM = 'Term II';

/* =========================================================
   FALLBACK DATA
   Only used for missing dashboard sections.
   Avoid personal/demo identities here.
========================================================= */

const EMPTY_DASHBOARD = {
  attendance: {
    rate: 0,
    present: 0,
    absent: 0,
    late: 0,
    ytdRate: 0,
  },

  academic: {
    average: 0,
    max: 20,
    className: '—',
  },

  fees: {
    total: 0,
    paid: 0,
    balance: 0,
    dueDate: null,
    percentPaid: 0,
  },

  homework: {
    pending: 0,
    completed: 0,
  },

  exams: {
    upcoming: 0,
    period: 'Current Term',
  },

  discipline: {
    status: 'No Record',
    note: 'No discipline information available',
  },

  library: {
    borrowed: 0,
    overdue: 0,
  },

  messages: {
    unread: 0,
  },

  attendanceMonthly: [],
  subjectPerformance: [],
  performanceTrend: [],
  upcomingEvents: [],
  homeworkList: [],
  timetableToday: [],
  notices: [],
  messagesList: [],
  recentActivities: [],
  notificationsList: [],
};

/* =========================================================
   QUICK ACTIONS
========================================================= */

const QUICK_ACTIONS = [
  {
    icon: 'payments',
    label: 'Pay School Fees',
    to: '/parent/fees/pay',
  },
  {
    icon: 'grade',
    label: 'View Results',
    to: '/parent/results',
  },
  {
    icon: 'download',
    label: 'Report Card',
    to: '/parent/report-cards',
  },
  {
    icon: 'chat',
    label: 'Message Teacher',
    to: '/parent/messages/new',
  },
  {
    icon: 'schedule',
    label: 'View Timetable',
    to: '/parent/timetable',
  },
  {
    icon: 'fact_check',
    label: 'Attendance',
    to: '/parent/attendance',
  },
  {
    icon: 'calendar_month',
    label: 'School Calendar',
    to: '/parent/school-calendar',
  },
  {
    icon: 'report',
    label: 'Submit Complaint',
    to: '/parent/complaints',
  },
];

/* =========================================================
   HELPERS
========================================================= */

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';

  return 'Good Evening';
}

function mergeDashboardData(apiData) {
  return {
    ...EMPTY_DASHBOARD,
    ...(apiData || {}),

    attendance: {
      ...EMPTY_DASHBOARD.attendance,
      ...(apiData?.attendance || {}),
    },

    academic: {
      ...EMPTY_DASHBOARD.academic,
      ...(apiData?.academic || {}),
    },

    fees: {
      ...EMPTY_DASHBOARD.fees,
      ...(apiData?.fees || {}),
    },

    homework: {
      ...EMPTY_DASHBOARD.homework,
      ...(apiData?.homework || {}),
    },

    exams: {
      ...EMPTY_DASHBOARD.exams,
      ...(apiData?.exams || {}),
    },

    discipline: {
      ...EMPTY_DASHBOARD.discipline,
      ...(apiData?.discipline || {}),
    },

    library: {
      ...EMPTY_DASHBOARD.library,
      ...(apiData?.library || {}),
    },

    messages: {
      ...EMPTY_DASHBOARD.messages,
      ...(apiData?.messages || {}),
    },

    attendanceMonthly: Array.isArray(apiData?.attendanceMonthly)
      ? apiData.attendanceMonthly
      : [],

    subjectPerformance: Array.isArray(apiData?.subjectPerformance)
      ? apiData.subjectPerformance
      : [],

    performanceTrend: Array.isArray(apiData?.performanceTrend)
      ? apiData.performanceTrend
      : [],

    upcomingEvents: Array.isArray(apiData?.upcomingEvents)
      ? apiData.upcomingEvents
      : [],

    homeworkList: Array.isArray(apiData?.homeworkList)
      ? apiData.homeworkList
      : [],

    timetableToday: Array.isArray(apiData?.timetableToday)
      ? apiData.timetableToday
      : [],

    notices: Array.isArray(apiData?.notices)
      ? apiData.notices
      : [],

    messagesList: Array.isArray(apiData?.messagesList)
      ? apiData.messagesList
      : [],

    recentActivities: Array.isArray(apiData?.recentActivities)
      ? apiData.recentActivities
      : [],

    notificationsList: Array.isArray(apiData?.notificationsList)
      ? apiData.notificationsList
      : [],
  };
}

/* =========================================================
   SKELETON
========================================================= */

function ParentDashboardSkeleton() {
  return (
    <div className="pd2 pd2-loading">

      <div className="pd2-row-top">
        <div className="skeleton pd2-skeleton-welcome" />

        <div className="skeleton pd2-skeleton-card" />

        <div className="skeleton pd2-skeleton-card" />
      </div>

      <div className="pd2-stats-grid">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="skeleton"
            style={{ height: 100, borderRadius: 14 }}
          />
        ))}
      </div>

      <div className="pd2-charts-grid">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="skeleton"
            style={{ height: 290, borderRadius: 14 }}
          />
        ))}
      </div>

      <div className="pd2-widgets-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="skeleton"
            style={{ height: 240, borderRadius: 14 }}
          />
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  icon = 'inbox',
  title,
  message,
  action,
  to,
}) {
  return (
    <div className="pd2-empty-state">

      <span className="material-symbols-outlined">
        {icon}
      </span>

      <strong>{title}</strong>

      {message && (
        <p>{message}</p>
      )}

      {action && to && (
        <Link
          to={to}
          className="pd2-btn-outline"
        >
          {action}
        </Link>
      )}
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function ParentDashboard() {

  const { user } = useAuth();

  const [selectedChildId, setSelectedChildId] = useState(null);
  const [childMenuOpen, setChildMenuOpen] = useState(false);

  const childMenuRef = useRef(null);

  /* -------------------------------------------------------
     CHILDREN
  ------------------------------------------------------- */

  const {
    data: childrenData,
    isLoading: childrenLoading,
    isError: childrenError,
    refetch: refetchChildren,
  } = useParentChildren();

  const children = useMemo(() => {
    if (Array.isArray(childrenData)) {
      return childrenData;
    }

    if (Array.isArray(childrenData?.children)) {
      return childrenData.children;
    }

    if (Array.isArray(childrenData?.data)) {
      return childrenData.data;
    }

    return [];
  }, [childrenData]);

  /* -------------------------------------------------------
     SELECT FIRST CHILD
  ------------------------------------------------------- */

  useEffect(() => {
    if (!selectedChildId && children.length > 0) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  /* -------------------------------------------------------
     SELECTED CHILD
  ------------------------------------------------------- */

  const selectedChild = useMemo(() => {
    return (
      children.find(
        (child) => child.id === selectedChildId
      ) || null
    );
  }, [children, selectedChildId]);

  /* -------------------------------------------------------
     DASHBOARD
  ------------------------------------------------------- */

  const {
    data: dashboardResponse,
    isLoading: dashboardLoading,
    isError: dashboardError,
    refetch: refetchDashboard,
  } = useParentDashboard(selectedChildId);

  const dashboardData = useMemo(
    () => mergeDashboardData(
      dashboardResponse?.data ?? dashboardResponse
    ),
    [dashboardResponse]
  );

  /* -------------------------------------------------------
     REFRESH
  ------------------------------------------------------- */

  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([
        refetchChildren?.(),
        refetchDashboard?.(),
      ]);

      toast.success('Dashboard refreshed');
    } catch {
      toast.error('Unable to refresh dashboard');
    }
  }, [refetchChildren, refetchDashboard]);

  /* -------------------------------------------------------
     CLOSE CHILD MENU
  ------------------------------------------------------- */

  useEffect(() => {

    const handleClickOutside = (event) => {

      if (
        childMenuRef.current &&
        !childMenuRef.current.contains(event.target)
      ) {
        setChildMenuOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };

  }, []);

  /* -------------------------------------------------------
     LOADING
  ------------------------------------------------------- */

  if (childrenLoading || dashboardLoading) {
    return <ParentDashboardSkeleton />;
  }

  /* -------------------------------------------------------
     NO CHILDREN
  ------------------------------------------------------- */

  if (!childrenLoading && children.length === 0) {

    return (
      <div className="pd2">

        <div className="pd2-card pd2-no-children">

          <div className="pd2-no-children-icon">
            <span className="material-symbols-outlined">
              diversity_3
            </span>
          </div>

          <h2>No Children Linked</h2>

          <p>
            Your parent account currently has no student
            linked to it. Please contact the school
            administration for assistance.
          </p>

          <Link
            to="/parent/help-center"
            className="pd2-btn-primary"
          >
            Contact School
          </Link>

        </div>

      </div>
    );
  }

  /* -------------------------------------------------------
     API ERROR
  ------------------------------------------------------- */

  if (childrenError || dashboardError) {

    return (
      <div className="pd2">

        <div className="pd2-card pd2-error-state">

          <div className="pd2-error-icon">
            <span className="material-symbols-outlined">
              cloud_off
            </span>
          </div>

          <h2>Unable to Load Dashboard</h2>

          <p>
            We couldn't retrieve the latest information.
            Please try again.
          </p>

          <button
            type="button"
            className="pd2-btn-primary"
            onClick={handleRefresh}
          >
            <span className="material-symbols-outlined">
              refresh
            </span>
            Try Again
          </button>

        </div>

      </div>
    );
  }

  /* -------------------------------------------------------
     VALUES
  ------------------------------------------------------- */

  const academicYear =
    dashboardResponse?.academicYear ||
    dashboardResponse?.academic_year ||
    DEFAULT_ACADEMIC_YEAR;

  const currentTerm =
    dashboardResponse?.currentTerm ||
    dashboardResponse?.current_term ||
    DEFAULT_TERM;

  const parentName =
    user?.name ||
    user?.full_name ||
    'Parent';

  const greeting = getGreeting();

  const feePaidPercentage = Math.max(
    0,
    Math.min(
      100,
      Number(dashboardData.fees.percentPaid) || 0
    )
  );

  const feePieData = [
    {
      name: 'Paid',
      value: feePaidPercentage,
    },
    {
      name: 'Balance',
      value: Math.max(0, 100 - feePaidPercentage),
    },
  ];

  return (
    <div className="pd2">

      {/* =====================================================
          HEADER / WELCOME
      ====================================================== */}

      <div className="pd2-row-top">

        <div className="pd2-welcome">

          <div className="pd2-welcome-top">

            <div className="pd2-welcome-left">

              <Avatar
                name={parentName}
                size={58}
              />

              <div>

                <h1>
                  {greeting},
                  <br />
                  {parentName}
                </h1>

                <p>
                  {children.length}{' '}
                  {children.length === 1
                    ? 'child'
                    : 'children'}{' '}
                  enrolled at CCAST
                </p>

              </div>

            </div>

            <button
              type="button"
              className="pd2-refresh-button"
              onClick={handleRefresh}
              title="Refresh dashboard"
              aria-label="Refresh dashboard"
            >
              <span className="material-symbols-outlined">
                refresh
              </span>
            </button>

          </div>

          <div className="pd2-welcome-badges">

            <span className="pd2-badge">
              <span className="material-symbols-outlined">
                calendar_month
              </span>

              {academicYear}
            </span>

            <span className="pd2-badge">
              <span className="material-symbols-outlined">
                event
              </span>

              {currentTerm}
            </span>

          </div>

        </div>

        {/* ===================================================
            CHILD SELECTOR
        ==================================================== */}

        <div className="pd2-card pd2-child-card">

          <div
            className="pd2-child-select"
            ref={childMenuRef}
          >

            <span className="pd2-card-label">
              Viewing Child
            </span>

            <button
              type="button"
              className="pd2-child-row"
              onClick={() =>
                setChildMenuOpen(
                  (open) => !open
                )
              }
              aria-expanded={childMenuOpen}
            >

              <Avatar
                name={selectedChild?.name}
                size={42}
              />

              <div className="pd2-child-info">

                <div className="pd2-child-name">
                  {selectedChild?.name || 'Student'}
                </div>

                <div className="pd2-child-class">
                  {selectedChild?.class ||
                    selectedChild?.class_name ||
                    'Class not available'}
                </div>

              </div>

              <span className="material-symbols-outlined pd2-chevron">
                {childMenuOpen
                  ? 'expand_less'
                  : 'expand_more'}
              </span>

            </button>

            {childMenuOpen &&
              children.length > 0 && (

                <div
                  className="pd2-child-menu"
                  role="menu"
                >

                  {children.map((child) => (

                    <button
                      type="button"
                      role="menuitem"
                      key={child.id}
                      className={
                        selectedChildId === child.id
                          ? 'active'
                          : ''
                      }
                      onClick={() => {

                        setSelectedChildId(
                          child.id
                        );

                        setChildMenuOpen(false);

                      }}
                    >

                      <Avatar
                        name={child.name}
                        size={30}
                      />

                      <span>
                        {child.name}
                      </span>

                      {selectedChildId === child.id && (
                        <span className="material-symbols-outlined">
                          check
                        </span>
                      )}

                    </button>

                  ))}

                </div>
              )}

          </div>

          <div className="pd2-child-meta">

            <span>
              <strong>Admission No:</strong>{' '}
              {selectedChild?.admissionNo ||
                selectedChild?.admission_number ||
                '—'}
            </span>

            <span>
              <strong>Class Teacher:</strong>{' '}
              {selectedChild?.classTeacher ||
                selectedChild?.class_teacher ||
                '—'}
            </span>

          </div>

        </div>

        {/* ===================================================
            MINI OVERVIEW
        ==================================================== */}

        <div className="pd2-card pd2-mini-stack">

          <div className="pd2-mini-attendance">

            <div
              className="pd2-mini-ring"
              style={{
                '--pct':
                  dashboardData.attendance.ytdRate,
              }}
            >
              <span>
                {dashboardData.attendance.ytdRate}%
              </span>
            </div>

            <span className="pd2-card-label">
              YTD Attendance
            </span>

          </div>

          <div className="pd2-mini-balance">

            <div className="pd2-mini-balance-icon">

              <span className="material-symbols-outlined">
                account_balance_wallet
              </span>

            </div>

            <div>

              <div className="pd2-card-label">
                Outstanding Balance
              </div>

              <div className="pd2-mini-balance-value">
                {xaf(dashboardData.fees.balance)}
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          STAT CARDS
      ====================================================== */}

      <div className="pd2-stats-grid">

        <StatCard
          icon="fact_check"
          color={COLORS.success}
          bg="#ecfdf5"
          value={`${dashboardData.attendance.rate}%`}
          label="Attendance"
          sub={`Present ${dashboardData.attendance.present} Days`}
          sub2={`Absent ${dashboardData.attendance.absent} Days`}
        />

        <StatCard
          icon="grade"
          color={COLORS.primary}
          bg="#eff6ff"
          value={`${dashboardData.academic.average}/${dashboardData.academic.max}`}
          label="Academic Average"
          sub={dashboardData.academic.className}
        />

        <StatCard
          icon="account_balance_wallet"
          color={COLORS.warning}
          bg="#fffbeb"
          value={xaf(dashboardData.fees.balance)}
          label="Fee Balance"
          sub={
            dashboardData.fees.dueDate
              ? `Due ${dashboardData.fees.dueDate}`
              : 'No due date'
          }
        />

        <StatCard
          icon="assignment"
          color={COLORS.purple}
          bg="#faf5ff"
          value={dashboardData.homework.pending}
          label="Homework"
          sub={`Pending ${dashboardData.homework.pending}`}
          sub2={`Completed ${dashboardData.homework.completed}`}
        />

        <StatCard
          icon="event_note"
          color={COLORS.cyan}
          bg="#ecfeff"
          value={dashboardData.exams.upcoming}
          label="Upcoming Exams"
          sub={dashboardData.exams.period}
        />

        <StatCard
          icon="verified"
          color={COLORS.success}
          bg="#ecfdf5"
          value={dashboardData.discipline.status}
          label="Discipline"
          sub={dashboardData.discipline.note}
        />

        <StatCard
          icon="local_library"
          color={COLORS.pink}
          bg="#fdf2f8"
          value={dashboardData.library.borrowed}
          label="Library"
          sub={`Borrowed ${dashboardData.library.borrowed}`}
          sub2={`Overdue ${dashboardData.library.overdue}`}
        />

        <StatCard
          icon="chat_bubble"
          color={COLORS.indigo}
          bg="#eef2ff"
          value={dashboardData.messages.unread}
          label="Messages"
          sub="Unread"
        />

      </div>

      {/* =====================================================
          ANALYTICS
      ====================================================== */}

      <div className="pd2-charts-grid">

        {/* ATTENDANCE */}

        <div className="pd2-card">

          <CardHeader
            icon="bar_chart"
            title="Attendance Overview"
            to="/parent/attendance"
          />

          {dashboardData.attendanceMonthly.length > 0 ? (

            <>
              <div className="pd2-chart-split">

                <ResponsiveContainer
                  width="60%"
                  height={180}
                >

                  <BarChart
                    data={
                      dashboardData.attendanceMonthly
                    }
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />

                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis hide />

                    <Tooltip />

                    <Bar
                      dataKey="present"
                      stackId="attendance"
                      fill="#22c55e"
                      radius={[3, 3, 0, 0]}
                    />

                    <Bar
                      dataKey="late"
                      stackId="attendance"
                      fill="#f59e0b"
                    />

                    <Bar
                      dataKey="absent"
                      stackId="attendance"
                      fill="#ef4444"
                      radius={[0, 0, 3, 3]}
                    />

                  </BarChart>

                </ResponsiveContainer>

                <div className="pd2-donut-wrap">

                  <ResponsiveContainer
                    width={110}
                    height={110}
                  >

                    <RadialBarChart
                      innerRadius="70%"
                      outerRadius="100%"
                      data={[
                        {
                          value:
                            dashboardData.attendance.rate,
                        },
                      ]}
                      startAngle={90}
                      endAngle={-270}
                    >

                      <RadialBar
                        dataKey="value"
                        fill="#22c55e"
                        cornerRadius={8}
                        background={{
                          fill: '#f1f5f9',
                        }}
                        max={100}
                      />

                    </RadialBarChart>

                  </ResponsiveContainer>

                  <span className="pd2-donut-label">
                    {dashboardData.attendance.rate}%
                  </span>

                </div>

              </div>

              <div className="pd2-legend">

                <LegendItem
                  color="#22c55e"
                  label="Present"
                />

                <LegendItem
                  color="#f59e0b"
                  label="Late"
                />

                <LegendItem
                  color="#ef4444"
                  label="Absent"
                />

              </div>
            </>

          ) : (

            <EmptyState
              icon="fact_check"
              title="No attendance data"
              message="Attendance records will appear here."
            />

          )}

        </div>

        {/* ACADEMIC PERFORMANCE */}

        <div className="pd2-card">

          <CardHeader
            icon="trending_up"
            title="Academic Performance"
            to="/parent/results"
          />

          {dashboardData.subjectPerformance.length > 0 ? (

            dashboardData.subjectPerformance.map(
              (subject, index) => {

                const score =
                  Number(subject.score) || 0;

                const max =
                  Number(
                    subject.max ||
                    subject.maxScore ||
                    20
                  );

                const percentage =
                  Math.min(
                    100,
                    Math.max(
                      0,
                      (score / max) * 100
                    )
                  );

                return (
                  <div
                    key={
                      subject.id ||
                      subject.subject_id ||
                      subject.subject ||
                      index
                    }
                    className="pd2-subject-item"
                  >

                    <span className="pd2-subject-name">
                      {subject.subject}
                    </span>

                    <div className="pd2-subject-bar">

                      <div
                        className="pd2-subject-fill"
                        style={{
                          width: `${percentage}%`,
                          background:
                            subject.color ||
                            COLORS.primary,
                        }}
                      />

                    </div>

                    <span className="pd2-subject-score">
                      {score}/{max}
                    </span>

                  </div>
                );
              }
            )

          ) : (

            <EmptyState
              icon="school"
              title="No results yet"
              message="Academic results will appear here once published."
            />

          )}

          {dashboardData.performanceTrend.length > 0 && (

            <div className="pd2-trend-chart">

              <ResponsiveContainer
                width="100%"
                height={90}
              >

                <LineChart
                  data={
                    dashboardData.performanceTrend
                  }
                >

                  <XAxis
                    dataKey="term"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    hide
                    domain={[0, 20]}
                  />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="avg"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>
          )}

        </div>

        {/* FEES */}

        <div className="pd2-card">

          <CardHeader
            icon="account_balance_wallet"
            title="Fee Status"
            to="/parent/fees"
          />

          <div className="pd2-fee-split">

            <div className="pd2-fee-rows">

              <FeeRow
                label="Total Fees"
                value={xaf(
                  dashboardData.fees.total
                )}
              />

              <FeeRow
                label="Paid"
                value={xaf(
                  dashboardData.fees.paid
                )}
                color={COLORS.success}
              />

              <FeeRow
                label="Balance"
                value={xaf(
                  dashboardData.fees.balance
                )}
                color={COLORS.danger}
              />

            </div>

            <div className="pd2-donut-wrap">

              <ResponsiveContainer
                width={110}
                height={110}
              >

                <PieChart>

                  <Pie
                    data={feePieData}
                    dataKey="value"
                    innerRadius={38}
                    outerRadius={52}
                    startAngle={90}
                    endAngle={-270}
                  >

                    <Cell fill={COLORS.primary} />
                    <Cell fill="#e5e7eb" />

                  </Pie>

                </PieChart>

              </ResponsiveContainer>

              <span className="pd2-donut-label">
                {feePaidPercentage}%
                <br />
                <small>Paid</small>
              </span>

            </div>

          </div>

          <div className="pd2-fee-actions">

            <Link
              to="/parent/fees/pay"
              className="pd2-btn-primary"
            >
              <span className="material-symbols-outlined">
                payments
              </span>
              Pay Now
            </Link>

            <Link
              to="/parent/invoices"
              className="pd2-btn-outline"
            >
              <span className="material-symbols-outlined">
                receipt_long
              </span>
              View Invoice
            </Link>

          </div>

        </div>

      </div>

      {/* =====================================================
          WIDGETS
      ====================================================== */}

      <div className="pd2-widgets-grid">

        <ListCard
          title="Upcoming Events"
          icon="event"
          to="/parent/school-calendar"
          items={dashboardData.upcomingEvents}
          emptyTitle="No upcoming events"
        >
          {(event) => (
            <>
              <span>
                {event.title}
              </span>

              <span className="pd2-list-meta">
                {event.when}
              </span>
            </>
          )}
        </ListCard>

        <ListCard
          title="Homework"
          icon="assignment"
          to="/parent/homework"
          items={dashboardData.homeworkList}
          emptyTitle="No homework"
        >
          {(homework) => (
            <>
              <span>
                {homework.subject}
                {' — '}
                {homework.title}
              </span>

              <span
                className={`pd2-pill ${
                  homework.status === 'Submitted'
                    ? 'ok'
                    : 'pending'
                }`}
              >
                {homework.status}
              </span>
            </>
          )}
        </ListCard>

        <ListCard
          title="Today's Timetable"
          icon="schedule"
          to="/parent/timetable"
          items={dashboardData.timetableToday}
          emptyTitle="No timetable available"
        >
          {(item) => (
            <>
              <span>
                {item.time}
              </span>

              <span className="pd2-list-meta">
                {item.subject}
              </span>
            </>
          )}
        </ListCard>

        <ListCard
          title="School Notices"
          icon="campaign"
          to="/parent/notices"
          items={dashboardData.notices}
          emptyTitle="No notices"
        >
          {(notice) => (
            <>
              <span>
                {notice.title}
              </span>

              <span className="pd2-list-meta">
                {notice.when}
              </span>
            </>
          )}
        </ListCard>

        <ListCard
          title="Messages"
          icon="chat"
          to="/parent/messages"
          items={dashboardData.messagesList}
          emptyTitle="No messages"
        >
          {(message) => (
            <div className="pd2-msg-row">

              <Avatar
                name={message.from}
                size={30}
              />

              <div>

                <div className="pd2-msg-from">
                  {message.from}
                </div>

                <div className="pd2-list-meta">
                  {message.role}
                </div>

              </div>

              <span className="pd2-list-meta">
                {message.when}
              </span>

            </div>
          )}
        </ListCard>

        <ListCard
          title="Recent Activities"
          icon="history"
          items={dashboardData.recentActivities}
          emptyTitle="No recent activities"
        >
          {(activity) => (
            <>
              <span>
                {activity.text}
              </span>

              <span className="pd2-list-meta">
                {activity.when}
              </span>
            </>
          )}
        </ListCard>

        {/* QUICK ACTIONS */}

        <div className="pd2-card pd2-quick-actions-card">

          <CardHeader
            icon="bolt"
            title="Quick Actions"
          />

          <div className="pd2-quick-actions-grid">

            {QUICK_ACTIONS.map((action) => (

              <Link
                key={action.to}
                to={action.to}
                className="pd2-quick-action"
              >

                <span className="material-symbols-outlined">
                  {action.icon}
                </span>

                <span>
                  {action.label}
                </span>

              </Link>

            ))}

          </div>

        </div>

        <ListCard
          title="Notifications"
          icon="notifications"
          to="/parent/notifications"
          items={dashboardData.notificationsList}
          emptyTitle="You're all caught up"
        >
          {(notification) => (
            <>
              <span>
                {notification.text}
              </span>

              <span className="pd2-list-meta">
                {notification.when}
              </span>
            </>
          )}
        </ListCard>

        {/* CHILD PROFILE */}

        <div className="pd2-card pd2-profile-card">

          <CardHeader
            icon="badge"
            title="Child Profile"
            to="/parent/profile"
          />

          <div className="pd2-profile-body">

            <Avatar
              name={selectedChild?.name}
              size={68}
            />

            <div className="pd2-profile-name">
              {selectedChild?.name}
            </div>

            <div className="pd2-profile-class">
              {selectedChild?.class ||
                selectedChild?.class_name ||
                '—'}
            </div>

            <div className="pd2-profile-rows">

              <ProfileRow
                label="Admission No"
                value={
                  selectedChild?.admissionNo ||
                  selectedChild?.admission_number ||
                  '—'
                }
              />

              <ProfileRow
                label="Admitted On"
                value={
                  selectedChild?.admittedOn ||
                  selectedChild?.admitted_on ||
                  '—'
                }
              />

              <ProfileRow
                label="Class Teacher"
                value={
                  selectedChild?.classTeacher ||
                  selectedChild?.class_teacher ||
                  '—'
                }
              />

            </div>

            <Link
              to="/parent/profile"
              className="pd2-btn-outline pd2-profile-btn"
            >
              View Full Profile
            </Link>

          </div>

        </div>

      </div>

      <footer className="pd2-footer">
        © {new Date().getFullYear()} CCAST Secondary School.
        All rights reserved.
      </footer>

    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function StatCard({
  icon,
  color,
  bg,
  value,
  label,
  sub,
  sub2,
}) {
  return (
    <div className="pd2-stat-card">

      <div
        className="pd2-stat-icon"
        style={{
          background: bg,
          color,
        }}
      >
        <span className="material-symbols-outlined">
          {icon}
        </span>
      </div>

      <div className="pd2-stat-content">

        <span className="pd2-stat-value">
          {value}
        </span>

        <span className="pd2-stat-label">
          {label}
        </span>

        {sub && (
          <span className="pd2-stat-sub">
            {sub}
          </span>
        )}

        {sub2 && (
          <span className="pd2-stat-sub">
            {sub2}
          </span>
        )}

      </div>

    </div>
  );
}

function CardHeader({
  icon,
  title,
  to,
}) {
  return (
    <div className="pd2-card-header">

      <h3>
        <span className="material-symbols-outlined">
          {icon}
        </span>

        {title}
      </h3>

      {to && (
        <Link
          to={to}
          className="pd2-view-all"
        >
          View All →
        </Link>
      )}

    </div>
  );
}

function FeeRow({
  label,
  value,
  color,
}) {
  return (
    <div className="pd2-fee-row">

      <span>
        {label}
      </span>

      <strong
        style={{
          color: color || undefined,
        }}
      >
        {value}
      </strong>

    </div>
  );
}

function LegendItem({
  color,
  label,
}) {
  return (
    <span>
      <i
        style={{
          background: color,
        }}
      />

      {label}
    </span>
  );
}

function ProfileRow({
  label,
  value,
}) {
  return (
    <div>

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

function ListCard({
  title,
  icon,
  to,
  items = [],
  emptyTitle,
  children,
}) {
  return (
    <div className="pd2-card pd2-list-card">

      <CardHeader
        icon={icon}
        title={title}
        to={to}
      />

      <div className="pd2-list-body">

        {items.length === 0 ? (

          <EmptyState
            icon={icon}
            title={emptyTitle || 'No information'}
          />

        ) : (

          items.slice(0, 6).map((item, index) => (

            <div
              key={
                item.id ||
                item.uuid ||
                item.key ||
                index
              }
              className="pd2-list-row"
            >
              {children(item)}
            </div>

          ))

        )}

      </div>

    </div>
  );
}