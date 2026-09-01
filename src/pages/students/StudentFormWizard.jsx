// src/pages/students/StudentFormWizard.jsx

import { useState, useRef, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useSaveStudent } from "../../api/students";
import { useClasses } from "../../api/academic";
import "./StudentsPage.css";

const BLANK = {
  admission_number: "",
  first_name: "",
  last_name: "",
  gender: "male",
  date_of_birth: "",
  place_of_birth: "",
  nationality: "Cameroonian",
  phone: "",
  email: "",
  address: "",
  house: "",
  status: "active",
  student_photo: null,
  class_id: "",
  section_id: "",
  boarding_status: "day",
  admission_date: "",
  previous_school: "",
  previous_school_address: "",
  
  // Father - WITH EMAIL
  father_name: "",
  father_phone: "",
  father_whatsapp: "",
  father_email: "",
  father_address: "",
  father_occupation: "",
  
  // Mother - WITH EMAIL
  mother_name: "",
  mother_phone: "",
  mother_whatsapp: "",
  mother_email: "",
  mother_address: "",
  mother_occupation: "",
  
  // Guardian - WITH EMAIL
  guardian_name: "",
  guardian_relationship: "",
  guardian_phone: "",
  guardian_email: "",  // ← ADDED
  guardian_address: "",
  guardian_occupation: "",
  guardian_photo: null,
  
  // Emergency
  emergency_name: "",
  emergency_relationship: "",
  emergency_phone: "",
  emergency_alt_phone: "",
  emergency_address: "",
  
  // Medical
  blood_group: "",
  genotype: "",
  allergies: "",
  disabilities: "",
  medical_conditions: "",
  medication: "",
  doctor_name: "",
  hospital: "",
  medical_insurance: "",
  height: "",
  weight: "",
  
  // Documents
  birth_certificate: null,
  previous_report_card: null,
  medical_report: null,
  passport_photo: null,
  previous_school_certificate: null,
  other_files: null,
  transfer_certificate: null,
  half_card: null,
  admission_letter: null,
  parent_id: null,
  guardian_id: null,
};

const STEPS = [
  { key: "personal", label: "Personal Info", icon: "person" },
  { key: "academic", label: "Academic", icon: "school" },
  { key: "parent", label: "Parents", icon: "family_restroom" },
  { key: "guardian", label: "Guardian & Emergency", icon: "supervisor_account" },
  { key: "medical", label: "Medical", icon: "medical_information" },
  { key: "documents", label: "Documents", icon: "folder_open" },
  { key: "review", label: "Review & Submit", icon: "fact_check" },
];

// ============================================================
// FILE FIELD COMPONENT
// ============================================================
function FileField({ label, value, onChange, error }) {
  const ref = useRef();
  const isFile = value instanceof File;
  const isStr = typeof value === "string" && value.length > 0;
  
  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      <div className="sm-wiz-file" onClick={() => ref.current?.click()}>
        <input
          ref={ref}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files?.[0]) onChange(e.target.files[0]);
            e.target.value = "";
          }}
        />
        {isFile ? (
          <span className="sm-wiz-file-name">
            <span className="material-symbols-outlined">description</span>
            {value.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </span>
        ) : isStr ? (
          <span className="sm-wiz-file-name">
            <span className="material-symbols-outlined">attach_file</span>
            {value.split('/').pop()}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                ref.current?.click();
              }}
              className="sm-wiz-replace"
            >
              Replace
            </button>
          </span>
        ) : (
          <span className="sm-wiz-file-placeholder">
            <span className="material-symbols-outlined">cloud_upload</span>
            Click to upload
          </span>
        )}
      </div>
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

// ============================================================
// REVIEW COLUMN COMPONENT
// ============================================================
function ReviewCol({ label, value, wide }) {
  return (
    <div className={wide ? "col-12" : "col-md-4 col-sm-6"}>
      <div className="sm-review-item">
        <span className="sm-review-label">{label}</span>
        <span className="sm-review-value">{value || "—"}</span>
      </div>
    </div>
  );
}

