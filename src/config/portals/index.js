import superAdminConfig from './superAdmin';
import principalConfig from './principal';
import vicePrincipalConfig from './vicePrincipal';
import bursarConfig from './bursar';
import librarianConfig from './librarian';
import teacherConfig from './teacher';
import parentConfig from './parent';
import studentConfig from './student';

/* ── All portal configs keyed by role ── */
export const PORTAL_CONFIGS = {
  'super-admin': superAdminConfig,
  'principal': principalConfig,
  'vice-principal': vicePrincipalConfig,
  'bursar': bursarConfig,
  'librarian': librarianConfig,
  'teacher': teacherConfig,
  'parent': parentConfig,
  'student': studentConfig,
};

/* ── Fallback for unknown roles ── */
const FALLBACK_CONFIG = {
  id: 'default',
  label: 'Portal',
  defaultRoute: '/dashboard',
  accentColor: '#64748b',
  icon: 'dashboard',
  sidebar: {
    sections: [
      { section: 'Overview' },
      { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', exact: true },
    ],
    quickActions: [],
  },
  dashboard: { widgets: [] },
  navbar: {
    showSearch: true,
    showNotifications: true,
    showProfile: true,
  },
};

/* ── Normalize sidebar sections to flat format ──
   Portal configs use two formats:
     Format A (parent, student): flat array with { section: 'Name' } separators
     Format B (bursar, principal, etc.): { section: 'Name', items: [...] } objects

   This function converts Format B → Format A so AppShell only needs
   one rendering path.
*/
function normalizeSidebarSections(rawSections) {
  if (!Array.isArray(rawSections)) return [];

  const flat = [];
  for (const entry of rawSections) {
    if (entry && entry.items && Array.isArray(entry.items)) {
      // Format B — extract the section label, then flatten items
      flat.push({ section: entry.section });
      flat.push(...entry.items);
    } else {
      // Format A — already flat, push as-is
      flat.push(entry);
    }
  }
  return flat;
}

function normalizePortalConfig(config) {
  const rawSections = config.sidebar?.sections || [];
  return {
    ...config,
    sidebar: {
      ...config.sidebar,
      sections: normalizeSidebarSections(rawSections),
    },
  };
}

/* ── Public API ── */
export function getPortalConfig(role) {
  if (!role) return normalizePortalConfig(FALLBACK_CONFIG);
  const raw = PORTAL_CONFIGS[role] || FALLBACK_CONFIG;
  return normalizePortalConfig(raw);
}

export function getDefaultRoute(role) {
  const config = getPortalConfig(role);
  return config.defaultRoute || '/dashboard';
}

export function getPortalRoles() {
  return Object.keys(PORTAL_CONFIGS);
}

export function getPortalLabel(role) {
  const config = getPortalConfig(role);
  return config.label || role;
}