import { useState } from "react";
import toast from "react-hot-toast";
import {
    useActivities,
    useActivitiesMeta,
    useCreateActivity,
    useUpdateActivity,
    useDeleteActivity,
} from "../../api/activityRegistry";
import { useDebounced, Modal, Field, StateRow } from "../../components/ui";
import { Pager, csvExport } from "./_shell";
import { confirmDelete } from "../../lib/alerts";

const LEVEL_TABS = [
    { key: "all", label: "All", color: "#1e3a5f" },
    { key: "school", label: "School", color: "#2563eb" },
    { key: "district", label: "District", color: "#059669" },
    { key: "state", label: "State", color: "#d97706" },
    { key: "national", label: "National", color: "#ea580c" },
    { key: "international", label: "International", color: "#dc2626" },
];

const TYPE_PILL = {
    sports: "pill-amber",
    academic: "pill-blue",
    dance: "pill-red",
    music: "pill-green",
    club: "pill-gray",
    other: "pill-gray",
};

const LEVEL_PILL = {
    school: "pill-blue",
    district: "pill-green",
    state: "pill-amber",
    national: "pill-red",
    international: "pill-red",
};

const BLANK = {
    student_id: "",
    activity: "",
    type: "sports",
    level: "school",
    position: "",
    activity_date: "",
    notes: "",
};

