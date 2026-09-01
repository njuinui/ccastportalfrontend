// src/context/AuthContext.jsx

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";

import toast from "react-hot-toast";

import {
  setAuthToken,
  clearAuthToken,
  resetSessionExpirationState,
} from "../api/client";

import {
  loginRequest,
  verifyMFARequest,
  requestMFA,
  changePasswordRequest,
  forgotPasswordRequest,
  resetPasswordRequest,
  fetchMe,
  refreshRequest,
  logoutRequest,
} from "../api/auth";

const AuthContext =
  createContext(null);

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const REFRESH_INTERVAL_MS =
  20 * 60 * 1000;

const STORAGE_KEYS = {
  SESSION: "token",
  PERSISTENT: "auth_token",
};

// This app (ccast-portal) only ever renders student/parent pages.
// Any staff role logging in here has nowhere to go - homeFor() falls
// back to "/" for anything not listed, which is correct: staff should
// be using the management app instead.
const HOME_BY_ROLE = {
  student: "/student",
  parent: "/parent",
};

/*
|--------------------------------------------------------------------------
| Storage
|--------------------------------------------------------------------------
*/

function getStoredToken() {
  try {
    return (
      localStorage.getItem(
        STORAGE_KEYS.PERSISTENT
      ) ||
      sessionStorage.getItem(
        STORAGE_KEYS.SESSION
      )
    );
  } catch {
    return null;
  }
}

function hasPersistentToken() {
  try {
    return Boolean(
      localStorage.getItem(
        STORAGE_KEYS.PERSISTENT
      )
    );
  } catch {
    return false;
  }
}

function clearStoredTokens() {
  try {
    localStorage.removeItem(
      STORAGE_KEYS.PERSISTENT
    );

    sessionStorage.removeItem(
      STORAGE_KEYS.SESSION
    );
  } catch {
    // Ignore storage failures.
  }
}

function storeToken(
  token,
  remember = false
) {
  clearStoredTokens();

  if (!token) {
    return;
  }

  try {
    if (remember) {
      localStorage.setItem(
        STORAGE_KEYS.PERSISTENT,
        token
      );
    } else {
      sessionStorage.setItem(
        STORAGE_KEYS.SESSION,
        token
      );
    }
  } catch (error) {
    console.warn(
      "Unable to persist authentication token.",
      error
    );
  }
}

/*
|--------------------------------------------------------------------------
| Role Normalization
|--------------------------------------------------------------------------
*/

function normalizeRole(role) {
  if (!role) {
    return null;
  }

  const value =
    typeof role === "string"
      ? role
      : role?.name;

  if (!value) {
    return null;
  }

  return String(value)
    .toLowerCase()
    .trim();
}

function getUserRoles(user) {
  if (!user) {
    return [];
  }

  const roles = [];

  /*
   * Singular role.
   */
  const primaryRole =
    normalizeRole(user.role);

  if (primaryRole) {
    roles.push(primaryRole);
  }

  /*
   * Multiple roles.
   */
  if (Array.isArray(user.roles)) {
    user.roles.forEach((role) => {
      const normalized =
        normalizeRole(role);

      if (
        normalized &&
        !roles.includes(normalized)
      ) {
        roles.push(normalized);
      }
    });
  }

  return roles;
}

/*
|--------------------------------------------------------------------------
| Permission Normalization
|--------------------------------------------------------------------------
*/

function normalizePermission(
  permission
) {
  if (!permission) {
    return null;
  }

  const value =
    typeof permission === "string"
      ? permission
      : permission?.name ??
        permission?.slug;

  if (!value) {
    return null;
  }

  return String(value)
    .toLowerCase()
    .trim();
}

