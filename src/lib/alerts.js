// lib/alert.js

import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

/* Brand-themed SweetAlert2 helpers used across the app.
   Toasts (react-hot-toast) handle lightweight feedback; these modal
   dialogs handle confirmations and important success/error moments. */

const BRAND = "#1e3a5f";
const DANGER = "#dc2626";

export const swal = Swal.mixin({
  buttonsStyling: true,
  confirmButtonColor: BRAND,
  cancelButtonColor: "#6b7280",
  reverseButtons: true,
});

// Confirm a destructive/irreversible action. Resolves to true if confirmed.
export async function confirmDelete({
  title = "Are you sure?",
  text = "This action cannot be undone.",
  confirmText = "Yes, delete",
} = {}) {
  const res = await swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Cancel",
    confirmButtonColor: DANGER,
  });
  return res.isConfirmed;
}

// Generic confirm (non-destructive). Resolves to true if confirmed.
export async function confirmAction({
  title = "Please confirm",
  text = "",
  icon = "question",
  confirmText = "Confirm",
  html,
} = {}) {
  const res = await swal.fire({
    title,
    text: html ? undefined : text,
    html,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Cancel",
  });
  return res.isConfirmed;
}

export function swalSuccess(title = "Success", text = "", opts = {}) {
  return swal.fire({ title, text, icon: "success", confirmButtonText: "OK", ...opts });
}

export function swalError(title = "Something went wrong", text = "", opts = {}) {
  return swal.fire({ title, text, icon: "error", confirmButtonText: "OK", ...opts });
}

export function swalInfo(title = "", text = "", opts = {}) {
  return swal.fire({ title, text, icon: "info", confirmButtonText: "OK", ...opts });
}
