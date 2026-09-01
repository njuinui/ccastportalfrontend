
// src/pages/students/StudentProfilePage.jsx

import { useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { initials } from "../../components/ui";
import "./StudentsPage.css";

import { QRCodeSVG } from "qrcode.react";

// Replace QRCodeVisual component with:
const QRCodeVisual = ({ value, size = 200 }) => {
  return (
    <QRCodeSVG
      value={value || "N/A"}
      size={size}
      level="H"
      includeMargin
    />
  );
};

const STATUS_LABEL = {
  active: "Active",
  inactive: "Inactive",
  transferred: "Transferred",
  graduated: "Passed Out",
  suspended: "Suspended",
  withdrawn: "Withdrawn",
};
const STATUS_TONE = {
  active: "green",
  inactive: "gray",
  transferred: "purple",
  graduated: "blue",
  suspended: "red",
  withdrawn: "gray",
};

const PROFILE_TABS = [
  { key: "overview", label: "Overview", icon: "dashboard" },
  { key: "academic", label: "Academic", icon: "school" },
  { key: "attendance", label: "Attendance", icon: "event_available" },
  { key: "parents", label: "Parents", icon: "family_restroom" },
  { key: "medical", label: "Medical", icon: "medical_information" },
  { key: "documents", label: "Documents", icon: "folder_open" },
  { key: "fees", label: "Fees", icon: "payments" },
  { key: "discipline", label: "Discipline", icon: "gavel" },
  { key: "timeline", label: "Timeline", icon: "history" },
];

/* ── Fake QR Code Visual ── */
// function QRCodeVisual({ value, size = 100 }) {
//   const s = 25,
//     cs = size / s;
//   let seed = 0;
//   for (let i = 0; i < (value || "").length; i++)
//     seed = ((seed << 5) - seed + value.charCodeAt(i)) | 0;
//   seed = Math.abs(seed);
//   const rng = (i) => {
//     const x = Math.sin(seed + i * 127.1) * 43758.5453;
//     return x - Math.floor(x);
//   };
//   const rects = [];
//   let idx = 0;
//   for (let y = 0; y < s; y++)
//     for (let x = 0; x < s; x++) {
//       const inTL = x < 7 && y < 7,
//         inTR = x >= s - 7 && y < 7,
//         inBL = x < 7 && y >= s - 7;
//       let filled = false;
//       if (inTL || inTR || inBL) {
//         const lx = inTR ? x - (s - 7) : x,
//           ly = inBL ? y - (s - 7) : y;
//         if (lx === 0 || lx === 6 || ly === 0 || ly === 6) filled = true;
//         else if (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4) filled = true;
//       } else if (x === 6 || y === 6) filled = true;
//       else filled = rng(idx++) > 0.5;
//       if (filled)
//         rects.push(
//           <rect
//             key={idx}
//             x={x * cs}
//             y={y * cs}
//             width={cs}
//             height={cs}
//             fill="#1a1a2e"
//             rx={cs * 0.15}
//           />,
//         );
//     }
//   return (
//     <svg
//       width={size}
//       height={size}
//       viewBox={`0 0 ${size} ${size}`}
//       style={{ background: "#fff", borderRadius: 6 }}
//     >
//       {rects}
//     </svg>
//   );
// }

/* ── Student ID Card Preview ── */
function StudentIDCard({ student, onClose }) {
  const printCard = () => {
    const w = window.open("", "_blank");
    if (!w) return toast.error("Allow pop-ups.");
    w.document.write(`<html><head><title>ID Card — ${student.full_name}</title>
    <style>@page{margin:0}body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f0f0;font-family:Inter,Arial,sans-serif}
    .card{width:340px;height:210px;background:linear-gradient(135deg,#1f2637,#2b3242);border-radius:14px;color:#fff;padding:18px;box-sizing:border-box;display:flex;flex-direction:column;position:relative;overflow:hidden}
    .card::before{content:"";position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:rgba(255,255,255,0.04);border-radius:50%}
    .card-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px}
    .school{font-size:10px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.7}
    .title{font-size:8px;letter-spacing:0.1em;text-transform:uppercase;opacity:0.5;margin-top:2px}
    .year{font-size:9px;background:rgba(255,255,255,0.12);padding:2px 8px;border-radius:10px}
    .card-body{display:flex;gap:14px;flex:1}
    .photo{width:70px;height:85px;border-radius:8px;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;flex-shrink:0;overflow:hidden}
    .photo img{width:100%;height:100%;object-fit:cover}
    .info{font-size:11px;line-height:1.7}
    .info .name{font-size:15px;font-weight:800;margin-bottom:2px}
    .card-bottom{display:flex;justify-content:space-between;align-items:flex-end;margin-top:auto;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1)}
    .card-bottom .qr{opacity:0.9}
    .valid{font-size:8px;opacity:0.5;text-align:right}
    </style></head><body>
    <div class="card">
      <div class="card-top"><div><div class="school">CCAST BAMBILI</div><div class="title">Student Identity Card</div></div><div class="year">2025/2026</div></div>
      <div class="card-body">
        <div class="photo">${student.student_photo ? `<img src="${student.student_photo}" alt="Student photo"/>` : initials(student.full_name)}</div>
        <div class="info"><div class="name">${student.full_name}</div>ADM: ${student.admission_number}<br/>Class: ${student.current_class || "—"} ${student.current_section || ""}<br/>Gender: ${student.gender}<br/>DOB: ${student.date_of_birth || "—"}</div>
      </div>
      <div class="card-bottom"><div class="qr"><svg width="50" height="50" viewBox="0 0 100 100" style="background:#fff;border-radius:4px"><rect x="5" y="5" width="25" height="25" fill="none" stroke="#1a1a2e" strokeWidth="5"/><rect x="12" y="12" width="11" height="11" fill="#1a1a2e"/><rect x="70" y="5" width="25" height="25" fill="none" stroke="#1a1a2e" strokeWidth="5"/><rect x="77" y="12" width="11" height="11" fill="#1a1a2e"/><rect x="5" y="70" width="25" height="25" fill="none" stroke="#1a1a2e" strokeWidth="5"/><rect x="12" y="77" width="11" height="11" fill="#1a1a2e"/><rect x="35" y="5" width="5" height="5" fill="#1a1a2e"/><rect x="45" y="5" width="5" height="5" fill="#1a1a2e"/><rect x="55" y="5" width="5" height="5" fill="#1a1a2e"/><rect x="35" y="15" width="5" height="5" fill="#1a1a2e"/><rect x="55" y="15" width="5" height="5" fill="#1a1a2e"/><rect x="35" y="25" width="5" height="5" fill="#1a1a2e"/><rect x="45" y="25" width="5" height="5" fill="#1a1a2e"/><rect x="35" y="35" width="5" height="5" fill="#1a1a2e"/><rect x="45" y="35" width="5" height="5" fill="#1a1a2e"/><rect x="55" y="35" width="5" height="5" fill="#1a1a2e"/><rect x="65" y="35" width="5" height="5" fill="#1a1a2e"/><rect x="75" y="35" width="5" height="5" fill="#1a1a2e"/><rect x="35" y="45" width="5" height="5" fill="#1a1a2e"/><rect x="55" y="45" width="5" height="5" fill="#1a1a2e"/><rect x="75" y="45" width="5" height="5" fill="#1a1a2e"/><rect x="85" y="45" width="5" height="5" fill="#1a1a2e"/><rect x="35" y="55" width="5" height="5" fill="#1a1a2e"/><rect x="45" y="55" width="5" height="5" fill="#1a1a2e"/><rect x="65" y="55" width="5" height="5" fill="#1a1a2e"/><rect x="85" y="55" width="5" height="5" fill="#1a1a2e"/><rect x="35" y="65" width="5" height="5" fill="#1a1a2e"/><rect x="55" y="65" width="5" height="5" fill="#1a1a2e"/><rect x="65" y="65" width="5" height="5" fill="#1a1a2e"/><rect x="75" y="65" width="5" height="5" fill="#1a1a2e"/><rect x="85" y="65" width="5" height="5" fill="#1a1a2e"/><rect x="45" y="75" width="5" height="5" fill="#1a1a2e"/><rect x="65" y="75" width="5" height="5" fill="#1a1a2e"/><rect x="85" y="75" width="5" height="5" fill="#1a1a2e"/><rect x="35" y="85" width="5" height="5" fill="#1a1a2e"/><rect x="55" y="85" width="5" height="5" fill="#1a1a2e"/><rect x="75" y="85" width="5" height="5" fill="#1a1a2e"/><rect x="85" y="85" width="5" height="5" fill="#1a1a2e"/></svg></div><div class="valid">Valid: 2025/2026 Academic Year</div></div>
    </div></body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };
  return (
    <div className="sm-idcard-modal">
      <div className="sm-idcard-modal-inner">
        <div className="sm-idcard-modal-bar">
          <h3>Student ID Card</h3>
          <div className="sm-idcard-modal-btns">
            <button onClick={printCard}>
              <span className="material-symbols-outlined">print</span>Print
            </button>
            <button className="sm-idcard-modal-close" onClick={onClose}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        <div className="sm-idcard">
          <div className="sm-idcard-top">
            <div>
              <div className="sm-idcard-school">CCAST BAMBILI</div>
              <div className="sm-idcard-title">Student Identity Card</div>
            </div>
            <div className="sm-idcard-year">2025/2026</div>
          </div>
          <div className="sm-idcard-mid">
            <div className="sm-idcard-photo">
              {student.student_photo ? (
                <img src={student.student_photo} alt="" />
              ) : (
                <span>{initials(student.full_name)}</span>
              )}
            </div>
            <div className="sm-idcard-details">
              <div className="sm-idcard-name">{student.full_name}</div>
              <div>ADM: {student.admission_number}</div>
              <div>
                Class: {student.current_class || "—"}{" "}
                {student.current_section || ""}
              </div>
              <div>Gender: {student.gender}</div>
              <div>DOB: {student.date_of_birth || "—"}</div>
            </div>
          </div>
          <div className="sm-idcard-bot">
            <QRCodeVisual value={student.admission_number} size={60} />
            <div className="sm-idcard-valid">
              Valid: 2025/2026 Academic Year
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Reusable Info Row ── */
function InfoRow({ icon, label, value }) {
  return (
    <div className="sm-prow">
      <span className="material-symbols-outlined sm-prow-icon">{icon}</span>
      <span className="sm-prow-label">{label}</span>
      <span className="sm-prow-value">{value || "—"}</span>
    </div>
  );
}

/* ── Document Card ── */
function DocCard({ icon, label, value, onReplace }) {
  const ref = useRef();
  const has = value && value.length > 0;
  return (
    <div className={`sm-doc-card${has ? " sm-doc-has" : ""}`}>
      <span className="material-symbols-outlined sm-doc-icon">{icon}</span>
      <div className="sm-doc-info">
        <div className="sm-doc-label">{label}</div>
        <div className="sm-doc-val">
          {has ? (value instanceof File ? value.name : value) : "Not uploaded"}
        </div>
      </div>
      {has ? (
        <div className="sm-doc-actions">
          <button
            title="View"
            onClick={() =>
              typeof value === "string" && window.open(value, "_blank")
            }
          >
            <span className="material-symbols-outlined">visibility</span>
          </button>
          <button
            title="Download"
            onClick={() =>
              typeof value === "string" && toast("Download started")
            }
          >
            <span className="material-symbols-outlined">download</span>
          </button>
          <button title="Replace" onClick={() => ref.current?.click()}>
            <span className="material-symbols-outlined">swap_horiz</span>
          </button>
          <button
            title="Delete"
            className="sm-doc-del"
            onClick={() => toast("Document removed")}
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
          <input
            ref={ref}
            type="file"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files[0]) onReplace(e.target.files[0]);
              e.target.value = "";
            }}
          />
        </div>
      ) : (
        <button className="sm-doc-upload" onClick={() => ref.current?.click()}>
          <span className="material-symbols-outlined">cloud_upload</span>
          <input
            ref={ref}
            type="file"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files[0]) onReplace(e.target.files[0]);
              e.target.value = "";
            }}
          />
        </button>
      )}
    </div>
  );
}

/* ── Timeline Item ── */
function TimelineItem({ date, title, desc, tone }) {
  return (
    <div className="sm-tl-item">
      <div className={`sm-tl-dot sm-tl-dot-${tone || "gray"}`}></div>
      <div className="sm-tl-body">
        <div className="sm-tl-title">{title}</div>
        <div className="sm-tl-desc">{desc}</div>
        <div className="sm-tl-date">{date}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PROFILE PAGE
   ═══════════════════════════════════════════ */
export default function StudentProfilePage() {
  const { id } = useParams();
  const location = useLocation();
  const nav = useNavigate();
  const student = location.state?.student;
  const initialTab = location.state?.tab || "overview";
  const [tab, setTab] = useState(initialTab);
  const [showID, setShowID] = useState(false);

  if (!student) {
    return (
      <div
        className="sm-page"
        style={{ textAlign: "center", padding: "80px 20px" }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 64, color: "var(--outline)" }}
        >
          person_off
        </span>
        <h2 style={{ marginTop: 16 }}>Student not found</h2>
        <p className="text-secondary">
          Navigate from the students list, or the student may have been removed.
        </p>
        <button
          className="btn btn-primary mt-3"
          onClick={() => nav("/students")}
        >
          Back to Students
        </button>
      </div>
    );
  }

  const s = student;

  return (
    <div className="sm-profile">
      {/* ── Header ── */}
      <div className="sm-profile-header">
        <button className="sm-profile-back" onClick={() => nav("/students")}>
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="sm-profile-back-text">Back to Students</span>
        </button>
        <div className="sm-profile-hero">
          <div
            className="sm-profile-photo"
            onClick={() => setShowID(true)}
            title="Click to view ID Card"
          >
            {s.student_photo ? (
              <img src={s.student_photo} alt="" />
            ) : (
              <span>{initials(s.full_name)}</span>
            )}
          </div>
          <div className="sm-profile-hero-info">
            <h1>{s.full_name}</h1>
            <div className="sm-profile-hero-meta">
              <span className="sm-adm">{s.admission_number}</span>
              <span className="sm-sep">·</span>
              <span>
                {s.current_class || "—"}
                {s.current_section ? " " + s.current_section : ""}
              </span>
              <span className="sm-sep">·</span>
              <span>
                {s.boarding_status === "boarding" ? "Boarding" : "Day"}
              </span>
              <span
                className={`sm-status sm-status-${STATUS_TONE[s.status] ?? "gray"} sm-profile-status`}
              >
                {STATUS_LABEL[s.status] ?? s.status}
              </span>
            </div>
          </div>
          <div className="sm-profile-hero-actions">
            <button
              onClick={() =>
                nav(`/students/${s.id}/edit`, { state: { student: s } })
              }
            >
              <span className="material-symbols-outlined">edit</span>
              <span className="sm-hero-btn-text">Edit</span>
            </button>
            <button onClick={() => setShowID(true)}>
              <span className="material-symbols-outlined">badge</span>
              <span className="sm-hero-btn-text">ID Card</span>
            </button>
            <button onClick={() => window.print()}>
              <span className="material-symbols-outlined">print</span>
              <span className="sm-hero-btn-text">Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="sm-profile-tabs">
        <div className="sm-profile-tabs-scroll">
          {PROFILE_TABS.map((t) => (
            <button
              key={t.key}
              className={`sm-ptab${tab === t.key ? " active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              <span className="material-symbols-outlined">{t.icon}</span>
              <span className="sm-ptab-text">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="sm-profile-content">
        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="sm-tab-grid">
            <div className="sm-pcard sm-pcard-wide">
              <div className="sm-pcard-hd">
                <span className="material-symbols-outlined">person</span>
                Personal Information
              </div>
              <div className="sm-pcard-body">
                <InfoRow
                  icon="badge"
                  label="Admission Number"
                  value={s.admission_number}
                />
                <InfoRow
                  icon="calendar_month"
                  label="Date of Birth"
                  value={s.date_of_birth}
                />
                <InfoRow
                  icon="location_on"
                  label="Place of Birth"
                  value={s.place_of_birth}
                />
                <InfoRow
                  icon="flag"
                  label="Nationality"
                  value={s.nationality}
                />
                <InfoRow icon="male" label="Gender" value={s.gender} />
                <InfoRow
                  icon="translate"
                  label="English Level"
                  value={s.english_level}
                />
                <InfoRow icon="home" label="Address" value={s.address} />
                <InfoRow icon="domain" label="House" value={s.house} />
                <InfoRow
                  icon="bed"
                  label="Boarding Status"
                  value={s.boarding_status === "boarding" ? "Boarding" : "Day"}
                />
                <InfoRow icon="phone" label="Phone" value={s.phone} />
                <InfoRow icon="mail" label="Email" value={s.email} />
              </div>
            </div>
            <div className="sm-pcard">
              <div className="sm-pcard-hd">
                <span className="material-symbols-outlined">school</span>
                Academic Summary
              </div>
              <div className="sm-pcard-body">
                <InfoRow
                  icon="layers"
                  label="Current Class"
                  value={`${s.current_class || "—"} ${s.current_section || ""}`}
                />
                <InfoRow icon="trending_up" label="Average" value="—" />
                <InfoRow icon="emoji_events" label="Position" value="—" />
                <InfoRow icon="auto_stories" label="Subjects" value="—" />
                <InfoRow
                  icon="arrow_upward"
                  label="Promotion Status"
                  value="—"
                />
              </div>
            </div>
            <div className="sm-pcard">
              <div className="sm-pcard-hd">
                <span className="material-symbols-outlined">
                  event_available
                </span>
                Attendance Summary
              </div>
              <div className="sm-attend-stats">
                <div className="sm-attend-stat">
                  <span className="sm-attend-num">—</span>
                  <span className="sm-attend-label">Present</span>
                </div>
                <div className="sm-attend-stat">
                  <span className="sm-attend-num">—</span>
                  <span className="sm-attend-label">Absent</span>
                </div>
                <div className="sm-attend-stat">
                  <span className="sm-attend-num">—</span>
                  <span className="sm-attend-label">Late</span>
                </div>
                <div className="sm-attend-stat sm-attend-rate">
                  <span className="sm-attend-num">—%</span>
                  <span className="sm-attend-label">Rate</span>
                </div>
              </div>
            </div>
            <div className="sm-pcard">
              <div className="sm-pcard-hd">
                <span className="material-symbols-outlined">payments</span>Fee
                Summary
              </div>
              <div className="sm-pcard-body">
                <InfoRow
                  icon="account_balance_wallet"
                  label="Total Fees"
                  value="—"
                />
                <InfoRow icon="check_circle" label="Paid" value="—" />
                <InfoRow icon="error" label="Balance" value="—" />
                <InfoRow icon="schedule" label="Last Payment" value="—" />
              </div>
            </div>
            <div className="sm-pcard">
              <div className="sm-pcard-hd sm-pcard-hd-emergency">
                <span className="material-symbols-outlined">emergency</span>
                Emergency Contact
              </div>
              <div className="sm-pcard-body">
                <InfoRow icon="person" label="Name" value={s.emergency_name} />
                <InfoRow
                  icon="family_restroom"
                  label="Relationship"
                  value={s.emergency_relationship}
                />
                <InfoRow icon="phone" label="Phone" value={s.emergency_phone} />
                <InfoRow
                  icon="phone_forwarded"
                  label="Alt. Phone"
                  value={s.emergency_alt_phone}
                />
                <InfoRow
                  icon="home"
                  label="Address"
                  value={s.emergency_address}
                />
              </div>
            </div>
            <div className="sm-pcard">
              <div className="sm-pcard-hd">
                <span className="material-symbols-outlined">qr_code_2</span>QR
                Code
              </div>
              <div className="sm-pcard-body sm-qr-body">
                <QRCodeVisual value={s.admission_number} size={120} />
                <p
                  className="text-secondary"
                  style={{ fontSize: 12, marginTop: 8 }}
                >
                  Scan to view student profile
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── ACADEMIC ── */}
        {tab === "academic" && (
          <div className="sm-tab-grid">
            <div className="sm-pcard sm-pcard-wide">
              <div className="sm-pcard-hd">
                <span className="material-symbols-outlined">auto_stories</span>
                Academic Record
              </div>
              <div className="sm-pcard-body">
                <InfoRow
                  icon="layers"
                  label="Current Class"
                  value={`${s.current_class || "—"} ${s.current_section || ""}`}
                />
                <InfoRow
                  icon="school"
                  label="Previous School"
                  value={s.previous_school}
                />
                <InfoRow
                  icon="location_on"
                  label="Previous School Address"
                  value={s.previous_school_address}
                />
                <InfoRow
                  icon="calendar_month"
                  label="Admission Date"
                  value={s.admission_date}
                />
                <InfoRow icon="trending_up" label="Current Average" value="—" />
                <InfoRow
                  icon="emoji_events"
                  label="Current Position"
                  value="—"
                />
                <InfoRow
                  icon="arrow_upward"
                  label="Promotion Status"
                  value="—"
                />
              </div>
            </div>
            <div className="sm-pcard sm-pcard-wide">
              <div className="sm-pcard-hd">
                <span className="material-symbols-outlined">menu_book</span>
                Enrolled Subjects
              </div>
              <div className="sm-empty-state">
                <span className="material-symbols-outlined">library_books</span>
                <p>Subject enrollment data will appear here.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── ATTENDANCE ── */}
        {tab === "attendance" && (
          <div className="sm-tab-grid">
            <div className="sm-pcard sm-pcard-wide">
              <div className="sm-pcard-hd">
                <span className="material-symbols-outlined">bar_chart</span>
                Attendance Overview
              </div>
              <div className="sm-attend-stats sm-attend-stats-lg">
                <div className="sm-attend-stat">
                  <span className="sm-attend-num">—</span>
                  <span className="sm-attend-label">Total Days</span>
                </div>
                <div className="sm-attend-stat sm-attend-present">
                  <span className="sm-attend-num">—</span>
                  <span className="sm-attend-label">Present</span>
                </div>
                <div className="sm-attend-stat sm-attend-absent">
                  <span className="sm-attend-num">—</span>
                  <span className="sm-attend-label">Absent</span>
                </div>
                <div className="sm-attend-stat sm-attend-late">
                  <span className="sm-attend-num">—</span>
                  <span className="sm-attend-label">Late</span>
                </div>
                <div className="sm-attend-stat sm-attend-rate">
                  <span className="sm-attend-num">—%</span>
                  <span className="sm-attend-label">Rate</span>
                </div>
              </div>
            </div>
            <div className="sm-pcard sm-pcard-wide">
              <div className="sm-pcard-hd">
                <span className="material-symbols-outlined">
                  calendar_month
                </span>
                Attendance Records
              </div>
              <div className="sm-empty-state">
                <span className="material-symbols-outlined">
                  event_available
                </span>
                <p>Attendance records will appear here.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── PARENTS ── */}
        {tab === "parents" && (
          <div className="sm-tab-grid">
            <div className="sm-pcard">
              <div className="sm-pcard-hd">
                <span className="material-symbols-outlined">man</span>Father
              </div>
              <div className="sm-pcard-body">
                <InfoRow icon="person" label="Name" value={s.father_name} />
                <InfoRow
                  icon="work"
                  label="Occupation"
                  value={s.father_occupation}
                />
                <InfoRow icon="phone" label="Phone" value={s.father_phone} />
                <InfoRow
                  icon="chat"
                  label="WhatsApp"
                  value={s.father_whatsapp}
                />
                <InfoRow icon="mail" label="Email" value={s.father_email} />
                <InfoRow icon="home" label="Address" value={s.father_address} />
              </div>
            </div>
            <div className="sm-pcard">
              <div className="sm-pcard-hd">
                <span className="material-symbols-outlined">woman</span>Mother
              </div>
              <div className="sm-pcard-body">
                <InfoRow icon="person" label="Name" value={s.mother_name} />
                <InfoRow
                  icon="work"
                  label="Occupation"
                  value={s.mother_occupation}
                />
                <InfoRow icon="phone" label="Phone" value={s.mother_phone} />
                <InfoRow icon="mail" label="Email" value={s.mother_email} />
                <InfoRow icon="home" label="Address" value={s.mother_address} />
              </div>
            </div>
            <div className="sm-pcard sm-pcard-wide">
              <div className="sm-pcard-hd">
                <span className="material-symbols-outlined">
                  supervisor_account
                </span>
                Guardian
              </div>
              <div className="sm-pcard-body">
                <InfoRow icon="person" label="Name" value={s.guardian_name} />
                <InfoRow
                  icon="family_restroom"
                  label="Relationship"
                  value={s.guardian_relationship}
                />
                <InfoRow icon="phone" label="Phone" value={s.guardian_phone} />
                <InfoRow
                  icon="work"
                  label="Occupation"
                  value={s.guardian_occupation}
                />
                <InfoRow
                  icon="home"
                  label="Address"
                  value={s.guardian_address}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── MEDICAL ── */}
        {tab === "medical" && (
          <div className="sm-tab-grid">
            <div className="sm-pcard sm-pcard-wide">
              <div className="sm-pcard-hd">
                <span className="material-symbols-outlined">
                  medical_information
                </span>
                Medical Information
              </div>
              <div className="sm-pcard-body">
                <InfoRow
                  icon="water_drop"
                  label="Blood Group"
                  value={s.blood_group}
                />
                <InfoRow icon="biotech" label="Genotype" value={s.genotype} />
                <InfoRow icon="warning" label="Allergies" value={s.allergies} />
                <InfoRow
                  icon="accessible"
                  label="Disabilities"
                  value={s.disabilities}
                />
                <InfoRow
                  icon="health_and_safety"
                  label="Medical Conditions"
                  value={s.medical_conditions}
                />
                <InfoRow
                  icon="medication"
                  label="Medication"
                  value={s.medication}
                />
                <InfoRow
                  icon="stethoscope"
                  label="Doctor"
                  value={s.doctor_name}
                />
                <InfoRow
                  icon="local_hospital"
                  label="Hospital"
                  value={s.hospital}
                />
                <InfoRow
                  icon="verified_user"
                  label="Medical Insurance"
                  value={s.medical_insurance}
                />
              </div>
            </div>
            <div className="sm-pcard">
              <div className="sm-pcard-hd">
                <span className="material-symbols-outlined">monitor_heart</span>
                Physical
              </div>
              <div className="sm-pcard-body">
                <InfoRow
                  icon="height"
                  label="Height"
                  value={s.height ? `${s.height} cm` : ""}
                />
                <InfoRow
                  icon="monitor_weight"
                  label="Weight"
                  value={s.weight ? `${s.weight} kg` : ""}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {tab === "documents" && (
          <div className="sm-tab-grid">
            <div className="sm-pcard sm-pcard-wide">
              <div className="sm-pcard-hd">
                <span className="material-symbols-outlined">folder_open</span>
                Uploaded Documents
              </div>
              <div className="sm-docs-grid">
                <DocCard
                  icon="description"
                  label="Birth Certificate"
                  value={s.birth_certificate}
                  onReplace={() => toast("Replace birth certificate")}
                />
                <DocCard
                  icon="assessment"
                  label="Previous Report Card"
                  value={s.previous_report_card}
                  onReplace={() => toast("Replace report card")}
                />
                <DocCard
                  icon="medical_services"
                  label="Medical Report"
                  value={s.medical_report}
                  onReplace={() => toast("Replace medical report")}
                />
                <DocCard
                  icon="photo_camera"
                  label="Passport Photo"
                  value={s.passport_photo}
                  onReplace={() => toast("Replace passport photo")}
                />
                <DocCard
                  icon="swap_horiz"
                  label="Transfer Certificate"
                  value={s.transfer_certificate}
                  onReplace={() => toast("Replace transfer certificate")}
                />
                <DocCard
                  icon="school"
                  label="Previous School Certificate"
                  value={s.previous_school_certificate}
                  onReplace={() => toast("Replace school certificate")}
                />
                <DocCard
                  icon="badge"
                  label="Student Half Card"
                  value={s.half_card}
                  onReplace={() => toast("Replace half card")}
                />
                <DocCard
                  icon="mail"
                  label="Admission Letter"
                  value={s.admission_letter}
                  onReplace={() => toast("Replace admission letter")}
                />
                <DocCard
                  icon="badge"
                  label="Parent ID"
                  value={s.parent_id}
                  onReplace={() => toast("Replace parent ID")}
                />
                <DocCard
                  icon="badge"
                  label="Guardian ID"
                  value={s.guardian_id}
                  onReplace={() => toast("Replace guardian ID")}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── FEES ── */}
        {tab === "fees" && (
          <div className="sm-tab-grid">
            <div className="sm-pcard sm-pcard-wide">
              <div className="sm-pcard-hd">
                <span className="material-symbols-outlined">
                  account_balance_wallet
                </span>
                Fee Summary
              </div>
              <div className="sm-fee-stats">
                <div className="sm-fee-stat">
                  <span className="sm-fee-num">—</span>
                  <span className="sm-fee-label">Total Fees</span>
                </div>
                <div className="sm-fee-stat sm-fee-paid">
                  <span className="sm-fee-num">—</span>
                  <span className="sm-fee-label">Paid</span>
                </div>
                <div className="sm-fee-stat sm-fee-balance">
                  <span className="sm-fee-num">—</span>
                  <span className="sm-fee-label">Balance</span>
                </div>
                <div className="sm-fee-stat">
                  <span className="sm-fee-num">—</span>
                  <span className="sm-fee-label">Last Payment</span>
                </div>
              </div>
            </div>
            <div className="sm-pcard sm-pcard-wide">
              <div className="sm-pcard-hd">
                <span className="material-symbols-outlined">receipt_long</span>
                Payment History
              </div>
              <div className="sm-empty-state">
                <span className="material-symbols-outlined">payments</span>
                <p>Payment records will appear here.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── DISCIPLINE ── */}
        {tab === "discipline" && (
          <div className="sm-tab-grid">
            <div className="sm-pcard sm-pcard-wide">
              <div className="sm-pcard-hd">
                <span className="material-symbols-outlined">gavel</span>
                Discipline Records
              </div>
              <div className="sm-disc-stats">
                <div className="sm-disc-stat">
                  <span className="sm-disc-num">—</span>
                  <span className="sm-disc-label">Warnings</span>
                </div>
                <div className="sm-disc-stat sm-disc-susp">
                  <span className="sm-disc-num">—</span>
                  <span className="sm-disc-label">Suspensions</span>
                </div>
                <div className="sm-disc-stat sm-disc-merit">
                  <span className="sm-disc-num">—</span>
                  <span className="sm-disc-label">Merits</span>
                </div>
                <div className="sm-disc-stat sm-disc-demerit">
                  <span className="sm-disc-num">—</span>
                  <span className="sm-disc-label">Demerits</span>
                </div>
              </div>
            </div>
            <div className="sm-pcard sm-pcard-wide">
              <div className="sm-pcard-hd">
                <span className="material-symbols-outlined">notes</span>
                Discipline Notes
              </div>
              <div className="sm-empty-state">
                <span className="material-symbols-outlined">gavel</span>
                <p>No discipline records yet.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── TIMELINE ── */}
        {tab === "timeline" && (
          <div className="sm-pcard sm-pcard-wide">
            <div className="sm-pcard-hd">
              <span className="material-symbols-outlined">history</span>Student
              Timeline
            </div>
            <div className="sm-tl">
              <TimelineItem
                date={s.admission_date || "—"}
                title="Student Admitted"
                desc={`Admitted as ${s.admission_number}`}
                tone="green"
              />
              <TimelineItem
                date="—"
                title="Assigned to Class"
                desc={`${s.current_class || "—"} ${s.current_section || ""}`}
                tone="blue"
              />
              <TimelineItem
                date="—"
                title="Report Card Uploaded"
                desc="Previous year report card"
                tone="purple"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── ID Card Modal ── */}
      {showID && <StudentIDCard student={s} onClose={() => setShowID(false)} />}
    </div>
  );
}
