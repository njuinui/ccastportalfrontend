// src/api/dashboard.js
// ============================================================
// CCAST SCHOOL MANAGEMENT SYSTEM
// Dashboard API Hooks
// React Query + Axios
//
// Product-ready dashboard data layer.
//
// IMPORTANT:
// - Dashboard authorization is enforced by Laravel.
// - `enabled` prevents inappropriate frontend requests.
// - Parent endpoints MUST NOT be called for non-parent users.
// - React Query handles caching, cancellation and refetching.
// ============================================================

import { useQuery } from "@tanstack/react-query";
import client from "./client";

/* ============================================================
   QUERY KEYS
============================================================ */

export const DASHBOARD_QUERY_KEYS = Object.freeze({
    vacancies: ["admin", "vacancies", "summary"],
    adminStats: ["admin", "stats"],
    adminFeed: ["admin", "feed"],

    vicePrincipal: ["vice-principal", "dashboard"],

    disciplineMaster: ["discipline-master", "dashboard"],

    bursar: ["bursar", "dashboard"],

    teacher: ["teachers", "dashboard"],

    librarian: ["librarians", "dashboard"],

    student: ["students", "dashboard"],

    parent: (childId) => [
        "parents",
        "dashboard",
        childId,
    ],

    parentChildren: ["parents", "children"],

    childDetails: (childId) => [
        "parents",
        "children",
        childId,
        "details",
    ],

    childAttendance: (childId, period) => [
        "parents",
        "children",
        childId,
        "attendance",
        period,
    ],

    childResults: (childId) => [
        "parents",
        "children",
        childId,
        "results",
    ],

    childFees: (childId) => [
        "parents",
        "children",
        childId,
        "fees",
    ],

    childTimetable: (childId) => [
        "parents",
        "children",
        childId,
        "timetable",
    ],

    childHomework: (childId) => [
        "parents",
        "children",
        childId,
        "homework",
    ],

    parentMessages: ["parents", "messages"],

    parentNotices: ["parents", "notices"],
});



export function useVacancySummary(options = {}) {
    return useQuery({
        queryKey:
            DASHBOARD_QUERY_KEYS.vacancies,

        queryFn: ({ signal }) =>
            get("/dashboard/vacancies/summary", {
                signal,
            }),

        staleTime: 60_000,

        refetchOnWindowFocus: true,

        retry: dashboardRetry,

        ...options,
    });
}


/* ============================================================
   DEFAULT QUERY CONFIGURATION
============================================================ */

const DASHBOARD_QUERY_DEFAULTS = Object.freeze({
  staleTime: 30_000,

  refetchInterval: 60_000,

  refetchOnWindowFocus: true,

  refetchOnReconnect: true,

  retry: 2,
});


const STANDARD_QUERY_DEFAULTS = Object.freeze({
  staleTime: 60_000,

  refetchOnWindowFocus: true,

  refetchOnReconnect: true,

  retry: 2,
});


const PARENT_LIST_QUERY_DEFAULTS = Object.freeze({
  staleTime: 5 * 60 * 1000,

  refetchOnWindowFocus: true,

  refetchOnReconnect: true,

  retry: 2,
});


/* ============================================================
   ERROR-AWARE RETRY
============================================================ */

/**
 * Avoid retrying authorization and client errors.
 *
 * 401 / 403 / 404 normally indicate that retrying will not
 * solve the problem.
 *
 * Network errors and 5xx errors can still be retried.
 */
const dashboardRetry = (failureCount, error) => {
  const status =
    error?.response?.status ??
    error?.status;

  if (
    status === 401 ||
    status === 403 ||
    status === 404
  ) {
    return false;
  }

  return failureCount < 2;
};


/* ============================================================
   REQUEST HELPERS
============================================================ */

/**
 * GET helper.
 *
 * Keeping API calls in one place makes the dashboard hooks
 * smaller and consistent.
 */
const get = async (
  endpoint,
  {
    signal,
    params,
  } = {}
) => {
  const response = await client.get(endpoint, {
    signal,
    ...(params ? { params } : {}),
  });

  return response.data;
};


/* ============================================================
   ADMIN DASHBOARD
============================================================ */

/**
 * Main administration statistics.
 *
 * GET /api/dashboard/stats
 */
