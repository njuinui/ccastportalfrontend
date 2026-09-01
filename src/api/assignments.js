import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "./client";

export function useTeacherAssignments(staffId, enabled) {
  return useQuery({
    queryKey: ["assignments", staffId],
    queryFn: async () => (await client.get("/assignments", { params: { staff_id: staffId } })).data,
    enabled: !!enabled,
  });
}
export function useAssignTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await client.post("/assignments", payload)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assignments"] }); qc.invalidateQueries({ queryKey: ["staff"] }); },
  });
}
export function useUnassignTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ school_class_id, subject_id }) =>
      client.delete("/assignments", { data: { school_class_id, subject_id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assignments"] }); qc.invalidateQueries({ queryKey: ["staff"] }); },
  });
}
