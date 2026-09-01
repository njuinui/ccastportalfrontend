// src/config/portals/student.js

/**
 * Student Portal Configuration
 *
 * Responsibilities:
 * - Give students access to their academic information
 * - Provide attendance and timetable information
 * - Provide assignments, examinations and results
 * - Provide fee/payment information
 * - Provide communication with the school
 * - Provide library and discipline information
 * - Provide profile/account management
 *
 * Important:
 * - This configuration controls UI navigation only.
 * - Laravel authorization must independently enforce what the
 *   authenticated student can actually access.
 * - Academic year and term should come from the backend/session,
 *   not be permanently hardcoded here.
 */

const studentPortal = {
  id: 'student',
  label: 'Student Portal',
  defaultRoute: '/student',

  // Portal branding
  accentColor: '#2563eb',
  icon: 'person',

  // ─────────────────────────────────────────────────────────────
  // SIDEBAR
  // ─────────────────────────────────────────────────────────────
  sidebar: {
    sections: [

      // ────────────────────────────────────────────────────────
      // OVERVIEW
      // ────────────────────────────────────────────────────────
      {
        section: 'Overview',
        items: [
          {
            to: '/student',
            label: 'Dashboard',
            icon: 'dashboard',
            exact: true,
          },
        ],
      },

      // ────────────────────────────────────────────────────────
      // ACADEMICS
      // ────────────────────────────────────────────────────────
      {
        section: 'Academics',
        items: [
          {
            to: '/student/subjects',
            label: 'My Subjects',
            icon: 'menu_book',
          },
          {
            to: '/student/timetable',
            label: 'Timetable',
            icon: 'schedule',
          },
          {
            to: '/student/assignments',
            label: 'Assignments',
            icon: 'assignment',
          },
          {
            to: '/student/homework',
            label: 'Homework',
            icon: 'edit_note',
          },
          {
            to: '/student/exams',
            label: 'Exams',
            icon: 'edit_calendar',
          },
          {
            to: '/student/results',
            label: 'Results',
            icon: 'grade',
          },
          {
            to: '/student/report-cards',
            label: 'Report Cards',
            icon: 'workspace_premium',
          },
          {
            to: '/student/academic-progress',
            label: 'Academic Progress',
            icon: 'trending_up',
          },
        ],
      },

      // ────────────────────────────────────────────────────────
      // ATTENDANCE & SCHOOL LIFE
      // ────────────────────────────────────────────────────────
      {
        section: 'School Life',
        items: [
          {
            to: '/student/attendance',
            label: 'Attendance',
            icon: 'fact_check',
          },
          {
            to: '/student/fees',
            label: 'Fees & Payments',
            icon: 'payments',
          },
          {
            to: '/student/notices',
            label: 'School Notices',
            icon: 'campaign',
          },
          {
            to: '/student/calendar',
            label: 'School Calendar',
            icon: 'calendar_month',
          },
          {
            to: '/student/library',
            label: 'Library',
            icon: 'local_library',
          },
          {
            to: '/student/discipline',
            label: 'Discipline',
            icon: 'gavel',
          },
          {
            to: '/student/co-curricular',
            label: 'Activities',
            icon: 'sports_soccer',
          },
        ],
      },

      // ────────────────────────────────────────────────────────
      // COMMUNICATION
      // ────────────────────────────────────────────────────────
      {
        section: 'Communication',
        items: [
          {
            to: '/student/messages',
            label: 'Messages',
            icon: 'chat',
            badge: 'messages',
          },
          {
            to: '/student/announcements',
            label: 'Announcements',
            icon: 'campaign',
          },
          {
            to: '/student/teachers',
            label: 'My Teachers',
            icon: 'school',
          },
        ],
      },

      // ────────────────────────────────────────────────────────
      // FINANCE
      // ────────────────────────────────────────────────────────
      {
        section: 'Finance',
        items: [
          {
            to: '/student/fees',
            label: 'Fee Balance',
            icon: 'account_balance_wallet',
          },
          {
            to: '/student/payment-history',
            label: 'Payment History',
            icon: 'history',
          },
          {
            to: '/student/invoices',
            label: 'Invoices',
            icon: 'receipt_long',
          },
          {
            to: '/student/receipts',
            label: 'Receipts',
            icon: 'receipt',
          },
        ],
      },

      // ────────────────────────────────────────────────────────
      // PROFILE & ACCOUNT
      // ────────────────────────────────────────────────────────
      {
        section: 'Profile & Account',
        items: [
          {
            to: '/student/profile',
            label: 'My Profile',
            icon: 'account_circle',
          },
          {
            to: '/student/documents',
            label: 'My Documents',
            icon: 'folder',
          },
          {
            to: '/student/change-password',
            label: 'Change Password',
            icon: 'lock_reset',
          },
          {
            to: '/student/settings',
            label: 'Settings',
            icon: 'settings',
          },
        ],
      },
    ],

    // ───────────────────────────────────────────────────────────
    // QUICK ACTIONS
    // ───────────────────────────────────────────────────────────
    quickActions: [
      {
        to: '/student/timetable',
        label: 'View Timetable',
        icon: 'schedule',
      },
      {
        to: '/student/assignments',
        label: 'My Assignments',
        icon: 'assignment',
      },
      {
        to: '/student/results',
        label: 'Check Results',
        icon: 'bar_chart',
      },
      {
        to: '/student/exams',
        label: 'Exam Schedule',
        icon: 'edit_calendar',
      },
      {
        to: '/student/fees',
        label: 'Check Fees',
        icon: 'payments',
      },
      {
        to: '/student/library',
        label: 'Library',
        icon: 'local_library',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────────────────────
  dashboard: {
    widgets: [

      // Welcome / identity
      'hero',
      'studentProfileCard',

      // KPI cards
      'attendanceCard',
      'averageScoreCard',
      'assignmentsCard',
      'feeBalanceCard',

      // Today's information
      'todaySchedule',
      'todayAttendance',

      // Academic work
      'myAssignments',
      'academicPerformance',
      'academicProgress',
      'upcomingExams',
      'recentResults',

      // School information
      'schoolNotices',
      'upcomingEvents',

      // Communication
      'messages',
      'notifications',

      // Personal development
      'goalsWidget',

      // Quick navigation
      'quickActions',
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // NAVBAR
  // ─────────────────────────────────────────────────────────────
  navbar: {
    // Global navigation
    showSearch: true,
    showNotifications: true,
    showMessages: true,

    // Student-specific
    showTodayWidget: true,
    showCalendar: true,

    // Account
    showProfile: true,
    showLanguage: true,
    showDarkMode: true,

    // Academic context
    showAcademicYear: true,
    showTermSelector: true,

    /**
     * These should normally be populated from the authenticated
     * academic session/context.
     *
     * Do not hardcode "2026/2027" or "Term II" permanently.
     */
    academicYear: null,
    currentTerm: null,
  },
};

export default studentPortal;