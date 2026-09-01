// src/api/admin18.js

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "./client";
import toast from "react-hot-toast";

/* ────────────────────────────────────────────────────────────────
   GENERIC FACTORY for Pack-18 Admin Modules
   These controllers return a raw paginator:
   { data, current_page, last_page, total, from, to }
   ──────────────────────────────────────────────────────────────── */

function make(resource) {
  // ── List with pagination ──
  const useList = (params = {}, options = {}) =>
    useQuery({
      queryKey: [resource, params],
      queryFn: async () => {
        const response = await client.get(`/${resource}`, { params });
        return response.data;
      },
      keepPreviousData: true,
      staleTime: 30 * 1000, // 30 seconds
      ...options,
    });

  // ── Meta data (for dropdowns, counts, etc.) ──
  const useMeta = (options = {}) =>
    useQuery({
      queryKey: [`${resource}-meta`],
      queryFn: async () => {
        const response = await client.get(`/${resource}/meta`);
        return response.data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      ...options,
    });

  // ── Save (Create or Update) ──
  const useSave = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, ...payload }) => {
        if (id) {
          const response = await client.put(`/${resource}/${id}`, payload);
          return response.data;
        }
        const response = await client.post(`/${resource}`, payload);
        return response.data;
      },
      onSuccess: (data, variables) => {
        qc.invalidateQueries({ queryKey: [resource] });
        qc.invalidateQueries({ queryKey: [`${resource}-meta`] });
        
        // If updating a specific item, invalidate it too
        if (variables?.id) {
          qc.invalidateQueries({ queryKey: [resource, variables.id] });
        }
        
        // Call custom onSuccess if provided
        if (options.onSuccess) {
          options.onSuccess(data, variables);
        }
      },
      onError: (error, variables) => {
        console.error(`Error saving ${resource}:`, error);
        if (options.onError) {
          options.onError(error, variables);
        }
      },
      ...options,
    });
  };

  // ── Remove (Delete) ──
  const useRemove = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (id) => {
        const response = await client.delete(`/${resource}/${id}`);
        return response.data;
      },
      onSuccess: (data, variables) => {
        qc.invalidateQueries({ queryKey: [resource] });
        qc.invalidateQueries({ queryKey: [`${resource}-meta`] });
        
        if (options.onSuccess) {
          options.onSuccess(data, variables);
        }
      },
      onError: (error, variables) => {
        console.error(`Error deleting ${resource}:`, error);
        if (options.onError) {
          options.onError(error, variables);
        }
      },
      ...options,
    });
  };

  // ── Get Single Item ──
  const useItem = (id, options = {}) =>
    useQuery({
      queryKey: [resource, id],
      queryFn: async () => {
        const response = await client.get(`/${resource}/${id}`);
        return response.data;
      },
      enabled: !!id,
      staleTime: 30 * 1000,
      ...options,
    });

  return { 
    useList, 
    useMeta, 
    useSave, 
    useRemove,
    useItem,
    resource, // Expose resource name for debugging
  };
}

/* ────────────────────────────────────────────────────────────────
   EXPORT ADMIN MODULES
   ──────────────────────────────────────────────────────────────── */

export const Discipline = make("discipline");
export const Stock = make("stock");
export const Activities = make("activities");
export const Logbook = make("logbook");
export const Notices = make("notices");
export const Users = make("users");

// Also export as named objects for convenience
export const discipline = Discipline;
export const stock = Stock;
export const activities = Activities;
export const logbook = Logbook;
export const notices = Notices;
export const users = Users;

/* ────────────────────────────────────────────────────────────────
   STOCK SPECIFIC - Adjust stock quantity
   ──────────────────────────────────────────────────────────────── */

export function useStockAdjust(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, delta, reason = "" }) => {
      const response = await client.post(`/stock/${id}/adjust`, { 
        delta,
        reason 
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["stock-meta"] });
      
      if (options.onSuccess) {
        options.onSuccess(data, variables);
      }
    },
    onError: (error, variables) => {
      console.error("Stock adjustment error:", error);
      if (options.onError) {
        options.onError(error, variables);
      }
    },
    ...options,
  });
}

/* ────────────────────────────────────────────────────────────────
   ADMISSION SETTINGS — Singleton row (no list/id)
   ──────────────────────────────────────────────────────────────── */

