import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "./client";

export function useExams(params) {
  return useQuery({
    queryKey: ["exams", params],
    queryFn: async () => (await client.get("/exams", { params })).data,
    keepPreviousData: true,
  });
}
export function useExamsMeta() {
  return useQuery({
    queryKey: ["exams-meta"],
    queryFn: async () => (await client.get("/exams/meta")).data,
  });
}
export function useSaveExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) =>
      id ? (await client.put(`/exams/${id}`, payload)).data.data
         : (await client.post("/exams", payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
  });
}
export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => client.delete(`/exams/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
  });
}
export const useCreateExam = useSaveExam;