export default function ActivityRegistryPage() {
    const [level, setLevel] = useState("all");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [editing, setEditing] = useState(null); // null = closed, {} = create, {...} = edit
    const debouncedSearch = useDebounced(search);

    const { data: meta, refetch: refetchMeta } = useActivitiesMeta();
    const { data, isLoading, isError, refetch } = useActivities({
        level: level === "all" ? undefined : level,
        search: debouncedSearch || undefined,
        page,
        per_page: perPage,
    });
    const create = useCreateActivity();
    const update = useUpdateActivity();
    const del = useDeleteActivity();

    const rows = data?.data ?? [];
    const counts = meta?.by_level ?? {};
    const total = meta?.total ?? 0;

    const syncData = () => {
        refetch();
        refetchMeta();
        toast.success("Data refreshed");
    };

    const remove = async (row) => {
        if (
            !(await confirmDelete({
                title: "Delete activity record?",
                text: `${row.student} — ${row.activity}`,
                confirmText: "Delete",
            }))
        )
            return;
        try {
            await del.mutateAsync(row.id);
            toast.success("Activity removed");
        } catch {
            toast.error("Permission denied.");
        }
    };

    return (
        <div className="container-fluid px-0" style={{ maxWidth: 1400 }}>
            {/* Header */}
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                <div>
                    <h1 className="page-title mb-1">Activity Registry</h1>
                    <p className="page-sub mb-0">
                        Monitor and manage institutional participation in external and internal events.
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-light d-flex align-items-center gap-1" onClick={syncData}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>sync</span>
                        Sync Data
                    </button>
                    <button
                        className="btn btn-primary d-flex align-items-center gap-1"
                        onClick={() => setEditing({ ...BLANK })}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                        Record Activity
                    </button>
                </div>
            </div>

            {/* Level tabs */}
            <div className="d-flex flex-wrap gap-2 mb-3">
                {LEVEL_TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => { setLevel(t.key); setPage(1); }}
                        style={{
                            border: "none",
                            borderRadius: 8,
                            padding: "10px 18px",
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#fff",
                            background: level === t.key ? t.color : `${t.color}99`,
                            cursor: "pointer",
                            opacity: level === t.key ? 1 : 0.6,
                        }}
                    >
                        {t.label.toUpperCase()} ({t.key === "all" ? total : counts[t.key] ?? 0})
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="surface-card">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 p-3 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                        <button
                            className="btn btn-sm btn-light"
                            onClick={() =>
                                csvExport(
                                    "activity-registry.csv",
                                    ["Date", "Student", "Activity", "Type", "Level", "Position"],
                                    rows,
                                    (r) => [r.date, r.student, r.activity, r.type, r.level, r.position],
                                )
                            }
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>table_view</span>{" "}
                            Export CSV
                        </button>
                        <span className="text-secondary small">
                            Show{" "}
                            <select
                                className="form-select form-select-sm d-inline-block"
                                style={{ width: 70 }}
                                value={perPage}
                                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                            >
                                {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>{" "}
                            entries
                        </span>
                    </div>
                    <input
                        className="form-control form-control-sm"
                        style={{ maxWidth: 220 }}
                        placeholder="Search…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>

                <div className="table-responsive">
                    <table className="table table-clean align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Student</th>
                                <th>Activity</th>
                                <th>Type</th>
                                <th>Level</th>
                                <th>Position</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <StateRow colSpan={7} loading={isLoading} error={isError} empty={!isLoading && rows.length === 0} />
                            {rows.map((r) => (
                                <tr key={r.id}>
                                    <td className="text-secondary" style={{ fontSize: 12.5 }}>{r.date}</td>
                                    <td>
                                        <div className="fw-semibold" style={{ fontSize: 13 }}>{r.student}</div>
                                        {r.student_class && (
                                            <div className="text-secondary" style={{ fontSize: 11 }}>{r.student_class}</div>
                                        )}
                                    </td>
                                    <td style={{ fontSize: 13 }}>{r.activity}</td>
                                    <td><span className={`pill ${TYPE_PILL[r.type] || "pill-gray"}`}>{r.type}</span></td>
                                    <td><span className={`pill ${LEVEL_PILL[r.level] || "pill-gray"}`}>{r.level}</span></td>
                                    <td style={{ fontSize: 13 }}>{r.position || "—"}</td>
                                    <td className="text-end">
                                        <div className="d-inline-flex gap-1">
                                            <button className="ad-eye" title="View" onClick={() => setEditing({ ...r, readOnly: true })}>
                                                <span className="material-symbols-outlined">visibility</span>
                                            </button>
                                            <button className="ad-eye" title="Edit" onClick={() => setEditing({ ...r })}>
                                                <span className="material-symbols-outlined">edit</span>
                                            </button>
                                            <button className="ad-eye" title="Delete" style={{ color: "#dc2626" }} onClick={() => remove(r)}>
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pager meta={data} setPage={setPage} unit="records" />
            </div>

            {editing && (
                <ActivityModal
                    initial={editing}
                    onClose={() => setEditing(null)}
                    onSubmit={async (payload) => {
                        try {
                            if (editing.id) await update.mutateAsync({ id: editing.id, ...payload });
                            else await create.mutateAsync(payload);
                            toast.success(editing.id ? "Activity updated" : "Activity recorded");
                            setEditing(null);
                        } catch {
                            toast.error("Could not save. Check required fields.");
                        }
                    }}
                />
            )}
        </div>
    );
}

function ActivityModal({ initial, onClose, onSubmit }) {
    const [form, setForm] = useState({
        student_id: initial.student_id || "",
        activity: initial.activity || "",
        type: initial.type || "sports",
        level: initial.level || "school",
        position: initial.position || "",
        activity_date: initial.date || initial.activity_date || "",
        notes: initial.notes || "",
    });
    const readOnly = !!initial.readOnly;
    const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

    return (
        <Modal
            title={readOnly ? "Activity details" : initial.id ? "Edit activity" : "Record activity"}
            onClose={onClose}
            footer={
                !readOnly && (
                    <>
                        <button className="btn btn-light" onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary" onClick={() => onSubmit(form)}>
                            {initial.id ? "Save changes" : "Record"}
                        </button>
                    </>
                )
            }
        >
            <div className="row">
                <div className="col-md-6">
                    <Field label="Student ID" required>
                        <input className="form-control" value={form.student_id} onChange={set("student_id")} disabled={readOnly} />
                    </Field>
                </div>
                <div className="col-md-6">
                    <Field label="Date" required>
                        <input type="date" className="form-control" value={form.activity_date} onChange={set("activity_date")} disabled={readOnly} />
                    </Field>
                </div>
                <div className="col-md-6">
                    <Field label="Activity" required>
                        <input className="form-control" value={form.activity} onChange={set("activity")} disabled={readOnly} />
                    </Field>
                </div>
                <div className="col-md-3">
                    <Field label="Type">
                        <select className="form-select" value={form.type} onChange={set("type")} disabled={readOnly}>
                            {["sports", "academic", "dance", "music", "club", "other"].map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </Field>
                </div>
                <div className="col-md-3">
                    <Field label="Level">
                        <select className="form-select" value={form.level} onChange={set("level")} disabled={readOnly}>
                            {["school", "district", "state", "national", "international"].map((l) => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </Field>
                </div>
                <div className="col-md-6">
                    <Field label="Position / Result">
                        <input className="form-control" placeholder="e.g. 1st place, Participated" value={form.position} onChange={set("position")} disabled={readOnly} />
                    </Field>
                </div>
                <div className="col-12">
                    <Field label="Notes">
                        <textarea className="form-control" rows={2} value={form.notes} onChange={set("notes")} disabled={readOnly} />
                    </Field>
                </div>
            </div>
        </Modal>
    );
}