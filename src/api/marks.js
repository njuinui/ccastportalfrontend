import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "./client";

export function useMarkGrid({ exam_id, subject_id, section_id }, enabled = true) {
  return useQuery({
    queryKey: ["marks", exam_id, subject_id, section_id],
    queryFn: async () => (await client.get("/marks", { params: { exam_id, subject_id, section_id } })).data,
    enabled: enabled && !!exam_id && !!subject_id,
  });
}
export function useSaveMarks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await client.post("/marks", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marks"] }),
  });
}

export function useMarksheet({ exam_id, section_id }, enabled) {
  return useQuery({
    queryKey: ["marksheet", exam_id, section_id],
    queryFn: async () => (await client.get("/marksheet", { params: { exam_id, section_id } })).data,
    enabled: !!enabled,
  });
}
