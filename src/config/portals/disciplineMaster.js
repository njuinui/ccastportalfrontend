// src/config/portals/disciplineMaster.js

/**
 * Discipline Master Portal
 *
 * Responsibilities:
 * - Monitor student attendance
 * - Manage disciplinary incidents
 * - Record investigations and interventions
 * - Track warnings, sanctions and suspensions
 * - Monitor repeat offenders
 * - Communicate with parents/students/staff
 * - Generate discipline and attendance reports
 */

export default {
  id: 'discipline-master',
  label: 'Discipline Master',
  defaultRoute: '/discipline',
  accentColor: '#dc2626',
  icon: 'gavel',

  sidebar: {
    sections: [
      // ─────────────────────────────────────────────
      // OVERVIEW
      // ─────────────────────────────────────────────
      {
        section: 'Overview',
        items: [
          {
            to: '/discipline',
            label: 'Dashboard',
            icon: 'dashboard',
            exact: true,
          },
        ],
      },

      // ─────────────────────────────────────────────
      // STUDENT MONITORING
      // ─────────────────────────────────────────────
      {
        section: 'Student Monitoring',
        items: [
          {
            to: '/students',
            label: 'Students',
            icon: 'groups',
          },
          {
            to: '/classes',
            label: 'Classes',
            icon: 'class',
          },
          {
            to: '/attendance',
            label: 'Attendance',
            icon: 'fact_check',
          },
          {
            to: '/attendance/absences',
            label: 'Absence Monitoring',
            icon: 'person_off',
          },
          {
            to: '/attendance/late',
            label: 'Late Arrivals',
            icon: 'schedule',
          },
        ],
      },

      // ─────────────────────────────────────────────
      // DISCIPLINE
      // ─────────────────────────────────────────────
      {
        section: 'Discipline',
        items: [
          {
            to: '/discipline/incidents',
            label: 'Incidents',
            icon: 'report_problem',
          },
          {
            to: '/discipline/incidents/new',
            label: 'Record Incident',
            icon: 'add_circle',
          },
          {
            to: '/discipline/cases',
            label: 'Disciplinary Cases',
            icon: 'gavel',
          },
          {
            to: '/discipline/investigations',
            label: 'Investigations',
            icon: 'manage_search',
          },
          {
            to: '/discipline/hearings',
            label: 'Hearings',
            icon: 'gavel',
          },
          {
            to: '/discipline/warnings',
            label: 'Warnings',
            icon: 'warning',
          },
          {
            to: '/discipline/sanctions',
            label: 'Sanctions',
            icon: 'rule',
          },
          {
            to: '/discipline/suspensions',
            label: 'Suspensions',
            icon: 'block',
          },
        ],
      },

      // ─────────────────────────────────────────────
      // STUDENT BEHAVIOUR
      // ─────────────────────────────────────────────
      {
        section: 'Behaviour',
        items: [
          {
            to: '/discipline/behaviour',
            label: 'Behaviour Records',
            icon: 'psychology',
          },
          {
            to: '/discipline/repeat-offenders',
            label: 'Repeat Offenders',
            icon: 'history',
          },
          {
            to: '/discipline/interventions',
            label: 'Interventions',
            icon: 'support',
          },
          {
            to: '/discipline/good-conduct',
            label: 'Good Conduct',
            icon: 'verified',
          },
        ],
      },

      // ─────────────────────────────────────────────
      // COMMUNICATION
      // ─────────────────────────────────────────────
      {
        section: 'Communication',
        items: [
          {
            to: '/discipline/parents',
            label: 'Parent Communication',
            icon: 'family_restroom',
          },
          {
            to: '/discipline/messages',
            label: 'Messages',
            icon: 'chat',
            badge: 'messages',
          },
          {
            to: '/notices',
            label: 'School Notices',
            icon: 'campaign',
          },
        ],
      },

      // ─────────────────────────────────────────────
      // REPORTS
      // ─────────────────────────────────────────────
      {
        section: 'Reports',
        items: [
          {
            to: '/discipline/reports',
            label: 'Discipline Reports',
            icon: 'assessment',
          },
          {
            to: '/discipline/reports/incidents',
            label: 'Incident Report',
            icon: 'summarize',
          },
          {
            to: '/discipline/reports/attendance',
            label: 'Attendance Report',
            icon: 'fact_check',
          },
          {
            to: '/discipline/reports/absences',
            label: 'Absence Report',
            icon: 'person_off',
          },
          {
            to: '/discipline/reports/late-arrivals',
            label: 'Late Arrival Report',
            icon: 'schedule',
          },
          {
            to: '/discipline/reports/sanctions',
            label: 'Sanctions Report',
            icon: 'rule',
          },
        ],
      },

      // ─────────────────────────────────────────────
      // SUPPORT
      // ─────────────────────────────────────────────
      {
        section: 'Support',
        items: [
          {
            to: '/discipline/help',
            label: 'Help Center',
            icon: 'help',
          },
          {
            to: '/discipline/settings',
            label: 'Settings',
            icon: 'settings',
          },
        ],
      },
    ],

    // ─────────────────────────────────────────────
    // QUICK ACTIONS
    // ─────────────────────────────────────────────
    quickActions: [
      {
        to: '/discipline/incidents/new',
        label: 'Record Incident',
        icon: 'add_circle',
      },
      {
        to: '/attendance/take',
        label: 'Take Attendance',
        icon: 'how_to_reg',
      },
      {
        to: '/discipline/cases',
        label: 'Review Cases',
        icon: 'gavel',
      },
      {
        to: '/discipline/warnings',
        label: 'Issue Warning',
        icon: 'warning',
      },
      {
        to: '/discipline/parents',
        label: 'Contact Parent',
        icon: 'family_restroom',
      },
      {
        to: '/discipline/reports',
        label: 'Generate Report',
        icon: 'assessment',
      },
    ],
  },

  // ─────────────────────────────────────────────
  // DASHBOARD WIDGETS
  // ─────────────────────────────────────────────
  dashboard: {
    widgets: [
      'welcomeBanner',

      // KPIs
      'totalStudents',
      'attendanceToday',
      'absentToday',
      'lateToday',
      'openCases',
      'pendingInvestigations',
      'activeSuspensions',
      'repeatOffenders',

      // Discipline analytics
      'disciplineOverview',
      'incidentsTrend',
      'incidentCategories',
      'classDisciplineRanking',

      // Attendance
      'attendanceOverview',
      'absenceTrend',
      'lateArrivalTrend',

      // Cases
      'recentIncidents',
      'pendingCases',
      'upcomingHearings',

      // Student monitoring
      'studentsRequiringAttention',
      'repeatOffendersList',

      // Communication
      'parentNotifications',
      'messages',
      'schoolNotices',

      // Calendar
      'upcomingEvents',

      // Activity
      'recentActivities',

      // Actions
      'quickActions',
    ],
  },

  // ─────────────────────────────────────────────
  // NAVBAR
  // ─────────────────────────────────────────────
  navbar: {
    showSearch: true,
    showNotifications: true,
    showMessages: true,
    showCalendar: true,
    showProfile: true,

    // User preferences
    showLanguage: true,
    showDarkMode: true,

    // Academic context
    showAcademicYear: true,
    showTermSelector: true,

    // Discipline-specific
    showStudentSearch: true,
  },
};