// src/pages/admission/AdmissionPage.jsx

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { submitAdmission } from '../../api/public';
import './AdmissionPage.css';

const STEPS = [
  { num: 1, label: 'Student Details', icon: 'fa-user' },
  { num: 2, label: 'Parent / Guardian', icon: 'fa-people-roof' },
  { num: 3, label: 'Education History', icon: 'fa-graduation-cap' },
  { num: 4, label: 'Documents', icon: 'fa-file-arrow-up' },
  { num: 5, label: 'Review & Submit', icon: 'fa-check-double' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CLASS_OPTIONS = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Lower Sixth', 'Upper Sixth'];
const RELATIONSHIP_OPTIONS = ['Father', 'Mother', 'Uncle', 'Aunt', 'Grandparent', 'Sibling', 'Legal Guardian', 'Other'];

/** Backend has no phone format rule (just string|max:40) — sanity-check digit count only. */
const isValidPhone = (v) => {
  const digits = v.replace(/[^\d]/g, '');
  return digits.length >= 6 && digits.length <= 15;
};

/** Computes age in whole years from a YYYY-MM-DD date string. Returns null if invalid/future. */
const calculateAge = (dobString) => {
  if (!dobString) return null;
  const dob = new Date(dobString);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
};

/** Mirrors AdmissionController::store()'s $currentAcademicYear computation exactly. */
const getCurrentAcademicYear = () => {
  const year = new Date().getFullYear();
  return `${year}/${year + 1}`;
};

// ============================================================
// FILE TYPE / SIZE RULES — mirrors AdmissionController::store()
// ============================================================
const MB = 1024 * 1024;
const PDF_TYPE = 'application/pdf';
const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const WORD_TYPES = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// student_photo / guardian_photo / passport_photo -> ['image'], max:4096 (4MB)
const IMAGE_RULE = { types: IMAGE_TYPES, maxSize: 4 * MB, accept: '.jpg,.jpeg,.png' };
// parent_id / guardian_id -> mimes:pdf,jpg,jpeg,png (NO doc/docx), max:5120 (5MB)
const ID_DOC_RULE = { types: [PDF_TYPE, ...IMAGE_TYPES], maxSize: 5 * MB, accept: '.pdf,.jpg,.jpeg,.png' };
// birth_certificate / previous_report_card / medical_report / previous_school_certificate /
// other_files / transfer_certificate / half_card -> mimes:pdf,jpg,jpeg,png,doc,docx, max:5120 (5MB)
const GENERAL_DOC_RULE = { types: [PDF_TYPE, ...IMAGE_TYPES, ...WORD_TYPES], maxSize: 5 * MB, accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png' };

/**
 * Frontend file-state key -> Laravel request field name.
 * Matches AdmissionController::DOCUMENT_MAP exactly (left-hand side of that map).
 * NOTE: 'admission_letter' is intentionally omitted — per
 * AdmissionApplication::GENERATED_DOCUMENT_FIELDS it's produced by the school
 * after acceptance, not something an applicant uploads.
 */
const DOCUMENT_MAP = {
  studentPhoto: 'student_photo',
  guardianPhoto: 'guardian_photo',
  birthCert: 'birth_certificate',
  reportCard: 'previous_report_card',
  medicalReport: 'medical_report',
  passportPhoto: 'passport_photo',
  previousSchoolCertificate: 'previous_school_certificate',
  otherFiles: 'other_files',
  transferCertificate: 'transfer_certificate',
  halfCard: 'half_card',
  parentId: 'parent_id',
  guardianId: 'guardian_id',
};

/**
 * Matches AdmissionApplication::REQUIRED_DOCUMENT_FIELDS
 * (student_photo, birth_certificate, previous_report_card, parent_id_document).
 * NOTE: Laravel's own validation marks every file field 'nullable' — this
 * requirement is a frontend/business rule only, not enforced by the 422
 * response, so a submission missing these will still be accepted server-side.
 */
const REQUIRED_DOCS = ['birthCert', 'reportCard', 'studentPhoto', 'parentId'];

/**
 * Config that drives Step 4 rendering — one source of truth instead of
 * hand-written, repeated upload blocks. Required docs listed first.
 */
const DOCUMENT_CONFIG = [
  { key: 'birthCert', label: 'Birth Certificate', hint: 'Government-issued scanned copy', required: true, icon: 'fa-file-shield', ...GENERAL_DOC_RULE },
  { key: 'reportCard', label: 'Previous Report Card', hint: 'Most recent academic report card', required: true, icon: 'fa-file-lines', ...GENERAL_DOC_RULE },
  { key: 'studentPhoto', label: "Student's Photo", hint: 'Recent passport-style photo', required: true, icon: 'fa-image', ...IMAGE_RULE },
  { key: 'parentId', label: "Parent's ID", hint: 'National ID card of parent', required: true, icon: 'fa-id-badge', ...ID_DOC_RULE },

  { key: 'passportPhoto', label: 'Passport Photograph', hint: 'White background, colour photo', required: false, icon: 'fa-camera', ...IMAGE_RULE },
  { key: 'guardianPhoto', label: "Guardian's Photo", hint: 'Recent passport-style photo', required: false, icon: 'fa-image', ...IMAGE_RULE },
  { key: 'medicalReport', label: 'Medical Report', hint: 'Optional medical/health record', required: false, icon: 'fa-notes-medical', ...GENERAL_DOC_RULE },
  { key: 'previousSchoolCertificate', label: 'Previous School Certificate', hint: 'Certificate from previous institution', required: false, icon: 'fa-certificate', ...GENERAL_DOC_RULE },
  { key: 'transferCertificate', label: 'Transfer Certificate', hint: 'If transferring mid-year', required: false, icon: 'fa-right-left', ...GENERAL_DOC_RULE },
  { key: 'halfCard', label: 'Half Card', hint: 'Previous school half card, if applicable', required: false, icon: 'fa-id-card', ...GENERAL_DOC_RULE },
  { key: 'guardianId', label: "Guardian's ID", hint: 'National ID card of guardian', required: false, icon: 'fa-id-badge', ...ID_DOC_RULE },
  { key: 'otherFiles', label: 'Other Supporting Document', hint: 'Anything else relevant to the application', required: false, icon: 'fa-paperclip', ...GENERAL_DOC_RULE },
];

/**
 * Laravel validation field name -> frontend formData/files key, so a 422
 * response maps back onto the right input regardless of which step it's on.
 */
const BACKEND_TO_FRONTEND_FIELD = {
  student_first_name: 'firstName',
  student_last_name: 'lastName',
  student_gender: 'gender',
  student_dob: 'dob',
  student_pob: 'pob',
  nationality: 'nationality',
  class_applying_for: 'classApplying',
  phone: 'phone',
  email: 'email',
  father_name: 'fatherName',
  father_phone: 'fatherPhone',
  father_address: 'fatherAddress',
  father_email: 'fatherEmail',
  mother_name: 'motherName',
  mother_phone: 'motherPhone',
  mother_address: 'motherAddress',
  mother_email: 'motherEmail',
  guardian_name: 'guardianName',
  guardian_relationship: 'guardianRelationship',
  guardian_phone: 'guardianPhone',
  guardian_email: 'guardianEmail',
  guardian_address: 'guardianAddress',
  emergency_name: 'emergencyName',
  emergency_relationship: 'emergencyRelationship',
  emergency_phone: 'emergencyPhone',
  previous_school: 'prevSchool',
  last_class: 'lastGrade',
  year_completed: 'yearCompleted',
  reason_for_leaving: 'reasonForLeaving',
  achievements: 'achievements',
  ...Object.fromEntries(Object.entries(DOCUMENT_MAP).map(([fe, be]) => [be, fe])),
};

const STEP_FOR_FIELD = (() => {
  const step1 = ['firstName', 'lastName', 'dob', 'gender', 'pob', 'nationality', 'classApplying', 'phone', 'email'];
  const step2 = ['fatherName', 'fatherPhone', 'fatherAddress', 'fatherEmail', 'motherName', 'motherPhone', 'motherAddress', 'motherEmail', 'guardianName', 'guardianRelationship', 'guardianPhone', 'guardianAddress', 'guardianEmail', 'emergencyName', 'emergencyRelationship', 'emergencyPhone'];
  const step3 = ['prevSchool', 'lastGrade', 'yearCompleted', 'reasonForLeaving', 'achievements'];
  const step4 = Object.keys(DOCUMENT_MAP);
  const map = {};
  step1.forEach((f) => (map[f] = 1));
  step2.forEach((f) => (map[f] = 2));
  step3.forEach((f) => (map[f] = 3));
  step4.forEach((f) => (map[f] = 4));
  return map;
})();

/* ===== Reusable field components (module scope so they keep focus) ===== */

function TextField({ label, name, value, onChange, error, type = 'text', placeholder, required, col = '12', ...rest }) {
  return (
    <div className={`col-md-${col} mb-3`}>
      <label htmlFor={name} className="adm-label">
        {label} {required && <span className="adm-req">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className={`adm-input ${error ? 'adm-input--err' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        {...rest}
      />
      {error && (
        <div id={`${name}-error`} className="adm-err mt-1" role="alert">
          <i className="fas fa-exclamation-circle me-1"></i>{error}
        </div>
      )}
    </div>
  );
}

function TextAreaField({ label, name, value, onChange, error, placeholder, required, col = '12', rows = 3 }) {
  return (
    <div className={`col-md-${col} mb-3`}>
      <label htmlFor={name} className="adm-label">
        {label} {required && <span className="adm-req">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        className={`adm-input adm-textarea ${error ? 'adm-input--err' : ''}`}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        aria-invalid={!!error}
      />
      {error && <div className="adm-err mt-1" role="alert"><i className="fas fa-exclamation-circle me-1"></i>{error}</div>}
    </div>
  );
}

function SelectField({ label, name, value, onChange, error, options, placeholder, required, col = '12' }) {
  return (
    <div className={`col-md-${col} mb-3`}>
      <label htmlFor={name} className="adm-label">
        {label} {required && <span className="adm-req">*</span>}
      </label>
      <select
        id={name}
        name={name}
        className={`adm-input adm-select ${error ? 'adm-input--err' : ''}`}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        aria-invalid={!!error}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <div className="adm-err mt-1" role="alert"><i className="fas fa-exclamation-circle me-1"></i>{error}</div>}
    </div>
  );
}

function validateFile(file, allowedTypes, maxSize) {
  if (!allowedTypes.includes(file.type)) {
    return 'Unsupported file type.';
  }
  if (file.size > maxSize) {
    return `File is too large (max ${(maxSize / MB).toFixed(0)}MB).`;
  }
  return null;
}

function FileUploadField({ config, file, error, onSelect, onRemove }) {
  const { key, label, hint, accept, types, maxSize, required, icon } = config;

  const handleChange = (e) => {
    const f = e.target.files[0];
    e.target.value = ''; // allow re-selecting the same file after removal
    if (!f) return;
    const err = validateFile(f, types, maxSize);
    onSelect(key, err ? null : f, err);
  };

  return (
    <div className="col-md-6">
      <div className={`adm-upload ${error ? 'adm-upload--err' : ''} ${file ? 'adm-upload--done' : ''}`}>
        <input
          type="file"
          accept={accept}
          id={key}
          onChange={handleChange}
          className="adm-upload-input"
          aria-invalid={!!error}
        />
        <label htmlFor={key} className="adm-upload-area">
          {file ? (
            <>
              <div className="adm-upload-done-ic"><i className="fas fa-check-circle"></i></div>
              <div className="adm-upload-done-txt">
                <div className="adm-upload-fname">{file.name}</div>
                <div className="adm-upload-fsize">{(file.size / 1024).toFixed(1)} KB</div>
              </div>
            </>
          ) : (
            <>
              <div className="adm-upload-ic"><i className={`fas ${icon}`}></i></div>
              <div className="adm-upload-txt">
                <div>{label} {required && <span className="adm-req">*</span>}</div>
                <small>{hint} &middot; max {(maxSize / MB).toFixed(0)}MB</small>
              </div>
            </>
          )}
        </label>
        {file && (
          <button
            type="button"
            className="adm-upload-remove"
            onClick={() => onRemove(key)}
            aria-label={`Remove ${label}`}
          >
            <i className="fas fa-xmark"></i>
          </button>
        )}
      </div>
      {error && <div className="adm-err mt-1" role="alert"><i className="fas fa-exclamation-circle me-1"></i>{error}</div>}
    </div>
  );
}

/* =============================== Page =============================== */

const initialFormData = {
  // Step 1 — student
  firstName: '', lastName: '', dob: '', gender: '', pob: '', nationality: 'Cameroonian',
  classApplying: '', phone: '', email: '',
  // Step 2 — father / mother / guardian
  fatherName: '', fatherPhone: '', fatherAddress: '', fatherEmail: '',
  motherName: '', motherPhone: '', motherAddress: '', motherEmail: '',
  guardianName: '', guardianRelationship: '', guardianPhone: '', guardianAddress: '', guardianEmail: '',
  emergencyName: '', emergencyRelationship: '', emergencyPhone: '',
  // Step 3 — education
  prevSchool: '', lastGrade: '', yearCompleted: '', reasonForLeaving: '', achievements: '',
  // Step 5
  declaration: false,
};

const initialFiles = Object.fromEntries(Object.keys(DOCUMENT_MAP).map((k) => [k, null]));

const AdmissionPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [animDir, setAnimDir] = useState('right');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState(initialFormData);
  const [files, setFiles] = useState(initialFiles);
  const [errors, setErrors] = useState({});

  const update = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleFileSelect = useCallback((key, file, error) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
    setErrors((prev) => {
      const next = { ...prev };
      if (error) {
        next[key] = error;
      } else {
        delete next[key];
      }
      return next;
    });
  }, []);

  const handleFileRemove = useCallback((key) => {
    setFiles((prev) => ({ ...prev, [key]: null }));
  }, []);

  /** Validates a single step and returns its error object (does not set state). */
  const getStepErrors = (s) => {
    const errs = {};
    if (s === 1) {
      if (!formData.firstName.trim()) errs.firstName = 'First name is required';
      if (!formData.lastName.trim()) errs.lastName = 'Last name is required';

      if (!formData.dob) {
        errs.dob = 'Date of birth is required';
      } else {
        const dobDate = new Date(formData.dob);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dobDate >= today) errs.dob = 'Date of birth must be in the past';
      }

      if (!formData.gender) errs.gender = 'Please select gender';

      // class_applying_for is `required` server-side (AdmissionController::store)
      if (!formData.classApplying) errs.classApplying = 'Please select the class you are applying for';

      if (formData.email.trim() && !EMAIL_RE.test(formData.email.trim())) {
        errs.email = 'Please enter a valid email address';
      }
      if (formData.phone.trim() && !isValidPhone(formData.phone)) {
        errs.phone = 'Please enter a valid phone number';
      }
    } else if (s === 2) {
      if (!formData.guardianName.trim()) errs.guardianName = "Guardian's full name is required";

      if (!formData.guardianRelationship) errs.guardianRelationship = "Guardian's relationship to student is required";

      if (!formData.guardianPhone.trim()) {
        errs.guardianPhone = "Guardian's phone number is required";
      } else if (!isValidPhone(formData.guardianPhone)) {
        errs.guardianPhone = 'Please enter a valid phone number';
      }

      if (!formData.guardianEmail.trim()) {
        errs.guardianEmail = "Guardian's email address is required (for login credentials)";
      } else if (!EMAIL_RE.test(formData.guardianEmail.trim())) {
        errs.guardianEmail = 'Please enter a valid email address';
      }

      if (formData.fatherEmail.trim() && !EMAIL_RE.test(formData.fatherEmail.trim())) {
        errs.fatherEmail = 'Please enter a valid email address';
      }
      if (formData.motherEmail.trim() && !EMAIL_RE.test(formData.motherEmail.trim())) {
        errs.motherEmail = 'Please enter a valid email address';
      }
      if (formData.fatherPhone.trim() && !isValidPhone(formData.fatherPhone)) {
        errs.fatherPhone = 'Please enter a valid phone number';
      }
      if (formData.motherPhone.trim() && !isValidPhone(formData.motherPhone)) {
        errs.motherPhone = 'Please enter a valid phone number';
      }

      // Emergency Contact — required
      if (!formData.emergencyName.trim()) errs.emergencyName = 'Emergency contact name is required';
      if (!formData.emergencyRelationship) errs.emergencyRelationship = 'Emergency contact relationship is required';

      if (!formData.emergencyPhone.trim()) {
        errs.emergencyPhone = 'Emergency contact phone number is required';
      } else if (!isValidPhone(formData.emergencyPhone)) {
        errs.emergencyPhone = 'Please enter a valid phone number';
      }
    } else if (s === 3) {
      if (!formData.prevSchool.trim()) errs.prevSchool = 'School name is required';
      if (!formData.lastGrade) errs.lastGrade = 'Please select last grade';

      if (formData.yearCompleted) {
        const yr = parseInt(formData.yearCompleted, 10);
        const currentYear = new Date().getFullYear();
        if (Number.isNaN(yr) || yr < 1900 || yr > currentYear) {
          errs.yearCompleted = `Year must be between 1900 and ${currentYear}`;
        }
      }
    } else if (s === 4) {
      REQUIRED_DOCS.forEach((key) => {
        if (!files[key]) {
          const cfg = DOCUMENT_CONFIG.find((d) => d.key === key);
          errs[key] = `${cfg.label} is required`;
        }
      });
    } else if (s === 5) {
      if (!formData.declaration) errs.declaration = 'You must accept the declaration';
    }
    return errs;
  };

  const validateStep = (s) => {
    const errs = getStepErrors(s);
    setErrors((prev) => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  /** Re-validates steps 1-4 before final submit; jumps to the first invalid step. */
  const validateAllSteps = () => {
    let firstInvalidStep = null;
    let allErrors = {};
    for (const s of [1, 2, 3, 4]) {
      const errs = getStepErrors(s);
      if (Object.keys(errs).length > 0) {
        allErrors = { ...allErrors, ...errs };
        if (firstInvalidStep === null) firstInvalidStep = s;
      }
    }
    if (firstInvalidStep !== null) {
      setErrors((prev) => ({ ...prev, ...allErrors }));
      setAnimDir('left');
      setStep(firstInvalidStep);
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) {
      toast.error('Please fill in the required fields.');
      return;
    }
    setAnimDir('right');
    setStep((s) => Math.min(s + 1, 5));
  };

  const goPrev = () => {
    setAnimDir('left');
    setStep((s) => Math.max(s - 1, 1));
  };

  const goToStep = (targetStep) => {
    // Only allow jumping to a step already completed — forward jumps must
    // go through goNext() so validation can't be skipped.
    if (targetStep < step) {
      setAnimDir('left');
      setStep(targetStep);
    }
  };

  /**
   * Build the FormData payload matching Laravel's expected field names
   * This is the CRITICAL fix for the 422 validation error
   */
  const buildPayload = () => {
    const payload = new FormData();

    // ============================================================
    // STUDENT INFORMATION - Must match Laravel field names exactly
    // ============================================================
    payload.append('student_first_name', formData.firstName.trim());
    payload.append('student_last_name', formData.lastName.trim());
    payload.append('student_gender', formData.gender);
    payload.append('student_dob', formData.dob);

    if (formData.pob.trim()) payload.append('student_pob', formData.pob.trim());
    if (formData.nationality.trim()) payload.append('nationality', formData.nationality.trim());
    payload.append('class_applying_for', formData.classApplying);

    if (formData.phone.trim()) payload.append('phone', formData.phone.trim());
    if (formData.email.trim()) payload.append('email', formData.email.trim());

    // Backend requires this to exactly equal `${currentYear}/${currentYear+1}` — see AdmissionController::store()
    payload.append('academic_year', getCurrentAcademicYear());

    // ============================================================
    // FATHER INFORMATION - With email field (Laravel expects this)
    // ============================================================
    if (formData.fatherName.trim()) payload.append('father_name', formData.fatherName.trim());
    if (formData.fatherPhone.trim()) payload.append('father_phone', formData.fatherPhone.trim());
    if (formData.fatherAddress.trim()) payload.append('father_address', formData.fatherAddress.trim());
    if (formData.fatherEmail.trim()) payload.append('father_email', formData.fatherEmail.trim());

    // ============================================================
    // MOTHER INFORMATION - With email field (Laravel expects this)
    // ============================================================
    if (formData.motherName.trim()) payload.append('mother_name', formData.motherName.trim());
    if (formData.motherPhone.trim()) payload.append('mother_phone', formData.motherPhone.trim());
    if (formData.motherAddress.trim()) payload.append('mother_address', formData.motherAddress.trim());
    if (formData.motherEmail.trim()) payload.append('mother_email', formData.motherEmail.trim());

    // ============================================================
    // GUARDIAN INFORMATION - REQUIRED fields
    // ============================================================
    payload.append('guardian_name', formData.guardianName.trim());
    payload.append('guardian_relationship', formData.guardianRelationship);
    payload.append('guardian_phone', formData.guardianPhone.trim());
    payload.append('guardian_email', formData.guardianEmail.trim());
    if (formData.guardianAddress.trim()) payload.append('guardian_address', formData.guardianAddress.trim());

    // ============================================================
    // EMERGENCY CONTACT - REQUIRED fields
    // ============================================================
    payload.append('emergency_name', formData.emergencyName.trim());
    payload.append('emergency_relationship', formData.emergencyRelationship);
    payload.append('emergency_phone', formData.emergencyPhone.trim());


    // ============================================================
    // EDUCATION HISTORY
    // ============================================================
    if (formData.prevSchool.trim()) payload.append('previous_school', formData.prevSchool.trim());
    if (formData.lastGrade) payload.append('last_class', formData.lastGrade);
    if (formData.yearCompleted) payload.append('year_completed', formData.yearCompleted);
    if (formData.reasonForLeaving.trim()) payload.append('reason_for_leaving', formData.reasonForLeaving.trim());
    if (formData.achievements.trim()) payload.append('achievements', formData.achievements.trim());

    // ============================================================
    // DOCUMENTS - Map frontend keys to Laravel field names
    // ============================================================
    Object.entries(DOCUMENT_MAP).forEach(([frontendKey, backendKey]) => {
      if (files[frontendKey]) {
        payload.append(backendKey, files[frontendKey]);
      }
    });

    return payload;
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      toast.error('Please accept the declaration to submit.');
      return;
    }
    if (!validateAllSteps()) {
      toast.error('Some earlier steps need attention — please review.');
      return;
    }

    setSubmitError('');
    setSubmitting(true);

    try {
      const payload = buildPayload();

      // Use the submitAdmission function which now handles FormData
      const res = await submitAdmission(payload);

      toast.success('Application submitted successfully! 🎉');
      navigate('/admission/success', {
        state: {
          applicationNumber: res.application_number,
          applicationId: res.id
        },
      });
    } catch (err) {
      console.error('❌ ADMISSION SUBMISSION ERROR:', err);

      // Handle validation errors from Laravel (422)
      if (err.response?.status === 422) {
        const validationErrors = err.response?.data?.errors;

        if (validationErrors) {

          const formattedErrors = {};
          let firstInvalidStep = null;

          // Map backend field names to frontend field names
          Object.entries(validationErrors).forEach(([backendField, messages]) => {
            const frontendField = BACKEND_TO_FRONTEND_FIELD[backendField] || backendField;
            formattedErrors[frontendField] = Array.isArray(messages) ? messages[0] : messages;

            const fieldStep = STEP_FOR_FIELD[frontendField];
            if (fieldStep && (firstInvalidStep === null || fieldStep < firstInvalidStep)) {
              firstInvalidStep = fieldStep;
            }

            // Show each validation error as a toast
            const message = Array.isArray(messages) ? messages[0] : messages;
            toast.error(`${backendField}: ${message}`);
          });

          setErrors((prev) => ({ ...prev, ...formattedErrors }));

          if (firstInvalidStep !== null) {
            setAnimDir('left');
            setStep(firstInvalidStep);
          }
        } else {
          const msg = err.response?.data?.message || 'Validation failed. Please check all fields.';
          setSubmitError(msg);
          toast.error(msg);
        }
      } else {
        // Handle other errors
        const msg = err.response?.data?.message || 'Could not submit your application. Please try again.';
        setSubmitError(msg);
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  /* ===== STEP RENDERERS ===== */

  const renderStep1 = () => (
    <div className="adm-card">
      <div className="adm-card-hd">
        <h2>Student Information</h2>
        <p>Enter the applicant's personal details as they appear on official documents.</p>
      </div>
      <div className="row">
        <TextField label="First Name" name="firstName" value={formData.firstName} onChange={update} error={errors.firstName} required col="6" placeholder="Enter first name" />
        <TextField label="Last Name" name="lastName" value={formData.lastName} onChange={update} error={errors.lastName} required col="6" placeholder="Enter last name" />
        <div className="col-md-6 mb-3">
          <TextField
            label="Date of Birth" name="dob" value={formData.dob} onChange={update} error={errors.dob}
            type="date" required col="12" max={new Date().toISOString().split('T')[0]}
          />
          {formData.dob && !errors.dob && (
            (() => {
              const age = calculateAge(formData.dob);
              return age !== null ? (
                <div className="adm-age-hint">
                  <i className="fas fa-cake-candles me-1"></i>
                  Applicant is <strong>{age}</strong> year{age !== 1 ? 's' : ''} old
                </div>
              ) : null;
            })()
          )}
        </div>
        <SelectField
          label="Gender" name="gender" value={formData.gender} onChange={update} error={errors.gender} required col="6"
          placeholder="Select gender"
          options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]}
        />
        <TextField label="Place of Birth" name="pob" value={formData.pob} onChange={update} col="6" placeholder="Town / city of birth" />
        <TextField label="Nationality" name="nationality" value={formData.nationality} onChange={update} col="6" placeholder="e.g. Cameroonian" />
        <SelectField
          label="Class Applying For" name="classApplying" value={formData.classApplying} onChange={update} error={errors.classApplying} required col="12"
          placeholder="Select class"
          options={CLASS_OPTIONS.map((v) => ({ value: v, label: v }))}
        />
        <TextField label="Student Phone (optional)" name="phone" value={formData.phone} onChange={update} error={errors.phone} type="tel" placeholder="+237 6XX XXX XXX" col="6" />
        <TextField label="Student Email (optional)" name="email" value={formData.email} onChange={update} error={errors.email} type="email" placeholder="student@example.com" col="6" />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="adm-card">
      <div className="adm-card-hd">
        <h2>Parent &amp; Guardian Information</h2>
        <p>Provide the father's, mother's and guardian's details. The guardian's email is required for login credentials.</p>
      </div>

      <div className="adm-fieldset-title"><i className="fas fa-person me-2"></i>Father's Details</div>
      <div className="row">
        <TextField label="Father's Full Name" name="fatherName" value={formData.fatherName} onChange={update} placeholder="Enter full name" col="12" />
        <TextField label="Phone Number" name="fatherPhone" value={formData.fatherPhone} onChange={update} error={errors.fatherPhone} type="tel" placeholder="+237 6XX XXX XXX" col="6" />
        <TextField label="Email" name="fatherEmail" value={formData.fatherEmail} onChange={update} error={errors.fatherEmail} type="email" placeholder="father@example.com" col="6" />
        <TextField label="Address" name="fatherAddress" value={formData.fatherAddress} onChange={update} placeholder="Residential address" col="12" />
      </div>

      <div className="adm-fieldset-title mt-3"><i className="fas fa-person-dress me-2"></i>Mother's Details</div>
      <div className="row">
        <TextField label="Mother's Full Name" name="motherName" value={formData.motherName} onChange={update} placeholder="Enter full name" col="12" />
        <TextField label="Phone Number" name="motherPhone" value={formData.motherPhone} onChange={update} error={errors.motherPhone} type="tel" placeholder="+237 6XX XXX XXX" col="6" />
        <TextField label="Email" name="motherEmail" value={formData.motherEmail} onChange={update} error={errors.motherEmail} type="email" placeholder="mother@example.com" col="6" />
        <TextField label="Address" name="motherAddress" value={formData.motherAddress} onChange={update} placeholder="Residential address" col="12" />
      </div>

      <div className="adm-fieldset-title mt-3"><i className="fas fa-people-roof me-2"></i>Guardian's Details <span className="adm-req">*</span></div>
      <div className="row">
        <TextField label="Guardian's Full Name" name="guardianName" value={formData.guardianName} onChange={update} error={errors.guardianName} placeholder="Enter full name" required col="12" />
        <SelectField
          label="Relationship to Student" name="guardianRelationship" value={formData.guardianRelationship} onChange={update} error={errors.guardianRelationship} required col="6"
          placeholder="Select relationship"
          options={RELATIONSHIP_OPTIONS.map((v) => ({ value: v, label: v }))}
        />
        <TextField label="Phone Number" name="guardianPhone" value={formData.guardianPhone} onChange={update} error={errors.guardianPhone} type="tel" placeholder="+237 6XX XXX XXX" required col="6" />
        <TextField label="Email Address" name="guardianEmail" value={formData.guardianEmail} onChange={update} error={errors.guardianEmail} type="email" placeholder="guardian@example.com" required col="6" />
        <TextField label="Address" name="guardianAddress" value={formData.guardianAddress} onChange={update} placeholder="Residential address" col="6" />
      </div>

      <div className="adm-fieldset-title mt-3"><i className="fas fa-phone-volume me-2"></i>Emergency Contact <span className="adm-req">*</span></div>
      <div className="row">
        <TextField label="Emergency Contact Name" name="emergencyName" value={formData.emergencyName} onChange={update} error={errors.emergencyName} placeholder="Enter full name" required col="6" />
        <SelectField
          label="Relationship to Student" name="emergencyRelationship" value={formData.emergencyRelationship} onChange={update} error={errors.emergencyRelationship} required col="6"
          placeholder="Select relationship"
          options={RELATIONSHIP_OPTIONS.map((v) => ({ value: v, label: v }))}
        />
        <TextField label="Emergency Phone Number" name="emergencyPhone" value={formData.emergencyPhone} onChange={update} error={errors.emergencyPhone} type="tel" placeholder="+237 6XX XXX XXX" required col="6" />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="adm-card">
      <div className="adm-card-hd">
        <h2>Education History</h2>
        <p>Provide details about the student's most recent educational experience.</p>
      </div>
      <div className="row">
        <TextField label="Previous School" name="prevSchool" value={formData.prevSchool} onChange={update} error={errors.prevSchool} required col="6" placeholder="Name of previous school" />
        <SelectField
          label="Last Grade / Class Attended" name="lastGrade" value={formData.lastGrade} onChange={update} error={errors.lastGrade} required col="6"
          placeholder="Select grade"
          options={[...CLASS_OPTIONS, 'Other'].map((v) => ({ value: v, label: v }))}
        />
        <TextField
          label="Year Completed" name="yearCompleted" value={formData.yearCompleted} onChange={update} error={errors.yearCompleted}
          type="number" placeholder="e.g. 2025" col="6" min="1900" max={new Date().getFullYear()}
        />
      </div>
      <TextAreaField label="Reason for Leaving" name="reasonForLeaving" value={formData.reasonForLeaving} onChange={update} placeholder="Briefly explain why you are leaving your previous school..." rows={3} />
      <TextAreaField label="Academic Achievements (optional)" name="achievements" value={formData.achievements} onChange={update} placeholder="e.g. Honor Roll 2023, Best in Mathematics..." rows={2} />
    </div>
  );

  const renderStep4 = () => {
    const requiredDocs = DOCUMENT_CONFIG.filter((d) => d.required);
    const optionalDocs = DOCUMENT_CONFIG.filter((d) => !d.required);

    return (
      <div className="adm-card">
        <div className="adm-card-hd">
          <h2>Documents Hub</h2>
          <p>Upload the required documents for your application. Photos accept JPG/PNG up to 4MB; other documents accept PDF, Word, JPG or PNG up to 5MB.</p>
        </div>

        <div className="adm-fieldset-title"><i className="fas fa-circle-exclamation me-2"></i>Required</div>
        <div className="row">
          {requiredDocs.map((cfg) => (
            <FileUploadField
              key={cfg.key}
              config={cfg}
              file={files[cfg.key]}
              error={errors[cfg.key]}
              onSelect={handleFileSelect}
              onRemove={handleFileRemove}
            />
          ))}
        </div>

        <div className="adm-fieldset-title mt-3"><i className="fas fa-file-circle-plus me-2"></i>Optional</div>
        <div className="row">
          {optionalDocs.map((cfg) => (
            <FileUploadField
              key={cfg.key}
              config={cfg}
              file={files[cfg.key]}
              error={errors[cfg.key]}
              onSelect={handleFileSelect}
              onRemove={handleFileRemove}
            />
          ))}
        </div>

        <div className="row mt-2">
          <div className="col-md-12">
            <div className="adm-doc-help">
              <div className="adm-doc-help-ic"><i className="fas fa-circle-info"></i></div>
              <div>
                <div className="adm-doc-help-t">Need help with documents?</div>
                <div className="adm-doc-help-d">
                  Contact the admissions office at <strong>admissions@ccastbambili.cm</strong> or visit the campus with original documents for verification.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const reviewRow = (label, value) => (
    <div key={label} className="col-md-6 adm-review-row">
      <span className="adm-review-label">{label}</span>
      <span className="adm-review-value">{value || '—'}</span>
    </div>
  );

  const renderStep5 = () => (
    <div className="adm-card">
      <div className="adm-card-hd">
        <h2>Final Review &amp; Declaration</h2>
        <p>Review all information before submitting. Ensure all details are accurate.</p>
      </div>

      <div className="adm-review-block">
        <div className="adm-review-hd"><i className="fas fa-user me-2"></i>Student Details</div>
        <div className="adm-review-body">
          <div className="row g-2">
            {reviewRow('Full Name', `${formData.firstName} ${formData.lastName}`.trim())}
            {reviewRow('Date of Birth', formData.dob ? `${formData.dob} (${calculateAge(formData.dob) ?? '—'} yrs)` : '')}
            {reviewRow('Gender', formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : '')}
            {reviewRow('Class Applying For', formData.classApplying)}
          </div>
        </div>
      </div>

      <div className="adm-review-block">
        <div className="adm-review-hd"><i className="fas fa-people-roof me-2"></i>Parent &amp; Guardian</div>
        <div className="adm-review-body">
          <div className="row g-2">
            {reviewRow('Father', formData.fatherName)}
            {reviewRow('Father Phone', formData.fatherPhone)}
            {reviewRow('Father Email', formData.fatherEmail)}
            {reviewRow('Mother', formData.motherName)}
            {reviewRow('Mother Phone', formData.motherPhone)}
            {reviewRow('Mother Email', formData.motherEmail)}
            {reviewRow('Guardian', formData.guardianName)}
            {reviewRow('Guardian Relationship', formData.guardianRelationship)}
            {reviewRow('Guardian Phone', formData.guardianPhone)}
            {reviewRow('Guardian Email', formData.guardianEmail)}
          </div>
        </div>
      </div>

      <div className="adm-review-block">
        <div className="adm-review-hd"><i className="fas fa-phone-volume me-2"></i>Emergency Contact</div>
        <div className="adm-review-body">
          <div className="row g-2">
            {reviewRow('Name', formData.emergencyName)}
            {reviewRow('Relationship', formData.emergencyRelationship)}
            {reviewRow('Phone', formData.emergencyPhone)}
          </div>
        </div>
      </div>

      <div className="adm-review-block">
        <div className="adm-review-hd"><i className="fas fa-graduation-cap me-2"></i>Education History</div>
        <div className="adm-review-body">
          <div className="row g-2">
            {reviewRow('Previous School', formData.prevSchool)}
            {reviewRow('Last Grade', formData.lastGrade)}
            {reviewRow('Year Completed', formData.yearCompleted)}
            {reviewRow('Achievements', formData.achievements || 'None listed')}
          </div>
        </div>
      </div>

      <div className="adm-review-block">
        <div className="adm-review-hd"><i className="fas fa-file-arrow-up me-2"></i>Documents</div>
        <div className="adm-review-body">
          <div className="adm-review-docs">
            {DOCUMENT_CONFIG.map((cfg) => (
              <div key={cfg.key} className={`adm-review-doc ${files[cfg.key] ? 'done' : ''}`}>
                <i className={`fas ${files[cfg.key] ? 'fa-check-circle' : cfg.required ? 'fa-times-circle' : 'fa-minus-circle'}`}></i>
                <span>{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {submitError && (
        <div className="adm-err mb-3" role="alert"><i className="fas fa-exclamation-circle me-1"></i>{submitError}</div>
      )}

      <div className={`adm-declaration ${errors.declaration ? 'adm-declaration--err' : ''}`}>
        <div className="adm-check">
          <input
            type="checkbox"
            id="declaration"
            checked={formData.declaration}
            onChange={(e) => update('declaration', e.target.checked)}
            className="adm-check-input"
          />
          <label htmlFor="declaration" className="adm-check-label">
            <span className="adm-check-box"><i className="fas fa-check"></i></span>
            I hereby declare that all information provided in this application is true and correct to the best of my
            knowledge. I understand that any false information may lead to disqualification or withdrawal of admission.
          </label>
        </div>
        {errors.declaration && <div className="adm-err mt-2" role="alert"><i className="fas fa-exclamation-circle me-1"></i>{errors.declaration}</div>}
      </div>
    </div>
  );

  const stepRenderers = { 1: renderStep1, 2: renderStep2, 3: renderStep3, 4: renderStep4, 5: renderStep5 };

  return (
    <div className="adm-page">
      <div className="adm-top">
        <div className="container-xl">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <a href="/" className="adm-brand d-flex align-items-center text-decoration-none">
              <div className="hp-logo" style={{ width: 36, height: 36, fontSize: 1 }}>C</div>
              <div className="hp-logo-txt" style={{ marginLeft: '.5rem' }}>
                <span className="hp-logo-n" style={{ color: '#fff', fontSize: '.9rem' }}>CCAST Bambili</span>
                <span className="hp-logo-s" style={{ fontSize: '.55rem' }}>Admissions Portal</span>
              </div>
            </a>
            <button className="btn adm-cancel-btn" onClick={() => navigate('/')}>
              <i className="fas fa-xmark me-2"></i>Cancel Application
            </button>
          </div>
        </div>
      </div>

      <div className="adm-body">
        <div className="container-xl">
          <div className="row g-4">
            <div className="col-lg-3 d-none d-lg-block">
              <div className="adm-sidebar">
                <div className="adm-sidebar-hd">Admission Steps</div>
                {STEPS.map((s) => (
                  <div
                    key={s.num}
                    className={`adm-step-item ${step === s.num ? 'active' : ''} ${step > s.num ? 'done' : ''}`}
                    onClick={() => goToStep(s.num)}
                    style={{ cursor: s.num < step ? 'pointer' : 'default' }}
                  >
                    <div className="adm-step-num">{step > s.num ? <i className="fas fa-check"></i> : s.num}</div>
                    <div className="adm-step-info">
                      <div className="adm-step-label">STEP {s.num}</div>
                      <div className="adm-step-name">{s.label}</div>
                    </div>
                    {step === s.num && <div className="adm-step-arrow"><i className="fas fa-chevron-right"></i></div>}
                  </div>
                ))}
                <div className="adm-sidebar-progress">
                  <div className="adm-sidebar-p-label">Progress</div>
                  <div className="adm-sidebar-p-bar">
                    <div className="adm-sidebar-p-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className="adm-sidebar-p-pct">{Math.round(progress)}%</div>
                </div>
              </div>
            </div>

            <div className="col-lg-9">
              <div className="adm-main">
                <div className="adm-mobile-steps d-lg-none">
                  <div className="adm-mobile-p-bar">
                    <div className="adm-mobile-p-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className="d-flex justify-content-between mt-2">
                    {STEPS.map((s) => (
                      <div key={s.num} className={`adm-mobile-dot ${step === s.num ? 'active' : ''} ${step > s.num ? 'done' : ''}`}>
                        <span>{step > s.num ? <i className="fas fa-check" style={{ fontSize: '.5rem' }}></i> : s.num}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-2">
                    <span className="adm-mobile-label">Step {step}: {STEPS[step - 1].label}</span>
                  </div>
                </div>

                <div className={`adm-content adm-content--${animDir}`} key={step}>
                  {stepRenderers[step]()}
                </div>

                <div className="adm-footer">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div>
                      {step > 1 && (
                        <button className="btn adm-btn-back" onClick={goPrev}>
                          <i className="fas fa-arrow-left me-2"></i>Back
                        </button>
                      )}
                    </div>
                    <div className="d-flex gap-2">
                      {step < 5 ? (
                        <button className="btn adm-btn-next" onClick={goNext}>
                          Continue to {STEPS[step].label} <i className="fas fa-arrow-right ms-2"></i>
                        </button>
                      ) : (
                        <button className="btn adm-btn-submit" onClick={handleSubmit} disabled={submitting}>
                          <i className="fas fa-paper-plane me-2"></i>{submitting ? 'Submitting…' : 'Submit Application'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="adm-bottom">
        <div className="container-xl d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="adm-bottom-links">
            <a href="#">Help Center</a>
            <a href="#">Contact Admissions</a>
            <a href="#">FAQs</a>
          </div>
          <div>&copy; {new Date().getFullYear()} CCAST Bambili. All rights reserved.</div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionPage;