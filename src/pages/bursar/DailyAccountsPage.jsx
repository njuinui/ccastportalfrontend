import { useState } from "react";
import toast from "react-hot-toast";
import { Expenses } from "../../api/bursar";
import { confirmDelete } from "../../lib/alerts";
import { Modal, Field, useDebounced } from "../../components/ui";
import { Pager, Kpi, csvExport, printRows } from "../admin/_shell";
import "../../styles/mgmt.css";

const xaf = (n) => Number(n || 0).toLocaleString() + " FCFA";
const CATS = ["Utilities", "Salaries", "Supplies", "Maintenance", "Transport", "Operations", "Other"];
const CAT_TONE = { Utilities: "mg-chip-blue", Salaries: "mg-chip-purple", Supplies: "mg-chip-teal", Maintenance: "mg-chip-amber", Transport: "mg-chip-green", Operations: "mg-chip-gray", Other: "mg-chip-gray" };
const MODE = { cash: "Cash", momo: "MoMo", orange_money: "Orange", bank: "Bank" };
const BLANK = { expense_date: new Date().toISOString().slice(0, 10), description: "", category: "Operations", vendor: "", amount: "", method: "cash", status: "paid" };

export default function DailyAccountsPage() {
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const debounced = useDebounced(search);

  const { data: meta } = Expenses.useMeta();
  const { data, isLoading, isError, isFetching } = Expenses.useList({ category: category || undefined, status: status || undefined, search: debounced || undefined, page });
  const del = Expenses.useRemove();
  const rows = data?.data ?? [];
  const k = meta?.kpis ?? {};

  const remove = async (r) => { if (!(await confirmDelete({ title: "Delete voucher?", text: r.description, confirmText: "Delete" }))) return; try { await del.mutateAsync(r.id); toast.success("Voucher removed"); } catch { toast.error("Permission denied."); } };

  return (
    <div className="mg-page">
      <div className="mg-head">
        <div><div className="mg-title"><span className="material-symbols-outlined">account_balance_wallet</span><h1>Daily Accounts</h1></div>
          <div className="mg-crumb">Expense &amp; Outflow Manager {isFetching && <span className="mg-sync"><span className="material-symbols-outlined">sync</span> syncing…</span>}</div></div>
        <button className="mg-add" onClick={() => setEditing(BLANK)}><span className="material-symbols-outlined">add</span> Add Expense Voucher</button>
      </div>

      <div className="mg-kpis" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <Kpi tone="navy" label="Total Expenditure (Today)" value={xaf(k.today_total)} icon="payments" />
        <Kpi tone="amber" label="Pending Bills" value={`${k.pending_bills ?? 0} · ${xaf(k.pending_amount)}`} icon="pending_actions" />
        <Kpi tone="purple" label="Digital Outflow" value={xaf(k.digital_outflow)} icon="smartphone" />
        <Kpi tone="green" label="Cash Outflow" value={xaf(k.cash_outflow)} icon="local_atm" />
      </div>

      <div className="mg-tabs">
        <button className={`mg-tab mg-tab-dark ${!category ? "active" : ""}`} onClick={() => { setCategory(""); setPage(1); }}>All</button>
        {CATS.map((c) => <button key={c} className={`mg-tab mg-tab-gray ${category === c ? "active" : ""}`} onClick={() => { setCategory(c); setPage(1); }}>{c}</button>)}
      </div>

      <div className="surface-card mg-filters">
        <div className="mg-filters-hd"><span className="mg-filters-title"><span className="material-symbols-outlined">filter_list</span> Filters</span>
          <button className="mg-clear" onClick={() => { setSearch(""); setCategory(""); setStatus(""); setPage(1); }}><span className="material-symbols-outlined">restart_alt</span> Clear</button></div>
        <div className="mg-filters-grid cols-4">
          <label>Search<input className="form-control" placeholder="Description, vendor, voucher…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label>
          <label>Status<select className="form-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All</option><option value="paid">Paid</option><option value="pending">Pending</option></select></label>
        </div>
      </div>

      <div className="surface-card mg-tablecard">
        <div className="mg-toolbar"><div className="mg-exports">
          <button className="mg-exp mg-exp-csv" onClick={() => csvExport("expenses.csv", ["Voucher", "Date", "Description", "Category", "Vendor", "Amount", "Method", "Status"], rows, (r) => [r.voucher_no, r.date, r.description, r.category, r.vendor, r.amount, r.method, r.status])}><span className="material-symbols-outlined">cloud_download</span> CSV</button>
          <button className="mg-exp mg-exp-print" onClick={() => printRows("Expense Ledger", ["Voucher", "Date", "Description", "Category", "Amount", "Status"], rows, (r) => [r.voucher_no, r.date, r.description, r.category, r.amount, r.status])}><span className="material-symbols-outlined">print</span> Print</button>
        </div></div>
        <div className="table-responsive">
          <table className="table mg-table align-middle mb-0">
            <thead><tr><th>Voucher ID</th><th>Date</th><th>Description</th><th>Category</th><th>Vendor</th><th className="text-end">Amount (FCFA)</th><th>Status</th><th className="text-center">Actions</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="state-cell">Loading…</td></tr>}
              {isError && <tr><td colSpan={8} className="state-cell text-danger">Couldn't load expenses.</td></tr>}
              {!isLoading && !isError && rows.length === 0 && <tr><td colSpan={8} className="state-cell">No vouchers match.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><span className="mg-id">{r.voucher_no}</span></td>
                  <td className="text-secondary" style={{ fontSize: 12.5 }}>{r.date}</td>
                  <td className="fw-semibold" style={{ fontSize: 13.5 }}>{r.description}<div className="mg-sub">{MODE[r.method] ?? r.method}</div></td>
                  <td><span className={`mg-chip ${CAT_TONE[r.category] ?? "mg-chip-gray"}`}>{r.category}</span></td>
                  <td className="text-secondary" style={{ fontSize: 12.5 }}>{r.vendor || "—"}</td>
                  <td className="text-end fw-bold" style={{ color: "#b91c1c" }}>{Number(r.amount).toLocaleString()}</td>
                  <td><span className={`mg-status ${r.status === "paid" ? "mg-status-green" : "mg-status-amber"}`}>{r.status}</span></td>
                  <td><div className="mg-actions justify-content-center">
                    <button title="Edit" className="edit" onClick={() => setEditing(r)}><span className="material-symbols-outlined">edit</span></button>
                    <button title="Delete" className="del" onClick={() => remove(r)}><span className="material-symbols-outlined">delete</span></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager meta={data} setPage={setPage} unit="vouchers" />
      </div>
      {editing && <ExpenseForm initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ExpenseForm({ initial, onClose }) {
  const save = Expenses.useSave();
  const [form, setForm] = useState({ ...BLANK, ...initial });
  const [errors, setErrors] = useState({});
  const isEdit = !!initial.id;
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const submit = async () => { setErrors({}); try { await save.mutateAsync({ ...form, amount: Number(form.amount) }); toast.success(isEdit ? "Voucher updated" : "Voucher recorded"); onClose(); } catch (err) { setErrors(err.fieldErrors ?? {}); if (!err.fieldErrors) toast.error("Could not save."); } };
  return (
    <Modal title={isEdit ? "Edit voucher" : "New expense voucher"} onClose={onClose} size="modal-lg"
      footer={<><button className="btn btn-light" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</button></>}>
      <div className="row">
        <div className="col-md-8"><Field label="Description" required error={errors.description}><input className="form-control" value={form.description} onChange={set("description")} /></Field></div>
        <div className="col-md-4"><Field label="Date" required error={errors.expense_date}><input type="date" className="form-control" value={form.expense_date} onChange={set("expense_date")} /></Field></div>
        <div className="col-md-4"><Field label="Category"><select className="form-select" value={form.category} onChange={set("category")}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></Field></div>
        <div className="col-md-4"><Field label="Vendor"><input className="form-control" value={form.vendor ?? ""} onChange={set("vendor")} /></Field></div>
        <div className="col-md-4"><Field label="Amount (FCFA)" required error={errors.amount}><input type="number" className="form-control" value={form.amount} onChange={set("amount")} /></Field></div>
        <div className="col-md-6"><Field label="Method"><select className="form-select" value={form.method} onChange={set("method")}><option value="cash">Cash</option><option value="momo">MTN MoMo</option><option value="orange_money">Orange Money</option><option value="bank">Bank</option></select></Field></div>
        <div className="col-md-6"><Field label="Status"><select className="form-select" value={form.status} onChange={set("status")}><option value="paid">Paid</option><option value="pending">Pending</option></select></Field></div>
      </div>
    </Modal>
  );
}
