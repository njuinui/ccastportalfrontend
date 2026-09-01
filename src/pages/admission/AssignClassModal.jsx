// src/pages/admission/AssignClassModal.jsx

import { useState, useEffect } from "react";
import { Modal, Field } from "../../components/ui";
import client from "../../api/client";

export default function AssignClassModal({ record, onClose, onConfirm, submitting }) {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch classes and academic years in parallel
        const [classesRes, yearsRes] = await Promise.all([
          client.get('/classes'),
          client.get('/academic-years')
        ]);

        setClasses(classesRes.data.data ?? classesRes.data ?? []);
        setAcademicYears(yearsRes.data.data ?? yearsRes.data ?? []);
        
        // Auto-select current academic year
        const currentYear = (yearsRes.data.data ?? yearsRes.data ?? []).find(y => y.is_current);
        if (currentYear) {
          setAcademicYearId(String(currentYear.id));
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load class and academic year data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const selectedClass = classes.find((c) => String(c.id) === String(classId));
  const sections = selectedClass?.sections ?? [];

  const isFormValid = classId && sectionId && academicYearId;

  return (
    <Modal
      title={`Assign Class & Section — ${record?.name || 'Student'}`}
      onClose={onClose}
      size="modal-lg"
      footer={
        <>
          <button 
            className="btn btn-light" 
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!isFormValid || submitting || loading}
            onClick={() => onConfirm({ 
              school_class_id: parseInt(classId), 
              section_id: parseInt(sectionId),
              academic_year_id: parseInt(academicYearId)
            })}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Admitting…
              </>
            ) : (
              "Confirm & Admit"
            )}
          </button>
        </>
      }
    >
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <p style={{ fontSize: ".85rem", color: "#475569", marginBottom: "1rem" }}>
        <strong>⚠️ Required:</strong> A class and section must be assigned before this student can be admitted.
        This determines their enrollment, timetable, and class roster.
      </p>

      <div className="row">
        <div className="col-md-6 mb-3">
          <Field label="Academic Year" required>
            <select 
              className="form-select" 
              value={academicYearId} 
              onChange={(e) => setAcademicYearId(e.target.value)} 
              disabled={loading}
            >
              <option value="">{loading ? "Loading…" : "Select academic year"}</option>
              {academicYears.map((y) => (
                <option key={y.id} value={String(y.id)}>
                  {y.name} {y.is_current ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="col-md-6 mb-3">
          <Field label="Class" required>
            <select 
              className="form-select" 
              value={classId} 
              onChange={(e) => { 
                setClassId(e.target.value); 
                setSectionId(""); 
              }} 
              disabled={loading}
            >
              <option value="">{loading ? "Loading…" : "Select class"}</option>
              {classes.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name} {c.code ? `(${c.code})` : ''}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="col-md-6 mb-3">
          <Field label="Section" required>
            <select 
              className="form-select" 
              value={sectionId} 
              onChange={(e) => setSectionId(e.target.value)} 
              disabled={!classId || loading}
            >
              <option value="">
                {!classId ? "Select a class first" : loading ? "Loading…" : "Select section"}
              </option>
              {sections.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name} {s.capacity ? `(Capacity: ${s.capacity})` : ''}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="col-md-6 mb-3">
          <div style={{ 
            background: '#f8fafc', 
            padding: '10px 14px', 
            borderRadius: '6px',
            fontSize: '14px',
            color: '#475569',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div><strong>Student:</strong> {record?.name || '—'}</div>
            <div><strong>Application #:</strong> {record?.application_number || '—'}</div>
            <div><strong>Applied For:</strong> {record?.grade || '—'}</div>
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

      <div style={{ 
        marginTop: '16px', 
        padding: '12px 16px', 
        background: '#f0fdf4', 
        borderRadius: '8px',
        border: '1px solid #bbf7d0'
      }}>
        <p style={{ margin: 0, color: '#166534', fontSize: '13px' }}>
          ✅ Upon admission, the system will automatically:
        </p>
        <ul style={{ margin: '8px 0 0 18px', color: '#166534', fontSize: '12px' }}>
          <li>Create student and guardian user accounts</li>
          <li>Generate and send login credentials via email and SMS</li>
          <li>Generate an official admission letter (PDF)</li>
          <li>Create an enrollment record for the student</li>
          <li>Send the admission letter attached to the email</li>
        </ul>
      </div>
    </Modal>
  );
}