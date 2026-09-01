import { useState } from "react";
import toast from "react-hot-toast";
import { useHallTickets, useHallTicketsMeta, useGenerateHallTicket, useBatchHallTickets } from "../../api/bursar";
import { confirmAction } from "../../lib/alerts";
import { useDebounced } from "../../components/ui";
import { Pager, Kpi, csvExport, printRows } from "../admin/_shell";
import "../../styles/mgmt.css";

const xaf = (n) => Number(n || 0).toLocaleString() + " FCFA";

export default function HallTicketsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);

  const { data: meta } = useHallTicketsMeta();
  const { data, isLoading, isError, isFetching } = useHallTickets({ search: debounced || undefined, page });
  const gen = useGenerateHallTicket();
  const batch = useBatchHallTickets();
  const rows = data?.data ?? [];
  const k = meta?.kpis ?? {};

  const generate = async (r) => {
    if (r.eligibility !== "eligible") return toast.error("Student has outstanding fees — not eligible.");
    try { await gen.mutateAsync(r.id); toast.success(`Hall ticket generated for ${r.name}`); } catch { toast.error("Could not generate."); }
  };
  const batchAll = async () => {
    if (!(await confirmAction({ title: "Batch generate?", text: "Generate hall tickets for every fee-cleared student without one.", confirmText: "Generate all" }))) return;
    try { const res = await batch.mutateAsync(); toast.success(`${res.generated} hall ticket(s) generated`); } catch { toast.error("Could not batch generate."); }
  };

  return (
    <div className="mg-page">
      <div className="mg-head">
        <div><div className="mg-title"><span className="material-symbols-outlined">confirmation_number</span><h1>Examination Hall Ticket Registry</h1></div>
          <div className="mg-crumb">Fee compliance &amp; exam eligibility {isFetching && <span className="mg-sync"><span className="material-symbols-outlined">sync</span> syncing…</span>}</div></div>
        <button className="mg-add" onClick={batchAll} disabled={batch.isPending}><span className="material-symbols-outlined">bolt</span> Batch Generate All</button>
      </div>

      <div className="mg-kpis" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <Kpi tone="navy" label="Total Eligible Students" value={k.total_eligible} icon="verified_user" />
        <Kpi tone="green" label="Tickets Generated" value={k.tickets_generated} icon="confirmation_number" />
        <Kpi tone="red" label="Fee Delinquencies" value={k.fee_delinquencies} icon="report" />
      </div>

      <div className="surface-card mg-filters">
        <div className="mg-filters-hd"><span className="mg-filters-title"><span className="material-symbols-outlined">filter_alt</span> Filters</span>
          <button className="mg-clear" onClick={() => { setSearch(""); setPage(1); }}><span className="material-symbols-outlined">restart_alt</span> Clear</button></div>
        <div className="mg-filters-grid cols-1"><label>Search<input className="form-control" placeholder="Student name or admission #…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label></div>
      </div>

      <div className="surface-card mg-tablecard">
        <div className="mg-toolbar"><div className="mg-exports">
          <button className="mg-exp mg-exp-csv" onClick={() => csvExport("hall_tickets.csv", ["Admission #", "Student", "Fee Compliance", "Eligibility", "Ticket Status", "Ticket #"], rows, (r) => [r.admission_number, r.name, r.fee_compliance, r.eligibility, r.ticket_status, r.ticket_no])}><span className="material-symbols-outlined">download</span> CSV</button>
          <button className="mg-exp mg-exp-print" onClick={() => printRows("Hall Ticket Registry", ["Admission #", "Student", "Compliance", "Eligibility", "Status"], rows, (r) => [r.admission_number, r.name, r.fee_compliance, r.eligibility, r.ticket_status])}><span className="material-symbols-outlined">print</span> Print Selected</button>
        </div></div>
        <div className="table-responsive">
          <table className="table mg-table align-middle mb-0">
            <thead><tr><th>Admission #</th><th>Student Name</th><th>Fee Compliance</th><th>Exam Eligibility</th><th>Hall Ticket Status</th><th className="text-center">Actions</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="state-cell">Loading…</td></tr>}
              {isError && <tr><td colSpan={6} className="state-cell text-danger">Couldn't load registry.</td></tr>}
              {!isLoading && !isError && rows.length === 0 && <tr><td colSpan={6} className="state-cell">No students match.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><span className="mg-id">{r.admission_number}</span></td>
                  <td className="fw-semibold" style={{ fontSize: 13.5 }}>{r.name}</td>
                  <td>{r.fee_compliance === "cleared"
                    ? <span className="mg-status mg-status-green">Cleared</span>
                    : <span className="mg-status mg-status-red">Owing {xaf(r.balance)}</span>}</td>
                  <td>{r.eligibility === "eligible" ? <span className="mg-chip mg-chip-green">Eligible</span> : <span className="mg-chip mg-chip-red">Blocked</span>}</td>
                  <td>{r.ticket_status === "generated"
                    ? <span className="mg-chip mg-chip-blue"><span className="material-symbols-outlined" style={{ fontSize: 13, verticalAlign: "-2px" }}>download_done</span> {r.ticket_no}</span>
                    : <span className="mg-chip mg-chip-gray">Pending</span>}</td>
                  <td><div className="mg-actions justify-content-center">
                    {r.ticket_status === "generated"
                      ? <button title="Print ticket" onClick={() => printRows(`Hall Ticket — ${r.name}`, ["Ticket #", "Admission #", "Student"], [r], (x) => [x.ticket_no, x.admission_number, x.name])}><span className="material-symbols-outlined">print</span></button>
                      : <button className="mg-mini-btn" onClick={() => generate(r)} disabled={r.eligibility !== "eligible" || gen.isPending}>GENERATE</button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager meta={data} setPage={setPage} unit="students" />
      </div>
    </div>
  );
}
