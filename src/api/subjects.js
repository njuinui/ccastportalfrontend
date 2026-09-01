import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "./client";

export function useSubjects(params) {
  return useQuery({
    queryKey: ["subjects", params],
    queryFn: async () => (await client.get("/subjects", { params })).data,
    keepPreviousData: true,
  });
}
export function useSaveSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) =>
      id
        ? (await client.put(`/subjects/${id}`, payload)).data.data
        : (await client.post("/subjects", payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}
export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => client.delete(`/subjects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

export function useSubjectsMeta() {
  return useQuery({
    queryKey: ["subjects-meta"],
    queryFn: async () => (await client.get("/subjects/meta")).data,
  });
}

export const useCreateSubject = useSaveSubject;
