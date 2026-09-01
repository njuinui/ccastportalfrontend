import React, {
    useEffect,
    useState,
} from "react";

import {
    CheckCircle2,
    Download,
    FileText,
    Mail,
    Phone,
    X,
    User,
} from "lucide-react";

import {
    getTeacherApplication,
    updateTeacherApplicationStatus,
    downloadTeacherApplicationDocument,
    TEACHER_APPLICATION_STATUS_META,
} from "../../api/teacherApplications";


const STATUS_OPTIONS = [
    "submitted",
    "under_review",
    "shortlisted",
    "interview",
    "accepted",
    "rejected",
    "withdrawn",
];


function formatDateTime(value) {
    if (!value) {
        return "—";
    }

    try {
        return new Intl.DateTimeFormat(
            "en-GB",
            {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        ).format(new Date(value));
    } catch {
        return value;
    }
}


function getName(application) {
    if (application?.applicant_name) {
        return application.applicant_name;
    }

    return [
        application?.first_name,
        application?.last_name,
    ]
        .filter(Boolean)
        .join(" ") || "Applicant";
}


function getDocumentTypeLabel(type) {
    const labels = {
        photo: "Passport Photo",
        cv: "Curriculum Vitae",
        id: "Identification Document",
        certificate: "Certificate",
    };

    return labels[type] || type;
}


export default function TeacherApplicationDetailsModal({
    application,
    onClose,
    onUpdated,
}) {
    const [
        details,
        setDetails,
    ] = useState(application);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        selectedStatus,
        setSelectedStatus,
    ] = useState(
        application?.status || "submitted"
    );

    const [
        reviewNotes,
        setReviewNotes,
    ] = useState(
        application?.review_notes || ""
    );

    const [
        error,
        setError,
    ] = useState("");


    /*
    |--------------------------------------------------------------------------
    | Load complete application
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            if (!application?.id) {
                return;
            }

            setLoading(true);

            try {
                const response =
                    await getTeacherApplication(
                        application.id
                    );

                if (!mounted) {
                    return;
                }

                const data =
                    response?.data ||
                    response;

                setDetails(data);

                setSelectedStatus(
                    data?.status ||
                    "submitted"
                );

                setReviewNotes(
                    data?.review_notes ||
                    ""
                );
            } catch (exception) {
                console.error(
                    "Failed to load application:",
                    exception
                );

                if (mounted) {
                    setError(
                        exception?.response?.data?.message ||
                        "Unable to load application details."
                    );
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            mounted = false;
        };
    }, [
        application?.id,
    ]);


    /*
    |--------------------------------------------------------------------------
    | Update status
    |--------------------------------------------------------------------------
    */

    const handleUpdateStatus = async () => {
        if (!details?.id) {
            return;
        }

        setSaving(true);
        setError("");

        try {
            await updateTeacherApplicationStatus(
                details.id,
                {
                    status: selectedStatus,
                    review_notes:
                        reviewNotes.trim() ||
                        null,
                }
            );

            onUpdated?.();
        } catch (exception) {
            console.error(
                "Failed to update application:",
                exception
            );

            setError(
                exception?.response?.data?.message ||
                "Unable to update application status."
            );
        } finally {
            setSaving(false);
        }
    };


    /*
    |--------------------------------------------------------------------------
    | Download document
    |--------------------------------------------------------------------------
    */

    const handleDownload = async (
        document
    ) => {
        try {
            const response =
                await downloadTeacherApplicationDocument(
                    document.id
                );

            const blob =
                new Blob(
                    [response.data],
                    {
                        type:
                            document.mime_type ||
                            "application/octet-stream",
                    }
                );

            const url =
                window.URL.createObjectURL(
                    blob
                );

            const anchor =
                document.createElement(
                    "a"
                );

            anchor.href = url;

            anchor.download =
                document.original_name ||
                "document";

            document.body.appendChild(
                anchor
            );

            anchor.click();

            anchor.remove();

            window.URL.revokeObjectURL(
                url
            );
        } catch (exception) {
            console.error(
                "Document download failed:",
                exception
            );

            setError(
                "Unable to download this document."
            );
        }
    };


    if (!application) {
        return null;
    }


    const name =
        getName(details);


    return (
        <div
            className="ta-modal-backdrop"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose();
                }
            }}
        >

            <div className="ta-modal">

                {/* ======================================================
                    HEADER
                ====================================================== */}

                <div className="ta-modal-header">

                    <div className="ta-modal-title">

                        <div className="ta-modal-avatar">
                            {name
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>

                            <span>
                                Teacher Application
                            </span>

                            <h2>
                                {name}
                            </h2>

                            <code>
                                {
                                    details?.reference
                                }
                            </code>

                        </div>

                    </div>


                    <button
                        type="button"
                        className="ta-modal-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X size={21} />
                    </button>

                </div>


                {/* ======================================================
                    BODY
                ====================================================== */}

                <div className="ta-modal-body">

                    {error && (
                        <div className="ta-modal-error">
                            <i className="bx bx-error-circle" />
                            {error}
                        </div>
                    )}


                    {loading ? (
                        <div className="ta-modal-loading">

                            <div className="ta-spinner" />

                            <span>
                                Loading application details...
                            </span>

                        </div>
                    ) : (
                        <>

                            {/* ==================================================
                                BASIC INFORMATION
                            ================================================== */}

                            <section className="ta-detail-section">

                                <div className="ta-detail-heading">
                                    <User size={18} />

                                    <div>
                                        <h3>
                                            Applicant Information
                                        </h3>

                                        <span>
                                            Personal and contact details
                                        </span>
                                    </div>
                                </div>


                                <div className="ta-detail-grid">

                                    <div>
                                        <label>
                                            First Name
                                        </label>

                                        <strong>
                                            {
                                                details?.first_name ||
                                                "—"
                                            }
                                        </strong>
                                    </div>


                                    <div>
                                        <label>
                                            Last Name
                                        </label>

                                        <strong>
                                            {
                                                details?.last_name ||
                                                "—"
                                            }
                                        </strong>
                                    </div>


                                    <div>
                                        <label>
                                            Email
                                        </label>

                                        <strong className="ta-contact">
                                            <Mail size={15} />

                                            {
                                                details?.email ||
                                                "—"
                                            }
                                        </strong>
                                    </div>


                                    <div>
                                        <label>
                                            Phone
                                        </label>

                                        <strong className="ta-contact">
                                            <Phone size={15} />

                                            {
                                                details?.phone ||
                                                "—"
                                            }
                                        </strong>
                                    </div>


                                    <div className="ta-detail-full">
                                        <label>
                                            Address
                                        </label>

                                        <strong>
                                            {
                                                details?.address ||
                                                "—"
                                            }
                                        </strong>
                                    </div>

                                </div>

                            </section>


                            {/* ==================================================
                                PROFESSIONAL INFORMATION
                            ================================================== */}

                            <section className="ta-detail-section">

                                <div className="ta-detail-heading">
                                    <i className="bx bx-briefcase" />

                                    <div>
                                        <h3>
                                            Professional Information
                                        </h3>

                                        <span>
                                            Qualifications and teaching experience
                                        </span>
                                    </div>
                                </div>


                                <div className="ta-detail-grid">

                                    <div>
                                        <label>
                                            Position
                                        </label>

                                        <strong>
                                            {
                                                details?.position
                                                    ?.title ||
                                                details?.vacancy
                                                    ?.title ||
                                                "—"
                                            }
                                        </strong>
                                    </div>


                                    <div>
                                        <label>
                                            Department
                                        </label>

                                        <strong>
                                            {
                                                details?.position
                                                    ?.department ||
                                                details?.vacancy
                                                    ?.department ||
                                                "—"
                                            }
                                        </strong>
                                    </div>


                                    <div>
                                        <label>
                                            Qualification
                                        </label>

                                        <strong>
                                            {
                                                details?.qualification ||
                                                "—"
                                            }
                                        </strong>
                                    </div>


                                    <div>
                                        <label>
                                            Teaching Qualification
                                        </label>

                                        <strong>
                                            {
                                                details?.teaching_qualification ||
                                                "—"
                                            }
                                        </strong>
                                    </div>


                                    <div>
                                        <label>
                                            Subject
                                        </label>

                                        <strong>
                                            {
                                                details?.subject ||
                                                "—"
                                            }
                                        </strong>
                                    </div>


                                    <div>
                                        <label>
                                            Experience
                                        </label>

                                        <strong>
                                            {
                                                details?.experience ||
                                                "—"
                                            }
                                        </strong>
                                    </div>


                                    <div className="ta-detail-full">
                                        <label>
                                            Previous School
                                        </label>

                                        <strong>
                                            {
                                                details?.previous_school ||
                                                "—"
                                            }
                                        </strong>
                                    </div>

                                </div>

                            </section>


                            {/* ==================================================
                                COVER LETTER
                            ================================================== */}

                            <section className="ta-detail-section">

                                <div className="ta-detail-heading">
                                    <FileText size={18} />

                                    <div>
                                        <h3>
                                            Cover Letter
                                        </h3>
                                    </div>
                                </div>


                                <div className="ta-cover-letter">
                                    {
                                        details?.cover_letter ||
                                        "No cover letter provided."
                                    }
                                </div>

                            </section>


                            {/* ==================================================
                                DOCUMENTS
                            ================================================== */}

                            <section className="ta-detail-section">

                                <div className="ta-detail-heading">
                                    <FileText size={18} />

                                    <div>
                                        <h3>
                                            Documents
                                        </h3>

                                        <span>
                                            Uploaded application documents
                                        </span>
                                    </div>
                                </div>


                                <div className="ta-documents">

                                    {(
                                        details?.documents ||
                                        []
                                    ).length === 0 ? (
                                        <div className="ta-no-documents">
                                            No documents uploaded.
                                        </div>
                                    ) : (
                                        details.documents.map(
                                            (document) => (
                                                <div
                                                    className="ta-document"
                                                    key={
                                                        document.id
                                                    }
                                                >

                                                    <div className="ta-document-icon">
                                                        <FileText
                                                            size={20}
                                                        />
                                                    </div>

                                                    <div className="ta-document-info">

                                                        <strong>
                                                            {getDocumentTypeLabel(
                                                                document.type
                                                            )}
                                                        </strong>

                                                        <span>
                                                            {
                                                                document.original_name
                                                            }
                                                        </span>

                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDownload(
                                                                document
                                                            )
                                                        }
                                                    >
                                                        <Download
                                                            size={16}
                                                        />

                                                        Download
                                                    </button>

                                                </div>
                                            )
                                        )
                                    )}

                                </div>

                            </section>


                            {/* ==================================================
                                SUBMISSION
                            ================================================== */}

                            <section className="ta-detail-section">

                                <div className="ta-detail-heading">
                                    <i className="bx bx-time-five" />

                                    <div>
                                        <h3>
                                            Application Timeline
                                        </h3>
                                    </div>
                                </div>


                                <div className="ta-detail-grid">

                                    <div>
                                        <label>
                                            Submitted
                                        </label>

                                        <strong>
                                            {formatDateTime(
                                                details?.submitted_at
                                            )}
                                        </strong>
                                    </div>


                                    <div>
                                        <label>
                                            Reviewed
                                        </label>

                                        <strong>
                                            {formatDateTime(
                                                details?.reviewed_at
                                            )}
                                        </strong>
                                    </div>

                                </div>

                            </section>


                            {/* ==================================================
                                REVIEW
                            ================================================== */}

                            <section className="ta-review-section">

                                <div className="ta-detail-heading">

                                    <CheckCircle2
                                        size={18}
                                    />

                                    <div>
                                        <h3>
                                            Recruitment Decision
                                        </h3>

                                        <span>
                                            Update the application stage
                                        </span>
                                    </div>

                                </div>


                                <div className="ta-review-form">

                                    <div>

                                        <label>
                                            Application Status
                                        </label>

                                        <select
                                            value={
                                                selectedStatus
                                            }
                                            onChange={(event) =>
                                                setSelectedStatus(
                                                    event.target.value
                                                )
                                            }
                                        >
                                            {STATUS_OPTIONS.map(
                                                (value) => (
                                                    <option
                                                        key={
                                                            value
                                                        }
                                                        value={
                                                            value
                                                        }
                                                    >
                                                        {
                                                            TEACHER_APPLICATION_STATUS_META[
                                                                value
                                                            ]
                                                                ?.label ||
                                                            value
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>

                                    </div>


                                    <div>

                                        <label>
                                            Review Notes
                                        </label>

                                        <textarea
                                            value={
                                                reviewNotes
                                            }
                                            onChange={(event) =>
                                                setReviewNotes(
                                                    event.target.value
                                                )
                                            }
                                            maxLength={
                                                5000
                                            }
                                            rows={
                                                5
                                            }
                                            placeholder="Add internal review notes..."
                                        />

                                        <small>
                                            {
                                                reviewNotes.length
                                            }{" "}
                                            / 5000
                                        </small>

                                    </div>

                                </div>

                            </section>

                        </>
                    )}

                </div>


                {/* ======================================================
                    FOOTER
                ====================================================== */}

                <div className="ta-modal-footer">

                    <button
                        type="button"
                        className="ta-secondary-button"
                        onClick={onClose}
                    >
                        Close
                    </button>


                    <button
                        type="button"
                        className="ta-primary-button"
                        disabled={
                            loading ||
                            saving
                        }
                        onClick={
                            handleUpdateStatus
                        }
                    >
                        {saving ? (
                            <>
                                <span className="ta-button-spinner" />

                                Saving...
                            </>
                        ) : (
                            <>
                                <CheckCircle2
                                    size={17}
                                />

                                Save Decision
                            </>
                        )}
                    </button>

                </div>

            </div>

        </div>
    );
}