import { useState } from "react";
import toast from "react-hot-toast";
import { Complaints } from "../../api/bursar";
import { Users } from "../../api/admin18";
import { confirmDelete, swalInfo } from "../../lib/alerts";
import { Modal, Field, useDebounced } from "../../components/ui";
import { Pager, Kpi, csvExport, printRows } from "../admin/_shell";
import "../../styles/mgmt.css";

const CATS = ["Academic", "Facilities", "Finance", "Conduct", "General"];
const PRIO = { urgent: "mg-prio-urgent", high: "mg-prio-high", medium: "mg-prio-medium", low: "mg-prio-low" };
const ST = { open: ["Open", "mg-status-blue"], in_progress: ["In Progress", "mg-status-amber"], resolved: ["Resolved", "mg-status-green"], closed: ["Closed", "mg-status-gray"] };
const BLANK = { stakeholder_name: "", stakeholder_type: "parent", category: "General", priority: "medium", assigned_to: "", status: "open", description: "" };

export default function ComplaintsPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const debounced = useDebounced(search);

  const { data: meta } = Complaints.useMeta();
  const { data, isLoading, isError, isFetching } = Complaints.useList({ status: status || undefined, search: debounced || undefined, category: category || undefined, priority: priority || undefined, page });
  const del = Complaints.useRemove();
  const rows = data?.data ?? [];
  const k = meta?.kpis ?? {};

  const remove = async (r) => { if (!(await confirmDelete({ title: "Delete ticket?", text: r.ticket_no, confirmText: "Delete" }))) return; try { await del.mutateAsync(r.id); toast.success("Ticket removed"); } catch { toast.error("Permission denied."); } };
  const view = (r) => swalInfo(`${r.ticket_no} — ${r.stakeholder}`, `Type: ${r.stakeholder_type}\nCategory: ${r.category}\nPriority: ${r.priority}\nAssigned: ${r.assigned_to ?? "Unassigned"}\nStatus: ${r.status}\n\n${r.description ?? ""}`);

  const TABS = [
    { key: "", label: "All", tone: "dark" },
    { key: "open", label: "Open", tone: "blue" },
    { key: "in_progress", label: "In Progress", tone: "amber" },
    { key: "resolved", label: "Resolved", tone: "green" },
    { key: "closed", label: "Closed", tone: "gray" },
  ];

  return (
    <div className="mg-page">
      <div className="mg-head">
        <div><div className="mg-title"><span className="material-symbols-outlined">report</span><h1>Complaints &amp; Feedback</h1></div>
          <div className="mg-crumb">Institutional stakeholder tickets {isFetching && <span className="mg-sync"><span className="material-symbols-outlined">sync</span> syncing…</span>}</div></div>
        <button className="mg-add" onClick={() => setEditing(BLANK)}><span className="material-symbols-outlined">add_circle</span> Log New Complaint</button>
      </div>

      <div className="mg-kpis" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <Kpi tone="navy" label="Open Issues" value={k.open} icon="pending" />
        <Kpi tone="amber" label="In Progress" value={k.in_progress} icon="autorenew" />
        <Kpi tone="green" label="Resolved Today" value={k.resolved_today} icon="task_alt" />
      </div>

      <div className="mg-tabs">{TABS.map((t) => <button key={t.key || "all"} className={`mg-tab mg-tab-${t.tone} ${status === t.key ? "active" : ""}`} onClick={() => { setStatus(t.key); setPage(1); }}>{t.label}</button>)}</div>

      <div className="surface-card mg-filters">
        <div className="mg-filters-hd"><span className="mg-filters-title"><span className="material-symbols-outlined">filter_alt</span> Filters</span>
          <button className="mg-clear" onClick={() => { setSearch(""); setCategory(""); setPriority(""); setStatus(""); setPage(1); }}><span className="material-symbols-outlined">restart_alt</span> Clear</button></div>
        <div className="mg-filters-grid cols-4">
          <label>Search<input className="form-control" placeholder="Ticket # or stakeholder…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label>
          <label>Category<select className="form-select" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}><option value="">All</option>{CATS.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label>Priority<select className="form-select" value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}><option value="">All</option><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
        </div>
      </div>

      <div className="surface-card mg-tablecard">
        <div className="mg-toolbar"><div className="mg-exports">
          <button className="mg-exp mg-exp-csv" onClick={() => csvExport("complaints.csv", ["Ticket", "Date", "Stakeholder", "Category", "Priority", "Assigned", "Status"], rows, (r) => [r.ticket_no, r.date, r.stakeholder, r.category, r.priority, r.assigned_to, r.status])}><span className="material-symbols-outlined">download</span> CSV</button>
          <button className="mg-exp mg-exp-print" onClick={() => printRows("Complaints", ["Ticket", "Stakeholder", "Category", "Priority", "Status"], rows, (r) => [r.ticket_no, r.stakeholder, r.category, r.priority, r.status])}><span className="material-symbols-outlined">print</span> Print</button>
        </div></div>
        <div className="table-responsive">
          <table className="table mg-table align-middle mb-0">
            <thead><tr><th>Ticket ID</th><th>Date</th><th>Stakeholder</th><th>Category</th><th>Priority</th><th>Assigned To</th><th>Status</th><th className="text-center">Actions</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="state-cell">Loading…</td></tr>}
              {isError && <tr><td colSpan={8} className="state-cell text-danger">Couldn't load tickets.</td></tr>}
              {!isLoading && !isError && rows.length === 0 && <tr><td colSpan={8} className="state-cell">No tickets match.</td></tr>}
              {rows.map((r) => {
                const [sl, sc] = ST[r.status] ?? [r.status, "mg-status-gray"];
                return (
                  <tr key={r.id}>
                    <td><span className="mg-id">{r.ticket_no}</span></td>
                    <td className="text-secondary" style={{ fontSize: 12.5 }}>{r.date}</td>
                    <td><div className="fw-semibold" style={{ fontSize: 13.5 }}>{r.stakeholder}</div><div className="mg-sub" style={{ textTransform: "capitalize" }}>{r.stakeholder_type}</div></td>
                    <td><span className="mg-chip mg-chip-gray">{r.category}</span></td>
                    <td><span className={`mg-prio ${PRIO[r.priority]}`} style={{ textTransform: "capitalize" }}>{r.priority}</span></td>
                    <td className="text-secondary" style={{ fontSize: 12.5 }}>{r.assigned_to ?? <span className="fst-italic">Unassigned</span>}</td>
                    <td><span className={`mg-status ${sc}`}>{sl}</span></td>
                    <td><div className="mg-actions justify-content-center">
                      <button title="View" onClick={() => view(r)}><span className="material-symbols-outlined">visibility</span></button>
                      <button title="Assign / update" className="edit" onClick={() => setEditing(r)}><span className="material-symbols-outlined">person_add</span></button>
                      <button title="Delete" className="del" onClick={() => remove(r)}><span className="material-symbols-outlined">delete</span></button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pager meta={data} setPage={setPage} unit="tickets" />
      </div>
      {editing && <ComplaintForm initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ComplaintForm({ initial, onClose }) {
  const save = Complaints.useSave();
  const { data: usersData } = Users.useList({ per_page: 200 });
  const staff = usersData?.data ?? [];
  const [form, setForm] = useState({ ...BLANK, ...initial, assigned_to: initial.assigned_to_id || "" });
  const [errors, setErrors] = useState({});
  const isEdit = !!initial.id;
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const submit = async () => {
    setErrors({});
    const payload = { ...form, assigned_to: form.assigned_to || null };
    try { await save.mutateAsync(payload); toast.success(isEdit ? "Ticket updated" : "Complaint logged"); onClose(); }
    catch (err) { setErrors(err.fieldErrors ?? {}); if (!err.fieldErrors) toast.error("Could not save."); }
  };
  return (
    <Modal title={isEdit ? "Update ticket" : "Log new complaint"} onClose={onClose} size="modal-lg"
      footer={<><button className="btn btn-light" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</button></>}>
      <div className="row">
        {!isEdit && <>
          <div className="col-md-6"><Field label="Stakeholder name" required error={errors.stakeholder_name}><input className="form-control" value={form.stakeholder_name} onChange={set("stakeholder_name")} /></Field></div>
          <div className="col-md-6"><Field label="Stakeholder type"><select className="form-select" value={form.stakeholder_type} onChange={set("stakeholder_type")}><option value="parent">Parent</option><option value="student">Student</option><option value="staff">Staff</option><option value="vendor">Vendor</option></select></Field></div>
        </>}
        <div className="col-md-4"><Field label="Category"><select className="form-select" value={form.category} onChange={set("category")}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></Field></div>
        <div className="col-md-4"><Field label="Priority"><select className="form-select" value={form.priority} onChange={set("priority")}><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></Field></div>
        <div className="col-md-4"><Field label="Status"><select className="form-select" value={form.status} onChange={set("status")}><option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></Field></div>
        <div className="col-12"><Field label="Assign to"><select className="form-select" value={form.assigned_to ?? ""} onChange={set("assigned_to")}><option value="">Unassigned</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}{s.role ? ` (${s.role})` : ""}</option>)}</select></Field></div>
        <div className="col-12"><Field label="Description"><textarea className="form-control" rows="3" value={form.description ?? ""} onChange={set("description")} /></Field></div>
      </div>
    </Modal>
  );
}
