import toast from "react-hot-toast";

export function MgTabs({ tabs, value, onChange, counts }) {
  return (
    <div className="mg-tabs">
      {tabs.map((t) => (
        <button key={t.key || "all"} className={`mg-tab mg-tab-${t.tone} ${value === t.key ? "active" : ""}`}
          onClick={() => onChange(t.key)}>
          {t.label} ({counts?.[t.countKey] ?? 0})
        </button>
      ))}
    </div>
  );
}

export function MgPager({ page }) {
  // `page` is the raw paginator object { current_page, last_page, from, to, total }
  return page;
}

export function Pager({ meta, setPage, unit = "entries" }) {
  const cur = meta?.current_page ?? 1;
  const last = meta?.last_page ?? 1;
  return (
    <div className="mg-foot">
      <span className="lbl">{meta ? `Showing ${meta.from ?? 0} to ${meta.to ?? 0} of ${meta.total} ${unit}` : "—"}</span>
      <div className="mg-pager">
        <button disabled={cur <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
        <span className="mg-page-cur">{cur}</span>
        <button disabled={cur >= last} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}

export function Kpi({ tone, label, value, icon, onClick, dim }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag className={`mg-kpi mg-kpi-${tone} ${dim ? "op" : ""}`} onClick={onClick}
      style={onClick ? { border: 0, textAlign: "left", cursor: "pointer" } : undefined}>
      <div className="kl">{label}</div>
      <div className="kv">{value ?? "—"}</div>
      <div className="ki"><span className="material-symbols-outlined">{icon}</span></div>
    </Tag>
  );
}

export function csvExport(filename, headers, rows, pick) {
  if (!rows.length) return toast.error("Nothing to export.");
  const esc = (v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`;
  const lines = [headers.join(",")];
  rows.forEach((r) => lines.push(pick(r).map(esc).join(",")));
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV exported");
}

export function printRows(title, headers, rows, pick) {
  if (!rows.length) return toast.error("Nothing to print.");
  const head = `<tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>`;
  const body = rows.map((r) => `<tr>${pick(r).map((c) => `<td>${c ?? ""}</td>`).join("")}</tr>`).join("");
  const w = window.open("", "_blank");
  if (!w) return toast.error("Allow pop-ups to print.");
  w.document.write(`<html><head><title>${title}</title><style>body{font-family:Inter,Arial,sans-serif;padding:24px}h1{font-size:18px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#f0f2f5}</style></head><body><h1>${title}</h1><table>${head}${body}</table></body></html>`);
  w.document.close(); w.focus(); w.print();
}
