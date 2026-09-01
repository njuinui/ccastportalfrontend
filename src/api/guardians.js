import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "./client";

export function useGuardians(params) {
  return useQuery({
    queryKey: ["guardians", params],
    queryFn: async () => (await client.get("/guardians", { params })).data,
    keepPreviousData: true,
  });
}
export function useGuardiansMeta() {
  return useQuery({
    queryKey: ["guardians-meta"],
    queryFn: async () => (await client.get("/guardians/meta")).data,
  });
}
export function useSaveGuardian() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) =>
      id
        ? (await client.put(`/guardians/${id}`, payload)).data.data
        : (await client.post("/guardians", payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guardians"] }),
  });
}
export function useDeleteGuardian() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => client.delete(`/guardians/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guardians"] }),
  });
}