export function useDashboardStats(options = {}) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.adminStats,

    queryFn: ({ signal }) =>
      get("/dashboard/stats", {
        signal,
      }),

    ...DASHBOARD_QUERY_DEFAULTS,

    retry: dashboardRetry,

    ...options,
  });
}


/**
 * Administrative activity/feed.
 *
 * GET /api/dashboard/admin-feed
 */
export function useAdminFeed(options = {}) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.adminFeed,

    queryFn: ({ signal }) =>
      get("/dashboard/admin-feed", {
        signal,
      }),

    ...DASHBOARD_QUERY_DEFAULTS,

    retry: dashboardRetry,

    ...options,
  });
}


/* ============================================================
   VICE PRINCIPAL DASHBOARD
============================================================ */

/**
 * Vice Principal dashboard.
 *
 * GET /api/dashboard/vice-principal
 *
 * Expected response:
 *
 * {
 *   stats: {},
 *   attendance: {},
 *   attention: {},
 *   teaching_today: [],
 *   academic_performance: [],
 *   discipline_incidents: [],
 *   upcoming_exams: [],
 *   announcements: [],
 *   recent_activity: []
 * }
 *
 * IMPORTANT:
 * This endpoint is completely separate from the admin
 * dashboard and parent dashboard.
 */
export function useVicePrincipalDashboard(options = {}) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.vicePrincipal,

    queryFn: ({ signal }) =>
      get("/dashboard/vice-principal", {
        signal,
      }),

    ...DASHBOARD_QUERY_DEFAULTS,

    retry: dashboardRetry,

    ...options,
  });
}


/* ============================================================
   BURSAR DASHBOARD
============================================================ */

/**
 * GET /api/dashboard/bursar
 */
export function useBursarDashboard(options = {}) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.bursar,

    queryFn: ({ signal }) =>
      get("/dashboard/bursar", {
        signal,
      }),

    ...DASHBOARD_QUERY_DEFAULTS,

    retry: dashboardRetry,

    ...options,
  });
}


/* ============================================================
   TEACHER DASHBOARD
============================================================ */

/**
 * GET /api/dashboard/teacher
 */
export function useTeacherDashboard(options = {}) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.teacher,

    queryFn: ({ signal }) =>
      get("/dashboard/teacher", {
        signal,
      }),

    ...DASHBOARD_QUERY_DEFAULTS,

    retry: dashboardRetry,

    ...options,
  });
}


/* ============================================================
   LIBRARIAN DASHBOARD
============================================================ */

/**
 * GET /api/dashboard/librarian
 */
export function useLibrarianDashboard(options = {}) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.librarian,

    queryFn: ({ signal }) =>
      get("/dashboard/librarian", {
        signal,
      }),

    ...DASHBOARD_QUERY_DEFAULTS,

    retry: dashboardRetry,

    ...options,
  });
}


/* ============================================================
   DISCIPLINE MASTER DASHBOARD
============================================================ */

/**
 * Discipline Master dashboard.
 *
 * GET /api/dashboard/discipline-master
 *
 * Expected response:
 *
 * {
 *   stats: {},
 *   attendance: {},
 *   discipline_overview: {},
 *   incidents_trend: [],
 *   incident_categories: [],
 *   class_discipline_ranking: [],
 *   absence_trend: [],
 *   late_arrival_trend: [],
 *   recent_incidents: [],
 *   pending_cases: [],
 *   upcoming_hearings: [],
 *   students_requiring_attention: [],
 *   repeat_offenders: [],
 *   parent_notifications: [],
 *   messages: [],
 *   school_notices: [],
 *   upcoming_events: [],
 *   recent_activities: []
 * }
 */
// export function useDisciplineMasterDashboard(
//     options = {}
// ) {
//     return useQuery({
//         queryKey:
//             DASHBOARD_QUERY_KEYS.disciplineMaster,

//         queryFn: ({ signal }) =>
//             get(
//                 "/dashboard/discipline-master",
//                 {
//                     signal,
//                 }
//             ),

//         ...DASHBOARD_QUERY_DEFAULTS,

//         retry: dashboardRetry,

//         ...options,
//     });
// }

/* ============================================================
   DISCIPLINE MASTER DASHBOARD
============================================================ */

