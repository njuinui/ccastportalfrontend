import { useState } from "react";
import toast from "react-hot-toast";
import { Notices } from "../../api/admin18";
import { confirmDelete } from "../../lib/alerts";
import { initials, Modal, Field, useDebounced } from "../../components/ui";
import { Pager, csvExport, printRows } from "./_shell";
import "../../styles/mgmt.css";

const TABS = [
  { key: "", label: "All", tone: "dark", countKey: "all" },
  { key: "urgent", label: "Urgent", tone: "red", countKey: "urgent" },
  { key: "high", label: "High", tone: "amber", countKey: "high" },
  { key: "medium", label: "Medium", tone: "amber", countKey: "medium" },
  { key: "low", label: "Low", tone: "blue", countKey: "low" },
];
const TYPE_TONE = { Meeting: "mg-chip-amber", Program: "mg-chip-blue", Circular: "mg-chip-purple", Other: "mg-chip-gray" };
const BLANK = { title: "", excerpt: "", type: "Meeting", audience: "all", audience_label: "All", priority: "medium", status: "active", expires_at: "" };

export default function NoticesPage() {
  const [priority, setPriority] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [audience, setAudience] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const debounced = useDebounced(search);

  const { data: meta } = Notices.useMeta();
  const { data, isLoading, isError, isFetching } = Notices.useList({ priority: priority || undefined, search: debounced || undefined, type: type || undefined, audience: audience || undefined, page });
  const del = Notices.useRemove();
  const rows = data?.data ?? [];

  const remove = async (r) => { if (!(await confirmDelete({ title: "Delete notice?", text: r.title, confirmText: "Delete" }))) return; try { await del.mutateAsync(r.id); toast.success("Notice removed"); } catch { toast.error("Permission denied."); } };

  return (
    <div className="mg-page">
      <div className="mg-head">
        <div><div className="mg-title"><span className="material-symbols-outlined">campaign</span><h1>School Notices</h1></div>
          <div className="mg-crumb">CCAST Bambili <span className="material-symbols-outlined">chevron_right</span> Communications {isFetching && <span className="mg-sync"><span className="material-symbols-outlined">sync</span> syncing…</span>}</div></div>
        <button className="mg-add" onClick={() => setEditing(BLANK)}><span className="material-symbols-outlined">add</span> Post Notice</button>
      </div>
      <div className="mg-tabs">{TABS.map((t) => <button key={t.key || "all"} className={`mg-tab mg-tab-${t.tone} ${priority === t.key ? "active" : ""}`} onClick={() => { setPriority(t.key); setPage(1); }}>{t.label} ({meta?.counts?.[t.countKey] ?? 0})</button>)}</div>
      <div className="surface-card mg-filters">
        <div className="mg-filters-hd"><span className="mg-filters-title"><span className="material-symbols-outlined">filter_alt</span> Filters</span>
          <button className="mg-clear" onClick={() => { setSearch(""); setType(""); setAudience(""); setPriority(""); setPage(1); }}><span className="material-symbols-outlined">restart_alt</span> Clear Filters</button></div>
        <div className="mg-filters-grid cols-4">
          <label>Search Notices<input className="form-control" placeholder="Type to search…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label>
          <label>Type<select className="form-select" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}><option value="">All Types</option>{(meta?.types ?? []).map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
          <label>Audience<select className="form-select" value={audience} onChange={(e) => { setAudience(e.target.value); setPage(1); }}><option value="">All Audiences</option><option value="all">All</option><option value="class_specific">Class Specific</option></select></label>
          <label>&nbsp;<span className="text-secondary" style={{ fontWeight: 400, fontSize: 12 }}>{data?.total ?? 0} notice(s)</span></label>
        </div>
      </div>
      <div className="surface-card mg-tablecard">
        <div className="mg-toolbar"><div className="mg-exports">
          <button className="mg-exp mg-exp-csv" onClick={() => csvExport("notices.csv", ["Title", "Type", "Audience", "Priority", "Status", "Posted By"], rows, (r) => [r.title, r.type, r.audience_label, r.priority, r.status, r.posted_by])}><span className="material-symbols-outlined">table_view</span> CSV</button>
          <button className="mg-exp mg-exp-pdf" onClick={() => printRows("School Notices", ["Title", "Type", "Priority", "Status"], rows, (r) => [r.title, r.type, r.priority, r.status])}><span className="material-symbols-outlined">picture_as_pdf</span> PDF</button>
          <button className="mg-exp mg-exp-print" onClick={() => printRows("School Notices", ["Title", "Type", "Priority", "Status"], rows, (r) => [r.title, r.type, r.priority, r.status])}><span className="material-symbols-outlined">print</span> PRINT</button>
        </div></div>
        <div className="table-responsive">
          <table className="table mg-table align-middle mb-0">
            <thead><tr><th>Notice Details</th><th>Type</th><th>Audience</th><th>Priority</th><th>Dates</th><th>Posted By</th><th>Status</th><th className="text-center">Actions</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="state-cell">Loading…</td></tr>}
              {isError && <tr><td colSpan={8} className="state-cell text-danger">Couldn't load notices.</td></tr>}
              {!isLoading && !isError && rows.length === 0 && <tr><td colSpan={8} className="state-cell">No notices match.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ maxWidth: 280 }}><div className="fw-semibold" style={{ fontSize: 13.5 }}>{r.title}</div><div className="mg-sub">{r.excerpt}</div></td>
                  <td><span className={`mg-chip ${TYPE_TONE[r.type] ?? "mg-chip-gray"}`}>{r.type || "—"}</span></td>
                  <td style={{ fontSize: 12.5 }}><span className="fw-semibold text-primary">{r.audience === "class_specific" ? "Class Specific" : "All"}</span>{r.audience === "class_specific" && r.audience_label && <div className="mg-sub fst-italic">{r.audience_label}</div>}</td>
                  <td><span className={`mg-prio mg-prio-${r.priority}`} style={{ textTransform: "capitalize" }}>{r.priority}</span></td>
                  <td style={{ fontSize: 12 }}><div>{r.published_at}</div><div className="mg-sub">Exp: {r.expires_at ?? "—"}</div></td>
                  <td><div className="d-flex align-items-center gap-2"><div className="mg-avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{initials(r.posted_by || "—")}</div><span style={{ fontSize: 12.5 }}>{r.posted_by ?? "—"}</span></div></td>
                  <td><span className={`mg-status ${r.status === "active" ? "mg-status-green" : "mg-status-gray"}`}>{r.status}</span></td>
                  <td><div className="mg-actions justify-content-center">
                    <button title="Edit" className="edit" onClick={() => setEditing(r)}><span className="material-symbols-outlined">edit</span></button>
                    <button title="Delete" className="del" onClick={() => remove(r)}><span className="material-symbols-outlined">delete</span></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager meta={data} setPage={setPage} unit="notices" />
      </div>
      {editing && <NoticeForm initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function NoticeForm({ initial, onClose }) {
  const save = Notices.useSave();
  const [form, setForm] = useState({ ...BLANK, ...initial });
  const [errors, setErrors] = useState({});
  const isEdit = !!initial.id;
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const submit = async () => { setErrors({}); try { await save.mutateAsync(form); toast.success(isEdit ? "Notice updated" : "Notice posted"); onClose(); } catch (err) { setErrors(err.fieldErrors ?? {}); if (!err.fieldErrors) toast.error("Could not save."); } };
  return (
    <Modal title={isEdit ? "Edit notice" : "Post notice"} onClose={onClose} size="modal-lg"
      footer={<><button className="btn btn-light" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</button></>}>
      <div className="row">
        <div className="col-12"><Field label="Title" required error={errors.title}><input className="form-control" value={form.title} onChange={set("title")} /></Field></div>
        <div className="col-12"><Field label="Details" error={errors.excerpt}><textarea className="form-control" rows="2" value={form.excerpt ?? ""} onChange={set("excerpt")} /></Field></div>
        <div className="col-md-3"><Field label="Type"><select className="form-select" value={form.type} onChange={set("type")}><option>Meeting</option><option>Program</option><option>Circular</option><option>Other</option></select></Field></div>
        <div className="col-md-3"><Field label="Priority"><select className="form-select" value={form.priority} onChange={set("priority")}><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></Field></div>
        <div className="col-md-3"><Field label="Audience"><select className="form-select" value={form.audience} onChange={set("audience")}><option value="all">All</option><option value="class_specific">Class Specific</option></select></Field></div>
        <div className="col-md-3"><Field label="Status"><select className="form-select" value={form.status} onChange={set("status")}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field></div>
        {form.audience === "class_specific" && <div className="col-md-6"><Field label="Audience label"><input className="form-control" placeholder="Form 1 A (2024-25)" value={form.audience_label ?? ""} onChange={set("audience_label")} /></Field></div>}
        <div className="col-md-6"><Field label="Expires on"><input type="date" className="form-control" value={form.expires_at ?? ""} onChange={set("expires_at")} /></Field></div>
      </div>
    </Modal>
  );
}
