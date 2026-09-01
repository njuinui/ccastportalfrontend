import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import client from "../../api/client";
import { Users } from "../../api/admin18";
import { confirmDelete } from "../../lib/alerts";
import { initials, Modal, Field, useDebounced } from "../../components/ui";
import { Pager, csvExport, printRows } from "./_shell";
import "../../styles/mgmt.css";

const TABS = [
  { key: "", label: "All", tone: "dark", countKey: "all" },
  { key: "active", label: "Active", tone: "green", countKey: "active" },
  { key: "inactive", label: "Inactive", tone: "gray", countKey: "inactive" },
  { key: "suspended", label: "Suspended", tone: "red", countKey: "suspended" },
];
const ST = { active: "mg-status-green", inactive: "mg-status-gray", suspended: "mg-status-red" };
const BLANK = { name: "", email: "", password: "", phone: "", gender: "male", status: "active", role: "" };

export default function UsersPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [gender, setGender] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const debounced = useDebounced(search);

  const { data: meta } = Users.useMeta();
  const { data, isLoading, isError, isFetching } = Users.useList({ status: status || undefined, search: debounced || undefined, role: role || undefined, gender: gender || undefined, page });
  const del = Users.useRemove();
  const rows = data?.data ?? [];

  const remove = async (r) => { if (!(await confirmDelete({ title: "Delete user?", text: `${r.name} (${r.email})`, confirmText: "Delete" }))) return; try { await del.mutateAsync(r.id); toast.success("User removed"); } catch (e) { toast.error(e?.response?.data?.message || "Permission denied."); } };

  return (
    <div className="mg-page">
      <div className="mg-head">
        <div><div className="mg-title"><span className="material-symbols-outlined">manage_accounts</span><h1>Users Management</h1></div>
          <div className="mg-crumb">System Administration {isFetching && <span className="mg-sync"><span className="material-symbols-outlined">sync</span> syncing…</span>}</div></div>
        <button className="mg-add" style={{ background: "#16a34a" }} onClick={() => setEditing(BLANK)}><span className="material-symbols-outlined">person_add</span> Add New User</button>
      </div>
      <div className="mg-tabs">{TABS.map((t) => <button key={t.key || "all"} className={`mg-tab mg-tab-${t.tone} ${status === t.key ? "active" : ""}`} onClick={() => { setStatus(t.key); setPage(1); }}>{t.label} ({meta?.counts?.[t.countKey] ?? 0})</button>)}</div>
      <div className="surface-card mg-filters">
        <div className="mg-filters-hd"><span className="mg-filters-title"><span className="material-symbols-outlined">filter_alt</span> Filters</span>
          <button className="mg-clear" onClick={() => { setSearch(""); setRole(""); setGender(""); setStatus(""); setPage(1); }}><span className="material-symbols-outlined">restart_alt</span> Clear</button></div>
        <div className="mg-filters-grid cols-4">
          <label>Search<input className="form-control" placeholder="Search users…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label>
          <label>Role<select className="form-select" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}><option value="">All Roles</option>{(meta?.roles ?? []).map((r) => <option key={r} value={r}>{r}</option>)}</select></label>
          <label>Gender<select className="form-select" value={gender} onChange={(e) => { setGender(e.target.value); setPage(1); }}><option value="">All Genders</option><option value="male">Male</option><option value="female">Female</option></select></label>
          <label>&nbsp;<span className="text-secondary" style={{ fontWeight: 400, fontSize: 12 }}>{data?.total ?? 0} user(s)</span></label>
        </div>
      </div>
      <div className="surface-card mg-tablecard">
        <div className="mg-toolbar"><div className="mg-exports">
          <button className="mg-exp mg-exp-csv" onClick={() => csvExport("users.csv", ["ID", "Name", "Email", "Mobile", "Role", "Gender", "Status", "Joined"], rows, (r) => [r.id, r.name, r.email, r.phone, r.role, r.gender, r.status, r.joined])}><span className="material-symbols-outlined">table_view</span> CSV</button>
          <button className="mg-exp mg-exp-pdf" onClick={() => printRows("Users", ["ID", "Name", "Email", "Role", "Status"], rows, (r) => [r.id, r.name, r.email, r.role, r.status])}><span className="material-symbols-outlined">picture_as_pdf</span> PDF</button>
          <button className="mg-exp mg-exp-print" onClick={() => printRows("Users", ["ID", "Name", "Email", "Role", "Status"], rows, (r) => [r.id, r.name, r.email, r.role, r.status])}><span className="material-symbols-outlined">print</span> PRINT</button>
        </div></div>
        <div className="table-responsive">
          <table className="table mg-table align-middle mb-0">
            <thead><tr><th>ID</th><th>User</th><th>Email</th><th>Mobile</th><th>Role</th><th>Gender</th><th>Status</th><th>Joined</th><th>Last Login</th><th className="text-center">Actions</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={10} className="state-cell">Loading…</td></tr>}
              {isError && <tr><td colSpan={10} className="state-cell text-danger">Couldn't load users.</td></tr>}
              {!isLoading && !isError && rows.length === 0 && <tr><td colSpan={10} className="state-cell">No users match.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="text-secondary">{r.id}</td>
                  <td><div className="d-flex align-items-center gap-2">{r.avatar_url ? <img src={r.avatar_url} alt="" className="mg-avatar" style={{ width: 34, height: 34, objectFit: "cover" }} /> : <div className="mg-avatar" style={{ width: 34, height: 34, fontSize: 12 }}>{initials(r.name)}</div>}<div className="fw-semibold" style={{ fontSize: 13.5 }}>{r.name}</div></div></td>
                  <td className="text-primary" style={{ fontSize: 12.5 }}>{r.email}</td>
                  <td className="text-secondary" style={{ fontSize: 12.5 }}>{r.phone || "—"}</td>
                  <td>{r.role ? <span className="mg-chip mg-chip-purple" style={{ textTransform: "uppercase" }}>{r.role}</span> : "—"}</td>
                  <td className="text-secondary" style={{ textTransform: "capitalize", fontSize: 12.5 }}>{r.gender || "—"}</td>
                  <td><span className={`mg-status ${ST[r.status] ?? "mg-status-gray"}`}>{r.status}</span></td>
                  <td className="text-secondary" style={{ fontSize: 12 }}>{r.joined}</td>
                  <td className="text-secondary fst-italic" style={{ fontSize: 12 }}>{r.last_login ?? "N/A"}</td>
                  <td><div className="mg-actions justify-content-center">
                    <button title="Change role" onClick={() => setEditing(r)}><span className="material-symbols-outlined">key</span></button>
                    <button title="Edit" className="edit" onClick={() => setEditing(r)}><span className="material-symbols-outlined">edit</span></button>
                    <button title="Delete" className="del" onClick={() => remove(r)}><span className="material-symbols-outlined">delete</span></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager meta={data} setPage={setPage} unit="users" />
      </div>
      {editing && <UserForm initial={editing} roles={meta?.roles ?? []} onClose={() => setEditing(null)} />}
    </div>
  );
}

