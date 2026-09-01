import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import {
  useAdmissions,
  useAdmissionsMeta,
  useUpdateAdmission,
  useCreateAdmission,
  useDeleteAdmission,
  useAdmission,
  useAdmitStudent,
} from "../../api/admissions";
import { confirmDelete, confirmAction } from "../../lib/alerts";
import { initials, Modal, Field, useDebounced } from "../../components/ui";
import { Pager, csvExport, printRows } from "../admin/_shell";
import "../../styles/mgmt.css";
import "./AdmissionManagement.css";

/* ══════════════════════ CONSTANTS ══════════════════════ */
const ST = {
  accepted: ["Admitted", "mg-status-green"],
  pending: ["Pending", "mg-status-amber"],
  reviewing: ["In Review", "mg-status-blue"],
  rejected: ["Rejected", "mg-status-red"],
};
const TYPE_TONE = { new: "mg-chip-gray", transfer: "mg-chip-blue" };
const BORDER_MAP = {
  accepted: "border-green",
  rejected: "border-red",
  pending: "border-amber",
  reviewing: "border-blue",
};

// 🔴 Auto-generate academic year (only current year)
const getCurrentAcademicYear = () => {
  const currentYear = new Date().getFullYear();
  return `${currentYear}/${currentYear + 1}`; // e.g., "2026/2027"
};

const CURRENT_ACADEMIC_YEAR = getCurrentAcademicYear();

const BLANK = {
  student_first_name: "",
  student_last_name: "",
  student_gender: "female",
  academic_year: CURRENT_ACADEMIC_YEAR, // 🔴 Auto-set to current year
  class_applying_for: "",
  previous_school: "",
  guardian_name: "",
  guardian_phone: "",
  email: "",
  phone: "",
};

const MONTH_DATA = [
  { label: "Jan", value: 45 }, { label: "Feb", value: 62 }, { label: "Mar", value: 89 },
  { label: "Apr", value: 78 }, { label: "May", value: 95 }, { label: "Jun", value: 110 },
  { label: "Jul", value: 130 }, { label: "Aug", value: 85 }, { label: "Sep", value: 42 },
  { label: "Oct", value: 38 }, { label: "Nov", value: 25 }, { label: "Dec", value: 18 },
];
const GRADE_DATA = [
  { label: "Form 1", value: 280, color: "#3b82f6" },
  { label: "Form 2", value: 240, color: "#6366f1" },
  { label: "Form 3", value: 210, color: "#8b5cf6" },
  { label: "Form 4", value: 180, color: "#a855f7" },
  { label: "Form 5", value: 165, color: "#c084fc" },
  { label: "L6", value: 95, color: "#d8b4fe" },
  { label: "U6", value: 70, color: "#e9d5ff" },
];
const REVIEWERS = ["Mrs. Nkeng", "Mr. Tabi", "Ms. Foni", "Dr. Ashu"];
const SAVED_FILTERS = [
  { key: "", label: "All Applications", icon: "apps" },
  { key: "sf-pending", label: "Pending Review", icon: "hourglass_top", preset: { status: "pending" } },
  { key: "sf-today", label: "Submitted Today", icon: "today", preset: { submittedToday: true } },
  { key: "sf-transfer", label: "Transfer Students", icon: "swap_horiz", preset: { type: "transfer" } },
  { key: "sf-incomplete", label: "Incomplete Docs", icon: "error_outline", preset: { missingDocs: true } },
];

const ALL_COLS = [
  { key: "photo", label: "Applicant", w: 220 },
  { key: "appNum", label: "Application #", w: 110 },
  { key: "grade", label: "Grade", w: 75 },
  { key: "gender", label: "Gender", w: 70 },
  { key: "date", label: "Date Applied", w: 90 },
  { key: "type", label: "Type", w: 75 },
  { key: "guardian", label: "Guardian", w: 130 },
  { key: "status", label: "Status", w: 100 },
  { key: "score", label: "Score", w: 60 },
  { key: "actions", label: "Actions", w: 120 },
];
const DEFAULT_VISIBLE = ["photo", "appNum", "grade", "gender", "date", "type", "status", "actions"];

/* Full document set the backend returns via show() -> documents */
const ALL_DOC_FIELDS = [
  { key: "student_photo", label: "Student Photo", icon: "photo_camera" },
  { key: "guardian_photo", label: "Guardian Photo", icon: "photo_camera" },
  { key: "birth_certificate", label: "Birth Certificate", icon: "description" },
  { key: "previous_report_card", label: "Report Card", icon: "assessment" },
  { key: "medical_report", label: "Medical Report", icon: "medical_information" },
  { key: "passport_photo", label: "Passport Photo", icon: "badge" },
  { key: "previous_school_certificate", label: "Prev. School Cert.", icon: "school" },
  { key: "transfer_certificate", label: "Transfer Cert.", icon: "swap_horiz" },
  { key: "parent_id_document", label: "Parent ID", icon: "badge" },
  { key: "guardian_id_document", label: "Guardian ID", icon: "badge" },
  { key: "admission_letter", label: "Admission Letter", icon: "mail" },
  { key: "half_card", label: "Half Card", icon: "badge" },
  { key: "other_files", label: "Other Files", icon: "attach_file" },
];

/* ══════════════════════ HOOKS ══════════════════════ */
function useCountUp(end, duration = 700) {
  const [v, setV] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (end == null) return;
    const start = prev.current;
    const t0 = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setV(Math.round(start + (end - start) * e));
      if (p < 1) requestAnimationFrame(tick);
      else prev.current = end;
    };
    requestAnimationFrame(tick);
  }, [end, duration]);
  return v;
}

