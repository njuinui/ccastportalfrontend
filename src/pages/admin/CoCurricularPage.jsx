import { useState } from "react";
import toast from "react-hot-toast";
import { Activities } from "../../api/admin18";
import { useAllStudents } from "../../api/students";
import { confirmDelete, swalInfo } from "../../lib/alerts";
import { Modal, Field, useDebounced } from "../../components/ui";
import { Pager, csvExport } from "./_shell";
import "../../styles/mgmt.css";

const TABS = [
  { key: "", label: "All", tone: "dark", countKey: "all" },
  { key: "school", label: "School", tone: "blue", countKey: "school" },
  { key: "district", label: "District", tone: "green", countKey: "district" },
  { key: "state", label: "State", tone: "amber", countKey: "state" },
  { key: "national", label: "National", tone: "purple", countKey: "national" },
  { key: "international", label: "International", tone: "red", countKey: "international" },
];
const TYPE_TONE = { sports: "mg-chip-amber", academic: "mg-chip-green", dance: "mg-chip-purple", music: "mg-chip-blue", art: "mg-chip-teal", other: "mg-chip-gray" };
const LEVEL_TONE = { school: "mg-chip-blue", district: "mg-chip-green", state: "mg-chip-amber", national: "mg-chip-purple", international: "mg-chip-red" };
const BLANK = { student_id: "", activity: "", type: "sports", level: "school", position: "", activity_date: "", notes: "" };

