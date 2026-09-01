// src/api/public.js

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "./client";
import toast from "react-hot-toast";

// ============================================================
// CONSTANTS & CONFIGURATION
// ============================================================

// Everything registered inside Route::prefix('public') in routes/api.php
// lives under this prefix. Centralized here so a route never gets missed
// again — change it in one place if the backend prefix ever changes.
const PUBLIC = "/public";

export const STALE_TIMES = {
  POSTS: 5 * 60 * 1000, // 5 minutes
  ANNOUNCEMENTS: 5 * 60 * 1000,
  SETTINGS: 60 * 1000, // 1 minute
  GALLERY: 15 * 60 * 1000, // 15 minutes
  EVENTS: 5 * 60 * 1000,
  ABOUT: 10 * 60 * 1000, // 10 minutes
  FAQ: 10 * 60 * 1000,
  STATUS: 30 * 1000, // 30 seconds
  ADMISSION: 30 * 1000,
};

export const RETRY_CONFIG = {
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

export const DEFAULT_QUERY_OPTIONS = {
  staleTime: STALE_TIMES.POSTS,
  retry: 2,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
};

// ============================================================
// 1. PUBLIC FORM SUBMISSIONS
// ============================================================

/**
 * Submit an admission application (public form)
 * Handles both FormData (with files) and plain objects
 * Route: POST /public/admissions
 */
export async function submitAdmission(payload) {
  try {
    let response;

    if (payload instanceof FormData) {
      response = await client.post(`${PUBLIC}/admissions`, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } else {
      const transformedPayload = transformAdmissionPayload(payload);
      response = await client.post(`${PUBLIC}/admissions`, transformedPayload);
    }

    return response.data;
  } catch (error) {
    console.error("Admission submission error:", error);
    if (error.response?.status === 422) {
      console.error("Validation errors:", error.response.data.errors);
    }
    throw error;
  }
}

/**
 * Transform frontend payload to match backend expectations
 * Only used for JSON payloads (non-file submissions)
 */
function transformAdmissionPayload(data) {
  return {
    student_first_name: data.first_name || data.student_first_name,
    student_last_name: data.last_name || data.student_last_name,
    student_gender: data.gender || data.student_gender,
    student_dob: data.date_of_birth || data.student_dob,
    student_pob: data.place_of_birth || data.student_pob,
    nationality: data.nationality,
    class_applying_for: data.grade_applying || data.class_applying_for,
    previous_school: data.previous_school,
    last_class: data.last_class,

    father_name: data.father_name,
    father_phone: data.father_phone,
    father_address: data.father_address,
    father_email: data.father_email,

    mother_name: data.mother_name,
    mother_phone: data.mother_phone,
    mother_address: data.mother_address,
    mother_email: data.mother_email,

    guardian_name: data.guardian_name || data.parent_name,
    guardian_relationship: data.guardian_relationship,
    guardian_phone: data.guardian_phone || data.parent_phone,
    guardian_address: data.guardian_address || data.address,
    guardian_email: data.guardian_email || data.parent_email || data.email,

    emergency_name: data.emergency_name,
    emergency_relationship: data.emergency_relationship,
    emergency_phone: data.emergency_phone,

    email: data.student_email || data.email,
    phone: data.student_phone || data.phone,

    academic_year: data.academic_year,

    year_completed: data.year_completed,
    reason_for_leaving: data.reason_for_leaving,
    achievements: data.achievements,
  };
}

/**
 * Submit a contact message (public form)
 * Route: POST /public/contact
 */
export async function submitContact(payload) {
  try {
    const response = await client.post(`${PUBLIC}/contact`, payload);
    return response.data;
  } catch (error) {
    console.error("Contact submission error:", error);
    throw error;
  }
}

/**
 * Subscribe to newsletter (public form)
 * Route: POST /public/newsletter/subscribe
 */
export async function subscribeNewsletter(email) {
  try {
    const response = await client.post(`${PUBLIC}/newsletter/subscribe`, { email });
    return response.data;
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    throw error;
  }
}

// ============================================================
// 2. PUBLIC CONTENT (Blog)
// Routes: GET /public/posts, GET /public/posts/{post}
// ============================================================

export function usePosts(options = {}) {
  return useQuery({
    queryKey: ["posts", options],
    queryFn: async () => {
      const response = await client.get(`${PUBLIC}/posts`, { params: options });
      return response.data;
    },
    staleTime: STALE_TIMES.POSTS,
    ...RETRY_CONFIG,
    ...options,
  });
}

export function usePost(slug, options = {}) {
  return useQuery({
    queryKey: ["post", slug],
    queryFn: async () => {
      const response = await client.get(`${PUBLIC}/posts/${slug}`);
      return response.data;
    },
    enabled: !!slug,
    staleTime: STALE_TIMES.POSTS,
    ...RETRY_CONFIG,
    ...options,
  });
}

export function usePostsByCategory(category, options = {}) {
  return useQuery({
    queryKey: ["posts", "category", category, options],
    queryFn: async () => {
      const response = await client.get(`${PUBLIC}/posts`, {
        params: { category, ...options }
      });
      return response.data;
    },
    enabled: !!category,
    staleTime: STALE_TIMES.POSTS,
    ...RETRY_CONFIG,
    ...options,
  });
}

export function useFeaturedPosts(options = {}) {
  return useQuery({
    queryKey: ["posts", "featured", options],
    queryFn: async () => {
      const response = await client.get(`${PUBLIC}/posts`, {
        params: { featured: true, ...options }
      });
      return response.data;
    },
    staleTime: STALE_TIMES.POSTS,
    ...RETRY_CONFIG,
    ...options,
  });
}

// ============================================================
// 3. PUBLIC CONTENT (Announcements)
// Routes: GET /public/announcements, GET /public/announcements/slug/{slug}
// ============================================================

export function useAnnouncements(options = {}) {
  return useQuery({
    queryKey: ["announcements", options],
    queryFn: async () => {
      const response = await client.get(`${PUBLIC}/announcements`, { params: options });
      return response.data;
    },
    staleTime: STALE_TIMES.ANNOUNCEMENTS,
    ...RETRY_CONFIG,
    ...options,
  });
}

export function useAnnouncement(slug, options = {}) {
  return useQuery({
    queryKey: ["announcement", slug],
    queryFn: async () => {
      const response = await client.get(`${PUBLIC}/announcements/slug/${slug}`);
      return response.data;
    },
    enabled: !!slug,
    staleTime: STALE_TIMES.ANNOUNCEMENTS,
    ...RETRY_CONFIG,
    ...options,
  });
}

export function usePinnedAnnouncements(options = {}) {
  return useQuery({
    queryKey: ["announcements", "pinned", options],
    queryFn: async () => {
      const response = await client.get(`${PUBLIC}/announcements`, {
        params: { pinned: true, ...options }
      });
      return response.data;
    },
    staleTime: STALE_TIMES.ANNOUNCEMENTS,
    ...RETRY_CONFIG,
    ...options,
  });
}

export function useAnnouncementsByCategory(category, options = {}) {
  return useQuery({
    queryKey: ["announcements", "category", category, options],
    queryFn: async () => {
      const response = await client.get(`${PUBLIC}/announcements`, {
        params: { category, ...options }
      });
      return response.data;
    },
    enabled: !!category,
    staleTime: STALE_TIMES.ANNOUNCEMENTS,
    ...RETRY_CONFIG,
    ...options,
  });
}

export function useRecentAnnouncements(limit = 3, options = {}) {
  return useQuery({
    queryKey: ["announcements", "recent", limit, options],
    queryFn: async () => {
      const response = await client.get(`${PUBLIC}/announcements`, {
        params: { limit, ...options }
      });
      return response.data;
    },
    staleTime: STALE_TIMES.ANNOUNCEMENTS,
    ...RETRY_CONFIG,
    ...options,
  });
}

// ============================================================
// 4. ADMISSION SETTINGS
// Route: GET /public/admission-settings
// ============================================================

export function useAdmissionSettings(options = {}) {
  return useQuery({
    queryKey: ["admission-settings-public"],
    queryFn: async () => {
      const response = await client.get(`${PUBLIC}/admission-settings`);
      return response.data;
    },
    staleTime: STALE_TIMES.SETTINGS,
    refetchOnWindowFocus: false,
    ...RETRY_CONFIG,
    ...options,
  });
}

export function useIsAdmissionOpen() {
  const { data, isLoading, error, ...rest } = useAdmissionSettings();

  return {
    isOpen: data?.is_open ?? false,
    settings: data,
    message: data?.message || 'Check back for admission updates.',
    isLoading,
    error,
    ...rest,
  };
}

export function useAdmissionMessage() {
  const { data, isLoading } = useAdmissionSettings();

  return {
    message: data?.message || 'Check back for admission updates.',
    isLoading,
    isOpen: data?.is_open ?? false,
    academicYear: data?.academic_year || '',
  };
}

// ============================================================
// 5. APPLICATION STATUS
// Routes: GET /public/admissions/status/{n}, GET /public/admissions/track/{n}
// ============================================================

export async function checkApplicationStatus(applicationNumber) {
  try {
    const response = await client.get(`${PUBLIC}/admissions/status/${applicationNumber}`);
    return response.data;
  } catch (error) {
    console.error("Application status check error:", error);
    throw error;
  }
}

export function useApplicationStatus(applicationNumber, options = {}) {
  return useQuery({
    queryKey: ["application-status", applicationNumber],
    queryFn: async () => {
      const response = await client.get(`${PUBLIC}/admissions/status/${applicationNumber}`);
      return response.data;
    },
    enabled: !!applicationNumber && applicationNumber.length > 3,
    staleTime: STALE_TIMES.STATUS,
    retry: 2,
    ...options,
  });
}

export async function trackApplication(referenceNumber) {
  try {
    const response = await client.get(`${PUBLIC}/admissions/track/${referenceNumber}`);
    return response.data;
  } catch (error) {
    console.error("Track application error:", error);
    throw error;
  }
}

export function useTrackApplication(applicationNumber, options = {}) {
  return useQuery({
    queryKey: ["track-application", applicationNumber],
    queryFn: async () => {
      const response = await client.get(`${PUBLIC}/admissions/track/${applicationNumber}`);
      return response.data;
    },
    enabled: !!applicationNumber && applicationNumber.length > 3,
    staleTime: STALE_TIMES.STATUS,
    refetchInterval: options.pollingInterval || false,
    ...RETRY_CONFIG,
    ...options,
  });
}

// ============================================================
// 6. PUBLIC CONTENT (About, FAQ, Gallery, Events)
//
// ⚠️ NONE of these routes exist in routes/api.php — not under /public,
// not anywhere else. If used anywhere in the UI they will always 404
// (caught by the fallback route) until backend routes + controllers are
// added. Left unprefixed since there's no real endpoint to point at yet.
// ============================================================

export function useAboutContent(options = {}) {
  return useQuery({
    queryKey: ["about-content"],
    queryFn: async () => {
      const response = await client.get("/about");
      return response.data;
    },
    staleTime: STALE_TIMES.ABOUT,
    ...RETRY_CONFIG,
    ...options,
  });
}

export function useFaqs(options = {}) {
  return useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
      const response = await client.get("/faqs");
      return response.data;
    },
    staleTime: STALE_TIMES.FAQ,
    ...RETRY_CONFIG,
    ...options,
  });
}

