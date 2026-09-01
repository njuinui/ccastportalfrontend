import React, { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useIsAdmissionOpen } from "../../api/public";

/**
 * Reusable admission-aware CTA.
 *
 * Any public "Apply" button should use this component.
 *
 * Behaviour:
 * - Admission loading -> shows loading state
 * - Admission open -> navigates normally
 * - Admission closed -> displays the required message
 */
const AdmissionGuardLink = ({
  children = "Apply Now",
  to = "/admission",
  className = "",
  icon = true,
  disabled = false,
  onBeforeNavigate,
}) => {
  const navigate = useNavigate();

  const {
    isOpen,
    isLoading,
  } = useIsAdmissionOpen();

  const handleClick = useCallback(
    (event) => {
      event.preventDefault();

      if (disabled || isLoading) {
        toast.loading("Checking admission status...", {
          id: "admission-status-check",
        });

        return;
      }

      if (!isOpen) {
        toast.error(
          "Admission is not open or closed. Please contact the school administration.",
          {
            id: "admission-status-check",
            duration: 6000,
          }
        );

        return;
      }

      toast.dismiss("admission-status-check");

      if (typeof onBeforeNavigate === "function") {
        onBeforeNavigate();
      }

      navigate(to);
    },
    [
      disabled,
      isLoading,
      isOpen,
      navigate,
      to,
      onBeforeNavigate,
    ]
  );

  return (
    <Link
      to={to}
      className={`${className} ${
        isLoading || disabled ? "admission-guard-loading" : ""
      }`}
      onClick={handleClick}
      aria-disabled={isLoading || disabled}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <>
          <span
            className="spinner-border spinner-border-sm me-2"
            aria-hidden="true"
          />

          Checking...
        </>
      ) : (
        <>
          {children}

          {icon && (
            <i
              className="fas fa-arrow-right ms-2"
              aria-hidden="true"
            />
          )}
        </>
      )}
    </Link>
  );
};

export default AdmissionGuardLink;