/* ══════════════════════ CHART COMPONENTS ══════════════════════ */
function MiniBar({ data, color }) {
  const max = Math.max(...data, 1);
  return (
    <div className="mg-kpi-enh-bar">
      {data.map((v, i) => (
        <div key={i} style={{ height: `${(v / max) * 100}%`, background: color, opacity: i >= data.length - 3 ? 1 : 0.3 }} />
      ))}
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="mg-bar-chart">
      {data.map((d, i) => (
        <div key={i} className="mg-bar-col">
          <span className="mg-bar-val">{d.value}</span>
          <div className="mg-bar" style={{ height: `${(d.value / max) * 120}px`, background: "linear-gradient(to top, #1e3a5f, #3b82f6)" }} />
          <span className="mg-bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data, size = 115 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 40, cx = size / 2, cy = size / 2, C = 2 * Math.PI * r;
  let off = 0;
  return (
    <div className="mg-donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((d, i) => {
          const len = total > 0 ? (d.value / total) * C : 0;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth="18"
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off}
              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "all .8s ease" }} />
          );
          off += len;
          return el;
        })}
        <text x={cx} y={cy - 2} textAnchor="middle" style={{ fontSize: 17, fontWeight: 800, fill: "#0f172a", fontFamily: "inherit" }}>{total}</text>
        <text x={cx} y={cy + 11} textAnchor="middle" style={{ fontSize: 7, fill: "#94a3b8", fontFamily: "inherit", fontWeight: 600, letterSpacing: ".06em" }}>TOTAL</text>
      </svg>
      <div className="mg-donut-legend">
        {data.map((d, i) => (
          <div key={i} className="mg-donut-leg-item">
            <div className="mg-donut-leg-dot" style={{ background: d.color }} />
            <span className="mg-donut-leg-label">{d.label}</span>
            <span className="mg-donut-leg-val">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HBarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="mg-hbar">
      {data.map((d, i) => (
        <div key={i} className="mg-hbar-row">
          <span className="mg-hbar-label">{d.label}</span>
          <div className="mg-hbar-track">
            <div className="mg-hbar-fill" style={{ width: `${(d.value / max) * 100}%`, background: d.color || "linear-gradient(90deg, #1e3a5f, #60a5fa)" }} />
          </div>
          <span className="mg-hbar-val">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

function GenderChart({ male, female }) {
  const total = male + female || 1;
  const mPct = Math.round((male / total) * 100);
  const fPct = 100 - mPct;
  return (
    <div className="mg-gender-wrap">
      <div className="mg-gender-row">
        <span className="mg-gender-label">Male</span>
        <div className="mg-gender-track">
          <div className="mg-gender-fill" style={{ width: `${mPct}%`, background: "#3b82f6" }}>
            <span className="mg-gender-pct">{mPct}%</span>
          </div>
        </div>
        <span className="mg-gender-count">{male}</span>
      </div>
      <div className="mg-gender-row">
        <span className="mg-gender-label">Female</span>
        <div className="mg-gender-track">
          <div className="mg-gender-fill" style={{ width: `${fPct}%`, background: "#ec4899" }}>
            <span className="mg-gender-pct">{fPct}%</span>
          </div>
        </div>
        <span className="mg-gender-count">{female}</span>
      </div>
    </div>
  );
}

/* ══════════════════════ SKELETON ══════════════════════ */
function SkeletonRows({ cols = 8 }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i}>
          <td><div className="mg-skel" style={{ width: 14, height: 14 }} /></td>
          {Array.from({ length: cols - 1 }).map((_, j) => (
            <td key={j}><div className="mg-skel" style={{ width: j === 0 ? 140 : j === 1 ? 90 : 35, height: 13 }} /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ══════════════════════ ADMIT MODAL ══════════════════════ */
function AdmitModal({
  open,
  onClose,
  onAdmit,
  admitData,
  setAdmitData,
  metaData,
  isLoading
}) {
  const [filteredSections, setFilteredSections] = useState([]);

  // 🔴 Generate academic year options (only current year)
  const getAcademicYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return [
      { id: `${currentYear}/${currentYear + 1}`, name: `${currentYear}/${currentYear + 1}`, is_current: true },
    ];
  };

  const academicYearOptions = getAcademicYearOptions();

  // 🔴 Auto-select current academic year when modal opens
  useEffect(() => {
    if (open && !admitData.academic_year_id) {
      const currentYear = new Date().getFullYear();
      const currentAcademicYear = `${currentYear}/${currentYear + 1}`;
      setAdmitData(prev => ({
        ...prev,
        academic_year_id: currentAcademicYear
      }));
    }
  }, [open]);

  useEffect(() => {
    if (admitData.class_id && metaData?.sections) {
      const sections = metaData.sections.filter(
        (s) => s.school_class_id === parseInt(admitData.class_id)
      );
      setFilteredSections(sections);
    } else {
      setFilteredSections([]);
    }
  }, [admitData.class_id, metaData?.sections]);

  if (!open) return null;

  const isFormValid = admitData.class_id && admitData.section_id && admitData.academic_year_id;

  return (
    <Modal
      title="Admit Student"
      onClose={onClose}
      size="modal-lg"
      footer={
        <>
          <button className="btn btn-light" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-success"
            onClick={onAdmit}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Processing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 6 }}>check_circle</span>
                Admit Student
              </>
            )}
          </button>
        </>
      }
    >
      <div className="admit-modal-content">
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '1.5rem'
        }}>
          <p style={{ margin: 0, color: '#166534', fontSize: '14px' }}>
            <strong>ℹ️ Important:</strong> Upon admission, the system will automatically:
          </p>
          <ul style={{ margin: '8px 0 0 20px', color: '#166534', fontSize: '13px' }}>
            <li>Create student, parent, and guardian user accounts</li>
            <li>Generate unique passwords for all parties</li>
            <li>Send login credentials via email and SMS</li>
            <li>Send an official admission letter</li>
            <li>Enroll the student in the selected class and section</li>
          </ul>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">
              Academic Year <span className="text-danger">*</span>
            </label>
            <select
              className="form-select"
              value={admitData.academic_year_id || ''}
              onChange={(e) => setAdmitData({ ...admitData, academic_year_id: e.target.value })}
              required
            >
              <option value="">Select Academic Year</option>
              {academicYearOptions.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name} {year.is_current ? '(Current)' : ''}
                </option>
              ))}
            </select>
            {academicYearOptions.length === 0 && (
              <small className="text-danger">No academic years available</small>
            )}
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">
              Class <span className="text-danger">*</span>
            </label>
            <select
              className="form-select"
              value={admitData.class_id}
              onChange={(e) => setAdmitData({ ...admitData, class_id: e.target.value, section_id: '' })}
              required
            >
              <option value="">Select Class</option>
              {metaData?.school_classes?.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.code})
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">
              Section <span className="text-danger">*</span>
            </label>
            <select
              className="form-select"
              value={admitData.section_id}
              onChange={(e) => setAdmitData({ ...admitData, section_id: e.target.value })}
              required
              disabled={!admitData.class_id}
            >
              <option value="">Select Section</option>
              {filteredSections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
            {!admitData.class_id && (
              <small className="text-muted">Please select a class first</small>
            )}
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">Application</label>
            <div style={{
              background: '#f8fafc',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#475569'
            }}>
              <div><strong>Student:</strong> {admitData.student_name || '—'}</div>
              <div><strong>Application #:</strong> {admitData.application_number || '—'}</div>
            </div>
          </div>
        </div>

        {!isFormValid && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px 16px',
            marginTop: '8px'
          }}>
            <p style={{ margin: 0, color: '#991b1b', fontSize: '13px' }}>
              ⚠️ Please select all required fields (Academic Year, Class, and Section) to admit the student.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ══════════════════════ EXPANDED ROW ══════════════════════ */
function ExpandedRow({ r, onOpenSlideOver, onAdmit, onReject, onDelete }) {
  const [sl, sc] = ST[r.status] ?? [r.status, "mg-status-gray"];
  const docs = [
    { name: "Birth Certificate", has: r.has_birth_cert },
    { name: "Passport Photo", has: r.has_passport },
    { name: "Report Card", has: r.has_report_card },
  ];
  return (
    <td colSpan={99} className="mg-expanded-cell">
      <div className="mg-expanded-inner">
        <div><div className="mg-exp-label">Guardian</div><div className="mg-exp-value">{r.guardian || "—"}</div></div>
        <div><div className="mg-exp-label">Guardian Phone</div><div className="mg-exp-value">{r.guardian_phone || "—"}</div></div>
        <div><div className="mg-exp-label">Email</div><div className="mg-exp-value">{r.email || "—"}</div></div>
        <div><div className="mg-exp-label">Previous School</div><div className="mg-exp-value">{r.previous_school || "—"}</div></div>
        <div><div className="mg-exp-label">Nationality</div><div className="mg-exp-value">{r.nationality || "—"}</div></div>
        <div><div className="mg-exp-label">Application Type</div><div className="mg-exp-value" style={{ textTransform: "uppercase" }}>{r.type}</div></div>
        <div><div className="mg-exp-label">Status</div><span className={`mg-status ${sc}`}>{sl}</span></div>
        <div>
          <div className="mg-exp-label">Documents</div>
          <div className="mg-exp-docs">
            {docs.map((d) => (
              <span key={d.name} className={`mg-exp-doc ${d.has ? "has" : "missing"}`}>
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{d.has ? "check_circle" : "cancel"}</span>
                {d.name}
              </span>
            ))}
          </div>
        </div>
        <div className="mg-exp-actions">
          <button className="mg-exp-btn" onClick={(e) => { e.stopPropagation(); onOpenSlideOver(r); }}>
            <span className="material-symbols-outlined">open_in_full</span> Full Details
          </button>
          {r.status !== "accepted" && (
            <button className="mg-exp-btn success" onClick={(e) => { e.stopPropagation(); onAdmit(r); }}>
              <span className="material-symbols-outlined">check_circle</span> Admit
            </button>
          )}
          {r.status !== "rejected" && (
            <button className="mg-exp-btn" style={{ borderColor: "#f59e0b", color: "#d97706" }} onClick={(e) => { e.stopPropagation(); onReject(r); }}>
              <span className="material-symbols-outlined">cancel</span> Reject
            </button>
          )}
          <button className="mg-exp-btn" onClick={(e) => { e.stopPropagation(); toast.success("Email composer coming soon"); }}>
            <span className="material-symbols-outlined">mail</span> Send Email
          </button>
          <button className="mg-exp-btn" onClick={(e) => { e.stopPropagation(); toast.success("SMS composer coming soon"); }}>
            <span className="material-symbols-outlined">sms</span> Send SMS
          </button>
          <button className="mg-exp-btn" onClick={(e) => { e.stopPropagation(); toast.success("Print preview coming soon"); }}>
            <span className="material-symbols-outlined">print</span> Print
          </button>
          <button className="mg-exp-btn danger" onClick={(e) => { e.stopPropagation(); onDelete(r); }}>
            <span className="material-symbols-outlined">delete</span> Delete
          </button>
        </div>
      </div>
    </td>
  );
}

