import { useState } from "react";
import toast from "react-hot-toast";
import { useAcademicYears, useSaveAcademicYear, useSaveTerm } from "../../api/academic";
import { PageHeader, Modal, Field, StatusPill } from "../../components/ui";

export default function AcademicYearsPage() {
  const { data, isLoading } = useAcademicYears();
  const [showYear, setShowYear] = useState(false);
  const [termFor, setTermFor] = useState(null); // academic year object
  const years = data?.data ?? [];

  return (
    <div style={{ maxWidth: 1000 }}>
      <PageHeader title="Academic Years" subtitle="Years and their terms / sequences"
        actions={<button className="btn btn-primary" onClick={() => setShowYear(true)}><i className="fa-solid fa-plus me-2" />Add year</button>} />

      {isLoading && <div className="text-secondary">Loading…</div>}
      {!isLoading && years.length === 0 && <div className="surface-card state-cell">No academic years yet.</div>}

      <div className="d-flex flex-column gap-3">
        {years.map((y) => (
          <div key={y.id} className="surface-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <span className="fw-bold fs-5 me-2">{y.name}</span>
                {y.is_current ? <StatusPill status="active" /> : <span className="pill pill-gray">past</span>}
                <div className="text-secondary small mt-1">{y.starts_on} → {y.ends_on}</div>
              </div>
              <button className="btn btn-sm btn-outline-primary" onClick={() => setTermFor(y)}>
                <i className="fa-solid fa-plus me-1" />Term
              </button>
            </div>
            <div className="row g-2">
              {(y.terms ?? []).sort((a, b) => a.sequence - b.sequence).map((t) => (
                <div className="col-md-4" key={t.id}>
                  <div className="border rounded p-3 h-100">
                    <div className="fw-semibold">{t.name} {t.is_current && <span className="pill pill-green ms-1">current</span>}</div>
                    <div className="text-secondary small">{t.starts_on} → {t.ends_on}</div>
                  </div>
                </div>
              ))}
              {(y.terms ?? []).length === 0 && <div className="col-12 text-secondary small">No terms defined.</div>}
            </div>
          </div>
        ))}
      </div>

      {showYear && <YearForm onClose={() => setShowYear(false)} />}
      {termFor && <TermForm year={termFor} onClose={() => setTermFor(null)} />}
    </div>
  );
}

function YearForm({ onClose }) {
  const save = useSaveAcademicYear();
  const [form, setForm] = useState({ name: "", starts_on: "", ends_on: "", is_current: false });
  const [errors, setErrors] = useState({});
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const submit = async () => {
    setErrors({});
    try { await save.mutateAsync({ ...form, is_current: form.is_current }); toast.success("Year added"); onClose(); }
    catch (err) { setErrors(err.fieldErrors ?? {}); if (!err.fieldErrors) toast.error("Could not save."); }
  };
  return (
    <Modal title="New academic year" onClose={onClose}
      footer={<><button className="btn btn-light" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={save.isPending}>Save</button></>}>
      <Field label="Name (e.g. 2025/2026)" required error={errors.name}><input className="form-control" value={form.name} onChange={set("name")} /></Field>
      <div className="row">
        <div className="col-6"><Field label="Starts on" error={errors.starts_on}><input type="date" className="form-control" value={form.starts_on} onChange={set("starts_on")} /></Field></div>
        <div className="col-6"><Field label="Ends on" error={errors.ends_on}><input type="date" className="form-control" value={form.ends_on} onChange={set("ends_on")} /></Field></div>
      </div>
      <div className="form-check"><input className="form-check-input" type="checkbox" id="cur" checked={form.is_current} onChange={(e) => setForm((s) => ({ ...s, is_current: e.target.checked }))} /><label className="form-check-label" htmlFor="cur">Set as current year</label></div>
    </Modal>
  );
}

function TermForm({ year, onClose }) {
  const save = useSaveTerm();
  const [form, setForm] = useState({ academic_year_id: year.id, name: "", sequence: (year.terms?.length ?? 0) + 1, starts_on: "", ends_on: "", is_current: false });
  const [errors, setErrors] = useState({});
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const submit = async () => {
    setErrors({});
    try { await save.mutateAsync({ ...form, sequence: Number(form.sequence) }); toast.success("Term added"); onClose(); }
    catch (err) { setErrors(err.fieldErrors ?? {}); if (!err.fieldErrors) toast.error("Could not save."); }
  };
  return (
    <Modal title={`New term — ${year.name}`} onClose={onClose}
      footer={<><button className="btn btn-light" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={save.isPending}>Save</button></>}>
      <div className="row">
        <div className="col-8"><Field label="Term name" required error={errors.name}><input className="form-control" placeholder="First Term" value={form.name} onChange={set("name")} /></Field></div>
        <div className="col-4"><Field label="Sequence" required error={errors.sequence}><input type="number" min="1" className="form-control" value={form.sequence} onChange={set("sequence")} /></Field></div>
        <div className="col-6"><Field label="Starts on" error={errors.starts_on}><input type="date" className="form-control" value={form.starts_on} onChange={set("starts_on")} /></Field></div>
        <div className="col-6"><Field label="Ends on" error={errors.ends_on}><input type="date" className="form-control" value={form.ends_on} onChange={set("ends_on")} /></Field></div>
      </div>
      <div className="form-check"><input className="form-check-input" type="checkbox" id="tcur" checked={form.is_current} onChange={(e) => setForm((s) => ({ ...s, is_current: e.target.checked }))} /><label className="form-check-label" htmlFor="tcur">Set as current term</label></div>
    </Modal>
  );
}