export function useFaqsByCategory(category, options = {}) {
  return useQuery({
    queryKey: ["faqs", category],
    queryFn: async () => {
      const response = await client.get(`/faqs/${category}`);
      return response.data;
    },
    enabled: !!category,
    staleTime: STALE_TIMES.FAQ,
    ...RETRY_CONFIG,
    ...options,
  });
}

export function useGallery(options = {}) {
  return useQuery({
    queryKey: ["gallery", options],
    queryFn: async () => {
      const response = await client.get("/gallery", { params: options });
      return response.data;
    },
    staleTime: STALE_TIMES.GALLERY,
    ...RETRY_CONFIG,
    ...options,
  });
}

export function useUpcomingEvents(options = {}) {
  return useQuery({
    queryKey: ["upcoming-events", options],
    queryFn: async () => {
      try {
        const response = await client.get("/events/upcoming", { params: options });
        return response.data;
      } catch (error) {
        if (error?.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    staleTime: STALE_TIMES.EVENTS,
    ...RETRY_CONFIG,
    ...options,
  });
}

export function useEvents(options = {}) {
  return useQuery({
    queryKey: ["events", options],
    queryFn: async () => {
      try {
        const response = await client.get("/events", { params: options });
        return response.data;
      } catch (error) {
        if (error?.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    staleTime: STALE_TIMES.EVENTS,
    ...RETRY_CONFIG,
    ...options,
  });
}

// ============================================================
// 7. MUTATIONS WITH CACHE INVALIDATION
// ============================================================

export function useSubmitAdmission(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitAdmission,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admissions"] });
      queryClient.invalidateQueries({ queryKey: ["admission-settings-public"] });

      if (data?.application_number) {
        queryClient.setQueryData(
          ["application-status", data.application_number],
          data
        );
      }

      toast.success("Application submitted successfully!");

      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      console.error("Admission submission error:", error);

      if (error?.response?.status === 422) {
        const errors = error.response.data.errors;
        if (errors) {
          Object.values(errors).forEach(messages => {
            if (Array.isArray(messages)) {
              messages.forEach(msg => toast.error(msg));
            } else {
              toast.error(messages);
            }
          });
        }
      } else {
        const message = error?.response?.data?.message || "Failed to submit application. Please try again.";
        toast.error(message);
      }

      if (options.onError) {
        options.onError(error);
      }
    },
    ...options,
  });
}

export function useSubmitContact(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitContact,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
      toast.success("Message sent successfully!");

      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      console.error("Contact submission error:", error);
      const message = error?.response?.data?.message || "Failed to send message. Please try again.";
      toast.error(message);

      if (options.onError) {
        options.onError(error);
      }
    },
    ...options,
  });
}