/**
 * Get admission settings (public)
 */
export function useAdmissionSettings() {
  return useQuery({
    queryKey: ["admission-settings-public"],
    queryFn: async () => {
      const response = await client.get("/admission-settings");
      return response.data;
    },
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Get admission settings (admin)
 */
export function useAdmissionSettingsAdmin(options = {}) {
  return useQuery({
    queryKey: ["admission-settings"],
    queryFn: async () => {
      const response = await client.get("/admission-settings");
      return response.data;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  });
}

/**
 * Save admission settings (admin)
 */
export function useSaveAdmissionSettings(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const response = await client.put("/admission-settings", payload);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate both admin and public settings
      qc.invalidateQueries({ queryKey: ["admission-settings"] });
      qc.invalidateQueries({ queryKey: ["admission-settings-public"] });
      
      toast.success("Admission settings saved successfully!");
      
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      console.error("Save admission settings error:", error);
      const message = error?.response?.data?.message || "Failed to save settings. Please try again.";
      toast.error(message);
      
      if (options.onError) {
        options.onError(error);
      }
    },
    ...options,
  });
}

/**
 * Seed admission settings (admin)
 */
export function useSeedAdmissionSettings(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await client.post("/admission-settings/seed");
      return response.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admission-settings"] });
      qc.invalidateQueries({ queryKey: ["admission-settings-public"] });
      toast.success("Admission settings initialized!");
      
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      console.error("Seed admission settings error:", error);
      const message = error?.response?.data?.message || "Failed to initialize settings.";
      toast.error(message);
      
      if (options.onError) {
        options.onError(error);
      }
    },
    ...options,
  });
}

/* ────────────────────────────────────────────────────────────────
   TEACHER ASSIGNMENTS (Special case)
   ──────────────────────────────────────────────────────────────── */

export function useTeacherAssignments(options = {}) {
  return useQuery({
    queryKey: ["teacher-assignments", options],
    queryFn: async () => {
      const response = await client.get("/assignments", { params: options });
      return response.data;
    },
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useSaveTeacherAssignment(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const response = await client.post("/assignments", payload);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-assignments"] });
      if (options.onSuccess) {
        options.onSuccess();
      }
    },
    onError: (error) => {
      console.error("Save teacher assignment error:", error);
      if (options.onError) {
        options.onError(error);
      }
    },
    ...options,
  });
}

export function useRemoveTeacherAssignment(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await client.delete(`/assignments/${id}`);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-assignments"] });
      if (options.onSuccess) {
        options.onSuccess();
      }
    },
    onError: (error) => {
      console.error("Remove teacher assignment error:", error);
      if (options.onError) {
        options.onError(error);
      }
    },
    ...options,
  });
}

/* ────────────────────────────────────────────────────────────────
   EXPORT ALL
   ──────────────────────────────────────────────────────────────── */

export default {
  // Generic modules
  Discipline,
  Stock,
  Activities,
  Logbook,
  Notices,
  Users,
  discipline,
  stock,
  activities,
  logbook,
  notices,
  users,
  
  // Stock specific
  useStockAdjust,
  
  // Admission settings
  useAdmissionSettings,
  useAdmissionSettingsAdmin,
  useSaveAdmissionSettings,
  useSeedAdmissionSettings,
  
  // Teacher assignments
  useTeacherAssignments,
  useSaveTeacherAssignment,
  useRemoveTeacherAssignment,
};

/* ────────────────────────────────────────────────────────────────
   TYPE DEFINITIONS (for JSDoc / IDE support)
   ──────────────────────────────────────────────────────────────── */

/**
 * @typedef {Object} PaginatedResponse
 * @property {Array} data - The items
 * @property {number} current_page - Current page number
 * @property {number} last_page - Last page number
 * @property {number} total - Total items
 * @property {number} from - First item index
 * @property {number} to - Last item index
 */

/**
 * @typedef {Object} AdmissionSettings
 * @property {boolean} is_open - Whether admissions are open
 * @property {string} academic_year - Academic year (e.g., "2026/2027")
 * @property {string|null} opens_at - Opening date/time
 * @property {string|null} closes_at - Closing date/time
 * @property {string} open_message - Message when open
 * @property {string} closed_message - Message when closed
 */