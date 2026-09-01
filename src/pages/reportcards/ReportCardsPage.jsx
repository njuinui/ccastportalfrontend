import { useState } from "react";
import toast from "react-hot-toast";
import { useAllStudents } from "../../api/students";
import { useExams } from "../../api/exams";
import { downloadReportCard } from "../../api/reportcards";
import { PageHeader, Field } from "../../components/ui";

export default function ReportCardsPage() {
  const { data: students } = useAllStudents();
  const { data: examsData } = useExams();
  const exams = examsData?.data ?? [];
  const [studentId, setStudentId] = useState("");
  const [examId, setExamId] = useState("");
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    if (!studentId || !examId) return toast.error("Pick a student and an exam.");
    setBusy(true);
    try { await downloadReportCard(studentId, examId); toast.success("Report card downloaded"); }
    catch { toast.error("Could not generate report card."); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <PageHeader title="Report Cards" subtitle="Generate a printable PDF report card" />
      <div className="surface-card p-4">
        <Field label="Student" required>
          <select className="form-select" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">Select student…</option>
            {(students ?? []).map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.admission_number})</option>)}
          </select>
        </Field>
        <Field label="Exam / Sequence" required>
          <select className="form-select" value={examId} onChange={(e) => setExamId(e.target.value)}>
            <option value="">Select exam…</option>
            {exams.map((e) => <option key={e.id} value={e.id}>{e.name} — {e.term?.name}</option>)}
          </select>
        </Field>
        <button className="btn btn-primary w-100 mt-2" onClick={generate} disabled={busy}>
          <i className="fa-solid fa-file-arrow-down me-2" />{busy ? "Generating…" : "Download report card (PDF)"}
        </button>
        <p className="text-secondary small mt-3 mb-0">
          The report card computes a coefficient-weighted average out of the exam's maximum score and
          ranks the student against classmates in the same section.
        </p>
      </div>
    </div>
  );
}
