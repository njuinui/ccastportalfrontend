import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useExams } from "../../api/exams";
import { useSubjects } from "../../api/subjects";
import { useClasses } from "../../api/academic";
import { useMarkGrid, useSaveMarks } from "../../api/marks";
import { Modal, useDebounced } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import client from "../../api/client";
import "../../styles/mgmt.css";

const ST = { 
  published: ["Published", "mg-status-green"], 
  ongoing: ["Ongoing", "mg-status-blue"], 
  planned: ["Draft", "mg-status-amber"], 
  locked: ["Locked", "mg-status-red"] 
};

export default function MarksPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [entry, setEntry] = useState(null);
  const debounced = useDebounced(search);
  const { data: examsData, isLoading, isError, isFetching } = useExams();
  const exams = examsData?.data ?? [];

  // Role checks
  const isTeacher = user?.hasRole('teacher');
  const isBursar = user?.hasRole('bursar');
  const isAdmin = user?.hasAnyRole(['super-admin', 'principal', 'vice-principal']);
  
  // Bursar can only view, not enter marks
  const canEnterMarks = !isBursar && (isAdmin || isTeacher);
  const canViewResults = true; // Everyone with access can view

  // Teachers only see exams they can enter marks for
  // Bursar sees all exams (read-only)
  const filtered = exams.filter((e) =>
    (!debounced || e.name.toLowerCase().includes(debounced.toLowerCase())) &&
    (!status || e.status === status)
  );

  const handleViewMarks = (exam) => {
    // Bursar can view marks (read-only)
    // Teachers can view marks
    // Admins can view marks
    setEntry(exam);
  };

  const handleEnterMarks = (exam) => {
    if (!canEnterMarks) {
      toast.error("You do not have permission to enter marks.");
      return;
    }
    
    if (exam.status === 'locked') {
      toast.error("This exam is locked. Marks cannot be entered.");
      return;
    }
    
    setEntry(exam);
  };

  // Determine if user can enter marks for this exam
  const canEnterMarksForExam = (exam) => {
    if (!canEnterMarks) return false;
    if (exam.status === 'locked') return false;
    if (exam.status === 'published' && !isAdmin) return false;
    return true;
  };

  return (
    <div className="mg-page">
      <div className="mg-head">
        <div>
          <div className="mg-title">
            <span className="material-symbols-outlined">grading</span>
            <h1>{isBursar ? 'Exam Results (View Only)' : 'Results / Marks Entry'}</h1>
          </div>
          <div className="mg-crumb">
            CCAST Bambili <span className="material-symbols-outlined">chevron_right</span> Academic 
            {isFetching && <span className="mg-sync"><span className="material-symbols-outlined">sync</span> syncing…</span>}
            {isBursar && <span className="ms-2 badge bg-info">🔍 Read-Only Mode</span>}
          </div>
        </div>
      </div>

      <div className="surface-card mg-filters">
        <div className="mg-filters-hd">
          <span className="mg-filters-title">
            <span className="material-symbols-outlined">filter_alt</span> Filter Records
          </span>
          <button className="mg-clear" onClick={() => { setSearch(""); setStatus(""); }}>
            <span className="material-symbols-outlined">restart_alt</span> Clear Filters
          </button>
        </div>
        <div className="mg-filters-grid cols-4">
          <label>Search Examination
            <input className="form-control" placeholder="Search exams…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <label>Status
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="ongoing">Ongoing</option>
              <option value="planned">Draft</option>
              <option value="locked">Locked</option>
            </select>
          </label>
        </div>
      </div>

      <div className="surface-card mg-tablecard">
        <div style={{ 
          background: isBursar ? "#1e3a5f" : "#14245e", 
          color: "#fff", 
          padding: "14px 18px", 
          display: "flex", 
          justifyContent: "space-between", 
          fontWeight: 700, 
          fontSize: 12, 
          textTransform: "uppercase", 
          letterSpacing: ".05em" 
        }}>
          <span>Examination Detail</span>
          <span>{isBursar ? 'View Results' : 'Action'}</span>
        </div>
        <div>
          {isLoading && <div className="state-cell p-4">Loading examinations…</div>}
          {isError && <div className="state-cell p-4 text-danger">Couldn't load exams.</div>}
          {!isLoading && filtered.length === 0 && <div className="state-cell p-4">No examinations available.</div>}
          {filtered.map((e) => {
            const [sl, sc] = ST[e.status] ?? [e.status, "mg-status-gray"];
            const isLocked = e.status === 'locked';
            const canEnter = canEnterMarksForExam(e);
            
            return (
              <div key={e.id} className="d-flex align-items-center justify-content-between" style={{ 
                padding: "16px 18px", 
                borderBottom: "1px solid #eef1f7", 
                borderLeft: `4px solid ${e.status === "published" ? "#16a34a" : e.status === "planned" ? "#f59e0b" : e.status === "locked" ? "#dc2626" : "#3b82f6"}` 
              }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="mg-avatar" style={{ borderRadius: 10, background: "var(--primary)" }}>
                    <span className="material-symbols-outlined">description</span>
                  </div>
                  <div>
                    <div className="fw-semibold" style={{ fontSize: 14 }}>
                      {e.name} 
                      <span className="mg-chip mg-chip-gray" style={{ marginLeft: 6 }}>max {e.max_score}</span>
                    </div>
                    <div className="mg-sub">
                      <span className="material-symbols-outlined" style={{ fontSize: 13, verticalAlign: "-2px" }}>calendar_month</span> 
                      {e.starts_on ?? "—"}{e.ends_on ? ` – ${e.ends_on}` : ""}
                    </div>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <span className={`mg-status ${sc}`}>{sl}</span>
                  
                  {/* Bursar: View Only */}
                  {isBursar && (
                    <button className="btn btn-outline-primary btn-sm" onClick={() => handleViewMarks(e)}>
                      <span className="material-symbols-outlined">visibility</span> View Results
                    </button>
                  )}
                  
                  {/* Teacher/Admin: Can enter marks */}
                  {!isBursar && !isLocked && canEnter && (
                    <button className="mg-add" style={{ padding: "9px 16px" }} onClick={() => handleEnterMarks(e)}>
                      <span className="material-symbols-outlined">edit_note</span> Enter Marks
                    </button>
                  )}
                  
                  {/* Teacher/Admin: Can view results even if locked */}
                  {!isBursar && (isLocked || !canEnter) && (
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => handleViewMarks(e)}>
                      <span className="material-symbols-outlined">visibility</span> View Results
                    </button>
                  )}
                  
                  {isLocked && !isBursar && (
                    <span className="text-danger small fw-bold ms-2">🔒 Locked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mg-foot">
          <span className="lbl">Showing {filtered.length} of {exams.length} examinations</span>
          {isBursar && (
            <span className="ms-3 text-muted small">
              <i className="bi bi-info-circle"></i> You are in read-only mode
            </span>
          )}
        </div>
      </div>

      {entry && <MarkViewModal exam={entry} onClose={() => setEntry(null)} isReadOnly={isBursar} />}
    </div>
  );
}

// ── Mark View Modal (Read-Only for Bursar) ──
function MarkViewModal({ exam, onClose, isReadOnly = false }) {
  const { user } = useAuth();
  const { data: subjectsData } = useSubjects({ per_page: 1000 });
  const { data: classesData } = useClasses();
  const subjects = subjectsData?.data ?? [];
  const sections = useMemo(() => (classesData ?? classesData?.data ?? []).flatMap?.((c) => (c.sections ?? []).map((s) => ({ id: s.id, label: `${c.name} ${s.name}` }))) ?? [], [classesData]);
  const [sel, setSel] = useState({ subject_id: "", section_id: "" });
  const ready = !!(sel.subject_id && sel.section_id);
  const { data, isFetching } = useMarkGrid({ exam_id: exam.id, subject_id: sel.subject_id, section_id: sel.section_id }, ready);
  const save = useSaveMarks();
  const [rows, setRows] = useState([]);
  const maxScore = exam.max_score ?? 20;
  
  useEffect(() => { if (data?.rows) setRows(data.rows); }, [data]);
  
  const setScore = (id, v) => setRows((r) => r.map((row) => row.student_id === id ? { ...row, score: v === "" ? null : Number(v) } : row));
  const invalid = rows.some((r) => r.score != null && (r.score < 0 || r.score > maxScore));

  const submit = async () => {
    if (isReadOnly) {
      toast.error("You are in read-only mode.");
      return;
    }
    
    if (invalid) return toast.error(`Scores must be 0–${maxScore}.`);
    try {
      await save.mutateAsync({ exam_id: exam.id, subject_id: Number(sel.subject_id), marks: rows.map((r) => ({ student_id: r.student_id, score: r.score })) });
      toast.success("Marks saved"); onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || "Could not save marks.";
      toast.error(msg);
    }
  };

  return (
    <Modal 
      title={`${isReadOnly ? 'View' : 'Enter'} Marks — ${exam.name}`} 
      onClose={onClose} 
      size="modal-lg"
      footer={
        <div className="d-flex justify-content-between w-100">
          <div>
            {isReadOnly && (
              <span className="text-muted small">
                <i className="bi bi-eye"></i> Read-Only Mode
              </span>
            )}
          </div>
          <div>
            <button className="btn btn-light me-2" onClick={onClose}>Close</button>
            {!isReadOnly && (
              <button className="btn btn-primary" onClick={submit} disabled={!ready || save.isPending || invalid}>
                {save.isPending ? "Saving…" : "Save marks"}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label small fw-semibold">Section</label>
          <select 
            className="form-select" 
            value={sel.section_id} 
            onChange={(e) => setSel((s) => ({ ...s, section_id: e.target.value }))}
            disabled={isReadOnly}
          >
            <option value="">Select section…</option>
            {sections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-semibold">Subject</label>
          <select 
            className="form-select" 
            value={sel.subject_id} 
            onChange={(e) => setSel((s) => ({ ...s, subject_id: e.target.value }))}
            disabled={isReadOnly}
          >
            <option value="">Select subject…</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      
      {!ready && <p className="text-secondary small">Pick a section and subject to load the student list.</p>}
      {ready && isFetching && <p className="text-secondary small">Loading students…</p>}
      {ready && rows.length > 0 && (
        <div className="table-responsive" style={{ maxHeight: 360, overflowY: "auto" }}>
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>Student</th>
                <th style={{ width: 140 }}>
                  Score / {maxScore}
                  {isReadOnly && <span className="ms-1 text-muted small">(read-only)</span>}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.student_id}>
                  <td>{r.full_name ?? r.student_name ?? `#${r.student_id}`}</td>
                  <td>
                    {isReadOnly ? (
                      <span className="fw-bold">{r.score ?? '—'}</span>
                    ) : (
                      <input 
                        type="number" 
                        className="form-control form-control-sm" 
                        value={r.score ?? ""} 
                        min={0} 
                        max={maxScore} 
                        onChange={(e) => setScore(r.student_id, e.target.value)} 
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {ready && !isFetching && rows.length === 0 && <p className="text-secondary small">No students enrolled in this section.</p>}
      
      {isReadOnly && (
        <div className="alert alert-info mt-2 mb-0">
          <i className="bi bi-info-circle me-2"></i>
          You are viewing marks in <strong>read-only mode</strong>. No changes can be made.
        </div>
      )}
    </Modal>
  );
}