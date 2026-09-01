// src/pages/admin/VacancyFormPage.jsx

import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Link,
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    useCreateVacancy,
    useUpdateVacancy,
} from "../../api/vacancies";

import client from "../../api/client";

import AppShell from "../../components/AppShell";

import "./VacancyFormPage.css";


/* ============================================================
   INITIAL FORM
============================================================ */

const INITIAL_FORM = {
    title: "",
    department: "",
    employment_type: "Full Time",
    level: "Secondary",
    experience: "",
    deadline: "",
    icon: "work",
    description: "",
    requirements: "",
    responsibilities: "",
    status: "draft",
    featured: false,
};


/* ============================================================
   OPTIONS
============================================================ */

const EMPLOYMENT_TYPES = [
    "Full Time",
    "Part Time",
    "Contract",
    "Temporary",
];

const LEVELS = [
    "Secondary",
    "Administration",
    "Management",
    "Technical",
    "Support",
];

const STATUS_OPTIONS = [
    {
        value: "draft",
        label: "Draft",
        icon: "edit_note",
        description: "Save without publishing",
    },
    {
        value: "published",
        label: "Published",
        icon: "public",
        description: "Visible on Careers page",
    },
    {
        value: "closed",
        label: "Closed",
        icon: "lock",
        description: "No longer accepting applications",
    },
];


/* ============================================================
   PAGE
============================================================ */

const VacancyFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const isEditing = Boolean(id);

    const [form, setForm] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(isEditing);
    const [error, setError] = useState("");

    const createMutation = useCreateVacancy();
    const updateMutation = useUpdateVacancy();


    /* ========================================================
       LOAD EXISTING VACANCY
    ======================================================== */

    useEffect(() => {
        if (!isEditing) {
            setLoading(false);
            return;
        }

        let active = true;

        const loadVacancy = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await client.get(
                    `/admin/vacancies/${id}`
                );

                const vacancy = response.data?.data;

                if (!active || !vacancy) {
                    return;
                }

                setForm({
                    title: vacancy.title ?? "",

                    department:
                        vacancy.department ?? "",

                    employment_type:
                        vacancy.employment_type ??
                        "Full Time",

                    level:
                        vacancy.level ??
                        "Secondary",

                    experience:
                        vacancy.experience ??
                        "",

                    deadline:
                        vacancy.deadline
                            ? String(
                                  vacancy.deadline
                              ).slice(0, 10)
                            : "",

                    icon:
                        vacancy.icon ??
                        "work",

                    description:
                        vacancy.description ??
                        "",

                    requirements:
                        vacancy.requirements ??
                        "",

                    responsibilities:
                        vacancy.responsibilities ??
                        "",

                    status:
                        vacancy.status ??
                        "draft",

                    featured:
                        Boolean(
                            vacancy.featured
                        ),
                });
            } catch (err) {
                if (active) {
                    setError(
                        err?.response?.data?.message ||
                            "Unable to load vacancy."
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadVacancy();

        return () => {
            active = false;
        };
    }, [id, isEditing]);


    /* ========================================================
       FIELD UPDATE
    ======================================================== */

    const updateField = (
        field,
        value
    ) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        if (error) {
            setError("");
        }
    };


    /* ========================================================
       FORM PROGRESS
    ======================================================== */

    const completion = useMemo(() => {
        const requiredFields = [
            form.title,
            form.department,
            form.description,
        ];

        const completed = requiredFields.filter(
            Boolean
        ).length;

        return Math.round(
            (completed /
                requiredFields.length) *
                100
        );
    }, [
        form.title,
        form.department,
        form.description,
    ]);


    /* ========================================================
       SUBMIT
    ======================================================== */

    const handleSubmit = async (
        event
    ) => {
        event.preventDefault();

        setError("");

        if (!form.title.trim()) {
            setError(
                "Please enter a job title."
            );
            return;
        }

        if (!form.department.trim()) {
            setError(
                "Please enter a department."
            );
            return;
        }

        if (!form.description.trim()) {
            setError(
                "Please provide a vacancy description."
            );
            return;
        }

        try {
            if (isEditing) {
                await updateMutation.mutateAsync({
                    id,
                    payload: form,
                });
            } else {
                await createMutation.mutateAsync(
                    form
                );
            }

            navigate(
                "/careers/vacancies"
            );
        } catch (err) {
            const validationErrors =
                err?.response?.data?.errors;

            if (validationErrors) {
                setError(
                    Object.values(
                        validationErrors
                    )
                        .flat()
                        .join(" ")
                );
            } else {
                setError(
                    err?.response?.data?.message ||
                        "Unable to save vacancy."
                );
            }
        }
    };


    /* ========================================================
       SAVE STATE
    ======================================================== */

    const saving =
        createMutation.isPending ||
        updateMutation.isPending;


    /* ========================================================
       LOADING
    ======================================================== */

    if (loading) {
        return (
            <AppShell>
                <div className="vacancy-form-page">
                    <div className="vacancy-form-loading">
                        <div className="vacancy-loading-icon">
                            <span className="material-symbols-rounded">
                                work
                            </span>
                        </div>

                        <div>
                            <strong>
                                Loading vacancy
                            </strong>

                            <p>
                                Preparing the vacancy
                                information...
                            </p>
                        </div>
                    </div>
                </div>
            </AppShell>
        );
    }


    /* ========================================================
       RENDER
    ======================================================== */

    return (
        <AppShell>

            <div className="vacancy-form-page">

                {/* ====================================================
                    PAGE HEADER
                ==================================================== */}

                <header className="vacancy-form-header">

                    <div className="vacancy-header-left">

                        <div className="vacancy-breadcrumb">

                            <Link to="/super-admin">
                                Super Admin
                            </Link>

                            <span className="material-symbols-rounded">
                                chevron_right
                            </span>

                            <Link to="/careers/vacancies">
                                Careers & Vacancies
                            </Link>

                            <span className="material-symbols-rounded">
                                chevron_right
                            </span>

                            <span>
                                {isEditing
                                    ? "Edit Vacancy"
                                    : "New Vacancy"}
                            </span>

                        </div>


                        <div className="vacancy-title-row">

                            <div className="vacancy-page-icon">
                                <span className="material-symbols-rounded">
                                    {isEditing
                                        ? "edit_document"
                                        : "post_add"}
                                </span>
                            </div>

                            <div>

                                <span className="vacancy-title-kicker">
                                    Recruitment Management
                                </span>

                                <h1>
                                    {isEditing
                                        ? "Edit Vacancy"
                                        : "Post New Vacancy"}
                                </h1>

                                <p>
                                    {isEditing
                                        ? "Update the vacancy details and publishing settings."
                                        : "Create an employment opportunity for the CCAST Careers page."}
                                </p>

                            </div>

                        </div>

                    </div>


                    <div className="vacancy-header-actions">

                        <Link
                            to="/careers/vacancies"
                            className="vacancy-back-button"
                        >
                            <span className="material-symbols-rounded">
                                arrow_back
                            </span>

                            <span>
                                Back to Vacancies
                            </span>
                        </Link>

                    </div>

                </header>


                {/* ====================================================
                    ERROR
                ==================================================== */}

                {error && (
                    <div className="vacancy-form-alert">

                        <div className="vacancy-alert-icon">
                            <span className="material-symbols-rounded">
                                error
                            </span>
                        </div>

                        <div>
                            <strong>
                                Unable to save vacancy
                            </strong>

                            <p>
                                {error}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setError("")
                            }
                            aria-label="Dismiss error"
                        >
                            <span className="material-symbols-rounded">
                                close
                            </span>
                        </button>

                    </div>
                )}


                {/* ====================================================
                    FORM
                ==================================================== */}

                <form
                    className="vacancy-form-layout"
                    onSubmit={handleSubmit}
                >

                    {/* =================================================
                        MAIN CONTENT
                    ================================================= */}

                    <main className="vacancy-form-main">

                        {/* POSITION INFORMATION */}

                        <section className="vacancy-form-card">

                            <div className="form-card-header">

                                <div className="form-section-icon purple">
                                    <span className="material-symbols-rounded">
                                        work
                                    </span>
                                </div>

                                <div>
                                    <h2>
                                        Position Information
                                    </h2>

                                    <p>
                                        Define the core information
                                        about this employment
                                        opportunity.
                                    </p>
                                </div>

                            </div>


                            <div className="form-grid">

                                {/* TITLE */}

                                <div className="form-field full">

                                    <label htmlFor="vacancy-title">
                                        Job Title
                                        <span>*</span>
                                    </label>

                                    <div className="input-with-icon">

                                        <span className="material-symbols-rounded">
                                            badge
                                        </span>

                                        <input
                                            id="vacancy-title"
                                            type="text"
                                            required
                                            value={
                                                form.title
                                            }
                                            placeholder="e.g. Computer Science Teacher"
                                            onChange={(
                                                event
                                            ) =>
                                                updateField(
                                                    "title",
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                        />

                                    </div>

                                    <small>
                                        Use a clear and
                                        professional position
                                        title.
                                    </small>

                                </div>


                                {/* DEPARTMENT */}

                                <div className="form-field">

                                    <label htmlFor="vacancy-department">
                                        Department
                                        <span>*</span>
                                    </label>

                                    <div className="input-with-icon">

                                        <span className="material-symbols-rounded">
                                            apartment
                                        </span>

                                        <input
                                            id="vacancy-department"
                                            type="text"
                                            required
                                            value={
                                                form.department
                                            }
                                            placeholder="e.g. Science & Technology"
                                            onChange={(
                                                event
                                            ) =>
                                                updateField(
                                                    "department",
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                        />

                                    </div>

                                </div>


                                {/* EMPLOYMENT */}

                                <div className="form-field">

                                    <label htmlFor="employment-type">
                                        Employment Type
                                    </label>

                                    <div className="select-with-icon">

                                        <span className="material-symbols-rounded">
                                            schedule
                                        </span>

                                        <select
                                            id="employment-type"
                                            value={
                                                form.employment_type
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateField(
                                                    "employment_type",
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                        >
                                            {EMPLOYMENT_TYPES.map(
                                                (
                                                    type
                                                ) => (
                                                    <option
                                                        key={
                                                            type
                                                        }
                                                        value={
                                                            type
                                                        }
                                                    >
                                                        {
                                                            type
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>

                                    </div>

                                </div>


                                {/* LEVEL */}

                                <div className="form-field">

                                    <label htmlFor="vacancy-level">
                                        Level
                                    </label>

                                    <div className="select-with-icon">

                                        <span className="material-symbols-rounded">
                                            layers
                                        </span>

                                        <select
                                            id="vacancy-level"
                                            value={
                                                form.level
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateField(
                                                    "level",
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                        >
                                            {LEVELS.map(
                                                (
                                                    level
                                                ) => (
                                                    <option
                                                        key={
                                                            level
                                                        }
                                                        value={
                                                            level
                                                        }
                                                    >
                                                        {
                                                            level
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>

                                    </div>

                                </div>


                                {/* EXPERIENCE */}

                                <div className="form-field">

                                    <label htmlFor="vacancy-experience">
                                        Experience
                                    </label>

                                    <div className="input-with-icon">

                                        <span className="material-symbols-rounded">
                                            history
                                        </span>

                                        <input
                                            id="vacancy-experience"
                                            type="text"
                                            value={
                                                form.experience
                                            }
                                            placeholder="e.g. 2+ Years"
                                            onChange={(
                                                event
                                            ) =>
                                                updateField(
                                                    "experience",
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                        />

                                    </div>

                                </div>


                                {/* DEADLINE */}

                                <div className="form-field">

                                    <label htmlFor="vacancy-deadline">
                                        Application Deadline
                                    </label>

                                    <div className="input-with-icon">

                                        <span className="material-symbols-rounded">
                                            event
                                        </span>

                                        <input
                                            id="vacancy-deadline"
                                            type="date"
                                            value={
                                                form.deadline
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateField(
                                                    "deadline",
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                        />

                                    </div>

                                </div>

                            </div>

                        </section>


                        {/* DESCRIPTION */}

                        <section className="vacancy-form-card">

                            <div className="form-card-header">

                                <div className="form-section-icon blue">
                                    <span className="material-symbols-rounded">
                                        description
                                    </span>
                                </div>

                                <div>
                                    <h2>
                                        Vacancy Description
                                    </h2>

                                    <p>
                                        Explain the opportunity
                                        and help candidates
                                        understand the role.
                                    </p>
                                </div>

                            </div>


                            <div className="form-field">

                                <label htmlFor="vacancy-description">
                                    Description
                                    <span>*</span>
                                </label>

                                <textarea
                                    id="vacancy-description"
                                    required
                                    rows="8"
                                    value={
                                        form.description
                                    }
                                    placeholder="Describe the position, its purpose and what the successful applicant will do..."
                                    onChange={(
                                        event
                                    ) =>
                                        updateField(
                                            "description",
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                />

                                <div className="textarea-footer">
                                    <small>
                                        Provide enough detail
                                        for qualified
                                        applicants to understand
                                        the opportunity.
                                    </small>

                                    <span>
                                        {
                                            form.description
                                                .length
                                        } characters
                                    </span>
                                </div>

                            </div>

                        </section>


                        {/* REQUIREMENTS */}

                        <section className="vacancy-form-card">

                            <div className="form-card-header">

                                <div className="form-section-icon green">
                                    <span className="material-symbols-rounded">
                                        verified
                                    </span>
                                </div>

                                <div>
                                    <h2>
                                        Requirements
                                    </h2>

                                    <p>
                                        Qualifications,
                                        experience and skills
                                        required for the role.
                                    </p>
                                </div>

                            </div>


                            <div className="form-field">

                                <label htmlFor="vacancy-requirements">
                                    Candidate Requirements
                                </label>

                                <textarea
                                    id="vacancy-requirements"
                                    rows="8"
                                    value={
                                        form.requirements
                                    }
                                    placeholder={`Bachelor's degree in Computer Science
Teaching qualification
2+ years teaching experience
Strong communication skills`}
                                    onChange={(
                                        event
                                    ) =>
                                        updateField(
                                            "requirements",
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                />

                                <small className="field-hint">
                                    You can list requirements
                                    on separate lines.
                                </small>

                            </div>

                        </section>


                        {/* RESPONSIBILITIES */}

                        <section className="vacancy-form-card">

                            <div className="form-card-header">

                                <div className="form-section-icon orange">
                                    <span className="material-symbols-rounded">
                                        task_alt
                                    </span>
                                </div>

                                <div>
                                    <h2>
                                        Responsibilities
                                    </h2>

                                    <p>
                                        Describe the main duties
                                        and responsibilities.
                                    </p>
                                </div>

                            </div>


                            <div className="form-field">

                                <label htmlFor="vacancy-responsibilities">
                                    Key Responsibilities
                                </label>

                                <textarea
                                    id="vacancy-responsibilities"
                                    rows="8"
                                    value={
                                        form.responsibilities
                                    }
                                    placeholder={`Prepare and deliver lessons
Assess student performance
Maintain classroom discipline
Participate in school activities`}
                                    onChange={(
                                        event
                                    ) =>
                                        updateField(
                                            "responsibilities",
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                />

                                <small className="field-hint">
                                    List the most important
                                    responsibilities for the
                                    position.
                                </small>

                            </div>

                        </section>

                    </main>


                    {/* =================================================
                        SIDEBAR
                    ================================================= */}

                    <aside className="vacancy-form-sidebar">

                        {/* PUBLISHING */}

                        <section className="vacancy-form-card sidebar-card">

                            <div className="form-card-header compact">

                                <div className="form-section-icon purple">
                                    <span className="material-symbols-rounded">
                                        publish
                                    </span>
                                </div>

                                <div>
                                    <h2>
                                        Publishing
                                    </h2>

                                    <p>
                                        Control visibility.
                                    </p>
                                </div>

                            </div>


                            <div className="status-options">

                                {STATUS_OPTIONS.map(
                                    (option) => (
                                        <label
                                            key={
                                                option.value
                                            }
                                            className={`status-option ${
                                                form.status ===
                                                option.value
                                                    ? "selected"
                                                    : ""
                                            }`}
                                        >

                                            <input
                                                type="radio"
                                                name="vacancy-status"
                                                value={
                                                    option.value
                                                }
                                                checked={
                                                    form.status ===
                                                    option.value
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateField(
                                                        "status",
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                            />

                                            <span className="status-option-icon">
                                                <span className="material-symbols-rounded">
                                                    {
                                                        option.icon
                                                    }
                                                </span>
                                            </span>

                                            <span className="status-option-content">

                                                <strong>
                                                    {
                                                        option.label
                                                    }
                                                </strong>

                                                <small>
                                                    {
                                                        option.description
                                                    }
                                                </small>

                                            </span>

                                            <span className="status-check">
                                                <span className="material-symbols-rounded">
                                                    check
                                                </span>
                                            </span>

                                        </label>
                                    )
                                )}

                            </div>


                            {/* FEATURED */}

                            <label className="featured-toggle">

                                <span className="toggle-control">

                                    <input
                                        type="checkbox"
                                        checked={
                                            form.featured
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateField(
                                                "featured",
                                                event
                                                    .target
                                                    .checked
                                            )
                                        }
                                    />

                                    <span className="toggle-slider" />

                                </span>


                                <span className="featured-content">

                                    <strong>
                                        Featured Vacancy
                                    </strong>

                                    <small>
                                        Highlight this
                                        position on the
                                        Careers page.
                                    </small>

                                </span>

                            </label>

                        </section>


                        {/* ICON */}

                        <section className="vacancy-form-card sidebar-card">

                            <div className="form-card-header compact">

                                <div className="form-section-icon blue">
                                    <span className="material-symbols-rounded">
                                        palette
                                    </span>
                                </div>

                                <div>
                                    <h2>
                                        Vacancy Icon
                                    </h2>

                                    <p>
                                        Visual identifier.
                                    </p>
                                </div>

                            </div>


                            <div className="icon-preview">

                                <div>
                                    <span className="material-symbols-rounded">
                                        {form.icon ||
                                            "work"}
                                    </span>
                                </div>

                                <span>
                                    Preview
                                </span>

                            </div>


                            <div className="form-field">

                                <label htmlFor="vacancy-icon">
                                    Icon Name
                                </label>

                                <div className="input-with-icon">

                                    <span className="material-symbols-rounded">
                                        code
                                    </span>

                                    <input
                                        id="vacancy-icon"
                                        type="text"
                                        value={
                                            form.icon
                                        }
                                        placeholder="work"
                                        onChange={(
                                            event
                                        ) =>
                                            updateField(
                                                "icon",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    />

                                </div>

                                <small>
                                    Example: work, school,
                                    computer, engineering
                                </small>

                            </div>

                        </section>


                        {/* FORM COMPLETION */}

                        <section className="vacancy-form-card sidebar-card">

                            <div className="completion-header">

                                <div>
                                    <span>
                                        Form completion
                                    </span>

                                    <strong>
                                        {completion}%
                                    </strong>
                                </div>

                                <span className="material-symbols-rounded">
                                    checklist
                                </span>

                            </div>

                            <div className="completion-track">
                                <span
                                    style={{
                                        width: `${completion}%`,
                                    }}
                                />
                            </div>

                            <p>
                                Complete the required
                                position information before
                                publishing.
                            </p>

                        </section>


                        {/* ACTIONS */}

                        <div className="vacancy-form-actions">

                            <Link
                                to="/careers/vacancies"
                                className="vacancy-cancel-button"
                            >
                                <span className="material-symbols-rounded">
                                    close
                                </span>

                                Cancel
                            </Link>


                            <button
                                type="submit"
                                className="vacancy-save-button"
                                disabled={saving}
                            >

                                {saving ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm" />

                                        <span>
                                            Saving...
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-rounded">
                                            save
                                        </span>

                                        <span>
                                            {isEditing
                                                ? "Save Changes"
                                                : "Create Vacancy"}
                                        </span>
                                    </>
                                )}

                            </button>

                        </div>

                    </aside>

                </form>

            </div>

        </AppShell>
    );
};


export default VacancyFormPage;