export function useSubscribeNewsletter(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subscribeNewsletter,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
      toast.success("Subscribed successfully!");

      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      console.error("Newsletter subscription error:", error);

      if (error?.response?.status === 409) {
        toast.error("This email is already subscribed.");
      } else {
        const message = error?.response?.data?.message || "Failed to subscribe. Please try again.";
        toast.error(message);
      }

      if (options.onError) {
        options.onError(error);
      }
    },
    ...options,
  });
}

// ============================================================
// 8. UTILITY FUNCTIONS
// ============================================================

export function getAnnouncementUrl(slug) {
  return `/announcements/${slug}`;
}

export function getPostUrl(slug) {
  return `/blog/${slug}`;
}

export function getApplicationStatusUrl(applicationNumber) {
  return `/admission/status/${applicationNumber}`;
}

export function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function truncateText(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// ============================================================
// 9. PREFETCH UTILITIES (for SSR/SSG)
// ============================================================

export async function prefetchAnnouncements(queryClient, options = {}) {
  await queryClient.prefetchQuery({
    queryKey: ["announcements", options],
    queryFn: async () => {
      const response = await client.get(`${PUBLIC}/announcements`, { params: options });
      return response.data;
    },
  });
}

export async function prefetchAnnouncement(queryClient, slug) {
  await queryClient.prefetchQuery({
    queryKey: ["announcement", slug],
    queryFn: async () => {
      const response = await client.get(`${PUBLIC}/announcements/slug/${slug}`);
      return response.data;
    },
  });
}

export async function prefetchPosts(queryClient, options = {}) {
  await queryClient.prefetchQuery({
    queryKey: ["posts", options],
    queryFn: async () => {
      const response = await client.get(`${PUBLIC}/posts`, { params: options });
      return response.data;
    },
  });
}

export async function prefetchAdmissionSettings(queryClient) {
  await queryClient.prefetchQuery({
    queryKey: ["admission-settings-public"],
    queryFn: async () => {
      const response = await client.get(`${PUBLIC}/admission-settings`);
      return response.data;
    },
  });
}

// ============================================================
// 10. TEACHER APPLICATION
// ============================================================

/**
 * Submit a teacher application
 * 
 * ⚠️ IMPORTANT: This endpoint is under /auth prefix in the backend,
 * NOT under /public. The route is defined in routes/api.php as:
 * Route::prefix('auth')->group(function () {
 *     Route::post('/teacher-applications', [TeacherApplicationController::class, 'store']);
 * });
 * 
 * Route: POST /auth/teacher-applications
 * Note: This endpoint does NOT require authentication (no auth:sanctum middleware)
 */
export async function submitTeacherApplication(payload) {
  try {
    // Uses /auth/teacher-applications (not /public) — see routes/api.php.
    const response = await client.post(
      "/auth/teacher-applications",
      payload,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Teacher application submission error:", error);

    // Log validation errors for debugging
    if (error.response?.status === 422) {
      console.error("Validation errors:", error.response.data.errors);
    }

    throw error;
  }
}

/**
 * Get teacher application status by reference number
 * 
 * Route: GET /auth/teacher-applications/{reference}
 */
export async function getTeacherApplicationStatus(reference) {
  try {
    const response = await client.get(`/auth/teacher-applications/${reference}`);
    return response.data;
  } catch (error) {
    console.error("Teacher application status check error:", error);
    throw error;
  }
}

/**
 * React Query hook for checking teacher application status
 */
export function useTeacherApplicationStatus(reference, options = {}) {
  return useQuery({
    queryKey: ["teacher-application", reference],
    queryFn: async () => {
      const response = await client.get(`/auth/teacher-applications/${reference}`);
      return response.data;
    },
    enabled: !!reference && reference.length > 3,
    staleTime: STALE_TIMES.STATUS,
    retry: 2,
    ...options,
  });
}

/**
 * React Query mutation hook for submitting teacher application
 */
export function useSubmitTeacherApplication(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitTeacherApplication,
    onSuccess: (data) => {
      // Invalidate any teacher application queries
      queryClient.invalidateQueries({ queryKey: ["teacher-applications"] });

      // If we have a reference, set it in the cache
      const reference = data?.application_reference || data?.reference || data?.data?.reference;
      if (reference) {
        queryClient.setQueryData(
          ["teacher-application", reference],
          data
        );
      }

      toast.success("Application submitted successfully!");

      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      console.error("Teacher application submission error:", error);

      if (error?.response?.status === 422) {
        const errors = error.response.data.errors;
        if (errors) {
          Object.values(errors).forEach(messages => {
            if (Array.isArray(messages)) {
              messages.forEach(msg => toast.error(msg));
            } else {
              toast.error(messages);
            }
          });
        }
      } else if (error?.response?.status === 429) {
        toast.error("Too many applications. Please wait a moment before trying again.");
      } else {
        const message = error?.response?.data?.message || "Failed to submit application. Please try again.";
        toast.error(message);
      }

      if (options.onError) {
        options.onError(error);
      }
    },
    ...options,
  });
}

