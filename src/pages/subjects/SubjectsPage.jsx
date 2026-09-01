import { useState } from "react";
import toast from "react-hot-toast";
import { useSubjects, useSubjectsMeta, useSaveSubject, useDeleteSubject } from "../../api/subjects";
import { useClasses } from "../../api/academic";
import { confirmDelete, swalInfo } from "../../lib/alerts";
import { Modal, Field, useDebounced } from "../../components/ui";
import { Pager, csvExport, printRows } from "../admin/_shell";
import "../../styles/mgmt.css";

const TABS = [
  { key: "", label: "All Subjects", tone: "dark", countKey: "all" },
  { key: "active", label: "Active", tone: "green", countKey: "active" },
  { key: "inactive", label: "Inactive", tone: "gray", countKey: "inactive" },
];
const TYPE_TONE = { theory: "mg-chip-blue", practical: "mg-chip-amber", both: "mg-chip-purple" };
const BLANK = { name: "", code: "", coefficient: 1, type: "theory", max_marks: 100, pass_marks: 50, status: "active", class_id: "" };

export default function SubjectsPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const debounced = useDebounced(search);

  const { data: meta } = useSubjectsMeta();
  const { data, isLoading, isError, isFetching } = useSubjects({ status: status || undefined, search: debounced || undefined, type: type || undefined, per_page: 10, page });
  const del = useDeleteSubject();
  const rows = data?.data ?? [];
  const m = data?.meta;

  const remove = async (r) => { if (!(await confirmDelete({ title: "Delete subject?", text: `${r.name} (${r.code})`, confirmText: "Delete" }))) return; try { await del.mutateAsync(r.id); toast.success("Subject removed"); } catch { toast.error("Permission denied."); } };
  const view = (r) => swalInfo(r.name, `Code: ${r.code}\nType: ${r.type}\nCoefficient: ${r.coefficient}\nMax marks: ${r.max_marks}\nPass marks: ${r.pass_marks}\nClasses: ${r.classes_count}\nStatus: ${r.status}`);

  return (
    <div className="mg-page">
      <div className="mg-head">
        <div><div className="mg-title"><span className="material-symbols-outlined">menu_book</span><h1>Subjects Management</h1></div>
          <div className="mg-crumb">Academic Hub <span className="material-symbols-outlined">chevron_right</span> Subjects {isFetching && <span className="mg-sync"><span className="material-symbols-outlined">sync</span> syncing…</span>}</div></div>
        <button className="mg-add" onClick={() => setEditing(BLANK)}><span className="material-symbols-outlined">add</span> Add New Subject</button>
      </div>
      <div className="mg-tabs">{TABS.map((t) => <button key={t.key || "all"} className={`mg-tab mg-tab-${t.tone} ${status === t.key ? "active" : ""}`} onClick={() => { setStatus(t.key); setPage(1); }}>{t.label} ({meta?.counts?.[t.countKey] ?? 0})</button>)}</div>
      <div className="surface-card mg-filters">
        <div className="mg-filters-hd"><span className="mg-filters-title"><span className="material-symbols-outlined">filter_alt</span> Filters</span>
          <button className="mg-clear" onClick={() => { setSearch(""); setType(""); setStatus(""); setPage(1); }}><span className="material-symbols-outlined">restart_alt</span> Clear All</button></div>
        <div className="mg-filters-grid cols-4">
          <label>Search<input className="form-control" placeholder="Name or code…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label>
          <label>Type<select className="form-select" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}><option value="">All Types</option><option value="theory">Theory</option><option value="practical">Practical</option><option value="both">Both</option></select></label>
        </div>
      </div>
      <div className="surface-card mg-tablecard">
        <div className="mg-toolbar"><div className="mg-exports">
          <button className="mg-exp mg-exp-csv" onClick={() => csvExport("subjects.csv", ["ID", "Name", "Code", "Type", "Coeff", "Max", "Pass", "Status"], rows, (r) => [r.id, r.name, r.code, r.type, r.coefficient, r.max_marks, r.pass_marks, r.status])}><span className="material-symbols-outlined">table_view</span> Export</button>
          <button className="mg-exp mg-exp-print" onClick={() => printRows("Subjects", ["ID", "Name", "Code", "Type", "Max", "Pass", "Status"], rows, (r) => [r.id, r.name, r.code, r.type, r.max_marks, r.pass_marks, r.status])}><span className="material-symbols-outlined">print</span> Print</button>
        </div></div>
        <div className="table-responsive">
          <table className="table mg-table align-middle mb-0">
            <thead><tr><th>ID</th><th>Subject Name</th><th>Code</th><th>Class</th><th>Type</th><th className="text-center">Max Marks</th><th className="text-center">Pass Marks</th><th>Status</th><th className="text-center">Actions</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={9} className="state-cell">Loading…</td></tr>}
              {isError && <tr><td colSpan={9} className="state-cell text-danger">Couldn't load subjects.</td></tr>}
              {!isLoading && !isError && rows.length === 0 && <tr><td colSpan={9} className="state-cell">No subjects match.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="text-secondary">#{String(r.id).padStart(3, "0")}</td>
                  <td className="fw-semibold" style={{ fontSize: 13.5 }}>{r.name}</td>
                  <td><span className="mg-chip mg-chip-gray">{r.code}</span></td>
                  <td className="text-secondary" style={{ fontSize: 12.5 }}>{r.primary_class ?? "—"}{r.classes_count > 1 ? ` +${r.classes_count - 1}` : ""}</td>
                  <td><span className={`mg-chip ${TYPE_TONE[r.type] ?? "mg-chip-gray"}`} style={{ textTransform: "uppercase" }}>{r.type}</span></td>
                  <td className="text-center fw-semibold">{r.max_marks}</td>
                  <td className="text-center text-secondary">{r.pass_marks}</td>
                  <td><span className={`mg-status ${r.status === "active" ? "mg-status-green" : "mg-status-gray"}`}>{r.status}</span></td>
                  <td><div className="mg-actions justify-content-center">
                    <button title="Edit" className="edit" onClick={() => setEditing(r)}><span className="material-symbols-outlined">edit</span></button>
                    <button title="View" onClick={() => view(r)}><span className="material-symbols-outlined">visibility</span></button>
                    <button title="Delete" className="del" onClick={() => remove(r)}><span className="material-symbols-outlined">delete</span></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager meta={m} setPage={setPage} unit="subjects" />
      </div>
      {editing && <SubjectForm initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function SubjectForm({ initial, onClose }) {
  const save = useSaveSubject();
  const { data: classesRaw } = useClasses();
  const classes = Array.isArray(classesRaw) ? classesRaw : (classesRaw?.data ?? []);
  const [form, setForm] = useState({ ...BLANK, ...initial });
  const [errors, setErrors] = useState({});
  const isEdit = !!initial.id;
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const submit = async () => { setErrors({}); try { await save.mutateAsync(form); toast.success(isEdit ? "Subject updated" : "Subject added"); onClose(); } catch (err) { setErrors(err.fieldErrors ?? {}); if (!err.fieldErrors) toast.error("Could not save."); } };
  return (
    <Modal title={isEdit ? "Edit subject" : "New subject"} onClose={onClose} size="modal-lg"
      footer={<><button className="btn btn-light" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</button></>}>
      <div className="row">
        <div className="col-md-8"><Field label="Name" required error={errors.name}><input className="form-control" value={form.name} onChange={set("name")} /></Field></div>
        <div className="col-md-4"><Field label="Code" required error={errors.code}><input className="form-control" value={form.code} onChange={set("code")} /></Field></div>
        <div className="col-md-3"><Field label="Coefficient" error={errors.coefficient}><input type="number" className="form-control" value={form.coefficient} onChange={set("coefficient")} /></Field></div>
        <div className="col-md-5"><Field label="Assign to class" error={errors.class_id}><select className="form-select" value={form.class_id ?? ""} onChange={set("class_id")}><option value="">— none —</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field></div>
        <div className="col-md-3"><Field label="Type"><select className="form-select" value={form.type} onChange={set("type")}><option value="theory">Theory</option><option value="practical">Practical</option><option value="both">Both</option></select></Field></div>
        <div className="col-md-2"><Field label="Max" error={errors.max_marks}><input type="number" className="form-control" value={form.max_marks} onChange={set("max_marks")} /></Field></div>
        <div className="col-md-2"><Field label="Pass" error={errors.pass_marks}><input type="number" className="form-control" value={form.pass_marks} onChange={set("pass_marks")} /></Field></div>
        <div className="col-md-2"><Field label="Status"><select className="form-select" value={form.status} onChange={set("status")}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field></div>
      </div>
    </Modal>
  );
}
