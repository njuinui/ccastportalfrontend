import { useState } from "react";
import toast from "react-hot-toast";
import { Logbook } from "../../api/admin18";
import { confirmDelete } from "../../lib/alerts";
import { initials, Modal, Field, useDebounced } from "../../components/ui";
import { Pager, csvExport, printRows } from "./_shell";
import "../../styles/mgmt.css";

const TABS = [
  { key: "", label: "All", tone: "dark", countKey: "all" },
  { key: "completed", label: "Completed", tone: "green", countKey: "completed" },
  { key: "partial", label: "Partial", tone: "amber", countKey: "partial" },
  { key: "not_taught", label: "Not Taught", tone: "gray", countKey: "not_taught" },
];
const ST = { completed: ["Completed", "mg-status-green"], partial: ["Partial", "mg-status-amber"], not_taught: ["Not Taught", "mg-status-gray"] };

export default function TeachingLogPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const debounced = useDebounced(search);

  const { data: meta } = Logbook.useMeta();
  const { data, isLoading, isError, isFetching, refetch } = Logbook.useList({ status: status || undefined, search: debounced || undefined, page });
  const del = Logbook.useRemove();
  const rows = data?.data ?? [];

  const remove = async (r) => { if (!(await confirmDelete({ title: "Delete log?", text: `${r.topic} (${r.class})`, confirmText: "Delete" }))) return; try { await del.mutateAsync(r.id); toast.success("Log removed"); } catch { toast.error("Permission denied."); } };

  return (
    <div className="mg-page">
      <div className="mg-head">
        <div><div className="mg-title"><span className="material-symbols-outlined">menu_book</span><h1>Teaching Logbook</h1></div>
          <div className="mg-crumb">CCAST Bambili <span className="material-symbols-outlined">chevron_right</span> Daily <span className="material-symbols-outlined">chevron_right</span> Logbook {isFetching && <span className="mg-sync"><span className="material-symbols-outlined">sync</span> system syncing…</span>}</div></div>
        <button className="mg-add" style={{ background: "#fff", color: "var(--primary)", border: "1px solid var(--outline-variant)" }} onClick={() => refetch()}><span className="material-symbols-outlined">refresh</span> Refresh Data</button>
      </div>
      <div className="mg-tabs">{TABS.map((t) => <button key={t.key || "all"} className={`mg-tab mg-tab-${t.tone} ${status === t.key ? "active" : ""}`} onClick={() => { setStatus(t.key); setPage(1); }}>{t.label} ({meta?.counts?.[t.countKey] ?? 0})</button>)}</div>
      <div className="surface-card mg-filters">
        <div className="mg-filters-hd"><span className="mg-filters-title"><span className="material-symbols-outlined">filter_alt</span> Filters</span>
          <button className="mg-clear" onClick={() => { setSearch(""); setStatus(""); setPage(1); }}><span className="material-symbols-outlined">restart_alt</span> Clear All</button></div>
        <div className="mg-filters-grid cols-1"><label>Search Records<input className="form-control" placeholder="Topic, class, teacher…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label></div>
      </div>
      <div className="surface-card mg-tablecard">
        <div className="mg-toolbar"><div className="mg-exports">
          <button className="mg-exp mg-exp-csv" onClick={() => csvExport("logbook.csv", ["Date", "Period", "Class", "Subject", "Topic", "Homework", "Status", "Teacher"], rows, (r) => [r.date, r.period, r.class, r.subject, r.topic, r.homework, r.status, r.teacher])}><span className="material-symbols-outlined">table_view</span> Export CSV</button>
          <button className="mg-exp mg-exp-pdf" onClick={() => printRows("Teaching Logbook", ["Date", "Class", "Subject", "Topic", "Status", "Teacher"], rows, (r) => [r.date, r.class, r.subject, r.topic, r.status, r.teacher])}><span className="material-symbols-outlined">picture_as_pdf</span> Export PDF</button>
          <button className="mg-exp mg-exp-print" onClick={() => printRows("Teaching Logbook", ["Date", "Class", "Subject", "Topic", "Status", "Teacher"], rows, (r) => [r.date, r.class, r.subject, r.topic, r.status, r.teacher])}><span className="material-symbols-outlined">print</span> Print List</button>
        </div></div>
        <div className="table-responsive">
          <table className="table mg-table align-middle mb-0">
            <thead><tr><th>ID</th><th>Date &amp; Period</th><th>Class &amp; Subject</th><th>Topic Detail</th><th>Homework</th><th>Status</th><th>Teacher</th><th className="text-center">Actions</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="state-cell">Loading…</td></tr>}
              {isError && <tr><td colSpan={8} className="state-cell text-danger">Couldn't load logs.</td></tr>}
              {!isLoading && !isError && rows.length === 0 && <tr><td colSpan={8} className="state-cell">No records match.</td></tr>}
              {rows.map((r) => {
                const [sl, sc] = ST[r.status] ?? [r.status, "mg-status-gray"];
                return (
                  <tr key={r.id}>
                    <td className="text-secondary">{r.id}</td>
                    <td><span className="mg-lead" style={{ color: "var(--primary)", background: "var(--primary-fixed)", border: 0 }}>{r.date}</span><div className="mg-sub mt-1">Period {r.period}</div></td>
                    <td><div className="fw-semibold" style={{ fontSize: 13.5 }}>{r.subject}</div><div className="mg-sub">{r.class}</div></td>
                    <td><div className="fw-semibold" style={{ fontSize: 13 }}>{r.topic}</div>{r.topic_detail && <div className="mg-sub fst-italic">{r.topic_detail}</div>}</td>
                    <td>{r.homework ? <span className="mg-chip mg-chip-amber">{r.homework}{r.homework_due ? ` · due ${r.homework_due}` : ""}</span> : <span className="text-secondary">Not assigned</span>}</td>
                    <td><span className={`mg-status ${sc}`}>{sl}</span></td>
                    <td><div className="d-flex align-items-center gap-2"><div className="mg-avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{initials(r.teacher)}</div><span style={{ fontSize: 13 }}>{r.teacher || "—"}</span></div></td>
                    <td><div className="mg-actions justify-content-center">
                      <button title="Edit" className="edit" onClick={() => setEditing(r)}><span className="material-symbols-outlined">edit</span></button>
                      <button title="Delete" className="del" onClick={() => remove(r)}><span className="material-symbols-outlined">delete</span></button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pager meta={data} setPage={setPage} unit="records" />
      </div>
      {editing && <LogForm initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function LogForm({ initial, onClose }) {
  const save = Logbook.useSave();
  const [form, setForm] = useState({ topic: initial.topic ?? "", topic_detail: initial.topic_detail ?? "", homework: initial.homework ?? "", homework_due: initial.homework_due ?? "", status: initial.status ?? "completed", id: initial.id });
  const [errors, setErrors] = useState({});
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const submit = async () => { setErrors({}); try { await save.mutateAsync(form); toast.success("Log updated"); onClose(); } catch (err) { setErrors(err.fieldErrors ?? {}); if (!err.fieldErrors) toast.error("Could not save."); } };
  return (
    <Modal title={`Edit log — ${initial.subject} (${initial.class})`} onClose={onClose} size="modal-lg"
      footer={<><button className="btn btn-light" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</button></>}>
      <div className="row">
        <div className="col-md-6"><Field label="Topic" required error={errors.topic}><input className="form-control" value={form.topic} onChange={set("topic")} /></Field></div>
        <div className="col-md-6"><Field label="Topic detail"><input className="form-control" value={form.topic_detail} onChange={set("topic_detail")} /></Field></div>
        <div className="col-md-5"><Field label="Homework"><input className="form-control" value={form.homework} onChange={set("homework")} /></Field></div>
        <div className="col-md-3"><Field label="Homework due"><input type="date" className="form-control" value={form.homework_due ?? ""} onChange={set("homework_due")} /></Field></div>
        <div className="col-md-4"><Field label="Status"><select className="form-select" value={form.status} onChange={set("status")}><option value="completed">Completed</option><option value="partial">Partial</option><option value="not_taught">Not Taught</option></select></Field></div>
      </div>
    </Modal>
  );
}
