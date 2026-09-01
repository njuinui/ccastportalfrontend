// src/config/portals/bursar.js

/**
 * Bursar Portal Configuration
 *
 * Responsibilities:
 * - School fee collection
 * - Receipts and invoices
 * - Outstanding balances
 * - Financial reports
 * - Expenses and daily accounts
 * - Financial records
 * - Limited student/admission visibility
 *
 * IMPORTANT:
 * These routes should only be rendered when the corresponding
 * React routes/pages actually exist in App.jsx.
 */

export default {
  id: 'bursar',
  label: 'Bursar',
  description: 'Financial management and fee administration',
  defaultRoute: '/finance',

  accentColor: '#059669',
  icon: 'payments',

  sidebar: {
    sections: [
      {
        section: 'Overview',
        items: [
          {
            to: '/finance',
            label: 'Dashboard',
            icon: 'dashboard',
            exact: true,
          },
        ],
      },

      {
        section: 'Collections',
        items: [
          {
            to: '/fees',
            label: 'Fee Collection',
            icon: 'payments',
          },
          {
            to: '/daily-collection',
            label: 'Daily Collection',
            icon: 'receipt_long',
          },
          {
            to: '/fees/receipts',
            label: 'Receipts',
            icon: 'receipt',
          },
          {
            to: '/fees/invoices',
            label: 'Invoices',
            icon: 'request_quote',
          },
          {
            to: '/student-fees',
            label: 'Student Accounts',
            icon: 'account_balance_wallet',
          },
        ],
      },

      {
        section: 'Financial Management',
        items: [
          {
            to: '/fee-structures',
            label: 'Fee Structures',
            icon: 'account_balance',
          },
          {
            to: '/expenses',
            label: 'Expenses',
            icon: 'shopping_cart',
          },
          {
            to: '/daily-accounts',
            label: 'Daily Accounts',
            icon: 'account_balance_wallet',
          },
          {
            to: '/financial-reconciliation',
            label: 'Reconciliation',
            icon: 'fact_check',
          },
        ],
      },

      {
        section: 'Reports',
        items: [
          {
            to: '/reports/financial',
            label: 'Financial Reports',
            icon: 'analytics',
          },
          {
            to: '/reports/monthly',
            label: 'Monthly Report',
            icon: 'bar_chart',
          },
          {
            to: '/reports/collection',
            label: 'Collection Report',
            icon: 'summarize',
          },
          {
            to: '/reports/defaulters',
            label: 'Defaulters',
            icon: 'warning',
          },
          {
            to: '/reports/expenses',
            label: 'Expense Report',
            icon: 'receipt_long',
          },
        ],
      },

      {
        section: 'Records',
        items: [
          {
            to: '/students',
            label: 'Students',
            icon: 'group',
          },
          {
            to: '/admissions',
            label: 'Admissions',
            icon: 'how_to_reg',
          },
          {
            to: '/classes',
            label: 'Classes',
            icon: 'layers',
          },
          {
            to: '/stock',
            label: 'Inventory',
            icon: 'inventory_2',
          },
        ],
      },

      {
        section: 'Academic',
        items: [
          {
            to: '/exams',
            label: 'Exams',
            icon: 'assignment',
          },
          {
            to: '/hall-tickets',
            label: 'Hall Tickets',
            icon: 'confirmation_number',
          },
        ],
      },

      {
        section: 'Communication',
        items: [
          {
            to: '/notices',
            label: 'Notices',
            icon: 'campaign',
          },
          {
            to: '/complaints',
            label: 'Complaints',
            icon: 'report',
          },
        ],
      },
    ],

    quickActions: [
      {
        to: '/fees/receive',
        label: 'Receive Payment',
        icon: 'payments',
      },
      {
        to: '/fees/invoices/create',
        label: 'Create Invoice',
        icon: 'request_quote',
      },
      {
        to: '/expenses/create',
        label: 'Record Expense',
        icon: 'add_card',
      },
      {
        to: '/student-fees',
        label: 'Search Student',
        icon: 'person_search',
      },
    ],
  },

  dashboard: {
    widgets: [
      'todayCollection',
      'monthlyRevenue',
      'outstandingFees',
      'defaulters',
      'collectionOverview',
      'feeCollectionTrend',
      'outstandingOverview',
      'recentTransactions',
      'invoices',
      'receipts',
      'expenses',
      'pendingPayments',
      'upcomingEvents',
      'financialAlerts',
      'systemStatus',
    ],
  },

  navbar: {
    showSearch: true,
    showNotifications: true,
    showMessages: true,
    showCalendar: true,
    showProfile: true,

    // These should only be enabled if AppShell actually renders
    // the corresponding controls.
    showAcademicYear: true,
    showTermSelector: true,

    // Useful for financial users.
    showPendingPayments: true,
  },

  permissions: {
    viewStudents: true,
    viewAdmissions: true,
    viewClasses: true,

    viewFees: true,
    collectFees: true,
    createInvoices: true,
    issueReceipts: true,

    viewFeeStructures: true,

    viewExpenses: true,
    createExpenses: true,

    viewFinancialReports: true,
    viewDefaulters: true,

    viewExams: true,
    manageHallTickets: true,

    viewNotices: true,
    viewComplaints: true,

    // Should normally remain false for a bursar.
    manageUsers: false,
    manageRoles: false,
    manageSystemSettings: false,
  },
};