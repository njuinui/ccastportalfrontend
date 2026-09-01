// src/config/portals/principal.js

export default {
  id: 'principal',
  label: 'Principal',
  defaultRoute: '/principal',
  accentColor: '#1a56db',
  icon: 'school',

  sidebar: {
    sections: [
      {
        section: 'Overview',
        items: [
          {
            to: '/principal',
            label: 'Dashboard',
            icon: 'dashboard',
            exact: true,
          },
        ],
      },

      // ─────────────────────────────────────────
      // ADMINISTRATION
      // ─────────────────────────────────────────
      {
        section: 'Administration',
        items: [
          {
            to: '/admission-settings',
            label: 'Admission Setting',
            icon: 'settings',
          },
          {
            to: '/pta-meetings',
            label: 'PTA Meeting',
            icon: 'groups',
          },
        ],
      },

      // ─────────────────────────────────────────
      // ACADEMICS
      // ─────────────────────────────────────────
      {
        section: 'Academics',
        items: [
          {
            to: '/students',
            label: 'Students',
            icon: 'group',
          },
          {
            to: '/classes',
            label: 'Classes',
            icon: 'layers',
          },
          {
            to: '/attendance',
            label: 'Attendance',
            icon: 'fact_check',
          },
          {
            to: '/exams',
            label: 'Exams',
            icon: 'assignment',
          },
          {
            to: '/report-cards',
            label: 'Report Cards',
            icon: 'workspace_premium',
          },
          {
            to: '/teaching-logbook',
            label: 'Teaching Logbook',
            icon: 'menu_book',
          },
          {
            to: '/curricular-activities',
            label: 'Curricular Activity',
            icon: 'event_note',
          },
          {
            to: '/timetable',
            label: 'Time Table',
            icon: 'calendar_month',
          },
        ],
      },

      // ─────────────────────────────────────────
      // STAFF
      // ─────────────────────────────────────────
      {
        section: 'Staff',
        items: [
          {
            to: '/staff',
            label: 'Staff',
            icon: 'badge',
          },
        ],
      },

      // ─────────────────────────────────────────
      // OPERATIONS
      // ─────────────────────────────────────────
      {
        section: 'Operations',
        items: [
          {
            to: '/admissions',
            label: 'Admissions',
            icon: 'how_to_reg',
          },
          {
            to: '/discipline',
            label: 'Discipline',
            icon: 'gavel',
          },
          {
            to: '/notices',
            label: 'Notices',
            icon: 'campaign',
          },
          {
            to: '/blog-posts',
            label: 'Blog Posts',
            icon: 'article',
          },
        ],
      },

      // ─────────────────────────────────────────
      // FINANCE
      // ─────────────────────────────────────────
      {
        section: 'Finance',
        items: [
          {
            to: '/fees',
            label: 'Fee Collection',
            icon: 'payments',
          },
          {
            to: '/fee-structures',
            label: 'Fee Structure',
            icon: 'request_quote',
          },
        ],
      },
    ],

    quickActions: [
      {
        to: '/admissions',
        label: 'Review Admissions',
        icon: 'check_circle',
      },
      {
        to: '/notices',
        label: 'Create Notice',
        icon: 'campaign',
      },
    ],
  },

  dashboard: {
    widgets: [
      'attendanceToday',
      'studentAttendance',
      'topPerformingClasses',
      'upcomingExams',
      'pendingAdmissions',
      'disciplineCases',
      'announcements',
      'staffLeaveRequests',
    ],
  },

  navbar: {
    showSearch: true,
    showNotifications: true,
    showMessages: true,
    showCalendar: true,
    showAcademicYear: true,
    showTermSelector: true,
  },
};