import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "./client";

export function useBursarStats() {
  return useQuery({
    queryKey: ["bursar-stats"],
    queryFn: async () => (await client.get("/dashboard/bursar")).data,
  });
}

function crud(resource) {
  const useList = (params) => useQuery({
    queryKey: [resource, params],
    queryFn: async () => (await client.get(`/${resource}`, { params })).data,
    keepPreviousData: true,
  });
  const useMeta = () => useQuery({
    queryKey: [`${resource}-meta`],
    queryFn: async () => (await client.get(`/${resource}/meta`)).data,
  });
  const useSave = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, ...payload }) =>
        id ? (await client.put(`/${resource}/${id}`, payload)).data
           : (await client.post(`/${resource}`, payload)).data,
      onSuccess: () => { qc.invalidateQueries({ queryKey: [resource] }); qc.invalidateQueries({ queryKey: [`${resource}-meta`] }); },
    });
  };
  const useRemove = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (id) => client.delete(`/${resource}/${id}`),
      onSuccess: () => { qc.invalidateQueries({ queryKey: [resource] }); qc.invalidateQueries({ queryKey: [`${resource}-meta`] }); },
    });
  };
  return { useList, useMeta, useSave, useRemove };
}

export const Expenses = crud("expenses");
export const Complaints = crud("complaints");

export function useHallTickets(params) {
  return useQuery({ queryKey: ["hall-tickets", params], queryFn: async () => (await client.get("/hall-tickets", { params })).data, keepPreviousData: true });
}
export function useHallTicketsMeta() {
  return useQuery({ queryKey: ["hall-tickets-meta"], queryFn: async () => (await client.get("/hall-tickets/meta")).data });
}
export function useGenerateHallTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (student_id) => (await client.post("/hall-tickets/generate", { student_id })).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hall-tickets"] }); qc.invalidateQueries({ queryKey: ["hall-tickets-meta"] }); },
  });
}
export function useBatchHallTickets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await client.post("/hall-tickets/batch", {})).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hall-tickets"] }); qc.invalidateQueries({ queryKey: ["hall-tickets-meta"] }); },
  });
}