function UserForm({ initial, roles, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...BLANK, ...initial });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(initial.avatar_url || null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial.id;
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatar(f); setPreview(URL.createObjectURL(f));
  };
  const submit = async () => {
    setErrors({}); setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      if (!isEdit) fd.append("email", form.email);
      fd.append("status", form.status);
      if (form.phone) fd.append("phone", form.phone);
      if (form.gender) fd.append("gender", form.gender);
      if (form.role) fd.append("role", form.role);
      if (avatar) fd.append("avatar", avatar);
      let res;
      if (isEdit) { fd.append("_method", "PUT"); res = await client.post(`/users/${initial.id}`, fd); }
      else res = await client.post("/users", fd);
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["users-meta"] });
      toast.success(isEdit ? "User updated" : (res.data?.message || "User created — credentials sent"));
      onClose();
    } catch (err) {
      setErrors(err.fieldErrors ?? {});
      if (!err.fieldErrors) toast.error(err?.response?.data?.message || "Could not save.");
    } finally { setSaving(false); }
  };
  return (
    <Modal title={isEdit ? "Edit user" : "New user"} onClose={onClose} size="modal-lg"
      footer={<><button className="btn btn-light" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save"}</button></>}>
      <div className="d-flex align-items-center gap-3 mb-3">
        {preview ? <img src={preview} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} /> : <div className="mg-avatar" style={{ width: 64, height: 64, fontSize: 20 }}>{initials(form.name || "?")}</div>}
        <label className="btn btn-light btn-sm mb-0"><span className="material-symbols-outlined" style={{ verticalAlign: "-5px", fontSize: 18 }}>photo_camera</span> {preview ? "Change photo" : "Upload photo"}
          <input type="file" accept="image/*" hidden onChange={onFile} /></label>
      </div>
      <div className="row">
        <div className="col-md-6"><Field label="Full name" required error={errors.name}><input className="form-control" value={form.name} onChange={set("name")} /></Field></div>
        <div className="col-md-6"><Field label="Email" required error={errors.email}><input className="form-control" value={form.email} onChange={set("email")} disabled={isEdit} /></Field></div>
        <div className="col-md-6"><Field label="Role" error={errors.role}><select className="form-select" value={form.role ?? ""} onChange={set("role")}><option value="">— none —</option>{roles.map((r) => <option key={r} value={r}>{r}</option>)}</select></Field></div>
        <div className="col-md-3"><Field label="Phone"><input className="form-control" value={form.phone ?? ""} onChange={set("phone")} /></Field></div>
        <div className="col-md-3"><Field label="Gender"><select className="form-select" value={form.gender ?? "male"} onChange={set("gender")}><option value="male">Male</option><option value="female">Female</option></select></Field></div>
        <div className="col-md-4"><Field label="Status"><select className="form-select" value={form.status} onChange={set("status")}><option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option></select></Field></div>
      </div>
      {!isEdit && <div className="alert alert-info py-2 mt-2 mb-0" style={{ fontSize: 12.5 }}>
        <span className="material-symbols-outlined" style={{ verticalAlign: "-5px", fontSize: 18 }}>lock_reset</span> A secure password will be generated automatically and sent to the user by email and SMS.
      </div>}
    </Modal>
  );
}
