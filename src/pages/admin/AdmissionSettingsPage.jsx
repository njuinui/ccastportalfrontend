// src/pages/admin/AdmissionSettingsPage.jsx

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAdmissionSettingsAdmin, useSaveAdmissionSettings } from "../../api/admin18";

// Simple PageHeader component inline
const PageHeader = ({ title, subtitle }) => (
  <div className="mb-4">
    <h2 className="mb-1">{title}</h2>
    {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
  </div>
);

export default function AdmissionSettingsPage() {
  const qc = useQueryClient();

  // ── API Hooks ──
  const { data, isLoading, error } = useAdmissionSettingsAdmin();
  const saveMutation = useSaveAdmissionSettings();

  // ── State ──
  const [form, setForm] = useState({
    is_open: false,
    academic_year: "",
    opens_at: "",
    closes_at: "",
    open_message: "",
    closed_message: "",
  });

  // ── Populate form from API data ──
  useEffect(() => {
    if (data) {
      setForm({
        is_open: data.is_open || false,
        academic_year: data.academic_year || "",
        opens_at: data.opens_at ? formatDateTimeLocal(data.opens_at) : "",
        closes_at: data.closes_at ? formatDateTimeLocal(data.closes_at) : "",
        open_message: data.open_message || "",
        closed_message: data.closed_message || "",
      });
    }
  }, [data]);

  // ── Handlers ──
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate form
    if (form.is_open && !form.academic_year) {
      toast.error("Please enter an academic year when admissions are open.");
      return;
    }

    // Prepare data for submission
    const payload = {
      ...form,
      // Ensure dates are properly formatted or null
      opens_at: form.opens_at || null,
      closes_at: form.closes_at || null,
    };

    saveMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Admission settings saved successfully!");
        qc.invalidateQueries({ queryKey: ["admission-settings"] });
        // Also invalidate public settings
        qc.invalidateQueries({ queryKey: ["admission-settings-public"] });
      },
      onError: (err) => {
        const message = err?.response?.data?.message || "Could not save settings. Please try again.";
        toast.error(message);
      },
    });
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // ── Helper Functions ──
  // const formatDateTimeLocal = (datetime) => {
  //   if (!datetime) return "";
  //   const date = new Date(datetime);
  //   if (isNaN(date.getTime())) return "";
  //   return date.toISOString().slice(0, 16);
  // };

  const formatDateTimeLocal = (datetime) => {
    if (!datetime) return "";

    const date = new Date(datetime);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const pad = (value) => String(value).padStart(2, "0");

    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
      `T${pad(date.getHours())}:${pad(date.getMinutes())}`
    );
  };

  // ── Loading State ──
  if (isLoading) {
    return (
      <div className="container-xl py-4" style={{ maxWidth: 720 }}>
        <PageHeader title="Admission Settings" />
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading settings...</p>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="container-xl py-4" style={{ maxWidth: 720 }}>
        <PageHeader title="Admission Settings" />
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Failed to load admission settings. Please try again.
          {error?.message && <div className="mt-2 small">{error.message}</div>}
        </div>
      </div>
    );
  }

  // ── Render ──
  return (
    <div className="container-xl py-4" style={{ maxWidth: 720 }}>
      <PageHeader
        title="Admission Settings"
        subtitle="Control when online admission applications are accepted on the public site."
      />

      <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
        {/* ── Toggle ── */}
        <div className="card p-4">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="is_open"
              checked={form.is_open}
              onChange={(e) => handleChange('is_open', e.target.checked)}
            />
            <label className="form-check-label fw-bold" htmlFor="is_open">
              Admissions Open
            </label>
          </div>
          <div className="mt-2 small text-muted">
            {form.is_open
              ? "✅ Admissions are currently OPEN to the public."
              : "❌ Admissions are currently CLOSED to the public."
            }
          </div>
        </div>

        {/* ── Academic Year ── */}
        <div className="card p-4">
          <label className="form-label fw-bold">Academic Year</label>
          <input
            className="form-control"
            type="text"
            value={form.academic_year}
            onChange={(e) => handleChange('academic_year', e.target.value)}
            placeholder="e.g., 2026/2027"
          />
          <div className="form-text">The academic year for which admissions are being accepted.</div>
        </div>

        {/* ── Date Range ── */}
        <div className="card p-4">
          <label className="form-label fw-bold">Date Range (Optional)</label>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small">Opens At</label>
              <input
                type="datetime-local"
                className="form-control"
                value={form.opens_at}
                onChange={(e) => handleChange('opens_at', e.target.value)}
              />
              <div className="form-text">Leave empty for no start date restriction.</div>
            </div>
            <div className="col-md-6">
              <label className="form-label small">Closes At</label>
              <input
                type="datetime-local"
                className="form-control"
                value={form.closes_at}
                onChange={(e) => handleChange('closes_at', e.target.value)}
              />
              <div className="form-text">Leave empty for no end date restriction.</div>
            </div>
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="card p-4">
          <label className="form-label fw-bold">Messages</label>

          <div className="mb-3">
            <label className="form-label small">Banner Message When Open</label>
            <input
              className="form-control"
              value={form.open_message}
              onChange={(e) => handleChange('open_message', e.target.value)}
              placeholder="e.g., 2026/2027 applications are now open!"
            />
            <div className="form-text">This message appears on the admission banner when open.</div>
          </div>

          <div>
            <label className="form-label small">Message When Closed</label>
            <input
              className="form-control"
              value={form.closed_message}
              onChange={(e) => handleChange('closed_message', e.target.value)}
              placeholder="e.g., Admissions are currently closed. Please check back later."
            />
            <div className="form-text">This message appears on the admission page when closed.</div>
          </div>
        </div>

        {/* ── Preview ── */}
        {form.is_open && (
          <div className="card p-4 border-success bg-success bg-opacity-10">
            <h6 className="text-success mb-2">
              <i className="bi bi-eye me-2"></i>Preview
            </h6>
            <div className="p-3 bg-white rounded border border-success">
              <div className="fw-bold text-success">✅ Admissions Open</div>
              <div className="text-muted small">
                {form.open_message || "Applications are currently being accepted."}
              </div>
              {form.academic_year && (
                <div className="mt-2 badge bg-primary">
                  {form.academic_year}
                </div>
              )}
              {form.opens_at && (
                <div className="mt-1 small text-muted">
                  Opens: {new Date(form.opens_at).toLocaleString()}
                </div>
              )}
              {form.closes_at && (
                <div className="small text-muted">
                  Closes: {new Date(form.closes_at).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Submit ── */}
        {/* <button
          type="submit"
          className="btn btn-primary btn-lg mt-3"
          disabled={saveMutation.isLoading}
        >
          {saveMutation.isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Saving...
            </>
          ) : (
            <>
              <i className="bi bi-save me-2"></i>
              Save Settings
            </>
          )}
        </button> */}

        <button
          type="submit"
          className="btn btn-primary btn-lg mt-3"
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
              />
              Saving...
            </>
          ) : (
            <>
              <i className="bi bi-save me-2" />
              Save Settings
            </>
          )}
        </button>

        {/* ── Last Updated ── */}
        {data?.updated_at && (
          <div className="text-center text-muted small mt-2">
            Last updated: {new Date(data.updated_at).toLocaleString()}
          </div>
        )}
      </form>
    </div>
  );
}