function getUserPermissions(user) {
  if (!user) {
    return [];
  }

  const permissions = [];

  /*
   * Direct permissions.
   */
  if (
    Array.isArray(
      user.permissions
    )
  ) {
    user.permissions.forEach(
      (permission) => {
        const normalized =
          normalizePermission(
            permission
          );

        if (
          normalized &&
          !permissions.includes(
            normalized
          )
        ) {
          permissions.push(
            normalized
          );
        }
      }
    );
  }

  /*
   * Permissions attached to roles.
   */
  if (
    Array.isArray(user.roles)
  ) {
    user.roles.forEach(
      (role) => {
        if (
          !Array.isArray(
            role?.permissions
          )
        ) {
          return;
        }

        role.permissions.forEach(
          (permission) => {
            const normalized =
              normalizePermission(
                permission
              );

            if (
              normalized &&
              !permissions.includes(
                normalized
              )
            ) {
              permissions.push(
                normalized
              );
            }
          }
        );
      }
    );
  }

  return permissions;
}

/*
|--------------------------------------------------------------------------
| Home Route
|--------------------------------------------------------------------------
*/

export function homeFor(user) {
  const roles =
    getUserRoles(user);

  for (const role of roles) {
    if (HOME_BY_ROLE[role]) {
      return HOME_BY_ROLE[role];
    }
  }

  // No fallback dashboard exists in either app - if a role has no
  // mapped home, that account doesn't belong in this app. Sending it
  // to /403 avoids a redirect loop against a route that doesn't exist.
  return "/403";
}

/*
|--------------------------------------------------------------------------
| Provider
|--------------------------------------------------------------------------
*/

