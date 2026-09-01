// src/config/portals/librarian.js
export default {
  id: 'librarian',
  label: 'Librarian',
  defaultRoute: '/librarian',
  accentColor: '#8b5cf6',
  icon: 'local_library',
  
  sidebar: {
    sections: [
      {
        section: 'Library',
        items: [
          { to: '/librarian', label: 'Dashboard', icon: 'dashboard', exact: true },
          { to: '/librarian/books', label: 'Books', icon: 'menu_book' },
          { to: '/librarian/issued', label: 'Issued Books', icon: 'bookmark' },
          { to: '/librarian/returned', label: 'Returned Books', icon: 'undo' },
        ]
      },
      {
        section: 'Management',
        items: [
          { to: '/librarian/overdue', label: 'Overdue', icon: 'warning' },
          { to: '/librarian/fines', label: 'Fines', icon: 'payments' },
          { to: '/librarian/reservations', label: 'Reservations', icon: 'bookmark_add' },
        ]
      },
      {
        section: 'Inventory',
        items: [
          { to: '/librarian/new-arrivals', label: 'New Arrivals', icon: 'new_releases' },
          { to: '/librarian/inventory', label: 'Inventory', icon: 'inventory_2' },
        ]
      }
    ],
    quickActions: [
      { to: '/librarian/books/issue', label: 'Issue Book', icon: 'bookmark' },
      { to: '/librarian/books/return', label: 'Return Book', icon: 'undo' },
      { to: '/librarian/books/add', label: 'Add Book', icon: 'add' },
    ]
  },

  dashboard: {
    widgets: [
      'totalBooks',
      'issuedBooks',
      'returnedBooks',
      'overdue',
      'fines',
      'reservations',
      'newArrivals',
      'inventory'
    ]
  },

  navbar: {
    showSearch: true,
    showNotifications: true,
    showProfile: true,
  }
};