import { useState } from "react";
import toast from "react-hot-toast";
import { usePayments, usePaymentsMeta, useInvoices, useRecordPayment } from "../../api/fees";
import { swalInfo } from "../../lib/alerts";
import { Modal, Field, useDebounced } from "../../components/ui";
import { Pager, Kpi, csvExport, printRows } from "../admin/_shell";
import PayStudentFeesModal from "./PayStudentFeesModal";
import "../../styles/mgmt.css";


const xaf = (n) => Number(n || 0).toLocaleString() + " FCFA";
const TABS = [
  { key: "", label: "All", tone: "dark", countKey: "all" },
  { key: "paid", label: "Paid", tone: "green", countKey: "paid" },
  { key: "partial", label: "Partial", tone: "amber", countKey: "partial" },
  { key: "pending", label: "Pending", tone: "blue", countKey: "pending" },
  { key: "failed", label: "Failed", tone: "red", countKey: "failed" },
  { key: "refunded", label: "Refunded", tone: "gray", countKey: "refunded" },
];
const INV_ST = { paid: ["Paid", "mg-status-green"], partial: ["Partial", "mg-status-amber"], unpaid: ["Pending", "mg-status-blue"], void: ["Void", "mg-status-gray"] };
const MODE = { cash: "Cash", momo: "MoMo", orange_money: "Orange", bank: "Bank" };

