import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "./client";

/* Academic years (each carries its terms) */
export function useAcademicYears() {
  return useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => (await client.get("/academic-years")).data,
  });
}
export function useSaveAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await client.post("/academic-years", payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["academic-years"] }),
  });
}
export function useSaveTerm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await client.post("/terms", payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["academic-years"] }),
  });
}

/* Classes (each carries its sections) */
export function useClasses() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: async () => (await client.get("/classes")).data,
  });
}
export function useSaveClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await client.post("/classes", payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}
export function useSaveSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await client.post("/sections", payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useSectionsList(params) {
  return useQuery({
    queryKey: ["sections-list", params],
    queryFn: async () => (await client.get("/sections", { params })).data,
    keepPreviousData: true,
  });
}
export function useSectionsMeta() {
  return useQuery({
    queryKey: ["sections-meta"],
    queryFn: async () => (await client.get("/sections/meta")).data,
  });
}
export function useDeleteSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => client.delete(`/sections/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sections-list"] }); qc.invalidateQueries({ queryKey: ["classes"] }); },
  });
}