export default function CoCurricularPage() {
  const [level, setLevel] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const debounced = useDebounced(search);

  const { data: meta } = Activities.useMeta();
  const { data, isLoading, isError, isFetching } = Activities.useList({ level: level || undefined, search: debounced || undefined, page });
  const del = Activities.useRemove();
  const rows = data?.data ?? [];

  const remove = async (r) => { if (!(await confirmDelete({ title: "Delete record?", text: `${r.activity} — ${r.student}`, confirmText: "Delete" }))) return; try { await del.mutateAsync(r.id); toast.success("Record removed"); } catch { toast.error("Permission denied."); } };
  const view = (r) => swalInfo(r.activity, `Student: ${r.student}\nClass: ${r.class ?? "—"}\nType: ${r.type}\nLevel: ${r.level}\nPosition: ${r.position ?? "—"}\nDate: ${r.date}`);

  return (
    <div className="mg-page">
      <div className="mg-head">
        <div><div className="mg-title"><span className="material-symbols-outlined">emoji_events</span><h1>Activity Registry</h1></div>
          <div className="mg-crumb">Monitor institutional participation in internal &amp; external events {isFetching && <span className="mg-sync"><span className="material-symbols-outlined">sync</span> sync</span>}</div></div>
        <button className="mg-add" onClick={() => setEditing(BLANK)}><span className="material-symbols-outlined">add</span> Record Activity</button>
      </div>
      <div className="mg-tabs">{TABS.map((t) => <button key={t.key || "all"} className={`mg-tab mg-tab-${t.tone} ${level === t.key ? "active" : ""}`} onClick={() => { setLevel(t.key); setPage(1); }}>{t.label} ({meta?.counts?.[t.countKey] ?? 0})</button>)}</div>
      <div className="surface-card mg-tablecard">
        <div className="mg-toolbar">
          <div className="mg-exports"><button className="mg-exp mg-exp-csv" onClick={() => csvExport("activities.csv", ["Date", "Student", "Activity", "Type", "Level", "Position"], rows, (r) => [r.date, r.student, r.activity, r.type, r.level, r.position])}><span className="material-symbols-outlined">table_view</span> Export CSV</button></div>
          <label className="mg-tsearch">Search:<input className="form-control form-control-sm" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label>
        </div>
        <div className="table-responsive">
          <table className="table mg-table align-middle mb-0">
            <thead><tr><th>Date</th><th>Student</th><th>Activity</th><th>Type</th><th>Level</th><th>Position</th><th className="text-center">Actions</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="state-cell">Loading…</td></tr>}
              {isError && <tr><td colSpan={7} className="state-cell text-danger">Couldn't load.</td></tr>}
              {!isLoading && !isError && rows.length === 0 && <tr><td colSpan={7} className="state-cell">No activities match.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="text-secondary" style={{ fontSize: 12.5 }}>{r.date}</td>
                  <td><div className="fw-semibold" style={{ fontSize: 13.5 }}>{r.student}</div><div className="mg-sub">{r.class ?? "—"}</div></td>
                  <td style={{ fontSize: 13.5 }}>{r.activity}</td>
                  <td><span className={`mg-chip ${TYPE_TONE[r.type] ?? "mg-chip-gray"}`} style={{ textTransform: "uppercase" }}>{r.type}</span></td>
                  <td><span className={`mg-chip ${LEVEL_TONE[r.level] ?? "mg-chip-gray"}`} style={{ textTransform: "uppercase" }}>{r.level}</span></td>
                  <td className="fw-semibold" style={{ fontSize: 13 }}>{r.position || <span className="text-secondary fst-italic">Participated</span>}</td>
                  <td><div className="mg-actions justify-content-center">
                    <button title="View" onClick={() => view(r)}><span className="material-symbols-outlined">visibility</span></button>
                    <button title="Edit" className="edit" onClick={() => setEditing(r)}><span className="material-symbols-outlined">edit</span></button>
                    <button title="Delete" className="del" onClick={() => remove(r)}><span className="material-symbols-outlined">delete</span></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager meta={data} setPage={setPage} />
      </div>
      {editing && <ActivityForm initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ActivityForm({ initial, onClose }) {
  const save = Activities.useSave();
  const { data: students } = useAllStudents();
  const [form, setForm] = useState({ ...BLANK, ...initial, student_id: initial.student_id || "" });
  const [errors, setErrors] = useState({});
  const isEdit = !!initial.id;
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const submit = async () => { setErrors({}); try { await save.mutateAsync(form); toast.success(isEdit ? "Updated" : "Activity recorded"); onClose(); } catch (err) { setErrors(err.fieldErrors ?? {}); if (!err.fieldErrors) toast.error("Could not save."); } };
  return (
    <Modal title={isEdit ? "Edit activity" : "Record activity"} onClose={onClose} size="modal-lg"
      footer={<><button className="btn btn-light" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</button></>}>
      <div className="row">
        {!isEdit && <div className="col-md-6"><Field label="Student" required error={errors.student_id}><select className="form-select" value={form.student_id} onChange={set("student_id")}><option value="">Select student…</option>{(students ?? []).map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select></Field></div>}
        <div className="col-md-6"><Field label="Activity" required error={errors.activity}><input className="form-control" value={form.activity} onChange={set("activity")} /></Field></div>
        <div className="col-md-4"><Field label="Type"><select className="form-select" value={form.type} onChange={set("type")}><option value="sports">Sports</option><option value="academic">Academic</option><option value="dance">Dance</option><option value="music">Music</option><option value="art">Art</option><option value="other">Other</option></select></Field></div>
        <div className="col-md-4"><Field label="Level"><select className="form-select" value={form.level} onChange={set("level")}><option value="school">School</option><option value="district">District</option><option value="state">State</option><option value="national">National</option><option value="international">International</option></select></Field></div>
        <div className="col-md-4"><Field label="Position"><input className="form-control" placeholder="1st place / Participated" value={form.position ?? ""} onChange={set("position")} /></Field></div>
        <div className="col-md-6"><Field label="Date" required error={errors.activity_date}><input type="date" className="form-control" value={form.activity_date ?? ""} onChange={set("activity_date")} /></Field></div>
        <div className="col-12"><Field label="Notes"><textarea className="form-control" rows="2" value={form.notes ?? ""} onChange={set("notes")} /></Field></div>
      </div>
    </Modal>
  );
}
