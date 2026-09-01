// src/pages/home/Home.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  subscribeNewsletter,
  useAnnouncements,
  useIsAdmissionOpen,
  usePosts,
} from "../../api/public";

import SiteNavbar from "../../components/site/SiteNavbar";
import SiteFooter from "../../components/site/SiteFooter";
import HeroCarousel from "../../components/home/HeroCarousel";
import GceResultsCarousel from "../../components/home/GceResultsCarousel";
import CareersBanner from "../../components/home/CareersBanner";

import useRevealOnScroll from "../../hooks/useRevealOnScroll";

import AdmissionOpen from "../../assets/images/admission/admission.png";

import "../../styles/site.css";
import "./Home.css";

/* ============================================================
   CONFIGURATION
============================================================ */

const VIDEO_EMBED_URL =
  "https://www.youtube.com/embed/aqz-KE-bpKQ?autoplay=1&rel=0";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const BACKEND_URL = API_URL.replace(/\/api\/?$/, "");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_ADMISSION_YEAR = "2026/2027";

const DEFAULT_ADMISSION_MESSAGE =
  "Applications are now open. Apply today to join CCAST Bambili.";

const DEFAULT_VIDEO_IMAGE =
  "https://picsum.photos/seed/ccast-campus-life/1600/720.jpg";

/* ============================================================
   ADMISSION REQUIREMENTS
============================================================ */

const STUDENT_REQUIREMENTS = [
  "First name and last name",
  "Date of birth",
  "Gender",
  "Place of birth",
  "Nationality",
  "Class applying for",
  "Student phone number (optional)",
  "Student email address (optional)",
];

const GUARDIAN_REQUIREMENTS = [
  "Father's full name",
  "Father's phone number",
  "Father's email (optional)",
  "Father's residential address",
  "Mother's full name",
  "Mother's phone number",
  "Mother's email (optional)",
  "Mother's residential address",
  "Guardian's full name",
  "Guardian's relationship to student",
  "Guardian's phone number",
  "Guardian's email address",
  "Guardian's residential address (optional)",
];

const EMERGENCY_REQUIREMENTS = [
  "Emergency contact full name",
  "Relationship to student",
  "Emergency contact phone number",
];

const EDUCATION_REQUIREMENTS = [
  "Previous school name",
  "Last class / grade attended",
  "Year completed (if applicable)",
  "Reason for leaving previous school (optional)",
  "Academic achievements (optional)",
];

const REQUIRED_DOCUMENTS = [
  {
    icon: "fa-file-shield",
    title: "Birth Certificate",
    description: "Government-issued scanned copy",
  },
  {
    icon: "fa-file-lines",
    title: "Previous Report Card",
    description: "Most recent academic report card",
  },
  {
    icon: "fa-image",
    title: "Student's Photo",
    description: "Recent passport-style photograph",
  },
  {
    icon: "fa-id-badge",
    title: "Parent's ID",
    description: "National ID card of parent",
  },
];

const OPTIONAL_DOCUMENTS = [
  {
    icon: "fa-camera",
    title: "Passport Photograph",
    description: "White background, colour photo",
  },
  {
    icon: "fa-image",
    title: "Guardian's Photo",
    description: "Recent passport-style photo",
  },
  {
    icon: "fa-notes-medical",
    title: "Medical Report",
    description: "Medical or health record",
  },
  {
    icon: "fa-certificate",
    title: "Previous School Certificate",
    description: "Certificate from previous institution",
  },
  {
    icon: "fa-right-left",
    title: "Transfer Certificate",
    description: "Required if transferring mid-year",
  },
  {
    icon: "fa-id-card",
    title: "Half Card",
    description: "Previous school half card, if applicable",
  },
  {
    icon: "fa-id-badge",
    title: "Guardian's ID",
    description: "National ID card of guardian",
  },
  {
    icon: "fa-paperclip",
    title: "Other Supporting Document",
    description: "Any other relevant document",
  },
];

/* ============================================================
   IMAGE HELPERS
============================================================ */

const generateSVGPlaceholder = (
  title = "CCAST Bambili",
  width = 800,
  height = 500,
  subtitle = "No image available"
) => {
  const safeTitle = String(title || "CCAST Bambili");

  const shortTitle =
    safeTitle.length > 26
      ? `${safeTitle.substring(0, 26)}...`
      : safeTitle;

  const safeSubtitle = String(
    subtitle || "No image available"
  );

  return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%231e3a5f;stop-opacity:1"/%3E%3Cstop offset="100%25" style="stop-color:%232a4a7f;stop-opacity:1"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="${width}" height="${height}" fill="url(%23g)"/%3E%3Crect x="${width * 0.05}" y="${height * 0.05}" width="${width * 0.9}" height="${height * 0.9}" rx="18" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2"/%3E%3Ccircle cx="${width / 2}" cy="${height * 0.32}" r="${Math.min(
    width,
    height
  ) * 0.08}" fill="rgba(255,255,255,0.08)"/%3E%3Ctext x="${width / 2}" y="${height / 2}" font-family="Arial,sans-serif" font-size="${Math.min(
    width,
    height
  ) * 0.06}" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="central"%3E${encodeURIComponent(
    shortTitle
  )}%3C/text%3E%3Ctext x="${width / 2}" y="${height / 2 + Math.min(width, height) * 0.09
    }" font-family="Arial,sans-serif" font-size="${Math.min(
      width,
      height
    ) * 0.025}" fill="rgba(255,255,255,0.55)" text-anchor="middle" dominant-baseline="central"%3E${encodeURIComponent(
      safeSubtitle
    )}%3C/text%3E%3C/svg%3E`;
};

const getImageUrl = (
  image,
  title = "Content"
) => {
  if (
    !image ||
    typeof image !== "string" ||
    !image.trim()
  ) {
    return generateSVGPlaceholder(title);
  }

  const normalizedImage = image.trim();

  if (
    normalizedImage.startsWith("http://") ||
    normalizedImage.startsWith("https://") ||
    normalizedImage.startsWith("data:")
  ) {
    return normalizedImage;
  }

  if (normalizedImage.startsWith("/storage/")) {
    return `${BACKEND_URL}${normalizedImage}`;
  }

  if (normalizedImage.startsWith("storage/")) {
    return `${BACKEND_URL}/${normalizedImage}`;
  }

  return `${BACKEND_URL}/storage/${normalizedImage.replace(
    /^\/+/,
    ""
  )}`;
};

/* ============================================================
   DATA HELPERS
============================================================ */

const formatDate = (
  date,
  fallback = "Recent"
) => {
  if (!date) {
    return fallback;
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed.toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
};

const truncateText = (
  text,
  length = 120
) => {
  if (!text) {
    return "";
  }

  const normalized = String(text).trim();

  if (normalized.length <= length) {
    return normalized;
  }

  return `${normalized
    .substring(0, length)
    .trim()}...`;
};

const getAnnouncementId = (
  announcement
) =>
  announcement?.id ||
  announcement?.slug;

const getPostId = (post) =>
  post?.id || post?.slug;

/* ============================================================
   LOADING SPINNER
============================================================ */

const LoadingSpinner = ({
  size = "md",
  label = "Loading...",
  className = "",
}) => {
  return (
    <div
      className={`hp-loading-state hp-loading-state--${size} ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <span
        className="hp-loading-spinner"
        aria-hidden="true"
      />

      <span className="hp-loading-label">
        {label}
      </span>
    </div>
  );
};

