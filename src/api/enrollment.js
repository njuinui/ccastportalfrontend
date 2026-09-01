import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "./client";

export function useEnrollments(params) {
  return useQuery({
    queryKey: ["enrollments", params],
    queryFn: async () => (await client.get("/enrollments", { params })).data,
    keepPreviousData: true,
  });
}
export function useCreateEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await client.post("/enrollments", payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["enrollments"] }),
  });
}
