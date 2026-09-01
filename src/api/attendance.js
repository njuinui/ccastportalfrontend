import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "./client";

export function useAttendanceRegister({ date, section_id }, enabled = true) {
  return useQuery({
    queryKey: ["attendance", date, section_id],
    queryFn: async () => (await client.get("/attendances", { params: { date, section_id } })).data,
    enabled: enabled && !!date,
  });
}

export function useSaveAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await client.post("/attendances", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}