export default function FeesPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("");
  const [page, setPage] = useState(1);
  const [recording, setRecording] = useState(false);
  const debounced = useDebounced(search);

  // Add state
  const [payingStudent, setPayingStudent] = useState(false);

  const { data: meta } = usePaymentsMeta();
  const { data, isLoading, isError, isFetching } = usePayments({ status: status || undefined, search: debounced || undefined, method: method || undefined, page });
  const rows = data?.data ?? [];
  const k = meta?.kpis ?? {};

  const view = (r) => swalInfo(`Receipt ${r.receipt}`, `Student: ${r.student}\nClass: ${r.class ?? "—"}\nFee: ${r.fee_type}\nAmount paid: ${xaf(r.amount)}\nBalance: ${xaf(r.balance)}\nStatus: ${r.invoice_status}\nMode: ${MODE[r.method] ?? r.method}\nDate: ${r.date}`);

  return (
    <div className="mg-page">
      <div className="mg-head">
        <div><div className="mg-title"><span className="material-symbols-outlined">payments</span><h1>Fees Collection</h1></div>
          <div className="mg-crumb">CCAST Bambili <span className="material-symbols-outlined">chevron_right</span> Financial {isFetching && <span className="mg-sync"><span className="material-symbols-outlined">sync</span> syncing live…</span>}</div></div>
        <div className="d-flex gap-2">
          <button className="mg-add" onClick={() => setPayingStudent(true)}>
            <span className="material-symbols-outlined">person_search</span> Pay Student Fees
          </button>
          <button className="mg-add" onClick={() => setRecording(true)}>
            <span className="material-symbols-outlined">add_circle</span> Record Payment
          </button>
        </div>
      </div>

      <div className="mg-kpis" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <Kpi tone="green" label="Total Collected" value={xaf(k.total_collected)} icon="account_balance_wallet" />
        <Kpi tone="red" label="Total Pending" value={xaf(k.total_pending)} icon="pending_actions" />
        <Kpi tone="navy" label="Receipts Today" value={k.receipts_today} icon="receipt_long" />
      </div>

      <div className="mg-tabs">{TABS.map((t) => <button key={t.key || "all"} className={`mg-tab mg-tab-${t.tone} ${status === t.key ? "active" : ""}`} onClick={() => { setStatus(t.key); setPage(1); }}>{t.label} ({meta?.counts?.[t.countKey] ?? 0})</button>)}</div>

      <div className="surface-card mg-filters">
        <div className="mg-filters-hd"><span className="mg-filters-title"><span className="material-symbols-outlined">filter_alt</span> Refine Results</span>
          <button className="mg-clear" onClick={() => { setSearch(""); setMethod(""); setStatus(""); setPage(1); }}><span className="material-symbols-outlined">restart_alt</span> Reset Filters</button></div>
        <div className="mg-filters-grid cols-4">
          <label>Search Registry<input className="form-control" placeholder="Receipt #, student name…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label>
          <label>Payment Mode<select className="form-select" value={method} onChange={(e) => { setMethod(e.target.value); setPage(1); }}><option value="">All Modes</option><option value="cash">Cash</option><option value="momo">MoMo</option><option value="orange_money">Orange Money</option><option value="bank">Bank</option></select></label>
        </div>
      </div>

      <div className="surface-card mg-tablecard">
        <div className="mg-toolbar"><div className="mg-exports">
          <button className="mg-exp mg-exp-csv" onClick={() => csvExport("receipts.csv", ["Receipt", "Date", "Student", "Fee", "Amount", "Balance", "Status", "Mode"], rows, (r) => [r.receipt, r.date, r.student, r.fee_type, r.amount, r.balance, r.invoice_status, r.method])}><span className="material-symbols-outlined">table_view</span> CSV</button>
          <button className="mg-exp mg-exp-pdf" onClick={() => printRows("Fee Receipts", ["Receipt", "Date", "Student", "Amount", "Status", "Mode"], rows, (r) => [r.receipt, r.date, r.student, r.amount, r.invoice_status, r.method])}><span className="material-symbols-outlined">picture_as_pdf</span> PDF</button>
          <button className="mg-exp mg-exp-print" onClick={() => printRows("Fee Receipts", ["Receipt", "Date", "Student", "Amount", "Status", "Mode"], rows, (r) => [r.receipt, r.date, r.student, r.amount, r.invoice_status, r.method])}><span className="material-symbols-outlined">print</span> Print</button>
        </div></div>
        <div className="table-responsive">
          <table className="table mg-table align-middle mb-0">
            <thead><tr><th>Receipt #</th><th>Date</th><th>Student Details</th><th>Fee Type</th><th>Amount Paid</th><th>Status</th><th>Mode</th><th className="text-center">Actions</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="state-cell">Loading receipts…</td></tr>}
              {isError && <tr><td colSpan={8} className="state-cell text-danger">Couldn't load receipts.</td></tr>}
              {!isLoading && !isError && rows.length === 0 && <tr><td colSpan={8} className="state-cell">No receipts match.</td></tr>}
              {rows.map((r) => {
                const [sl, sc] = INV_ST[r.invoice_status] ?? [r.invoice_status, "mg-status-gray"];
                return (
                  <tr key={r.id}>
                    <td><span className="mg-id" style={{ color: "var(--primary)" }}>{r.receipt}</span></td>
                    <td className="text-secondary" style={{ fontSize: 12.5 }}>{r.date}</td>
                    <td><div className="fw-semibold" style={{ fontSize: 13.5 }}>{r.student}</div><div className="mg-sub">{r.class ?? "—"}</div></td>
                    <td style={{ fontSize: 13 }}>{r.fee_type}</td>
                    <td><div className="fw-semibold" style={{ fontSize: 13.5, color: "#15803d" }}>{xaf(r.amount)}</div>{r.balance > 0 && <div style={{ fontSize: 11.5, color: "#b91c1c" }}>Balance: {xaf(r.balance)}</div>}</td>
                    <td><span className={`mg-status ${sc}`}>{sl}</span></td>
                    <td><span className="mg-chip mg-chip-blue">{MODE[r.method] ?? r.method}</span></td>
                    <td><div className="mg-actions justify-content-center">
                      <button title="View" onClick={() => view(r)}><span className="material-symbols-outlined">visibility</span></button>
                      <button title="Print" onClick={() => printRows(`Receipt ${r.receipt}`, ["Receipt", "Student", "Amount", "Status"], [r], (x) => [x.receipt, x.student, x.amount, x.invoice_status])}><span className="material-symbols-outlined">print</span></button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pager meta={data} setPage={setPage} unit="receipts" />
      </div>

      {recording && <RecordPaymentModal onClose={() => setRecording(false)} />}
      {payingStudent && <PayStudentFeesModal onClose={() => setPayingStudent(false)} />}
    </div>
  );
}

function RecordPaymentModal({ onClose }) {
  const { data: invData } = useInvoices({ status: "unpaid,partial", per_page: 200 });
  const invoices = (invData?.data ?? []).filter((i) => i.status !== "paid" && i.status !== "void");
  const rec = useRecordPayment();
  const [form, setForm] = useState({ invoice_id: "", amount: "", method: "cash", provider_reference: "" });
  const [errors, setErrors] = useState({});
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const submit = async () => {
    setErrors({});
    if (!form.invoice_id) return toast.error("Choose an invoice.");
    try {
      await rec.mutateAsync({ invoiceId: form.invoice_id, amount: Number(form.amount), method: form.method, provider_reference: form.provider_reference || undefined });
      toast.success("Payment recorded"); onClose();
    } catch (err) { setErrors(err.fieldErrors ?? {}); toast.error(err?.response?.data?.message || "Could not record payment."); }
  };
  return (
    <Modal title="Record payment" onClose={onClose}
      footer={<><button className="btn btn-light" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={rec.isPending}>{rec.isPending ? "Saving…" : "Record"}</button></>}>
      <Field label="Invoice" required error={errors.invoice_id}>
        <select className="form-select" value={form.invoice_id} onChange={set("invoice_id")}>
          <option value="">Select outstanding invoice…</option>
          {invoices.map((i) => <option key={i.id} value={i.id}>{i.number} — {i.student?.full_name ?? "student"} (bal {xaf((i.total ?? 0) - (i.amount_paid ?? 0))})</option>)}
        </select>
      </Field>
      <Field label="Amount (XAF)" required error={errors.amount}><input type="number" className="form-control" value={form.amount} onChange={set("amount")} /></Field>
      <Field label="Method"><select className="form-select" value={form.method} onChange={set("method")}><option value="cash">Cash</option><option value="momo">MTN MoMo</option><option value="orange_money">Orange Money</option><option value="bank">Bank</option></select></Field>
      <Field label="Reference (optional)"><input className="form-control" value={form.provider_reference} onChange={set("provider_reference")} /></Field>
    </Modal>
  );
}
