import { useState } from "react";
import toast from "react-hot-toast";
import { useGuardians, useGuardiansMeta, useSaveGuardian, useDeleteGuardian } from "../../api/guardians";
import { useAllStudents } from "../../api/students";
import { confirmDelete, swalInfo } from "../../lib/alerts";
import { initials, Modal, Field, useDebounced } from "../../components/ui";
import "../../styles/mgmt.css";

const BLANK = {
  first_name: "", last_name: "", phone: "", email: "", occupation: "",
  address: "", status: "active", language: "en", preferred_contact: "whatsapp",
};

const RELATION_TONE = { mother: "mg-chip-purple", father: "mg-chip-blue", guardian: "mg-chip-teal" };
const PREFERS = {
  whatsapp: ["WhatsApp", "mg-chip-green"], sms: ["SMS", "mg-chip-blue"],
  call: ["Call", "mg-chip-amber"], email: ["Email", "mg-chip-gray"],
};

export default function ParentsPage() {
  const [statusFilter, setStatusFilter] = useState(""); // "", active, inactive
  const [multiChild, setMultiChild] = useState(false);
  const [search, setSearch] = useState("");
  const [relation, setRelation] = useState("");
  const [language, setLanguage] = useState("");
  const [contact, setContact] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const debounced = useDebounced(search);

  const { data: meta } = useGuardiansMeta();
  const { data, isLoading, isError, isFetching } = useGuardians({
    status: statusFilter || undefined, multi_child: multiChild ? 1 : undefined,
    search: debounced || undefined, relation: relation || undefined,
    language: language || undefined, contact_method: contact || undefined,
    per_page: perPage, page,
  });
  const del = useDeleteGuardian();
  const rows = data?.data ?? [];
  const m = data?.meta;
  const k = meta?.kpis ?? {};

  const pickCard = (key) => {
    setPage(1);
    if (key === "all") { setStatusFilter(""); setMultiChild(false); }
    else if (key === "multi") { setMultiChild(true); setStatusFilter(""); }
    else { setStatusFilter(key); setMultiChild(false); }
  };
  const clearFilters = () => { setSearch(""); setRelation(""); setLanguage(""); setContact(""); setStatusFilter(""); setMultiChild(false); setPage(1); };

  const remove = async (g) => {
    if (!(await confirmDelete({ title: "Remove parent?", text: `${g.full_name} will be removed.`, confirmText: "Yes, remove" }))) return;
    try { await del.mutateAsync(g.id); toast.success("Parent removed"); }
    catch { toast.error("Permission denied."); }
  };
  const view = (g) => swalInfo(g.full_name, `Relation: ${g.relationship ?? "—"}\nEmployer: ${g.occupation ?? "—"}\nPhone: ${g.phone ?? "—"}\nEmail: ${g.email ?? "—"}\nLanguage: ${(g.language ?? "—").toUpperCase()}\nPrefers: ${g.preferred_contact ?? "—"}\nChildren: ${g.children_count}\nStatus: ${g.status}`);

  const exportCsv = () => {
    if (!rows.length) return toast.error("Nothing to export.");
    const head = ["ID", "Name", "Relation", "Employer", "Phone", "Email", "Language", "Prefers", "Status", "Children"];
    const lines = [head.join(",")];
    rows.forEach((g) => lines.push([g.id, g.full_name, g.relationship, g.occupation, g.phone, g.email, g.language, g.preferred_contact, g.status, g.children_count].map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(",")));
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "parents.csv"; a.click(); URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };
  const printTable = () => {
    const body = rows.map((g) => `<tr><td>${g.id}</td><td>${g.full_name}</td><td>${g.relationship ?? ""}</td><td>${g.occupation ?? ""}</td><td>${g.phone ?? ""}</td><td>${g.status}</td><td>${g.children_count}</td></tr>`).join("");
    const w = window.open("", "_blank"); if (!w) return toast.error("Allow pop-ups to print.");
    w.document.write(`<html><head><title>Parents</title><style>body{font-family:Inter,Arial,sans-serif;padding:24px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#f0f2f5}</style></head><body><h1>CCAST Bambili — Parents</h1><table><tr><th>ID</th><th>Name</th><th>Relation</th><th>Employer</th><th>Phone</th><th>Status</th><th>Children</th></tr>${body}</table></body></html>`);
    w.document.close(); w.focus(); w.print();
  };

  return (
    <div className="mg-page">
      <div className="mg-head">
        <div>
          <div className="mg-title"><span className="material-symbols-outlined">diversity_3</span><h1>Parents Management</h1></div>
          <div className="mg-crumb">CCAST Bambili <span className="material-symbols-outlined">chevron_right</span> Records
            <span className="material-symbols-outlined">chevron_right</span> Parents
            {isFetching && <span className="mg-sync"><span className="material-symbols-outlined">sync</span> live syncing…</span>}
          </div>
        </div>
        <button className="mg-add" onClick={() => setEditing(BLANK)}><span className="material-symbols-outlined">person_add</span> Add Parent</button>
      </div>

      <div className="mg-kpis">
        <button className={`mg-kpi mg-kpi-navy ${!statusFilter && !multiChild ? "" : "op"}`} onClick={() => pickCard("all")} style={kpiBtn}>
          <div className="kl">All Parents</div><div className="kv">{k.all_parents ?? "—"}</div><div className="ki"><span className="material-symbols-outlined">groups</span></div></button>
        <button className={`mg-kpi mg-kpi-green ${statusFilter === "active" ? "" : "op"}`} onClick={() => pickCard("active")} style={kpiBtn}>
          <div className="kl">Active Status</div><div className="kv">{k.active ?? "—"}</div><div className="ki"><span className="material-symbols-outlined">task_alt</span></div></button>
        <button className={`mg-kpi mg-kpi-navy ${multiChild ? "" : "op"}`} onClick={() => pickCard("multi")} style={kpiBtn}>
          <div className="kl">Multi-Child Parents</div><div className="kv">{k.multi_child ?? "—"}</div><div className="ki"><span className="material-symbols-outlined">family_restroom</span></div></button>
        <button className={`mg-kpi mg-kpi-gray ${statusFilter === "inactive" ? "" : "op"}`} onClick={() => pickCard("inactive")} style={kpiBtn}>
          <div className="kl">Inactive</div><div className="kv">{k.inactive ?? "—"}</div><div className="ki"><span className="material-symbols-outlined">block</span></div></button>
      </div>

      <div className="surface-card mg-filters">
        <div className="mg-filters-hd">
          <span className="mg-filters-title"><span className="material-symbols-outlined">filter_alt</span> Filters</span>
          <button className="mg-clear" onClick={clearFilters}><span className="material-symbols-outlined">restart_alt</span> Clear</button>
        </div>
        <div className="mg-filters-grid cols-4">
          <label>Search<input className="form-control" placeholder="Name, mobile, email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label>
          <label>Relation<select className="form-select" value={relation} onChange={(e) => { setRelation(e.target.value); setPage(1); }}>
            <option value="">All Relations</option><option value="mother">Mother</option><option value="father">Father</option><option value="guardian">Guardian</option></select></label>
          <label>Language<select className="form-select" value={language} onChange={(e) => { setLanguage(e.target.value); setPage(1); }}>
            <option value="">All Languages</option><option value="en">English</option><option value="fr">French</option></select></label>
          <label>Contact Method<select className="form-select" value={contact} onChange={(e) => { setContact(e.target.value); setPage(1); }}>
            <option value="">All Methods</option><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="call">Call</option><option value="email">Email</option></select></label>
        </div>
      </div>

      <div className="surface-card mg-tablecard">
        <div className="mg-toolbar">
          <div className="mg-exports">
            <button className="mg-exp mg-exp-csv" onClick={exportCsv}><span className="material-symbols-outlined">table_view</span> Export CSV</button>
            <button className="mg-exp mg-exp-pdf" onClick={printTable}><span className="material-symbols-outlined">picture_as_pdf</span> Export PDF</button>
            <span className="mg-show">Show
              <select className="form-select form-select-sm" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}><option>10</option><option>25</option><option>50</option></select> entries</span>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table mg-table align-middle mb-0">
            <thead><tr>
              <th>ID</th><th>Parent Profile</th><th>Relation</th><th>Employer</th><th>Contact</th>
              <th>Prefers</th><th>Lang</th><th>Email</th><th>Status</th><th className="text-center">Children</th><th className="text-center">Actions</th>
            </tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={11} className="state-cell">Loading parents…</td></tr>}
              {isError && <tr><td colSpan={11} className="state-cell text-danger">Couldn't load parents.</td></tr>}
              {!isLoading && !isError && rows.length === 0 && <tr><td colSpan={11} className="state-cell">No parents match your filters.</td></tr>}
              {rows.map((g) => {
                const [pLbl, pTone] = PREFERS[g.preferred_contact] ?? [g.preferred_contact, "pill-gray"];
                return (
                  <tr key={g.id}>
                    <td className="text-secondary">{g.id}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="mg-avatar">{initials(g.full_name)}</div>
                        <div className="fw-semibold" style={{ fontSize: 13.5 }}>{g.full_name}</div>
                      </div>
                    </td>
                    <td>{g.relationship ? <span className={`mg-chip ${RELATION_TONE[g.relationship] ?? "mg-chip-gray"}`} style={{ textTransform: "capitalize" }}>{g.relationship}</span> : "—"}</td>
                    <td className="text-secondary" style={{ fontSize: 12.5 }}>{g.occupation || "—"}</td>
                    <td className="text-secondary" style={{ fontSize: 12.5 }}>{g.phone || "—"}</td>
                    <td>{g.preferred_contact ? <span className={`mg-chip ${pTone}`}>{pLbl}</span> : "—"}</td>
                    <td><span className="mg-pill mg-pill-lav">{(g.language || "—").toUpperCase()}</span></td>
                    <td className="text-secondary" style={{ fontSize: 12.5 }}>{g.email || "—"}</td>
                    <td><span className={`mg-status ${g.status === "active" ? "mg-status-green" : "mg-status-gray"}`}>{g.status}</span></td>
                    <td className="text-center"><span className="mg-count">{g.children_count}</span></td>
                    <td>
                      <div className="mg-actions justify-content-center">
                        <button title="View" onClick={() => view(g)}><span className="material-symbols-outlined">visibility</span></button>
                        <button title="Edit" className="edit" onClick={() => setEditing(g)}><span className="material-symbols-outlined">edit</span></button>
                        <button title="Delete" className="del" onClick={() => remove(g)}><span className="material-symbols-outlined">delete</span></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mg-foot">
          <span className="lbl">{m ? `Showing ${m.from ?? 0} to ${m.to ?? 0} of ${m.total} entries` : "—"}</span>
          <div className="mg-pager">
            <button disabled={!m || m.current_page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
            <span className="mg-page-cur">{m?.current_page ?? 1}</span>
            <button disabled={!m || m.current_page >= m.last_page} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      {editing && <ParentForm initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

const kpiBtn = { border: 0, textAlign: "left", cursor: "pointer" };

function ParentForm({ initial, onClose }) {
  const save = useSaveGuardian();
  const { data: students } = useAllStudents();
  const [form, setForm] = useState({ ...BLANK, ...initial });
  const [childIds, setChildIds] = useState(() => (initial.student_ids ?? initial.children?.map((c) => c.id) ?? []).map(Number));
  const [errors, setErrors] = useState({});
  const [childSearch, setChildSearch] = useState("");
  const isEdit = !!initial.id;
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const toggleChild = (id) => setChildIds((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  const list = (students ?? []).filter((s) => !childSearch || (s.full_name ?? "").toLowerCase().includes(childSearch.toLowerCase()));
  const submit = async () => {
    setErrors({});
    try { await save.mutateAsync({ ...form, student_ids: childIds }); toast.success(isEdit ? "Parent updated" : "Parent added"); onClose(); }
    catch (err) { setErrors(err.fieldErrors ?? {}); if (!err.fieldErrors) toast.error("Could not save."); }
  };
  return (
    <Modal title={isEdit ? "Edit parent" : "New parent"} onClose={onClose} size="modal-lg"
      footer={<><button className="btn btn-light" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</button></>}>
      <div className="row">
        <div className="col-md-6"><Field label="First name" required error={errors.first_name}><input className="form-control" value={form.first_name} onChange={set("first_name")} /></Field></div>
        <div className="col-md-6"><Field label="Last name" required error={errors.last_name}><input className="form-control" value={form.last_name} onChange={set("last_name")} /></Field></div>
        <div className="col-md-6"><Field label="Phone" required error={errors.phone}><input className="form-control" value={form.phone} onChange={set("phone")} /></Field></div>
        <div className="col-md-6"><Field label="Email" error={errors.email}><input className="form-control" value={form.email ?? ""} onChange={set("email")} /></Field></div>
        <div className="col-md-6"><Field label="Employer / Occupation" error={errors.occupation}><input className="form-control" value={form.occupation ?? ""} onChange={set("occupation")} /></Field></div>
        <div className="col-md-6"><Field label="Status"><select className="form-select" value={form.status} onChange={set("status")}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field></div>
        <div className="col-md-4"><Field label="Language"><select className="form-select" value={form.language ?? "en"} onChange={set("language")}><option value="en">English</option><option value="fr">French</option></select></Field></div>
        <div className="col-md-4"><Field label="Preferred contact"><select className="form-select" value={form.preferred_contact ?? "whatsapp"} onChange={set("preferred_contact")}><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="call">Call</option><option value="email">Email</option></select></Field></div>
        <div className="col-12"><Field label="Address" error={errors.address}><textarea className="form-control" rows="2" value={form.address ?? ""} onChange={set("address")} /></Field></div>
        <div className="col-12">
          <Field label="">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="fw-semibold" style={{ fontSize: 13.5 }}>Children</span>
              <span className="mg-count mg-count-purple">{childIds.length} selected</span>
            </div>
            <input className="form-control form-control-sm mb-2" placeholder="Search students…" value={childSearch} onChange={(e) => setChildSearch(e.target.value)} />
            <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid var(--outline-variant, #e2e8f0)", borderRadius: 8, padding: 8 }}>
              {list.length === 0 && <div className="text-secondary small p-1">No students found.</div>}
              {list.map((s) => (
                <label key={s.id} className="d-flex align-items-center gap-2 py-1" style={{ fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={childIds.includes(s.id)} onChange={() => toggleChild(s.id)} />
                  <span>{s.full_name}</span>
                  {s.admission_number && <span className="text-secondary">({s.admission_number})</span>}
                </label>
              ))}
            </div>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
