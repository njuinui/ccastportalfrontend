// src/api/students.js

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "./client";

/**
 * Fetch students list
 */
export function useStudents(params) {
  return useQuery({
    queryKey: ["students", params],
    queryFn: async () => (await client.get("/students", { params })).data,
    keepPreviousData: true,
  });
}

/**
 * Lightweight list for dropdowns
 */
export function useAllStudents() {
  return useQuery({
    queryKey: ["students-all"],
    queryFn: async () =>
      (await client.get("/students", { params: { per_page: 1000 } })).data.data,
  });
}

/**
 * Students metadata
 */
export function useStudentsMeta() {
  return useQuery({
    queryKey: ["students-meta"],
    queryFn: async () => (await client.get("/students/meta")).data,
  });
}

/**
 * Get single student
 */
export function useStudent(id) {
  return useQuery({
    queryKey: ["student", id],
    queryFn: async () => (await client.get(`/students/${id}`)).data.data,
    enabled: !!id,
  });
}

/**
 * Create / Update student
 * Supports normal JSON and FormData uploads
 */
export function useSaveStudent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const isFormData = payload instanceof FormData;
      let id = null;

      if (isFormData) {
        id = payload.get("id");
      } else {
        id = payload.id;
      }

      // UPDATE
      if (id) {
        if (isFormData) {
          // For FormData with _method=PUT
          if (!payload.has("_method")) {
            payload.append("_method", "PUT");
          }
          return (
            await client.post(`/students/${id}`, payload, {
              headers: { "Content-Type": "multipart/form-data" },
            })
          ).data.data;
        } else {
          const { id, ...data } = payload;
          return (await client.put(`/students/${id}`, data)).data.data;
        }
      }

      // CREATE
      return (
        await client.post(
          "/students",
          payload,
          isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : {}
        )
      ).data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["students-meta"] });
      qc.invalidateQueries({ queryKey: ["student"] });
    },
  });
}

/**
 * Delete student
 */
export function useDeleteStudent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id) => client.delete(`/students/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["students-meta"] });
    },
  });
}

/**
 * Suspend student
 */
export function useSuspendStudent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }) =>
      client.post(`/students/${id}/suspend`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["student"] });
    },
  });
}

/**
 * Dismiss student
 */
export function useDismissStudent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }) =>
      client.post(`/students/${id}/dismiss`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["student"] });
    },
  });
}

/**
 * Replace document
 */
export function useReplaceDocument() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, field, file }) => {
      const fd = new FormData();
      fd.append("file", file);
      return (
        await client.post(`/students/${studentId}/documents/${field}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      ).data.data;
    },
    onSuccess: (_, { studentId }) => {
      qc.invalidateQueries({ queryKey: ["student", studentId] });
    },
  });
}

/**
 * Delete document
 */
export function useDeleteDocument() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, field }) =>
      client.delete(`/students/${studentId}/documents/${field}`),
    onSuccess: (_, { studentId }) => {
      qc.invalidateQueries({ queryKey: ["student", studentId] });
    },
  });
}

/**
 * Backward compatibility
 */
export const useCreateStudent = () => {
  const save = useSaveStudent();
  return {
    ...save,
    mutateAsync: (payload) => save.mutateAsync(payload),
  };
};