// ============================================================
// MAIN FORM WIZARD
// ============================================================
export default function StudentFormWizard() {
  const { id } = useParams();
  const location = useLocation();
  const nav = useNavigate();
  const save = useSaveStudent();
  const { data: classesData } = useClasses();
  const classes = classesData?.data ?? [];
  const existing = location.state?.student;
  const isEdit = !!existing?.id;

  // Initialize form with existing data
  const initialForm = { ...BLANK };
  if (existing) {
    Object.keys(initialForm).forEach(key => {
      if (existing[key] !== undefined && existing[key] !== null) {
        initialForm[key] = existing[key];
      }
    });
  }

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [photoPreview, setPhotoPreview] = useState(existing?.student_photo || "");

  const setField = (field) => (e) => {
    setForm((s) => ({ ...s, [field]: e.target.value }));
  };

  const setFileField = (field) => (value) => {
    setForm((s) => ({ ...s, [field]: value }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((s) => ({ ...s, student_photo: file }));
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    setErrors({});

    try {
      const fd = new FormData();

      if (isEdit) {
        fd.append("id", existing.id);
        fd.append("_method", "PUT");
      }

      Object.entries(form).forEach(([key, value]) => {
        if (value instanceof File) {
          fd.append(key, value);
        } else if (value !== null && value !== undefined && value !== "") {
          fd.append(key, String(value));
        }
      });

      await save.mutateAsync(fd);
      toast.success(isEdit ? "Student updated" : "Student added successfully");
      nav("/students");

    } catch (err) {
      const serverErrors = err.response?.data?.errors || {};
      setErrors(serverErrors);
      toast.error(err.response?.data?.message || "Validation failed");
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="sm-wizard">
      {/* Header */}
      <div className="sm-wizard-head">
        <button className="sm-wizard-back" onClick={() => nav("/students")}>
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="sm-wizard-back-text">Cancel</span>
        </button>
        <h1>{isEdit ? "Edit Student" : "New Student Enrollment"}</h1>
      </div>

      {/* Progress Bar */}
      <div className="sm-wiz-progress">
        <div className="sm-wiz-progress-bar" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Step Indicators */}
      <div className="sm-wiz-steps">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            className={`sm-wiz-step${i === step ? " active" : ""}${i < step ? " done" : ""}`}
            onClick={() => i < step && setStep(i)}
          >
            <span className="sm-wiz-step-num">
              {i < step ? (
                <span className="material-symbols-outlined">check</span>
              ) : (
                i + 1
              )}
            </span>
            <span className="sm-wiz-step-label">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Step Content */}
      <div className="surface-card sm-wiz-body">
        {/* ============================================================
            STEP 0: PERSONAL INFORMATION
            ============================================================ */}
        {step === 0 && (
          <div className="sm-wiz-section">
            <div className="sm-wiz-section-hd">
              <span className="material-symbols-outlined">person</span>
              Personal Information
            </div>
            
            <div className="sm-wiz-photo-row">
              <div
                className="sm-wiz-photo"
                onClick={() => document.getElementById("wiz-photo-input")?.click()}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="" />
                ) : (
                  <span className="material-symbols-outlined">add_a_photo</span>
                )}
              </div>
              <input
                id="wiz-photo-input"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePhoto}
              />
              <div>
                <div className="fw-semibold">Student Photo</div>
                <div className="text-secondary" style={{ fontSize: 13 }}>
                  Click to upload passport-size photo
                </div>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Admission Number <span className="text-danger">*</span></label>
                  <input
                    className="form-control"
                    value={form.admission_number}
                    onChange={setField("admission_number")}
                  />
                  {errors.admission_number && <div className="field-error">{errors.admission_number}</div>}
                </div>
              </div>
              <div className="col-md-3">
                <div className="field-group">
                  <label className="field-label">First Name <span className="text-danger">*</span></label>
                  <input
                    className="form-control"
                    value={form.first_name}
                    onChange={setField("first_name")}
                  />
                  {errors.first_name && <div className="field-error">{errors.first_name}</div>}
                </div>
              </div>
              <div className="col-md-3">
                <div className="field-group">
                  <label className="field-label">Last Name <span className="text-danger">*</span></label>
                  <input
                    className="form-control"
                    value={form.last_name}
                    onChange={setField("last_name")}
                  />
                  {errors.last_name && <div className="field-error">{errors.last_name}</div>}
                </div>
              </div>
              <div className="col-md-3">
                <div className="field-group">
                  <label className="field-label">Gender <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    value={form.gender}
                    onChange={setField("gender")}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  {errors.gender && <div className="field-error">{errors.gender}</div>}
                </div>
              </div>
              <div className="col-md-3">
                <div className="field-group">
                  <label className="field-label">Date of Birth <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.date_of_birth ?? ""}
                    onChange={setField("date_of_birth")}
                  />
                  {errors.date_of_birth && <div className="field-error">{errors.date_of_birth}</div>}
                </div>
              </div>
              <div className="col-md-3">
                <div className="field-group">
                  <label className="field-label">Place of Birth</label>
                  <input
                    className="form-control"
                    value={form.place_of_birth ?? ""}
                    onChange={setField("place_of_birth")}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="field-group">
                  <label className="field-label">Nationality</label>
                  <input
                    className="form-control"
                    value={form.nationality ?? ""}
                    onChange={setField("nationality")}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="field-group">
                  <label className="field-label">Address</label>
                  <input
                    className="form-control"
                    value={form.address ?? ""}
                    onChange={setField("address")}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="field-group">
                  <label className="field-label">Phone</label>
                  <input
                    className="form-control"
                    value={form.phone ?? ""}
                    onChange={setField("phone")}
                  />
                  {errors.phone && <div className="field-error">{errors.phone}</div>}
                </div>
              </div>
              <div className="col-md-4">
                <div className="field-group">
                  <label className="field-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={form.email ?? ""}
                    onChange={setField("email")}
                  />
                  {errors.email && <div className="field-error">{errors.email}</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            STEP 1: ACADEMIC INFORMATION
            ============================================================ */}
        {step === 1 && (
          <div className="sm-wiz-section">
            <div className="sm-wiz-section-hd">
              <span className="material-symbols-outlined">school</span>
              Academic Information
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Class</label>
                  <select
                    className="form-select"
                    value={form.class_id ?? ""}
                    onChange={setField("class_id")}
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.class_id && <div className="field-error">{errors.class_id}</div>}
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Section</label>
                  <select
                    className="form-select"
                    value={form.section_id ?? ""}
                    onChange={setField("section_id")}
                  >
                    <option value="">Select Section</option>
                    {(classes.find((c) => String(c.id) === String(form.class_id))?.sections ?? []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {errors.section_id && <div className="field-error">{errors.section_id}</div>}
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Admission Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.admission_date ?? ""}
                    onChange={setField("admission_date")}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Status</label>
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={setField("status")}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="transferred">Transferred</option>
                    <option value="graduated">Passed Out</option>
                    <option value="suspended">Suspended</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Boarding Status</label>
                  <select
                    className="form-select"
                    value={form.boarding_status ?? "day"}
                    onChange={setField("boarding_status")}
                  >
                    <option value="day">Day Student</option>
                    <option value="boarding">Boarder</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">House</label>
                  <input
                    className="form-control"
                    value={form.house ?? ""}
                    onChange={setField("house")}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Previous School</label>
                  <input
                    className="form-control"
                    value={form.previous_school ?? ""}
                    onChange={setField("previous_school")}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Previous School Address</label>
                  <input
                    className="form-control"
                    value={form.previous_school_address ?? ""}
                    onChange={setField("previous_school_address")}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            STEP 2: PARENTS INFORMATION
            ============================================================ */}
        {step === 2 && (
          <div className="sm-wiz-section">
            {/* Father */}
            <div className="sm-wiz-section-hd">
              <span className="material-symbols-outlined">man</span>
              Father Information
            </div>
            <div className="row g-3">
              <div className="col-md-4">
                <div className="field-group">
                  <label className="field-label">Father's Name</label>
                  <input
                    className="form-control"
                    value={form.father_name ?? ""}
                    onChange={setField("father_name")}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="field-group">
                  <label className="field-label">Phone</label>
                  <input
                    className="form-control"
                    value={form.father_phone ?? ""}
                    onChange={setField("father_phone")}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="field-group">
                  <label className="field-label">WhatsApp</label>
                  <input
                    className="form-control"
                    value={form.father_whatsapp ?? ""}
                    onChange={setField("father_whatsapp")}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={form.father_email ?? ""}
                    onChange={setField("father_email")}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Address</label>
                  <input
                    className="form-control"
                    value={form.father_address ?? ""}
                    onChange={setField("father_address")}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Occupation</label>
                  <input
                    className="form-control"
                    value={form.father_occupation ?? ""}
                    onChange={setField("father_occupation")}
                  />
                </div>
              </div>
            </div>

            {/* Mother */}
            <div className="sm-wiz-section-hd" style={{ marginTop: 28 }}>
              <span className="material-symbols-outlined">woman</span>
              Mother Information
            </div>
            <div className="row g-3">
              <div className="col-md-4">
                <div className="field-group">
                  <label className="field-label">Mother's Name</label>
                  <input
                    className="form-control"
                    value={form.mother_name ?? ""}
                    onChange={setField("mother_name")}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="field-group">
                  <label className="field-label">Phone</label>
                  <input
                    className="form-control"
                    value={form.mother_phone ?? ""}
                    onChange={setField("mother_phone")}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="field-group">
                  <label className="field-label">WhatsApp</label>
                  <input
                    className="form-control"
                    value={form.mother_whatsapp ?? ""}
                    onChange={setField("mother_whatsapp")}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={form.mother_email ?? ""}
                    onChange={setField("mother_email")}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Address</label>
                  <input
                    className="form-control"
                    value={form.mother_address ?? ""}
                    onChange={setField("mother_address")}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Occupation</label>
                  <input
                    className="form-control"
                    value={form.mother_occupation ?? ""}
                    onChange={setField("mother_occupation")}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            STEP 3: GUARDIAN & EMERGENCY
            ============================================================ */}
        {step === 3 && (
          <div className="sm-wiz-section">
            {/* Guardian */}
            <div className="sm-wiz-section-hd">
              <span className="material-symbols-outlined">supervisor_account</span>
              Guardian Information
            </div>
            <div className="row g-3">
              <div className="col-md-4">
                <div className="field-group">
                  <label className="field-label">Guardian Name</label>
                  <input
                    className="form-control"
                    value={form.guardian_name ?? ""}
                    onChange={setField("guardian_name")}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="field-group">
                  <label className="field-label">Relationship</label>
                  <input
                    className="form-control"
                    value={form.guardian_relationship ?? ""}
                    onChange={setField("guardian_relationship")}
                    placeholder="e.g. Uncle, Aunt"
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="field-group">
                  <label className="field-label">Phone</label>
                  <input
                    className="form-control"
                    value={form.guardian_phone ?? ""}
                    onChange={setField("guardian_phone")}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Email <span className="text-danger">*</span></label>
                  <input
                    type="email"
                    className="form-control"
                    value={form.guardian_email ?? ""}
                    onChange={setField("guardian_email")}
                    placeholder="Required for login credentials"
                  />
                  {errors.guardian_email && <div className="field-error">{errors.guardian_email}</div>}
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Address</label>
                  <input
                    className="form-control"
                    value={form.guardian_address ?? ""}
                    onChange={setField("guardian_address")}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Occupation</label>
                  <input
                    className="form-control"
                    value={form.guardian_occupation ?? ""}
                    onChange={setField("guardian_occupation")}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="sm-wiz-section-hd sm-wiz-section-hd-emergency" style={{ marginTop: 28 }}>
              <span className="material-symbols-outlined">emergency</span>
              Emergency Contact
            </div>
            <div className="row g-3">
              <div className="col-md-4">
                <div className="field-group">
                  <label className="field-label">Emergency Contact Name</label>
                  <input
                    className="form-control"
                    value={form.emergency_name ?? ""}
                    onChange={setField("emergency_name")}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="field-group">
                  <label className="field-label">Relationship</label>
                  <input
                    className="form-control"
                    value={form.emergency_relationship ?? ""}
                    onChange={setField("emergency_relationship")}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="field-group">
                  <label className="field-label">Phone</label>
                  <input
                    className="form-control"
                    value={form.emergency_phone ?? ""}
                    onChange={setField("emergency_phone")}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="field-group">
                  <label className="field-label">Alternate Phone</label>
                  <input
                    className="form-control"
                    value={form.emergency_alt_phone ?? ""}
                    onChange={setField("emergency_alt_phone")}
                  />
                </div>
              </div>
              <div className="col-md-8">
                <div className="field-group">
                  <label className="field-label">Address</label>
                  <input
                    className="form-control"
                    value={form.emergency_address ?? ""}
                    onChange={setField("emergency_address")}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            STEP 4: MEDICAL INFORMATION
            ============================================================ */}
        {step === 4 && (
          <div className="sm-wiz-section">
            <div className="sm-wiz-section-hd">
              <span className="material-symbols-outlined">medical_information</span>
              Medical Information
            </div>
            <div className="row g-3">
              <div className="col-md-3">
                <div className="field-group">
                  <label className="field-label">Blood Group</label>
                  <input
                    className="form-control"
                    value={form.blood_group ?? ""}
                    onChange={setField("blood_group")}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="field-group">
                  <label className="field-label">Genotype</label>
                  <input
                    className="form-control"
                    value={form.genotype ?? ""}
                    onChange={setField("genotype")}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="field-group">
                  <label className="field-label">Height (cm)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.height ?? ""}
                    onChange={setField("height")}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="field-group">
                  <label className="field-label">Weight (kg)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.weight ?? ""}
                    onChange={setField("weight")}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Allergies</label>
                  <input
                    className="form-control"
                    value={form.allergies ?? ""}
                    onChange={setField("allergies")}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Disabilities</label>
                  <input
                    className="form-control"
                    value={form.disabilities ?? ""}
                    onChange={setField("disabilities")}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Medical Conditions</label>
                  <input
                    className="form-control"
                    value={form.medical_conditions ?? ""}
                    onChange={setField("medical_conditions")}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Medication</label>
                  <input
                    className="form-control"
                    value={form.medication ?? ""}
                    onChange={setField("medication")}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Doctor Name</label>
                  <input
                    className="form-control"
                    value={form.doctor_name ?? ""}
                    onChange={setField("doctor_name")}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Hospital</label>
                  <input
                    className="form-control"
                    value={form.hospital ?? ""}
                    onChange={setField("hospital")}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="field-group">
                  <label className="field-label">Medical Insurance</label>
                  <input
                    className="form-control"
                    value={form.medical_insurance ?? ""}
                    onChange={setField("medical_insurance")}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            STEP 5: DOCUMENTS
            ============================================================ */}
        {step === 5 && (
          <div className="sm-wiz-section">
            <div className="sm-wiz-section-hd">
              <span className="material-symbols-outlined">folder_open</span>
              Upload Documents
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <FileField
                  label="Birth Certificate"
                  value={form.birth_certificate}
                  onChange={setFileField("birth_certificate")}
                />
              </div>
              <div className="col-md-6">
                <FileField
                  label="Previous Year Report Card"
                  value={form.previous_report_card}
                  onChange={setFileField("previous_report_card")}
                />
              </div>
              <div className="col-md-6">
                <FileField
                  label="Medical Report"
                  value={form.medical_report}
                  onChange={setFileField("medical_report")}
                />
              </div>
              <div className="col-md-6">
                <FileField
                  label="Passport Photo"
                  value={form.passport_photo}
                  onChange={setFileField("passport_photo")}
                />
              </div>
              <div className="col-md-6">
                <FileField
                  label="Previous School Certificate"
                  value={form.previous_school_certificate}
                  onChange={setFileField("previous_school_certificate")}
                />
              </div>
              <div className="col-md-6">
                <FileField
                  label="Transfer Certificate"
                  value={form.transfer_certificate}
                  onChange={setFileField("transfer_certificate")}
                />
              </div>
              <div className="col-md-6">
                <FileField
                  label="Half Card"
                  value={form.half_card}
                  onChange={setFileField("half_card")}
                />
              </div>
              <div className="col-md-6">
                <FileField
                  label="Admission Letter"
                  value={form.admission_letter}
                  onChange={setFileField("admission_letter")}
                />
              </div>
              <div className="col-md-6">
                <FileField
                  label="Parent ID Document"
                  value={form.parent_id}
                  onChange={setFileField("parent_id")}
                />
              </div>
              <div className="col-md-6">
                <FileField
                  label="Guardian ID Document"
                  value={form.guardian_id}
                  onChange={setFileField("guardian_id")}
                />
              </div>
              <div className="col-md-12">
                <FileField
                  label="Other Files"
                  value={form.other_files}
                  onChange={setFileField("other_files")}
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            STEP 6: REVIEW & SUBMIT
            ============================================================ */}
        {step === 6 && (
          <div className="sm-wiz-section">
            <div className="sm-wiz-section-hd">
              <span className="material-symbols-outlined">fact_check</span>
              Review & Submit
            </div>
            <div className="sm-wiz-review">
              <div className="sm-wiz-review-group">
                <h4>Personal Information</h4>
                <div className="row g-2">
                  <ReviewCol label="Admission #" value={form.admission_number} />
                  <ReviewCol label="Name" value={`${form.first_name} ${form.last_name}`} />
                  <ReviewCol label="Gender" value={form.gender} />
                  <ReviewCol label="DOB" value={form.date_of_birth} />
                  <ReviewCol label="Nationality" value={form.nationality} />
                  <ReviewCol label="Boarding" value={form.boarding_status} />
                  <ReviewCol label="Phone" value={form.phone} />
                  <ReviewCol label="Email" value={form.email} />
                  <ReviewCol label="Address" value={form.address} wide />
                </div>
              </div>

              <div className="sm-wiz-review-group">
                <h4>Parents</h4>
                <div className="row g-2">
                  <ReviewCol label="Father" value={form.father_name} wide />
                  <ReviewCol label="Father Phone" value={form.father_phone} />
                  <ReviewCol label="Father Email" value={form.father_email} />
                  <ReviewCol label="Mother" value={form.mother_name} wide />
                  <ReviewCol label="Mother Phone" value={form.mother_phone} />
                  <ReviewCol label="Mother Email" value={form.mother_email} />
                </div>
              </div>

              <div className="sm-wiz-review-group">
                <h4>Guardian & Emergency</h4>
                <div className="row g-2">
                  <ReviewCol label="Guardian" value={form.guardian_name} />
                  <ReviewCol label="Guardian Phone" value={form.guardian_phone} />
                  <ReviewCol label="Guardian Email" value={form.guardian_email} wide />
                  <ReviewCol label="Emergency Name" value={form.emergency_name} />
                  <ReviewCol label="Emergency Phone" value={form.emergency_phone} />
                </div>
              </div>

              <div className="sm-wiz-review-group">
                <h4>Medical</h4>
                <div className="row g-2">
                  <ReviewCol label="Blood Group" value={form.blood_group} />
                  <ReviewCol label="Genotype" value={form.genotype} />
                  <ReviewCol label="Allergies" value={form.allergies} />
                  <ReviewCol label="Medical Conditions" value={form.medical_conditions} />
                </div>
              </div>

              <div className="sm-wiz-review-group">
                <h4>Documents</h4>
                <div className="sm-wiz-review-docs">
                  {[
                    ["Birth Certificate", form.birth_certificate],
                    ["Report Card", form.previous_report_card],
                    ["Medical Report", form.medical_report],
                    ["Passport Photo", form.passport_photo],
                    ["Transfer Certificate", form.transfer_certificate],
                    ["Half Card", form.half_card],
                  ].map(([label, val]) => (
                    <span key={label} className={val ? "sm-wiz-doc-ok" : "sm-wiz-doc-missing"}>
                      <span className="material-symbols-outlined">
                        {val ? "check_circle" : "cancel"}
                      </span>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="sm-wiz-footer">
        <button className="btn btn-light" onClick={prev} disabled={step === 0}>
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="sm-wiz-footer-text">Previous</span>
        </button>
        <span className="sm-wiz-step-indicator">
          Step {step + 1} of {STEPS.length}
        </span>
        {step < STEPS.length - 1 ? (
          <button className="btn btn-primary" onClick={next}>
            <span className="sm-wiz-footer-text">Next</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        ) : (
          <button
            className="btn btn-success"
            onClick={submit}
            disabled={save.isPending}
            style={{ background: "#16a34a", color: "#fff", fontWeight: 700 }}
          >
            <span className="material-symbols-outlined">save</span>
            <span className="sm-wiz-footer-text">
              {save.isPending ? "Saving…" : isEdit ? "Save Changes" : "Enroll Student"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}