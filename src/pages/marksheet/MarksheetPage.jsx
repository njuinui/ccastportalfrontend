import { useMemo, useState } from "react";
import { useExams } from "../../api/exams";
import { useSectionsList } from "../../api/academic";
import { useMarksheet } from "../../api/marks";
import "../../styles/mgmt.css";
import "./Marksheet.css";

export default function MarksheetPage() {
  const [examId, setExamId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const { data: examsData } = useExams({ per_page: 100 });
  const { data: sectionsData } = useSectionsList({ per_page: 100 });
  const exams = examsData?.data ?? [];
  const sections = sectionsData?.data ?? [];
  const ready = !!(examId && sectionId);
  const { data, isFetching, isError } = useMarksheet({ exam_id: examId, section_id: sectionId }, ready);

  const subjects = data?.subjects ?? [];
  const rows = useMemo(() => (data?.rows ?? []).slice().sort((a, b) => a.rank - b.rank), [data]);

  return (
    <div className="mg-page">
      <div className="mg-head">
        <div><div className="mg-title"><span className="material-symbols-outlined">description</span><h1>Marksheet Preview</h1></div>
          <div className="mg-crumb">Academic Hub <span className="material-symbols-outlined">chevron_right</span> Marksheet {isFetching && <span className="mg-sync"><span className="material-symbols-outlined">sync</span> generating…</span>}</div></div>
        <div className="d-flex gap-2">
          <button className="btn btn-light" onClick={() => window.print()} disabled={!ready || !data}><span className="material-symbols-outlined" style={{ verticalAlign: "-5px" }}>print</span> Print A4</button>
          <button className="mg-add" onClick={() => window.print()} disabled={!ready || !data}><span className="material-symbols-outlined">download</span> Export PDF</button>
        </div>
      </div>

      <div className="surface-card mg-filters no-print">
        <div className="mg-filters-grid cols-4">
          <label>Examination<select className="form-select" value={examId} onChange={(e) => setExamId(e.target.value)}><option value="">Select exam…</option>{exams.map((e) => <option key={e.id} value={e.id}>{e.name}{e.exam_code ? ` (${e.exam_code})` : ""}</option>)}</select></label>
          <label>Class / Section<select className="form-select" value={sectionId} onChange={(e) => setSectionId(e.target.value)}><option value="">Select section…</option>{sections.map((s) => <option key={s.id} value={s.id}>{s.class} {s.section}</option>)}</select></label>
        </div>
      </div>

      {!ready && <div className="surface-card p-4 text-secondary no-print">Pick an examination and a class section to generate the marksheet.</div>}
      {ready && isError && <div className="surface-card p-4 text-danger no-print">Couldn't generate the marksheet.</div>}
      {ready && data && (
        <div className="ms-sheet surface-card">
          <div className="ms-head">
            <div className="ms-logo" />
            <div className="ms-school">
              <h2>{data.school.name}</h2>
              <div className="ms-motto">{data.school.motto}</div>
              <div className="ms-addr">{data.school.address} · {data.school.phone}</div>
            </div>
            <div className="ms-official">
              <span className="ms-badge">OFFICIAL RECORD</span>
              <div className="ms-ref">Ref: {data.exam.ref}</div>
              <div className="ms-ref">Release: {data.exam.release_date ?? "—"}</div>
            </div>
          </div>
          <div className="ms-title">CLASS MARKSHEET</div>
          <div className="ms-meta">
            <div><span>Examination:</span> <b>{data.exam.name}</b></div>
            <div><span>Class &amp; Section:</span> <b>{data.class}</b></div>
            <div><span>Exam Type:</span> <b style={{ textTransform: "capitalize" }}>{data.exam.type}</b></div>
            <div><span>Academic Year:</span> <b>{data.exam.session ?? "—"}</b></div>
            <div><span>Term:</span> <b>{data.exam.term ?? "—"}</b></div>
            <div><span>Max / subject:</span> <b>{data.exam.max}</b></div>
          </div>
          <div className="table-responsive">
            <table className="ms-table">
              <thead>
                <tr>
                  <th>Rank</th><th className="tleft">Student Name</th>
                  {subjects.map((s) => <th key={s.code}>{s.code}<span className="ms-of">/{data.exam.max}</span></th>)}
                  <th>Total</th><th>%</th><th>Remark</th><th>Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.student}>
                    <td className="ms-rank">{r.rank}</td>
                    <td className="tleft fw-semibold">{r.student}</td>
                    {subjects.map((s) => {
                      const v = r.scores[s.code];
                      const fail = v != null && v < data.exam.max * 0.4;
                      return <td key={s.code} className={fail ? "ms-fail" : ""}>{v ?? "—"}</td>;
                    })}
                    <td className="fw-bold">{r.total}</td>
                    <td>{r.percent}</td>
                    <td className={`ms-remark ms-${r.remark.replace(".", "").toLowerCase()}`}>{r.remark}</td>
                    <td><span className={`ms-result ${r.result === "PASS" ? "pass" : "fail"}`}>{r.result}</span></td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={subjects.length + 6} className="text-secondary p-3">No students / marks for this selection.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
