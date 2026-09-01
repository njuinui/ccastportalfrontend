import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import { getPortalConfig } from "../config/portals";

import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../api/notifications";

import Avatar from "./Avatar";

import { confirmAction } from "../lib/alerts";

import "./AppShell.css";

/* ============================================================
   ROLE LABELS
   ============================================================ */

const ROLE_LABEL = {
  "super-admin": "Super Admin",
  principal: "Principal",
  "vice-principal": "Vice Principal",
  bursar: "Bursar",
  librarian: "Librarian",
  "discipline-master": "Discipline Master",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
};

/* ============================================================
   FALLBACK NAVIGATION
   ============================================================ */

const FALLBACK_NAV = [
  {
    section: "Overview",
  },
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: "dashboard",
  },
];

/* ============================================================
   STATIC OPTIONS
   ============================================================ */

const LANGUAGES = [
  {
    code: "en",
    label: "English",
  },
  {
    code: "fr",
    label: "Français",
  },
];

const ACADEMIC_YEARS = [
  "2024/2025",
  "2025/2026",
  "2026/2027",
];

const TERMS = [
  "Term I",
  "Term II",
  "Term III",
];

/* ============================================================
   STORAGE KEYS
   ============================================================ */

const STORAGE_KEYS = {
  academicYear: "ccast_academic_year",
  currentTerm: "ccast_current_term",
  language: "ccast_language",
};

/* ============================================================
   HELPERS
   ============================================================ */

function getStoredValue(key, fallback) {
  try {
    const value = localStorage.getItem(key);

    return value || fallback;
  } catch {
    return fallback;
  }
}

function setStoredValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures.
  }
}

