import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useClasses } from "../../api/academic";
import { useAttendanceRegister, useSaveAttendance } from "../../api/attendance";
import { PageHeader, StateRow } from "../../components/ui";

const STATUSES = [
  { key: "present", cls: "btn-success", label: "P" },
  { key: "absent", cls: "btn-danger", label: "A" },
  { key: "late", cls: "btn-warning", label: "L" },
  { key: "excused", cls: "btn-secondary", label: "E" },
];

export default function AttendancePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [sectionId, setSectionId] = useState("");
  const { data: classesData } = useClasses();
  const classes = classesData?.data ?? [];
  const sections = useMemo(
    () => classes.flatMap((c) => (c.sections ?? []).map((s) => ({ id: s.id, label: `${c.name} ${s.name}` }))),
    [classes]
  );

  const enabled = !!sectionId;
  const { data, isLoading, isError, isFetching } = useAttendanceRegister({ date, section_id: sectionId }, enabled);
  const save = useSaveAttendance();
  const [roster, setRoster] = useState([]);

  useEffect(() => { if (data?.roster) setRoster(data.roster); }, [data]);

  const setStatus = (studentId, status) =>
    setRoster((r) => r.map((row) => (row.student_id === studentId ? { ...row, status } : row)));

  const markAll = (status) => setRoster((r) => r.map((row) => ({ ...row, status })));

  const submit = async () => {
    try {
      await save.mutateAsync({
        date, section_id: Number(sectionId),
        records: roster.map((r) => ({ student_id: r.student_id, status: r.status, note: r.note ?? null })),
      });
      toast.success("Attendance saved");
    } catch { toast.error("Could not save attendance."); }
  };

  const counts = roster.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] ?? 0) + 1 }), {});

  return (
    <div style={{ maxWidth: 1000 }}>
      <PageHeader title="Attendance" subtitle="Daily register by section" />

      <div className="d-flex flex-wrap gap-2 mb-3 align-items-end">
        <div>
          <label className="form-label small fw-semibold text-secondary">Date</label>
          <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="form-label small fw-semibold text-secondary">Class / Section</label>
          <select className="form-select" style={{ minWidth: 200 }} value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">Select section…</option>
            {sections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        {enabled && roster.length > 0 && (
          <div className="ms-auto d-flex gap-2 align-items-center">
            <button className="btn btn-sm btn-outline-success" onClick={() => markAll("present")}>Mark all present</button>
            <button className="btn btn-primary" onClick={submit} disabled={save.isPending}>
              <i className="fa-solid fa-floppy-disk me-2" />{save.isPending ? "Saving…" : "Save register"}
            </button>
          </div>
        )}
      </div>

      {!enabled && <div className="surface-card state-cell">Pick a section to load its register.</div>}

      {enabled && (
        <>
          <div className="d-flex gap-2 mb-2 small">
            <span className="pill pill-green">Present {counts.present ?? 0}</span>
            <span className="pill pill-red">Absent {counts.absent ?? 0}</span>
            <span className="pill pill-amber">Late {counts.late ?? 0}</span>
            <span className="pill pill-gray">Excused {counts.excused ?? 0}</span>
            {isFetching && <span className="text-secondary">· refreshing…</span>}
          </div>
          <div className="surface-card table-responsive">
            <table className="table table-clean align-middle">
              <thead><tr><th>Adm. no.</th><th>Student</th><th className="text-end">Status</th></tr></thead>
              <tbody>
                <StateRow colSpan={3} loading={isLoading} error={isError} empty={!isLoading && roster.length === 0} emptyText="No students enrolled in this section." />
                {roster.map((r) => (
                  <tr key={r.student_id}>
                    <td className="mono">{r.admission_number}</td>
                    <td className="fw-semibold">{r.full_name}</td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm" role="group">
                        {STATUSES.map((s) => (
                          <button key={s.key}
                            className={`btn ${r.status === s.key ? s.cls : "btn-outline-secondary"}`}
                            onClick={() => setStatus(r.student_id, s.key)} style={{ width: 40 }}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
