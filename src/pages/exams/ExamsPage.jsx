// src/pages/exams/ExamsPage.jsx

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useExams, useExamsMeta, useSaveExam, useDeleteExam } from "../../api/exams";
import { useAcademicYears } from "../../api/academic";
import { confirmDelete, swalInfo } from "../../lib/alerts";
import { Modal, Field, useDebounced } from "../../components/ui";
import { Pager, csvExport, printRows } from "../admin/_shell";
import { useAuth } from "../../context/AuthContext";
import client from "../../api/client";
import "../../styles/mgmt.css";

const TABS = [
  { key: "", label: "All", tone: "dark", countKey: "all" },
  { key: "published", label: "Published", tone: "green", countKey: "published" },
  { key: "planned", label: "Draft", tone: "amber", countKey: "draft" },
];
const ST = { published: ["Published", "mg-status-green"], ongoing: ["Ongoing", "mg-status-blue"], planned: ["Draft", "mg-status-amber"], locked: ["Locked", "mg-status-red"] };
const TYPE_TONE = { formative: "mg-chip-blue", summative: "mg-chip-purple", final: "mg-chip-red" };
const BLANK = { term_id: "", name: "", exam_code: "", exam_type: "summative", max_score: 20, starts_on: "", ends_on: "", duration_minutes: 60, lock_date: "", status: "planned", description: "" };

