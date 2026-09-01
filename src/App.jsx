// src/App.jsx
// ============================================================
// CCAST PORTAL — public website + student & parent portal
// ============================================================

import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { Toaster } from "react-hot-toast";
import "bootstrap/dist/css/bootstrap.min.css";

import { useAuth, homeFor } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";

// ============================================================
// PUBLIC PAGES
// ============================================================

import Home from "./pages/home/Home";
import AboutPage from "./pages/about/AboutPage";
import AnnouncementsPage from "./pages/announcements/AnnouncementsPage";
import AnnouncementDetailPage from "./pages/announcements/AnnouncementDetailPage";
import BlogPage from "./pages/blog/BlogPage";
import BlogPostPage from "./pages/blog/BlogPostPage";
import ContactPage from "./pages/contact/ContactPage";
import LoginPage from "./pages/auth/LoginPage";

import AcademicResultsPage from "./pages/site/AcademicResultsPage";
import StudentLifePage from "./pages/site/StudentLifePage";

import AdmissionPage from "./pages/admission/AdmissionPage";
import AdmissionSuccess from "./pages/admission/AdmissionSuccess";

import CareersPage from "./pages/public/CareersPage";
import TeacherApplicationPage from "./pages/public/TeacherApplicationPage";

// ============================================================
// STUDENT / PARENT DASHBOARDS
// ============================================================

import StudentDashboard from "./pages/portals/StudentDashboard";
import ParentDashboard from "./pages/portals/ParentDashboard";

// ============================================================
// ROLE DEFINITIONS
// ============================================================
//
// This app only ever renders pages for these two roles. If a
// staff account somehow lands here, ProtectedRoute sends them
// to /403 - staff pages simply don't exist in this build.
//
const ROLES = Object.freeze({
  STUDENT: "student",
  PARENT: "parent",
});

// ============================================================
// PROTECTED PAGE WRAPPER
// ============================================================

function Page({ element, roles }) {
  return (
    <ProtectedRoute roles={roles || []}>
      <AppShell>{element}</AppShell>
    </ProtectedRoute>
  );
}

// ============================================================
// REDIRECTS
// ============================================================

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="spinner-border text-primary" role="status" aria-label="Loading" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={homeFor(user)} replace />;
}

function PortalRedirect() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={homeFor(user)} replace />;
}

function AccessDeniedPage() {
  return (
    <div
      className="container d-flex justify-content-center align-items-center"
      style={{ minHeight: "70vh" }}
    >
      <div className="text-center">
        <h1 className="display-5 fw-bold">403</h1>
        <h2 className="mb-3">Access Denied</h2>
        <p className="text-muted">
          This account isn't a student or parent account. Staff should use
          the management portal instead.
        </p>
        <a href="/" className="btn btn-primary">Return Home</a>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{ duration: 4000, style: { fontSize: "14px" } }}
      />

      <Routes>
        {/* PUBLIC WEBSITE */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/announcements/:slug" element={<AnnouncementDetailPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admission" element={<AdmissionPage />} />
        <Route path="/admission/success" element={<AdmissionSuccess />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/careers/apply" element={<TeacherApplicationPage />} />
        <Route path="/academic-results" element={<AcademicResultsPage />} />
        <Route path="/student-life" element={<StudentLifePage />} />

        {/* PORTAL ROOT */}
        <Route path="/portal" element={<PortalRedirect />} />

        {/* STUDENT */}
        <Route
          path="/student"
          element={<Page roles={[ROLES.STUDENT]} element={<StudentDashboard />} />}
        />

        {/* PARENT */}
        <Route
          path="/parent"
          element={<Page roles={[ROLES.PARENT]} element={<ParentDashboard />} />}
        />

        {/* ACCESS DENIED */}
        <Route path="/403" element={<AccessDeniedPage />} />

        {/* FALLBACK */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
