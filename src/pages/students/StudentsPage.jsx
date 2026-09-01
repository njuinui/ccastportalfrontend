import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useStudents,
  useDeleteStudent,
  useStudentsMeta,
} from "../../api/students";
import { useClasses } from "../../api/academic";
import { confirmDelete, confirmAction, swalSuccess } from "../../lib/alerts";
import { initials, useDebounced } from "../../components/ui";
import "./StudentsPage.css";

const TABS = [
  { key: "", label: "All", tone: "dark", countKey: "all" },
  { key: "active", label: "Active", tone: "green", countKey: "active" },
  { key: "inactive", label: "Inactive", tone: "gray", countKey: "inactive" },
  {
    key: "transferred",
    label: "Transferred",
    tone: "purple",
    countKey: "transferred",
  },
  {
    key: "graduated",
    label: "Passed Out",
    tone: "blue",
    countKey: "graduated",
  },
  { key: "suspended", label: "Suspended", tone: "red", countKey: "suspended" },
];
const STATUS_LABEL = {
  active: "Active",
  inactive: "Inactive",
  transferred: "Transferred",
  graduated: "Passed Out",
  suspended: "Suspended",
  withdrawn: "Withdrawn",
};
const STATUS_TONE = {
  active: "green",
  inactive: "gray",
  transferred: "purple",
  graduated: "blue",
  suspended: "red",
  withdrawn: "gray",
};

