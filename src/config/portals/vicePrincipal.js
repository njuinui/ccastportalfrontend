// src/config/portals/vicePrincipal.js
//
// Vice Principal Portal
// ---------------------
// Responsibility focus:
// - Daily school operations
// - Attendance monitoring
// - Student discipline
// - Teacher supervision
// - Academic/lesson supervision
// - Student oversight
// - Operational reports
//
// IMPORTANT:
// Keep routes here aligned with routes actually registered in App.jsx.
// If a route is not yet implemented, remove it from the sidebar until
// the corresponding page is available.

export default {
  id: 'vice-principal',
  label: 'Vice Principal',
  defaultRoute: '/vice-principal',

  // Portal identity
  accentColor: '#0891b2',
  icon: 'assistant',

  sidebar: {
    sections: [
      // ============================================================
      // OVERVIEW
      // ============================================================
      {
        section: 'Overview',
        items: [
          {
            to: '/vice-principal',
            label: 'Dashboard',
            icon: 'dashboard',
            exact: true,
          },
        ],
      },

      // ============================================================
      // DAILY OPERATIONS
      // ============================================================
      {
        section: 'Operations',
        items: [
          {
            to: '/attendance',
            label: 'Attendance',
            icon: 'fact_check',
          },
          {
            to: '/discipline',
            label: 'Discipline',
            icon: 'gavel',
          },
        ],
      },

      // ============================================================
      // ACADEMIC SUPERVISION
      // ============================================================
      {
        section: 'Academic Supervision',
        items: [
          {
            to: '/classes',
            label: 'Classes',
            icon: 'class',
          },
          {
            to: '/subjects',
            label: 'Subjects',
            icon: 'menu_book',
          },
          {
            to: '/exams',
            label: 'Exams',
            icon: 'assignment',
          },
        ],
      },

      // ============================================================
      // TEACHER SUPERVISION
      // ============================================================
      {
        section: 'Teachers',
        items: [
          {
            to: '/staff',
            label: 'Teachers',
            icon: 'school',
          },
          {
            to: '/logbook',
            label: 'Lesson Notes',
            icon: 'menu_book',
          },
        ],
      },

      // ============================================================
      // STUDENT MANAGEMENT
      // ============================================================
      {
        section: 'Students',
        items: [
          {
            to: '/students',
            label: 'Students',
            icon: 'group',
          },
        ],
      },

      // ============================================================
      // REPORTS
      // ============================================================
      {
        section: 'Reports',
        items: [
          {
            to: '/reports',
            label: 'Reports',
            icon: 'analytics',
          },
        ],
      },
    ],

    // ================================================================
    // QUICK ACTIONS
    // ================================================================
    quickActions: [
      {
        to: '/attendance/take',
        label: 'Take Attendance',
        icon: 'how_to_reg',
      },

      {
        to: '/discipline',
        label: 'Record Discipline',
        icon: 'gavel',
      },

      {
        to: '/students',
        label: 'View Students',
        icon: 'group',
      },

      {
        to: '/staff',
        label: 'View Teachers',
        icon: 'school',
      },

      {
        to: '/reports',
        label: 'View Reports',
        icon: 'assessment',
      },
    ],
  },

  // ================================================================
  // DASHBOARD
  // ================================================================
  dashboard: {
    widgets: [
      // Daily school status
      'attendance',

      // Student welfare / discipline
      'discipline',

      // Teacher supervision
      'teacherPerformance',

      // Academic supervision
      'lessonNotes',
      'teachingLogs',
      'classInspection',

      // Academic monitoring
      'classPerformance',
      'examPerformance',

      // Outstanding administrative work
      'pendingReports',

      // Alerts requiring attention
      'pendingDisciplineCases',
      'attendanceAlerts',
      'teacherAbsenceAlerts',
    ],
  },

  // ================================================================
  // NAVBAR
  // ================================================================
  navbar: {
    showSearch: true,
    showNotifications: true,
    showMessages: true,

    // Useful for meetings, inspections and school activities.
    showCalendar: true,

    // Academic context
    showAcademicYear: true,
    showTermSelector: true,

    // Must match AppShell.jsx:
    // use `showLanguage`, not `showLanguageSwitch`.
    showLanguage: true,

    // AppShell currently has dark-mode state.
    // Keep enabled if the actual theme toggle is rendered.
    showThemeSwitch: true,
  },
};