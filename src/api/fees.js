import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "./client";

/* ── Payments (receipt register) ── */

export function usePayments(params) {
  return useQuery({
    queryKey: ["payments", params],
    queryFn: async () => (await client.get("/payments", { params })).data,
    keepPreviousData: true,
  });
}

export function usePaymentsMeta() {
  return useQuery({
    queryKey: ["payments-meta"],
    queryFn: async () => (await client.get("/payments/meta")).data,
  });
}

/* ── Student fee search (lightweight picker) ── */

export function useStudentFeeSearch(q) {
  return useQuery({
    queryKey: ["student-fee-search", q],
    queryFn: async () =>
      (await client.get("/student-fees/search", { params: { q } })).data,
    enabled: !!q && q.trim().length >= 2,
  });
}

/* ── Full fee context for one student ── */

export function useStudentFees(studentId) {
  return useQuery({
    queryKey: ["student-fees", studentId],
    queryFn: async () =>
      (await client.get(`/students/${studentId}/fees`)).data,
    enabled: !!studentId,
  });
}

/* ── Generate invoice from fee structures ── */

export function useGenerateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, ...payload }) =>
      (await client.post(`/students/${studentId}/generate-invoice`, payload))
        .data,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["student-fees", vars.studentId] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["payments-meta"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["dashboard/bursar"] });
    },
  });
}

/* ── Record payment against an invoice ── */

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoiceId, ...payload }) =>
      (await client.post(`/invoices/${invoiceId}/payments`, payload)).data.data,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["payments-meta"] });
      qc.invalidateQueries({ queryKey: ["student-fees"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["dashboard/bursar"] });
    },
  });
}

/* ── Invoices (for the original "Record Payment" modal) ── */

export function useInvoices(params, enabled = true) {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: async () => (await client.get("/invoices", { params })).data,
    enabled: enabled && !!params,
    keepPreviousData: true,
  });
}

export function useInvoice(id, enabled = true) {
  return useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => (await client.get(`/invoices/${id}`)).data.data,
    enabled: enabled && !!id,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) =>
      (await client.post("/invoices", payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

/* ── Fee structures ── */

export function useFeeStructures(params) {
  return useQuery({
    queryKey: ["fee-structures", params],
    queryFn: async () => (await client.get("/fee-structures", { params })).data,
  });
}