/* ============================================================
   SECTION LOADING
============================================================ */

const SectionLoading = ({
  label = "Loading content...",
}) => {
  return (
    <div
      className="hp-section-loading"
      aria-busy="true"
    >
      <LoadingSpinner label={label} />
    </div>
  );
};

/* ============================================================
   EMPTY STATE
============================================================ */

const EmptyState = ({
  icon = "fas fa-inbox",
  title = "Nothing available",
  message =
  "There is no content available at the moment.",
}) => {
  return (
    <div className="hp-empty-state">
      <div
        className="hp-empty-icon"
        aria-hidden="true"
      >
        <i className={icon} />
      </div>

      <h3>{title}</h3>

      <p>{message}</p>
    </div>
  );
};

/* ============================================================
   ERROR STATE
============================================================ */

const ErrorState = ({
  icon = "fas fa-triangle-exclamation",
  title = "Unable to load content",
  message = "We couldn't retrieve this information right now. Please try again later.",
}) => {
  return (
    <div
      className="hp-error-state"
      role="alert"
    >
      <div
        className="hp-error-icon"
        aria-hidden="true"
      >
        <i className={icon} />
      </div>

      <h3>{title}</h3>

      <p>{message}</p>
    </div>
  );
};

/* ============================================================
   REQUIREMENT ITEM
============================================================ */

const RequirementItem = ({
  children,
}) => {
  return (
    <div className="hp-adm2-requirement-item">
      <span className="hp-adm2-check">
        <i
          className="fas fa-check"
          aria-hidden="true"
        />
      </span>

      <span>{children}</span>
    </div>
  );
};

/* ============================================================
   REQUIREMENT SECTION
============================================================ */

const RequirementSection = ({
  number,
  title,
  description,
  children,
}) => {
  return (
    <section className="hp-adm2-requirement-section">
      <div className="hp-adm2-requirement-title">
        <span className="hp-adm2-requirement-number">
          {number}
        </span>

        <div>
          <h3>{title}</h3>

          <p>{description}</p>
        </div>
      </div>

      {children}
    </section>
  );
};

/* ============================================================
   DOCUMENT CARD
============================================================ */

const DocumentCard = ({
  document,
  type = "required",
}) => {
  const isRequired =
    type === "required";

  return (
    <div
      className={`hp-adm2-document-card ${isRequired
          ? "required"
          : "optional"
        }`}
    >
      <div className="hp-adm2-document-icon">
        <i
          className={`fas ${document.icon}`}
          aria-hidden="true"
        />
      </div>

      <div className="hp-adm2-document-info">
        <strong>{document.title}</strong>

        <span>
          {document.description}
        </span>
      </div>

      <span
        className={
          isRequired
            ? "hp-adm2-required-badge"
            : "hp-adm2-optional-badge"
        }
      >
        {isRequired
          ? "Required"
          : "Optional"}
      </span>
    </div>
  );
};

/* ============================================================
   ADMISSION REQUIREMENTS MODAL
============================================================ */

