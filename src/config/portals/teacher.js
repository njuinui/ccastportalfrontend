// src/config/portals/teacher.js
//
// Teacher Portal
// --------------
// Responsibility focus:
// - Daily teaching activities
// - Assigned classes and subjects
// - Student monitoring
// - Attendance
// - Lesson planning / lesson notes
// - Assessments and marks
// - Exams
// - Communication
// - Academic performance monitoring
//
// IMPORTANT:
// Keep all routes synchronized with the routes registered in App.jsx.
// Do not enable a sidebar/quick-action route until its page exists.

export default {
  id: 'teacher',
  label: 'Teacher',
  defaultRoute: '/teacher',

  // Portal identity
  accentColor: '#7c3aed',
  icon: 'school',

  sidebar: {
    sections: [
      // ============================================================
      // OVERVIEW / DAILY TEACHING
      // ============================================================
      {
        section: 'Teaching',
        items: [
          {
            to: '/teacher',
            label: 'Dashboard',
            icon: 'dashboard',
            exact: true,
          },
          {
            to: '/classes',
            label: 'My Classes',
            icon: 'layers',
          },
          {
            to: '/teacher/timetable',
            label: 'My Timetable',
            icon: 'calendar_month',
          },
        ],
      },

      // ============================================================
      // STUDENTS
      // ============================================================
      {
        section: 'Students',
        items: [
          {
            to: '/students',
            label: 'My Students',
            icon: 'group',
          },
          {
            to: '/attendance',
            label: 'Attendance',
            icon: 'fact_check',
          },
        ],
      },

      // ============================================================
      // LESSON PLANNING
      // ============================================================
      {
        section: 'Lesson Planning',
        items: [
          {
            to: '/logbook',
            label: 'Lesson Notes',
            icon: 'menu_book',
          },
          {
            to: '/teacher/teaching-log',
            label: 'Teaching Log',
            icon: 'history_edu',
          },
        ],
      },

      // ============================================================
      // ASSESSMENT
      // ============================================================
      {
        section: 'Assessment',
        items: [
          {
            to: '/marks',
            label: 'Marks Entry',
            icon: 'edit_note',
          },
          {
            to: '/exams',
            label: 'Exams',
            icon: 'assignment',
          },
        ],
      },

      // ============================================================
      // ACADEMIC PERFORMANCE
      // ============================================================
      {
        section: 'Performance',
        items: [
          {
            to: '/teacher/performance',
            label: 'Class Performance',
            icon: 'analytics',
          },
          {
            to: '/teacher/marks/pending',
            label: 'Pending Marks',
            icon: 'pending_actions',
          },
        ],
      },

      // ============================================================
      // COMMUNICATION
      // ============================================================
      {
        section: 'Communication',
        items: [
          {
            to: '/notices',
            label: 'Notices',
            icon: 'campaign',
          },
          {
            to: '/messages',
            label: 'Messages',
            icon: 'mail',
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
        to: '/marks/enter',
        label: 'Enter Marks',
        icon: 'edit_note',
      },

      {
        to: '/logbook',
        label: 'Add Lesson Note',
        icon: 'menu_book',
      },

      {
        to: '/classes',
        label: 'View My Classes',
        icon: 'layers',
      },

      {
        to: '/exams',
        label: 'View Exams',
        icon: 'assignment',
      },

      {
        to: '/notices',
        label: 'View Notices',
        icon: 'campaign',
      },
    ],
  },

  // ================================================================
  // DASHBOARD
  // ================================================================
  dashboard: {
    widgets: [
      // ------------------------------------------------------------
      // Today's teaching schedule
      // ------------------------------------------------------------
      'todayClasses',
      'todaySchedule',

      // ------------------------------------------------------------
      // Student monitoring
      // ------------------------------------------------------------
      'attendance',
      'attendanceAlerts',

      // ------------------------------------------------------------
      // Lesson planning
      // ------------------------------------------------------------
      'lessonNotes',
      'teachingLogs',

      // ------------------------------------------------------------
      // Assessment
      // ------------------------------------------------------------
      'assignments',
      'marksPending',
      'examSchedule',

      // ------------------------------------------------------------
      // Academic performance
      // ------------------------------------------------------------
      'classPerformance',

      // ------------------------------------------------------------
      // Communication
      // ------------------------------------------------------------
      'messages',
      'notices',

      // ------------------------------------------------------------
      // Tasks requiring teacher attention
      // ------------------------------------------------------------
      'pendingTasks',
    ],
  },

  // ================================================================
  // NAVBAR
  // ================================================================
  navbar: {
    // Global search
    showSearch: true,

    // Communication / alerts
    showNotifications: true,
    showMessages: true,

    // Teacher-specific navigation
    showTodayClasses: true,

    // Account
    showProfile: true,

    // Academic context
    showAcademicYear: true,
    showTermSelector: true,

    // Calendar / timetable
    showCalendar: true,

    // Language support
    showLanguage: true,

    // Theme support
    showThemeSwitch: true,
  },
};