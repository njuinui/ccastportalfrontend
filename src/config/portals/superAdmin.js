// src/config/portals/superAdmin.js
//
// CCAST SCHOOL MANAGEMENT SYSTEM
// Super Admin Portal Configuration
//

export default {
  id: "super-admin",

  label: "Super Admin",

  defaultRoute: "/super-admin",

  accentColor: "#7c3aed",

  icon: "admin_panel_settings",

  sidebar: {
    sections: [
      // =========================================================
      // OVERVIEW
      // =========================================================
      {
        section: "Overview",

        items: [
          {
            to: "/super-admin",
            label: "Dashboard",
            icon: "dashboard",
            exact: true,
          },
        ],
      },

      // =========================================================
      // PEOPLE & ACCESS
      // =========================================================
      {
        section: "People & Access",

        items: [
          {
            to: "/users",
            label: "Users",
            icon: "manage_accounts",
          },

          {
            to: "/roles",
            label: "Roles & Permissions",
            icon: "admin_panel_settings",
          },

          {
            to: "/students",
            label: "Students",
            icon: "group",
          },

          {
            to: "/parents",
            label: "Parents",
            icon: "diversity_3",
          },

          {
            to: "/staff",
            label: "Staff",
            icon: "badge",
          },
        ],
      },

      // =========================================================
      // ADMISSIONS
      // =========================================================
      {
        section: "Admissions",

        items: [
          {
            to: "/admissions",
            label: "Applications",
            icon: "how_to_reg",
          },

          {
            to: "/admission-settings",
            label: "Admission Settings",
            icon: "settings",
          },
        ],
      },

      // =========================================================
      // ACADEMICS
      // =========================================================
      {
        section: "Academics",

        items: [
          {
            to: "/classes",
            label: "Classes",
            icon: "layers",
          },

          {
            to: "/subjects",
            label: "Subjects",
            icon: "menu_book",
          },

          {
            to: "/academic-years",
            label: "Academic Years",
            icon: "calendar_month",
          },

          {
            to: "/timetable",
            label: "Timetable",
            icon: "calendar_month",
          },

          {
            to: "/teaching-logbook",
            label: "Teaching Logbook",
            icon: "menu_book",
          },

          {
            to: "/curricular-activities",
            label: "Curricular Activities",
            icon: "event_note",
          },

          {
            to: "/attendance",
            label: "Attendance",
            icon: "fact_check",
          },

          {
            to: "/exams",
            label: "Exams",
            icon: "assignment",
          },

          {
            to: "/report-cards",
            label: "Report Cards",
            icon: "workspace_premium",
          },
        ],
      },

      // =========================================================
      // CONTENT & COMMUNICATION
      // =========================================================
      {
        section: "Content & Communication",

        items: [
          {
            to: "/notices",
            label: "Notices",
            icon: "campaign",
          },

          {
            to: "/blog-posts",
            label: "Blog Posts",
            icon: "article",
          },

          {
            to: "/careers/vacancies",
            label: "Careers & Vacancies",
            icon: "work",
          },

          {
            to: "/careers/applications",
            label: "Job Applications",
            icon: "assignment_ind",
          },
        ],
      },

      // =========================================================
      // ACTIVITIES & COMMUNITY
      // =========================================================
      {
        section: "Activities & Community",

        items: [
          {
            to: "/pta-meetings",
            label: "PTA Meetings",
            icon: "groups",
          },

          {
            to: "/discipline",
            label: "Discipline",
            icon: "gavel",
          },
        ],
      },

      // =========================================================
      // FINANCE
      // =========================================================
      {
        section: "Finance",

        items: [
          {
            to: "/fees",
            label: "Fee Collection",
            icon: "payments",
          },

          {
            to: "/fee-structures",
            label: "Fee Structure",
            icon: "request_quote",
          },

          {
            to: "/expenses",
            label: "Expenses",
            icon: "account_balance_wallet",
          },

          {
            to: "/finance/reports",
            label: "Financial Reports",
            icon: "bar_chart",
          },
        ],
      },

      // =========================================================
      // SYSTEM
      // =========================================================
      {
        section: "System",

        items: [
          {
            to: "/settings",
            label: "System Settings",
            icon: "settings",
          },

          {
            to: "/audit-logs",
            label: "Audit Logs",
            icon: "history",
          },

          {
            to: "/system/backup",
            label: "Backup & Restore",
            icon: "backup",
          },
        ],
      },
    ],

    // =========================================================
    // QUICK ACTIONS
    // =========================================================
    quickActions: [
      {
        to: "/students/new",
        label: "Add Student",
        icon: "person_add",
      },

      {
        to: "/staff/new",
        label: "Add Staff",
        icon: "person_add",
      },

      {
        to: "/careers/vacancies/new",
        label: "Post Vacancy",
        icon: "work",
      },

      {
        to: "/users",
        label: "Manage Users",
        icon: "manage_accounts",
      },

      {
        to: "/admissions",
        label: "Review Admissions",
        icon: "how_to_reg",
      },
    ],
  },

  dashboard: {
    widgets: [
      "totalStudents",
      "totalStaff",
      "totalParents",
      "totalUsers",
      "totalClasses",

      "revenue",
      "expenses",
      "outstandingFees",

      "attendanceToday",

      "admissions",

      "disciplineCases",

      "teachingSessions",

      "upcomingExams",

      "announcements",

      "vacancies",

      "jobApplications",

      "recentActivity",

      "systemHealth",
    ],
  },

  navbar: {
    showSearch: true,

    showNotifications: true,

    showMessages: true,

    showCalendar: true,

    showThemeSwitch: true,

    showLanguage: true,

    showAcademicYear: true,

    showTermSelector: true,

    searchPlaceholder:
      "Search students, staff, users, admissions, vacancies…",
  },
};