/**
 * Discipline Master dashboard.
 *
 * GET /api/dashboard/discipline-master
 *
 * Expected response:
 *
 * {
 *   stats: {},
 *   attendance: {},
 *   discipline_overview: {},
 *   incidents_trend: [],
 *   incident_categories: [],
 *   class_discipline_ranking: [],
 *   recent_incidents: [],
 *   pending_cases: [],
 *   upcoming_hearings: [],
 *   students_requiring_attention: [],
 *   repeat_offenders: [],
 *   parent_notifications: [],
 *   messages: [],
 *   recent_activities: []
 * }
 */
export function useDisciplineMasterDashboard(
    options = {}
) {
    return useQuery({
        queryKey:
            DASHBOARD_QUERY_KEYS.disciplineMaster,

        queryFn: ({ signal }) =>
            get(
                "/dashboard/discipline-master",
                {
                    signal,
                }
            ),

        ...DASHBOARD_QUERY_DEFAULTS,

        retry: dashboardRetry,

        ...options,
    });
}


/* ============================================================
   STUDENT DASHBOARD
============================================================ */

/**
 * GET /api/me/dashboard
 */
export function useStudentDashboard(options = {}) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.student,

    queryFn: ({ signal }) =>
      get("/me/dashboard", {
        signal,
      }),

    ...DASHBOARD_QUERY_DEFAULTS,

    retry: dashboardRetry,

    ...options,
  });
}


/* ============================================================
   PARENT DASHBOARD
============================================================ */

/**
 * Parent dashboard for a specific child.
 *
 * GET /api/dashboard/parent?child_id={childId}
 *
 * This hook will NEVER request the endpoint when there is no
 * child ID.
 */
export function useParentDashboard(
  childId,
  options = {}
) {
  const hasChildId =
    childId !== null &&
    childId !== undefined &&
    String(childId).trim() !== "";

  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.parent(childId),

    queryFn: ({ signal }) =>
      get("/dashboard/parent", {
        signal,
        params: {
          child_id: childId,
        },
      }),

    enabled:
      hasChildId &&
      (options.enabled ?? true),

    ...DASHBOARD_QUERY_DEFAULTS,

    retry: dashboardRetry,

    ...options,
  });
}


/* ============================================================
   PARENT — CHILDREN
============================================================ */

/**
 * Get children belonging to the authenticated parent.
 *
 * GET /api/parent/children
 *
 * IMPORTANT:
 * This hook should be enabled ONLY for authenticated parents.
 *
 * Usage:
 *
 * const { user } = useAuth();
 *
 * const isParent =
 *   user?.role === "parent" ||
 *   user?.role?.slug === "parent";
 *
 * useParentChildren({
 *   enabled: isParent,
 * });
 */
export function useParentChildren(options = {}) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.parentChildren,

    queryFn: ({ signal }) =>
      get("/parent/children", {
        signal,
      }),

    ...PARENT_LIST_QUERY_DEFAULTS,

    retry: dashboardRetry,

    /*
     * Default to true for backwards compatibility.
     *
     * Parent pages should explicitly pass:
     *
     * enabled: isParent
     *
     * to guarantee role isolation.
     */
    enabled: options.enabled ?? true,

    ...options,
  });
}


/* ============================================================
   PARENT — CHILD DETAILS
============================================================ */

export function useChildDetails(
  childId,
  options = {}
) {
  const hasChildId =
    childId !== null &&
    childId !== undefined &&
    String(childId).trim() !== "";

  return useQuery({
    queryKey:
      DASHBOARD_QUERY_KEYS.childDetails(childId),

    queryFn: ({ signal }) =>
      get(`/parent/children/${childId}`, {
        signal,
      }),

    enabled:
      hasChildId &&
      (options.enabled ?? true),

    ...STANDARD_QUERY_DEFAULTS,

    retry: dashboardRetry,

    ...options,
  });
}


/* ============================================================
   PARENT — CHILD ATTENDANCE
============================================================ */