const AdmissionRequirementsModal = ({
  open,
  onClose,
  onApply,
}) => {
  const modalRef = useRef(null);
  const closeButtonRef =
    useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleKeyDown = (
      event
    ) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab") {
        const modal =
          modalRef.current;

        if (!modal) {
          return;
        }

        const focusable = modal.querySelectorAll(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (!focusable.length) {
          return;
        }

        const first =
          focusable[0];

        const last =
          focusable[
          focusable.length - 1
          ];

        if (
          event.shiftKey &&
          document.activeElement ===
          first
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement ===
          last
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="hp-adm2-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="hp-adm2-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hp-adm2-modal-title"
        aria-describedby="hp-adm2-modal-description"
      >
        {/* ==================================================
            MODAL HEADER
        ================================================== */}

        <div className="hp-adm2-modal-header">
          <div className="hp-adm2-modal-heading">
            <div
              className="hp-adm2-modal-icon"
              aria-hidden="true"
            >
              <i className="fas fa-clipboard-check" />
            </div>

            <div>
              <span className="hp-adm2-modal-eyebrow">
                CCAST Bambili Admissions
              </span>

              <h2 id="hp-adm2-modal-title">
                Application Requirements
              </h2>

              <p id="hp-adm2-modal-description">
                Everything you need to
                prepare before starting
                your admission application.
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="hp-adm2-modal-close"
            onClick={onClose}
            aria-label="Close admission requirements"
          >
            <i
              className="fas fa-xmark"
              aria-hidden="true"
            />
          </button>
        </div>

        {/* ==================================================
            MODAL BODY
        ================================================== */}

        <div className="hp-adm2-modal-body">
          {/* INTRO */}

          <div className="hp-adm2-requirements-notice">
            <div
              className="hp-adm2-requirements-notice-icon"
              aria-hidden="true"
            >
              <i className="fas fa-circle-info" />
            </div>

            <div>
              <strong>
                Before you begin
              </strong>

              <p>
                Please make sure you have
                the required information
                and documents ready. This
                will make the application
                process faster and easier.
              </p>
            </div>
          </div>

          {/* ==================================================
              01 — STUDENT INFORMATION
          ================================================== */}

          <RequirementSection
            number="01"
            title="Student Information"
            description="Personal details of the applicant"
          >
            <div className="hp-adm2-requirement-grid">
              {STUDENT_REQUIREMENTS.map(
                (item) => (
                  <RequirementItem
                    key={item}
                  >
                    {item}
                  </RequirementItem>
                )
              )}
            </div>
          </RequirementSection>

          {/* ==================================================
              02 — PARENT / GUARDIAN
          ================================================== */}

          <RequirementSection
            number="02"
            title="Parent & Guardian Information"
            description="Contact and identification information"
          >
            <div className="hp-adm2-requirement-grid">
              {GUARDIAN_REQUIREMENTS.map(
                (item) => (
                  <RequirementItem
                    key={item}
                  >
                    {item}
                  </RequirementItem>
                )
              )}
            </div>

            <div className="hp-adm2-requirement-highlight">
              <i
                className="fas fa-envelope"
                aria-hidden="true"
              />

              <div>
                <strong>
                  Guardian email is required
                </strong>

                <p>
                  The guardian's email
                  address is used for
                  application and account
                  communication.
                </p>
              </div>
            </div>
          </RequirementSection>

          {/* ==================================================
              03 — EMERGENCY CONTACT
          ================================================== */}

          <RequirementSection
            number="03"
            title="Emergency Contact"
            description="A person the school can contact in an emergency"
          >
            <div className="hp-adm2-requirement-grid">
              {EMERGENCY_REQUIREMENTS.map(
                (item) => (
                  <RequirementItem
                    key={item}
                  >
                    {item}
                  </RequirementItem>
                )
              )}
            </div>
          </RequirementSection>

          {/* ==================================================
              04 — EDUCATION HISTORY
          ================================================== */}

          <RequirementSection
            number="04"
            title="Education History"
            description="Information about the student's previous school"
          >
            <div className="hp-adm2-requirement-grid">
              {EDUCATION_REQUIREMENTS.map(
                (item) => (
                  <RequirementItem
                    key={item}
                  >
                    {item}
                  </RequirementItem>
                )
              )}
            </div>
          </RequirementSection>

          {/* ==================================================
              05 — REQUIRED DOCUMENTS
          ================================================== */}

          <RequirementSection
            number="05"
            title="Required Documents"
            description="These documents must be ready before submission"
          >
            <div className="hp-adm2-document-list">
              {REQUIRED_DOCUMENTS.map(
                (document) => (
                  <DocumentCard
                    key={document.title}
                    document={document}
                    type="required"
                  />
                )
              )}
            </div>
          </RequirementSection>

          {/* ==================================================
              06 — OPTIONAL DOCUMENTS
          ================================================== */}

          <RequirementSection
            number="06"
            title="Optional Supporting Documents"
            description="Provide these where applicable"
          >
            <div className="hp-adm2-document-list">
              {OPTIONAL_DOCUMENTS.map(
                (document) => (
                  <DocumentCard
                    key={document.title}
                    document={document}
                    type="optional"
                  />
                )
              )}
            </div>
          </RequirementSection>

          {/* ==================================================
              FILE RULES
          ================================================== */}

          <div className="hp-adm2-file-rules">
            <div className="hp-adm2-file-rules-header">
              <div
                className="hp-adm2-file-rules-icon"
                aria-hidden="true"
              >
                <i className="fas fa-file-circle-check" />
              </div>

              <div>
                <h3>
                  Document Upload Rules
                </h3>

                <p>
                  Please check these
                  requirements before
                  uploading.
                </p>
              </div>
            </div>

            <div className="hp-adm2-file-rule-grid">
              <div className="hp-adm2-file-rule">
                <i
                  className="fas fa-images"
                  aria-hidden="true"
                />

                <div>
                  <strong>
                    Photos
                  </strong>

                  <span>
                    JPG, JPEG or PNG ·
                    Maximum 4MB
                  </span>
                </div>
              </div>

              <div className="hp-adm2-file-rule">
                <i
                  className="fas fa-file-pdf"
                  aria-hidden="true"
                />

                <div>
                  <strong>
                    ID Documents
                  </strong>

                  <span>
                    PDF, JPG, JPEG or
                    PNG · Maximum 5MB
                  </span>
                </div>
              </div>

              <div className="hp-adm2-file-rule">
                <i
                  className="fas fa-file-word"
                  aria-hidden="true"
                />

                <div>
                  <strong>
                    General Documents
                  </strong>

                  <span>
                    PDF, DOC, DOCX, JPG
                    or PNG · Maximum 5MB
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================
              FINAL DECLARATION
          ================================================== */}

          <div className="hp-adm2-declaration">
            <div
              className="hp-adm2-declaration-icon"
              aria-hidden="true"
            >
              <i className="fas fa-file-signature" />
            </div>

            <div>
              <strong>
                Final Declaration
              </strong>

              <p>
                Before submitting your
                application, you must
                confirm that all information
                provided is true and correct.
                False information may lead
                to disqualification or
                withdrawal of admission.
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================
            MODAL FOOTER
        ================================================== */}

        <div className="hp-adm2-modal-footer">
          <div className="hp-adm2-modal-footer-note">
            <i
              className="fas fa-circle-info"
              aria-hidden="true"
            />

            <span>
              Have your documents ready
              before starting.
            </span>
          </div>

          <div className="hp-adm2-modal-actions">
            <button
              type="button"
              className="hp-adm2-modal-cancel"
              onClick={onClose}
            >
              Close
            </button>

            <button
              type="button"
              className="hp-adm2-modal-apply"
              onClick={onApply}
            >
              <span>
                Start Application
              </span>

              <i
                className="fas fa-arrow-right"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   HOME PAGE
============================================================ */

const Home = () => {
  const navigate = useNavigate();

  useRevealOnScroll();

  /* ==========================================================
     REFS
  ========================================================== */

  const videoCloseButtonRef =
    useRef(null);

  /* ==========================================================
     UI STATE
  ========================================================== */

  const [
    showRequirements,
    setShowRequirements,
  ] = useState(false);

  const [
    newsletterEmail,
    setNewsletterEmail,
  ] = useState("");

  const [
    newsletterSending,
    setNewsletterSending,
  ] = useState(false);

  const [
    newsletterSent,
    setNewsletterSent,
  ] = useState(false);

  const [
    newsletterError,
    setNewsletterError,
  ] = useState("");

  const [
    videoOpen,
    setVideoOpen,
  ] = useState(false);

  /* ==========================================================
     API DATA
  ========================================================== */

  const {
    isOpen: isAdmissionOpen,
    settings: admissionSettings,
    isLoading: admissionLoading,
  } = useIsAdmissionOpen();

  const {
    data: announcementsData,
    error: announcementsError,
    isLoading: announcementsLoading,
  } = useAnnouncements();

  const {
    data: postsData,
    isLoading: postsLoading,
    isError: postsIsError,
  } = usePosts();

  /* ==========================================================
     NORMALIZE API DATA
  ========================================================== */

  const announcements = useMemo(
    () =>
      Array.isArray(
        announcementsData
      )
        ? announcementsData
        : [],
    [announcementsData]
  );

  const posts = useMemo(
    () =>
      Array.isArray(postsData)
        ? postsData
        : [],
    [postsData]
  );

  /* ==========================================================
     FEATURED ANNOUNCEMENT
  ========================================================== */

  const featuredAnnouncement =
    useMemo(() => {
      if (!announcements.length) {
        return null;
      }

      return (
        announcements.find(
          (announcement) =>
            announcement?.pinned
        ) ||
        announcements[0]
      );
    }, [announcements]);

  /* ==========================================================
     MINI ANNOUNCEMENT CARDS
  ========================================================== */

  const miniCards = useMemo(() => {
    if (!announcements.length) {
      return [];
    }

    return announcements
      .filter(
        (announcement) =>
          !announcement?.pinned
      )
      .slice(0, 2);
  }, [announcements]);

  /* ==========================================================
     PRIORITY FEED
  ========================================================== */

  const priorityFeed = useMemo(() => {
    if (!announcements.length) {
      return [];
    }

    const pinned =
      announcements.filter(
        (announcement) =>
          announcement?.pinned
      );

    const unpinned =
      announcements.filter(
        (announcement) =>
          !announcement?.pinned
      );

    return [
      ...pinned,
      ...unpinned,
    ]
      .slice(0, 3)
      .map((announcement) => ({
        id: getAnnouncementId(
          announcement
        ),

        tone: announcement?.pinned
          ? "urgent"
          : "notice",

        label: announcement?.pinned
          ? "Pinned"
          : announcement?.category ||
          "Notice",

        title:
          announcement?.title ||
          "Untitled announcement",

        desc:
          announcement?.excerpt ||
          truncateText(
            announcement?.body,
            100
          ) ||
          "Read the announcement for more information.",

        slug: announcement?.slug,
      }));
  }, [announcements]);

  /* ==========================================================
     BLOG POSTS
  ========================================================== */

  const blogPosts = useMemo(() => {
    if (!posts.length) {
      return [];
    }

    return posts
      .slice(0, 3)
      .map((post) => ({
        id: getPostId(post),

        slug:
          post?.slug ||
          post?.id,

        category:
          post?.category ||
          "General",

        date: formatDate(
          post?.published_at
        ),

        title:
          post?.title ||
          "Untitled Post",

        excerpt:
          post?.excerpt ||
          truncateText(
            post?.body,
            120
          ) ||
          "Read more about this story.",

        img: getImageUrl(
          post?.cover_image ||
          post?.featured_image,
          post?.title ||
          "Blog Post"
        ),
      }));
  }, [posts]);

  /* ==========================================================
     NEWSLETTER
  ========================================================== */

  const handleNewsletterSubmit =
    useCallback(
      async (event) => {
        event.preventDefault();

        const email =
          newsletterEmail.trim();

        setNewsletterError("");

        if (!email) {
          const message =
            "Please enter your email address.";

          setNewsletterError(message);
          return;
        }

        if (!EMAIL_PATTERN.test(email)) {
          const message =
            "Please enter a valid email address.";

          setNewsletterError(message);
          return;
        }

        if (newsletterSending) {
          return;
        }

        setNewsletterSending(true);

        try {
          await subscribeNewsletter(
            email
          );

          setNewsletterSent(true);
          setNewsletterEmail("");

          toast.success(
            "You're subscribed! 🎉"
          );
        } catch (error) {
          const status =
            error?.response?.status;

          const apiMessage =
            error?.response?.data
              ?.message ||
            error?.message ||
            "Something went wrong. Please try again.";

          if (status === 422) {
            const validationMessage =
              error?.response?.data
                ?.errors?.email?.[0] ||
              "Please enter a valid email address.";

            setNewsletterError(
              validationMessage
            );

            toast.error(
              validationMessage
            );
          } else if (status === 409) {
            const message =
              "This email is already subscribed.";

            setNewsletterError(message);

            toast(message, {
              icon: "ℹ️",
            });
          } else {
            setNewsletterError(
              apiMessage
            );

            toast.error(
              apiMessage
            );
          }
        } finally {
          setNewsletterSending(false);
        }
      },
      [
        newsletterEmail,
        newsletterSending,
      ]
    );

  /* ==========================================================
     VIDEO CONTROLS
  ========================================================== */

  const handleVideoOpen =
    useCallback(() => {
      setVideoOpen(true);
    }, []);

  const handleVideoClose =
    useCallback(() => {
      setVideoOpen(false);
    }, []);

  /* ==========================================================
     VIDEO ACCESSIBILITY
  ========================================================== */

  useEffect(() => {
    if (!videoOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleKeyDown = (
      event
    ) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleVideoClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    requestAnimationFrame(() => {
      videoCloseButtonRef.current?.focus();
    });

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    videoOpen,
    handleVideoClose,
  ]);

  /* ==========================================================
     ADMISSION BANNER
  ========================================================== */

  const renderAdmissionBanner =
    useCallback(() => {
      if (admissionLoading) {
        return (
          <section
            className="hp-adm2 hp-adm2--loading"
            aria-busy="true"
          >
            <div className="container-xl">
              <div className="hp-adm2-card">
                <div className="hp-adm2-loading-content">
                  <LoadingSpinner
                    size="lg"
                    label="Checking admission status..."
                  />
                </div>
              </div>
            </div>
          </section>
        );
      }

      if (!isAdmissionOpen) {
        return null;
      }

      const bannerImage =
        admissionSettings?.banner_image
          ? getImageUrl(
            admissionSettings.banner_image,
            "Admissions Open"
          )
          : AdmissionOpen;

      const academicYear =
        admissionSettings?.academic_year ||
        DEFAULT_ADMISSION_YEAR;

      const openMessage =
        admissionSettings?.open_message ||
        DEFAULT_ADMISSION_MESSAGE;

      return (
        <section
          className="hp-adm2"
          aria-labelledby="hp-adm2-h"
        >
          <div className="container-xl">
            <div className="hp-adm2-card rv-t">
              {/* MEDIA */}

              <div className="hp-adm2-media">
                <img
                  src={bannerImage}
                  alt="CCAST Bambili students"
                  loading="lazy"
                  decoding="async"
                  onError={(event) => {
                    event.currentTarget.onerror =
                      null;

                    event.currentTarget.src =
                      AdmissionOpen;
                  }}
                />

                <div
                  className="hp-adm2-media-overlay"
                  aria-hidden="true"
                />

                <span className="hp-adm2-media-label">
                  CCAST Bambili
                </span>
              </div>

              {/* CONTENT */}

              <div className="hp-adm2-body">
                <span className="hp-adm2-status">
                  <span
                    className="hp-adm2-status-dot"
                    aria-hidden="true"
                  />

                  Admissions Open
                </span>

                <span className="hp-adm2-eyebrow">
                  {academicYear} academic
                  year
                </span>

                <h2
                  className="hp-adm2-h"
                  id="hp-adm2-h"
                >
                  Apply for Admission
                </h2>

                <p className="hp-adm2-sub">
                  Your next chapter starts
                  here.
                </p>

                <p className="hp-adm2-p">
                  {openMessage}
                </p>

                <div className="hp-adm2-actions">
                  <button
                    type="button"
                    className="hp-adm2-btn"
                    onClick={() =>
                      navigate(
                        "/admission"
                      )
                    }
                  >
                    <span>
                      Apply Now
                    </span>

                    <i
                      className="fas fa-arrow-right"
                      aria-hidden="true"
                    />
                  </button>

                  <button
                    type="button"
                    className="hp-adm2-secondary hp-adm2-requirements-btn"
                    onClick={() =>
                      setShowRequirements(
                        true
                      )
                    }
                    aria-haspopup="dialog"
                    aria-expanded={
                      showRequirements
                    }
                  >
                    <i
                      className="fas fa-clipboard-list"
                      aria-hidden="true"
                    />

                    <span>
                      View requirements
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }, [
      admissionLoading,
      admissionSettings,
      isAdmissionOpen,
      navigate,
      showRequirements,
    ]);

  /* ==========================================================
     FEATURED ANNOUNCEMENT
  ========================================================== */

  const renderFeaturedAnnouncement =
    useCallback(() => {
      if (announcementsLoading) {
        return (
          <div
            className="hp-feature hp-feature--loading"
            aria-busy="true"
          >
            <LoadingSpinner
              size="lg"
              label="Loading announcement..."
            />
          </div>
        );
      }

      if (announcementsError) {
        return (
          <div className="hp-feature hp-feature--state">
            <ErrorState
              icon="fas fa-bullhorn"
              title="Announcements unavailable"
              message="We couldn't load the latest announcements right now."
            />
          </div>
        );
      }

      if (!featuredAnnouncement) {
        return (
          <div className="hp-feature hp-feature--state">
            <EmptyState
              icon="fas fa-bullhorn"
              title="No announcements yet"
              message="There are no announcements to display at the moment."
            />
          </div>
        );
      }

      const featured =
        featuredAnnouncement;

      const slug =
        featured?.slug;

      if (!slug) {
        return (
          <div className="hp-feature hp-feature--state">
            <EmptyState
              icon="fas fa-file-circle-exclamation"
              title="Announcement unavailable"
              message="This announcement is missing its public link."
            />
          </div>
        );
      }

      return (
        <Link
          to={`/announcements/${slug}`}
          className="hp-feature"
          aria-label={`Read announcement: ${featured?.title ||
            "Announcement"
            }`}
        >
          <img
            src={getImageUrl(
              featured?.image,
              featured?.title ||
              "Announcement"
            )}
            alt={
              featured?.title ||
              "Announcement"
            }
            loading="lazy"
            decoding="async"
            onError={(event) => {
              event.currentTarget.onerror =
                null;

              event.currentTarget.src =
                generateSVGPlaceholder(
                  featured?.title ||
                  "Announcement"
                );
            }}
          />

          <div
            className="hp-feature-overlay"
            aria-hidden="true"
          />

          <div className="hp-feature-txt">
            <span className="hp-feature-tag">
              <i
                className={
                  featured?.pinned
                    ? "fas fa-thumbtack"
                    : "fas fa-bullhorn"
                }
                aria-hidden="true"
              />

              {featured?.pinned
                ? "Pinned"
                : featured?.category ||
                "Announcement"}
            </span>

            <div className="hp-feature-meta">
              {formatDate(
                featured?.published_at
              )}
            </div>

            <h3>
              {featured?.title ||
                "Untitled announcement"}
            </h3>

            <p>
              {featured?.excerpt ||
                truncateText(
                  featured?.body,
                  150
                ) ||
                "Read this announcement for more information."}
            </p>

            <span className="hp-feature-read">
              Read announcement

              <i
                className="fas fa-arrow-right"
                aria-hidden="true"
              />
            </span>
          </div>
        </Link>
      );
    }, [
      announcementsError,
      announcementsLoading,
      featuredAnnouncement,
    ]);

  /* ==========================================================
     MINI ANNOUNCEMENT CARDS
  ========================================================== */

  const renderMiniCards =
    useCallback(() => {
      if (announcementsLoading) {
        return (
          <>
            {[0, 1].map(
              (index) => (
                <div
                  className="col-md-6"
                  key={`mini-skeleton-${index}`}
                >
                  <div
                    className="hp-skeleton hp-skeleton--mini"
                    aria-hidden="true"
                  />
                </div>
              )
            )}
          </>
        );
      }

      if (
        announcementsError ||
        !miniCards.length
      ) {
        return null;
      }

      return miniCards.map(
        (item, index) => (
          <div
            className="col-md-6 rv-t"
            key={
              item?.id ||
              item?.slug ||
              index
            }
            style={{
              transitionDelay: `${index * 70
                }ms`,
            }}
          >
            <Link
              to={`/announcements/${item?.slug}`}
              className="hp-mini-card"
              aria-label={`Read announcement: ${item?.title ||
                "Announcement"
                }`}
            >
              <div className="hp-mini-card-top">
                <div className="hp-mini-date">
                  <i
                    className="fas fa-calendar-day"
                    aria-hidden="true"
                  />

                  {formatDate(
                    item?.published_at
                  )}
                </div>

                <span className="hp-mini-arrow">
                  <i
                    className="fas fa-arrow-up-right-from-square"
                    aria-hidden="true"
                  />
                </span>
              </div>

              <h4>
                {item?.title ||
                  "Untitled announcement"}
              </h4>

              <p>
                {item?.excerpt ||
                  truncateText(
                    item?.body,
                    100
                  ) ||
                  "Read more about this announcement."}
              </p>

              <span className="hp-mini-link">
                Read announcement

                <i
                  className="fas fa-arrow-right"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </div>
        )
      );
    }, [
      announcementsError,
      announcementsLoading,
      miniCards,
    ]);

  /* ==========================================================
     BLOG POSTS
  ========================================================== */

  const renderBlogPosts =
    useCallback(() => {
      if (postsLoading) {
        return (
          <div
            className="col-12"
            aria-busy="true"
          >
            <SectionLoading
              label="Loading latest stories..."
            />
          </div>
        );
      }

      if (postsIsError) {
        return (
          <div className="col-12">
            <ErrorState
              icon="fas fa-newspaper"
              title="Unable to load blog posts"
              message="The latest news and stories could not be loaded. Please try again later."
            />
          </div>
        );
      }

      if (!blogPosts.length) {
        return (
          <div className="col-12">
            <EmptyState
              icon="fas fa-newspaper"
              title="No stories available"
              message="There are no published stories available at the moment. Please check back soon."
            />
          </div>
        );
      }

      return blogPosts.map(
        (post, index) => (
          <div
            className="col-md-4 rv-t"
            key={
              post?.id ||
              post?.slug ||
              index
            }
            style={{
              transitionDelay: `${index * 80
                }ms`,
            }}
          >
            <Link
              to={`/blog/${post?.slug}`}
              className="hp-blog-card"
              aria-label={`Read blog post: ${post?.title ||
                "Blog post"
                }`}
            >
              <div className="hp-blog-img">
                <img
                  src={post?.img}
                  alt={
                    post?.title ||
                    "CCAST blog post"
                  }
                  loading={
                    index === 0
                      ? "eager"
                      : "lazy"
                  }
                  decoding="async"
                  onError={(event) => {
                    event.currentTarget.onerror =
                      null;

                    event.currentTarget.src =
                      generateSVGPlaceholder(
                        post?.title ||
                        "Blog Post"
                      );
                  }}
                />

                <span className="hp-blog-cat">
                  {post?.category}
                </span>

                <span className="hp-blog-overlay-arrow">
                  <i
                    className="fas fa-arrow-up-right-from-square"
                    aria-hidden="true"
                  />
                </span>
              </div>

              <div className="hp-blog-body">
                <div className="hp-blog-date">
                  <i
                    className="fas fa-calendar-day"
                    aria-hidden="true"
                  />

                  {post?.date}
                </div>

                <h3 className="hp-blog-title">
                  {post?.title}
                </h3>

                <p className="hp-blog-excerpt">
                  {post?.excerpt}
                </p>

                <span className="hp-blog-more">
                  Read more

                  <i
                    className="fas fa-arrow-right"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </Link>
          </div>
        )
      );
    }, [
      blogPosts,
      postsIsError,
      postsLoading,
    ]);

  /* ==========================================================
     PRIORITY FEED
  ========================================================== */

  const renderPriorityFeed =
    useCallback(() => {
      if (announcementsLoading) {
        return Array.from({
          length: 3,
        }).map((_, index) => (
          <div
            className="hp-skeleton hp-skeleton--priority"
            key={`priority-skeleton-${index}`}
            aria-hidden="true"
          />
        ));
      }

      if (announcementsError) {
        return (
          <ErrorState
            title="Priority feed unavailable"
            message="Latest alerts could not be loaded."
          />
        );
      }

      if (!priorityFeed.length) {
        return (
          <EmptyState
            icon="fas fa-circle-check"
            title="No priority alerts"
            message="There are currently no priority alerts."
          />
        );
      }

      return priorityFeed.map(
        (item) => (
          <article
            className={`hp-priority-item hp-priority-item--${item.tone}`}
            key={item.id}
          >
            <span
              className="hp-priority-dot"
              aria-hidden="true"
            />

            <div className="hp-priority-content">
              <div className="hp-priority-label">
                {item.label}
              </div>

              <div className="hp-priority-title">
                {item.slug ? (
                  <Link
                    to={`/announcements/${item.slug}`}
                  >
                    {item.title}
                  </Link>
                ) : (
                  item.title
                )}
              </div>

              <div className="hp-priority-desc">
                {item.desc}
              </div>
            </div>
          </article>
        )
      );
    }, [
      announcementsError,
      announcementsLoading,
      priorityFeed,
    ]);

  /* ==========================================================
     REQUIREMENTS HANDLERS
  ========================================================== */

  const handleOpenRequirements =
    useCallback(() => {
      setShowRequirements(true);
    }, []);

  const handleCloseRequirements =
    useCallback(() => {
      setShowRequirements(false);
    }, []);

  const handleStartApplication =
    useCallback(() => {
      setShowRequirements(false);
      navigate("/admission");
    }, [navigate]);

  /* ==========================================================
     MAIN RENDER
  ========================================================== */

  return (
    <div className="hp">
      {/* ========================================================
          NAVBAR
      ======================================================== */}

      <SiteNavbar />

      <main>
        {/* ======================================================
            HERO
        ====================================================== */}

        <HeroCarousel />

        {/* ======================================================
            ADMISSIONS
        ====================================================== */}

        {renderAdmissionBanner()}

        {/* ======================================================
            ADMISSION REQUIREMENTS MODAL
        ====================================================== */}

        <AdmissionRequirementsModal
          open={showRequirements}
          onClose={
            handleCloseRequirements
          }
          onApply={
            handleStartApplication
          }
        />

        {/* ======================================================
            GCE RESULTS
        ====================================================== */}

        <GceResultsCarousel />

        {/* ======================================================
            CAMPUS VIDEO TOUR
        ====================================================== */}

        <section
          className="hp-video my-3 rv-t hp-video--bg hp-video--scrim hp-video--pattern hp-video--inner container xl"
          aria-labelledby="hp-video-h"
        >
          <img
            className="hp-video-bg hp-video-bg--cover hp-video-bg--scrim hp-video-bg--pattern hp-video-bg--inner "
            src={DEFAULT_VIDEO_IMAGE}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
          />

          <div
            className="hp-video-scrim hp-video-scrim--cover hp-video-scrim--inner "
            aria-hidden="true"
          />

          <div
            className="hp-video-pattern hp-video-pattern--cover hp-video-pattern--inner "
            aria-hidden="true"
          />

          <div className="hp-video-inner container-xl rv-t hp-video-inner--scrim hp-video-inner--pattern hp-video-inner--inner ">
            <div className="hp-video-content rv-t hp-video-content--scrim hp-video-content--pattern hp-video-content--inner ">
              <span className="hp-tag hp-tag--light hp-tag--scrim hp-tag--pattern hp-tag--inner">
                <i
                  className="fas fa-location-dot me-1"
                  aria-hidden="true"
                />

                Discover CCAST
              </span>

              <h2
                className="hp-video-h hp-video-h--scrim hp-video-h--pattern hp-video-h--inner"
                id="hp-video-h"
              >
                Experience Campus Life
              </h2>

              <p className="hp-video-p">
                Step inside CCAST Bambili —
                explore our classrooms,
                laboratories, sports
                facilities and the vibrant
                everyday life of our
                students.
              </p>

              <div className="hp-video-actions">
                <button
                  type="button"
                  className="hp-video-play"
                  onClick={handleVideoOpen}
                  aria-label="Play the CCAST campus life video"
                >
                  <span className="hp-video-play-icon">
                    <i
                      className="fas fa-play"
                      aria-hidden="true"
                    />
                  </span>
                </button>

              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            CAREERS
        ====================================================== */}

        <CareersBanner />

        {/* ======================================================
            INTELLIGENCE & ALERTS
        ====================================================== */}

        <section
          className="hp-sec hp-alerts-section "
          aria-labelledby="hp-alerts-h"
        >
          <div className="container-xl">
            <header className="hp-alerts-hd rv-t">
              <div className="hp-section-heading">
                <span className="hp-tag">
                  <i
                    className="fas fa-satellite-dish me-1"
                    aria-hidden="true"
                  />

                  Stay informed
                </span>

                <h2
                  className="hp-h2"
                  id="hp-alerts-h"
                >
                  Intelligence &amp; Alerts
                </h2>

                <p className="hp-section-intro">
                  Stay up to date with the
                  latest announcements,
                  notices and important
                  information from CCAST.
                </p>
              </div>

              <Link
                to="/announcements"
                className="hp-alerts-all"
              >
                <span>
                  All Announcements
                </span>

                <i
                  className="fas fa-arrow-right"
                  aria-hidden="true"
                />
              </Link>
            </header>

            <div className="row g-4">
              {/* ==================================================
                  FEATURED ANNOUNCEMENT
              ================================================== */}

              <div className="col-lg-8 rv-t hp-alerts-featured" style={{ transitionDelay: "40ms" }}>
                {renderFeaturedAnnouncement()}

                <div className="row g-3 py-5 hp-alerts-mini-cards">
                  {renderMiniCards()}
                </div>
              </div>

              {/* ==================================================
                  SIDEBAR
              ================================================== */}

              <div className="col-lg-4 d-flex flex-column gap-4">
                {/* PRIORITY FEED */}

                <aside
                  className="hp-priority rv-t"
                  style={{
                    transitionDelay:
                      "80ms",
                  }}
                  aria-labelledby="priority-feed-title"
                >
                  <div className="hp-priority-top">
                    <div className="hp-priority-title-wrap">
                      <span
                        className="hp-priority-icon"
                        aria-hidden="true"
                      >
                        <i className="fas fa-bolt" />
                      </span>

                      <div>
                        <span className="hp-priority-eyebrow">
                          Important updates
                        </span>

                        <h3
                          className="hp-priority-h"
                          id="priority-feed-title"
                        >
                          Priority Feed
                        </h3>
                      </div>
                    </div>

                    <span className="hp-priority-live">
                      <span aria-hidden="true" />
                      Live
                    </span>
                  </div>

                  <div className="hp-priority-divider" />

                  <div className="hp-priority-list">
                    {renderPriorityFeed()}
                  </div>

                  <div className="hp-priority-footer">
                    <Link
                      to="/announcements"
                      className="hp-btn-light-block"
                      aria-label="View all announcements and alerts"
                    >
                      <span>
                        View All Alerts
                      </span>

                      <i
                        className="fas fa-arrow-right"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </aside>

                {/* NEWSLETTER */}

                <aside
                  className={`hp-subscribe rv-t ${newsletterSent
                      ? "hp-subscribe--success"
                      : ""
                    }`}
                  style={{
                    transitionDelay:
                      "160ms",
                  }}
                  aria-labelledby="newsletter-title"
                >
                  {newsletterSent ? (
                    <div className="hp-subscribe-success">
                      <div
                        className="hp-subscribe-success-icon"
                        aria-hidden="true"
                      >
                        <i className="fas fa-check" />
                      </div>

                      <span className="hp-subscribe-eyebrow">
                        Subscription confirmed
                      </span>

                      <h4 id="newsletter-title">
                        You're Subscribed!
                      </h4>

                      <p>
                        Welcome aboard. Keep
                        an eye on your inbox
                        for CCAST news,
                        announcements and
                        important updates.
                      </p>

                      <div className="hp-subscribe-success-badge">
                        <i
                          className="fas fa-circle-check"
                          aria-hidden="true"
                        />

                        You're on the list
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="hp-subscribe-head">
                        <div
                          className="hp-subscribe-icon"
                          aria-hidden="true"
                        >
                          <i className="fas fa-envelope-open-text" />
                        </div>

                        <span className="hp-subscribe-eyebrow">
                          Stay connected
                        </span>

                        <h4 id="newsletter-title">
                          Subscribe to CCAST News
                        </h4>

                        <p>
                          Receive
                          institutional
                          briefings, school
                          news and important
                          announcements
                          directly in your
                          inbox.
                        </p>
                      </div>

                      <form
                        onSubmit={
                          handleNewsletterSubmit
                        }
                        className="hp-subscribe-form"
                        noValidate
                      >
                        <label
                          htmlFor="hp-home-nl-email"
                          className="visually-hidden"
                        >
                          Email address
                        </label>

                        <div
                          className={`hp-subscribe-input-wrap ${newsletterError
                              ? "hp-subscribe-input-wrap--error"
                              : ""
                            }`}
                        >
                          <i
                            className="fas fa-envelope"
                            aria-hidden="true"
                          />

                          <input
                            id="hp-home-nl-email"
                            type="email"
                            placeholder="Your email address"
                            value={
                              newsletterEmail
                            }
                            onChange={(
                              event
                            ) => {
                              setNewsletterEmail(
                                event
                                  .target
                                  .value
                              );

                              if (
                                newsletterError
                              ) {
                                setNewsletterError(
                                  ""
                                );
                              }
                            }}
                            aria-invalid={
                              newsletterError
                                ? "true"
                                : "false"
                            }
                            aria-describedby={
                              newsletterError
                                ? "hp-home-nl-err"
                                : undefined
                            }
                            disabled={
                              newsletterSending
                            }
                            autoComplete="email"
                            inputMode="email"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={
                            newsletterSending
                          }
                          aria-busy={
                            newsletterSending
                          }
                          className="hp-subscribe-submit"
                        >
                          {newsletterSending ? (
                            <>
                              <span
                                className="hp-button-spinner"
                                aria-hidden="true"
                              />

                              <span>
                                Subscribing...
                              </span>
                            </>
                          ) : (
                            <>
                              <span>
                                Subscribe
                              </span>

                              <i
                                className="fas fa-arrow-right"
                                aria-hidden="true"
                              />
                            </>
                          )}
                        </button>
                      </form>

                      {newsletterError && (
                        <div
                          className="hp-subscribe-err"
                          id="hp-home-nl-err"
                          role="alert"
                        >
                          <i
                            className="fas fa-circle-exclamation"
                            aria-hidden="true"
                          />

                          <span>
                            {
                              newsletterError
                            }
                          </span>
                        </div>
                      )}

                      <div className="hp-subscribe-note">
                        <i
                          className="fas fa-shield-halved"
                          aria-hidden="true"
                        />

                        <span>
                          No spam. Only
                          important CCAST
                          updates.
                        </span>
                      </div>
                    </>
                  )}
                </aside>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            BLOG / NEWS & STORIES
        ====================================================== */}

        <section
          className="hp-sec hp-sec-alt hp-blog-section mt-0 rv-t hp-blog-section--bg hp-blog-section--scrim hp-blog-section--pattern hp-blog-section--inner"
          aria-labelledby="hp-blog-h"
          aria-busy={postsLoading}
        >
          <div className="container-xl">
            <header className="hp-alerts-hd rv-t">
              <div className="hp-section-heading">
                <span className="hp-tag">
                  <i
                    className="fas fa-pen-nib me-1"
                    aria-hidden="true"
                  />

                  From the Blog
                </span>

                <h2
                  className="hp-h2"
                  id="hp-blog-h"
                >
                  News &amp; Stories
                </h2>

                <p className="hp-section-intro">
                  Explore stories, events,
                  achievements and moments
                  from the CCAST community.
                </p>
              </div>

              <Link
                to="/blog"
                className="hp-alerts-all"
              >
                <span>
                  Visit the Blog
                </span>

                <i
                  className="fas fa-arrow-right"
                  aria-hidden="true"
                />
              </Link>
            </header>

            <div className="row g-4">
              {renderBlogPosts()}
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================
          FOOTER
      ======================================================== */}

      <SiteFooter />

      {/* ========================================================
          CAMPUS VIDEO MODAL
      ======================================================== */}

      {videoOpen && (
        <div
          className="hp-video-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hp-video-modal-title"
          onClick={handleVideoClose}
        >
          <button
            ref={videoCloseButtonRef}
            type="button"
            className="hp-video-close"
            aria-label="Close campus video"
            onClick={handleVideoClose}
          >
            <i
              className="fas fa-xmark"
              aria-hidden="true"
            />
          </button>

          <div
            className="hp-video-frame"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div
              className="visually-hidden"
              id="hp-video-modal-title"
            >
              CCAST Bambili campus life
              video
            </div>

            <iframe
              src={VIDEO_EMBED_URL}
              title="CCAST Bambili campus life tour"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;