import { useState } from "react";
import { usePayments, usePaymentsMeta } from "../../api/fees";
import { swalInfo } from "../../lib/alerts";
import { useDebounced } from "../../components/ui";
import { Pager, Kpi, csvExport, printRows } from "../admin/_shell";
import "../../styles/mgmt.css";

const xaf = (n) => Number(n || 0).toLocaleString() + " FCFA";
const MODE = { cash: "Cash", momo: "MoMo", orange_money: "Orange", bank: "Bank" };
const today = () => new Date().toISOString().slice(0, 10);

export default function DailyCollectionPage() {
  const [date, setDate] = useState(today());
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);

  const { data: meta } = usePaymentsMeta();
  const { data, isLoading, isError, isFetching } = usePayments({ date: date || undefined, search: debounced || undefined, method: method || undefined, page });
  const rows = data?.data ?? [];
  const isToday = date === today();

  return (
    <div className="mg-page">
      <div className="mg-head">
        <div><div className="mg-title"><span className="material-symbols-outlined">receipt_long</span><h1>Daily Collection Ledger</h1></div>
          <div className="mg-crumb">Real-time institutional cash flow &amp; fee settlements {isFetching && <span className="mg-sync"><span className="material-symbols-outlined">sync</span> syncing…</span>}</div></div>
      </div>

      <div className="mg-kpis" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <Kpi tone="green" label={isToday ? "Today's Total" : "Selected Day Total"} value={isToday ? xaf(meta?.kpis?.today_collected) : xaf(rows.reduce((a, r) => a + r.amount, 0))} icon="account_balance_wallet" />
        <Kpi tone="navy" label="Receipts Today" value={meta?.kpis?.receipts_today} icon="receipt" />
        <Kpi tone="amber" label="Total Outstanding" value={xaf(meta?.kpis?.total_pending)} icon="pending_actions" />
      </div>

      <div className="surface-card mg-filters">
        <div className="mg-filters-hd"><span className="mg-filters-title"><span className="material-symbols-outlined">filter_alt</span> Filters</span>
          <button className="mg-clear" onClick={() => { setSearch(""); setMethod(""); setDate(today()); setPage(1); }}><span className="material-symbols-outlined">restart_alt</span> Reset</button></div>
        <div className="mg-filters-grid cols-4">
          <label>Date<input type="date" className="form-control" value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }} /></label>
          <label>Search<input className="form-control" placeholder="Student name…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label>
          <label>Mode<select className="form-select" value={method} onChange={(e) => { setMethod(e.target.value); setPage(1); }}><option value="">All Modes</option><option value="cash">Cash</option><option value="momo">MoMo</option><option value="orange_money">Orange Money</option><option value="bank">Bank</option></select></label>
        </div>
      </div>

      <div className="surface-card mg-tablecard">
        <div className="mg-toolbar"><div className="mg-exports">
          <button className="mg-exp mg-exp-csv" onClick={() => csvExport("collections.csv", ["Receipt", "Date", "Student", "Class", "Category", "Mode", "Amount"], rows, (r) => [r.receipt, r.date, r.student, r.class, r.fee_type, r.method, r.amount])}><span className="material-symbols-outlined">download</span> CSV</button>
          <button className="mg-exp mg-exp-pdf" onClick={() => printRows("Daily Collection", ["Receipt", "Student", "Category", "Mode", "Amount"], rows, (r) => [r.receipt, r.student, r.fee_type, r.method, r.amount])}><span className="material-symbols-outlined">picture_as_pdf</span> PDF Report</button>
        </div></div>
        <div className="table-responsive">
          <table className="table mg-table align-middle mb-0">
            <thead><tr><th>Receipt ID</th><th>Student Name</th><th>Class/Section</th><th>Category</th><th>Mode</th><th className="text-end">Amount</th><th className="text-center">Actions</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="state-cell">Loading…</td></tr>}
              {isError && <tr><td colSpan={7} className="state-cell text-danger">Couldn't load collections.</td></tr>}
              {!isLoading && !isError && rows.length === 0 && <tr><td colSpan={7} className="state-cell">No collections for this day.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><span className="mg-id" style={{ color: "var(--primary)" }}>{r.receipt}</span></td>
                  <td className="fw-semibold" style={{ fontSize: 13.5 }}>{r.student}</td>
                  <td className="text-secondary" style={{ fontSize: 12.5 }}>{r.class ?? "—"}</td>
                  <td style={{ fontSize: 13 }}>{r.fee_type}</td>
                  <td><span className="mg-chip mg-chip-blue">{MODE[r.method] ?? r.method}</span></td>
                  <td className="text-end fw-bold" style={{ color: "#15803d" }}>{xaf(r.amount)}</td>
                  <td><div className="mg-actions justify-content-center">
                    <button title="View" onClick={() => swalInfo(`Receipt ${r.receipt}`, `Student: ${r.student}\nCategory: ${r.fee_type}\nAmount: ${xaf(r.amount)}\nMode: ${MODE[r.method] ?? r.method}\nDate: ${r.date}`)}><span className="material-symbols-outlined">visibility</span></button>
                    <button title="Print" onClick={() => printRows(`Receipt ${r.receipt}`, ["Receipt", "Student", "Amount"], [r], (x) => [x.receipt, x.student, x.amount])}><span className="material-symbols-outlined">print</span></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager meta={data} setPage={setPage} unit="collections" />
      </div>
    </div>
  );
}
