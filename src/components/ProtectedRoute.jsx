import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, homeFor } from "../context/AuthContext";

/**
 * ProtectedRoute
 *
 * Protects authenticated routes and optionally restricts access
 * by role.
 *
 * Usage:
 *
 * <ProtectedRoute>
 *   <SomePage />
 * </ProtectedRoute>
 *
 * <ProtectedRoute roles={["principal", "super-admin"]}>
 *   <AdminPage />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({
  children,
  roles = [],
  requireRole = true,
}) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  // ------------------------------------------------------------
  // AUTHENTICATION INITIALIZATION
  // ------------------------------------------------------------
  if (loading) {
    return (
      <div
        className="min-vh-100 d-flex align-items-center justify-content-center bg-light"
        role="status"
        aria-live="polite"
      >
        <div className="text-center">
          <div
            className="spinner-border text-primary mb-3"
            style={{ width: "2rem", height: "2rem" }}
            aria-hidden="true"
          />

          <div className="text-secondary small">
            Loading your account…
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // NOT AUTHENTICATED
  // ------------------------------------------------------------
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
        }}
        replace
      />
    );
  }

  // ------------------------------------------------------------
  // NO ROLE RESTRICTION
  // ------------------------------------------------------------
  if (!requireRole || !roles?.length) {
    return children;
  }

  // ------------------------------------------------------------
  // AUTHENTICATED USER — CHECK ROLE
  // ------------------------------------------------------------
  const allowed = roles.some((role) => hasRole?.(role));

  if (!allowed) {
    // User is authenticated but doesn't have permission.
    const fallback = homeFor(user);

    return (
      <Navigate
        to={fallback || "/"}
        state={{
          unauthorized: true,
          attemptedPath: location.pathname,
        }}
        replace
      />
    );
  }

  // ------------------------------------------------------------
  // AUTHORIZED
  // ------------------------------------------------------------
  return children;
}