// src/pages/public/TeacherApplicationPage.jsx
// ============================================================
// CCAST SCHOOL MANAGEMENT SYSTEM
// Teacher Recruitment / Application Page
// ============================================================

import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import { submitTeacherApplication } from "../../api/public";
import "./TeacherApplicationPage.css";

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_CERTIFICATES = 10;
const MAX_COVER_LETTER_LENGTH = 2000;
const MIN_COVER_LETTER_LENGTH = 50;

const STEPS = [
    {
        id: 1,
        label: "Personal",
        title: "Personal Information",
        description: "Your basic contact information",
        icon: "fa-user",
    },
    {
        id: 2,
        label: "Professional",
        title: "Professional Details",
        description: "Your qualifications and experience",
        icon: "fa-graduation-cap",
    },
    {
        id: 3,
        label: "Documents",
        title: "Documents & Submit",
        description: "Supporting documents and confirmation",
        icon: "fa-file-arrow-up",
    },
];

const INITIAL_FORM = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",

    photo: null,
    photoPreview: null,

    qualification: "",
    teaching_qualification: "",
    subject: "",
    experience: "",
    previous_school: "",
    cover_letter: "",

    cv: null,
    certificates: [],
    id_document: null,

    consent: false,
};

const FILE_RULES = {
    photo: {
        accept: ["image/jpeg", "image/png", "image/webp"],
        extensions: ".jpg,.jpeg,.png,.webp",
    },

    cv: {
        accept: [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        extensions: ".pdf,.doc,.docx",
    },

    id_document: {
        accept: [
            "application/pdf",
            "image/jpeg",
            "image/png",
        ],
        extensions: ".pdf,.jpg,.jpeg,.png",
    },

    certificates: {
        accept: [
            "application/pdf",
            "image/jpeg",
            "image/png",
        ],
        extensions: ".pdf,.jpg,.jpeg,.png",
    },
};

/* ============================================================
   HELPERS
============================================================ */

const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

const isValidPhone = (phone) => {
    return /^[+\d\s\-().]{8,20}$/.test(phone.trim());
};

const formatFileSize = (bytes) => {
    if (!bytes || bytes <= 0) {
        return "0 KB";
    }

    if (bytes < 1024 * 1024) {
        return `${Math.ceil(bytes / 1024)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getFileIcon = (file) => {
    if (!file) {
        return "fa-file";
    }

    if (file.type === "application/pdf") {
        return "fa-file-pdf";
    }

    if (file.type.startsWith("image/")) {
        return "fa-file-image";
    }

    if (
        file.type === "application/msword" ||
        file.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
        return "fa-file-word";
    }

    return "fa-file-lines";
};

const getApiErrorMessage = (error) => {
    const responseData = error?.response?.data;

    if (responseData?.message) {
        return responseData.message;
    }

    if (responseData?.error) {
        return responseData.error;
    }

    if (responseData?.errors) {
        const firstError = Object.values(responseData.errors)
            .flat()
            .find(Boolean);

        if (firstError) {
            return firstError;
        }
    }

    if (error?.message) {
        return error.message;
    }

    return "We could not submit your application. Please try again.";
};

/* ============================================================
   COMPONENT
============================================================ */

const TeacherApplicationPage = () => {
    const [searchParams] = useSearchParams();

    const positionId = searchParams.get("position");

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [applicationReference, setApplicationReference] =
        useState("");

    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});

    const [copiedReference, setCopiedReference] =
        useState(false);

    const photoInputRef = useRef(null);
    const cvInputRef = useRef(null);
    const certificateInputRef = useRef(null);
    const idInputRef = useRef(null);

    /* ========================================================
       CURRENT STEP
    ======================================================== */

    const currentStep = useMemo(
        () => STEPS.find((item) => item.id === step),
        [step]
    );

    const progressPercentage = useMemo(
        () => `${(step / STEPS.length) * 100}%`,
        [step]
    );

    /* ========================================================
       CLEANUP PHOTO PREVIEW
    ======================================================== */

    useEffect(() => {
        return () => {
            if (form.photoPreview?.startsWith("blob:")) {
                URL.revokeObjectURL(form.photoPreview);
            }
        };
    }, [form.photoPreview]);

    /* ========================================================
       UPDATE FIELD
    ======================================================== */

    const updateField = useCallback((field, value) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));

        setErrors((previous) => {
            if (!previous[field]) {
                return previous;
            }

            const next = {
                ...previous,
            };

            delete next[field];

            return next;
        });
    }, []);

    /* ========================================================
       FILE VALIDATION
    ======================================================== */

    const validateFile = useCallback((file, field) => {
        if (!file) {
            return "Please select a file.";
        }

        if (file.size > MAX_FILE_SIZE) {
            return "File size must not exceed 5MB.";
        }

        const rule = FILE_RULES[field];

        if (rule && !rule.accept.includes(file.type)) {
            return "This file type is not supported.";
        }

        return null;
    }, []);

    /* ========================================================
       SINGLE FILE HANDLER
    ======================================================== */

    const handleFileChange = useCallback(
        (field, files) => {
            const file = files?.[0];

            if (!file) {
                return;
            }

            const fileError = validateFile(file, field);

            if (fileError) {
                setErrors((previous) => ({
                    ...previous,
                    [field]: fileError,
                }));

                return;
            }

            if (field === "photo") {
                const reader = new FileReader();

                reader.onloadend = () => {
                    setForm((previous) => ({
                        ...previous,
                        photo: file,
                        photoPreview: reader.result,
                    }));
                };

                reader.readAsDataURL(file);
            } else {
                setForm((previous) => ({
                    ...previous,
                    [field]: file,
                }));
            }

            setErrors((previous) => {
                const next = {
                    ...previous,
                };

                delete next[field];

                return next;
            });
        },
        [validateFile]
    );

    /* ========================================================
       MULTIPLE FILE HANDLER
    ======================================================== */

    const handleMultipleFiles = useCallback(
        (field, files) => {
            const fileArray = Array.from(files || []);

            if (!fileArray.length) {
                return;
            }

            if (fileArray.length > MAX_CERTIFICATES) {
                setErrors((previous) => ({
                    ...previous,
                    [field]: `You can upload a maximum of ${MAX_CERTIFICATES} certificates.`,
                }));

                return;
            }

            for (const file of fileArray) {
                const fileError = validateFile(file, field);

                if (fileError) {
                    setErrors((previous) => ({
                        ...previous,
                        [field]: `${file.name}: ${fileError}`,
                    }));

                    return;
                }
            }

            setForm((previous) => ({
                ...previous,
                [field]: fileArray,
            }));

            setErrors((previous) => {
                const next = {
                    ...previous,
                };

                delete next[field];

                return next;
            });
        },
        [validateFile]
    );

    /* ========================================================
       REMOVE PHOTO
    ======================================================== */

    const removePhoto = () => {
        setForm((previous) => ({
            ...previous,
            photo: null,
            photoPreview: null,
        }));

        if (photoInputRef.current) {
            photoInputRef.current.value = "";
        };
    };

    /* ========================================================
       REMOVE SINGLE DOCUMENT
    ======================================================== */

    const removeFile = (field, inputRef) => {
        setForm((previous) => ({
            ...previous,
            [field]: null,
        }));

        if (inputRef?.current) {
            inputRef.current.value = "";
        }

        setErrors((previous) => {
            const next = {
                ...previous,
            };

            delete next[field];

            return next;
        });
    };

    /* ========================================================
       REMOVE CERTIFICATES
    ======================================================== */

    const removeCertificates = () => {
        setForm((previous) => ({
            ...previous,
            certificates: [],
        }));

        if (certificateInputRef.current) {
            certificateInputRef.current.value = "";
        }

        setErrors((previous) => {
            const next = {
                ...previous,
            };

            delete next.certificates;

            return next;
        });
    };

    /* ========================================================
       STEP VALIDATION
    ======================================================== */

    const validateStep = useCallback(
        (stepNumber) => {
            const newErrors = {};

            /* --------------------------------------------------
               STEP 1
            -------------------------------------------------- */

            if (stepNumber === 1) {
                if (!form.first_name.trim()) {
                    newErrors.first_name =
                        "First name is required.";
                }

                if (!form.last_name.trim()) {
                    newErrors.last_name =
                        "Last name is required.";
                }

                if (!form.email.trim()) {
                    newErrors.email =
                        "Email address is required.";
                } else if (!isValidEmail(form.email)) {
                    newErrors.email =
                        "Please enter a valid email address.";
                }

                if (!form.phone.trim()) {
                    newErrors.phone =
                        "Phone number is required.";
                } else if (!isValidPhone(form.phone)) {
                    newErrors.phone =
                        "Please enter a valid phone number.";
                }

                if (!form.photo) {
                    newErrors.photo =
                        "A passport photo is required.";
                }
            }

            /* --------------------------------------------------
               STEP 2
            -------------------------------------------------- */

            if (stepNumber === 2) {
                if (!form.qualification) {
                    newErrors.qualification =
                        "Highest qualification is required.";
                }

                if (!form.subject.trim()) {
                    newErrors.subject =
                        "Main teaching subject is required.";
                }

                if (!form.experience) {
                    newErrors.experience =
                        "Teaching experience is required.";
                }

                const coverLetterLength =
                    form.cover_letter.trim().length;

                if (!coverLetterLength) {
                    newErrors.cover_letter =
                        "Cover letter is required.";
                } else if (
                    coverLetterLength <
                    MIN_COVER_LETTER_LENGTH
                ) {
                    newErrors.cover_letter =
                        `Your cover letter should contain at least ${MIN_COVER_LETTER_LENGTH} characters.`;
                }
            }

            /* --------------------------------------------------
               STEP 3
            -------------------------------------------------- */

            if (stepNumber === 3) {
                if (!form.cv) {
                    newErrors.cv =
                        "CV / Resume is required.";
                }

                if (!form.certificates.length) {
                    newErrors.certificates =
                        "At least one certificate is required.";
                }

                if (!form.id_document) {
                    newErrors.id_document =
                        "A valid identification document is required.";
                }

                if (!form.consent) {
                    newErrors.consent =
                        "Please confirm that the information provided is accurate.";
                }
            }

            setErrors(newErrors);

            return Object.keys(newErrors).length === 0;
        },
        [form]
    );

    /* ========================================================
       SCROLL TO FIRST ERROR
    ======================================================== */

    const scrollToFirstError = () => {
        requestAnimationFrame(() => {
            const firstError =
                document.querySelector(
                    ".form-error, .field-error, .submission-error"
                );

            firstError?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        });
    };

    /* ========================================================
       NAVIGATION
    ======================================================== */

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const nextStep = () => {
        if (!validateStep(step)) {
            scrollToFirstError();
            return;
        }

        if (step < STEPS.length) {
            setStep((previous) => previous + 1);
            scrollToTop();
        }
    };

    const previousStep = () => {
        if (step > 1 && !isSubmitting) {
            setStep((previous) => previous - 1);
            scrollToTop();
        }
    };

    /* ========================================================
       SUBMIT APPLICATION
    ======================================================== */

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (isSubmitting) {
            return;
        }

        if (!validateStep(3)) {
            scrollToFirstError();
            return;
        }

        setIsSubmitting(true);

        setErrors((previous) => {
            const next = {
                ...previous,
            };

            delete next.submit;

            return next;
        });

        try {
            const formData = new FormData();

            /* --------------------------------------------------
               POSITION
            -------------------------------------------------- */

            if (positionId) {
                formData.append(
                    "vacancy_id",
                    positionId
                );
            }

            /* --------------------------------------------------
               PERSONAL INFORMATION
            -------------------------------------------------- */

            formData.append(
                "first_name",
                form.first_name.trim()
            );

            formData.append(
                "last_name",
                form.last_name.trim()
            );

            formData.append(
                "email",
                form.email.trim()
            );

            formData.append(
                "phone",
                form.phone.trim()
            );

            formData.append(
                "address",
                form.address.trim()
            );

            /* --------------------------------------------------
               PROFESSIONAL INFORMATION
            -------------------------------------------------- */

            formData.append(
                "qualification",
                form.qualification
            );

            formData.append(
                "teaching_qualification",
                form.teaching_qualification.trim()
            );

            formData.append(
                "subject",
                form.subject.trim()
            );

            formData.append(
                "experience",
                form.experience
            );

            formData.append(
                "previous_school",
                form.previous_school.trim()
            );

            formData.append(
                "cover_letter",
                form.cover_letter.trim()
            );

            /* --------------------------------------------------
               CONSENT
            -------------------------------------------------- */

            formData.append(
                "consent",
                form.consent ? "1" : "0"
            );

            /* --------------------------------------------------
               SINGLE FILES
            -------------------------------------------------- */

            if (form.photo) {
                formData.append(
                    "photo",
                    form.photo
                );
            }

            if (form.cv) {
                formData.append(
                    "cv",
                    form.cv
                );
            }

            if (form.id_document) {
                formData.append(
                    "id_document",
                    form.id_document
                );
            }

            /* --------------------------------------------------
               CERTIFICATES
            -------------------------------------------------- */

            form.certificates.forEach((file) => {
                formData.append(
                    "certificates[]",
                    file
                );
            });

            /* --------------------------------------------------
               API REQUEST
            -------------------------------------------------- */

            const response =
                await submitTeacherApplication(
                    formData
                );

            /*
             * IMPORTANT:
             * Do not generate a fake application reference here.
             * The backend should generate and return the official
             * application reference.
             */

            const reference =
                response?.application_reference ||
                response?.application_number ||
                response?.reference ||
                response?.data?.application_reference ||
                response?.data?.application_number ||
                response?.data?.reference;

            if (!reference) {
                throw new Error(
                    "Application submitted, but no application reference was returned by the server."
                );
            }

            setApplicationReference(
                String(reference)
            );

            setSubmitted(true);

            scrollToTop();
        } catch (error) {
            console.error(
                "Teacher application submission error:",
                error
            );

            const message =
                getApiErrorMessage(error);

            setErrors({
                submit: message,
            });

            scrollToFirstError();
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ========================================================
       ERROR RENDERER
    ======================================================== */

    const renderError = (field) => {
        if (!errors[field]) {
            return null;
        }

        return (
            <div
                className="form-error"
                role="alert"
            >
                <i
                    className="fas fa-circle-exclamation"
                    aria-hidden="true"
                />

                <span>
                    {errors[field]}
                </span>
            </div>
        );
    };

    /* ========================================================
       COPY APPLICATION REFERENCE
    ======================================================== */

    const copyApplicationReference = async () => {
        if (!applicationReference) {
            return;
        }

        try {
            await navigator.clipboard.writeText(
                applicationReference
            );

            setCopiedReference(true);

            window.setTimeout(() => {
                setCopiedReference(false);
            }, 1800);
        } catch (error) {
            console.error(
                "Unable to copy application reference:",
                error
            );
        }
    };

    /* ========================================================
       SUCCESS SCREEN
    ======================================================== */

    if (submitted) {
        return (
            <main className="application-page">
                <section className="application-success-page">
                    <div className="container-xl">
                        <div className="success-shell">

                            <Link
                                to="/careers"
                                className="success-back"
                            >
                                <i
                                    className="fas fa-arrow-left"
                                    aria-hidden="true"
                                />

                                Back to Careers
                            </Link>

                            <div className="success-card">

                                <div className="success-icon">
                                    <i
                                        className="fas fa-check"
                                        aria-hidden="true"
                                    />
                                </div>

                                <span className="success-eyebrow">
                                    APPLICATION RECEIVED
                                </span>

                                <h1>
                                    Thank you for applying!
                                </h1>

                                <p>
                                    Your teaching application has
                                    been successfully submitted to
                                    CCAST Bambili. Our recruitment
                                    team will review your application
                                    and contact you if you are
                                    shortlisted.
                                </p>

                                <div className="application-reference">
                                    <span>
                                        Application Reference
                                    </span>

                                    <strong>
                                        {applicationReference}
                                    </strong>

                                    <button
                                        type="button"
                                        onClick={
                                            copyApplicationReference
                                        }
                                        title={
                                            copiedReference
                                                ? "Reference copied"
                                                : "Copy application reference"
                                        }
                                        aria-label={
                                            copiedReference
                                                ? "Application reference copied"
                                                : "Copy application reference"
                                        }
                                    >
                                        <i
                                            className={
                                                copiedReference
                                                    ? "fas fa-check"
                                                    : "fas fa-copy"
                                            }
                                            aria-hidden="true"
                                        />
                                    </button>
                                </div>

                                {copiedReference && (
                                    <div
                                        className="reference-copied"
                                        role="status"
                                    >
                                        <i
                                            className="fas fa-circle-check"
                                            aria-hidden="true"
                                        />

                                        Application reference copied.
                                    </div>
                                )}

                                <div className="success-note">
                                    <i
                                        className="fas fa-shield-halved"
                                        aria-hidden="true"
                                    />

                                    <div>
                                        <strong>
                                            Your information is secure
                                        </strong>

                                        <span>
                                            Your application details
                                            and documents will only be
                                            used for recruitment
                                            purposes.
                                        </span>
                                    </div>
                                </div>

                                <div className="success-actions">

                                    <Link
                                        to="/"
                                        className="application-btn primary"
                                    >
                                        <i
                                            className="fas fa-house"
                                            aria-hidden="true"
                                        />

                                        Return Home
                                    </Link>

                                    <Link
                                        to="/careers"
                                        className="application-btn secondary"
                                    >
                                        View Other Positions
                                    </Link>

                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        );
    }

    /* ========================================================
       MAIN PAGE
    ======================================================== */

    return (
        <main className="application-page">

            {/* ==================================================
                HERO
            ================================================== */}

            <section className="application-hero">
                <div
                    className="hero-orb hero-orb-one"
                    aria-hidden="true"
                />

                <div
                    className="hero-orb hero-orb-two"
                    aria-hidden="true"
                />

                <div className="container-xl application-hero-inner">

                    <Link
                        to="/careers"
                        className="application-back"
                    >
                        <i
                            className="fas fa-arrow-left"
                            aria-hidden="true"
                        />

                        <span>
                            Back to Careers
                        </span>
                    </Link>

                    <div className="application-hero-content">

                        <div className="hero-copy">

                            <div className="hero-eyebrow">
                                <span
                                    className="eyebrow-dot"
                                    aria-hidden="true"
                                />

                                CCAST BAMBILI RECRUITMENT
                            </div>

                            <h1>
                                Join our team of
                                <span>
                                    {" "}exceptional educators.
                                </span>
                            </h1>

                            <p>
                                Take the next step in your teaching
                                career. Complete your application and
                                become part of the CCAST Bambili
                                academic community.
                            </p>

                            <div className="hero-meta">

                                <div>
                                    <i
                                        className="fas fa-lock"
                                        aria-hidden="true"
                                    />

                                    <span>
                                        Secure application
                                    </span>
                                </div>

                                <div>
                                    <i
                                        className="fas fa-clock"
                                        aria-hidden="true"
                                    />

                                    <span>
                                        10–15 minutes
                                    </span>
                                </div>

                                <div>
                                    <i
                                        className="fas fa-file-circle-check"
                                        aria-hidden="true"
                                    />

                                    <span>
                                        3 simple steps
                                    </span>
                                </div>

                            </div>
                        </div>

                        <div className="hero-visual">

                            <div className="hero-visual-card">

                                <div className="hero-visual-icon">
                                    <i
                                        className="fas fa-chalkboard-user"
                                        aria-hidden="true"
                                    />
                                </div>

                                <div>
                                    <strong>
                                        Teacher Recruitment
                                    </strong>

                                    <span>
                                        Build the future with
                                        CCAST Bambili.
                                    </span>
                                </div>

                            </div>

                            <div className="floating-badge badge-top">
                                <i
                                    className="fas fa-user-check"
                                    aria-hidden="true"
                                />

                                <span>
                                    Professional
                                </span>
                            </div>

                            <div className="floating-badge badge-bottom">
                                <i
                                    className="fas fa-graduation-cap"
                                    aria-hidden="true"
                                />

                                <span>
                                    Education
                                </span>
                            </div>

                        </div>

                    </div>
                </div>
            </section>

            {/* ==================================================
                APPLICATION AREA
            ================================================== */}

            <section className="application-content">
                <div className="container-xl">

                    {/* POSITION / PREPARATION NOTICE */}

                    <div className="application-notice">

                        <div className="notice-icon">
                            <i
                                className="fas fa-circle-info"
                                aria-hidden="true"
                            />
                        </div>

                        <div>
                            <strong>
                                Before you begin
                            </strong>

                            <p>
                                Please have your CV, certificates,
                                identification document and passport
                                photograph ready. Each uploaded file
                                must be no larger than 5MB.
                            </p>
                        </div>

                    </div>

                    {/* ==================================================
                        DESKTOP STEPPER
                    ================================================== */}

                    <div
                        className="application-stepper"
                        aria-label="Application progress"
                    >

                        {STEPS.map((item, index) => {
                            const completed =
                                step > item.id;

                            const active =
                                step === item.id;

                            return (
                                <React.Fragment
                                    key={item.id}
                                >

                                    <div
                                        className={`
                                            step-item
                                            ${active ? "active" : ""}
                                            ${completed ? "completed" : ""}
                                        `.trim()}
                                    >

                                        <div className="step-number">

                                            {completed ? (
                                                <i
                                                    className="fas fa-check"
                                                    aria-hidden="true"
                                                />
                                            ) : (
                                                <span>
                                                    {item.id}
                                                </span>
                                            )}

                                        </div>

                                        <div className="step-info">
                                            <strong>
                                                {item.label}
                                            </strong>

                                            <span>
                                                {item.description}
                                            </span>
                                        </div>

                                    </div>

                                    {index <
                                        STEPS.length - 1 && (
                                        <div
                                            className={`
                                                step-line
                                                ${
                                                    completed
                                                        ? "completed"
                                                        : ""
                                                }
                                            `.trim()}
                                            aria-hidden="true"
                                        />
                                    )}

                                </React.Fragment>
                            );
                        })}

                    </div>

                    {/* ==================================================
                        MOBILE STEP INDICATOR
                    ================================================== */}

                    <div className="mobile-step-summary">

                        <div className="mobile-step-number">
                            {step}
                        </div>

                        <div>
                            <span>
                                STEP{" "}
                                {String(step).padStart(2, "0")}
                                {" "}OF 03
                            </span>

                            <strong>
                                {currentStep?.title}
                            </strong>
                        </div>

                        <div className="mobile-step-progress">
                            <span
                                style={{
                                    width:
                                        progressPercentage,
                                }}
                            />
                        </div>

                    </div>

                    {/* ==================================================
                        APPLICATION FORM
                    ================================================== */}

                    <form
                        onSubmit={handleSubmit}
                        noValidate
                        className="application-form"
                    >

                        {/* ==================================================
                            STEP 1 — PERSONAL
                        ================================================== */}

                        {step === 1 && (
                            <div className="application-card">

                                <div className="card-heading">

                                    <div className="card-heading-icon">
                                        <i
                                            className="fas fa-user"
                                            aria-hidden="true"
                                        />
                                    </div>

                                    <div>
                                        <span className="section-kicker">
                                            STEP 01
                                        </span>

                                        <h2>
                                            Personal Information
                                        </h2>

                                        <p>
                                            Tell us how we can reach you.
                                        </p>
                                    </div>

                                </div>

                                {/* BASIC DETAILS */}

                                <div className="form-section">

                                    <div className="section-title">
                                        <span>
                                            01
                                        </span>

                                        <div>
                                            <strong>
                                                Basic Details
                                            </strong>

                                            <small>
                                                Your legal name and
                                                contact information
                                            </small>
                                        </div>
                                    </div>

                                    <div className="application-grid">

                                        {/* FIRST NAME */}

                                        <div className="form-group">

                                            <label htmlFor="first_name">
                                                First Name
                                                <span className="required">
                                                    *
                                                </span>
                                            </label>

                                            <div className="input-wrapper">
                                                <i
                                                    className="fas fa-user"
                                                    aria-hidden="true"
                                                />

                                                <input
                                                    id="first_name"
                                                    name="first_name"
                                                    type="text"
                                                    autoComplete="given-name"
                                                    placeholder="e.g. John"
                                                    value={
                                                        form.first_name
                                                    }
                                                    onChange={(event) =>
                                                        updateField(
                                                            "first_name",
                                                            event.target.value
                                                        )
                                                    }
                                                    className={
                                                        errors.first_name
                                                            ? "error"
                                                            : ""
                                                    }
                                                    aria-invalid={
                                                        Boolean(
                                                            errors.first_name
                                                        )
                                                    }
                                                    aria-describedby={
                                                        errors.first_name
                                                            ? "first-name-error"
                                                            : undefined
                                                    }
                                                />
                                            </div>

                                            {errors.first_name && (
                                                <div
                                                    id="first-name-error"
                                                    className="form-error"
                                                    role="alert"
                                                >
                                                    <i
                                                        className="fas fa-circle-exclamation"
                                                        aria-hidden="true"
                                                    />

                                                    <span>
                                                        {errors.first_name}
                                                    </span>
                                                </div>
                                            )}

                                        </div>

                                        {/* LAST NAME */}

                                        <div className="form-group">

                                            <label htmlFor="last_name">
                                                Last Name
                                                <span className="required">
                                                    *
                                                </span>
                                            </label>

                                            <div className="input-wrapper">
                                                <i
                                                    className="fas fa-user"
                                                    aria-hidden="true"
                                                />

                                                <input
                                                    id="last_name"
                                                    name="last_name"
                                                    type="text"
                                                    autoComplete="family-name"
                                                    placeholder="e.g. Doe"
                                                    value={
                                                        form.last_name
                                                    }
                                                    onChange={(event) =>
                                                        updateField(
                                                            "last_name",
                                                            event.target.value
                                                        )
                                                    }
                                                    className={
                                                        errors.last_name
                                                            ? "error"
                                                            : ""
                                                    }
                                                />
                                            </div>

                                            {renderError("last_name")}

                                        </div>

                                        {/* EMAIL */}

                                        <div className="form-group">

                                            <label htmlFor="email">
                                                Email Address
                                                <span className="required">
                                                    *
                                                </span>
                                            </label>

                                            <div className="input-wrapper">
                                                <i
                                                    className="fas fa-envelope"
                                                    aria-hidden="true"
                                                />

                                                <input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    autoComplete="email"
                                                    placeholder="you@example.com"
                                                    value={
                                                        form.email
                                                    }
                                                    onChange={(event) =>
                                                        updateField(
                                                            "email",
                                                            event.target.value
                                                        )
                                                    }
                                                    className={
                                                        errors.email
                                                            ? "error"
                                                            : ""
                                                    }
                                                />
                                            </div>

                                            {renderError("email")}

                                        </div>

                                        {/* PHONE */}

                                        <div className="form-group">

                                            <label htmlFor="phone">
                                                Phone Number
                                                <span className="required">
                                                    *
                                                </span>
                                            </label>

                                            <div className="input-wrapper">
                                                <i
                                                    className="fas fa-phone"
                                                    aria-hidden="true"
                                                />

                                                <input
                                                    id="phone"
                                                    name="phone"
                                                    type="tel"
                                                    autoComplete="tel"
                                                    placeholder="+237 6XX XXX XXX"
                                                    value={
                                                        form.phone
                                                    }
                                                    onChange={(event) =>
                                                        updateField(
                                                            "phone",
                                                            event.target.value
                                                        )
                                                    }
                                                    className={
                                                        errors.phone
                                                            ? "error"
                                                            : ""
                                                    }
                                                />
                                            </div>

                                            {renderError("phone")}

                                        </div>

                                        {/* ADDRESS */}

                                        <div className="form-group full">

                                            <label htmlFor="address">
                                                Residential Address
                                            </label>

                                            <div className="input-wrapper">
                                                <i
                                                    className="fas fa-location-dot"
                                                    aria-hidden="true"
                                                />

                                                <input
                                                    id="address"
                                                    name="address"
                                                    type="text"
                                                    autoComplete="street-address"
                                                    placeholder="Enter your residential address"
                                                    value={
                                                        form.address
                                                    }
                                                    onChange={(event) =>
                                                        updateField(
                                                            "address",
                                                            event.target.value
                                                        )
                                                    }
                                                />
                                            </div>

                                        </div>

                                    </div>
                                </div>

                                {/* PHOTO */}

                                <div className="form-section">

                                    <div className="section-title">

                                        <span>
                                            02
                                        </span>

                                        <div>
                                            <strong>
                                                Profile Photograph
                                            </strong>

                                            <small>
                                                Upload a clear recent
                                                passport photograph
                                            </small>
                                        </div>

                                    </div>

                                    <div
                                        className={`
                                            photo-uploader
                                            ${
                                                errors.photo
                                                    ? "has-error"
                                                    : ""
                                            }
                                        `.trim()}
                                    >

                                        <div className="photo-preview-wrapper">

                                            {form.photoPreview ? (
                                                <img
                                                    src={
                                                        form.photoPreview
                                                    }
                                                    alt="Passport preview"
                                                />
                                            ) : (
                                                <div className="photo-placeholder">
                                                    <i
                                                        className="fas fa-camera"
                                                        aria-hidden="true"
                                                    />

                                                    <span>
                                                        Photo
                                                    </span>
                                                </div>
                                            )}

                                        </div>

                                        <div className="photo-upload-info">

                                            <h3>
                                                Passport Photograph

                                                <span className="required">
                                                    *
                                                </span>
                                            </h3>

                                            <p>
                                                Use a recent, clear
                                                headshot with good
                                                lighting and a plain
                                                background.
                                            </p>

                                            <div className="upload-actions">

                                                <input
                                                    ref={
                                                        photoInputRef
                                                    }
                                                    type="file"
                                                    accept={
                                                        FILE_RULES
                                                            .photo
                                                            .extensions
                                                    }
                                                    onChange={(event) =>
                                                        handleFileChange(
                                                            "photo",
                                                            event.target
                                                                .files
                                                        )
                                                    }
                                                    hidden
                                                />

                                                <button
                                                    type="button"
                                                    className="upload-btn"
                                                    onClick={() =>
                                                        photoInputRef.current?.click()
                                                    }
                                                >
                                                    <i
                                                        className="fas fa-cloud-arrow-up"
                                                        aria-hidden="true"
                                                    />

                                                    {form.photo
                                                        ? "Change Photo"
                                                        : "Choose Photo"}
                                                </button>

                                                {form.photo && (
                                                    <button
                                                        type="button"
                                                        className="upload-remove-btn"
                                                        onClick={
                                                            removePhoto
                                                        }
                                                        aria-label="Remove passport photo"
                                                    >
                                                        <i
                                                            className="fas fa-trash"
                                                            aria-hidden="true"
                                                        />

                                                        Remove
                                                    </button>
                                                )}

                                            </div>

                                            {form.photo && (
                                                <span className="selected-file">
                                                    <i
                                                        className="fas fa-circle-check"
                                                        aria-hidden="true"
                                                    />

                                                    {form.photo.name}

                                                    <small>
                                                        {" "}·{" "}
                                                        {formatFileSize(
                                                            form.photo.size
                                                        )}
                                                    </small>
                                                </span>
                                            )}

                                            <div className="upload-hint">
                                                <span>
                                                    JPG
                                                </span>

                                                <span>
                                                    PNG
                                                </span>

                                                <span>
                                                    WEBP
                                                </span>

                                                <span>
                                                    Max 5MB
                                                </span>
                                            </div>

                                            {renderError("photo")}

                                        </div>
                                    </div>
                                </div>

                                {/* ACTIONS */}

                                <div className="application-actions">

                                    <Link
                                        to="/careers"
                                        className="application-btn secondary"
                                    >
                                        <i
                                            className="fas fa-xmark"
                                            aria-hidden="true"
                                        />

                                        Cancel
                                    </Link>

                                    <button
                                        type="button"
                                        className="application-btn primary"
                                        onClick={nextStep}
                                    >
                                        Continue

                                        <i
                                            className="fas fa-arrow-right"
                                            aria-hidden="true"
                                        />
                                    </button>

                                </div>

                            </div>
                        )}

                        {/* ==================================================
                            STEP 2 — PROFESSIONAL
                        ================================================== */}

                        {step === 2 && (
                            <div className="application-card">

                                <div className="card-heading">

                                    <div className="card-heading-icon">
                                        <i
                                            className="fas fa-graduation-cap"
                                            aria-hidden="true"
                                        />
                                    </div>

                                    <div>
                                        <span className="section-kicker">
                                            STEP 02
                                        </span>

                                        <h2>
                                            Professional Details
                                        </h2>

                                        <p>
                                            Tell us about your
                                            qualifications and
                                            teaching experience.
                                        </p>
                                    </div>

                                </div>

                                {/* PROFESSIONAL DETAILS */}

                                <div className="form-section">

                                    <div className="section-title">

                                        <span>
                                            01
                                        </span>

                                        <div>
                                            <strong>
                                                Academic & Teaching Profile
                                            </strong>

                                            <small>
                                                Help us understand
                                                your professional
                                                background
                                            </small>
                                        </div>

                                    </div>

                                    <div className="application-grid">

                                        {/* QUALIFICATION */}

                                        <div className="form-group">

                                            <label htmlFor="qualification">
                                                Highest Qualification

                                                <span className="required">
                                                    *
                                                </span>
                                            </label>

                                            <div className="input-wrapper select-wrapper">

                                                <i
                                                    className="fas fa-award"
                                                    aria-hidden="true"
                                                />

                                                <select
                                                    id="qualification"
                                                    name="qualification"
                                                    value={
                                                        form.qualification
                                                    }
                                                    onChange={(event) =>
                                                        updateField(
                                                            "qualification",
                                                            event.target.value
                                                        )
                                                    }
                                                    className={
                                                        errors.qualification
                                                            ? "error"
                                                            : ""
                                                    }
                                                >
                                                    <option value="">
                                                        Select qualification
                                                    </option>

                                                    <option value="bachelors">
                                                        Bachelor's Degree
                                                    </option>

                                                    <option value="masters">
                                                        Master's Degree
                                                    </option>

                                                    <option value="phd">
                                                        PhD
                                                    </option>

                                                    <option value="other">
                                                        Other
                                                    </option>
                                                </select>

                                            </div>

                                            {renderError(
                                                "qualification"
                                            )}

                                        </div>

                                        {/* TEACHING QUALIFICATION */}

                                        <div className="form-group">

                                            <label htmlFor="teaching_qualification">
                                                Teaching Qualification
                                            </label>

                                            <div className="input-wrapper">

                                                <i
                                                    className="fas fa-certificate"
                                                    aria-hidden="true"
                                                />

                                                <input
                                                    id="teaching_qualification"
                                                    name="teaching_qualification"
                                                    type="text"
                                                    placeholder="e.g. DIPES II, DIPET II, B.Ed."
                                                    value={
                                                        form.teaching_qualification
                                                    }
                                                    onChange={(event) =>
                                                        updateField(
                                                            "teaching_qualification",
                                                            event.target.value
                                                        )
                                                    }
                                                />

                                            </div>

                                        </div>

                                        {/* SUBJECT */}

                                        <div className="form-group">

                                            <label htmlFor="subject">
                                                Main Teaching Subject

                                                <span className="required">
                                                    *
                                                </span>
                                            </label>

                                            <div className="input-wrapper">

                                                <i
                                                    className="fas fa-book-open"
                                                    aria-hidden="true"
                                                />

                                                <input
                                                    id="subject"
                                                    name="subject"
                                                    type="text"
                                                    placeholder="e.g. Mathematics"
                                                    value={
                                                        form.subject
                                                    }
                                                    onChange={(event) =>
                                                        updateField(
                                                            "subject",
                                                            event.target.value
                                                        )
                                                    }
                                                    className={
                                                        errors.subject
                                                            ? "error"
                                                            : ""
                                                    }
                                                />

                                            </div>

                                            {renderError("subject")}

                                        </div>

                                        {/* EXPERIENCE */}

                                        <div className="form-group">

                                            <label htmlFor="experience">
                                                Teaching Experience

                                                <span className="required">
                                                    *
                                                </span>
                                            </label>

                                            <div className="input-wrapper select-wrapper">

                                                <i
                                                    className="fas fa-briefcase"
                                                    aria-hidden="true"
                                                />

                                                <select
                                                    id="experience"
                                                    name="experience"
                                                    value={
                                                        form.experience
                                                    }
                                                    onChange={(event) =>
                                                        updateField(
                                                            "experience",
                                                            event.target.value
                                                        )
                                                    }
                                                    className={
                                                        errors.experience
                                                            ? "error"
                                                            : ""
                                                    }
                                                >
                                                    <option value="">
                                                        Select experience
                                                    </option>

                                                    <option value="less_than_1">
                                                        Less than 1 year
                                                    </option>

                                                    <option value="1_2">
                                                        1–2 years
                                                    </option>

                                                    <option value="2_5">
                                                        2–5 years
                                                    </option>

                                                    <option value="5_10">
                                                        5–10 years
                                                    </option>

                                                    <option value="10_plus">
                                                        10+ years
                                                    </option>
                                                </select>

                                            </div>

                                            {renderError("experience")}

                                        </div>

                                        {/* PREVIOUS SCHOOL */}

                                        <div className="form-group full">

                                            <label htmlFor="previous_school">
                                                Most Recent School /
                                                Institution
                                            </label>

                                            <div className="input-wrapper">

                                                <i
                                                    className="fas fa-school"
                                                    aria-hidden="true"
                                                />

                                                <input
                                                    id="previous_school"
                                                    name="previous_school"
                                                    type="text"
                                                    placeholder="Name of your most recent school or institution"
                                                    value={
                                                        form.previous_school
                                                    }
                                                    onChange={(event) =>
                                                        updateField(
                                                            "previous_school",
                                                            event.target.value
                                                        )
                                                    }
                                                />

                                            </div>

                                        </div>

                                    </div>
                                </div>

                                {/* COVER LETTER */}

                                <div className="form-section">

                                    <div className="section-title">

                                        <span>
                                            02
                                        </span>

                                        <div>
                                            <strong>
                                                Cover Letter
                                            </strong>

                                            <small>
                                                Tell us why you would
                                                be a great fit for
                                                CCAST Bambili
                                            </small>
                                        </div>

                                    </div>

                                    <div className="form-group">

                                        <label htmlFor="cover_letter">
                                            Your Message

                                            <span className="required">
                                                *
                                            </span>
                                        </label>

                                        <div className="textarea-wrapper">

                                            <textarea
                                                id="cover_letter"
                                                name="cover_letter"
                                                rows="9"
                                                maxLength={
                                                    MAX_COVER_LETTER_LENGTH
                                                }
                                                placeholder="Tell us about your teaching philosophy, relevant experience, achievements, and why you would like to join CCAST Bambili..."
                                                value={
                                                    form.cover_letter
                                                }
                                                onChange={(event) =>
                                                    updateField(
                                                        "cover_letter",
                                                        event.target.value
                                                    )
                                                }
                                                className={
                                                    errors.cover_letter
                                                        ? "error"
                                                        : ""
                                                }
                                            />

                                            <div className="textarea-footer">

                                                <span>
                                                    Minimum{" "}
                                                    {
                                                        MIN_COVER_LETTER_LENGTH
                                                    }{" "}
                                                    characters
                                                </span>

                                                <strong
                                                    className={
                                                        form.cover_letter
                                                            .trim()
                                                            .length <
                                                        MIN_COVER_LETTER_LENGTH
                                                            ? "warning"
                                                            : "valid"
                                                    }
                                                >
                                                    {
                                                        form.cover_letter
                                                            .length
                                                    }
                                                    /
                                                    {
                                                        MAX_COVER_LETTER_LENGTH
                                                    }
                                                </strong>

                                            </div>

                                        </div>

                                        {renderError(
                                            "cover_letter"
                                        )}

                                    </div>
                                </div>

                                {/* ACTIONS */}

                                <div className="application-actions">

                                    <button
                                        type="button"
                                        className="application-btn secondary"
                                        onClick={previousStep}
                                    >
                                        <i
                                            className="fas fa-arrow-left"
                                            aria-hidden="true"
                                        />

                                        Back
                                    </button>

                                    <button
                                        type="button"
                                        className="application-btn primary"
                                        onClick={nextStep}
                                    >
                                        Continue

                                        <i
                                            className="fas fa-arrow-right"
                                            aria-hidden="true"
                                        />
                                    </button>

                                </div>

                            </div>
                        )}

                        {/* ==================================================
                            STEP 3 — DOCUMENTS
                        ================================================== */}

                        {step === 3 && (
                            <div className="application-card">

                                <div className="card-heading">

                                    <div className="card-heading-icon">
                                        <i
                                            className="fas fa-file-arrow-up"
                                            aria-hidden="true"
                                        />
                                    </div>

                                    <div>
                                        <span className="section-kicker">
                                            STEP 03
                                        </span>

                                        <h2>
                                            Documents & Submission
                                        </h2>

                                        <p>
                                            Upload the documents
                                            required to complete
                                            your application.
                                        </p>
                                    </div>

                                </div>

                                {/* SUBMISSION ERROR */}

                                {errors.submit && (
                                    <div
                                        className="submission-error"
                                        role="alert"
                                    >
                                        <i
                                            className="fas fa-triangle-exclamation"
                                            aria-hidden="true"
                                        />

                                        <span>
                                            {errors.submit}
                                        </span>
                                    </div>
                                )}

                                <div className="document-grid">

                                    {/* ==================================================
                                        CV
                                    ================================================== */}

                                    <div
                                        className={`
                                            document-upload
                                            ${
                                                errors.cv
                                                    ? "has-error"
                                                    : ""
                                            }
                                            ${
                                                form.cv
                                                    ? "has-file"
                                                    : ""
                                            }
                                        `.trim()}
                                    >

                                        <div className="document-icon">
                                            <i
                                                className="fas fa-file-pdf"
                                                aria-hidden="true"
                                            />
                                        </div>

                                        <span className="document-number">
                                            01
                                        </span>

                                        <h3>
                                            Curriculum Vitae

                                            <span className="required">
                                                *
                                            </span>
                                        </h3>

                                        <p>
                                            Your most recent CV or
                                            resume.
                                        </p>

                                        <input
                                            ref={cvInputRef}
                                            type="file"
                                            accept={
                                                FILE_RULES.cv
                                                    .extensions
                                            }
                                            onChange={(event) =>
                                                handleFileChange(
                                                    "cv",
                                                    event.target.files
                                                )
                                            }
                                            hidden
                                        />

                                        <button
                                            type="button"
                                            className="document-btn"
                                            onClick={() =>
                                                cvInputRef.current?.click()
                                            }
                                        >
                                            <i
                                                className="fas fa-upload"
                                                aria-hidden="true"
                                            />

                                            {form.cv
                                                ? "Replace File"
                                                : "Choose File"}
                                        </button>

                                        {form.cv && (
                                            <div className="document-selected">

                                                <i
                                                    className={`fas ${getFileIcon(
                                                        form.cv
                                                    )}`}
                                                    aria-hidden="true"
                                                />

                                                <div>
                                                    <strong>
                                                        {
                                                            form.cv
                                                                .name
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            formatFileSize(
                                                                form.cv
                                                                    .size
                                                            )
                                                        }
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    className="document-remove"
                                                    onClick={() =>
                                                        removeFile(
                                                            "cv",
                                                            cvInputRef
                                                        )
                                                    }
                                                    aria-label="Remove CV"
                                                >
                                                    <i
                                                        className="fas fa-trash"
                                                        aria-hidden="true"
                                                    />
                                                </button>

                                            </div>
                                        )}

                                        {!form.cv && (
                                            <span className="document-hint">
                                                PDF, DOC or DOCX ·
                                                Max 5MB
                                            </span>
                                        )}

                                        {renderError("cv")}

                                    </div>

                                    {/* ==================================================
                                        CERTIFICATES
                                    ================================================== */}

                                    <div
                                        className={`
                                            document-upload
                                            ${
                                                errors.certificates
                                                    ? "has-error"
                                                    : ""
                                            }
                                            ${
                                                form.certificates
                                                    .length
                                                    ? "has-file"
                                                    : ""
                                            }
                                        `.trim()}
                                    >

                                        <div className="document-icon">
                                            <i
                                                className="fas fa-certificate"
                                                aria-hidden="true"
                                            />
                                        </div>

                                        <span className="document-number">
                                            02
                                        </span>

                                        <h3>
                                            Certificates

                                            <span className="required">
                                                *
                                            </span>
                                        </h3>

                                        <p>
                                            Academic and professional
                                            certificates.
                                        </p>

                                        <input
                                            ref={
                                                certificateInputRef
                                            }
                                            type="file"
                                            multiple
                                            accept={
                                                FILE_RULES
                                                    .certificates
                                                    .extensions
                                            }
                                            onChange={(event) =>
                                                handleMultipleFiles(
                                                    "certificates",
                                                    event.target.files
                                                )
                                            }
                                            hidden
                                        />

                                        <button
                                            type="button"
                                            className="document-btn"
                                            onClick={() =>
                                                certificateInputRef.current?.click()
                                            }
                                        >
                                            <i
                                                className="fas fa-cloud-arrow-up"
                                                aria-hidden="true"
                                            />

                                            {form.certificates.length
                                                ? "Replace Files"
                                                : "Choose Files"}
                                        </button>

                                        {form.certificates.length >
                                            0 && (
                                            <div className="document-selected">

                                                <i
                                                    className="fas fa-layer-group"
                                                    aria-hidden="true"
                                                />

                                                <div>
                                                    <strong>
                                                        {
                                                            form
                                                                .certificates
                                                                .length
                                                        }{" "}
                                                        file
                                                        {
                                                            form
                                                                .certificates
                                                                .length >
                                                            1
                                                                ? "s"
                                                                : ""
                                                        }{" "}
                                                        selected
                                                    </strong>

                                                    <span>
                                                        Certificates
                                                        ready for upload
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    className="document-remove"
                                                    onClick={
                                                        removeCertificates
                                                    }
                                                    aria-label="Remove certificates"
                                                >
                                                    <i
                                                        className="fas fa-trash"
                                                        aria-hidden="true"
                                                    />
                                                </button>

                                            </div>
                                        )}

                                        {!form.certificates.length && (
                                            <span className="document-hint">
                                                PDF, JPG or PNG ·
                                                Max 5MB each · Up to{" "}
                                                {MAX_CERTIFICATES}{" "}
                                                files
                                            </span>
                                        )}

                                        {renderError(
                                            "certificates"
                                        )}

                                    </div>

                                    {/* ==================================================
                                        ID DOCUMENT
                                    ================================================== */}

                                    <div
                                        className={`
                                            document-upload
                                            ${
                                                errors.id_document
                                                    ? "has-error"
                                                    : ""
                                            }
                                            ${
                                                form.id_document
                                                    ? "has-file"
                                                    : ""
                                            }
                                        `.trim()}
                                    >

                                        <div className="document-icon">
                                            <i
                                                className="fas fa-id-card"
                                                aria-hidden="true"
                                            />
                                        </div>

                                        <span className="document-number">
                                            03
                                        </span>

                                        <h3>
                                            ID Document

                                            <span className="required">
                                                *
                                            </span>
                                        </h3>

                                        <p>
                                            National ID card or
                                            passport.
                                        </p>

                                        <input
                                            ref={idInputRef}
                                            type="file"
                                            accept={
                                                FILE_RULES
                                                    .id_document
                                                    .extensions
                                            }
                                            onChange={(event) =>
                                                handleFileChange(
                                                    "id_document",
                                                    event.target.files
                                                )
                                            }
                                            hidden
                                        />

                                        <button
                                            type="button"
                                            className="document-btn"
                                            onClick={() =>
                                                idInputRef.current?.click()
                                            }
                                        >
                                            <i
                                                className="fas fa-upload"
                                                aria-hidden="true"
                                            />

                                            {form.id_document
                                                ? "Replace File"
                                                : "Choose File"}
                                        </button>

                                        {form.id_document && (
                                            <div className="document-selected">

                                                <i
                                                    className={`fas ${getFileIcon(
                                                        form.id_document
                                                    )}`}
                                                    aria-hidden="true"
                                                />

                                                <div>
                                                    <strong>
                                                        {
                                                            form
                                                                .id_document
                                                                .name
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            formatFileSize(
                                                                form
                                                                    .id_document
                                                                    .size
                                                            )
                                                        }
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    className="document-remove"
                                                    onClick={() =>
                                                        removeFile(
                                                            "id_document",
                                                            idInputRef
                                                        )
                                                    }
                                                    aria-label="Remove identification document"
                                                >
                                                    <i
                                                        className="fas fa-trash"
                                                        aria-hidden="true"
                                                    />
                                                </button>

                                            </div>
                                        )}

                                        {!form.id_document && (
                                            <span className="document-hint">
                                                PDF, JPG or PNG ·
                                                Max 5MB
                                            </span>
                                        )}

                                        {renderError(
                                            "id_document"
                                        )}

                                    </div>

                                </div>

                                {/* ==================================================
                                    SECURITY NOTICE
                                ================================================== */}

                                <div className="document-security">

                                    <div>
                                        <i
                                            className="fas fa-shield-halved"
                                            aria-hidden="true"
                                        />
                                    </div>

                                    <section>
                                        <strong>
                                            Your documents are protected
                                        </strong>

                                        <p>
                                            Uploaded documents are
                                            handled securely and used
                                            strictly for recruitment
                                            and verification purposes.
                                        </p>
                                    </section>

                                </div>

                                {/* ==================================================
                                    CONSENT
                                ================================================== */}

                                <div
                                    className={`
                                        application-consent
                                        ${
                                            errors.consent
                                                ? "has-error"
                                                : ""
                                        }
                                    `.trim()}
                                >

                                    <label>

                                        <input
                                            type="checkbox"
                                            checked={form.consent}
                                            onChange={(event) =>
                                                updateField(
                                                    "consent",
                                                    event.target
                                                        .checked
                                                )
                                            }
                                        />

                                        <span className="custom-check">
                                            <i
                                                className="fas fa-check"
                                                aria-hidden="true"
                                            />
                                        </span>

                                        <span className="consent-text">
                                            I confirm that all
                                            information and documents
                                            provided in this
                                            application are accurate
                                            and complete. I understand
                                            that CCAST Bambili may
                                            verify the information
                                            submitted and may contact
                                            me during the recruitment
                                            process.
                                        </span>

                                    </label>

                                    {renderError("consent")}

                                </div>

                                {/* ==================================================
                                    ACTIONS
                                ================================================== */}

                                <div className="application-actions">

                                    <button
                                        type="button"
                                        className="application-btn secondary"
                                        onClick={previousStep}
                                        disabled={isSubmitting}
                                    >
                                        <i
                                            className="fas fa-arrow-left"
                                            aria-hidden="true"
                                        />

                                        Back
                                    </button>

                                    <button
                                        type="submit"
                                        className="application-btn submit"
                                        disabled={isSubmitting}
                                        aria-busy={
                                            isSubmitting
                                        }
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span
                                                    className="application-spinner"
                                                    aria-hidden="true"
                                                />

                                                Submitting
                                                Application...
                                            </>
                                        ) : (
                                            <>
                                                <i
                                                    className="fas fa-paper-plane"
                                                    aria-hidden="true"
                                                />

                                                Submit Application
                                            </>
                                        )}
                                    </button>

                                </div>

                            </div>
                        )}

                    </form>

                    {/* ==================================================
                        FOOTER SECURITY NOTE
                    ================================================== */}

                    <div className="application-footer-note">

                        <i
                            className="fas fa-lock"
                            aria-hidden="true"
                        />

                        <span>
                            Secure recruitment portal · CCAST
                            Bambili
                        </span>

                    </div>

                </div>
            </section>
        </main>
    );
};

export default TeacherApplicationPage;