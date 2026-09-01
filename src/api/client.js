// src/api/client.js

import axios from "axios";

/*
|--------------------------------------------------------------------------
| API Configuration
|--------------------------------------------------------------------------
*/

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api"
).replace(/\/+$/, "");

// const client = axios.create({
//   baseURL: API_URL,

//   headers: {
//     Accept: "application/json",
//     "Content-Type": "application/json",
//   },

//   /*
//    * Your current authentication architecture uses
//    * Bearer tokens rather than Laravel cookie-based
//    * Sanctum authentication.
//    */
//   withCredentials: false,

//   timeout: 30_000,
// });

const client = axios.create({
  baseURL: API_URL,

  headers: {
    Accept: "application/json",
  },

  withCredentials: false,

  timeout: 30_000,
});


/*
|--------------------------------------------------------------------------
| Authentication Token
|--------------------------------------------------------------------------
|
| The actual persistence of the token is handled by
| AuthContext. This module only keeps the active token
| available to Axios.
|
*/

let authToken = null;

export function setAuthToken(token) {
  authToken = token ? String(token) : null;
}

export function getAuthToken() {
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
}

/*
|--------------------------------------------------------------------------
| Authentication Endpoints
|--------------------------------------------------------------------------
|
| A 401 from these endpoints does NOT mean that an
| existing authenticated session has expired.
|
*/

const AUTH_PUBLIC_ENDPOINTS = new Set([
  "/auth/login",
  "/auth/verify-mfa",
  "/auth/request-mfa",
  "/auth/forgot-password",
  "/auth/reset-password",
]);

/*
|--------------------------------------------------------------------------
| Session Event Protection
|--------------------------------------------------------------------------
|
| Prevent multiple simultaneous 401 responses from
| generating multiple logout events.
|
*/

let sessionExpirationNotified = false;

export function resetSessionExpirationState() {
  sessionExpirationNotified = false;
}

/*
|--------------------------------------------------------------------------
| URL Helpers
|--------------------------------------------------------------------------
*/

function getPath(config) {
  const url = config?.url || "";

  try {
    return new URL(url, API_URL)
      .pathname
      .replace(/\/+$/, "");
  } catch {
    return url
      .split("?")[0]
      .replace(/\/+$/, "");
  }
}

function isPublicAuthEndpoint(path) {
  for (const endpoint of AUTH_PUBLIC_ENDPOINTS) {
    if (
      path === endpoint ||
      path.endsWith(endpoint)
    ) {
      return true;
    }
  }

  return false;
}

/*
|--------------------------------------------------------------------------
| Request Interceptor
|--------------------------------------------------------------------------
*/

client.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {};

    /*
     * Attach Bearer token when available.
     */
    if (authToken) {
      config.headers.Authorization =
        `Bearer ${authToken}`;
    }

    /*
     * Allow individual requests to disable the
     * authorization header if ever required.
     */
    if (config.skipAuth) {
      delete config.headers.Authorization;
    }

    return config;
  },

  (error) => Promise.reject(error)
);

/*
|--------------------------------------------------------------------------
| Response Interceptor
|--------------------------------------------------------------------------
*/

client.interceptors.response.use(
  (response) => response,

  (error) => {
    const response = error.response;
    const status = response?.status;
    const config = error.config || {};

    const path = getPath(config);

    /*
     * ---------------------------------------------------------------
     * Laravel validation errors
     * ---------------------------------------------------------------
     */

    if (status === 422) {
      const errors =
        response?.data?.errors || {};

      error.fieldErrors =
        Object.fromEntries(
          Object.entries(errors).map(
            ([field, messages]) => [
              field,
              Array.isArray(messages)
                ? messages[0]
                : String(messages),
            ]
          )
        );
    }
    

    /*
     * ---------------------------------------------------------------
     * Authentication expiration
     * ---------------------------------------------------------------
     */

    const shouldExpireSession =
      status === 401 &&
      Boolean(authToken) &&
      !isPublicAuthEndpoint(path) &&
      !config.skipAuthLogout;

    if (
      shouldExpireSession &&
      !sessionExpirationNotified
    ) {
      sessionExpirationNotified = true;

      /*
       * Clear the active Axios token immediately.
       */
      clearAuthToken();

      /*
       * Notify AuthContext.
       */
      if (
        typeof window !== "undefined"
      ) {
        window.dispatchEvent(
          new CustomEvent(
            "auth:logout",
            {
              detail: {
                reason: "expired",
              },
            }
          )
        );
      }
    }

    return Promise.reject(error);
  }
);

/*
|--------------------------------------------------------------------------
| Default Export
|--------------------------------------------------------------------------
*/

export default client;