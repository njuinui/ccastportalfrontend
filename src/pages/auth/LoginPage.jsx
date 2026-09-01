import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import toast from "react-hot-toast";

import {
  useAuth,
  homeFor,
} from "../../context/AuthContext";

import {
  confirmAction,
} from "../../lib/alerts";

import studentsAuthImage from "../../assets/images/auth-students.png";

import "./LoginPage.css";

/* ============================================================
   CCAST BAMBILI
   AUTHENTICATION PAGE
   Audience:
   - Parents / Guardians
   - Students
   ============================================================ */


/* ============================================================
   OTP INPUT
   ============================================================ */

function OTPInput({
  value,
  onChange,
  refs,
  error,
  disabled = false,
}) {
  const handleInput = (index, rawValue) => {
    if (!/^\d*$/.test(rawValue)) {
      return;
    }

    const next = [...value];

    next[index] = rawValue.slice(-1);

    onChange(next);

    if (rawValue && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (
      event.key === "Backspace" &&
      !value[index] &&
      index > 0
    ) {
      refs.current[index - 1]?.focus();
    }

    if (
      event.key === "ArrowLeft" &&
      index > 0
    ) {
      refs.current[index - 1]?.focus();
    }

    if (
      event.key === "ArrowRight" &&
      index < 5
    ) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();

    const data = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!data) {
      return;
    }

    const next = [...value];

    data.split("").forEach((digit, index) => {
      if (index < 6) {
        next[index] = digit;
      }
    });

    onChange(next);

    const emptyIndex = next.findIndex(
      (item) => !item
    );

    const focusIndex =
      emptyIndex === -1 ? 5 : emptyIndex;

    refs.current[focusIndex]?.focus();
  };

  return (
    <div
      className={`auth-otp-wrap ${
        error ? "auth-otp-wrap--error" : ""
      }`}
      onPaste={handlePaste}
      role="group"
      aria-label="Verification code"
    >
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          className="auth-otp-input"
          onChange={(event) =>
            handleInput(
              index,
              event.target.value
            )
          }
          onKeyDown={(event) =>
            handleKeyDown(index, event)
          }
          disabled={disabled}
          aria-label={`Verification digit ${
            index + 1
          }`}
          autoComplete={
            index === 0
              ? "one-time-code"
              : "off"
          }
        />
      ))}
    </div>
  );
}