function normalizeRole(role) {
  if (!role) {
    return "Portal";
  }

  return (
    ROLE_LABEL[role] ||
    String(role)
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function getTodayLabel() {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function flattenNavigation(sections = []) {
  const result = [];

  const walk = (items) => {
    if (!Array.isArray(items)) {
      return;
    }

    items.forEach((item) => {
      if (!item) {
        return;
      }

      if (item.to) {
        result.push(item);
      }

      if (item.children) {
        walk(item.children);
      }

      if (item.items) {
        walk(item.items);
      }
    });
  };

  walk(sections);

  return result;
}

function isRouteActive(item, pathname) {
  if (!item?.to) {
    return false;
  }

  if (item.exact) {
    return pathname === item.to;
  }

  if (item.to === "/dashboard") {
    return pathname === "/dashboard";
  }

  return (
    pathname === item.to ||
    pathname.startsWith(`${item.to}/`)
  );
}

/* ============================================================
   APP SHELL
   ============================================================ */

export default function AppShell({ children }) {
  const {
    user,
    logout,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  /* ==========================================================
     UI STATE
     ========================================================== */

  const [navOpen, setNavOpen] = useState(false);

  const [mobileSearchOpen, setMobileSearchOpen] =
    useState(false);

  const [showNotif, setShowNotif] = useState(false);

  const [showLangMenu, setShowLangMenu] =
    useState(false);

  const [showYearMenu, setShowYearMenu] =
    useState(false);

  const [showTermMenu, setShowTermMenu] =
    useState(false);

  const [showProfileMenu, setShowProfileMenu] =
    useState(false);

  const [openGroups, setOpenGroups] =
    useState({});

  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  /* ==========================================================
     REFS
     ========================================================== */

  const notifRef = useRef(null);
  const langRef = useRef(null);
  const yearRef = useRef(null);
  const termRef = useRef(null);
  const profileRef = useRef(null);
  const searchInputRef = useRef(null);

  /* ==========================================================
     PORTAL CONFIG
     ========================================================== */

  const primaryRole = user?.roles?.[0];

  const portalConfig = useMemo(
    () => getPortalConfig(primaryRole),
    [primaryRole]
  );

  const sidebarSections =
    portalConfig?.sidebar?.sections ||
    FALLBACK_NAV;

  const quickActions =
    portalConfig?.sidebar?.quickActions || [];

  const quickActionsPanel =
    portalConfig?.sidebar?.quickActionsPanel || null;

  const accentColor =
    portalConfig?.accentColor || "#1a56db";

  const portalIcon =
    portalConfig?.icon || "school";

  const portalLabel =
    portalConfig?.label || "Portal";

  const navbarConfig =
    portalConfig?.navbar || {};

  /* ==========================================================
     PREFERENCES
     ========================================================== */

  const configuredAcademicYear =
    navbarConfig.academicYear ||
    ACADEMIC_YEARS.at(-1);

  const configuredTerm =
    navbarConfig.currentTerm ||
    TERMS[0];

  const configuredLanguage =
    navbarConfig.language || "en";

  const [academicYear, setAcademicYear] =
    useState(() =>
      getStoredValue(
        STORAGE_KEYS.academicYear,
        configuredAcademicYear
      )
    );

  const [currentTerm, setCurrentTerm] =
    useState(() =>
      getStoredValue(
        STORAGE_KEYS.currentTerm,
        configuredTerm
      )
    );

  const [language, setLanguage] =
    useState(() => {
      const storedCode = getStoredValue(
        STORAGE_KEYS.language,
        configuredLanguage
      );

      return (
        LANGUAGES.find(
          (item) => item.code === storedCode
        ) || LANGUAGES[0]
      );
    });

  /* ==========================================================
     NOTIFICATIONS
     ========================================================== */

  const {
    data: notifData,
    isLoading: notifLoading,
  } = useNotifications();

  const markRead =
    useMarkNotificationRead();

  const markAllRead =
    useMarkAllNotificationsRead();

  const notifItems =
    notifData?.notifications ?? [];

  const notifCount =
    Number(notifData?.unread_count ?? 0);

  /* ==========================================================
     CONFIG-DRIVEN BADGES
     ========================================================== */

  const mailBadgeCount =
    navbarConfig.mailBadgeCount ?? 0;

  const sidebarMessagesCount =
    navbarConfig.messagesBadgeCount ?? 0;

  /* ==========================================================
     TODAY
     ========================================================== */

  const todayFormatted = useMemo(
    () => getTodayLabel(),
    []
  );

  /* ==========================================================
     BREADCRUMB
     ========================================================== */

  const breadcrumbLabel = useMemo(() => {
    const items =
      flattenNavigation(sidebarSections);

    const activeItem = items.find((item) =>
      isRouteActive(
        item,
        location.pathname
      )
    );

    return (
      activeItem?.label ||
      portalLabel ||
      "Dashboard"
    );
  }, [
    sidebarSections,
    location.pathname,
    portalLabel,
  ]);

  /* ==========================================================
     ACTIVE NAVIGATION ITEM
     ========================================================== */

  const activeNavItem = useMemo(() => {
    const items =
      flattenNavigation(sidebarSections);

    return items.find((item) =>
      isRouteActive(
        item,
        location.pathname
      )
    );
  }, [
    sidebarSections,
    location.pathname,
  ]);

  /* ==========================================================
     AUTO EXPAND ACTIVE GROUP
     ========================================================== */

  useEffect(() => {
    sidebarSections.forEach((entry) => {
      const children =
        entry?.children ||
        entry?.items ||
        [];

      children.forEach((child) => {
        if (!child?.children) {
          return;
        }

        const active = child.children.some(
          (item) =>
            item?.to &&
            isRouteActive(
              item,
              location.pathname
            )
        );

        if (active) {
          setOpenGroups((previous) => ({
            ...previous,
            [child.label]: true,
          }));
        }
      });

      if (entry?.children) {
        const active = entry.children.some(
          (item) =>
            item?.to &&
            isRouteActive(
              item,
              location.pathname
            )
        );

        if (active) {
          setOpenGroups((previous) => ({
            ...previous,
            [entry.label]: true,
          }));
        }
      }
    });
  }, [
    location.pathname,
    sidebarSections,
  ]);

  /* ==========================================================
     CLOSE MOBILE NAV ON ROUTE CHANGE
     ========================================================== */

  useEffect(() => {
    setNavOpen(false);
    setMobileSearchOpen(false);
    setShowNotif(false);
    setShowLangMenu(false);
    setShowYearMenu(false);
    setShowTermMenu(false);
    setShowProfileMenu(false);
  }, [location.pathname]);

  /* ==========================================================
     SCROLL TO TOP ON ROUTE CHANGE
     ========================================================== */

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [location.pathname]);

  /* ==========================================================
     DARK MODE
     ========================================================== */

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      darkMode
    );

    try {
      localStorage.setItem(
        "ccast_dark_mode",
        darkMode ? "1" : "0"
      );
    } catch {
      // Ignore.
    }
  }, [darkMode]);

  /* ==========================================================
     OUTSIDE CLICK
     ========================================================== */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(
          event.target
        )
      ) {
        setShowNotif(false);
      }

      if (
        langRef.current &&
        !langRef.current.contains(
          event.target
        )
      ) {
        setShowLangMenu(false);
      }

      if (
        yearRef.current &&
        !yearRef.current.contains(
          event.target
        )
      ) {
        setShowYearMenu(false);
      }

      if (
        termRef.current &&
        !termRef.current.contains(
          event.target
        )
      ) {
        setShowTermMenu(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target
        )
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /* ==========================================================
     ESCAPE KEY
     ========================================================== */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      setNavOpen(false);
      setMobileSearchOpen(false);
      setShowNotif(false);
      setShowLangMenu(false);
      setShowYearMenu(false);
      setShowTermMenu(false);
      setShowProfileMenu(false);
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, []);

  /* ==========================================================
     MOBILE SEARCH AUTO FOCUS
     ========================================================== */

  useEffect(() => {
    if (
      mobileSearchOpen &&
      searchInputRef.current
    ) {
      searchInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  /* ==========================================================
     PREFERENCES HANDLERS
     ========================================================== */

  const changeAcademicYear = useCallback(
    (year) => {
      setAcademicYear(year);

      setStoredValue(
        STORAGE_KEYS.academicYear,
        year
      );

      setShowYearMenu(false);
    },
    []
  );

  const changeTerm = useCallback(
    (term) => {
      setCurrentTerm(term);

      setStoredValue(
        STORAGE_KEYS.currentTerm,
        term
      );

      setShowTermMenu(false);
    },
    []
  );

  const changeLanguage = useCallback(
    (selectedLanguage) => {
      setLanguage(selectedLanguage);

      setStoredValue(
        STORAGE_KEYS.language,
        selectedLanguage.code
      );

      setShowLangMenu(false);

      toast.success(
        `Language changed to ${selectedLanguage.label}.`
      );
    },
    []
  );

  /* ==========================================================
     NOTIFICATION HANDLERS
     ========================================================== */

  const handleNotifClick = useCallback(
    (notification) => {
      if (!notification) {
        return;
      }

      if (!notification.read) {
        markRead.mutate(notification.id);
      }

      setShowNotif(false);

      if (notification.action_url) {
        navigate(
          notification.action_url
        );
      }
    },
    [
      markRead,
      navigate,
    ]
  );

  const handleMarkAllRead = () => {
    if (!notifCount) {
      return;
    }

    markAllRead.mutate();
  };

  /* ==========================================================
     LOGOUT
     ========================================================== */

  const handleLogout = async () => {
    const ok = await confirmAction({
      title: "Log out?",
      text:
        "You'll need to sign in again to access your portal.",
      icon: "question",
      confirmText: "Log out",
    });

    if (!ok) {
      return;
    }

    try {
      await logout();

      toast.success(
        "Logged out successfully."
      );

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );

      toast.error(
        "Unable to log out. Please try again."
      );
    }
  };

  /* ==========================================================
     NAVIGATION
     ========================================================== */

  const go = useCallback(
    (to) => {
      if (!to) {
        return;
      }

      setNavOpen(false);
      navigate(to);
    },
    [navigate]
  );

  const toggleGroup = useCallback(
    (label) => {
      setOpenGroups((previous) => ({
        ...previous,
        [label]:
          !previous[label],
      }));
    },
    []
  );

  /* ==========================================================
     BADGE
     ========================================================== */

  const renderBadge = (badge) => {
    if (!badge) {
      return null;
    }

    let value = badge;

    if (badge === "messages") {
      value =
        sidebarMessagesCount;
    }

    if (
      value === 0 ||
      value === "0"
    ) {
      return null;
    }

    return (
      <span className="app-nav-badge">
        {value}
      </span>
    );
  };

  /* ==========================================================
     NAV LINK
     ========================================================== */

  const renderNavLink = (
    item,
    keyOverride
  ) => {
    if (!item?.to) {
      if (import.meta.env.DEV) {
        console.warn(
          "AppShell: sidebar entry is missing a `to` path.",
          item
        );
      }

      return null;
    }

    return (
      <NavLink
        key={
          keyOverride ||
          item.to
        }
        to={item.to}
        end={
          item.exact ||
          item.to === "/dashboard"
        }
        className={({ isActive }) =>
          `app-nav-link ${
            isActive
              ? "active"
              : ""
          }`
        }
        onClick={() =>
          setNavOpen(false)
        }
        title={item.label}
      >
        <span className="material-symbols-outlined app-nav-icon">
          {item.icon || "circle"}
        </span>

        <span className="app-nav-label">
          {item.label}
        </span>

        {renderBadge(
          item.badge
        )}
      </NavLink>
    );
  };

  /* ==========================================================
     EXPANDABLE GROUP
     ========================================================== */

  const renderExpandableGroup = (
    entry,
    key
  ) => {
    const children =
      entry?.children || [];

    const isOpen =
      !!openGroups[
        entry.label
      ];

    const hasActiveChild =
      children.some(
        (child) =>
          child?.to &&
          isRouteActive(
            child,
            location.pathname
          )
      );

    return (
      <div
        key={key}
        className={`app-nav-expand-group ${
          hasActiveChild
            ? "has-active"
            : ""
        }`}
      >
        <button
          type="button"
          className={`app-nav-expand-toggle ${
            isOpen
              ? "open"
              : ""
          } ${
            hasActiveChild
              ? "active-parent"
              : ""
          }`}
          onClick={() =>
            toggleGroup(
              entry.label
            )
          }
          aria-expanded={
            isOpen
          }
        >
          <span className="material-symbols-outlined app-nav-icon">
            {entry.icon ||
              "folder"}
          </span>

          <span className="app-nav-label">
            {entry.label}
          </span>

          <span
            className={`material-symbols-outlined app-nav-expand-chevron ${
              isOpen
                ? "rotate"
                : ""
            }`}
          >
            expand_more
          </span>
        </button>

        <div
          className={`app-nav-expand-body ${
            isOpen
              ? "open"
              : ""
          }`}
        >
          {children.map(
            (
              child,
              childIndex
            ) => {
              if (
                !child?.to
              ) {
                return null;
              }

              const active =
                isRouteActive(
                  child,
                  location.pathname
                );

              return (
                <NavLink
                  key={
                    child.to ||
                    childIndex
                  }
                  to={child.to}
                  end={
                    child.exact
                  }
                  className={`app-nav-sub-link ${
                    active
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setNavOpen(
                      false
                    )
                  }
                >
                  <span className="app-nav-sub-line">
                    <span className="app-nav-sub-dot" />
                  </span>

                  <span className="app-nav-label">
                    {
                      child.label
                    }
                  </span>

                  {renderBadge(
                    child.badge
                  )}
                </NavLink>
              );
            }
          )}
        </div>
      </div>
    );
  };

  /* ==========================================================
     PROFILE MENU
     ========================================================== */

  const profileRoute =
    navbarConfig.profileRoute ||
    "/profile";

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div
      className={`app-shell ${
        navOpen
          ? "nav-open"
          : ""
      }`}
      style={{
        "--accent-color":
          accentColor,
      }}
    >
      {/* ======================================================
          MOBILE BACKDROP
          ====================================================== */}

      <div
        className="app-backdrop"
        onClick={() =>
          setNavOpen(false)
        }
        aria-hidden="true"
      />

      {/* ======================================================
          SIDEBAR
          ====================================================== */}

      <aside
        className="app-sidebar"
        aria-label="Main navigation"
      >
        {/* BRAND */}

        <div className="app-brand">
          <button
            type="button"
            className="app-logo"
            style={{
              background: `linear-gradient(
                135deg,
                ${accentColor},
                ${accentColor}dd
              )`,
            }}
            onClick={() =>
              go(
                navbarConfig
                  .homeRoute ||
                  "/dashboard"
              )
            }
            aria-label="Go to dashboard"
          >
            <span className="material-symbols-outlined">
              {portalIcon}
            </span>
          </button>

          <button
            type="button"
            className="app-brand-copy"
            onClick={() =>
              go(
                navbarConfig
                  .homeRoute ||
                  "/dashboard"
              )
            }
          >
            <span className="app-brand-name">
              CCAST Bambili
            </span>

            <span className="app-brand-tag">
              {portalLabel}
            </span>
          </button>

          <button
            type="button"
            className="app-sidebar-close"
            onClick={() =>
              setNavOpen(false)
            }
            aria-label="Close navigation"
          >
            <span className="material-symbols-outlined">
              close
            </span>
          </button>
        </div>

        {/* NAVIGATION */}

        <nav className="app-nav">
          {sidebarSections.map(
            (
              entry,
              index
            ) => {
              /* Section with items */

              if (entry?.items) {
                return (
                  <div
                    key={`group-${index}`}
                    className="app-nav-block"
                  >
                    {entry.section && (
                      <div className="app-nav-group">
                        {
                          entry.section
                        }
                      </div>
                    )}

                    {entry.items.map(
                      (
                        item,
                        itemIndex
                      ) => {
                        if (
                          item?.children
                        ) {
                          return renderExpandableGroup(
                            item,
                            `nested-${index}-${itemIndex}`
                          );
                        }

                        return renderNavLink(
                          item,
                          `nav-${index}-${itemIndex}`
                        );
                      }
                    )}
                  </div>
                );
              }

              /* Simple section */

              if (
                entry?.section &&
                !entry?.to
              ) {
                return (
                  <div
                    key={`section-${index}`}
                    className="app-nav-group"
                  >
                    {
                      entry.section
                    }
                  </div>
                );
              }

              /* Expandable group */

              if (
                entry?.children
              ) {
                return renderExpandableGroup(
                  entry,
                  `flat-expand-${index}`
                );
              }

              /* Direct navigation item */

              if (
                entry?.to
              ) {
                return renderNavLink(
                  entry,
                  `direct-${index}`
                );
              }

              return null;
            }
          )}
        </nav>

        {/* SIDEBAR FOOTER */}

        <div className="app-side-foot">
          {/* STUDENT GOAL CARD */}

          {primaryRole ===
            "student" && (
            <div className="app-side-goal-card">
              <div className="app-side-goal-top">
                <span className="material-symbols-outlined app-side-goal-icon">
                  school
                </span>

                <span className="app-side-goal-pct">
                  75%
                </span>
              </div>

              <div className="app-side-goal-title">
                Keep it up!
              </div>

              <div className="app-side-goal-sub">
                You're doing great this
                term.
              </div>

              <div className="app-side-goal-bar">
                <div
                  className="app-side-goal-fill"
                  style={{
                    width:
                      "75%",
                  }}
                />
              </div>

              <div className="app-side-goal-caption">
                75% of goals achieved
              </div>
            </div>
          )}

          {/* QUICK ACTION PANEL */}

          {quickActionsPanel && (
            <div className="app-side-qa-panel">
              <div className="app-side-qa-panel-title">
                {
                  quickActionsPanel.title
                }
              </div>

              {(
                quickActionsPanel.items ||
                []
              ).map(
                (
                  action,
                  index
                ) => (
                  <button
                    type="button"
                    key={`qap-${index}`}
                    className="app-side-qa-panel-item"
                    onClick={() =>
                      go(
                        action.to
                      )
                    }
                  >
                    <span className="material-symbols-outlined">
                      {
                        action.icon
                      }
                    </span>

                    <span className="app-nav-label">
                      {
                        action.label
                      }
                    </span>

                    <span className="material-symbols-outlined app-side-qa-panel-chevron">
                      chevron_right
                    </span>
                  </button>
                )
              )}
            </div>
          )}

          {/* QUICK ACTIONS */}

          {!quickActionsPanel &&
            quickActions.length >
              0 && (
              <div className="app-side-actions">
                {quickActions.map(
                  (
                    action,
                    index
                  ) => (
                    <button
                      type="button"
                      key={`qa-${index}`}
                      className="app-side-cta"
                      onClick={() =>
                        go(
                          action.to
                        )
                      }
                    >
                      <span className="material-symbols-outlined">
                        {
                          action.icon
                        }
                      </span>

                      <span className="app-nav-label">
                        {
                          action.label
                        }
                      </span>
                    </button>
                  )
                )}
              </div>
            )}

          {/* LOGOUT */}

          <button
            type="button"
            className="app-side-logout"
            onClick={
              handleLogout
            }
          >
            <span className="material-symbols-outlined">
              logout
            </span>

            <span className="app-nav-label">
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* ======================================================
          MAIN
          ====================================================== */}

      <div className="app-main">
        {/* ====================================================
            TOPBAR
            ==================================================== */}

        <header
          className="app-topbar"
          style={{
            "--accent-color":
              accentColor,
          }}
        >
          <div className="app-topbar-left">
            {/* MENU */}

            <button
              type="button"
              className="app-topbar-hamburger"
              onClick={() =>
                setNavOpen(
                  (open) =>
                    !open
                )
              }
              aria-label="Toggle navigation"
              aria-expanded={
                navOpen
              }
            >
              <span className="material-symbols-outlined">
                menu
              </span>
            </button>

            {/* BREADCRUMB */}

            <div className="app-topbar-page">
              <span className="app-topbar-breadcrumb">
                {breadcrumbLabel}
              </span>

              {activeNavItem?.description && (
                <span className="app-topbar-page-description">
                  {
                    activeNavItem.description
                  }
                </span>
              )}
            </div>

            {/* ACADEMIC YEAR */}

            {navbarConfig.showAcademicYear && (
              <div
                className="app-topbar-pill-wrap d-none d-md-block"
                ref={
                  yearRef
                }
              >
                <button
                  type="button"
                  className="app-topbar-pill"
                  onClick={() =>
                    setShowYearMenu(
                      (open) =>
                        !open
                    )
                  }
                  aria-expanded={
                    showYearMenu
                  }
                >
                  <span className="material-symbols-outlined">
                    calendar_today
                  </span>

                  <span>
                    {
                      academicYear
                    }
                  </span>

                  <span className="material-symbols-outlined">
                    expand_more
                  </span>
                </button>

                {showYearMenu && (
                  <div className="app-topbar-pill-menu">
                    {ACADEMIC_YEARS.map(
                      (year) => (
                        <button
                          type="button"
                          key={year}
                          className={
                            year ===
                            academicYear
                              ? "active"
                              : ""
                          }
                          onClick={() =>
                            changeAcademicYear(
                              year
                            )
                          }
                        >
                          <span>
                            {
                              year
                            }
                          </span>

                          {year ===
                            academicYear && (
                            <span className="material-symbols-outlined">
                              check
                            </span>
                          )}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TERM */}

            {navbarConfig.showTermSelector && (
              <div
                className="app-topbar-pill-wrap d-none d-md-block"
                ref={
                  termRef
                }
              >
                <button
                  type="button"
                  className="app-topbar-pill"
                  onClick={() =>
                    setShowTermMenu(
                      (open) =>
                        !open
                    )
                  }
                  aria-expanded={
                    showTermMenu
                  }
                >
                  <span className="material-symbols-outlined">
                    event
                  </span>

                  <span>
                    {
                      currentTerm
                    }
                  </span>

                  <span className="material-symbols-outlined">
                    expand_more
                  </span>
                </button>

                {showTermMenu && (
                  <div className="app-topbar-pill-menu">
                    {TERMS.map(
                      (term) => (
                        <button
                          type="button"
                          key={term}
                          className={
                            term ===
                            currentTerm
                              ? "active"
                              : ""
                          }
                          onClick={() =>
                            changeTerm(
                              term
                            )
                          }
                        >
                          <span>
                            {
                              term
                            }
                          </span>

                          {term ===
                            currentTerm && (
                            <span className="material-symbols-outlined">
                              check
                            </span>
                          )}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {/* DESKTOP SEARCH */}

            {/* {navbarConfig.showSearch && (
              <div className="app-topbar-search d-none d-lg-flex">
                <span className="material-symbols-outlined">
                  search
                </span>

                <input
                  type="search"
                  placeholder={
                    navbarConfig.searchPlaceholder ||
                    "Search anything..."
                  }
                  aria-label="Global search"
                />

                <span className="app-search-shortcut">
                  /
                </span>
              </div>
            )} */}

            {/* TODAY */}

            {navbarConfig.showTodayWidget && (
              <div className="app-topbar-today d-none d-xl-flex">
                <span className="material-symbols-outlined">
                  calendar_today
                </span>

                <div>
                  <div className="app-topbar-today-label">
                    Today
                  </div>

                  <div className="app-topbar-today-date">
                    {
                      todayFormatted
                    }
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ==================================================
              TOPBAR RIGHT
              ================================================== */}

          <div className="app-topbar-right">
            {/* MOBILE SEARCH */}

            {navbarConfig.showSearch && (
              <button
                type="button"
                className="app-topbar-icon d-lg-none"
                aria-label="Search"
                title="Search"
                onClick={() =>
                  setMobileSearchOpen(
                    (open) =>
                      !open
                  )
                }
              >
                <span className="material-symbols-outlined">
                  search
                </span>
              </button>
            )}

            {/* LANGUAGE */}

            {navbarConfig.showLanguage && (
              <div
                className="app-lang-wrap d-none d-sm-block"
                ref={
                  langRef
                }
              >
                <button
                  type="button"
                  className="app-topbar-icon app-lang-btn"
                  onClick={() =>
                    setShowLangMenu(
                      (open) =>
                        !open
                    )
                  }
                  aria-expanded={
                    showLangMenu
                  }
                >
                  <span className="material-symbols-outlined">
                    language
                  </span>

                  <span className="app-lang-label">
                    {
                      language.label
                    }
                  </span>

                  <span className="material-symbols-outlined app-lang-chevron">
                    expand_more
                  </span>
                </button>

                {showLangMenu && (
                  <div className="app-topbar-pill-menu app-lang-menu">
                    {LANGUAGES.map(
                      (item) => (
                        <button
                          type="button"
                          key={
                            item.code
                          }
                          className={
                            item.code ===
                            language.code
                              ? "active"
                              : ""
                          }
                          onClick={() =>
                            changeLanguage(
                              item
                            )
                          }
                        >
                          <span>
                            {
                              item.label
                            }
                          </span>

                          {item.code ===
                            language.code && (
                            <span className="material-symbols-outlined">
                              check
                            </span>
                          )}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {/* NOTIFICATIONS */}

            {navbarConfig.showNotifications && (
              <div
                className="app-notif-wrap"
                ref={
                  notifRef
                }
              >
                <button
                  type="button"
                  className={`app-notif-btn ${
                    showNotif
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setShowNotif(
                      (open) =>
                        !open
                    )
                  }
                  aria-label={`Notifications${
                    notifCount
                      ? `, ${notifCount} unread`
                      : ""
                  }`}
                  aria-expanded={
                    showNotif
                  }
                >
                  <span className="material-symbols-outlined">
                    notifications
                  </span>

                  {notifCount >
                    0 && (
                    <span className="app-notif-dot">
                      {notifCount >
                      9
                        ? "9+"
                        : notifCount}
                    </span>
                  )}
                </button>

                <div
                  className={`app-notif-drop ${
                    showNotif
                      ? "open"
                      : ""
                  }`}
                >
                  <div className="app-notif-drop-hd">
                    <div>
                      <strong>
                        Notifications
                      </strong>

                      {notifCount >
                        0 && (
                        <span className="app-notif-header-count">
                          {
                            notifCount
                          }{" "}
                          unread
                        </span>
                      )}
                    </div>

                    {notifCount >
                      0 && (
                      <button
                        type="button"
                        onClick={
                          handleMarkAllRead
                        }
                        disabled={
                          markAllRead.isPending
                        }
                      >
                        {markAllRead.isPending
                          ? "Updating..."
                          : "Mark all read"}
                      </button>
                    )}
                  </div>

                  <div className="app-notif-list">
                    {notifLoading && (
                      <div className="app-notif-empty">
                        <span className="material-symbols-outlined app-notif-empty-spin">
                          sync
                        </span>

                        <span>
                          Loading notifications...
                        </span>
                      </div>
                    )}

                    {!notifLoading &&
                      notifItems.length ===
                        0 && (
                        <div className="app-notif-empty">
                          <span className="material-symbols-outlined">
                            notifications_off
                          </span>

                          <strong>
                            You're all caught up
                          </strong>

                          <span>
                            No new notifications.
                          </span>
                        </div>
                      )}

                    {!notifLoading &&
                      notifItems.map(
                        (notification) => {
                          const color =
                            notification.color ||
                            accentColor;

                          return (
                            <button
                              type="button"
                              key={
                                notification.id
                              }
                              className={`app-notif-item ${
                                !notification.read
                                  ? "unread"
                                  : ""
                              }`}
                              onClick={() =>
                                handleNotifClick(
                                  notification
                                )
                              }
                            >
                              <div
                                className="app-notif-item-ic"
                                style={{
                                  background: `${color}1a`,
                                  color,
                                }}
                              >
                                <span className="material-symbols-outlined">
                                  {notification.icon ||
                                    "notifications"}
                                </span>
                              </div>

                              <div className="app-notif-item-body">
                                <div className="app-notif-item-title">
                                  {
                                    notification.title
                                  }
                                </div>

                                {notification.body && (
                                  <div className="app-notif-item-t">
                                    {
                                      notification.body
                                    }
                                  </div>
                                )}
                              </div>

                              <div className="app-notif-item-side">
                                <span className="app-notif-item-when">
                                  {
                                    notification.time_ago
                                  }
                                </span>

                                {!notification.read && (
                                  <span className="app-notif-item-unread-dot" />
                                )}
                              </div>
                            </button>
                          );
                        }
                      )}
                  </div>

                  {notifItems.length >
                    0 && (
                    <div className="app-notif-footer">
                      <button
                        type="button"
                        onClick={() =>
                          go(
                            "/notifications"
                          )
                        }
                      >
                        View all notifications
                        <span className="material-symbols-outlined">
                          arrow_forward
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MESSAGES */}

            {navbarConfig.showMessages && (
              <button
                type="button"
                className="app-topbar-icon app-topbar-icon-badge d-none d-sm-flex"
                aria-label="Messages"
                title="Messages"
                onClick={() =>
                  navbarConfig.messagesRoute &&
                  go(
                    navbarConfig.messagesRoute
                  )
                }
              >
                <span className="material-symbols-outlined">
                  mail
                </span>

                {mailBadgeCount >
                  0 && (
                  <span className="app-notif-dot">
                    {mailBadgeCount >
                    9
                      ? "9+"
                      : mailBadgeCount}
                  </span>
                )}
              </button>
            )}

            {/* CALENDAR */}

            {navbarConfig.showCalendar && (
              <button
                type="button"
                className="app-topbar-icon d-none d-sm-flex"
                aria-label="Calendar"
                title="Calendar"
                onClick={() =>
                  navbarConfig.calendarRoute &&
                  go(
                    navbarConfig.calendarRoute
                  )
                }
              >
                <span className="material-symbols-outlined">
                  calendar_month
                </span>
              </button>
            )}

            {/* DARK MODE */}

            {navbarConfig.showThemeToggle && (
              <button
                type="button"
                className="app-topbar-icon d-none d-md-flex"
                aria-label={
                  darkMode
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                title={
                  darkMode
                    ? "Light mode"
                    : "Dark mode"
                }
                onClick={() =>
                  setDarkMode(
                    (value) =>
                      !value
                  )
                }
              >
                <span className="material-symbols-outlined">
                  {darkMode
                    ? "light_mode"
                    : "dark_mode"}
                </span>
              </button>
            )}

            <div className="app-topbar-divider d-none d-sm-block" />

            {/* PROFILE */}

            {navbarConfig.showProfile !==
              false && (
              <div
                className="app-profile-wrap"
                ref={
                  profileRef
                }
              >
                <button
                  type="button"
                  className={`app-topbar-user ${
                    showProfileMenu
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setShowProfileMenu(
                      (open) =>
                        !open
                    )
                  }
                  aria-expanded={
                    showProfileMenu
                  }
                >
                  <div className="app-topbar-user-info d-none d-sm-block">
                    <div className="app-topbar-user-name">
                      {user?.name ||
                        "User"}
                    </div>

                    <div className="app-topbar-user-role">
                      {normalizeRole(
                        primaryRole
                      )}
                    </div>
                  </div>

                  <Avatar
                    photo={
                      user?.photo
                    }
                    name={
                      user?.name
                    }
                    size={38}
                    className="app-avatar"
                  />

                  <span className="material-symbols-outlined app-profile-chevron d-none d-md-block">
                    expand_more
                  </span>
                </button>

                {showProfileMenu && (
                  <div className="app-profile-menu">
                    <div className="app-profile-menu-head">
                      <Avatar
                        photo={
                          user?.photo
                        }
                        name={
                          user?.name
                        }
                        size={48}
                      />

                      <div>
                        <strong>
                          {user?.name ||
                            "User"}
                        </strong>

                        <span>
                          {user?.email ||
                            normalizeRole(
                              primaryRole
                            )}
                        </span>
                      </div>
                    </div>

                    <div className="app-profile-menu-divider" />

                    <button
                      type="button"
                      onClick={() =>
                        go(
                          profileRoute
                        )
                      }
                    >
                      <span className="material-symbols-outlined">
                        person
                      </span>

                      My Profile
                    </button>

                    {navbarConfig
                      .settingsRoute && (
                      <button
                        type="button"
                        onClick={() =>
                          go(
                            navbarConfig.settingsRoute
                          )
                        }
                      >
                        <span className="material-symbols-outlined">
                          settings
                        </span>

                        Settings
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setDarkMode(
                          (value) =>
                            !value
                        )
                      }
                    >
                      <span className="material-symbols-outlined">
                        {darkMode
                          ? "light_mode"
                          : "dark_mode"}
                      </span>

                      {darkMode
                        ? "Light mode"
                        : "Dark mode"}
                    </button>

                    <div className="app-profile-menu-divider" />

                    <button
                      type="button"
                      className="danger"
                      onClick={
                        handleLogout
                      }
                    >
                      <span className="material-symbols-outlined">
                        logout
                      </span>

                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* ====================================================
            MOBILE SEARCH
            ==================================================== */}

        {mobileSearchOpen &&
          navbarConfig.showSearch && (
            <div className="app-topbar-search-mobile d-lg-none">
              {/* <span className="material-symbols-outlined">
                search
              </span>

              <input
                ref={
                  searchInputRef
                }
                type="search"
                placeholder={
                  navbarConfig.searchPlaceholder ||
                  "Search anything..."
                }
                aria-label="Global search"
              /> */}

              <button
                type="button"
                onClick={() =>
                  setMobileSearchOpen(
                    false
                  )
                }
                aria-label="Close search"
              >
                <span className="material-symbols-outlined">
                  close
                </span>
              </button>
            </div>
          )}

        {/* ====================================================
            CONTENT
            ==================================================== */}

        <main
          className="app-content"
          id="main-content"
        >
          {children}
        </main>
      </div>
    </div>
  );
}