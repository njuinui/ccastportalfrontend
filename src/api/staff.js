import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "./client";

export function useStaff(params) {
  return useQuery({
    queryKey: ["staff", params],
    queryFn: async () => (await client.get("/staff", { params })).data,
    keepPreviousData: true,
  });
}
export function useStaffMeta() {
  return useQuery({
    queryKey: ["staff-meta"],
    queryFn: async () => (await client.get("/staff/meta")).data,
  });
}
export function useSaveStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) =>
      id
        ? (await client.put(`/staff/${id}`, payload)).data.data
        : (await client.post("/staff", payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}
export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => client.delete(`/staff/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}
export const useCreateStaff = useSaveStaff;
