// src/pages/admin/StaffPage.jsx
// ============================================================
// CCAST SCHOOL MANAGEMENT SYSTEM
// Teachers & Staff Management
// ============================================================

import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
  useStaff,
  useStaffMeta,
  useSaveStaff,
  useDeleteStaff,
} from "../../api/staff";

import { confirmDelete, swalInfo } from "../../lib/alerts";

import {
  initials,
  Modal,
  Field,
  useDebounced,
} from "../../components/ui";

import {
  useTeacherAssignments,
  useAssignTeacher,
  useUnassignTeacher,
} from "../../api/assignments";

import { useClasses } from "../../api/academic";
import { useSubjects } from "../../api/subjects";

import "../../styles/mgmt.css";

/* ============================================================
   DEFAULT FORM
============================================================ */

const BLANK = {
  staff_number: "",
  first_name: "",
  last_name: "",
  middle_name: "",

  gender: "male",
  date_of_birth: "",

  phone: "",
  alternate_phone: "",
  email: "",
  address: "",

  category: "teaching",
  designation: "",
  specialization: "",
  qualification: "",
  professional_registration: "",

  hired_on: "",
  status: "active",

  employment_type: "full_time",
  department: "",

  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_relationship: "",

  photo: null,
};

/* ============================================================
   FILTER TABS
============================================================ */

const TABS = [
  {
    key: "",
    label: "All",
    tone: "dark",
    countKey: "all",
  },
  {
    key: "active",
    label: "Active",
    tone: "green",
    countKey: "active",
  },
  {
    key: "left",
    label: "Inactive",
    tone: "gray",
    countKey: "inactive",
  },
  {
    key: "suspended",
    label: "Suspended",
    tone: "red",
    countKey: "suspended",
  },
];

/* ============================================================
   STATUS MAP
============================================================ */

const STATUS = {
  active: ["Active", "green"],
  left: ["Inactive", "gray"],
  suspended: ["Suspended", "red"],
};

/* ============================================================
   COMPONENT
============================================================ */

