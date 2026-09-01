// src/config/portals/parent.js

/**
 * Parent Portal Configuration
 *
 * Design goals:
 * - Keep the portal strictly parent-focused.
 * - Standardize sidebar structure with the other portals.
 * - Keep navigation declarative so AppShell/Sidebar can consume it.
 * - Support child switching for parents with multiple children.
 * - Support notification/message badges.
 * - Keep dashboard widgets API-driven.
 * - Avoid exposing administrative functionality.
 */

const parentPortal = {
  id: 'parent',
  label: 'Parent Portal',
  defaultRoute: '/parent',

  // Primary portal branding
  accentColor: '#2563eb',
  icon: 'diversity_3',

  /**
   * Sidebar Navigation
   */
  sidebar: {
    sections: [
      {
        section: 'Overview',
        items: [
          {
            to: '/parent',
            label: 'Dashboard',
            icon: 'dashboard',
            exact: true,
          },
        ],
      },

      {
        section: 'My Children',
        items: [
          {
            to: '/parent/children',
            label: 'My Children',
            icon: 'diversity_3',
          },
          {
            to: '/parent/profile',
            label: 'Child Profile',
            icon: 'badge',
          },
          {
            to: '/parent/academic-history',
            label: 'Academic History',
            icon: 'history_edu',
          },
          {
            to: '/parent/medical-info',
            label: 'Medical Information',
            icon: 'medical_information',
          },
          {
            to: '/parent/documents',
            label: 'Documents',
            icon: 'folder',
          },
        ],
      },

      {
        section: 'Academics',
        items: [
          {
            to: '/parent/subjects',
            label: 'Subjects',
            icon: 'menu_book',
          },
          {
            to: '/parent/homework',
            label: 'Homework',
            icon: 'assignment',
          },
          {
            to: '/parent/assignments',
            label: 'Assignments',
            icon: 'assignment_turned_in',
          },
          {
            to: '/parent/exam-timetable',
            label: 'Exam Timetable',
            icon: 'event_note',
          },
          {
            to: '/parent/results',
            label: 'Results',
            icon: 'grade',
          },
          {
            to: '/parent/report-cards',
            label: 'Report Cards',
            icon: 'workspace_premium',
          },
          {
            to: '/parent/academic-progress',
            label: 'Academic Progress',
            icon: 'trending_up',
          },
        ],
      },

      {
        section: 'Finance',
        items: [
          {
            to: '/parent/fees',
            label: 'Fee Balance',
            icon: 'account_balance_wallet',
          },
          {
            to: '/parent/payment-history',
            label: 'Payment History',
            icon: 'history',
          },
          {
            to: '/parent/invoices',
            label: 'Invoices',
            icon: 'receipt_long',
          },
          {
            to: '/parent/receipts',
            label: 'Receipts',
            icon: 'receipt',
          },
          {
            to: '/parent/online-payments',
            label: 'Online Payments',
            icon: 'payments',
          },
          {
            to: '/parent/scholarships',
            label: 'Scholarships',
            icon: 'school',
          },
        ],
      },

      {
        section: 'Communication',
        items: [
          {
            to: '/parent/messages',
            label: 'Messages',
            icon: 'chat',
            badge: 'messages',
          },
          {
            to: '/parent/teachers',
            label: 'Teachers',
            icon: 'person',
          },
          {
            to: '/parent/class-teacher',
            label: 'Class Teacher',
            icon: 'support_agent',
          },
          {
            to: '/parent/notices',
            label: 'School Notices',
            icon: 'campaign',
          },
        ],
      },

      {
        section: 'School Life',
        items: [
          {
            to: '/parent/timetable',
            label: 'Timetable',
            icon: 'schedule',
          },
          {
            to: '/parent/school-calendar',
            label: 'School Calendar',
            icon: 'calendar_month',
          },
          {
            to: '/parent/discipline',
            label: 'Discipline Records',
            icon: 'gavel',
          },
          {
            to: '/parent/co-curricular',
            label: 'Co-Curricular Activities',
            icon: 'sports_soccer',
          },
          {
            to: '/parent/library',
            label: 'Library Records',
            icon: 'local_library',
          },
        ],
      },

      {
        section: 'Support',
        items: [
          {
            to: '/parent/help-center',
            label: 'Help Center',
            icon: 'help',
          },
          {
            to: '/parent/complaints',
            label: 'Complaints',
            icon: 'report',
          },
          {
            to: '/parent/settings',
            label: 'Settings',
            icon: 'settings',
          },
        ],
      },
    ],

    /**
     * Frequently used parent actions.
     */
    quickActions: [
      {
        to: '/parent/fees/pay',
        label: 'Pay Fees',
        icon: 'payments',
      },
      {
        to: '/parent/report-cards/download',
        label: 'Download Report Card',
        icon: 'download',
      },
      {
        to: '/parent/messages/new',
        label: 'Message Teacher',
        icon: 'chat',
      },
      {
        to: '/parent/leave-request',
        label: 'Apply for Leave',
        icon: 'event_busy',
      },
      {
        to: '/parent/timetable',
        label: 'View Timetable',
        icon: 'schedule',
      },
      {
        to: '/parent/receipts',
        label: 'Download Receipt',
        icon: 'receipt',
      },
    ],
  },

  /**
   * Parent Dashboard
   *
   * Widgets should be resolved by the dashboard component.
   * Keep these identifiers stable because the dashboard can
   * conditionally render them based on permissions/API data.
   */
  dashboard: {
    widgets: [
      'welcomeBanner',
      'childSelector',

      // Core child status
      'statCards',
      'attendanceGauge',
      'outstandingBalance',

      // Academic information
      'academicPerformanceChart',
      'attendanceOverviewChart',
      'feeStatusChart',

      // Daily information
      'timetable',
      'homework',
      'upcomingEvents',

      // Communication
      'schoolNotices',
      'messages',
      'notifications',

      // Activity
      'recentActivities',

      // Child information
      'childProfileCard',

      // Actions
      'quickActions',
    ],
  },

  /**
   * Top Navigation / AppShell
   */
  navbar: {
    // Global navigation
    showSearch: true,
    showNotifications: true,
    showMessages: true,

    // User preferences
    showLanguage: true,
    showDarkMode: true,
    showProfile: true,

    // Parent-specific navigation
    showCalendar: true,
    showChildSelector: true,

    // Academic context
    showAcademicYear: true,
    showTermSelector: true,

    /**
     * These are defaults only.
     *
     * Ideally the actual active academic year and term should
     * come from the backend/session rather than being permanently
     * hardcoded here.
     */
    academicYear: null,
    currentTerm: null,
  },
};

export default parentPortal;