export function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const refreshTimerRef =
    useRef(null);

  const mountedRef =
    useRef(true);

  /*
   * ---------------------------------------------------------------
   * Establish session
   * ---------------------------------------------------------------
   */

  const establish = useCallback(
    ({
      token,
      user: authenticatedUser,
      remember = false,
    }) => {
      if (!authenticatedUser) {
        return null;
      }

      if (token) {
        setAuthToken(token);

        storeToken(
          token,
          remember
        );
      }

      resetSessionExpirationState();

      setUser(
        authenticatedUser
      );

      return {
        token,
        user: authenticatedUser,
      };
    },
    []
  );

  /*
   * ---------------------------------------------------------------
   * Clear session
   * ---------------------------------------------------------------
   */

  const clearSession =
    useCallback(() => {
      clearStoredTokens();
      clearAuthToken();
      setUser(null);
      setRefreshing(false);
    }, []);

  /*
   * ---------------------------------------------------------------
   * Restore session
   * ---------------------------------------------------------------
   */

  useEffect(() => {
    mountedRef.current = true;

    const initAuth =
      async () => {
        const token =
          getStoredToken();

        if (!token) {
          if (
            mountedRef.current
          ) {
            setLoading(false);
          }

          return;
        }

        try {
          setAuthToken(token);

          const userData =
            await fetchMe();

          if (
            !mountedRef.current
          ) {
            return;
          }

          if (userData) {
            resetSessionExpirationState();

            setUser(userData);
          } else {
            clearSession();
          }
        } catch (error) {
          console.error(
            "Authentication restoration failed:",
            error
          );

          if (
            mountedRef.current
          ) {
            clearSession();
          }
        } finally {
          if (
            mountedRef.current
          ) {
            setLoading(false);
          }
        }
      };

    initAuth();

    /*
     * -------------------------------------------------------------
     * Session expiration event
     * -------------------------------------------------------------
     */

    const handleExpiredSession =
      (event) => {
        clearSession();

        if (
          event?.detail
            ?.reason === "expired"
        ) {
          toast.error(
            "Your session has expired. Please sign in again."
          );
        }
      };

    window.addEventListener(
      "auth:logout",
      handleExpiredSession
    );

    /*
     * -------------------------------------------------------------
     * Multi-tab synchronization
     * -------------------------------------------------------------
     */

    const handleStorage =
      (event) => {
        if (
          event.key ===
            STORAGE_KEYS.PERSISTENT &&
          !event.newValue
        ) {
          clearAuthToken();
          setUser(null);
        }

        if (
          event.key ===
            STORAGE_KEYS.SESSION &&
          !event.newValue
        ) {
          clearAuthToken();
          setUser(null);
        }
      };

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      mountedRef.current =
        false;

      window.removeEventListener(
        "auth:logout",
        handleExpiredSession
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, [clearSession]);

  /*
   * ---------------------------------------------------------------
   * Silent refresh
   * ---------------------------------------------------------------
   */

  useEffect(() => {
    if (!user) {
      if (
        refreshTimerRef.current
      ) {
        clearInterval(
          refreshTimerRef.current
        );

        refreshTimerRef.current =
          null;
      }

      return undefined;
    }

    const refresh =
      async () => {
        if (refreshing) {
          return;
        }

        setRefreshing(true);

        try {
          const result =
            await refreshRequest();

          if (
            !mountedRef.current
          ) {
            return;
          }

          if (result?.token) {
            const remember =
              hasPersistentToken();

            setAuthToken(
              result.token
            );

            storeToken(
              result.token,
              remember
            );

            resetSessionExpirationState();
          }
        } catch (error) {
          /*
           * A failed refresh means we should
           * validate the session again rather
           * than silently keeping stale auth state.
           */

          if (
            error.response
              ?.status === 401 ||
            error.response
              ?.status === 419
          ) {
            clearSession();

            toast.error(
              "Your session has expired. Please sign in again."
            );
          } else {
            console.warn(
              "Silent token refresh failed.",
              error
            );
          }
        } finally {
          if (
            mountedRef.current
          ) {
            setRefreshing(false);
          }
        }
      };

    /*
     * Refresh periodically.
     */
    refreshTimerRef.current =
      setInterval(
        refresh,
        REFRESH_INTERVAL_MS
      );

    return () => {
      if (
        refreshTimerRef.current
      ) {
        clearInterval(
          refreshTimerRef.current
        );

        refreshTimerRef.current =
          null;
      }
    };
  }, [
    user,
    refreshing,
    clearSession,
  ]);

  /*
   * ---------------------------------------------------------------
   * Login
   * ---------------------------------------------------------------
   */

  const login =
    useCallback(
      async (credentials) => {
        const result =
          await loginRequest(
            credentials
          );

        /*
         * Only establish the complete
         * application session when the
         * backend gives us both user and token.
         */
        if (
          result?.token &&
          result?.user
        ) {
          establish({
            token: result.token,

            user: result.user,

            remember:
              Boolean(
                credentials
                  ?.remember
              ),
          });
        }

        return result;
      },
      [establish]
    );

  /*
   * ---------------------------------------------------------------
   * MFA
   * ---------------------------------------------------------------
   */

  const sendMfa =
    useCallback(
      (
        userId,
        method = "email"
      ) =>
        requestMFA(
          userId,
          method
        ),
      []
    );

  const verifyMfa =
    useCallback(
      async (
        challengeId,
        code,
        remember = false
      ) => {
        const result =
          await verifyMFARequest(
            challengeId,
            code,
            remember
          );

        if (
          result?.token &&
          result?.user
        ) {
          establish({
            token:
              result.token,

            user:
              result.user,

            remember,
          });
        }

        return result;
      },
      [establish]
    );

  /*
   * ---------------------------------------------------------------
   * Password
   * ---------------------------------------------------------------
   */

  const changePassword =
    useCallback(
      async (
        currentPassword,
        newPassword,
        confirmation =
          newPassword
      ) => {
        const result =
          await changePasswordRequest(
            currentPassword,
            newPassword,
            confirmation
          );

        if (
          result?.token &&
          result?.user
        ) {
          return establish({
            token:
              result.token,

            user:
              result.user,

            remember:
              hasPersistentToken(),
          });
        }

        return result;
      },
      [establish]
    );

  /*
   * ---------------------------------------------------------------
   * Password reset
   * ---------------------------------------------------------------
   */

  const forgotPassword =
    useCallback(
      (email) =>
        forgotPasswordRequest(
          email
        ),
      []
    );

  const resetPassword =
    useCallback(
      (payload) =>
        resetPasswordRequest(
          payload
        ),
      []
    );

  /*
   * ---------------------------------------------------------------
   * Logout
   * ---------------------------------------------------------------
   */

  const logout =
    useCallback(
      async () => {
        try {
          await logoutRequest();
        } catch (error) {
          /*
           * Logout should still succeed locally
           * even if the backend is unreachable.
           */
          console.warn(
            "Logout request failed:",
            error
          );
        } finally {
          clearSession();
          resetSessionExpirationState();
        }
      },
      [clearSession]
    );

  /*
   * ---------------------------------------------------------------
   * Role helpers
   * ---------------------------------------------------------------
   */

  const roles = useMemo(
    () =>
      getUserRoles(user),
    [user]
  );

  const permissions =
    useMemo(
      () =>
        getUserPermissions(
          user
        ),
      [user]
    );

  const hasRole =
    useCallback(
      (...requiredRoles) => {
        if (!roles.length) {
          return false;
        }

        return requiredRoles.some(
          (role) =>
            roles.includes(
              normalizeRole(
                role
              )
            )
        );
      },
      [roles]
    );

  /*
   * Backwards-compatible helper.
   *
   * This directly addresses the previous
   * hasAnyRole(...) problem in your project.
   */
  const hasAnyRole =
    useCallback(
      (...requiredRoles) =>
        hasRole(
          ...requiredRoles
        ),
      [hasRole]
    );

  const hasAllRoles =
    useCallback(
      (...requiredRoles) => {
        if (
          !requiredRoles.length
        ) {
          return false;
        }

        return requiredRoles.every(
          (role) =>
            roles.includes(
              normalizeRole(
                role
              )
            )
        );
      },
      [roles]
    );

  /*
   * ---------------------------------------------------------------
   * Permission helpers
   * ---------------------------------------------------------------
   */

  const hasPermission =
    useCallback(
      (...requiredPermissions) => {
        if (
          !permissions.length
        ) {
          return false;
        }

        return requiredPermissions.some(
          (permission) =>
            permissions.includes(
              normalizePermission(
                permission
              )
            )
        );
      },
      [permissions]
    );

  const hasAnyPermission =
    useCallback(
      (...requiredPermissions) =>
        hasPermission(
          ...requiredPermissions
        ),
      [hasPermission]
    );

  const hasAllPermissions =
    useCallback(
      (...requiredPermissions) => {
        if (
          !requiredPermissions.length
        ) {
          return false;
        }

        return requiredPermissions.every(
          (permission) =>
            permissions.includes(
              normalizePermission(
                permission
              )
            )
        );
      },
      [permissions]
    );

  /*
   * ---------------------------------------------------------------
   * Authentication state
   * ---------------------------------------------------------------
   */

  const isAuthenticated =
    Boolean(user);

  /*
   * ---------------------------------------------------------------
   * Context value
   * ---------------------------------------------------------------
   */

  const value = useMemo(
    () => ({
      user,

      loading,

      refreshing,

      isAuthenticated,

      roles,

      permissions,

      login,

      sendMfa,

      verifyMfa,

      changePassword,

      forgotPassword,

      resetPassword,

      logout,

      hasRole,

      hasAnyRole,

      hasAllRoles,

      hasPermission,

      hasAnyPermission,

      hasAllPermissions,

      homeFor,
    }),
    [
      user,
      loading,
      refreshing,
      isAuthenticated,
      roles,
      permissions,
      login,
      sendMfa,
      verifyMfa,
      changePassword,
      forgotPassword,
      resetPassword,
      logout,
      hasRole,
      hasAnyRole,
      hasAllRoles,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    ]
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

/*
|--------------------------------------------------------------------------
| useAuth
|--------------------------------------------------------------------------
*/

export function useAuth() {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
}