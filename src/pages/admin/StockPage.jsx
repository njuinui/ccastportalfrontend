import { useState } from "react";
import toast from "react-hot-toast";
import { Stock, useStockAdjust } from "../../api/admin18";
import { confirmDelete, confirmAction } from "../../lib/alerts";
import { Modal, Field, useDebounced } from "../../components/ui";
import { Pager, Kpi, csvExport, printRows } from "./_shell";
import "../../styles/mgmt.css";

const CATS = ["Stationery", "Cleaning", "Kitchen", "Lab", "Medical", "Sports", "Other"];
const CAT_TONE = { Stationery: "mg-chip-blue", Cleaning: "mg-chip-teal", Kitchen: "mg-chip-amber", Lab: "mg-chip-red", Medical: "mg-chip-purple", Sports: "mg-chip-green", Other: "mg-chip-gray" };
const BLANK = { code: "", name: "", category: "Stationery", unit: "pcs", stock_qty: 0, reorder_at: 0, unit_value: 0, vendor: "" };

export default function StockPage() {
  const [cat, setCat] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const debounced = useDebounced(search);

  const { data: meta } = Stock.useMeta();
  const { data, isLoading, isError, isFetching } = Stock.useList({ category: cat || undefined, low_stock: lowOnly ? 1 : undefined, search: debounced || undefined, page });
  const del = Stock.useRemove();
  const adjust = useStockAdjust();
  const rows = data?.data ?? [];
  const k = meta?.kpis ?? {};

  const remove = async (r) => { if (!(await confirmDelete({ title: "Delete item?", text: `${r.name} will be removed.`, confirmText: "Delete" }))) return; try { await del.mutateAsync(r.id); toast.success("Item deleted"); } catch { toast.error("Permission denied."); } };
  const doAdjust = async (r, sign) => {
    const v = window.prompt(`${sign > 0 ? "Stock in" : "Stock out"} — quantity for ${r.name}:`, "1");
    const n = parseInt(v, 10); if (!n || n < 0) return;
    try { await adjust.mutateAsync({ id: r.id, delta: sign * n }); toast.success("Stock updated"); } catch { toast.error("Could not update."); }
  };

  return (
    <div className="mg-page">
      <div className="mg-head">
        <div><div className="mg-title"><span className="material-symbols-outlined">inventory_2</span><h1>Stock / Inventory</h1></div>
          <div className="mg-crumb">CCAST Bambili <span className="material-symbols-outlined">chevron_right</span> Records <span className="material-symbols-outlined">chevron_right</span> Inventory
            {isFetching && <span className="mg-sync"><span className="material-symbols-outlined">sync</span> syncing…</span>}</div></div>
        <button className="mg-add" onClick={() => setEditing(BLANK)}><span className="material-symbols-outlined">add</span> Add Item</button>
      </div>

      <div className="mg-kpis" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <Kpi tone="navy" label="Total Items" value={k.total_items} icon="inventory" />
        <Kpi tone="green" label="Total Value (XAF)" value={k.total_value != null ? Number(k.total_value).toLocaleString() : "—"} icon="payments" />
        <Kpi tone="amber" label="Low Stock" value={k.low_stock} icon="warning" onClick={() => { setLowOnly((v) => !v); setPage(1); }} dim={!lowOnly} />
      </div>

      <div className="mg-tabs">
        <button className={`mg-tab mg-tab-dark ${!cat ? "active" : ""}`} onClick={() => { setCat(""); setPage(1); }}>All ({meta?.counts?.all ?? 0})</button>
        {CATS.map((c) => <button key={c} className={`mg-tab mg-tab-gray ${cat === c ? "active" : ""}`} onClick={() => { setCat(c); setPage(1); }}>{c} ({meta?.counts?.[c] ?? 0})</button>)}
      </div>

      <div className="surface-card mg-tablecard">
        <div className="mg-toolbar">
          <div className="mg-exports">
            <button className="mg-exp mg-exp-csv" onClick={() => csvExport("stock.csv", ["Code", "Name", "Category", "Unit", "Stock", "Reorder", "Value", "Vendor"], rows, (r) => [r.code, r.name, r.category, r.unit, r.stock_qty, r.reorder_at, r.unit_value, r.vendor])}><span className="material-symbols-outlined">table_view</span> CSV</button>
            <button className="mg-exp mg-exp-pdf" onClick={() => printRows("Stock", ["Code", "Name", "Category", "Stock", "Reorder", "Vendor"], rows, (r) => [r.code, r.name, r.category, r.stock_qty, r.reorder_at, r.vendor])}><span className="material-symbols-outlined">picture_as_pdf</span> PDF</button>
            <button className="mg-exp mg-exp-print" onClick={() => printRows("Stock", ["Code", "Name", "Category", "Stock", "Reorder", "Vendor"], rows, (r) => [r.code, r.name, r.category, r.stock_qty, r.reorder_at, r.vendor])}><span className="material-symbols-outlined">print</span> PRINT</button>
          </div>
          <label className="mg-tsearch">Search:<input className="form-control form-control-sm" placeholder="name, code…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label>
        </div>
        <div className="table-responsive">
          <table className="table mg-table align-middle mb-0">
            <thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Unit</th><th className="text-center">Stock</th><th className="text-center">Reorder At</th><th>Vendor</th><th className="text-center">Actions</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="state-cell">Loading…</td></tr>}
              {isError && <tr><td colSpan={8} className="state-cell text-danger">Couldn't load stock.</td></tr>}
              {!isLoading && !isError && rows.length === 0 && <tr><td colSpan={8} className="state-cell">No items match.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><span className="mg-id">{r.code}</span></td>
                  <td className="fw-semibold" style={{ fontSize: 13.5 }}>{r.name}</td>
                  <td><span className={`mg-chip ${CAT_TONE[r.category] ?? "mg-chip-gray"}`}>{r.category}</span></td>
                  <td className="text-secondary">{r.unit}</td>
                  <td className="text-center"><span className={r.low ? "mg-qty-low" : "fw-semibold"}>{r.stock_qty}</span></td>
                  <td className="text-center text-secondary">{r.reorder_at}</td>
                  <td className="text-secondary" style={{ fontSize: 12.5 }}>{r.vendor || "—"}</td>
                  <td><div className="mg-actions justify-content-center">
                    <button title="Stock in" onClick={() => doAdjust(r, 1)}><span className="material-symbols-outlined">login</span></button>
                    <button title="Stock out" onClick={() => doAdjust(r, -1)}><span className="material-symbols-outlined">logout</span></button>
                    <button title="Edit" className="edit" onClick={() => setEditing(r)}><span className="material-symbols-outlined">edit</span></button>
                    <button title="Delete" className="del" onClick={() => remove(r)}><span className="material-symbols-outlined">delete</span></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager meta={data} setPage={setPage} unit="items" />
      </div>
      {editing && <ItemForm initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ItemForm({ initial, onClose }) {
  const save = Stock.useSave();
  const [form, setForm] = useState({ ...BLANK, ...initial });
  const [errors, setErrors] = useState({});
  const isEdit = !!initial.id;
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const submit = async () => { setErrors({}); try { await save.mutateAsync(form); toast.success(isEdit ? "Item updated" : "Item added"); onClose(); } catch (err) { setErrors(err.fieldErrors ?? {}); if (!err.fieldErrors) toast.error("Could not save."); } };
  return (
    <Modal title={isEdit ? "Edit item" : "New item"} onClose={onClose} size="modal-lg"
      footer={<><button className="btn btn-light" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</button></>}>
      <div className="row">
        <div className="col-md-4"><Field label="Code" required error={errors.code}><input className="form-control" value={form.code} onChange={set("code")} /></Field></div>
        <div className="col-md-8"><Field label="Name" required error={errors.name}><input className="form-control" value={form.name} onChange={set("name")} /></Field></div>
        <div className="col-md-4"><Field label="Category"><select className="form-select" value={form.category} onChange={set("category")}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></Field></div>
        <div className="col-md-4"><Field label="Unit"><input className="form-control" value={form.unit} onChange={set("unit")} /></Field></div>
        <div className="col-md-4"><Field label="Vendor"><input className="form-control" value={form.vendor ?? ""} onChange={set("vendor")} /></Field></div>
        <div className="col-md-4"><Field label="Stock qty" error={errors.stock_qty}><input type="number" className="form-control" value={form.stock_qty} onChange={set("stock_qty")} /></Field></div>
        <div className="col-md-4"><Field label="Reorder at" error={errors.reorder_at}><input type="number" className="form-control" value={form.reorder_at} onChange={set("reorder_at")} /></Field></div>
        <div className="col-md-4"><Field label="Unit value (XAF)" error={errors.unit_value}><input type="number" className="form-control" value={form.unit_value} onChange={set("unit_value")} /></Field></div>
      </div>
    </Modal>
  );
}
