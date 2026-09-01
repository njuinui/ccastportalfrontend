
import { useEffect, useState } from "react";

/* Money in XAF (integer minor units are whole francs here). */
export function xaf(amount) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-CM").format(amount) + " XAF";
}

export function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

/* Debounce a fast-changing value (e.g. a search box). */
export function useDebounced(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-4">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      {actions && <div className="d-flex gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon, trend }) {
  const isFa = typeof icon === "string" && icon.startsWith("fa-");
  return (
    <div className="surface-card stat-card h-100 d-flex justify-content-between align-items-start">
      <div>
        <div className="k">{label}</div>
        <div className="v">{value ?? "—"}</div>
        {hint && <div className="h">{hint}</div>}
        {trend && (
          <div className="h d-flex align-items-center gap-1" style={{ color: trend.dir === "down" ? "#b91c1c" : "#15803d", marginTop: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {trend.dir === "down" ? "trending_down" : "trending_up"}
            </span>
            <span style={{ fontWeight: 600 }}>{trend.text}</span>
          </div>
        )}
      </div>
      {icon && (
        <div className="ic">
          {isFa ? <i className={`fa-solid ${icon}`} /> : <span className="material-symbols-outlined">{icon}</span>}
        </div>
      )}
    </div>
  );
}

const PILL_MAP = {
  active: "pill-green", enrolled: "pill-green", present: "pill-green", paid: "pill-green", published: "pill-green",
  graduated: "pill-blue", promoted: "pill-blue", ongoing: "pill-blue",
  partial: "pill-amber", late: "pill-amber", pending: "pill-amber", planned: "pill-amber", unpaid: "pill-amber",
  withdrawn: "pill-gray", excused: "pill-gray", transferred: "pill-gray", void: "pill-gray",
  suspended: "pill-red", absent: "pill-red", failed: "pill-red",
};
export function StatusPill({ status }) {
  return <span className={`pill ${PILL_MAP[status] ?? "pill-gray"}`}>{status}</span>;
}

/* Bootstrap-styled modal (no jQuery, controlled by React). */
export function Modal({ title, onClose, children, footer, size = "" }) {
  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(15,23,42,.5)" }} onMouseDown={onClose}>
      <div className={`modal-dialog modal-dialog-centered ${size}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-content border-0" style={{ borderRadius: 16 }}>
          <div className="modal-header">
            <h5 className="modal-title fw-bold">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export function Field({ label, error, children, required }) {
  return (
    <div className="mb-3">
      <label className="form-label small fw-semibold text-secondary">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {error && <div className="text-danger small mt-1">{error}</div>}
    </div>
  );
}

export function StateRow({ colSpan, loading, error, empty, emptyText = "No records yet." }) {
  if (loading) return <tr><td colSpan={colSpan} className="state-cell"><span className="spinner-border spinner-border-sm me-2" />Loading…</td></tr>;
  if (error) return <tr><td colSpan={colSpan} className="state-cell text-danger">Couldn’t load data. Is the API running?</td></tr>;
  if (empty) return <tr><td colSpan={colSpan} className="state-cell">{emptyText}</td></tr>;
  return null;
}
