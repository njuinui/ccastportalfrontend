// src/api/auth.js

import client, {
  setAuthToken,
  clearAuthToken,
} from "./client";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizeIdentifier(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function requireValue(value, message) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    throw new Error(message);
  }
}

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
|
| POST /api/auth/login
|
*/

export async function loginRequest(
  credentials = {}
) {
  const identifier =
    normalizeIdentifier(
      credentials.identifier
    );

  requireValue(
    identifier,
    "Email or matricule is required."
  );

  requireValue(
    credentials.password,
    "Password is required."
  );

  const payload = {
    identifier,
    password: credentials.password,
    remember: Boolean(
      credentials.remember
    ),
    policy_accepted: Boolean(
      credentials.policy_accepted
    ),
  };

  const { data } =
    await client.post(
      "/auth/login",
      payload
    );

  /*
   * Only synchronize Axios with a token when
   * the backend actually provides one.
   */
  if (data?.token) {
    setAuthToken(data.token);
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| MFA Verification
|--------------------------------------------------------------------------
|
| POST /api/auth/verify-mfa
|
*/

export async function verifyMFARequest(
  challengeId,
  code,
  remember = false
) {
  requireValue(
    challengeId,
    "MFA challenge ID is required."
  );

  const normalizedCode =
    String(code ?? "").trim();

  requireValue(
    normalizedCode,
    "MFA verification code is required."
  );

  if (!/^\d{6}$/.test(normalizedCode)) {
    throw new Error(
      "MFA verification code must contain 6 digits."
    );
  }

  const { data } =
    await client.post(
      "/auth/verify-mfa",
      {
        challenge_id: challengeId,
        code: normalizedCode,
        remember: Boolean(remember),
      }
    );

  if (data?.token) {
    setAuthToken(data.token);
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| Request / Resend MFA
|--------------------------------------------------------------------------
|
| POST /api/auth/request-mfa
|
*/

export async function requestMFA(
  userId,
  method = "email"
) {
  requireValue(
    userId,
    "User ID is required for MFA."
  );

  const normalizedMethod =
    String(method)
      .trim()
      .toLowerCase();

  if (
    !["email", "sms"].includes(
      normalizedMethod
    )
  ) {
    throw new Error(
      "Invalid MFA method."
    );
  }

  const { data } =
    await client.post(
      "/auth/request-mfa",
      {
        user_id: userId,
        method: normalizedMethod,
      }
    );

  return data;
}

/*
|--------------------------------------------------------------------------
| Change Password
|--------------------------------------------------------------------------
|
| POST /api/auth/change-password
|
*/

export async function changePasswordRequest(
  currentPassword,
  newPassword,
  newPasswordConfirmation
) {
  requireValue(
    currentPassword,
    "Current password is required."
  );

  requireValue(
    newPassword,
    "New password is required."
  );

  requireValue(
    newPasswordConfirmation,
    "Password confirmation is required."
  );

  if (
    newPassword !==
    newPasswordConfirmation
  ) {
    throw new Error(
      "New password confirmation does not match."
    );
  }

  const { data } =
    await client.post(
      "/auth/change-password",
      {
        current_password:
          currentPassword,

        new_password:
          newPassword,

        new_password_confirmation:
          newPasswordConfirmation,
      }
    );

  if (data?.token) {
    setAuthToken(data.token);
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| Forgot Password
|--------------------------------------------------------------------------
|
| POST /api/auth/forgot-password
|
*/

export async function forgotPasswordRequest(
  email
) {
  const normalizedEmail =
    normalizeEmail(email);

  requireValue(
    normalizedEmail,
    "Email address is required."
  );

  const { data } =
    await client.post(
      "/auth/forgot-password",
      {
        email: normalizedEmail,
      }
    );

  return data;
}

/*
|--------------------------------------------------------------------------
| Reset Password
|--------------------------------------------------------------------------
|
| POST /api/auth/reset-password
|
*/

export async function resetPasswordRequest(
  payload = {}
) {
  const email =
    normalizeEmail(payload.email);

  const otp =
    String(payload.otp ?? "").trim();

  const newPassword =
    payload.new_password;

  const confirmation =
    payload.new_password_confirmation;

  requireValue(
    email,
    "Email address is required."
  );

  requireValue(
    otp,
    "OTP is required."
  );

  requireValue(
    newPassword,
    "New password is required."
  );

  requireValue(
    confirmation,
    "Password confirmation is required."
  );

  if (!/^\d{6}$/.test(otp)) {
    throw new Error(
      "OTP must contain 6 digits."
    );
  }

  if (
    newPassword !== confirmation
  ) {
    throw new Error(
      "Password confirmation does not match."
    );
  }

  const { data } =
    await client.post(
      "/auth/reset-password",
      {
        email,

        otp,

        new_password:
          newPassword,

        new_password_confirmation:
          confirmation,
      }
    );

  /*
   * Password reset should normally not leave
   * an existing bearer token active.
   */
  clearAuthToken();

  return data;
}

/*
|--------------------------------------------------------------------------
| Current User
|--------------------------------------------------------------------------
|
| GET /api/auth/me
|
*/

export async function fetchMe() {
  try {
    const { data } =
      await client.get(
        "/auth/me"
      );

    return (
      data?.user ??
      data ??
      null
    );
  } catch (error) {
    /*
     * 401 is handled by the Axios interceptor.
     *
     * Returning null allows AuthContext to
     * gracefully restore an unauthenticated state.
     */
    if (
      error.response?.status === 401
    ) {
      clearAuthToken();
      return null;
    }

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| Refresh Session
|--------------------------------------------------------------------------
|
| POST /api/auth/refresh
|
*/

export async function refreshRequest() {
  const { data } =
    await client.post(
      "/auth/refresh",
      null,
      {
        /*
         * If refresh itself returns 401,
         * AuthContext handles the session transition.
         */
        skipAuthLogout: true,
      }
    );

  if (data?.token) {
    setAuthToken(data.token);
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| Logout Current Session
|--------------------------------------------------------------------------
|
| POST /api/auth/logout
|
*/

export async function logoutRequest() {
  try {
    const { data } =
      await client.post(
        "/auth/logout",
        null,
        {
          skipAuthLogout: true,
        }
      );

    return data;
  } finally {
    clearAuthToken();
  }
}