export function useChildAttendance(
  childId,
  period = "month",
  options = {}
) {
  const hasChildId =
    childId !== null &&
    childId !== undefined &&
    String(childId).trim() !== "";

  const normalizedPeriod =
    period || "month";

  return useQuery({
    queryKey:
      DASHBOARD_QUERY_KEYS.childAttendance(
        childId,
        normalizedPeriod
      ),

    queryFn: ({ signal }) =>
      get(
        `/parent/children/${childId}/attendance`,
        {
          signal,
          params: {
            period: normalizedPeriod,
          },
        }
      ),

    enabled:
      hasChildId &&
      (options.enabled ?? true),

    ...STANDARD_QUERY_DEFAULTS,

    retry: dashboardRetry,

    ...options,
  });
}


/* ============================================================
   PARENT — CHILD RESULTS
============================================================ */

export function useChildResults(
  childId,
  options = {}
) {
  const hasChildId =
    childId !== null &&
    childId !== undefined &&
    String(childId).trim() !== "";

  return useQuery({
    queryKey:
      DASHBOARD_QUERY_KEYS.childResults(childId),

    queryFn: ({ signal }) =>
      get(
        `/parent/children/${childId}/results`,
        {
          signal,
        }
      ),

    enabled:
      hasChildId &&
      (options.enabled ?? true),

    ...STANDARD_QUERY_DEFAULTS,

    retry: dashboardRetry,

    ...options,
  });
}


/* ============================================================
   PARENT — CHILD FEES
============================================================ */

export function useChildFees(
  childId,
  options = {}
) {
  const hasChildId =
    childId !== null &&
    childId !== undefined &&
    String(childId).trim() !== "";

  return useQuery({
    queryKey:
      DASHBOARD_QUERY_KEYS.childFees(childId),

    queryFn: ({ signal }) =>
      get(
        `/parent/children/${childId}/fees`,
        {
          signal,
        }
      ),

    enabled:
      hasChildId &&
      (options.enabled ?? true),

    ...STANDARD_QUERY_DEFAULTS,

    retry: dashboardRetry,

    ...options,
  });
}


/* ============================================================
   PARENT — CHILD TIMETABLE
============================================================ */

export function useChildTimetable(
  childId,
  options = {}
) {
  const hasChildId =
    childId !== null &&
    childId !== undefined &&
    String(childId).trim() !== "";

  return useQuery({
    queryKey:
      DASHBOARD_QUERY_KEYS.childTimetable(childId),

    queryFn: ({ signal }) =>
      get(
        `/parent/children/${childId}/timetable`,
        {
          signal,
        }
      ),

    enabled:
      hasChildId &&
      (options.enabled ?? true),

    ...STANDARD_QUERY_DEFAULTS,

    retry: dashboardRetry,

    ...options,
  });
}


/* ============================================================
   PARENT — CHILD HOMEWORK
============================================================ */

export function useChildHomework(
  childId,
  options = {}
) {
  const hasChildId =
    childId !== null &&
    childId !== undefined &&
    String(childId).trim() !== "";

  return useQuery({
    queryKey:
      DASHBOARD_QUERY_KEYS.childHomework(childId),

    queryFn: ({ signal }) =>
      get(
        `/parent/children/${childId}/homework`,
        {
          signal,
        }
      ),

    enabled:
      hasChildId &&
      (options.enabled ?? true),

    ...STANDARD_QUERY_DEFAULTS,

    retry: dashboardRetry,

    ...options,
  });
}


/* ============================================================
   PARENT — MESSAGES
============================================================ */

export function useParentMessages(
  options = {}
) {
  return useQuery({
    queryKey:
      DASHBOARD_QUERY_KEYS.parentMessages,

    queryFn: ({ signal }) =>
      get("/parent/messages", {
        signal,
      }),

    staleTime: 30_000,

    refetchInterval: 30_000,

    refetchOnWindowFocus: true,

    refetchOnReconnect: true,

    retry: dashboardRetry,

    enabled:
      options.enabled ?? true,

    ...options,
  });
}


/* ============================================================
   PARENT — NOTICES
============================================================ */

export function useParentNotices(
  options = {}
) {
  return useQuery({
    queryKey:
      DASHBOARD_QUERY_KEYS.parentNotices,

    queryFn: ({ signal }) =>
      get("/parent/notices", {
        signal,
      }),

    staleTime: 30_000,

    refetchInterval: 60_000,

    refetchOnWindowFocus: true,

    refetchOnReconnect: true,

    retry: dashboardRetry,

    enabled:
      options.enabled ?? true,

    ...options,
  });
}


/* ============================================================
   END
============================================================ */