export default function StaffPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState(null);
  const [assigning, setAssigning] = useState(null);

  const debounced = useDebounced(search);

  /* ----------------------------------------------------------
     DATA
  ---------------------------------------------------------- */

  const { data: meta } = useStaffMeta();

  const {
    data,
    isLoading,
    isError,
    isFetching,
  } = useStaff({
    category: "teaching",
    status: status || undefined,
    search: debounced || undefined,
    per_page: perPage,
    page,
  });

  const del = useDeleteStaff();

  const rows = data?.data ?? [];
  const pagination = data?.meta;

  const kpis = meta?.kpis ?? {};
  const counts = meta?.counts ?? {};

  /* ----------------------------------------------------------
     REMOVE STAFF
  ---------------------------------------------------------- */

  const remove = async (staff) => {
    const confirmed = await confirmDelete({
      title: "Remove staff member?",
      text: `${staff.full_name} will be removed from the teacher records.`,
      confirmText: "Yes, remove",
    });

    if (!confirmed) return;

    try {
      await del.mutateAsync(staff.id);

      toast.success("Teacher removed successfully.");
    } catch (error) {
      toast.error(
        error?.message ||
        "Permission denied or teacher could not be removed."
      );
    }
  };

  /* ----------------------------------------------------------
     VIEW STAFF
  ---------------------------------------------------------- */

  const view = (staff) => {
    swalInfo(
      staff.full_name,
      `Staff No: ${staff.staff_number}
Specialization: ${staff.specialization ?? "—"}
Qualification: ${staff.qualification ?? "—"}
Designation: ${staff.designation ?? "—"}
Classes: ${staff.classes_count ?? 0}
Subjects: ${staff.subjects_count ?? 0}
Lead Class: ${staff.lead_class ?? "—"}
Email: ${staff.email ?? "—"}
Phone: ${staff.phone ?? "—"}
Status: ${staff.status}`
    );
  };

  /* ----------------------------------------------------------
     CSV EXPORT
  ---------------------------------------------------------- */

  const exportCsv = () => {
    if (!rows.length) {
      toast.error("Nothing to export.");
      return;
    }

    const head = [
      "Staff No",
      "Name",
      "Email",
      "Phone",
      "Specialization",
      "Qualification",
      "Classes",
      "Subjects",
      "Lead Class",
      "Status",
    ];

    const lines = [head.join(",")];

    rows.forEach((staff) => {
      lines.push(
        [
          staff.staff_number,
          staff.full_name,
          staff.email,
          staff.phone,
          staff.specialization,
          staff.qualification,
          staff.classes_count,
          staff.subjects_count,
          staff.lead_class,
          staff.status,
        ]
          .map(
            (value) =>
              `"${(value ?? "")
                .toString()
                .replace(/"/g, '""')}"`
          )
          .join(",")
      );
    });

    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "CCAST-teachers.csv";

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);

    toast.success("CSV exported successfully.");
  };

  /* ----------------------------------------------------------
     PRINT
  ---------------------------------------------------------- */

  const printTable = () => {
    if (!rows.length) {
      toast.error("Nothing to print.");
      return;
    }

    const body = rows
      .map(
        (staff) => `
          <tr>
            <td>${escapeHtml(staff.staff_number)}</td>
            <td>${escapeHtml(staff.full_name)}</td>
            <td>${escapeHtml(staff.specialization ?? "")}</td>
            <td>${escapeHtml(staff.qualification ?? "")}</td>
            <td>${staff.classes_count ?? 0}</td>
            <td>${staff.subjects_count ?? 0}</td>
            <td>${escapeHtml(staff.status ?? "")}</td>
          </tr>
        `
      )
      .join("");

    const w = window.open("", "_blank");

    if (!w) {
      toast.error("Allow pop-ups to print.");
      return;
    }

    w.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>CCAST Bambili — Teachers</title>

          <style>
            body {
              font-family: Inter, Arial, sans-serif;
              padding: 30px;
              color: #1f2937;
            }

            h1 {
              margin-bottom: 4px;
              font-size: 24px;
            }

            p {
              margin-top: 0;
              color: #64748b;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 24px;
              font-size: 12px;
            }

            th,
            td {
              border: 1px solid #d1d5db;
              padding: 8px 10px;
              text-align: left;
            }

            th {
              background: #f1f5f9;
              font-weight: 700;
            }

            @media print {
              body {
                padding: 10px;
              }
            }
          </style>
        </head>

        <body>
          <h1>CCAST Bambili — Teachers</h1>
          <p>Teachers Management Report</p>

          <table>
            <thead>
              <tr>
                <th>Staff No</th>
                <th>Name</th>
                <th>Specialization</th>
                <th>Qualification</th>
                <th>Classes</th>
                <th>Subjects</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              ${body}
            </tbody>
          </table>
        </body>
      </html>
    `);

    w.document.close();
    w.focus();

    setTimeout(() => {
      w.print();
    }, 300);
  };

  /* ----------------------------------------------------------
     CLEAR FILTERS
  ---------------------------------------------------------- */

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setPage(1);
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="mg-page">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mg-head">
        <div>
          <div className="mg-title">
            <span className="material-symbols-outlined">
              groups
            </span>

            <h1>Teachers Management</h1>
          </div>

          <div className="mg-crumb">
            <span>CCAST Bambili</span>

            <span className="material-symbols-outlined">
              chevron_right
            </span>

            <span>Records</span>

            <span className="material-symbols-outlined">
              chevron_right
            </span>

            <span>Teachers</span>

            {isFetching && (
              <span className="mg-sync">
                <span className="material-symbols-outlined">
                  sync
                </span>

                syncing…
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          className="mg-add"
          onClick={() => setEditing({ ...BLANK })}
        >
          <span className="material-symbols-outlined">
            person_add
          </span>

          Add New Teacher
        </button>
      </div>

      {/* ======================================================
          KPI CARDS
      ====================================================== */}

      <div className="mg-kpis">
        <Kpi
          tone="navy"
          label="Total Teachers"
          value={kpis.total_teachers}
          icon="groups"
        />

        <Kpi
          tone="green"
          label="Active Teachers"
          value={kpis.active}
          icon="task_alt"
        />

        <Kpi
          tone="purple"
          label="Assignments"
          value={kpis.assignments}
          icon="assignment"
        />

        <Kpi
          tone="amber"
          label="Class Leads"
          value={kpis.class_leads}
          icon="star"
        />
      </div>

      {/* ======================================================
          STATUS TABS
      ====================================================== */}

      <div className="mg-tabs">
        {TABS.map((tab) => (
          <button
            type="button"
            key={tab.key || "all"}
            className={`
              mg-tab
              mg-tab-${tab.tone}
              ${status === tab.key ? "active" : ""}
            `}
            onClick={() => {
              setStatus(tab.key);
              setPage(1);
            }}
          >
            {tab.label} ({counts[tab.countKey] ?? 0})
          </button>
        ))}
      </div>

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="surface-card mg-filters">
        <div className="mg-filters-hd">
          <span className="mg-filters-title">
            <span className="material-symbols-outlined">
              filter_alt
            </span>

            Search &amp; Filters
          </span>

          <button
            type="button"
            className="mg-clear"
            onClick={clearFilters}
          >
            <span className="material-symbols-outlined">
              restart_alt
            </span>

            Clear Filters
          </button>
        </div>

        <div className="mg-filters-grid cols-1">
          <div className="position-relative">
            <span
              className="material-symbols-outlined"
              style={{
                position: "absolute",
                left: 12,
                top: 11,
                color: "var(--outline)",
                fontSize: 20,
              }}
            >
              search
            </span>

            <input
              className="form-control"
              style={{ paddingLeft: 40 }}
              placeholder="Search by name, staff number, email, or mobile…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="surface-card mg-tablecard">
        <div className="mg-toolbar">
          <div className="mg-exports">
            <button
              type="button"
              className="mg-exp mg-exp-csv"
              onClick={exportCsv}
            >
              <span className="material-symbols-outlined">
                table_view
              </span>

              CSV
            </button>

            <button
              type="button"
              className="mg-exp mg-exp-pdf"
              onClick={printTable}
            >
              <span className="material-symbols-outlined">
                picture_as_pdf
              </span>

              PDF
            </button>

            <button
              type="button"
              className="mg-exp mg-exp-print"
              onClick={printTable}
            >
              <span className="material-symbols-outlined">
                print
              </span>

              PRINT
            </button>

            <span className="mg-show">
              Show

              <select
                className="form-select form-select-sm"
                value={perPage}
                onChange={(event) => {
                  setPerPage(Number(event.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table mg-table align-middle mb-0">
            <thead>
              <tr>
                <th>Teacher Info</th>
                <th>Contact Details</th>
                <th>Specialization</th>
                <th className="text-center">
                  Classes
                </th>
                <th className="text-center">
                  Subjects
                </th>
                <th>Lead Role</th>
                <th>Status</th>
                <th className="text-center">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={8}
                    className="state-cell"
                  >
                    <span className="material-symbols-outlined me-2">
                      progress_activity
                    </span>

                    Loading teachers…
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td
                    colSpan={8}
                    className="state-cell text-danger"
                  >
                    <span className="material-symbols-outlined me-2">
                      error
                    </span>

                    Couldn't load teachers.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="state-cell"
                    >
                      <div className="py-3">
                        <span
                          className="material-symbols-outlined d-block mb-2"
                          style={{ fontSize: 34 }}
                        >
                          person_search
                        </span>

                        <div className="fw-semibold">
                          No teachers found
                        </div>

                        <small className="text-secondary">
                          No teachers match your current filters.
                        </small>
                      </div>
                    </td>
                  </tr>
                )}

              {rows.map((staff) => {
                const [label, tone] =
                  STATUS[staff.status] ?? [
                    staff.status,
                    "gray",
                  ];

                return (
                  <tr key={staff.id}>
                    {/* TEACHER INFO */}
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="mg-avatar">
                          {initials(staff.full_name)}
                        </div>

                        <div>
                          <div
                            className="fw-semibold"
                            style={{
                              fontSize: 13.5,
                            }}
                          >
                            {staff.full_name}
                          </div>

                          <div className="mg-sub">
                            {staff.staff_number}
                          </div>

                          {staff.designation && (
                            <div
                              className="mg-sub"
                              style={{
                                marginTop: 2,
                              }}
                            >
                              {staff.designation}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* CONTACT */}
                    <td>
                      <div className="mg-contact">
                        <span>
                          <span className="material-symbols-outlined">
                            mail
                          </span>

                          {staff.email || "—"}
                        </span>

                        <span>
                          <span className="material-symbols-outlined">
                            call
                          </span>

                          {staff.phone || "—"}
                        </span>
                      </div>
                    </td>

                    {/* SPECIALIZATION */}
                    <td>
                      {staff.specialization ? (
                        <span className="mg-pill mg-pill-lav">
                          {staff.specialization}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* CLASSES */}
                    <td className="text-center">
                      <span className="mg-count">
                        {staff.classes_count ?? 0}
                      </span>
                    </td>

                    {/* SUBJECTS */}
                    <td className="text-center">
                      <span className="mg-count mg-count-purple">
                        {staff.subjects_count ?? 0}
                      </span>
                    </td>

                    {/* LEAD */}
                    <td>
                      {staff.lead_class ? (
                        <span className="mg-lead">
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontSize: 13,
                              verticalAlign: "-2px",
                            }}
                          >
                            star
                          </span>

                          {staff.lead_class}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* STATUS */}
                    <td>
                      <span
                        className={`mg-status mg-status-${tone}`}
                      >
                        {label}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td>
                      <div className="mg-actions justify-content-center">
                        <button
                          type="button"
                          title="View teacher"
                          onClick={() => view(staff)}
                        >
                          <span className="material-symbols-outlined">
                            visibility
                          </span>
                        </button>

                        <button
                          type="button"
                          title="Assign classes & subjects"
                          onClick={() =>
                            setAssigning(staff)
                          }
                        >
                          <span className="material-symbols-outlined">
                            school
                          </span>
                        </button>

                        <button
                          type="button"
                          title="Edit teacher"
                          className="edit"
                          onClick={() =>
                            setEditing(staff)
                          }
                        >
                          <span className="material-symbols-outlined">
                            edit
                          </span>
                        </button>

                        <button
                          type="button"
                          title="Delete teacher"
                          className="del"
                          onClick={() =>
                            remove(staff)
                          }
                        >
                          <span className="material-symbols-outlined">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ====================================================
            PAGINATION
        ==================================================== */}

        <div className="mg-foot">
          <span className="lbl">
            {pagination
              ? `Showing ${pagination.from ?? 0} to ${pagination.to ?? 0
              } of ${pagination.total ?? 0} total records`
              : "—"}
          </span>

          <div className="mg-pager">
            <button
              type="button"
              disabled={
                !pagination ||
                pagination.current_page <= 1
              }
              onClick={() =>
                setPage((current) =>
                  Math.max(1, current - 1)
                )
              }
            >
              Prev
            </button>

            <span className="mg-page-cur">
              {pagination?.current_page ?? 1}
            </span>

            <button
              type="button"
              disabled={
                !pagination ||
                pagination.current_page >=
                pagination.last_page
              }
              onClick={() =>
                setPage((current) => current + 1)
              }
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          MODALS
      ====================================================== */}

      {editing && (
        <StaffForm
          initial={editing}
          onClose={() => setEditing(null)}
        />
      )}

      {assigning && (
        <AssignmentsModal
          staff={assigning}
          onClose={() => setAssigning(null)}
        />
      )}
    </div>
  );
}

/* ============================================================
   KPI
============================================================ */

function Kpi({
  tone,
  label,
  value,
  icon,
}) {
  return (
    <div className={`mg-kpi mg-kpi-${tone}`}>
      <div className="kl">{label}</div>

      <div className="kv">
        {value ?? "—"}
      </div>

      <div className="ki">
        <span className="material-symbols-outlined">
          {icon}
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   STAFF FORM
   FULL PROFESSIONAL ONBOARDING FORM
============================================================ */

function StaffForm({
  initial,
  onClose,
}) {
  const save = useSaveStaff();

  const isEdit = Boolean(initial?.id);

  const [form, setForm] = useState(() => ({
    ...BLANK,
    ...initial,
  }));

  const [errors, setErrors] = useState({});

  const [activeSection, setActiveSection] =
    useState("personal");

  const [photoPreview, setPhotoPreview] =
    useState(initial?.photo_url || null);

  /* ----------------------------------------------------------
     FORM SETTER
  ---------------------------------------------------------- */

  const set = (field) => (event) => {
    const value = event.target.value;

    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      if (!current[field]) return current;

      const next = { ...current };

      delete next[field];

      return next;
    });
  };

  /* ----------------------------------------------------------
     PHOTO
  ---------------------------------------------------------- */

  const handlePhoto = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo must not exceed 2MB.");
      return;
    }

    setForm((current) => ({
      ...current,
      photo: file,
    }));

    const url = URL.createObjectURL(file);

    setPhotoPreview(url);
  };

  /* ----------------------------------------------------------
     VALIDATION
  ---------------------------------------------------------- */

  const validate = () => {
    const next = {};

    if (!form.staff_number?.trim()) {
      next.staff_number =
        "Staff number is required.";
    }

    if (!form.first_name?.trim()) {
      next.first_name =
        "First name is required.";
    }

    if (!form.last_name?.trim()) {
      next.last_name =
        "Last name is required.";
    }

    if (!form.gender) {
      next.gender =
        "Please select gender.";
    }

    if (
      form.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email
      )
    ) {
      next.email =
        "Enter a valid email address.";
    }

    if (
      form.phone &&
      form.phone.trim().length < 7
    ) {
      next.phone =
        "Enter a valid phone number.";
    }

    if (!form.category) {
      next.category =
        "Staff category is required.";
    }

    if (!form.designation?.trim()) {
      next.designation =
        "Designation is required.";
    }

    return next;
  };

  /* ----------------------------------------------------------
     SUBMIT
  ---------------------------------------------------------- */

  const submit = async () => {
    setErrors({});

    const clientErrors = validate();

    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);

      const firstError =
        Object.keys(clientErrors)[0];

      if (
        [
          "staff_number",
          "first_name",
          "last_name",
          "gender",
          "date_of_birth",
        ].includes(firstError)
      ) {
        setActiveSection("personal");
      } else if (
        [
          "phone",
          "email",
          "address",
        ].includes(firstError)
      ) {
        setActiveSection("contact");
      } else {
        setActiveSection("employment");
      }

      toast.error(
        "Please correct the highlighted fields."
      );

      return;
    }

    try {
      const payload = {
        ...form,
      };

      await save.mutateAsync(payload);

      toast.success(
        isEdit
          ? "Teacher updated successfully."
          : "Teacher added successfully."
      );

      onClose();
    } catch (error) {
      const fieldErrors =
        error?.fieldErrors ?? {};

      setErrors(fieldErrors);

      if (!Object.keys(fieldErrors).length) {
        toast.error(
          error?.message ||
          "Could not save teacher."
        );
      } else {
        toast.error(
          "Please correct the highlighted fields."
        );
      }
    }
  };

  /* ----------------------------------------------------------
     SECTIONS
  ---------------------------------------------------------- */

  const sections = [
    {
      key: "personal",
      label: "Personal",
      icon: "person",
    },
    {
      key: "contact",
      label: "Contact",
      icon: "contact_phone",
    },
    {
      key: "employment",
      label: "Employment",
      icon: "badge",
    },
    {
      key: "professional",
      label: "Professional",
      icon: "school",
    },
    {
      key: "emergency",
      label: "Emergency",
      icon: "emergency",
    },
  ];

  const activeIndex = sections.findIndex(
    (section) =>
      section.key === activeSection
  );

  /* ----------------------------------------------------------
     NEXT / PREVIOUS
  ---------------------------------------------------------- */

  const goNext = () => {
    if (
      activeIndex <
      sections.length - 1
    ) {
      setActiveSection(
        sections[activeIndex + 1].key
      );
    }
  };

  const goPrevious = () => {
    if (activeIndex > 0) {
      setActiveSection(
        sections[activeIndex - 1].key
      );
    }
  };

  /* ----------------------------------------------------------
     MODAL
  ---------------------------------------------------------- */

  return (
    <Modal
      title={
        isEdit
          ? "Edit Teacher"
          : "Add New Teacher"
      }
      onClose={onClose}
      size="modal-xl"
      footer={
        <div className="teacher-form-footer">
          <div>
            <small className="text-secondary">
              {isEdit
                ? "Update the teacher's record."
                : "Complete the teacher profile before saving."}
            </small>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-light"
              onClick={onClose}
              disabled={save.isPending}
            >
              Cancel
            </button>

            {activeIndex > 0 && (
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={goPrevious}
                disabled={save.isPending}
              >
                <span className="material-symbols-outlined align-middle me-1">
                  arrow_back
                </span>

                Back
              </button>
            )}

            {activeIndex <
              sections.length - 1 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={goNext}
              >
                Continue

                <span className="material-symbols-outlined align-middle ms-1">
                  arrow_forward
                </span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={submit}
                disabled={save.isPending}
              >
                <span className="material-symbols-outlined align-middle me-1">
                  {save.isPending
                    ? "progress_activity"
                    : "save"}
                </span>

                {save.isPending
                  ? "Saving…"
                  : isEdit
                    ? "Update Teacher"
                    : "Create Teacher"}
              </button>
            )}
          </div>
        </div>
      }
    >
      {/* ======================================================
          FORM HEADER
      ====================================================== */}

      <div className="teacher-form-header">
        <div className="teacher-form-avatar-wrap">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Teacher preview"
              className="teacher-form-avatar-image"
            />
          ) : (
            <div className="teacher-form-avatar">
              {initials(
                `${form.first_name} ${form.last_name}`
              )}
            </div>
          )}

          <label
            htmlFor="teacher-photo"
            className="teacher-photo-button"
            title="Upload photo"
          >
            <span className="material-symbols-outlined">
              photo_camera
            </span>
          </label>

          <input
            id="teacher-photo"
            type="file"
            accept="image/*"
            hidden
            onChange={handlePhoto}
          />
        </div>

        <div className="teacher-form-heading">
          <div className="teacher-form-kicker">
            TEACHER PROFILE
          </div>

          <h3>
            {isEdit
              ? `${form.first_name || "Edit"} ${form.last_name || "Teacher"
              }`
              : "Create Teacher Profile"}
          </h3>

          <p>
            Capture the teacher's personal,
            employment and professional
            information.
          </p>
        </div>

        <div className="teacher-form-status">
          <span
            className={`mg-status mg-status-${form.status === "active"
                ? "green"
                : form.status === "suspended"
                  ? "red"
                  : "gray"
              }`}
          >
            {form.status === "active"
              ? "ACTIVE"
              : form.status === "suspended"
                ? "SUSPENDED"
                : "INACTIVE"}
          </span>
        </div>
      </div>

      {/* ======================================================
          PROGRESS
      ====================================================== */}

      <div className="teacher-progress">
        {sections.map(
          (section, index) => (
            <button
              type="button"
              key={section.key}
              className={`teacher-progress-item ${activeSection ===
                  section.key
                  ? "active"
                  : ""
                } ${index < activeIndex
                  ? "completed"
                  : ""
                }`}
              onClick={() =>
                setActiveSection(
                  section.key
                )
              }
            >
              <span className="teacher-progress-number">
                {index < activeIndex ? (
                  <span className="material-symbols-outlined">
                    check
                  </span>
                ) : (
                  index + 1
                )}
              </span>

              <span className="teacher-progress-label">
                {section.label}
              </span>
            </button>
          )
        )}
      </div>

      {/* ======================================================
          SECTION CONTENT
      ====================================================== */}

      <div className="teacher-form-body">
        {/* ====================================================
            PERSONAL
        ==================================================== */}

        {activeSection === "personal" && (
          <section className="teacher-form-section">
            <SectionHeading
              icon="person"
              title="Personal Information"
              description="Basic identity information of the teacher."
            />

            <div className="row g-3">
              <div className="col-md-4">
                <Field
                  label="Staff Number"
                  required
                  error={errors.staff_number}
                >
                  <div className="input-group">
                    <span className="input-group-text">
                      <span className="material-symbols-outlined">
                        badge
                      </span>
                    </span>

                    <input
                      className="form-control"
                      value={
                        form.staff_number
                      }
                      onChange={set(
                        "staff_number"
                      )}
                      placeholder="e.g. TCH-001"
                    />
                  </div>
                </Field>
              </div>

              <div className="col-md-4">
                <Field
                  label="First Name"
                  required
                  error={errors.first_name}
                >
                  <input
                    className="form-control"
                    value={form.first_name}
                    onChange={set(
                      "first_name"
                    )}
                    placeholder="Enter first name"
                  />
                </Field>
              </div>

              <div className="col-md-4">
                <Field
                  label="Last Name"
                  required
                  error={errors.last_name}
                >
                  <input
                    className="form-control"
                    value={form.last_name}
                    onChange={set(
                      "last_name"
                    )}
                    placeholder="Enter last name"
                  />
                </Field>
              </div>

              <div className="col-md-4">
                <Field
                  label="Middle Name"
                  error={errors.middle_name}
                >
                  <input
                    className="form-control"
                    value={
                      form.middle_name
                    }
                    onChange={set(
                      "middle_name"
                    )}
                    placeholder="Optional"
                  />
                </Field>
              </div>

              <div className="col-md-4">
                <Field
                  label="Gender"
                  required
                  error={errors.gender}
                >
                  <select
                    className="form-select"
                    value={form.gender}
                    onChange={set("gender")}
                  >
                    <option value="">
                      Select gender
                    </option>

                    <option value="male">
                      Male
                    </option>

                    <option value="female">
                      Female
                    </option>
                  </select>
                </Field>
              </div>

              <div className="col-md-4">
                <Field
                  label="Date of Birth"
                  error={
                    errors.date_of_birth
                  }
                >
                  <input
                    type="date"
                    className="form-control"
                    value={
                      form.date_of_birth ??
                      ""
                    }
                    onChange={set(
                      "date_of_birth"
                    )}
                  />
                </Field>
              </div>
            </div>

            <InfoBox>
              The staff number should be unique
              and should correspond to the
              teacher's official school record.
            </InfoBox>
          </section>
        )}

        {/* ====================================================
            CONTACT
        ==================================================== */}

        {activeSection === "contact" && (
          <section className="teacher-form-section">
            <SectionHeading
              icon="contact_phone"
              title="Contact Information"
              description="How the school can contact this teacher."
            />

            <div className="row g-3">
              <div className="col-md-6">
                <Field
                  label="Primary Phone"
                  error={errors.phone}
                >
                  <div className="input-group">
                    <span className="input-group-text">
                      <span className="material-symbols-outlined">
                        phone
                      </span>
                    </span>

                    <input
                      type="tel"
                      className="form-control"
                      value={
                        form.phone ?? ""
                      }
                      onChange={set("phone")}
                      placeholder="+237 6XX XXX XXX"
                    />
                  </div>
                </Field>
              </div>

              <div className="col-md-6">
                <Field
                  label="Alternative Phone"
                  error={
                    errors.alternate_phone
                  }
                >
                  <input
                    type="tel"
                    className="form-control"
                    value={
                      form.alternate_phone ??
                      ""
                    }
                    onChange={set(
                      "alternate_phone"
                    )}
                    placeholder="Optional"
                  />
                </Field>
              </div>

              <div className="col-md-6">
                <Field
                  label="Email Address"
                  error={errors.email}
                >
                  <div className="input-group">
                    <span className="input-group-text">
                      <span className="material-symbols-outlined">
                        mail
                      </span>
                    </span>

                    <input
                      type="email"
                      className="form-control"
                      value={
                        form.email ?? ""
                      }
                      onChange={set("email")}
                      placeholder="teacher@example.com"
                    />
                  </div>
                </Field>
              </div>

              <div className="col-md-6">
                <Field
                  label="Residential Address"
                  error={errors.address}
                >
                  <input
                    className="form-control"
                    value={
                      form.address ?? ""
                    }
                    onChange={set("address")}
                    placeholder="Enter residential address"
                  />
                </Field>
              </div>

              <div className="col-12">
                <Field
                  label="Full Address"
                  error={errors.address}
                >
                  <textarea
                    className="form-control"
                    rows={3}
                    value={
                      form.address ?? ""
                    }
                    onChange={set("address")}
                    placeholder="Street, quarter, town..."
                  />
                </Field>
              </div>
            </div>
          </section>
        )}

        {/* ====================================================
            EMPLOYMENT
        ==================================================== */}

        {activeSection === "employment" && (
          <section className="teacher-form-section">
            <SectionHeading
              icon="badge"
              title="Employment Information"
              description="School employment and administrative details."
            />

            <div className="row g-3">
              <div className="col-md-4">
                <Field
                  label="Category"
                  required
                  error={errors.category}
                >
                  <select
                    className="form-select"
                    value={form.category}
                    onChange={set(
                      "category"
                    )}
                  >
                    <option value="teaching">
                      Teaching
                    </option>

                    <option value="non_teaching">
                      Non-teaching
                    </option>
                  </select>
                </Field>
              </div>

              <div className="col-md-4">
                <Field
                  label="Designation"
                  required
                  error={errors.designation}
                >
                  <input
                    className="form-control"
                    value={
                      form.designation ??
                      ""
                    }
                    onChange={set(
                      "designation"
                    )}
                    placeholder="e.g. Teacher"
                  />
                </Field>
              </div>

              <div className="col-md-4">
                <Field
                  label="Department"
                  error={errors.department}
                >
                  <input
                    className="form-control"
                    value={
                      form.department ?? ""
                    }
                    onChange={set(
                      "department"
                    )}
                    placeholder="e.g. Science"
                  />
                </Field>
              </div>

              <div className="col-md-4">
                <Field
                  label="Employment Type"
                  error={
                    errors.employment_type
                  }
                >
                  <select
                    className="form-select"
                    value={
                      form.employment_type
                    }
                    onChange={set(
                      "employment_type"
                    )}
                  >
                    <option value="full_time">
                      Full Time
                    </option>

                    <option value="part_time">
                      Part Time
                    </option>

                    <option value="contract">
                      Contract
                    </option>

                    <option value="temporary">
                      Temporary
                    </option>
                  </select>
                </Field>
              </div>

              <div className="col-md-4">
                <Field
                  label="Date Hired"
                  error={errors.hired_on}
                >
                  <input
                    type="date"
                    className="form-control"
                    value={
                      form.hired_on ?? ""
                    }
                    onChange={set(
                      "hired_on"
                    )}
                  />
                </Field>
              </div>

              <div className="col-md-4">
                <Field
                  label="Employment Status"
                  error={errors.status}
                >
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={set("status")}
                  >
                    <option value="active">
                      Active
                    </option>

                    <option value="left">
                      Inactive
                    </option>

                    <option value="suspended">
                      Suspended
                    </option>
                  </select>
                </Field>
              </div>
            </div>
          </section>
        )}

        {/* ====================================================
            PROFESSIONAL
        ==================================================== */}

        {activeSection === "professional" && (
          <section className="teacher-form-section">
            <SectionHeading
              icon="school"
              title="Professional Information"
              description="Academic qualifications and teaching specialization."
            />

            <div className="row g-3">
              <div className="col-md-6">
                <Field
                  label="Specialization"
                  error={
                    errors.specialization
                  }
                >
                  <input
                    className="form-control"
                    value={
                      form.specialization ??
                      ""
                    }
                    onChange={set(
                      "specialization"
                    )}
                    placeholder="e.g. Mathematics"
                  />
                </Field>
              </div>

              <div className="col-md-6">
                <Field
                  label="Highest Qualification"
                  error={
                    errors.qualification
                  }
                >
                  <input
                    className="form-control"
                    value={
                      form.qualification ??
                      ""
                    }
                    onChange={set(
                      "qualification"
                    )}
                    placeholder="e.g. B.Ed, B.Sc, M.Ed"
                  />
                </Field>
              </div>

              <div className="col-md-6">
                <Field
                  label="Professional Registration"
                  error={
                    errors.professional_registration
                  }
                >
                  <input
                    className="form-control"
                    value={
                      form.professional_registration ??
                      ""
                    }
                    onChange={set(
                      "professional_registration"
                    )}
                    placeholder="Registration number"
                  />
                </Field>
              </div>

              <div className="col-md-6">
                <Field
                  label="Teaching Specialization"
                  error={
                    errors.specialization
                  }
                >
                  <input
                    className="form-control"
                    value={
                      form.specialization ??
                      ""
                    }
                    onChange={set(
                      "specialization"
                    )}
                    placeholder="Subject / teaching area"
                  />
                </Field>
              </div>
            </div>

            <InfoBox tone="blue">
              Teacher assignments such as classes
              and subjects can be configured after
              creating the teacher record.
            </InfoBox>
          </section>
        )}

        {/* ====================================================
            EMERGENCY
        ==================================================== */}

        {activeSection === "emergency" && (
          <section className="teacher-form-section">
            <SectionHeading
              icon="emergency"
              title="Emergency Contact"
              description="Person to contact in case of an emergency."
            />

            <div className="row g-3">
              <div className="col-md-6">
                <Field
                  label="Contact Name"
                  error={
                    errors.emergency_contact_name
                  }
                >
                  <input
                    className="form-control"
                    value={
                      form.emergency_contact_name ??
                      ""
                    }
                    onChange={set(
                      "emergency_contact_name"
                    )}
                    placeholder="Full name"
                  />
                </Field>
              </div>

              <div className="col-md-6">
                <Field
                  label="Phone Number"
                  error={
                    errors.emergency_contact_phone
                  }
                >
                  <input
                    type="tel"
                    className="form-control"
                    value={
                      form.emergency_contact_phone ??
                      ""
                    }
                    onChange={set(
                      "emergency_contact_phone"
                    )}
                    placeholder="+237 6XX XXX XXX"
                  />
                </Field>
              </div>

              <div className="col-md-6">
                <Field
                  label="Relationship"
                  error={
                    errors.emergency_contact_relationship
                  }
                >
                  <select
                    className="form-select"
                    value={
                      form.emergency_contact_relationship ??
                      ""
                    }
                    onChange={set(
                      "emergency_contact_relationship"
                    )}
                  >
                    <option value="">
                      Select relationship
                    </option>

                    <option value="spouse">
                      Spouse
                    </option>

                    <option value="parent">
                      Parent
                    </option>

                    <option value="sibling">
                      Sibling
                    </option>

                    <option value="child">
                      Child
                    </option>

                    <option value="relative">
                      Relative
                    </option>

                    <option value="friend">
                      Friend
                    </option>

                    <option value="other">
                      Other
                    </option>
                  </select>
                </Field>
              </div>
            </div>

            <div className="teacher-final-summary">
              <div className="teacher-summary-icon">
                <span className="material-symbols-outlined">
                  verified_user
                </span>
              </div>

              <div>
                <strong>
                  Ready to create this teacher?
                </strong>

                <p>
                  Review the information you've
                  entered, then click{" "}
                  <b>
                    {isEdit
                      ? "Update Teacher"
                      : "Create Teacher"}
                  </b>{" "}
                  below.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}

/* ============================================================
   SECTION HEADING
============================================================ */

function SectionHeading({
  icon,
  title,
  description,
}) {
  return (
    <div className="teacher-section-heading">
      <div className="teacher-section-icon">
        <span className="material-symbols-outlined">
          {icon}
        </span>
      </div>

      <div>
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
    </div>
  );
}

/* ============================================================
   INFO BOX
============================================================ */

function InfoBox({
  children,
  tone = "amber",
}) {
  return (
    <div
      className={`teacher-info-box teacher-info-${tone}`}
    >
      <span className="material-symbols-outlined">
        info
      </span>

      <div>{children}</div>
    </div>
  );
}

/* ============================================================
   ASSIGNMENTS MODAL
============================================================ */

function AssignmentsModal({
  staff,
  onClose,
}) {
  const {
    data,
    isLoading,
  } = useTeacherAssignments(
    staff.id,
    true
  );

  const { data: classes } =
    useClasses();

  const {
    data: subjectsData,
  } = useSubjects({
    per_page: 500,
    status: "active",
  });

  const assign =
    useAssignTeacher();

  const unassign =
    useUnassignTeacher();

  const [pick, setPick] =
    useState({
      school_class_id: "",
      subject_id: "",
    });

  const rows = data?.data ?? [];

  const subjects = Array.isArray(
    subjectsData
  )
    ? subjectsData
    : subjectsData?.data ?? [];

  const classList = Array.isArray(
    classes
  )
    ? classes
    : classes?.data ?? [];

  /* ----------------------------------------------------------
     ADD ASSIGNMENT
  ---------------------------------------------------------- */

  const add = async () => {
    if (
      !pick.school_class_id ||
      !pick.subject_id
    ) {
      toast.error(
        "Pick a class and subject."
      );

      return;
    }

    try {
      await assign.mutateAsync({
        staff_id: staff.id,
        ...pick,
      });

      toast.success(
        "Teacher assignment added."
      );

      setPick({
        school_class_id: "",
        subject_id: "",
      });
    } catch (error) {
      toast.error(
        error?.message ||
        "Could not assign teacher."
      );
    }
  };

  /* ----------------------------------------------------------
     REMOVE ASSIGNMENT
  ---------------------------------------------------------- */

  const drop = async (row) => {
    try {
      await unassign.mutateAsync({
        school_class_id:
          row.school_class_id,
        subject_id:
          row.subject_id,
      });

      toast.success(
        "Assignment removed."
      );
    } catch (error) {
      toast.error(
        error?.message ||
        "Could not remove assignment."
      );
    }
  };

  return (
    <Modal
      title={`Assign classes & subjects — ${staff.full_name}`}
      onClose={onClose}
      size="modal-lg"
      footer={
        <button
          type="button"
          className="btn btn-primary"
          onClick={onClose}
        >
          Done
        </button>
      }
    >
      <div className="assignment-modal-header">
        <div className="mg-avatar">
          {initials(staff.full_name)}
        </div>

        <div>
          <div className="fw-bold">
            {staff.full_name}
          </div>

          <div className="text-secondary small">
            {staff.staff_number}
          </div>
        </div>
      </div>

      <div className="row g-2 align-items-end mb-4">
        <div className="col-md-5">
          <Field label="Class">
            <select
              className="form-select"
              value={
                pick.school_class_id
              }
              onChange={(event) =>
                setPick((current) => ({
                  ...current,
                  school_class_id:
                    event.target.value,
                }))
              }
            >
              <option value="">
                Select class…
              </option>

              {classList.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="col-md-5">
          <Field label="Subject">
            <select
              className="form-select"
              value={pick.subject_id}
              onChange={(event) =>
                setPick((current) => ({
                  ...current,
                  subject_id:
                    event.target.value,
                }))
              }
            >
              <option value="">
                Select subject…
              </option>

              {subjects.map((subject) => (
                <option
                  key={subject.id}
                  value={subject.id}
                >
                  {subject.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="col-md-2">
          <button
            type="button"
            className="btn btn-primary w-100"
            onClick={add}
            disabled={assign.isPending}
          >
            {assign.isPending
              ? "..."
              : "Assign"}
          </button>
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between mb-2">
        <h6
          className="fw-semibold mb-0"
          style={{ fontSize: 13 }}
        >
          Current Assignments
        </h6>

        <span className="mg-chip mg-chip-blue">
          {rows.length} assigned
        </span>
      </div>

      {isLoading ? (
        <div className="text-center py-4 text-secondary">
          <span className="material-symbols-outlined d-block mb-2">
            progress_activity
          </span>

          Loading assignments…
        </div>
      ) : rows.length === 0 ? (
        <div className="teacher-empty-state">
          <span className="material-symbols-outlined">
            assignment
          </span>

          <strong>
            No assignments yet
          </strong>

          <small>
            Select a class and subject
            above to assign this teacher.
          </small>
        </div>
      ) : (
        <div
          className="table-responsive"
          style={{
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>Class</th>
                <th>Subject</th>
                <th className="text-end">
                  Remove
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.school_class_id}-${row.subject_id}`}
                >
                  <td className="fw-semibold">
                    {row.class_name}
                  </td>

                  <td>
                    {row.subject_name}

                    {row.subject_code && (
                      <span className="text-secondary ms-1">
                        ({row.subject_code})
                      </span>
                    )}
                  </td>

                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-danger p-0"
                      onClick={() =>
                        drop(row)
                      }
                      disabled={
                        unassign.isPending
                      }
                      title="Remove assignment"
                    >
                      <span className="material-symbols-outlined">
                        delete
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div
        className="alert alert-light border py-2 mt-3 mb-0"
        style={{ fontSize: 12 }}
      >
        <span className="material-symbols-outlined align-middle me-1">
          lightbulb
        </span>

        To make this teacher the{" "}
        <b>Class Teacher</b> of a section,
        use the Classes &amp; Sections page.
      </div>
    </Modal>
  );
}

/* ============================================================
   HTML ESCAPE FOR PRINT
============================================================ */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}