/* ══════════════════════ SLIDE-OVER PANEL ══════════════════════ */
function SlideOver({ open, onClose, record, loading, onAdmit, onReject, onDelete }) {
  const [noteText, setNoteText] = useState("");
  const [msgText, setMsgText] = useState("");
  const [notes, setNotes] = useState([]);
  const [messages, setMessages] = useState([]);
  const bodyRef = useRef(null);

  // useEffect(() => {
  //   if (open) {
  //     document.body.style.overflow = "hidden";
  //     bodyRef.current?.scrollTo(0, 0);
  //   } else document.body.style.overflow = "";
  //   return () => { document.body.style.overflow = ""; };
  // }, [open]);


  useEffect(() => {
    if (record?.id) {
      setNotes([]);
      setMessages([]);
      setNoteText("");
      setMsgText("");
    }
  }, [record?.id]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!record) return null;
  const [sl, sc] = ST[record.status] ?? [record.status, "mg-status-gray"];

  const scoreDocs = record.has_birth_cert && record.has_passport && record.has_report_card
    ? 100
    : Math.round(((+!!record.has_birth_cert + +!!record.has_passport + +!!record.has_report_card) / 3) * 100);
  const scoreReqs = 90;
  const scoreInterview = record.status === "accepted" ? 88 : record.status === "rejected" ? 45 : null;
  const scoreOverall = scoreInterview != null
    ? Math.round(scoreDocs * 0.3 + scoreReqs * 0.3 + scoreInterview * 0.4)
    : Math.round(scoreDocs * 0.5 + scoreReqs * 0.5);
  const scoreClass = scoreOverall >= 80 ? "high" : scoreOverall >= 60 ? "mid" : "low";
  const scoreLabel = scoreOverall >= 80 ? "Recommended" : scoreOverall >= 60 ? "Review Needed" : "Not Recommended";
  const scoreColor = scoreOverall >= 80 ? "#059669" : scoreOverall >= 60 ? "#d97706" : "#ef4444";

  const timeline = [
    { label: "Application Submitted", date: record.date_applied, by: record.name, done: true },
    { label: "Under Review", date: "—", by: "—", done: record.status !== "pending", current: record.status === "reviewing" || record.status === "pending" },
    { label: "Interview Scheduled", date: "—", by: "—", done: ["accepted", "rejected"].includes(record.status) },
    { label: "Decision Made", date: "—", by: "—", done: ["accepted", "rejected"].includes(record.status) },
  ];

  const addNote = () => {
    if (!noteText.trim()) return;
    setNotes((prev) => [...prev, {
      author: "You",
      text: noteText.trim(),
      date: new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    }]);
    setNoteText("");
    toast.success("Note added");
  };

  const sendMessage = () => {
    if (!msgText.trim()) return;
    setMessages((prev) => [...prev, {
      from: "admin",
      text: msgText.trim(),
      date: new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    }]);
    setMsgText("");
    toast.success("Message sent");
  };

  const docs = record.documents
    ? ALL_DOC_FIELDS.map((f) => ({
      name: f.label,
      icon: f.icon,
      has: record.documents?.[f.key]?.has ?? false,
      url: record.documents?.[f.key]?.url ?? null,
    }))
    : [
      { name: "Birth Certificate", has: record.has_birth_cert, icon: "description", url: null },
      { name: "Passport Photo", has: record.has_passport, icon: "photo_camera", url: null },
      { name: "Report Card", has: record.has_report_card, icon: "assessment", url: null },
    ];

  const auditTrail = [
    { text: `<strong>${record.name}</strong> submitted application`, date: record.date_applied, icon: "add_circle" },
    { text: `Current status: <strong>${sl}</strong>`, date: record.updated_at ? new Date(record.updated_at).toLocaleDateString() : "—", icon: "edit" },
  ];

  return (
    <>
      <div className={`mg-slideover-backdrop ${open ? "open" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside className={`mg-slideover ${open ? "open" : ""}`} role="dialog" aria-modal="true" aria-label={`Details for ${record.name}`}>
        <div className="mg-slideover-hd">
          <div className="mg-slideover-hd-left">
            {record.photo ? (
              <img src={record.photo} alt={record.name} className="mg-applicant-photo" style={{ width: 42, height: 42 }} />
            ) : (
              <div className="mg-avatar" style={{ width: 42, height: 42, fontSize: 14, background: "#eff6ff", color: "var(--hp-navy)" }}>
                {initials(record.name)}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div className="fw-bold" style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{record.name}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'SF Mono', monospace" }}>{record.application_number}</div>
            </div>
          </div>
          <button className="mg-slideover-close" onClick={onClose} aria-label="Close panel">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {loading && (
          <div style={{ padding: "0.5rem 1.35rem", fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, animation: "mgShimmer 1.2s linear infinite" }}>sync</span>
            Loading full details…
          </div>
        )}

        <div className="mg-slideover-body" ref={bodyRef}>
          {/* Status Section */}
          <div className="mg-so-status">
            <span className={`mg-status ${sc}`}>{sl}</span>
            <span className={`mg-so-score-badge ${scoreClass}`}>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>star</span>
              {scoreOverall}%
            </span>
          </div>

          {/* Personal Information */}
          <div className="mg-so-section">
            <div className="mg-so-section-title">Personal Information</div>
            <div className="mg-so-grid">
              <div><span className="mg-so-label">Gender</span><span className="mg-so-value" style={{ textTransform: "capitalize" }}>{record.gender || "—"}</span></div>
              <div><span className="mg-so-label">Phone</span><span className="mg-so-value">{record.phone || "—"}</span></div>
              <div style={{ gridColumn: "1 / -1" }}><span className="mg-so-label">Email</span><span className="mg-so-value">{record.email || "—"}</span></div>
              <div><span className="mg-so-label">Type</span><span className="mg-so-value" style={{ textTransform: "uppercase" }}>{record.type}</span></div>
              <div><span className="mg-so-label">Nationality</span><span className="mg-so-value">{record.nationality || "—"}</span></div>
            </div>
          </div>

          {/* Parent/Guardian */}
          {(record.father || record.mother || record.guardian_address) && (
            <div className="mg-so-section">
              <div className="mg-so-section-title">Parent / Guardian</div>
              <div className="mg-so-grid">
                {record.father?.name && (
                  <>
                    <div><span className="mg-so-label">Father</span><span className="mg-so-value">{record.father.name}</span></div>
                    <div><span className="mg-so-label">Father Phone</span><span className="mg-so-value">{record.father.phone || "—"}</span></div>
                  </>
                )}
                {record.mother?.name && (
                  <>
                    <div><span className="mg-so-label">Mother</span><span className="mg-so-value">{record.mother.name}</span></div>
                    <div><span className="mg-so-label">Mother Phone</span><span className="mg-so-value">{record.mother.phone || "—"}</span></div>
                  </>
                )}
                {record.guardian_address && (
                  <div style={{ gridColumn: "1 / -1" }}><span className="mg-so-label">Guardian Address</span><span className="mg-so-value">{record.guardian_address}</span></div>
                )}
              </div>
            </div>
          )}

          {/* Academic Details */}
          <div className="mg-so-section">
            <div className="mg-so-section-title">Academic Details</div>
            <div className="mg-so-grid">
              <div><span className="mg-so-label">Grade</span><span className="mg-so-value">{record.grade || "—"}</span></div>
              <div><span className="mg-so-label">Date Applied</span><span className="mg-so-value">{record.date_applied}</span></div>
              <div><span className="mg-so-label">Guardian</span><span className="mg-so-value">{record.guardian || "—"}</span></div>
              <div><span className="mg-so-label">Guardian Phone</span><span className="mg-so-value">{record.guardian_phone || "—"}</span></div>
              <div style={{ gridColumn: "1 / -1" }}><span className="mg-so-label">Previous School</span><span className="mg-so-value">{record.previous_school || "—"}</span></div>
            </div>
          </div>

          {/* Admission Score */}
          <div className="mg-so-section">
            <div className="mg-so-section-title">Admission Score</div>
            <div className="mg-so-score-grid">
              <div>
                <div className="mg-so-score-item-label"><span>Documents</span><span style={{ fontWeight: 800, color: scoreDocs === 100 ? "#059669" : "#d97706" }}>{scoreDocs}%</span></div>
                <div className="mg-so-score-track"><div className="mg-so-score-fill" style={{ width: `${scoreDocs}%`, background: scoreDocs === 100 ? "#059669" : "#f59e0b" }} /></div>
              </div>
              <div>
                <div className="mg-so-score-item-label"><span>Requirements</span><span style={{ fontWeight: 800, color: "#3b82f6" }}>{scoreReqs}%</span></div>
                <div className="mg-so-score-track"><div className="mg-so-score-fill" style={{ width: `${scoreReqs}%`, background: "#3b82f6" }} /></div>
              </div>
              {scoreInterview != null && (
                <div>
                  <div className="mg-so-score-item-label"><span>Interview</span><span style={{ fontWeight: 800, color: scoreInterview >= 70 ? "#059669" : "#ef4444" }}>{scoreInterview}%</span></div>
                  <div className="mg-so-score-track"><div className="mg-so-score-fill" style={{ width: `${scoreInterview}%`, background: scoreInterview >= 70 ? "#059669" : "#ef4444" }} /></div>
                </div>
              )}
              <div className="mg-so-score-overall">
                <div className="mg-so-score-overall-val" style={{ color: scoreColor }}>{scoreOverall}%</div>
                <div className="mg-so-score-overall-label">Overall Score</div>
                <div className="mg-so-score-rec" style={{ background: scoreOverall >= 80 ? "#ecfdf5" : scoreOverall >= 60 ? "#fffbeb" : "#fef2f2", color: scoreColor }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                    {scoreOverall >= 80 ? "thumb_up" : scoreOverall >= 60 ? "remove_red_eye" : "thumb_down"}
                  </span>
                  {scoreLabel}
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="mg-so-section">
            <div className="mg-so-section-title">
              Documents{" "}
              <button
                onClick={() => {
                  const uploaded = docs.filter((d) => d.has && d.url);
                  if (uploaded.length === 0) { toast.error("No documents uploaded yet"); return; }
                  uploaded.forEach((d) => window.open(d.url, "_blank", "noopener,noreferrer"));
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>fullscreen</span> Preview All
              </button>
            </div>
            <div className="mg-so-docs-grid">
              {docs.map((d) => (
                <div
                  key={d.name}
                  className="mg-so-doc-card"
                  onClick={() => {
                    if (d.url) window.open(d.url, "_blank", "noopener,noreferrer");
                    else toast.error(`${d.name} was not uploaded`);
                  }}
                >
                  <div className={`mg-so-doc-thumb ${d.has ? "has-file" : ""}`}>
                    <span className="material-symbols-outlined">{d.has ? "check_circle" : d.icon}</span>
                  </div>
                  <div className="mg-so-doc-info">
                    <div className="mg-so-doc-name">{d.name}</div>
                    <div className={`mg-so-doc-status ${d.has ? "has" : "missing"}`}>{d.has ? "Uploaded" : "Missing"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="mg-so-section">
            <div className="mg-so-section-title">Application Timeline</div>
            <div className="mg-so-timeline">
              {timeline.map((t, i) => (
                <div key={i} className={`mg-so-tl-item ${t.done ? "done" : ""} ${t.current ? "current" : ""}`}>
                  <div className="mg-so-tl-dot" />
                  {i < timeline.length - 1 && <div className="mg-so-tl-line" />}
                  <div>
                    <div className="mg-so-tl-label">{t.label}</div>
                    <div className="mg-so-tl-date">{t.date}</div>
                    {t.by !== "—" && <div className="mg-so-tl-by">by {t.by}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reviewer Notes */}
          <div className="mg-so-section">
            <div className="mg-so-section-title">
              Reviewer Notes{" "}
              <span style={{ fontSize: ".6rem", fontWeight: 500, color: "#94a3b8", textTransform: "none", letterSpacing: 0 }}>({notes.length})</span>
            </div>
            <div className="mg-so-notes">
              {notes.length === 0 && (
                <div style={{ fontSize: ".8rem", color: "#94a3b8", fontStyle: "italic", padding: ".5rem 0" }}>No notes yet. Add one below.</div>
              )}
              {notes.map((n, i) => (
                <div key={i} className="mg-so-note">
                  <div className="mg-so-note-hd"><span className="mg-so-note-author">{n.author}</span><span className="mg-so-note-date">{n.date}</span></div>
                  <div className="mg-so-note-body">{n.text}</div>
                </div>
              ))}
              <div className="mg-so-note-input">
                <textarea
                  placeholder="Add a reviewer note…"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addNote(); } }}
                />
                <button className="mg-so-note-submit" onClick={addNote} disabled={!noteText.trim()}>Add</button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="mg-so-section">
            <div className="mg-so-section-title">Messages with Applicant</div>
            <div className="mg-so-messages">
              {messages.length === 0 && (
                <div style={{ fontSize: ".8rem", color: "#94a3b8", fontStyle: "italic", padding: ".5rem 0" }}>No messages yet.</div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`mg-so-msg ${m.from}`}>
                  <div>
                    <div className="mg-so-msg-bubble">{m.text}</div>
                    <div className="mg-so-msg-meta">{m.date}</div>
                  </div>
                </div>
              ))}
              <div className="mg-so-msg-input">
                <input
                  placeholder="Type a message…"
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                />
                <button className="mg-so-msg-send" onClick={sendMessage}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>send</span>
                </button>
              </div>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="mg-so-section">
            <div className="mg-so-section-title">Audit Trail</div>
            <div className="mg-so-audit">
              {auditTrail.map((a, i) => (
                <div key={i} className="mg-so-audit-item">
                  <div className="mg-so-audit-ic"><span className="material-symbols-outlined">{a.icon}</span></div>
                  <div className="mg-so-audit-text" dangerouslySetInnerHTML={{ __html: a.text }} />
                  <span className="mg-so-audit-date">{a.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mg-slideover-footer">
          <div className="d-flex gap-2 flex-wrap">
            {record.status !== "accepted" && (
              <button className="mg-so-btn mg-so-btn-admit" onClick={() => { onAdmit(record); onClose(); }}>
                <span className="material-symbols-outlined">check_circle</span> Admit
              </button>
            )}
            {record.status !== "rejected" && (
              <button className="mg-so-btn mg-so-btn-reject" onClick={() => { onReject(record); onClose(); }}>
                <span className="material-symbols-outlined">cancel</span> Reject
              </button>
            )}
            <button className="mg-so-btn mg-so-btn-req" onClick={() => toast.success("Document request sent")}>
              <span className="material-symbols-outlined">mail</span> Request Docs
            </button>
            <button className="mg-so-btn" onClick={() => toast.success("Generating admission letter…")}>
              <span className="material-symbols-outlined">description</span> Letter
            </button>
            <button className="mg-so-btn" onClick={() => window.print()}>
              <span className="material-symbols-outlined">print</span> Print
            </button>
            <button className="mg-so-btn" onClick={() => toast.success("PDF download coming soon")}>
              <span className="material-symbols-outlined">download</span> PDF
            </button>
            <button className="mg-so-btn mg-so-btn-del" onClick={() => { onDelete(record); onClose(); }}>
              <span className="material-symbols-outlined">delete</span> Delete
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ══════════════════════ MAIN COMPONENT ══════════════════════ */
export default function AdmissionManagementPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState("");
  const [gender, setGender] = useState("");
  const [type, setType] = useState("");
  const [year, setYear] = useState("");
  const [guardianSearch, setGuardianSearch] = useState("");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [nationality, setNationality] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [submittedToday, setSubmittedToday] = useState(false);
  const [missingDocs, setMissingDocs] = useState(false);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [slideRecord, setSlideRecord] = useState(null);
  const [visibleCols, setVisibleCols] = useState(DEFAULT_VISIBLE);
  const [showColPicker, setShowColPicker] = useState(false);
  const [activeSaved, setActiveSaved] = useState("");
  const [showAdvFilters, setShowAdvFilters] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignReviewer, setAssignReviewer] = useState("");

  // Admit Modal State
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [admitData, setAdmitData] = useState({
    applicationId: null,
    student_name: '',
    application_number: '',
    class_id: '',
    section_id: '',
    academic_year_id: '',
  });

  const debouncedSearch = useDebounced(search);
  const debouncedGuardian = useDebounced(guardianSearch);
  const debouncedSchool = useDebounced(schoolSearch);

  const { data: meta } = useAdmissionsMeta();
  const { data, isLoading, isError, isFetching } = useAdmissions({
    status: status || undefined,
    search: debouncedSearch || undefined,
    grade: grade || undefined,
    gender: gender || undefined,
    type: type || undefined,
    year: year || undefined,
    page,
  });

  const upd = useUpdateAdmission();
  const del = useDeleteAdmission();
  const admitMutation = useAdmitStudent();

  const rows = data?.data ?? [];
  const k = meta?.kpis ?? {};

  /* Fetch the full detail record for slide-over */
  const { data: slideDetail, isLoading: slideDetailLoading } = useAdmission(
    slideRecord?.id,
    !!slideRecord,
  );

  /* Merge the thin table row with the rich show() payload */
  const slideFullRecord = useMemo(() => {
    if (!slideRecord) return null;
    if (!slideDetail) return slideRecord;
    return {
      ...slideRecord,
      notes: slideDetail.notes,
      gender: slideDetail.student?.gender ?? slideRecord.gender,
      nationality: slideDetail.student?.nationality ?? slideRecord.nationality,
      previous_school: slideDetail.admission?.previous_school ?? slideRecord.previous_school,
      father: slideDetail.father,
      mother: slideDetail.mother,
      guardian_address: slideDetail.guardian?.address,
      documents: slideDetail.documents,
      updated_at: slideDetail.dates?.updated_at,
    };
  }, [slideRecord, slideDetail]);

  const cTotal = useCountUp(k.total);
  const cAdmitted = useCountUp(k.admitted);
  const cRejected = useCountUp(k.rejected);
  const cPending = useCountUp(k.pending);
  const cMale = useCountUp(k.male);
  const cFemale = useCountUp(k.female);
  const cTransfer = useCountUp(k.transfer);

  const spark = (base) => [30, 42, 55, 48, 62, 70, base || 0];

  const clearAll = useCallback(() => {
    setSearch(""); setGrade(""); setGender(""); setType(""); setYear("");
    setGuardianSearch(""); setSchoolSearch(""); setNationality("");
    setDateFrom(""); setDateTo(""); setStatus(""); setPage(1);
    setSubmittedToday(false); setMissingDocs(false); setActiveSaved("");
  }, []);

  const applySaved = (sf) => {
    clearAll();
    setActiveSaved(sf.key);
    if (sf.preset) {
      if (sf.preset.status) setStatus(sf.preset.status);
      if (sf.preset.type) setType(sf.preset.type);
      if (sf.preset.submittedToday) setSubmittedToday(true);
      if (sf.preset.missingDocs) setMissingDocs(true);
      setPage(1);
    }
  };

  // Updated setStat to handle admit with modal
  const setStat = async (r, newStatus, label) => {
    if (newStatus === 'accepted') {
      // Open the admit modal
      setAdmitData({
        applicationId: r.id,
        student_name: r.name,
        application_number: r.application_number,
        class_id: '',
        section_id: '',
        academic_year_id: '',
      });
      setShowAdmitModal(true);
      return;
    }

    // For reject or other status changes
    if (!(await confirmAction({ title: `${label} application?`, text: `${r.name} — ${r.application_number}`, confirmText: label }))) return;
    try {
      await upd.mutateAsync({ id: r.id, status: newStatus });
      toast.success(`Application ${label.toLowerCase()}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Permission denied.");
    }
  };

  // Handle admit with class/section/academic year
  const handleAdmitWithDetails = async () => {
    const currentYear = new Date().getFullYear();
    const currentYearStr = `${currentYear}/${currentYear + 1}`;

    // Find ONLY the automatically determined current academic year
    const academicYear = meta?.academic_years?.find(
      (year) => year.name === currentYearStr
    );

    if (!academicYear) {
      toast.error(
        `Academic year ${currentYearStr} is not configured in the system.`
      );
      return;
    }

    if (!admitData.class_id) {
      toast.error("Please select a class.");
      return;
    }

    if (!admitData.section_id) {
      toast.error("Please select a section.");
      return;
    }

    const payload = {
      id: admitData.applicationId,
      school_class_id: Number(admitData.class_id),
      section_id: Number(admitData.section_id),
      academic_year_id: Number(academicYear.id),
    };

    try {
      await admitMutation.mutateAsync(payload);

      toast.success(
        "Student admitted successfully!"
      );

      setShowAdmitModal(false);

      setAdmitData({
        applicationId: null,
        student_name: "",
        application_number: "",
        class_id: "",
        section_id: "",
        academic_year_id: "",
      });

    } catch (error) {
      console.error(
        "❌ Error Response:",
        error?.response?.data
      );

      console.error(
        "❌ Error Details:",
        error?.response?.data?.errors
      );

      toast.error(
        error?.response?.data?.message ||
        "Failed to admit student."
      );
    }
  };

  const remove = async (r) => {
    if (!(await confirmDelete({ title: "Delete application?", text: r.name, confirmText: "Delete" }))) return;
    try {
      await del.mutateAsync(r.id);
      toast.success("Application removed");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Permission denied.");
    }
  };

  const toggleAll = () => {
    if (selected.size === rows.length && rows.length > 0) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  };

  const toggleRow = (id, e) => {
    e?.stopPropagation();
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleExpand = (id, e) => {
    if (e.target.closest("button") || e.target.closest("input[type='checkbox']") || e.target.closest(".mg-actions")) return;
    setExpandedRows((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const bulkAction = async (newStatus, label) => {
    if (!(await confirmAction({ title: `${label} ${selected.size} applications?`, confirmText: `${label} All` }))) return;
    try {
      await Promise.all([...selected].map((id) => upd.mutateAsync({ id, status: newStatus })));
      toast.success(`${selected.size} applications ${label.toLowerCase()}d`);
      setSelected(new Set());
    } catch (error) {
      toast.error(error?.response?.data?.message || "Some failed.");
    }
  };

  const bulkDelete = async () => {
    if (!(await confirmDelete({ title: `Delete ${selected.size} applications?`, confirmText: "Delete All" }))) return;
    try {
      await Promise.all([...selected].map((id) => del.mutateAsync(id)));
      toast.success(`${selected.size} removed`);
      setSelected(new Set());
    } catch (error) {
      toast.error(error?.response?.data?.message || "Some failed.");
    }
  };

  const handleBulkAssign = () => {
    if (!assignReviewer) { toast.error("Select a reviewer"); return; }
    toast.success(`${selected.size} applications assigned to ${assignReviewer}`);
    setShowAssignModal(false);
    setSelected(new Set());
    setAssignReviewer("");
  };

  const toggleCol = (key) => setVisibleCols((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
  const colRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (colRef.current && !colRef.current.contains(e.target)) setShowColPicker(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const TABS = [
    { key: "", label: "All Applications", tone: "dark" },
    { key: "admitted", label: "Admitted", tone: "green" },
    { key: "rejected", label: "Rejected", tone: "red" },
    { key: "pending", label: "Pending", tone: "amber" },
    { key: "reviewing", label: "In Review", tone: "blue" },
  ];

  const kpis = [
    {
      label: "Total Applications", value: cTotal, icon: "description", bg: "#eff6ff", color: "#1d4ed8",
      spark: spark(k.total), trend: "+14%", up: true,
      onClick: () => { setStatus(""); setPage(1); }, dim: status !== "",
      compare: k.total_prev ? `${Math.round(((k.total - k.total_prev) / k.total_prev) * 100)}% vs last year` : null,
    },
    {
      label: "Pending Review", value: cPending, icon: "hourglass_top", bg: "#fffbeb", color: "#d97706",
      spark: spark(k.pending), trend: "+22%", up: true,
      onClick: () => { setStatus("pending"); setPage(1); }, dim: status !== "pending", compare: null,
    },
    {
      label: "Admitted", value: cAdmitted, icon: "check_circle", bg: "#ecfdf5", color: "#059669",
      spark: spark(k.admitted), trend: "+8%", up: true,
      onClick: () => { setStatus("admitted"); setPage(1); }, dim: status !== "admitted", compare: null,
    },
    {
      label: "Rejected", value: cRejected, icon: "cancel", bg: "#fef2f2", color: "#ef4444",
      spark: spark(k.rejected), trend: "-3%", up: false,
      onClick: () => { setStatus("rejected"); setPage(1); }, dim: status !== "rejected", compare: null,
    },
    {
      label: "Male Applicants", value: cMale, icon: "male", bg: "#eff6ff", color: "#3b82f6",
      spark: spark(k.male), trend: null, up: true,
      onClick: () => { setGender("male"); setPage(1); }, dim: gender !== "male",
      compare: k.male ? `${Math.round((k.male / (k.male + k.female || 1)) * 100)}% of total` : null,
    },
    {
      label: "Female Applicants", value: cFemale, icon: "female", bg: "#fdf2f8", color: "#ec4899",
      spark: spark(k.female), trend: null, up: true,
      onClick: () => { setGender("female"); setPage(1); }, dim: gender !== "female",
      compare: k.female ? `${Math.round((k.female / (k.male + k.female || 1)) * 100)}% of total` : null,
    },
    {
      label: "Transfer Students", value: cTransfer, icon: "swap_horiz", bg: "#f0f9ff", color: "#0284c7",
      spark: spark(k.transfer), trend: "+5%", up: true,
      onClick: () => { setType("transfer"); setPage(1); }, dim: type !== "transfer", compare: null,
    },
    {
      label: "Avg. Processing", value: null, text: k.avg_days != null ? `${k.avg_days} Days` : "—",
      icon: "schedule", bg: "#faf5ff", color: "#7c3aed",
      spark: [2.1, 2.4, 2.8, 2.5, 2.3, 2.1, k.avg_days || 0], trend: null, up: false,
      onClick: () => { }, dim: false, compare: null,
    },
  ];

  return (
    <div className="mg-page">
      <a href="#mg-table-start" className="mg-skip-link">Skip to applications table</a>

      <div className="mg-head">
        <div>
          <div className="mg-title">
            <span className="material-symbols-outlined">how_to_reg</span>
            <h1>Admission Management</h1>
          </div>
          <div className="mg-crumb">
            CCAST Bambili <span className="material-symbols-outlined">chevron_right</span> Admissions{" "}
            {isFetching && (
              <span className="mg-sync"><span className="material-symbols-outlined">sync</span> syncing…</span>
            )}
          </div>
        </div>
        <button className="mg-add" onClick={() => setCreating(true)}>
          <span className="material-symbols-outlined">add</span> New Application
        </button>
      </div>

      {/* KPI Grid */}
      <div className="mg-kpi-grid" role="list" aria-label="Application statistics">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className={`mg-kpi-enhanced ${kpi.dim ? "dimmed" : ""} ${!kpi.dim && kpi.onClick ? "active" : ""}`}
            role="listitem" tabIndex={0} onClick={kpi.onClick}
            onKeyDown={(e) => { if (e.key === "Enter") kpi.onClick(); }}
            aria-label={`${kpi.label}: ${kpi.value ?? kpi.text}`}
          >
            <div className="mg-kpi-enh-top">
              <div className="mg-kpi-enh-icon" style={{ background: kpi.bg, color: kpi.color }}>
                <span className="material-symbols-outlined">{kpi.icon}</span>
              </div>
              {kpi.trend && (
                <span className={`mg-kpi-enh-trend ${kpi.up ? "up" : "down"}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{kpi.up ? "trending_up" : "trending_down"}</span>
                  {kpi.trend}
                </span>
              )}
            </div>
            {kpi.value != null ? (
              <div className="mg-kpi-enh-value">{kpi.value.toLocaleString()}</div>
            ) : (
              <div className="mg-kpi-enh-value small-text">{kpi.text}</div>
            )}
            <div className="mg-kpi-enh-label">{kpi.label}</div>
            <MiniBar data={kpi.spark} color={kpi.color} />
            {kpi.compare && <div className="mg-kpi-enh-compare">{kpi.compare}</div>}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mg-charts">
        <div className="mg-chart-card">
          <div className="mg-chart-hd"><h4>Admissions by Month</h4><small>2024–2025</small></div>
          <BarChart data={MONTH_DATA} />
        </div>
        <div className="mg-chart-card">
          <div className="mg-chart-hd"><h4>Status Distribution</h4><small>All time</small></div>
          <DonutChart data={[
            { label: "Admitted", value: k.admitted || 0, color: "#059669" },
            { label: "Pending", value: k.pending || 0, color: "#f59e0b" },
            { label: "Rejected", value: k.rejected || 0, color: "#ef4444" },
          ]} />
        </div>
        <div className="mg-chart-card">
          <div className="mg-chart-hd"><h4>Gender Split</h4><small>Applicants</small></div>
          <GenderChart male={k.male || 0} female={k.female || 0} />
        </div>
        <div className="mg-chart-card">
          <div className="mg-chart-hd"><h4>Per Grade</h4><small>Distribution</small></div>
          <HBarChart data={GRADE_DATA} />
        </div>
      </div>

      {/* Saved Filters */}
      <div className="d-flex align-items-start flex-wrap gap-3 mb-3">
        <div className="mg-saved-filters">
          <span className="mg-saved-label">Filters:</span>
          {SAVED_FILTERS.map((sf) => (
            <button key={sf.key || "all"} className={`mg-saved-chip ${activeSaved === sf.key ? "active" : ""}`} onClick={() => applySaved(sf)}>
              <span className="material-symbols-outlined">{sf.icon}</span>{sf.label}
            </button>
          ))}
        </div>
        <div className="mg-quick-toggles">
          <button className={`mg-quick-toggle ${submittedToday ? "active" : ""}`} onClick={() => { setSubmittedToday(!submittedToday); setPage(1); }}>
            <span className="material-symbols-outlined">today</span>Today
          </button>
          <button className={`mg-quick-toggle ${missingDocs ? "active" : ""}`} onClick={() => { setMissingDocs(!missingDocs); setPage(1); }}>
            <span className="material-symbols-outlined">error_outline</span>Missing Docs
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mg-tabs" role="tablist" aria-label="Application status tabs" style={{ marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem",width: "100vw" }}>
        {TABS.map((t) => (
          <button key={t.key || "all"} className={`mg-tab mg-tab-${t.tone} ${status === t.key ? "active" : ""}`}
            onClick={() => { setStatus(t.key); setPage(1); setActiveSaved(""); }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="surface-card mg-filters">
        <div className="mg-filters-hd">
          <div className="mg-filters-toggle" onClick={() => setShowAdvFilters(!showAdvFilters)} role="button" tabIndex={0} aria-expanded={showAdvFilters}>
            <span className="material-symbols-outlined">filter_alt</span>
            <span className="mg-filters-title" style={{ display: "inline" }}>Filters</span>
            <span className="material-symbols-outlined">expand_more</span>
          </div>
          <button className="mg-clear" onClick={clearAll}>
            <span className="material-symbols-outlined">restart_alt</span> Clear All
          </button>
        </div>
        <div className="mg-filters-grid cols-adv">
          <label>Search Applicants
            <input className="form-control" placeholder="Name, Application ID, Phone…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search applicants" />
          </label>
          <label>Academic Year
            <select className="form-select" value={year} onChange={(e) => { setYear(e.target.value); setPage(1); }} aria-label="Academic year">
              <option value="">All Years</option>
              {(meta?.years ?? []).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label>Grade/Class
            <select className="form-select" value={grade} onChange={(e) => { setGrade(e.target.value); setPage(1); }} aria-label="Grade">
              <option value="">All Grades</option>
              {(meta?.grades ?? []).map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
          <label>Gender
            <select className="form-select" value={gender} onChange={(e) => { setGender(e.target.value); setPage(1); }} aria-label="Gender">
              <option value="">All</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
          <label>Type
            <select className="form-select" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} aria-label="Application type">
              <option value="">All Types</option>
              <option value="new">New</option>
              <option value="transfer">Transfer</option>
            </select>
          </label>
        </div>
        <div className={`mg-filters-advanced ${showAdvFilters ? "open" : ""}`}>
          <div className="mg-filters-grid cols-adv2">
            <label>Guardian Name
              <input className="form-control" placeholder="Search guardian…" value={guardianSearch}
                onChange={(e) => { setGuardianSearch(e.target.value); setPage(1); }} aria-label="Search guardian" />
            </label>
            <label>Previous School
              <input className="form-control" placeholder="Search school…" value={schoolSearch}
                onChange={(e) => { setSchoolSearch(e.target.value); setPage(1); }} aria-label="Search previous school" />
            </label>
            <label>Nationality
              <input className="form-control" placeholder="e.g. Cameroonian" value={nationality}
                onChange={(e) => setNationality(e.target.value)} aria-label="Nationality" />
            </label>
            <div className="mg-date-range">
              <label style={{ flex: 1 }}>From
                <input type="date" className="form-control" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="Date from" />
              </label>
              <span>to</span>
              <label style={{ flex: 1 }}>To
                <input type="date" className="form-control" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="Date to" />
              </label>
            </div>
            <label>Application #
              <input className="form-control" placeholder="e.g. ADM-2025-001" aria-label="Application number" />
            </label>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="surface-card mg-tablecard">
        <div className="mg-toolbar" id="mg-table-start">
          <div className="mg-exports">
            <button className="mg-exp mg-exp-csv" onClick={() => csvExport(
              "admissions.csv",
              ["Application #", "Name", "Grade", "Gender", "Date", "Type", "Status"],
              rows,
              (r) => [r.application_number, r.name, r.grade, r.gender, r.date_applied, r.type, r.status],
            )}>
              <span className="material-symbols-outlined">table_view</span> Export CSV
            </button>
            <button className="mg-exp mg-exp-print" onClick={() => printRows(
              "Admissions",
              ["Application #", "Name", "Grade", "Type", "Status"],
              rows,
              (r) => [r.application_number, r.name, r.grade, r.type, r.status],
            )}>
              <span className="material-symbols-outlined">print</span> Print
            </button>
          </div>
          <div className="mg-col-picker" ref={colRef}>
            <button className="mg-exp" onClick={() => setShowColPicker(!showColPicker)} style={{ border: "1px solid var(--hp-bdr)" }}
              aria-label="Customize columns" aria-expanded={showColPicker}>
              <span className="material-symbols-outlined">view_column</span> Columns
            </button>
            {showColPicker && (
              <div className="mg-col-picker-menu" role="menu">
                {ALL_COLS.map((c) => (
                  <label key={c.key} className="mg-col-picker-item" role="menuitemcheckbox" aria-checked={visibleCols.includes(c.key)}>
                    <input type="checkbox" checked={visibleCols.includes(c.key)} onChange={() => toggleCol(c.key)} />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selected.size > 0 && (
          <div className="mg-bulk-bar" role="toolbar" aria-label="Bulk actions">
            <span className="mg-bulk-count">{selected.size} selected</span>
            <div className="mg-bulk-sep" />
            <button className="mg-bulk-btn success" onClick={() => bulkAction("accepted", "Admit")}>
              <span className="material-symbols-outlined">check_circle</span> Admit
            </button>
            <button className="mg-bulk-btn" onClick={() => bulkAction("rejected", "Reject")}>
              <span className="material-symbols-outlined">cancel</span> Reject
            </button>
            <button className="mg-bulk-btn danger" onClick={bulkDelete}>
              <span className="material-symbols-outlined">delete</span> Delete
            </button>
            <div className="mg-bulk-sep" />
            <button className="mg-bulk-btn" onClick={() => setShowAssignModal(true)}>
              <span className="material-symbols-outlined">person_add</span> Assign Reviewer
            </button>
            <button className="mg-bulk-btn" onClick={() => toast.success(`Email sent to ${selected.size} applicants`)}>
              <span className="material-symbols-outlined">mail</span> Email
            </button>
            <button className="mg-bulk-btn" onClick={() => toast.success(`SMS sent to ${selected.size} applicants`)}>
              <span className="material-symbols-outlined">sms</span> SMS
            </button>
            <div className="mg-bulk-sep" />
            <button className="mg-bulk-btn" onClick={() => setSelected(new Set())}>
              <span className="material-symbols-outlined">close</span> Clear
            </button>
          </div>
        )}

        {/* Table Body */}
        <div className="table-responsive d-none d-lg-block">
          <table className="table mg-table align-middle mb-0" role="grid">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" checked={rows.length > 0 && selected.size === rows.length} onChange={toggleAll} aria-label="Select all" />
                </th>
                <th style={{ width: 28 }}></th>
                {ALL_COLS.filter((c) => visibleCols.includes(c.key)).map((c) => (
                  <th key={c.key} style={c.w ? { width: c.w } : {}}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <SkeletonRows cols={ALL_COLS.filter((c) => visibleCols.includes(c.key)).length + 2} />}
              {isError && (
                <tr><td colSpan={99} className="state-cell text-danger">Couldn't load applications.</td></tr>
              )}
              {!isLoading && !isError && rows.length === 0 && (
                <tr>
                  <td colSpan={99}>
                    <div className="mg-state">
                      <span className="material-symbols-outlined mg-state-ic">inbox</span>
                      <span className="mg-state-text">No applications match your filters</span>
                      <span className="mg-state-sub">Try adjusting your search or filter criteria</span>
                    </div>
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const [sl, sc] = ST[r.status] ?? [r.status, "mg-status-gray"];
                const isExpanded = expandedRows.has(r.id);
                const scoreDocs = r.has_birth_cert && r.has_passport && r.has_report_card
                  ? 100
                  : Math.round(((+!!r.has_birth_cert + +!!r.has_passport + +!!r.has_report_card) / 3) * 100);
                const scoreOverall = Math.round(scoreDocs * 0.5 + 90 * 0.5);
                return (
                  <React.Fragment key={r.id}>
                    <tr
                      className={`mg-row-border ${BORDER_MAP[r.status] || ""} ${isExpanded ? "expanded-row-parent" : ""}`}
                      onClick={(e) => toggleExpand(r.id, e)} tabIndex={0} role="row" aria-expanded={isExpanded}
                      onKeyDown={(e) => { if (e.key === "Enter") toggleExpand(r.id, e); if (e.key === " ") { e.preventDefault(); toggleExpand(r.id, e); } }}
                    >
                      <td onClick={(e) => toggleRow(r.id, e)}>
                        <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleRow(r.id)} aria-label={`Select ${r.name}`} />
                      </td>
                      <td><span className={`material-symbols-outlined mg-expand-ic ${isExpanded ? "rotated" : ""}`}>chevron_right</span></td>
                      {visibleCols.includes("photo") && (
                        <td>
                          <div className="mg-applicant-cell">
                            {r.photo ? (
                              <img src={r.photo} alt="" className="mg-applicant-photo" />
                            ) : (
                              <div className="mg-avatar" style={{ width: 34, height: 34, fontSize: 11, background: "#eff6ff", color: "var(--hp-navy)" }}>
                                {initials(r.name)}
                              </div>
                            )}
                            <div className="mg-applicant-info">
                              <span className="mg-applicant-name">{r.name}</span>
                              <span className="mg-applicant-sub">{r.email || r.phone || "—"}</span>
                            </div>
                          </div>
                        </td>
                      )}
                      {visibleCols.includes("appNum") && (
                        <td className="fw-bold" style={{ fontSize: 12, fontFamily: "'SF Mono', monospace" }}>{r.application_number}</td>
                      )}
                      {visibleCols.includes("grade") && <td className="text-secondary" style={{ fontSize: 13 }}>{r.grade ?? "—"}</td>}
                      {visibleCols.includes("gender") && (
                        <td className="text-secondary" style={{ textTransform: "capitalize", fontSize: 13 }}>{r.gender ?? "—"}</td>
                      )}
                      {visibleCols.includes("date") && <td className="text-secondary" style={{ fontSize: 12 }}>{r.date_applied}</td>}
                      {visibleCols.includes("type") && (
                        <td><span className={`mg-chip ${TYPE_TONE[r.type]}`} style={{ textTransform: "uppercase" }}>{r.type}</span></td>
                      )}
                      {visibleCols.includes("guardian") && (
                        <td style={{ fontSize: 12.5 }}>
                          <div>{r.guardian || "—"}</div>
                          <div style={{ fontSize: 10.5, color: "#94a3b8" }}>{r.guardian_phone || ""}</div>
                        </td>
                      )}
                      {visibleCols.includes("status") && <td><span className={`mg-status ${sc}`}>{sl}</span></td>}
                      {visibleCols.includes("score") && (
                        <td>
                          <span style={{ fontSize: 12, fontWeight: 800, color: scoreOverall >= 80 ? "#059669" : scoreOverall >= 60 ? "#d97706" : "#ef4444" }}>
                            {scoreOverall}%
                          </span>
                        </td>
                      )}
                      {visibleCols.includes("actions") && (
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="mg-actions justify-content-center">
                            <button title="Full details" onClick={() => setSlideRecord(r)} aria-label={`View details for ${r.name}`}>
                              <span className="material-symbols-outlined">visibility</span>
                            </button>
                            {r.status !== "accepted" && (
                              <button title="Admit" onClick={() => setStat(r, "accepted", "Admit")} style={{ color: "#16a34a" }} aria-label={`Admit ${r.name}`}>
                                <span className="material-symbols-outlined">check_circle</span>
                              </button>
                            )}
                            {r.status !== "rejected" && (
                              <button title="Reject" onClick={() => setStat(r, "rejected", "Reject")} className="del" aria-label={`Reject ${r.name}`}>
                                <span className="material-symbols-outlined">cancel</span>
                              </button>
                            )}
                            <button title="Delete" className="del" onClick={() => remove(r)} aria-label={`Delete ${r.name}`}>
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                    {isExpanded && (
                      <tr>
                        <ExpandedRow
                          r={r}
                          onOpenSlideOver={setSlideRecord}
                          onAdmit={(r) => setStat(r, "accepted", "Admit")}
                          onReject={(r) => setStat(r, "rejected", "Reject")}
                          onDelete={remove}
                        />
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="d-lg-none">
          {isLoading && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "1rem", marginBottom: ".65rem" }}>
              <div className="mg-skel" style={{ width: "60%", height: 14, marginBottom: 8 }} />
              <div className="mg-skel" style={{ width: "40%", height: 12, marginBottom: 8 }} />
              <div className="mg-skel" style={{ width: "80%", height: 12 }} />
            </div>
          ))}
          {!isLoading && !isError && rows.length === 0 && (
            <div className="mg-state">
              <span className="material-symbols-outlined mg-state-ic">inbox</span>
              <span className="mg-state-text">No applications found</span>
            </div>
          )}
          {!isLoading && rows.map((r) => {
            const [sl, sc] = ST[r.status] ?? [r.status, "mg-status-gray"];
            const borderClass = BORDER_MAP[r.status]?.replace("border-", "") || "blue";
            return (
              <div key={r.id} className={`mg-mcard mg-mcard-border-${borderClass}`} onClick={() => setSlideRecord(r)} role="button" tabIndex={0} aria-label={`${r.name} — ${sl}`}>
                <div className="mg-mcard-top">
                  <div className="d-flex align-items-center gap-2">
                    {r.photo ? (
                      <img src={r.photo} alt="" className="mg-applicant-photo" style={{ width: 34, height: 34 }} />
                    ) : (
                      <div className="mg-avatar" style={{ width: 34, height: 34, fontSize: 11, background: "#eff6ff", color: "var(--hp-navy)" }}>
                        {initials(r.name)}
                      </div>
                    )}
                    <div>
                      <div className="fw-semibold" style={{ fontSize: 13 }}>{r.name}</div>
                      <div style={{ fontSize: 10.5, color: "#94a3b8" }}>{r.application_number}</div>
                    </div>
                  </div>
                  <span className={`mg-status ${sc}`} style={{ fontSize: 11 }}>{sl}</span>
                </div>
                <div className="mg-mcard-body">
                  <div><span className="mg-mcard-label">Grade</span>{r.grade ?? "—"}</div>
                  <div><span className="mg-mcard-label">Gender</span><span style={{ textTransform: "capitalize" }}>{r.gender ?? "—"}</span></div>
                  <div><span className="mg-mcard-label">Date</span>{r.date_applied}</div>
                  <div><span className="mg-mcard-label">Type</span><span style={{ textTransform: "uppercase" }}>{r.type}</span></div>
                  <div><span className="mg-mcard-label">Guardian</span>{r.guardian || "—"}</div>
                  <div><span className="mg-mcard-label">Phone</span>{r.phone || "—"}</div>
                </div>
                <div className="mg-mcard-actions">
                  <button onClick={(e) => { e.stopPropagation(); setSlideRecord(r); }} aria-label="View details">
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                  {r.status !== "accepted" && (
                    <button style={{ color: "#16a34a" }} onClick={(e) => { e.stopPropagation(); setStat(r, "accepted", "Admit"); }} aria-label="Admit">
                      <span className="material-symbols-outlined">check_circle</span>
                    </button>
                  )}
                  {r.status !== "rejected" && (
                    <button className="del" onClick={(e) => { e.stopPropagation(); setStat(r, "rejected", "Reject"); }} aria-label="Reject">
                      <span className="material-symbols-outlined">cancel</span>
                    </button>
                  )}
                  <button className="del" onClick={(e) => { e.stopPropagation(); remove(r); }} aria-label="Delete">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <Pager meta={data} setPage={setPage} unit="applicants" />
      </div>

      {/* Slide-over */}
      <SlideOver
        open={!!slideRecord}
        onClose={() => setSlideRecord(null)}
        record={slideFullRecord}
        loading={slideDetailLoading}
        onAdmit={setStat}
        onReject={setStat}
        onDelete={remove}
      />

      {/* Admit Modal */}
      <AdmitModal
        open={showAdmitModal}
        onClose={() => {
          setShowAdmitModal(false);
          setAdmitData({
            applicationId: null,
            student_name: '',
            application_number: '',
            class_id: '',
            section_id: '',
            academic_year_id: ''
          });
        }}
        onAdmit={handleAdmitWithDetails}
        admitData={admitData}
        setAdmitData={setAdmitData}
        metaData={meta}
        isLoading={admitMutation.isPending}
      />

      {/* Assign Reviewer Modal */}
      {showAssignModal && (
        <Modal
          title="Assign Reviewer"
          onClose={() => setShowAssignModal(false)}
          size="modal-sm"
          footer={
            <>
              <button className="btn btn-light" onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleBulkAssign}>Assign to {assignReviewer || "…"}</button>
            </>
          }
        >
          <p style={{ fontSize: ".88rem", color: "#475569", marginBottom: "1rem" }}>
            Assign <strong>{selected.size}</strong> application(s) to a reviewer:
          </p>
          <select className="mg-assign-select" value={assignReviewer} onChange={(e) => setAssignReviewer(e.target.value)}>
            <option value="">Select reviewer…</option>
            {REVIEWERS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Modal>
      )}

      {/* New Application Modal */}
      {creating && <NewApplicationModal onClose={() => setCreating(false)} />}
    </div>
  );
}

/* ── New Application Modal ── */
function NewApplicationModal({ onClose }) {
  const create = useCreateAdmission();
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});

  // Set academic year automatically when form loads
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      academic_year: CURRENT_ACADEMIC_YEAR
    }));
  }, []);

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const submit = async () => {
    setErrors({});
    try {
      await create.mutateAsync(form);
      toast.success("Application created");
      onClose();
    } catch (err) {
      setErrors(err.fieldErrors ?? {});
      if (!err.fieldErrors) toast.error("Could not save.");
    }
  };

  return (
    <Modal
      title="New application"
      onClose={onClose}
      size="modal-lg"
      footer={
        <>
          <button className="btn btn-light" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={create.isPending}>
            {create.isPending ? "Saving…" : "Create"}
          </button>
        </>
      }
    >
      <div className="row">
        <div className="col-md-6">
          <Field label="First name" required error={errors.student_first_name}>
            <input className="form-control" value={form.student_first_name} onChange={set("student_first_name")} />
          </Field>
        </div>
        <div className="col-md-6">
          <Field label="Last name" required error={errors.student_last_name}>
            <input className="form-control" value={form.student_last_name} onChange={set("student_last_name")} />
          </Field>
        </div>

        {/* 🔴 Academic Year Field - Auto-displayed, read-only input */}
        <div className="col-md-6">
          <Field label="Academic Year" required>
            <input
              className="form-control"
              type="text"
              value={CURRENT_ACADEMIC_YEAR}
              disabled
              style={{
                backgroundColor: '#f1f5f9',
                fontWeight: '600',
                color: '#1e3a5f',
                cursor: 'not-allowed',
                borderColor: '#e2e8f0'
              }}
            />
            <small className="text-muted" style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>
              Current academic year (auto-generated)
            </small>
          </Field>
        </div>

        <div className="col-md-6">
          <Field label="Gender">
            <select className="form-select" value={form.student_gender} onChange={set("student_gender")}>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </Field>
        </div>
        <div className="col-md-4">
          <Field label="Grade / class" required error={errors.class_applying_for}>
            <input
              className="form-control"
              placeholder="Form 1"
              value={form.class_applying_for}
              onChange={set("class_applying_for")}
            />
          </Field>
        </div>
        <div className="col-md-4">
          <Field label="Previous school (transfer)">
            <input className="form-control" value={form.previous_school} onChange={set("previous_school")} />
          </Field>
        </div>
        <div className="col-md-4">
          <Field label="Guardian name" required error={errors.guardian_name}>
            <input className="form-control" value={form.guardian_name} onChange={set("guardian_name")} />
          </Field>
        </div>
        <div className="col-md-6">
          <Field label="Guardian phone" required error={errors.guardian_phone}>
            <input className="form-control" value={form.guardian_phone} onChange={set("guardian_phone")} />
          </Field>
        </div>
        <div className="col-md-6">
          <Field label="Email">
            <input className="form-control" value={form.email} onChange={set("email")} />
          </Field>
        </div>
        <div className="col-md-6">
          <Field label="Phone">
            <input className="form-control" value={form.phone} onChange={set("phone")} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}