import { useQuery } from "@tanstack/react-query";
import client from "./client";

// Student portal: the signed-in student's own summary.
export function useStudentDashboard() {
  return useQuery({
    queryKey: ["me-student"],
    queryFn: async () => (await client.get("/me/student")).data,
  });
}

// Parent portal: summaries for each linked child.
export function useChildrenDashboard() {
  return useQuery({
    queryKey: ["me-children"],
    queryFn: async () => (await client.get("/me/children")).data,
  });
}
