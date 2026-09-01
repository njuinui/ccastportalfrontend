import { useState } from "react";
import toast from "react-hot-toast";
import { Discipline } from "../../api/admin18";
import { useAllStudents } from "../../api/students";
import { confirmDelete, swalInfo } from "../../lib/alerts";
import { Modal, Field, useDebounced } from "../../components/ui";
import { Pager, csvExport, printRows } from "./_shell";
import "../../styles/mgmt.css";

const TABS = [
  { key: "", label: "All", tone: "dark", countKey: "all" },
  { key: "open", label: "Open", tone: "blue", countKey: "open" },
  { key: "under_review", label: "Under Review", tone: "amber", countKey: "under_review" },
  { key: "resolved", label: "Resolved", tone: "green", countKey: "resolved" },
  { key: "escalated", label: "Escalated", tone: "red", countKey: "escalated" },
];
const SEV = { minor: ["Low", "mg-chip-green"], medium: ["Medium", "mg-chip-amber"], high: ["High", "mg-chip-red"] };
const ST = { open: ["Open", "mg-status-blue"], under_review: ["Under Review", "mg-status-amber"], resolved: ["Resolved", "mg-status-green"], escalated: ["Escalated", "mg-status-red"] };
const BLANK = { student_id: "", title: "", category: "", severity: "minor", status: "open", incident_date: "", parent_notified: false, notes: "" };