function csvCell(v) {
  const s = (v ?? "").toString();
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function StudentsPage() {
  const nav = useNavigate();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState("name");
  const [classId, setClassId] = useState("");
  const [gender, setGender] = useState("");
  const [level, setLevel] = useState("");
  const [address, setAddress] = useState("");
  const [boarding, setBoarding] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);

  const debounced = useDebounced(search);
  const { data: meta } = useStudentsMeta();
  const { data: classesData } = useClasses();
  const classes = classesData?.data ?? [];

  const params = {
    status: status || undefined,
    search: debounced || undefined,
    search_type: searchType,
    class_id: classId || undefined,
    gender: gender || undefined,
    english_level: level || undefined,
    address: address || undefined,
    boarding_status: boarding || undefined,
    per_page: perPage,
    page,
  };
  const { data, isLoading, isError, isFetching } = useStudents(params);
  const del = useDeleteStudent();

  const rows = data?.data ?? [];
  const m = data?.meta;
  const counts = meta?.counts ?? {};

  const setFilter = (setter) => (v) => {
    setter(v);
    setPage(1);
  };
  const clearFilters = () => {
    setStatus("");
    setSearch("");
    setClassId("");
    setGender("");
    setLevel("");
    setAddress("");
    setBoarding("");
    setPage(1);
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const toggleAll = () => {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  };

  const remove = async (s) => {
    if (
      !(await confirmDelete({
        title: "Remove student?",
        text: `${s.full_name} will be removed.`,
        confirmText: "Yes, remove",
      }))
    )
      return;
    try {
      await del.mutateAsync(s.id);
      toast.success("Student removed");
    } catch {
      toast.error("Permission denied.");
    }
  };

  const bulkDelete = async () => {
    if (
      !(await confirmDelete({
        title: `Remove ${selected.size} students?`,
        text: "This action cannot be undone.",
        confirmText: "Remove all",
      }))
    )
      return;
    toast.success(`${selected.size} students removed`);
    setSelected(new Set());
  };

  const exportCsv = () => {
    if (!rows.length) return toast.error("Nothing to export.");
    const h = [
      "Admission",
      "Name",
      "Gender",
      "Class",
      "Section",
      "Status",
      "Parent",
      "Parent Phone",
      "Emergency #",
      "Address",
    ];
    const lines = [h.join(",")];
    rows.forEach((s) =>
      lines.push(
        [
          s.admission_number,
          s.full_name,
          s.gender,
          s.current_class,
          s.current_section,
          s.status,
          s.father_name || s.parent_name,
          s.father_phone || s.parent_contact,
          s.emergency_phone,
          s.address,
        ]
          .map(csvCell)
          .join(","),
      ),
    );
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "students.csv";
    a.click();
    toast.success("CSV exported");
  };

  const printIds = () => {
    if (!selected.size) return toast.error("Select students first.");
    toast.success(`Printing ${selected.size} ID cards…`);
  };

  /* Pagination pages */
  const pages = useMemo(() => {
    if (!m) return [];
    const pgs = [];
    const last = m.last_page;
    const cur = m.current_page;
    pgs.push(1);
    if (cur > 3) pgs.push("...");
    for (let i = Math.max(2, cur - 1); i <= Math.min(last - 1, cur + 1); i++)
      pgs.push(i);
    if (cur < last - 2) pgs.push("...");
    if (last > 1) pgs.push(last);
    return pgs;
  }, [m]);

  return (
    <div className="sm-page">
      {/* ── Quick Stats ── */}
      <div className="sm-stats">
        <div className="sm-stat">
          <span className="sm-stat-num">{counts.all ?? 0}</span>
          <span className="sm-stat-label">Total Students</span>
        </div>
        <div className="sm-stat sm-stat-active">
          <span className="sm-stat-num">{counts.active ?? 0}</span>
          <span className="sm-stat-label">Active</span>
        </div>
        <div className="sm-stat sm-stat-boys">
          <span className="sm-stat-num">{counts.male ?? 0}</span>
          <span className="sm-stat-label">Boys</span>
        </div>
        <div className="sm-stat sm-stat-girls">
          <span className="sm-stat-num">{counts.female ?? 0}</span>
          <span className="sm-stat-label">Girls</span>
        </div>
        <div className="sm-stat sm-stat-boarding">
          <span className="sm-stat-num">{counts.boarding ?? 0}</span>
          <span className="sm-stat-label">Boarders</span>
        </div>
        <div className="sm-stat sm-stat-day">
          <span className="sm-stat-num">{counts.day ?? 0}</span>
          <span className="sm-stat-label">Day Students</span>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="sm-head">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <h1 className="page-title">Students</h1>
          {isFetching && (
            <span className="sm-sync">
              <span className="material-symbols-outlined">sync</span> syncing…
            </span>
          )}
        </div>
        <button className="btn sm-add" onClick={() => nav("/students/new")}>
          <span className="material-symbols-outlined">person_add</span>
          <span className="sm-add-text">Add Student</span>
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="sm-tabs">
        {TABS.map((t) => (
          <button
            key={t.key || "all"}
            className={`sm-tab sm-tab-${t.tone} ${status === t.key ? "active" : ""}`}
            onClick={() => {
              setStatus(t.key);
              setPage(1);
            }}
          >
            {t.label} ({counts[t.countKey] ?? 0})
          </button>
        ))}
      </div>

      {/* ── Search + Filter Toggle ── */}
      <div className="sm-search-bar">
        <div className="sm-search-left">
          <select
            className="form-select form-select-sm sm-search-type"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value="name">Name</option>
            <option value="admission_number">Admission #</option>
            <option value="phone">Phone</option>
            <option value="parent">Parent</option>
            <option value="address">Address</option>
          </select>
          <div className="sm-search-input-wrap">
            <span className="material-symbols-outlined">search</span>
            <input
              className="form-control"
              placeholder={`Search by ${searchType.replace("_", " ")}…`}
              value={search}
              onChange={(e) => setFilter(setSearch)(e.target.value)}
            />
          </div>
        </div>
        <button
          className={`sm-filter-toggle ${filtersOpen ? "active" : ""}`}
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <span className="material-symbols-outlined">tune</span>
          <span className="sm-filter-toggle-text">Filters</span>
        </button>
      </div>

      {/* ── Filters Panel ── */}
      {filtersOpen && (
        <div className="surface-card sm-filters">
          <div className="sm-filters-hd">
            <span className="sm-filters-title">
              <span className="material-symbols-outlined">filter_alt</span>{" "}
              Advanced Filters
            </span>
            <button className="sm-clear" onClick={clearFilters}>
              <span className="material-symbols-outlined">cancel</span>
              <span className="sm-clear-text">Clear all</span>
            </button>
          </div>
          <div className="sm-filters-grid">
            <label>
              <span className="material-symbols-outlined">layers</span> Class
              <select
                className="form-select"
                value={classId}
                onChange={(e) => setFilter(setClassId)(e.target.value)}
              >
                <option value="">All</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="material-symbols-outlined">wc</span> Gender
              <select
                className="form-select"
                value={gender}
                onChange={(e) => setFilter(setGender)(e.target.value)}
              >
                <option value="">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
            <label>
              <span className="material-symbols-outlined">flag</span> Status
              <select
                className="form-select"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="transferred">Transferred</option>
                <option value="graduated">Passed Out</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
            <label>
              <span className="material-symbols-outlined">translate</span>{" "}
              English Level
              <select
                className="form-select"
                value={level}
                onChange={(e) => setFilter(setLevel)(e.target.value)}
              >
                <option value="">All</option>
                {(meta?.english_levels ?? []).map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="material-symbols-outlined">home</span> House
              <select
                className="form-select"
                value={address}
                onChange={(e) => setFilter(setAddress)(e.target.value)}
              >
                <option value="">All</option>
                {(meta?.addresses ?? []).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="material-symbols-outlined">bed</span> Boarding
              <select
                className="form-select"
                value={boarding}
                onChange={(e) => setFilter(setBoarding)(e.target.value)}
              >
                <option value="">All</option>
                <option value="boarding">Boarding</option>
                <option value="day">Day</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {/* ── Bulk Actions ── */}
      {selected.size > 0 && (
        <div className="sm-bulk">
          <span className="sm-bulk-count">{selected.size} selected</span>
          <div className="sm-bulk-actions">
            <button onClick={() => toast("Promote feature — wire to API")}>
              <span className="material-symbols-outlined">trending_up</span>
              <span className="sm-bulk-text">Promote</span>
            </button>
            <button onClick={() => toast("Assign class — wire to API")}>
              <span className="material-symbols-outlined">layers</span>
              <span className="sm-bulk-text">Assign Class</span>
            </button>
            <button onClick={printIds}>
              <span className="material-symbols-outlined">badge</span>
              <span className="sm-bulk-text">Print IDs</span>
            </button>
            <button onClick={exportCsv}>
              <span className="material-symbols-outlined">download</span>
              <span className="sm-bulk-text">Export</span>
            </button>
            <button className="sm-bulk-del" onClick={bulkDelete}>
              <span className="material-symbols-outlined">delete</span>
              <span className="sm-bulk-text">Delete</span>
            </button>
          </div>
          <button
            className="sm-bulk-close"
            onClick={() => setSelected(new Set())}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      {/* ── Table Card ── */}
      <div className="surface-card sm-tablecard">
        <div className="sm-toolbar">
          <div className="sm-exports">
            <button className="sm-exp sm-exp-csv" onClick={exportCsv}>
              <span className="material-symbols-outlined">table_view</span>
              <span className="sm-exp-text">CSV</span>
            </button>
            <button
              className="sm-exp sm-exp-print"
              onClick={() => window.print()}
            >
              <span className="material-symbols-outlined">print</span>
              <span className="sm-exp-text">Print</span>
            </button>
            <span className="sm-show">
              Show
              <select
                className="form-select form-select-sm"
                value={perPage}
                onChange={(e) => {
                  setPerPage(+e.target.value);
                  setPage(1);
                }}
              >
                <option>10</option>
                <option>25</option>
                <option>50</option>
                <option>100</option>
              </select>{" "}
              entries
            </span>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="table-responsive sm-table-wrap">
          <table className="table sm-table align-middle mb-0">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selected.size === rows.length && rows.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th style={{ width: 48 }}></th>
                <th>ADM #</th>
                <th>Student</th>
                <th>Class</th>
                <th>Parent</th>
                <th>Phone</th>
                <th>Status</th>
                <th className="text-center" style={{ width: 160 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={9} className="state-cell">
                    Loading…
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={9} className="state-cell text-danger">
                    Couldn't load students.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && !rows.length && (
                <tr>
                  <td colSpan={9} className="state-cell">
                    No students match your filters.
                  </td>
                </tr>
              )}
              {rows.map((s) => (
                <tr
                  key={s.id}
                  className={selected.has(s.id) ? "sm-row-selected" : ""}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggleSelect(s.id)}
                    />
                  </td>
                  <td>
                    <div
                      className="sm-photo-cell"
                      onClick={() =>
                        nav(`/students/${s.id}`, { state: { student: s } })
                      }
                    >
                      {s.student_photo ? (
                        <img src={s.student_photo} alt="" />
                      ) : (
                        <span className="sm-photo-init">
                          {initials(s.full_name)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="sm-adm">{s.admission_number}</span>
                  </td>
                  <td>
                    <div
                      className="sm-name-cell"
                      onClick={() =>
                        nav(`/students/${s.id}`, { state: { student: s } })
                      }
                    >
                      <span className="fw-semibold">{s.full_name}</span>
                      <span className="sm-name-sub">
                        {s.gender} ·{" "}
                        {s.boarding_status === "boarding" ? "Boarding" : "Day"}
                      </span>
                    </div>
                  </td>
                  <td className="text-secondary">
                    {s.current_class
                      ? `${s.current_class}${s.current_section ? " " + s.current_section : ""}`
                      : "—"}
                  </td>
                  <td className="text-secondary" style={{ fontSize: 13 }}>
                    {s.father_name || s.parent_name || "—"}
                  </td>
                  <td className="text-secondary" style={{ fontSize: 13 }}>
                    {s.father_phone || s.phone || "—"}
                  </td>
                  <td>
                    <span
                      className={`sm-status sm-status-${STATUS_TONE[s.status] ?? "gray"}`}
                    >
                      {STATUS_LABEL[s.status] ?? s.status}
                    </span>
                  </td>
                  <td>
                    <div className="sm-actions">
                      <button
                        title="View"
                        onClick={() =>
                          nav(`/students/${s.id}`, { state: { student: s } })
                        }
                      >
                        <span className="material-symbols-outlined">
                          visibility
                        </span>
                      </button>
                      <button
                        title="ID Card"
                        onClick={() =>
                          nav(`/students/${s.id}`, {
                            state: { student: s, tab: "documents" },
                          })
                        }
                      >
                        <span className="material-symbols-outlined">badge</span>
                      </button>
                      <button
                        title="Edit"
                        className="edit"
                        onClick={() =>
                          nav(`/students/${s.id}/edit`, {
                            state: { student: s },
                          })
                        }
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        title="Delete"
                        className="del"
                        onClick={() => remove(s)}
                      >
                        <span className="material-symbols-outlined">
                          delete
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm-cards">
          {rows.map((s) => (
            <div
              key={s.id}
              className={`sm-card${selected.has(s.id) ? " sm-card-selected" : ""}`}
            >
              <div
                className="sm-card-top"
                onClick={() =>
                  nav(`/students/${s.id}`, { state: { student: s } })
                }
              >
                <div className="sm-card-photo">
                  {s.student_photo ? (
                    <img src={s.student_photo} alt="" />
                  ) : (
                    <span>{initials(s.full_name)}</span>
                  )}
                </div>
                <div className="sm-card-info">
                  <div className="fw-semibold sm-card-name">{s.full_name}</div>
                  <div className="sm-card-meta">
                    {s.admission_number} · {s.current_class ?? "—"}
                    {s.current_section ? " " + s.current_section : ""}
                  </div>
                  <div className="sm-card-sub">
                    {s.father_name || s.parent_name || "—"} ·{" "}
                    {s.father_phone || s.phone || "—"}
                  </div>
                </div>
                <span
                  className={`sm-status sm-status-${STATUS_TONE[s.status] ?? "gray"} sm-card-status`}
                >
                  {STATUS_LABEL[s.status] ?? s.status}
                </span>
              </div>
              <div className="sm-card-actions">
                <label className="sm-card-check">
                  <input
                    type="checkbox"
                    checked={selected.has(s.id)}
                    onChange={() => toggleSelect(s.id)}
                  />
                </label>
                <button
                  onClick={() =>
                    nav(`/students/${s.id}`, { state: { student: s } })
                  }
                >
                  <span className="material-symbols-outlined">visibility</span>
                  View
                </button>
                <button
                  className="edit"
                  onClick={() =>
                    nav(`/students/${s.id}/edit`, { state: { student: s } })
                  }
                >
                  <span className="material-symbols-outlined">edit</span>Edit
                </button>
                <button className="del" onClick={() => remove(s)}>
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          ))}
          {isLoading && <div className="state-cell">Loading…</div>}
          {!isLoading && !isError && !rows.length && (
            <div className="state-cell">No students found.</div>
          )}
        </div>

        {/* Pagination */}
        <div className="sm-foot">
          <span className="text-secondary" style={{ fontSize: 13 }}>
            {m ? `Showing ${m.from ?? 0}–${m.to ?? 0} of ${m.total}` : "—"}
          </span>
          <div className="sm-pager">
            <button
              disabled={!m || m.current_page <= 1}
              onClick={() => setPage(1)}
            >
              <span className="material-symbols-outlined">first_page</span>
            </button>
            <button
              disabled={!m || m.current_page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            {pages.map((p, i) =>
              p === "..." ? (
                <span key={`e${i}`} className="sm-page-ellipsis">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  className={m?.current_page === p ? "sm-page-active" : ""}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ),
            )}
            <button
              disabled={!m || m.current_page >= m.last_page}
              onClick={() => setPage((p) => p + 1)}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
            <button
              disabled={!m || m.current_page >= m.last_page}
              onClick={() => setPage(m.last_page)}
            >
              <span className="material-symbols-outlined">last_page</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
