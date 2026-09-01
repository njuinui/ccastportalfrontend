import { useState } from "react";
import toast from "react-hot-toast";
import {
  useSectionsList,
  useSectionsMeta,
  useClasses,
  useSaveSection,
  useDeleteSection,
} from "../../api/academic";
import { useStaff } from "../../api/staff";
import { confirmDelete } from "../../lib/alerts";
import { Modal, Field, useDebounced } from "../../components/ui";
import { Pager, csvExport, printRows } from "../admin/_shell";
import "../../styles/mgmt.css";

const TABS = [
  { key: "", label: "All", tone: "dark", countKey: "all" },
  { key: "active", label: "Active", tone: "green", countKey: "active" },
  { key: "inactive", label: "Inactive", tone: "gray", countKey: "inactive" },
];
const STAGE_TONE = {
  primary: "mg-chip-green",
  secondary: "mg-chip-blue",
  "high-school": "mg-chip-purple",
};
const BLANK = {
  school_class_id: "",
  name: "",
  capacity: 40,
  stage: "secondary",
  medium: "english",
  room: "",
  status: "active",
  class_teacher_id: "",
};

export default function ClassesPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [medium, setMedium] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const debounced = useDebounced(search);

  const { data: meta } = useSectionsMeta();
  const { data, isLoading, isError, isFetching } = useSectionsList({
    status: status || undefined,
    search: debounced || undefined,
    stage: stage || undefined,
    medium: medium || undefined,
    page,
  });
  const del = useDeleteSection();
  const rows = data?.data ?? [];

  const remove = async (r) => {
    if (
      !(await confirmDelete({
        title: "Delete section?",
        text: `${r.class} ${r.section}`,
        confirmText: "Delete",
      }))
    )
      return;
    try {
      await del.mutateAsync(r.id);
      toast.success("Section removed");
    } catch {
      toast.error("Permission denied.");
    }
  };

  const capBar = (r) => {
    const pct = r.capacity
      ? Math.min(100, Math.round((r.enrolled / r.capacity) * 100))
      : 0;
    const color = pct >= 90 ? "#dc2626" : pct >= 70 ? "#f59e0b" : "#16a34a";
    return (
      <div>
        <div className="fw-semibold" style={{ fontSize: 13, color }}>
          {r.enrolled} / {r.capacity}
        </div>
        <div
          style={{
            height: 5,
            background: "#eef1f7",
            borderRadius: 3,
            marginTop: 3,
            width: 70,
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: color,
              borderRadius: 3,
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="mg-page">
      <div className="mg-head">
        <div>
          <div className="mg-title">
            <span className="material-symbols-outlined">layers</span>
            <h1>Classes &amp; Sections</h1>
          </div>
          <div className="mg-crumb">
            CCAST Bambili{" "}
            <span className="material-symbols-outlined">chevron_right</span>{" "}
            Records{" "}
            {isFetching && (
              <span className="mg-sync">
                <span className="material-symbols-outlined">sync</span> syncing…
              </span>
            )}
          </div>
        </div>
        <button className="mg-add" onClick={() => setEditing(BLANK)}>
          <span className="material-symbols-outlined">add</span> Add Class
        </button>
      </div>
      <div className="mg-tabs">
        {TABS.map((t) => (
          <button
            key={t.key || "all"}
            className={`mg-tab mg-tab-${t.tone} ${status === t.key ? "active" : ""}`}
            onClick={() => {
              setStatus(t.key);
              setPage(1);
            }}
          >
            {t.label} ({meta?.counts?.[t.countKey] ?? 0})
          </button>
        ))}
      </div>
      <div className="surface-card mg-filters">
        <div className="mg-filters-hd">
          <span className="mg-filters-title">
            <span className="material-symbols-outlined">filter_alt</span>{" "}
            Filters
          </span>
          <button
            className="mg-clear"
            onClick={() => {
              setSearch("");
              setStage("");
              setMedium("");
              setStatus("");
              setPage(1);
            }}
          >
            <span className="material-symbols-outlined">restart_alt</span> Clear
          </button>
        </div>
        <div className="mg-filters-grid cols-4">
          <label>
            Search
            <input
              className="form-control"
              placeholder="Search classes…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label>
            Stage
            <select
              className="form-select"
              value={stage}
              onChange={(e) => {
                setStage(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Stages</option>
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="high-school">High School</option>
            </select>
          </label>
          <label>
            Medium
            <select
              className="form-select"
              value={medium}
              onChange={(e) => {
                setMedium(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Mediums</option>
              <option value="english">English</option>
              <option value="french">French</option>
            </select>
          </label>
        </div>
      </div>
      <div className="surface-card mg-tablecard">
        <div className="mg-toolbar">
          <div className="mg-exports">
            <button
              className="mg-exp mg-exp-csv"
              onClick={() =>
                csvExport(
                  "classes.csv",
                  [
                    "Class",
                    "Section",
                    "Grade",
                    "Code",
                    "Stage",
                    "Medium",
                    "Teacher",
                    "Enrolled",
                    "Capacity",
                    "Room",
                    "Status",
                  ],
                  rows,
                  (r) => [
                    r.class,
                    r.section,
                    r.grade,
                    r.code,
                    r.stage,
                    r.medium,
                    r.class_teacher,
                    r.enrolled,
                    r.capacity,
                    r.room,
                    r.status,
                  ],
                )
              }
            >
              <span className="material-symbols-outlined">table_view</span> CSV
            </button>
            <button
              className="mg-exp mg-exp-pdf"
              onClick={() =>
                printRows(
                  "Classes & Sections",
                  ["Class", "Section", "Code", "Teacher", "Capacity", "Status"],
                  rows,
                  (r) => [
                    r.class,
                    r.section,
                    r.code,
                    r.class_teacher,
                    `${r.enrolled}/${r.capacity}`,
                    r.status,
                  ],
                )
              }
            >
              <span className="material-symbols-outlined">picture_as_pdf</span>{" "}
              PDF
            </button>
            <button
              className="mg-exp mg-exp-print"
              onClick={() =>
                printRows(
                  "Classes & Sections",
                  ["Class", "Section", "Code", "Teacher", "Capacity", "Status"],
                  rows,
                  (r) => [
                    r.class,
                    r.section,
                    r.code,
                    r.class_teacher,
                    `${r.enrolled}/${r.capacity}`,
                    r.status,
                  ],
                )
              }
            >
              <span className="material-symbols-outlined">print</span> PRINT
            </button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table mg-table align-middle mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Class</th>
                <th>Section</th>
                <th className="text-center">Grade</th>
                <th>Code</th>
                <th>Academic Year</th>
                <th>Stage</th>
                <th>Medium</th>
                <th>Class Teacher</th>
                <th>Capacity</th>
                <th>Room</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={13} className="state-cell">
                    Loading…
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={13} className="state-cell text-danger">
                    Couldn't load classes.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && rows.length === 0 && (
                <tr>
                  <td colSpan={13} className="state-cell">
                    No classes match.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="text-secondary">{r.id}</td>
                  <td className="fw-semibold" style={{ fontSize: 13.5 }}>
                    {r.class}
                  </td>
                  <td>
                    <span className="mg-chip mg-chip-amber">{r.section}</span>
                  </td>
                  <td className="text-center text-secondary">{r.grade}</td>
                  <td>
                    <span className="mg-chip mg-chip-gray">{r.code}</span>
                  </td>
                  <td className="text-secondary" style={{ fontSize: 12 }}>
                    {r.academic_year ?? "—"}
                  </td>
                  <td>
                    <span
                      className={`mg-chip ${STAGE_TONE[r.stage] ?? "mg-chip-gray"}`}
                      style={{ textTransform: "uppercase" }}
                    >
                      {r.stage}
                    </span>
                  </td>
                  <td
                    className="text-secondary"
                    style={{ textTransform: "capitalize", fontSize: 12.5 }}
                  >
                    {r.medium}
                  </td>
                  <td style={{ fontSize: 12.5 }}>
                    {r.class_teacher ? (
                      <span>
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: 13,
                            verticalAlign: "-2px",
                            color: "var(--primary)",
                          }}
                        >
                          person
                        </span>{" "}
                        {r.class_teacher}
                      </span>
                    ) : (
                      <span className="text-secondary fst-italic">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td>{capBar(r)}</td>
                  <td className="text-secondary" style={{ fontSize: 12.5 }}>
                    {r.room || "—"}
                  </td>
                  <td>
                    <span
                      className={`mg-status ${r.status === "active" ? "mg-status-green" : "mg-status-gray"}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <div className="mg-actions justify-content-center">
                      <button
                        title="Edit"
                        className="edit"
                        onClick={() => setEditing(r)}
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        title="Delete"
                        className="del"
                        onClick={() => remove(r)}
                      >
                        <span className="material-symbols-outlined">
                          delete
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager meta={data} setPage={setPage} unit="entries" />
      </div>
      {editing && (
        <SectionForm initial={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function SectionForm({ initial, onClose }) {
  const save = useSaveSection();
  const { data: classesData } = useClasses();

  const classes = classesData?.data ?? [];
  const { data: staffData } = useStaff({ category: "teaching", per_page: 200 });
  const staff = staffData?.data ?? [];
  // For edit rows (from the list) we only have display fields; map what we can.
  const [form, setForm] = useState({
    ...BLANK,
    id: initial.id,
    school_class_id: initial.school_class_id || "",
    name: initial.section || initial.name || "",
    capacity: initial.capacity ?? 40,
    stage: initial.stage ?? "secondary",
    medium: initial.medium ?? "english",
    room: initial.room ?? "",
    status: initial.status ?? "active",
    class_teacher_id: initial.class_teacher_id || "",
  });
  const [errors, setErrors] = useState({});
  const isEdit = !!initial.id;
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const submit = async () => {
    setErrors({});
    try {
      await save.mutateAsync(form);
      toast.success(isEdit ? "Section updated" : "Section added");
      onClose();
    } catch (err) {
      setErrors(err.fieldErrors ?? {});
      if (!err.fieldErrors) toast.error("Could not save.");
    }
  };
  return (
    <Modal
      title={isEdit ? "Edit section" : "New class / section"}
      onClose={onClose}
      size="modal-lg"
      footer={
        <>
          <button className="btn btn-light" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={save.isPending}
          >
            {save.isPending ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <div className="row">
        <div className="col-md-6">
          <Field label="Class" required error={errors.school_class_id}>
            <select
              className="form-select"
              value={form.school_class_id}
              onChange={set("school_class_id")}
            >
              <option value="">Select class…</option>
              {(classes ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="col-md-6">
          <Field label="Section name" required error={errors.name}>
            <input
              className="form-control"
              placeholder="A / B / Science"
              value={form.name}
              onChange={set("name")}
            />
          </Field>
        </div>
        <div className="col-md-4">
          <Field label="Capacity" error={errors.capacity}>
            <input
              type="number"
              className="form-control"
              value={form.capacity}
              onChange={set("capacity")}
            />
          </Field>
        </div>
        <div className="col-md-4">
          <Field label="Stage">
            <select
              className="form-select"
              value={form.stage}
              onChange={set("stage")}
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="high-school">High School</option>
            </select>
          </Field>
        </div>
        <div className="col-md-4">
          <Field label="Medium">
            <select
              className="form-select"
              value={form.medium}
              onChange={set("medium")}
            >
              <option value="english">English</option>
              <option value="french">French</option>
            </select>
          </Field>
        </div>
        <div className="col-md-4">
          <Field label="Room">
            <input
              className="form-control"
              value={form.room ?? ""}
              onChange={set("room")}
            />
          </Field>
        </div>
        <div className="col-md-4">
          <Field label="Status">
            <select
              className="form-select"
              value={form.status}
              onChange={set("status")}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </div>
        <div className="col-md-4">
          <Field label="Class teacher">
            <select
              className="form-select"
              value={form.class_teacher_id ?? ""}
              onChange={set("class_teacher_id")}
            >
              <option value="">Unassigned</option>
              {staff.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