export default function DisciplinePage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const debounced = useDebounced(search);

  const { data: meta } = Discipline.useMeta();
  const { data, isLoading, isError, isFetching } = Discipline.useList({ status: status || undefined, search: debounced || undefined, type: type || undefined, severity: severity || undefined, page });
  const del = Discipline.useRemove();
  const rows = data?.data ?? [];

  const remove = async (r) => {
    if (!(await confirmDelete({ title: "Delete incident?", text: `The record for ${r.student} will be removed.`, confirmText: "Yes, delete" }))) return;
    try { await del.mutateAsync(r.id); toast.success("Incident removed"); } catch { toast.error("Permission denied."); }
  };
  const view = (r) => swalInfo(`${r.type} — ${r.student}`, `Class: ${r.class ?? "—"}\nDate: ${r.date}\nSeverity: ${r.severity}\nStatus: ${r.status}\nParent notified: ${r.parent_notified ? "Yes" : "No"}\nReporter: ${r.reporter ?? "—"}\n\n${r.notes ?? ""}`);

  return (
    <div className="mg-page">
      <div className="mg-head">
        <div>
          <div className="mg-title"><span className="material-symbols-outlined">gavel</span><h1>Discipline / Behavior</h1></div>
          <div className="mg-crumb">CCAST Bambili <span className="material-symbols-outlined">chevron_right</span> Records <span className="material-symbols-outlined">chevron_right</span> Conduct
            {isFetching && <span className="mg-sync"><span className="material-symbols-outlined">sync</span> syncing with records…</span>}</div>
        </div>
        <button className="mg-add" onClick={() => setEditing(BLANK)}><span className="material-symbols-outlined">add</span> Report Incident</button>
      </div>

      <div className="mg-tabs">
        {TABS.map((t) => <button key={t.key || "all"} className={`mg-tab mg-tab-${t.tone} ${status === t.key ? "active" : ""}`} onClick={() => { setStatus(t.key); setPage(1); }}>{t.label} ({meta?.counts?.[t.countKey] ?? 0})</button>)}
      </div>

      <div className="surface-card mg-filters">
        <div className="mg-filters-hd"><span className="mg-filters-title"><span className="material-symbols-outlined">filter_alt</span> Filters</span>
          <button className="mg-clear" onClick={() => { setSearch(""); setType(""); setSeverity(""); setStatus(""); setPage(1); }}><span className="material-symbols-outlined">restart_alt</span> Reset Filters</button></div>
        <div className="mg-filters-grid cols-4">
          <label>Search Keyword<input className="form-control" placeholder="Student or reporter name…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label>
          <label>Incident Type<select className="form-select" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}><option value="">All Types</option>{(meta?.types ?? []).map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
          <label>Severity Level<select className="form-select" value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1); }}><option value="">All Severities</option><option value="minor">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
          <label>&nbsp;<span className="text-secondary" style={{ fontWeight: 400, fontSize: 12 }}>{data?.total ?? 0} record(s)</span></label>
        </div>
      </div>

      <div className="surface-card mg-tablecard">
        <div className="mg-toolbar"><div className="mg-exports">
          <button className="mg-exp mg-exp-csv" onClick={() => csvExport("discipline.csv", ["Date", "Student", "Type", "Severity", "Status", "Reporter"], rows, (r) => [r.date, r.student, r.type, r.severity, r.status, r.reporter])}><span className="material-symbols-outlined">table_view</span> Export CSV</button>
          <button className="mg-exp mg-exp-pdf" onClick={() => printRows("Discipline", ["Date", "Student", "Type", "Severity", "Status"], rows, (r) => [r.date, r.student, r.type, r.severity, r.status])}><span className="material-symbols-outlined">picture_as_pdf</span> Export PDF</button>
          <button className="mg-exp mg-exp-print" onClick={() => printRows("Discipline", ["Date", "Student", "Type", "Severity", "Status"], rows, (r) => [r.date, r.student, r.type, r.severity, r.status])}><span className="material-symbols-outlined">print</span> Print</button>
        </div></div>
        <div className="table-responsive">
          <table className="table mg-table align-middle mb-0">
            <thead><tr><th>Date</th><th>Student</th><th>Type</th><th>Severity</th><th>Status</th><th>Parent</th><th>Reporter</th><th className="text-center">Actions</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="state-cell">Loading…</td></tr>}
              {isError && <tr><td colSpan={8} className="state-cell text-danger">Couldn't load records.</td></tr>}
              {!isLoading && !isError && rows.length === 0 && <tr><td colSpan={8} className="state-cell">No incidents match your filters.</td></tr>}
              {rows.map((r) => {
                const [sl, sc] = SEV[r.severity] ?? [r.severity, "mg-chip-gray"];
                const [tl, tc] = ST[r.status] ?? [r.status, "mg-status-gray"];
                return (
                  <tr key={r.id}>
                    <td className="text-secondary" style={{ fontSize: 12.5 }}>{r.date}</td>
                    <td><div className="fw-semibold" style={{ fontSize: 13.5 }}>{r.student}</div><div className="mg-sub">{r.class ?? "—"}</div></td>
                    <td><span className="mg-chip mg-chip-purple">{r.type}</span></td>
                    <td><span className={`mg-chip ${sc}`}>{sl}</span></td>
                    <td><span className={`mg-status ${tc}`}>{tl}</span></td>
                    <td>{r.parent_notified ? <span className="mg-chip mg-chip-green">Notified</span> : <span className="mg-chip mg-chip-gray">No</span>}</td>
                    <td className="text-secondary" style={{ fontSize: 12.5 }}>{r.reporter ?? "—"}</td>
                    <td><div className="mg-actions justify-content-center">
                      <button title="View" onClick={() => view(r)}><span className="material-symbols-outlined">visibility</span></button>
                      <button title="Edit" className="edit" onClick={() => setEditing(r)}><span className="material-symbols-outlined">edit</span></button>
                      <button title="Delete" className="del" onClick={() => remove(r)}><span className="material-symbols-outlined">delete</span></button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pager meta={data} setPage={setPage} />
      </div>
      {editing && <IncidentForm initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function IncidentForm({ initial, onClose }) {
  const save = Discipline.useSave();
  const { data: students } = useAllStudents();
  const [form, setForm] = useState({ ...BLANK, ...initial, student_id: initial.student_id || "" });
  const [errors, setErrors] = useState({});
  const isEdit = !!initial.id;
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const submit = async () => {
    setErrors({});
    try { await save.mutateAsync(form); toast.success(isEdit ? "Incident updated" : "Incident reported"); onClose(); }
    catch (err) { setErrors(err.fieldErrors ?? {}); if (!err.fieldErrors) toast.error("Could not save."); }
  };
  return (
    <Modal title={isEdit ? "Edit incident" : "Report incident"} onClose={onClose} size="modal-lg"
      footer={<><button className="btn btn-light" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</button></>}>
      <div className="row">
        {!isEdit && <div className="col-md-6"><Field label="Student" required error={errors.student_id}><select className="form-select" value={form.student_id} onChange={set("student_id")}><option value="">Select student…</option>{(students ?? []).map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.admission_number})</option>)}</select></Field></div>}
        <div className="col-md-6"><Field label="Incident type" required error={errors.title}><input className="form-control" placeholder="e.g. Tardiness" value={form.title} onChange={set("title")} /></Field></div>
        <div className="col-md-6"><Field label="Category" error={errors.category}><input className="form-control" value={form.category ?? ""} onChange={set("category")} /></Field></div>
        <div className="col-md-4"><Field label="Severity"><select className="form-select" value={form.severity} onChange={set("severity")}><option value="minor">Low</option><option value="medium">Medium</option><option value="high">High</option></select></Field></div>
        <div className="col-md-4"><Field label="Status"><select className="form-select" value={form.status} onChange={set("status")}><option value="open">Open</option><option value="under_review">Under Review</option><option value="resolved">Resolved</option><option value="escalated">Escalated</option></select></Field></div>
        <div className="col-md-4"><Field label="Incident date" required error={errors.incident_date}><input type="date" className="form-control" value={form.incident_date ?? ""} onChange={set("incident_date")} /></Field></div>
        <div className="col-12"><Field label=""><label className="d-flex align-items-center gap-2" style={{ fontSize: 14 }}><input type="checkbox" checked={!!form.parent_notified} onChange={(e) => setForm((s) => ({ ...s, parent_notified: e.target.checked }))} /> Parent notified</label></Field></div>
        <div className="col-12"><Field label="Notes" error={errors.notes}><textarea className="form-control" rows="2" value={form.notes ?? ""} onChange={set("notes")} /></Field></div>
      </div>
    </Modal>
  );
}