// ============================================================
// 11. REACT-QUERY PROVIDER OPTIONS
// ============================================================

export const publicQueryConfig = {
  defaultOptions: {
    queries: DEFAULT_QUERY_OPTIONS,
  },
};

// ============================================================
// 12. EXPORT ALL
// ============================================================

export default {
  STALE_TIMES,
  RETRY_CONFIG,
  DEFAULT_QUERY_OPTIONS,
  publicQueryConfig,

  submitAdmission,
  submitContact,
  subscribeNewsletter,
  useSubmitAdmission,
  useSubmitContact,
  useSubscribeNewsletter,

  usePosts,
  usePost,
  usePostsByCategory,
  useFeaturedPosts,

  useAnnouncements,
  useAnnouncement,
  usePinnedAnnouncements,
  useAnnouncementsByCategory,
  useRecentAnnouncements,

  useAdmissionSettings,
  useIsAdmissionOpen,
  useAdmissionMessage,
  useApplicationStatus,
  useTrackApplication,

  useAboutContent,
  useFaqs,
  useFaqsByCategory,

  useGallery,
  useUpcomingEvents,
  useEvents,

  checkApplicationStatus,
  trackApplication,
  getAnnouncementUrl,
  getPostUrl,
  getApplicationStatusUrl,
  formatDate,
  truncateText,

  prefetchAnnouncements,
  prefetchAnnouncement,
  prefetchPosts,
  prefetchAdmissionSettings,

  // Teacher Application
  submitTeacherApplication,
  getTeacherApplicationStatus,
  useTeacherApplicationStatus,
  useSubmitTeacherApplication,
};