import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useEnrollments, useCreateEnrollment } from "../../api/enrollment";
import { useAllStudents } from "../../api/students";
import { useClasses, useAcademicYears } from "../../api/academic";
import { PageHeader, Modal, Field, StatusPill, StateRow } from "../../components/ui";

export default function EnrollmentPage() {
  const [filters, setFilters] = useState({ academic_year_id: "", school_class_id: "" });
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, isError } = useEnrollments({
    academic_year_id: filters.academic_year_id || undefined,
    school_class_id: filters.school_class_id || undefined,
  });
  const { data: classesData } = useClasses();
  const { data: yearsData } = useAcademicYears();
  const rows = data?.data ?? [];
  const classes = classesData?.data ?? [];
  const years = yearsData?.data ?? [];

  return (
    <div style={{ maxWidth: 1150 }}>
      <PageHeader title="Enrollment" subtitle="Assign students to a class, section and year"
        actions={<button className="btn btn-primary" onClick={() => setShowForm(true)}><i className="fa-solid fa-plus me-2" />Enroll student</button>} />

      <div className="d-flex flex-wrap gap-2 mb-3">
        <select className="form-select" style={{ maxWidth: 220 }} value={filters.academic_year_id}
          onChange={(e) => setFilters((f) => ({ ...f, academic_year_id: e.target.value }))}>
          <option value="">All years</option>
          {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
        </select>
        <select className="form-select" style={{ maxWidth: 220 }} value={filters.school_class_id}
          onChange={(e) => setFilters((f) => ({ ...f, school_class_id: e.target.value }))}>
          <option value="">All classes</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="surface-card table-responsive">
        <table className="table table-clean">
          <thead><tr><th>Admission no.</th><th>Student</th><th>Class</th><th>Section</th><th>Year</th><th>Status</th></tr></thead>
          <tbody>
            <StateRow colSpan={6} loading={isLoading} error={isError} empty={!isLoading && rows.length === 0} emptyText="No enrollments match." />
            {rows.map((e) => (
              <tr key={e.id}>
                <td className="mono">{e.student?.admission_number}</td>
                <td className="fw-semibold">{e.student?.full_name}</td>
                <td>{e.school_class?.name}</td>
                <td>{e.section?.name ?? "—"}</td>
                <td className="text-secondary">{e.academic_year?.name}</td>
                <td><StatusPill status={e.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && <EnrollForm classes={classes} years={years} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function EnrollForm({ classes, years, onClose }) {
  const create = useCreateEnrollment();
  const { data: students } = useAllStudents();
  const [form, setForm] = useState({ student_id: "", school_class_id: "", section_id: "", academic_year_id: "", status: "enrolled" });
  const [errors, setErrors] = useState({});
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const sections = useMemo(
    () => classes.find((c) => String(c.id) === String(form.school_class_id))?.sections ?? [],
    [classes, form.school_class_id]
  );

  const submit = async () => {
    setErrors({});
    try {
      await create.mutateAsync({
        ...form,
        section_id: form.section_id || null,
      });
      toast.success("Student enrolled");
      onClose();
    } catch (err) { setErrors(err.fieldErrors ?? {}); if (!err.fieldErrors) toast.error("Could not enroll (duplicate for this year?)."); }
  };

  return (
    <Modal title="Enroll student" onClose={onClose}
      footer={<><button className="btn btn-light" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={create.isPending}>{create.isPending ? "Saving…" : "Enroll"}</button></>}>
      <Field label="Student" required error={errors.student_id}>
        <select className="form-select" value={form.student_id} onChange={set("student_id")}>
          <option value="">Select student…</option>
          {(students ?? []).map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.admission_number})</option>)}
        </select>
      </Field>
      <Field label="Academic year" required error={errors.academic_year_id}>
        <select className="form-select" value={form.academic_year_id} onChange={set("academic_year_id")}>
          <option value="">Select year…</option>
          {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
        </select>
      </Field>
      <div className="row">
        <div className="col-6"><Field label="Class" required error={errors.school_class_id}>
          <select className="form-select" value={form.school_class_id} onChange={(e) => setForm((s) => ({ ...s, school_class_id: e.target.value, section_id: "" }))}>
            <option value="">Select class…</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></Field></div>
        <div className="col-6"><Field label="Section" error={errors.section_id}>
          <select className="form-select" value={form.section_id} onChange={set("section_id")} disabled={!sections.length}>
            <option value="">{sections.length ? "Select…" : "No sections"}</option>
            {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select></Field></div>
      </div>
    </Modal>
  );
}