export default function ExamsPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  
  // ── Helper function for role checking ──
  const hasAnyRole = (roles = []) => {
    if (!user?.roles) return false;
    return user.roles.some(role => roles.includes(role.name));
  };

  // ── Role checks ──
  const isAdmin = hasAnyRole(['super-admin', 'principal', 'vice-principal']);
  const isPrincipal = hasAnyRole(['super-admin', 'principal']);
  const canDelete = hasAnyRole(['super-admin', 'principal']);
  const canPublish = hasAnyRole(['super-admin', 'principal']);
  const canEdit = hasAnyRole(['super-admin', 'principal', 'vice-principal']);

  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const debounced = useDebounced(search);

  const { data: meta } = useExamsMeta();
  const { data, isLoading, isError, isFetching } = useExams({ 
    status: status || undefined, 
    search: debounced || undefined, 
    exam_type: type || undefined, 
    page 
  });
  const del = useDeleteExam();
  const rows = data?.data ?? [];
  const m = data?.meta;

  const remove = async (r) => { 
    if (!canDelete) {
      toast.error("Only the Principal can delete exams.");
      return;
    }
    if (!(await confirmDelete({ title: "Delete exam?", text: r.name, confirmText: "Delete" }))) return; 
    try { 
      await del.mutateAsync(r.id); 
      toast.success("Exam removed"); 
    } catch { 
      toast.error("Permission denied."); 
    } 
  };
  
  const view = (r) => swalInfo(r.name, `Code: ${r.exam_code ?? "—"}\nType: ${r.exam_type}\nMax score: ${r.max_score}\nStart: ${r.starts_on ?? "—"}\nEnd: ${r.ends_on ?? "—"}\nDuration: ${r.duration_minutes ?? "—"} min\nLock: ${r.lock_date ?? "—"}\nStatus: ${r.status}`);
  const dur = (mins) => mins ? (mins >= 60 ? `${Math.floor(mins / 60)}h${mins % 60 ? " " + (mins % 60) + "m" : ""}` : `${mins}m`) : "—";

  const handlePublish = async (exam) => {
    if (!canPublish) {
      toast.error("Only the Principal can publish exams.");
      return;
    }
    try {
      await client.post(`/exams/${exam.id}/publish`);
      toast.success("Exam published successfully!");
      // Refresh data - this will happen via react-query invalidation
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to publish exam.";
      toast.error(msg);
    }
  };

  return (
    <div className="mg-page">
      <div className="mg-head">
        <div>
          <div className="mg-title">
            <span className="material-symbols-outlined">assignment</span>
            <h1>Exams Management</h1>
          </div>
          <div className="mg-crumb">
            CCAST Bambili <span className="material-symbols-outlined">chevron_right</span> Academic 
            {isFetching && <span className="mg-sync"><span className="material-symbols-outlined">sync</span> syncing…</span>}
          </div>
        </div>
        {isAdmin && (
          <button className="mg-add" onClick={() => setEditing(BLANK)}>
            <span className="material-symbols-outlined">add</span> Add Exam
          </button>
        )}
      </div>
      
      <div className="mg-tabs">
        {TABS.map((t) => (
          <button 
            key={t.key || "all"} 
            className={`mg-tab mg-tab-${t.tone} ${status === t.key ? "active" : ""}`} 
            onClick={() => { setStatus(t.key); setPage(1); }}
          >
            {t.label} ({meta?.counts?.[t.countKey] ?? 0})
          </button>
        ))}
      </div>
      
      <div className="surface-card mg-filters">
        <div className="mg-filters-hd">
          <span className="mg-filters-title">
            <span className="material-symbols-outlined">filter_alt</span> Filter Records
          </span>
          <button className="mg-clear" onClick={() => { setSearch(""); setType(""); setStatus(""); setPage(1); }}>
            <span className="material-symbols-outlined">restart_alt</span> Clear Filters
          </button>
        </div>
        <div className="mg-filters-grid cols-4">
          <label>
            Search Examination
            <input 
              className="form-control" 
              placeholder="Search exams…" 
              value={search} 
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
            />
          </label>
          <label>
            Exam Type
            <select 
              className="form-select" 
              value={type} 
              onChange={(e) => { setType(e.target.value); setPage(1); }}
            >
              <option value="">All Types</option>
              <option value="formative">Formative</option>
              <option value="summative">Summative</option>
              <option value="final">Final</option>
            </select>
          </label>
        </div>
      </div>
      
      <div className="surface-card mg-tablecard">
        <div className="mg-toolbar">
          <div className="mg-exports">
            <button 
              className="mg-exp mg-exp-csv" 
              onClick={() => csvExport("exams.csv", ["ID", "Name", "Code", "Type", "Start", "End", "Duration", "Lock", "Status"], rows, (r) => [r.id, r.name, r.exam_code, r.exam_type, r.starts_on, r.ends_on, r.duration_minutes, r.lock_date, r.status])}
            >
              <span className="material-symbols-outlined">table_view</span> CSV
            </button>
            <button 
              className="mg-exp mg-exp-pdf" 
              onClick={() => printRows("Exams", ["ID", "Name", "Code", "Start", "End", "Status"], rows, (r) => [r.id, r.name, r.exam_code, r.starts_on, r.ends_on, r.status])}
            >
              <span className="material-symbols-outlined">picture_as_pdf</span> PDF
            </button>
            <button 
              className="mg-exp mg-exp-print" 
              onClick={() => printRows("Exams", ["ID", "Name", "Code", "Start", "End", "Status"], rows, (r) => [r.id, r.name, r.exam_code, r.starts_on, r.ends_on, r.status])}
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
                <th>Exam Name</th>
                <th>Code</th>
                <th>Type</th>
                <th>Start Date</th>
                <th>Duration</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Lock Date</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={10} className="state-cell">Loading…</td></tr>}
              {isError && <tr><td colSpan={10} className="state-cell text-danger">Couldn't load exams.</td></tr>}
              {!isLoading && !isError && rows.length === 0 && <tr><td colSpan={10} className="state-cell">No exams match.</td></tr>}
              {rows.map((r) => {
                const [sl, sc] = ST[r.status] ?? [r.status, "mg-status-gray"];
                const isLocked = r.status === 'locked';
                const isPublished = r.status === 'published';
                
                return (
                  <tr key={r.id}>
                    <td className="text-secondary">{r.id}</td>
                    <td>
                      <div className="fw-semibold" style={{ fontSize: 13.5 }}>{r.name}</div>
                      <div>
                        <span className={`mg-chip ${TYPE_TONE[r.exam_type] ?? "mg-chip-gray"}`} style={{ textTransform: "uppercase", fontSize: 10 }}>
                          {r.exam_type}
                        </span>
                      </div>
                    </td>
                    <td><span className="mg-id">{r.exam_code ?? "—"}</span></td>
                    <td className="text-secondary" style={{ fontSize: 12.5 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: "-2px" }}>groups</span> All
                    </td>
                    <td className="text-secondary" style={{ fontSize: 12.5 }}>{r.starts_on ?? "—"}</td>
                    <td className="text-secondary" style={{ fontSize: 12.5 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: "-2px" }}>schedule</span> {dur(r.duration_minutes)}
                    </td>
                    <td className="text-secondary" style={{ fontSize: 12.5 }}>{r.ends_on ?? "—"}</td>
                    <td><span className={`mg-status ${sc}`}>{sl}</span></td>
                    <td className="text-secondary" style={{ fontSize: 12 }}>
                      {r.lock_date ?? <span className="fst-italic">Pending</span>}
                    </td>
                    <td>
                      <div className="mg-actions justify-content-center">
                        {!isLocked && !isPublished && (
                          <button title="Enter marks" onClick={() => nav("/marks")}>
                            <span className="material-symbols-outlined">edit_note</span>
                          </button>
                        )}
                        <button title="View" onClick={() => view(r)}>
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        {canEdit && !isLocked && !isPublished && (
                          <button title="Edit" className="edit" onClick={() => setEditing(r)}>
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                        )}
                        {canPublish && !isPublished && !isLocked && (
                          <button title="Publish" className="publish" onClick={() => handlePublish(r)}>
                            <span className="material-symbols-outlined">publish</span>
                          </button>
                        )}
                        {canDelete && !isPublished && (
                          <button title="Delete" className="del" onClick={() => remove(r)}>
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pager meta={m} setPage={setPage} unit="exams" />
      </div>
      
      {editing && <ExamForm initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

// ── Exam Form Component ──
function ExamForm({ initial, onClose }) {
  const { user } = useAuth();
  const save = useSaveExam();
  const { data: yearsData } = useAcademicYears();
  
  // ── Helper function for role checking ──
  const hasAnyRole = (roles = []) => {
    if (!user?.roles) return false;
    return user.roles.some(role => roles.includes(role.name));
  };

  const isAdmin = hasAnyRole(['super-admin', 'principal', 'vice-principal']);
  const isPrincipal = hasAnyRole(['super-admin', 'principal']);
  
  const years = useMemo(() => {
    if (!yearsData) return [];
    if (Array.isArray(yearsData)) return yearsData;
    if (yearsData.data && Array.isArray(yearsData.data)) return yearsData.data;
    if (yearsData.items && Array.isArray(yearsData.items)) return yearsData.items;
    return [];
  }, [yearsData]);

  const terms = useMemo(() => {
    return years.flatMap((y) => {
      const termArray = Array.isArray(y.terms) ? y.terms : [];
      return termArray.map((t) => ({
        id: t.id,
        label: `${t.name} — ${y.name || 'N/A'}`
      }));
    });
  }, [years]);

  const [form, setForm] = useState({ 
    ...BLANK, 
    ...initial, 
    term_id: initial.term_id || initial.term?.id || "" 
  });
  const [errors, setErrors] = useState({});
  const isEdit = !!initial.id;

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  
  const submit = async () => { 
    setErrors({}); 
    try { 
      await save.mutateAsync(form); 
      toast.success(isEdit ? "Exam updated" : "Exam added"); 
      onClose(); 
    } catch (err) { 
      setErrors(err.fieldErrors ?? {}); 
      if (!err.fieldErrors) toast.error("Could not save."); 
    } 
  };
  
  // Only admins can create/edit exams
  if (!isAdmin) {
    return (
      <Modal title="Access Denied" onClose={onClose} size="modal-lg">
        <p>You do not have permission to manage exams.</p>
      </Modal>
    );
  }

  return (
    <Modal 
      title={isEdit ? "Edit exam" : "New exam"} 
      onClose={onClose} 
      size="modal-lg"
      footer={
        <>
          <button className="btn btn-light" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <div className="row">
        <div className="col-md-6">
          <Field label="Term" required error={errors.term_id}>
            <select className="form-select" value={form.term_id} onChange={set("term_id")}>
              <option value="">Select term…</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="col-md-6">
          <Field label="Name" required error={errors.name}>
            <input className="form-control" value={form.name} onChange={set("name")} />
          </Field>
        </div>
        <div className="col-md-4">
          <Field label="Exam code">
            <input className="form-control" value={form.exam_code ?? ""} onChange={set("exam_code")} />
          </Field>
        </div>
        <div className="col-md-4">
          <Field label="Type">
            <select className="form-select" value={form.exam_type} onChange={set("exam_type")}>
              <option value="formative">Formative</option>
              <option value="summative">Summative</option>
              <option value="final">Final</option>
            </select>
          </Field>
        </div>
        <div className="col-md-4">
          <Field label="Status">
            <select className="form-select" value={form.status} onChange={set("status")}>
              <option value="planned">Draft</option>
              <option value="ongoing">Ongoing</option>
            </select>
          </Field>
        </div>
        <div className="col-md-3">
          <Field label="Max score" error={errors.max_score}>
            <input type="number" className="form-control" value={form.max_score} onChange={set("max_score")} />
          </Field>
        </div>
        <div className="col-md-3">
          <Field label="Start">
            <input type="date" className="form-control" value={form.starts_on ?? ""} onChange={set("starts_on")} />
          </Field>
        </div>
        <div className="col-md-3">
          <Field label="End">
            <input type="date" className="form-control" value={form.ends_on ?? ""} onChange={set("ends_on")} />
          </Field>
        </div>
        <div className="col-md-3">
          <Field label="Duration (min)">
            <input type="number" className="form-control" value={form.duration_minutes ?? ""} onChange={set("duration_minutes")} />
          </Field>
        </div>
        <div className="col-md-4">
          <Field label="Lock date">
            <input type="date" className="form-control" value={form.lock_date ?? ""} onChange={set("lock_date")} />
          </Field>
        </div>
        <div className="col-md-8">
          <Field label="Description">
            <textarea className="form-control" value={form.description ?? ""} onChange={set("description")} rows="2" />
          </Field>
        </div>
      </div>
    </Modal>
  );
}