/* ============================================================
   MAIN LOGIN PAGE
   ============================================================ */

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    login,
    sendMfa,
    verifyMfa,
    changePassword,
    forgotPassword,
    resetPassword,
  } = useAuth();

  /* ==========================================================
     AUTH FLOW
     ========================================================== */

  const [flow, setFlow] = useState("login");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /* ==========================================================
     LOGIN
     ========================================================== */

  const [loginMethod, setLoginMethod] =
    useState("email");

  const [identifier, setIdentifier] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPass, setShowPass] =
    useState(false);

  const [remember, setRemember] =
    useState(true);

  const [termsAccepted, setTermsAccepted] =
    useState(false);

  const [language, setLanguage] =
    useState("en");

  /* ==========================================================
     MFA
     ========================================================== */

  const [mfaChallengeId, setMfaChallengeId] =
    useState(null);

  const [mfaUserId, setMfaUserId] =
    useState(null);

  const [mfaMethod, setMfaMethod] =
    useState("email");

  const [mfaCode, setMfaCode] =
    useState([
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

  const [resendTimer, setResendTimer] =
    useState(0);

  const mfaRefs = useRef([]);

  const timerRef = useRef(null);

  /* ==========================================================
     PASSWORD CHANGE
     ========================================================== */

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showNewPass, setShowNewPass] =
    useState(false);

  const [showConfirmPass, setShowConfirmPass] =
    useState(false);

  /* ==========================================================
     FORGOT PASSWORD
     ========================================================== */

  const [showForgot, setShowForgot] =
    useState(false);

  const [resetEmail, setResetEmail] =
    useState("");

  const [resetStep, setResetStep] =
    useState("request");

  const [resetOTP, setResetOTP] =
    useState([
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

  const [resetNewPass, setResetNewPass] =
    useState("");

  const [resetConfirmPass, setResetConfirmPass] =
    useState("");

  const [resetTimer, setResetTimer] =
    useState(0);

  const resetRefs = useRef([]);

  const resetTimerRef = useRef(null);

  /* ==========================================================
     HOME NAVIGATION
     ========================================================== */

  const [showSlip, setShowSlip] =
    useState(false);

  const fromPath =
    location.state?.from?.pathname;


  /* ============================================================
     PASSWORD VALIDATION
     ============================================================ */

  const validatePassword = (value) => {
    if (value.length < 12) {
      return "Password must be at least 12 characters.";
    }

    if (!/[A-Z]/.test(value)) {
      return "Password must contain at least one uppercase letter.";
    }

    if (!/[a-z]/.test(value)) {
      return "Password must contain at least one lowercase letter.";
    }

    if (!/[0-9]/.test(value)) {
      return "Password must contain at least one number.";
    }

    if (!/[^A-Za-z0-9]/.test(value)) {
      return "Password must contain at least one special character.";
    }

    return null;
  };


  /* ============================================================
     PASSWORD STRENGTH
     ============================================================ */

  const getPasswordStrength = (value) => {
    if (!value) {
      return {
        score: 0,
        label: "",
        color: "",
      };
    }

    let score = 0;

    if (value.length >= 12) score++;
    if (value.length >= 16) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    if (score <= 2) {
      return {
        score,
        label: "Weak",
        color: "#dc2626",
      };
    }

    if (score <= 4) {
      return {
        score,
        label: "Fair",
        color: "#d97706",
      };
    }

    return {
      score,
      label: "Strong",
      color: "#059669",
    };
  };

  const strength =
    getPasswordStrength(newPassword);


  /* ============================================================
     POST LOGIN
     ============================================================ */

  const goHome = (user) => {
    toast.success(
      `Welcome back, ${
        user?.name || "Student"
      }!`
    );

    navigate(
      fromPath || homeFor(user),
      {
        replace: true,
      }
    );
  };


  /* ============================================================
     MFA TIMER
     ============================================================ */

  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(
        () => {
          setResendTimer(
            (current) => current - 1
          );
        },
        1000
      );
    }

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [resendTimer]);


  /* ============================================================
     PASSWORD RESET TIMER
     ============================================================ */

  useEffect(() => {
    if (resetTimer > 0) {
      resetTimerRef.current =
        setTimeout(() => {
          setResetTimer(
            (current) => current - 1
          );
        }, 1000);
    }

    return () => {
      clearTimeout(
        resetTimerRef.current
      );
    };
  }, [resetTimer]);


  /* ============================================================
     AUTO FOCUS MFA
     ============================================================ */

  useEffect(() => {
    if (flow === "mfa") {
      const timer = setTimeout(() => {
        mfaRefs.current[0]?.focus();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [flow]);


  /* ============================================================
     AUTO FOCUS RESET OTP
     ============================================================ */

  useEffect(() => {
    if (resetStep === "verify") {
      const timer = setTimeout(() => {
        resetRefs.current[0]?.focus();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [resetStep]);


  /* ============================================================
     RETURN TO LOGIN
     ============================================================ */

  const backToLogin = () => {
    setFlow("login");

    setMfaCode([
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    setMfaChallengeId(null);

    setMfaUserId(null);

    setError("");
  };


  /* ============================================================
     CHANGE LOGIN METHOD
     ============================================================ */

  const handleMethodChange = (
    method
  ) => {
    if (method === loginMethod) {
      return;
    }

    setLoginMethod(method);

    setIdentifier("");

    setError("");
  };


  /* ============================================================
     MAIN LOGIN
     ============================================================ */

  const handleLogin = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    const cleanIdentifier =
      identifier.trim();


    if (!cleanIdentifier) {
      setError(
        loginMethod === "email"
          ? "Please enter your email address."
          : "Please enter your admission number."
      );

      return;
    }


    if (
      loginMethod === "email" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanIdentifier
      )
    ) {
      setError(
        "Please enter a valid email address."
      );

      return;
    }


    if (!password) {
      setError(
        "Please enter your password."
      );

      return;
    }


    if (!termsAccepted) {
      setError(
        "Please confirm that you agree to the Terms & Conditions and Privacy Policy."
      );

      return;
    }


    setLoading(true);

    try {
      const result = await login({
        identifier: cleanIdentifier,
        password,
        remember,
        policy_accepted: true,
      });


      /* Fully authenticated */

      if (
        result?.user &&
        result?.token &&
        !result?.requires_mfa &&
        !result?.requires_password_change
      ) {
        goHome(result.user);

        return;
      }


      /* MFA */

      if (result?.requires_mfa) {
        setFlow("mfa");

        setMfaUserId(
          result.user_id
        );

        setMfaChallengeId(
          result.challenge_id
        );

        setMfaMethod(
          result.method || "email"
        );

        setMfaCode([
          "",
          "",
          "",
          "",
          "",
          "",
        ]);

        setResendTimer(60);

        toast.success(
          result.message ||
            "Verification code sent."
        );

        if (
          import.meta.env.DEV &&
          result.code
        ) {
          console.info(
            "[DEV] MFA code:",
            result.code
          );
        }

        return;
      }


      /* Password change */

      if (
        result?.requires_password_change
      ) {
        setFlow(
          "password_change"
        );

        toast(
          result.message ||
            "Please update your password before continuing."
        );

        return;
      }


      setError(
        "We received an unexpected response. Please try again."
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(
          "LOGIN ERROR:",
          err
        );

        console.error(
          "LOGIN RESPONSE:",
          err.response?.data
        );

        console.error(
          "LOGIN STATUS:",
          err.response?.status
        );
      }

      const status =
        err.response?.status;

      const data =
        err.response?.data;


      const validationError =
        data?.errors?.identifier?.[0] ||
        data?.errors?.password?.[0] ||
        data?.errors?.policy_accepted?.[0];


      if (validationError) {
        setError(
          validationError
        );

        return;
      }


      if (
        data?.message &&
        status &&
        status < 500
      ) {
        setError(
          data.message
        );

        return;
      }


      if (status === 401) {
        setError(
          "The email/admission number or password is incorrect."
        );
      } else if (status === 403) {
        setError(
          "You are not authorized to sign in."
        );
      } else if (status === 422) {
        setError(
          "Please check the information you entered."
        );
      } else if (status === 429) {
        setError(
          "Too many sign-in attempts. Please try again later."
        );
      } else if (status >= 500) {
        setError(
          "We're unable to complete your sign-in right now. Please try again later."
        );
      } else if (!err.response) {
        setError(
          "Unable to connect to the server. Please check your internet connection."
        );
      } else {
        setError(
          "Unable to complete sign-in. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };


  /* ============================================================
     MFA VERIFY
     ============================================================ */

  const handleMfaVerify = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    const code =
      mfaCode.join("");

    if (code.length !== 6) {
      setError(
        "Please enter the complete 6-digit verification code."
      );

      return;
    }

    if (!mfaChallengeId) {
      setError(
        "Your verification session has expired. Please sign in again."
      );

      backToLogin();

      return;
    }

    setLoading(true);

    try {
      const result =
        await verifyMfa(
          mfaChallengeId,
          code,
          remember
        );


      if (
        result?.user &&
        result?.token
      ) {
        goHome(result.user);

        return;
      }


      if (
        result?.requires_password_change
      ) {
        setFlow(
          "password_change"
        );

        toast(
          "Please update your password before continuing."
        );

        return;
      }


      setError(
        "Verification failed. Please check the code and try again."
      );
    } catch (err) {
      const message =
        err.response?.data?.errors?.code?.[0] ||
        err.response?.data?.message ||
        "Invalid verification code.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };


  /* ============================================================
     RESEND MFA
     ============================================================ */

  const handleResendMfa =
    async () => {
      if (
        !mfaUserId ||
        resendTimer > 0 ||
        loading
      ) {
        return;
      }

      try {
        const result =
          await sendMfa(
            mfaUserId,
            mfaMethod
          );

        setMfaChallengeId(
          result.challenge_id
        );

        setMfaCode([
          "",
          "",
          "",
          "",
          "",
          "",
        ]);

        setResendTimer(60);

        toast.success(
          `Verification code sent via ${mfaMethod}.`
        );

        if (
          import.meta.env.DEV &&
          result.code
        ) {
          console.info(
            "[DEV] MFA code:",
            result.code
          );
        }

        setTimeout(() => {
          mfaRefs.current[0]?.focus();
        }, 100);
      } catch (err) {
        toast.error(
          err.response?.data?.message ||
            "Failed to resend verification code."
        );
      }
    };


  /* ============================================================
     CHANGE MFA METHOD
     ============================================================ */

  const handleMfaMethodChange =
    async (method) => {
      if (
        !mfaUserId ||
        method === mfaMethod ||
        resendTimer > 0 ||
        loading
      ) {
        return;
      }

      try {
        const result =
          await sendMfa(
            mfaUserId,
            method
          );

        setMfaMethod(method);

        setMfaChallengeId(
          result.challenge_id
        );

        setMfaCode([
          "",
          "",
          "",
          "",
          "",
          "",
        ]);

        setResendTimer(60);

        toast.success(
          `Verification code sent via ${method}.`
        );
      } catch (err) {
        toast.error(
          err.response?.data?.message ||
            "Failed to send verification code."
        );
      }
    };


  /* ============================================================
     PASSWORD CHANGE
     ============================================================ */

  const handlePasswordChange =
    async (event) => {
      event.preventDefault();

      setError("");

      const passwordError =
        validatePassword(
          newPassword
        );

      if (passwordError) {
        setError(passwordError);

        return;
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        setError(
          "Passwords do not match."
        );

        return;
      }

      setLoading(true);

      try {
        const result =
          await changePassword(
            password,
            newPassword
          );

        if (
          result?.user &&
          result?.token
        ) {
          toast.success(
            "Password updated successfully."
          );

          goHome(result.user);

          return;
        }

        setError(
          "Password update failed. Please try again."
        );
      } catch (err) {
        const errors =
          err.response?.data?.errors;

        if (errors) {
          const firstError =
            Object.values(errors)[0]?.[0];

          setError(
            firstError ||
              "Failed to update password."
          );
        } else {
          setError(
            err.response?.data?.message ||
              "Failed to update password."
          );
        }
      } finally {
        setLoading(false);
      }
    };


  /* ============================================================
     FORGOT PASSWORD REQUEST
     ============================================================ */

  const handleForgotRequest =
    async (event) => {
      event.preventDefault();

      setError("");

      const email =
        resetEmail.trim();

      if (!email) {
        setError(
          "Please enter your email address."
        );

        return;
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          email
        )
      ) {
        setError(
          "Please enter a valid email address."
        );

        return;
      }

      setLoading(true);

      try {
        const result =
          await forgotPassword(
            email
          );

        setResetStep(
          "verify"
        );

        setResetTimer(60);

        toast.success(
          result.message ||
            "Reset code sent to your email."
        );

        if (
          import.meta.env.DEV &&
          result.code
        ) {
          console.info(
            "[DEV] Reset code:",
            result.code
          );
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to send password reset code."
        );
      } finally {
        setLoading(false);
      }
    };


  /* ============================================================
     RESET PASSWORD
     ============================================================ */

  const handleResetPassword =
    async (event) => {
      event.preventDefault();

      setError("");

      const otp =
        resetOTP.join("");

      if (otp.length !== 6) {
        setError(
          "Please enter the complete 6-digit verification code."
        );

        return;
      }

      const passwordError =
        validatePassword(
          resetNewPass
        );

      if (passwordError) {
        setError(passwordError);

        return;
      }

      if (
        resetNewPass !==
        resetConfirmPass
      ) {
        setError(
          "Passwords do not match."
        );

        return;
      }

      setLoading(true);

      try {
        await resetPassword({
          email: resetEmail.trim(),
          otp,
          new_password:
            resetNewPass,
          new_password_confirmation:
            resetConfirmPass,
        });

        toast.success(
          "Password reset successfully. You can now sign in."
        );

        closeForgot();
      } catch (err) {
        const errors =
          err.response?.data?.errors;

        if (errors) {
          const firstError =
            Object.values(errors)[0]?.[0];

          setError(
            firstError ||
              "Failed to reset password."
          );
        } else {
          setError(
            err.response?.data?.message ||
              "Failed to reset password."
          );
        }
      } finally {
        setLoading(false);
      }
    };


  /* ============================================================
     CLOSE FORGOT PASSWORD
     ============================================================ */

  const closeForgot = () => {
    setShowForgot(false);

    setResetStep(
      "request"
    );

    setResetEmail("");

    setResetOTP([
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    setResetNewPass("");

    setResetConfirmPass("");

    setError("");

    setResetTimer(0);
  };


  /* ============================================================
     BACK TO HOME
     ============================================================ */

  const handleNavigateHome =
    useCallback(async () => {
      if (showSlip) {
        const confirmed =
          await confirmAction({
            title:
              "You have an open slip preview",
            text:
              "Are you sure you want to leave? The slip will be hidden.",
            confirmText:
              "Yes, leave",
            icon:
              "question",
          });

        if (confirmed) {
          navigate("/");
        }

        return;
      }

      navigate("/");
    }, [
      showSlip,
      navigate,
    ]);


  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="auth-page">
      <div className="auth-container">

        {/* =====================================================
            LEFT BRAND / STUDENT IMAGE
            Hidden on small phones
            ===================================================== */}

        <aside className="auth-brand">

          <div
            className="auth-brand-photo"
            style={{
              "--auth-student-image": `url(${studentsAuthImage})`,
            }}
          >
            <div className="auth-brand-overlay" />

            <div className="auth-brand-content">

              <div className="auth-brand-badge">
                <span
                  className="material-symbols-outlined"
                  aria-hidden="true"
                >
                  school
                </span>

                <span>
                  CCAST Bambili
                </span>
              </div>

              <div className="auth-brand-copy">

                <span className="auth-brand-eyebrow">
                  STUDENT &amp; FAMILY PORTAL
                </span>

                <h1>
                  Welcome Back!
                </h1>

                <p>
                  Stay connected with your
                  school, your learning, and
                  your child's progress.
                </p>

              </div>

              <div className="auth-brand-rule" />

              <div className="auth-brand-audience">

                <div className="auth-audience-item">
                  <span className="auth-audience-icon">
                    <span
                      className="material-symbols-outlined"
                      aria-hidden="true"
                    >
                      family_restroom
                    </span>
                  </span>

                  <span>
                    <strong>
                      Parents &amp; Guardians
                    </strong>

                    <small>
                      Sign in with your email
                    </small>
                  </span>
                </div>


                <div className="auth-audience-item">
                  <span className="auth-audience-icon">
                    <span
                      className="material-symbols-outlined"
                      aria-hidden="true"
                    >
                      school
                    </span>
                  </span>

                  <span>
                    <strong>
                      Students
                    </strong>

                    <small>
                      Sign in with your admission number
                    </small>
                  </span>
                </div>

              </div>

            </div>


            <div className="auth-brand-bottom">

              <span
                className="material-symbols-outlined"
                aria-hidden="true"
              >
                verified_user
              </span>

              <span>
                Secure access to your CCAST account
              </span>

            </div>

          </div>


          {/* ===================================================
              FEATURES
              =================================================== */}

          <div className="auth-brand-features">

            <div className="auth-feature">
              <div className="auth-feature-icon">
                <span
                  className="material-symbols-outlined"
                  aria-hidden="true"
                >
                  shield
                </span>
              </div>

              <strong>
                Secure
              </strong>

              <span className="auth-feature-caption">
                Your account and school information are protected.
              </span>
            </div>


            <div className="auth-feature">
              <div className="auth-feature-icon">
                <span
                  className="material-symbols-outlined"
                  aria-hidden="true"
                >
                  family_restroom
                </span>
              </div>

              <strong>
                Connected
              </strong>

              <span className="auth-feature-caption">
                Stay connected with your school community.
              </span>
            </div>


            <div className="auth-feature">
              <div className="auth-feature-icon">
                <span
                  className="material-symbols-outlined"
                  aria-hidden="true"
                >
                  support_agent
                </span>
              </div>

              <strong>
                Supported
              </strong>

              <span className="auth-feature-caption">
                Help is available whenever you need it.
              </span>
            </div>

          </div>

        </aside>


        {/* =====================================================
            RIGHT AUTH CONTENT
            ===================================================== */}

        <main className="auth-card">

          {/* Mobile-only welcome block */}
          <div className="auth-mobile-welcome">

            <div className="auth-mobile-brand">
              <div className="auth-mobile-brand-icon">
                <span
                  className="material-symbols-outlined"
                  aria-hidden="true"
                >
                  school
                </span>
              </div>

              <div>
                <strong>
                  CCAST Bambili
                </strong>

                <span>
                  Student &amp; Family Portal
                </span>
              </div>
            </div>

            <div className="auth-mobile-welcome-copy">
              <span>
                WELCOME BACK
              </span>

              <h1>
                Welcome back!
              </h1>

              <p>
                Sign in to continue to your
                school account.
              </p>
            </div>

          </div>


          {flow === "login" &&
            renderLoginForm()}

          {flow === "mfa" &&
            renderMfaForm()}

          {flow === "password_change" &&
            renderPasswordChangeForm()}

        </main>

      </div>


      {/* =======================================================
          FORGOT PASSWORD
          ======================================================= */}

      {showForgot &&
        renderForgotPasswordModal()}

    </div>
  );


  /* ============================================================
     LOGIN FORM
     ============================================================ */

  function renderLoginForm() {
    const isParent =
      loginMethod === "email";

    return (
      <div className="auth-form-container">

        <div className="auth-top-row">

          <div className="auth-header">

            <div className="auth-header-icon">
              <span
                className="material-symbols-outlined"
                aria-hidden="true"
              >
                {isParent
                  ? "family_restroom"
                  : "school"}
              </span>
            </div>

            <div>

              <h1>
                Sign in
              </h1>

              <p>
                {isParent
                  ? "Parents and guardians can access their account using their email address."
                  : "Students can access their school account using their admission number."}
              </p>

            </div>

          </div>


          <div className="auth-lang">

            <select
              className="auth-lang-select"
              value={language}
              onChange={(event) =>
                setLanguage(
                  event.target.value
                )
              }
              aria-label="Language"
            >
              <option value="en">
                English
              </option>

              <option value="fr">
                Français
              </option>
            </select>

          </div>

        </div>


        {/* =====================================================
            LOGIN METHOD TABS
            ===================================================== */}

        <div
          className="auth-tabs"
          role="tablist"
          aria-label="Sign in as"
        >

          <button
            type="button"
            role="tab"
            className={`auth-tab ${
              loginMethod === "email"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleMethodChange(
                "email"
              )
            }
            aria-selected={
              loginMethod === "email"
            }
          >
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
            >
              family_restroom
            </span>

            <span>
              Parent / Guardian
            </span>
          </button>


          <button
            type="button"
            role="tab"
            className={`auth-tab ${
              loginMethod === "admission"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleMethodChange(
                "admission"
              )
            }
            aria-selected={
              loginMethod === "admission"
            }
          >
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
            >
              school
            </span>

            <span>
              Student
            </span>
          </button>

        </div>


        {/* =====================================================
            FORM
            ===================================================== */}

        <form
          onSubmit={handleLogin}
          className="auth-form"
          noValidate
        >

          {error && (
            <div
              className="auth-error"
              role="alert"
            >
              <span
                className="material-symbols-outlined"
                aria-hidden="true"
              >
                warning
              </span>

              <span>
                {error}
              </span>
            </div>
          )}


          {/* =================================================
              IDENTIFIER
              ================================================= */}

          <div className="auth-field-group">

            <label
              className="auth-label"
              htmlFor="identifier"
            >
              {isParent
                ? "Email Address"
                : "Admission Number"}
            </label>

            <div className="auth-field">

              <span
                className="material-symbols-outlined auth-field-icon"
                aria-hidden="true"
              >
                {isParent
                  ? "mail"
                  : "badge"}
              </span>

              <input
                id="identifier"
                type={
                  isParent
                    ? "email"
                    : "text"
                }
                className="auth-input"
                placeholder={
                  isParent
                    ? "Enter your email address"
                    : "Enter your admission number"
                }
                value={identifier}
                onChange={(event) => {
                  setIdentifier(
                    event.target.value
                  );

                  setError("");
                }}
                autoComplete="username"
                autoFocus
                aria-invalid={
                  !!error
                }
              />

            </div>


            <span className="auth-field-hint">
              <span
                className="material-symbols-outlined"
                aria-hidden="true"
              >
                info
              </span>

              {isParent
                ? "Use the email address registered with the school."
                : "Use the admission number provided by CCAST Bambili."}
            </span>

          </div>


          {/* =================================================
              PASSWORD
              ================================================= */}

          <div className="auth-field-group">

            <div className="auth-label-row">

              <label
                className="auth-label"
                htmlFor="password"
              >
                Password
              </label>

            </div>

            <div className="auth-field">

              <span
                className="material-symbols-outlined auth-field-icon"
                aria-hidden="true"
              >
                lock
              </span>

              <input
                id="password"
                type={
                  showPass
                    ? "text"
                    : "password"
                }
                className="auth-input auth-input-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => {
                  setPassword(
                    event.target.value
                  );

                  setError("");
                }}
                autoComplete="current-password"
                aria-invalid={
                  !!error
                }
              />

              <button
                type="button"
                className="auth-pass-toggle"
                onClick={() =>
                  setShowPass(
                    (current) =>
                      !current
                  )
                }
                aria-label={
                  showPass
                    ? "Hide password"
                    : "Show password"
                }
              >
                <span
                  className="material-symbols-outlined"
                  aria-hidden="true"
                >
                  {showPass
                    ? "visibility_off"
                    : "visibility"}
                </span>
              </button>

            </div>

          </div>


          {/* =================================================
              OPTIONS
              ================================================= */}

          <div className="auth-options">

            <label className="auth-remember">

              <input
                type="checkbox"
                checked={remember}
                onChange={(event) =>
                  setRemember(
                    event.target.checked
                  )
                }
              />

              <span>
                Keep me signed in
              </span>

            </label>


            <button
              type="button"
              className="auth-forgot"
              onClick={() =>
                setShowForgot(true)
              }
            >
              Forgot password?
            </button>

          </div>


          {/* =================================================
              SECURITY NOTICE
              ================================================= */}

          <div className="auth-notice">

            <span
              className="material-symbols-outlined"
              aria-hidden="true"
            >
              verified_user
            </span>

            <div>

              <strong>
                Your account is protected
              </strong>

              <p>
                Never share your password with anyone.
                Always sign out when using a shared device.
              </p>

            </div>

          </div>


          {/* =================================================
              TERMS
              ================================================= */}

          <label className="auth-terms">

            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => {
                setTermsAccepted(
                  event.target.checked
                );

                setError("");
              }}
            />

            <span>
              I have read and agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noreferrer"
              >
                Terms &amp; Conditions
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noreferrer"
              >
                Privacy Policy
              </a>
              .
            </span>

          </label>


          {/* =================================================
              SUBMIT
              ================================================= */}

          <button
            type="submit"
            className="auth-submit"
            disabled={
              loading ||
              !termsAccepted
            }
          >

            {loading ? (
              <>
                <span
                  className="auth-spinner"
                  aria-hidden="true"
                />

                Signing in...
              </>
            ) : (
              <>
                Sign in

                <span
                  className="material-symbols-outlined"
                  aria-hidden="true"
                >
                  arrow_forward
                </span>
              </>
            )}

          </button>

        </form>


        {/* =====================================================
            HOME
            ===================================================== */}

        <button
          type="button"
          className="succ-home-btn"
          onClick={
            handleNavigateHome
          }
        >
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
          >
            home
          </span>

          Back to CCAST website
        </button>


        {/* =====================================================
            SUPPORT
            ===================================================== */}

        <div className="auth-footer-help">

          <span>
            Need help signing in?
          </span>

          <a
            href="mailto:support@ccastbambili.edu.cm"
          >
            Contact the school
          </a>

        </div>

      </div>
    );
  }


  /* ============================================================
     MFA FORM
     ============================================================ */

  function renderMfaForm() {
    return (
      <div className="auth-form-container">

        <div className="auth-flow-header">

          <div className="auth-flow-icon">
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
            >
              verified_user
            </span>
          </div>

          <span className="auth-flow-eyebrow">
            EXTRA SECURITY
          </span>

          <h1>
            Verify your identity
          </h1>

          <p>
            Enter the 6-digit verification
            code sent to your{" "}
            <strong>
              {mfaMethod}
            </strong>
            .
          </p>

        </div>


        <div
          className="auth-mfa-methods"
          role="radiogroup"
          aria-label="Verification method"
        >

          {["email", "sms"].map(
            (method) => (
              <button
                key={method}
                type="button"
                role="radio"
                className={`auth-mfa-method ${
                  mfaMethod === method
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMfaMethodChange(
                    method
                  )
                }
                aria-checked={
                  mfaMethod === method
                }
                disabled={
                  loading ||
                  resendTimer > 0
                }
              >

                <span
                  className="material-symbols-outlined"
                  aria-hidden="true"
                >
                  {method === "email"
                    ? "mail"
                    : "sms"}
                </span>

                {method === "email"
                  ? "Email"
                  : "SMS"}

              </button>
            )
          )}

        </div>


        <form
          onSubmit={
            handleMfaVerify
          }
          className="auth-form"
          noValidate
        >

          {error && (
            <div
              className="auth-error"
              role="alert"
            >
              <span
                className="material-symbols-outlined"
                aria-hidden="true"
              >
                warning
              </span>

              <span>
                {error}
              </span>
            </div>
          )}


          <div className="auth-otp-label">
            Verification code
          </div>

          <OTPInput
            value={mfaCode}
            onChange={setMfaCode}
            refs={mfaRefs}
            error={error}
            disabled={loading}
          />


          <button
            type="submit"
            className="auth-submit"
            disabled={
              loading ||
              mfaCode.join("")
                .length !== 6
            }
          >

            {loading ? (
              <>
                <span
                  className="auth-spinner"
                  aria-hidden="true"
                />

                Verifying...
              </>
            ) : (
              <>
                Verify &amp; continue

                <span
                  className="material-symbols-outlined"
                  aria-hidden="true"
                >
                  check_circle
                </span>
              </>
            )}

          </button>

        </form>


        <div className="auth-otp-actions">

          {resendTimer > 0 ? (
            <span className="auth-otp-timer">
              Resend available in{" "}
              <strong>
                {resendTimer}s
              </strong>
            </span>
          ) : (
            <button
              type="button"
              className="auth-otp-resend"
              onClick={
                handleResendMfa
              }
              disabled={loading}
            >
              Resend code
            </button>
          )}

          <button
            type="button"
            className="auth-otp-back"
            onClick={
              backToLogin
            }
          >
            Back to sign in
          </button>

        </div>

      </div>
    );
  }


  /* ============================================================
     PASSWORD CHANGE
     ============================================================ */

  function renderPasswordChangeForm() {
    return (
      <div className="auth-form-container">

        <div className="auth-flow-header">

          <div className="auth-flow-icon">
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
            >
              lock_reset
            </span>
          </div>

          <span className="auth-flow-eyebrow">
            ACCOUNT SECURITY
          </span>

          <h1>
            Create a new password
          </h1>

          <p>
            For your security, update your
            password before continuing.
          </p>

        </div>


        <form
          onSubmit={
            handlePasswordChange
          }
          className="auth-form"
          noValidate
        >

          {error && (
            <div
              className="auth-error"
              role="alert"
            >
              <span
                className="material-symbols-outlined"
                aria-hidden="true"
              >
                warning
              </span>

              <span>
                {error}
              </span>
            </div>
          )}


          <div className="auth-field-group">

            <label
              className="auth-label"
              htmlFor="current-password"
            >
              Current Password
            </label>

            <div className="auth-field">

              <span
                className="material-symbols-outlined auth-field-icon"
                aria-hidden="true"
              >
                lock
              </span>

              <input
                id="current-password"
                type="password"
                className="auth-input"
                value={password}
                autoComplete="current-password"
                disabled
              />

            </div>

          </div>


          <div className="auth-field-group">

            <label
              className="auth-label"
              htmlFor="new-password"
            >
              New Password
            </label>

            <div className="auth-field">

              <span
                className="material-symbols-outlined auth-field-icon"
                aria-hidden="true"
              >
                key
              </span>

              <input
                id="new-password"
                type={
                  showNewPass
                    ? "text"
                    : "password"
                }
                className="auth-input auth-input-password"
                placeholder="Create a strong password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(
                    event.target.value
                  );

                  setError("");
                }}
                autoComplete="new-password"
                autoFocus
              />

              <button
                type="button"
                className="auth-pass-toggle"
                onClick={() =>
                  setShowNewPass(
                    (current) =>
                      !current
                  )
                }
                aria-label={
                  showNewPass
                    ? "Hide password"
                    : "Show password"
                }
              >
                <span
                  className="material-symbols-outlined"
                  aria-hidden="true"
                >
                  {showNewPass
                    ? "visibility_off"
                    : "visibility"}
                </span>
              </button>

            </div>

          </div>


          {newPassword && (
            <>
              <div className="auth-strength">

                <div className="auth-strength-bar">
                  <div
                    className="auth-strength-fill"
                    style={{
                      width: `${
                        (strength.score /
                          6) *
                        100
                      }%`,
                      backgroundColor:
                        strength.color,
                    }}
                  />
                </div>

                <span
                  className="auth-strength-label"
                  style={{
                    color:
                      strength.color,
                  }}
                >
                  {strength.label}
                </span>

              </div>


              <div className="auth-pw-reqs">

                {[
                  [
                    newPassword.length >= 12,
                    "At least 12 characters",
                  ],
                  [
                    /[A-Z]/.test(
                      newPassword
                    ),
                    "One uppercase letter",
                  ],
                  [
                    /[a-z]/.test(
                      newPassword
                    ),
                    "One lowercase letter",
                  ],
                  [
                    /[0-9]/.test(
                      newPassword
                    ),
                    "One number",
                  ],
                  [
                    /[^A-Za-z0-9]/.test(
                      newPassword
                    ),
                    "One special character",
                  ],
                ].map(
                  ([met, text]) => (
                    <div
                      key={text}
                      className={`auth-pw-req ${
                        met
                          ? "met"
                          : ""
                      }`}
                    >
                      <span
                        className="material-symbols-outlined"
                        aria-hidden="true"
                      >
                        {met
                          ? "check_circle"
                          : "radio_button_unchecked"}
                      </span>

                      {text}
                    </div>
                  )
                )}

              </div>
            </>
          )}


          <div className="auth-field-group">

            <label
              className="auth-label"
              htmlFor="confirm-password"
            >
              Confirm New Password
            </label>

            <div className="auth-field">

              <span
                className="material-symbols-outlined auth-field-icon"
                aria-hidden="true"
              >
                lock
              </span>

              <input
                id="confirm-password"
                type={
                  showConfirmPass
                    ? "text"
                    : "password"
                }
                className="auth-input auth-input-password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(
                    event.target.value
                  );

                  setError("");
                }}
                autoComplete="new-password"
              />

              <button
                type="button"
                className="auth-pass-toggle"
                onClick={() =>
                  setShowConfirmPass(
                    (current) =>
                      !current
                  )
                }
                aria-label={
                  showConfirmPass
                    ? "Hide password"
                    : "Show password"
                }
              >
                <span
                  className="material-symbols-outlined"
                  aria-hidden="true"
                >
                  {showConfirmPass
                    ? "visibility_off"
                    : "visibility"}
                </span>
              </button>

            </div>

          </div>


          {confirmPassword &&
            newPassword &&
            confirmPassword !==
              newPassword && (
              <div className="auth-field-error">
                <span
                  className="material-symbols-outlined"
                  aria-hidden="true"
                >
                  error
                </span>

                Passwords do not match.
              </div>
            )}


          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span
                  className="auth-spinner"
                  aria-hidden="true"
                />

                Updating...
              </>
            ) : (
              <>
                Update password

                <span
                  className="material-symbols-outlined"
                  aria-hidden="true"
                >
                  check_circle
                </span>
              </>
            )}
          </button>

        </form>

      </div>
    );
  }


  /* ============================================================
     FORGOT PASSWORD MODAL
     ============================================================ */

  function renderForgotPasswordModal() {
    return (
      <div
        className="auth-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-password-title"
        onMouseDown={(event) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            closeForgot();
          }
        }}
      >

        <div className="auth-modal">

          <button
            type="button"
            className="auth-modal-close"
            onClick={
              closeForgot
            }
            aria-label="Close dialog"
          >
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
            >
              close
            </span>
          </button>


          <div className="auth-modal-header">

            <div className="auth-modal-icon-wrap">
              <span
                className="material-symbols-outlined auth-modal-icon"
                aria-hidden="true"
              >
                key
              </span>
            </div>

            <span className="auth-flow-eyebrow">
              ACCOUNT RECOVERY
            </span>

            <h2 id="reset-password-title">
              Reset your password
            </h2>

            <p>
              {resetStep === "request"
                ? "Enter the email address linked to your parent or guardian account."
                : "Enter the verification code and create your new password."}
            </p>

          </div>


          {error && (
            <div
              className="auth-error"
              role="alert"
            >
              <span
                className="material-symbols-outlined"
                aria-hidden="true"
              >
                warning
              </span>

              <span>
                {error}
              </span>
            </div>
          )}


          {resetStep === "request" ? (
            <form
              onSubmit={
                handleForgotRequest
              }
              className="auth-form"
            >

              <div className="auth-field-group">

                <label className="auth-label">
                  Email Address
                </label>

                <div className="auth-field">

                  <span
                    className="material-symbols-outlined auth-field-icon"
                    aria-hidden="true"
                  >
                    mail
                  </span>

                  <input
                    type="email"
                    className="auth-input"
                    placeholder="Enter your email address"
                    value={resetEmail}
                    onChange={(event) => {
                      setResetEmail(
                        event.target.value
                      );

                      setError("");
                    }}
                    autoComplete="email"
                    autoFocus
                  />

                </div>

              </div>


              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="auth-spinner"
                      aria-hidden="true"
                    />

                    Sending...
                  </>
                ) : (
                  <>
                    Send reset code

                    <span
                      className="material-symbols-outlined"
                      aria-hidden="true"
                    >
                      send
                    </span>
                  </>
                )}
              </button>

            </form>
          ) : (
            <form
              onSubmit={
                handleResetPassword
              }
              className="auth-form"
            >

              <div className="auth-field-group">

                <label className="auth-label">
                  Verification Code
                </label>

                <OTPInput
                  value={resetOTP}
                  onChange={
                    setResetOTP
                  }
                  refs={resetRefs}
                  error={error}
                  disabled={loading}
                />

              </div>


              <div className="auth-field-group">

                <label className="auth-label">
                  New Password
                </label>

                <div className="auth-field">

                  <span
                    className="material-symbols-outlined auth-field-icon"
                    aria-hidden="true"
                  >
                    key
                  </span>

                  <input
                    type="password"
                    className="auth-input"
                    placeholder="New password"
                    value={resetNewPass}
                    onChange={(event) => {
                      setResetNewPass(
                        event.target.value
                      );

                      setError("");
                    }}
                    autoComplete="new-password"
                  />

                </div>

              </div>


              <div className="auth-field-group">

                <label className="auth-label">
                  Confirm New Password
                </label>

                <div className="auth-field">

                  <span
                    className="material-symbols-outlined auth-field-icon"
                    aria-hidden="true"
                  >
                    lock
                  </span>

                  <input
                    type="password"
                    className="auth-input"
                    placeholder="Confirm new password"
                    value={
                      resetConfirmPass
                    }
                    onChange={(event) => {
                      setResetConfirmPass(
                        event.target.value
                      );

                      setError("");
                    }}
                    autoComplete="new-password"
                  />

                </div>

              </div>


              <div className="auth-otp-actions">

                {resetTimer > 0 ? (
                  <span className="auth-otp-timer">
                    Resend in{" "}
                    <strong>
                      {resetTimer}s
                    </strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="auth-otp-resend"
                    onClick={
                      handleForgotRequest
                    }
                    disabled={loading}
                  >
                    Resend code
                  </button>
                )}

              </div>


              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="auth-spinner"
                      aria-hidden="true"
                    />

                    Resetting...
                  </>
                ) : (
                  <>
                    Reset password

                    <span
                      className="material-symbols-outlined"
                      aria-hidden="true"
                    >
                      lock_reset
                    </span>
                  </>
                )}
              </button>

            </form>
          )}

        </div>

      </div>
    );
  }
};

export default LoginPage;