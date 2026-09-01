import { useState, useMemo, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import {
    useStudentFeeSearch,
    useStudentFees,
    useGenerateInvoice,
    useRecordPayment,
} from "../../api/fees";
import { Modal, Field, useDebounced } from "../../components/ui";

const xaf = (n) => Number(n || 0).toLocaleString() + " FCFA";
const INV_ST = {
    paid: ["Paid", "mg-status-green"],
    partial: ["Partial", "mg-status-amber"],
    unpaid: ["Pending", "mg-status-blue"],
    void: ["Void", "mg-status-gray"],
};

export default function PayStudentFeesModal({ onClose }) {
    /* ── Phase 1: Student search ── */
    const [query, setQuery] = useState("");
    const debounced = useDebounced(query, 300);
    const [student, setStudent] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const { data: results, isFetching: searching } = useStudentFeeSearch(debounced);

    /* ── Close dropdown on outside click ── */
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setDropdownOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const pickStudent = (s) => {
        setStudent(s);
        setQuery("");
        setDropdownOpen(false);
    };

    /* ── Phase 2: Fee details ── */
    const { data: feeData, isLoading: loadingFees } = useStudentFees(student?.id);

    return (
        <Modal
            title={student ? `Pay Fees — ${student.name}` : "Pay Student Fees"}
            onClose={onClose}
            wide
            footer={
                student
                    ? <button className="btn btn-light" onClick={() => setStudent(null)}>
                        ← Choose a different student
                    </button>
                    : <button className="btn btn-light" onClick={onClose}>Cancel</button>
            }
        >
            {/* ── SEARCH ── */}
            {!student && (
                <div>
                    <label style={s.sectionLabel}>
                        <span className="material-symbols-outlined" style={s.labelIcon}>person_search</span>
                        Search Student
                    </label>
                    <div style={{ position: "relative" }} ref={dropdownRef}>
                        <input
                            className="form-control"
                            placeholder="Type name or admission number…"
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setDropdownOpen(true); }}
                            onFocus={() => setDropdownOpen(true)}
                            autoFocus
                        />
                        {dropdownOpen && debounced.trim().length >= 2 && (
                            <div style={s.dropdown}>
                                {searching && <div style={s.ddItem}>Searching…</div>}
                                {!searching && (results?.length ?? 0) === 0 && (
                                    <div style={s.ddItem}>No students match "{debounced}".</div>
                                )}
                                {(results ?? []).map((r) => (
                                    <button key={r.id} style={s.ddItem} onClick={() => pickStudent(r)}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--primary)" }}>person</span>
                                        <div style={{ textAlign: "left" }}>
                                            <div className="fw-semibold" style={{ fontSize: 13.5 }}>{r.name}</div>
                                            <div style={{ fontSize: 12, color: "var(--secondary)" }}>
                                                {r.class ?? "No class"} • {r.admission_number ?? `ID ${r.id}`}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── LOADING ── */}
            {student && loadingFees && (
                <div style={{ padding: "24px 0", textAlign: "center", color: "var(--secondary)", fontSize: 13 }}>
                    <span className="material-symbols-outlined" style={{ animation: "spin 1s linear infinite", fontSize: 20 }}>progress_activity</span>
                    Loading fee details…
                </div>
            )}

            {/* ── FEE DETAILS ── */}
            {student && !loadingFees && feeData && (
                <StudentFeePanel student={student} feeData={feeData} onClose={onClose} />
            )}
        </Modal>
    );
}

/* ────────────────────────────────────────────────────────────
   INNER PANEL: invoices + payment + invoice generation
   ──────────────────────────────────────────────────────────── */

function StudentFeePanel({ student, feeData, onClose }) {
    const { invoices, fee_structures: feeStructures, terms, total_outstanding } = feeData;

    const payableInvoices = invoices.filter((i) => i.balance > 0);
    const hasPayable = payableInvoices.length > 0;

    /* ── View mode: "pay" or "raise" ── */
    const [mode, setMode] = useState(hasPayable ? "pay" : "raise");

    /* ── Pay-mode state ── */
    const [checkedIds, setCheckedIds] = useState(new Set());
    const [allocations, setAllocations] = useState({});
    const [lumpSum, setLumpSum] = useState("");
    const [method, setMethod] = useState("cash");
    const [reference, setReference] = useState("");
    const [errors, setErrors] = useState({});

    const recordPayment = useRecordPayment();

    /* ── Raise-mode state ── */
    const [termId, setTermId] = useState(terms[0]?.id ?? "");
    const [selectedFeeIds, setSelectedFeeIds] = useState(new Set());
    const [adhocItems, setAdhocItems] = useState([]); // { description, amount }

    const generateInvoice = useGenerateInvoice();

    /* ── Derived ── */
    const totalPayment = [...checkedIds].reduce(
        (sum, id) => sum + Number(allocations[id] || 0), 0
    );

    const raiseTotal = useMemo(() => {
        let sum = 0;
        for (const fs of feeStructures) {
            if (selectedFeeIds.has(fs.id)) sum += fs.amount;
        }
        for (const item of adhocItems) sum += Number(item.amount || 0);
        return sum;
    }, [feeStructures, selectedFeeIds, adhocItems]);

    /* ── Handlers: Pay mode ── */

    const toggleInvoice = (inv) => {
        setCheckedIds((prev) => {
            const next = new Set(prev);
            if (next.has(inv.id)) {
                next.delete(inv.id);
                setAllocations((a) => { const c = { ...a }; delete c[inv.id]; return c; });
            } else {
                next.add(inv.id);
                setAllocations((a) => ({ ...a, [inv.id]: String(inv.balance) }));
            }
            return next;
        });
    };

    const toggleAll = () => {
        if (checkedIds.size === payableInvoices.length) {
            setCheckedIds(new Set());
            setAllocations({});
        } else {
            setCheckedIds(new Set(payableInvoices.map((i) => i.id)));
            const a = {};
            payableInvoices.forEach((i) => { a[i.id] = String(i.balance); });
            setAllocations(a);
        }
    };

    const applyLumpSum = (raw) => {
        const total = Number(raw || 0);
        setLumpSum(raw);
        if (total <= 0) return;
        let remaining = total;
        const nextAlloc = {};
        const nextChecked = new Set();
        // FIFO: oldest due date first, then by id
        const sorted = [...payableInvoices].sort((a, b) => {
            const da = a.due_on ?? "9999-12-31";
            const db = b.due_on ?? "9999-12-31";
            return da === db ? a.id - b.id : da.localeCompare(db);
        });
        for (const inv of sorted) {
            if (remaining <= 0) break;
            const give = Math.min(inv.balance, remaining);
            nextAlloc[inv.id] = String(give);
            nextChecked.add(inv.id);
            remaining -= give;
        }
        setAllocations(nextAlloc);
        setCheckedIds(nextChecked);
    };

    const submitPayments = async () => {
        setErrors({});
        if (checkedIds.size === 0) return toast.error("Select at least one invoice.");

        const payments = [...checkedIds]
            .map((id) => ({ invoiceId: id, amount: Number(allocations[id] || 0), invoice: payableInvoices.find((i) => i.id === id) }))
            .filter((p) => p.amount > 0);

        if (payments.length === 0) return toast.error("Enter amounts for selected invoices.");

        for (const p of payments) {
            if (p.amount > p.invoice.balance) {
                return toast.error(
                    `Amount for ${p.invoice.number} exceeds balance of ${xaf(p.invoice.balance)}.`
                );
            }
        }

        try {
            for (const p of payments) {
                await recordPayment.mutateAsync({
                    invoiceId: p.invoiceId,
                    amount: p.amount,
                    method,
                    provider_reference: reference || undefined,
                });
            }
            toast.success(`Payment of ${xaf(totalPayment)} recorded for ${student.name}.`);
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Could not record payment.");
            if (err?.response?.data?.errors) setErrors(err.response.data.errors);
        }
    };

    /* ── Handlers: Raise mode ── */

    const toggleFeeItem = (fs) => {
        setSelectedFeeIds((prev) => {
            const next = new Set(prev);
            next.has(fs.id) ? next.delete(fs.id) : next.add(fs.id);
            return next;
        });
    };

    const addAdhocItem = () => setAdhocItems((prev) => [...prev, { description: "", amount: "" }]);
    const removeAdhocItem = (idx) => setAdhocItems((prev) => prev.filter((_, i) => i !== idx));
    const updateAdhocItem = (idx, field, value) =>
        setAdhocItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));

    const submitInvoice = async () => {
        if (!termId) return toast.error("Choose a term.");
        const items = [];
        for (const fs of feeStructures) {
            if (selectedFeeIds.has(fs.id)) items.push({ description: fs.name, amount: fs.amount, fee_structure_id: fs.id });
        }
        for (const adhoc of adhocItems) {
            if (!adhoc.description.trim()) return toast.error("Ad-hoc item description is required.");
            if (!adhoc.amount || Number(adhoc.amount) <= 0) return toast.error("Ad-hoc item amount must be positive.");
            items.push({ description: adhoc.description.trim(), amount: Number(adhoc.amount) });
        }
        if (items.length === 0) return toast.error("Select at least one fee item.");

        try {
            await generateInvoice.mutateAsync({ studentId: student.id, term_id: termId, items });
            toast.success("Invoice raised. You can now pay against it.");
            setMode("pay"); // Switch back to pay mode — the query will auto-refresh
        } catch (err) {
            toast.error(err?.response?.data?.message || "Could not raise invoice.");
        }
    };

    /* ── Render ── */
    return (
        <div className="d-flex flex-column gap-3">

            {/* Student info card */}
            <div style={s.studentCard}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={s.avatarCircle}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--primary)" }}>person</span>
                    </div>
                    <div>
                        <div className="fw-semibold" style={{ fontSize: 14 }}>{student.name}</div>
                        <div style={{ fontSize: 12, color: "var(--secondary)" }}>
                            {student.class ?? "No class"} • {student.admission_number ?? `ID ${student.id}`}
                            {feeData.student.academic_year && ` • ${feeData.student.academic_year}`}
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--secondary)" }}>Total outstanding</div>
                    <div className="fw-semibold" style={{ fontSize: 16, color: "#b91c1c" }}>{xaf(total_outstanding)}</div>
                </div>
            </div>

            {/* Mode switcher */}
            {hasPayable && (
                <div style={s.modeTabs}>
                    <button
                        style={{ ...s.modeTab, ...(mode === "pay" ? s.modeTabActive : {}) }}
                        onClick={() => setMode("pay")}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>payments</span>
                        Pay invoices
                    </button>
                    <button
                        style={{ ...s.modeTab, ...(mode === "raise" ? s.modeTabActive : {}) }}
                        onClick={() => setMode("raise")}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>receipt_long</span>
                        Raise new invoice
                    </button>
                </div>
            )}

            {/* ── PAY MODE ── */}
            {mode === "pay" && (
                <>
                    {!hasPayable && (
                        <div style={s.emptyState}>
                            <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#94a3b8" }}>check_circle</span>
                            <div>This student has no outstanding invoices.</div>
                            {feeStructures.length > 0 && (
                                <button className="btn btn-sm btn-outline-primary mt-2" onClick={() => setMode("raise")}>
                                    Raise a new invoice
                                </button>
                            )}
                        </div>
                    )}

                    {hasPayable && (
                        <>
                            {/* Lump-sum quick-pay */}
                            <div style={s.lumpRow}>
                                <label style={{ fontSize: 12, color: "var(--secondary)" }}>Quick-pay lump sum</label>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        style={{ maxWidth: 180 }}
                                        placeholder="Enter total amount…"
                                        value={lumpSum}
                                        onChange={(e) => applyLumpSum(e.target.value)}
                                    />
                                    {lumpSum && (
                                        <button className="btn btn-sm btn-outline-secondary" onClick={() => { setLumpSum(""); setAllocations({}); setCheckedIds(new Set()); }}>
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Invoice header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                <label style={s.sectionLabel}>
                                    <span className="material-symbols-outlined" style={s.labelIcon}>receipt_long</span>
                                    Outstanding Invoices
                                </label>
                                <button className="btn btn-sm btn-link" style={{ fontSize: 12, padding: 0 }} onClick={toggleAll}>
                                    {checkedIds.size === payableInvoices.length ? "Uncheck all" : "Check all"}
                                </button>
                            </div>

                            {/* Invoice cards */}
                            <div style={s.invoiceList}>
                                {payableInvoices.map((inv) => {
                                    const checked = checkedIds.has(inv.id);
                                    const allocAmt = Number(allocations[inv.id] || 0);
                                    const overpay = allocAmt > inv.balance;
                                    const [sl, sc] = INV_ST[inv.status] ?? [inv.status, "mg-status-gray"];
                                    return (
                                        <div key={inv.id} style={{
                                            ...s.invoiceCard,
                                            borderColor: checked ? "var(--primary)" : "#e2e8f0",
                                            background: checked ? "rgba(var(--primary-rgb, 67,56,202),0.03)" : "#fff",
                                        }}>
                                            <div style={s.invHeader}>
                                                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 0 }}>
                                                    <input type="checkbox" checked={checked} onChange={() => toggleInvoice(inv)} style={{ accentColor: "var(--primary)" }} />
                                                    <div>
                                                        <span className="fw-semibold" style={{ fontSize: 13 }}>{inv.number}</span>
                                                        {inv.term && <span style={{ fontSize: 12, color: "var(--secondary)", marginLeft: 8 }}>{inv.term}</span>}
                                                    </div>
                                                </label>
                                                <span className={`mg-status ${sc}`}>{sl}</span>
                                            </div>
                                            <div style={s.invBody}>
                                                <div style={s.invAmounts}>
                                                    <span>Total: <strong>{xaf(inv.total)}</strong></span>
                                                    <span>Paid: <strong style={{ color: "#15803d" }}>{xaf(inv.amount_paid)}</strong></span>
                                                    <span>Balance: <strong style={{ color: "#b91c1c" }}>{xaf(inv.balance)}</strong></span>
                                                    {inv.due_on && <span style={{ fontSize: 11 }}>Due: {inv.due_on}</span>}
                                                </div>
                                                {inv.items.length > 0 && (
                                                    <div style={{ fontSize: 11, color: "var(--secondary)", marginTop: 4 }}>
                                                        {inv.items.map((it) => `${it.description} (${xaf(it.amount)})`).join(" • ")}
                                                    </div>
                                                )}
                                                {checked && (
                                                    <div style={s.invPayRow}>
                                                        <label style={{ fontSize: 12, color: "var(--secondary)", whiteSpace: "nowrap" }}>Amount to pay</label>
                                                        <input
                                                            type="number"
                                                            className={`form-control form-control-sm ${overpay ? "is-invalid" : ""}`}
                                                            style={{ maxWidth: 160 }}
                                                            value={allocations[inv.id] ?? ""}
                                                            onChange={(e) => setAllocations((a) => ({ ...a, [inv.id]: e.target.value }))}
                                                            min={1}
                                                            max={inv.balance}
                                                            placeholder={String(inv.balance)}
                                                        />
                                                        {overpay && <span style={{ fontSize: 11, color: "#dc2626" }}>Exceeds balance</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Payment details */}
                            <div>
                                <label style={s.sectionLabel}>
                                    <span className="material-symbols-outlined" style={s.labelIcon}>credit_card</span>
                                    Payment Details
                                </label>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    <label>Method
                                        <select className="form-select" value={method} onChange={(e) => setMethod(e.target.value)}>
                                            <option value="cash">Cash</option>
                                            <option value="momo">MTN MoMo</option>
                                            <option value="orange_money">Orange Money</option>
                                            <option value="bank">Bank Transfer</option>
                                        </select>
                                    </label>
                                    <label>Reference (optional)
                                        <input className="form-control" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Txn ref / cheque #" />
                                    </label>
                                </div>
                            </div>

                            {/* Total bar */}
                            {totalPayment > 0 && (
                                <div style={s.totalBar}>
                                    <span style={{ fontSize: 13 }}>
                                        Total Payment ({checkedIds.size} invoice{checkedIds.size !== 1 ? "s" : ""})
                                    </span>
                                    <strong style={{ fontSize: 18, color: "var(--primary)" }}>{xaf(totalPayment)}</strong>
                                </div>
                            )}

                            <button
                                className="btn btn-primary"
                                onClick={submitPayments}
                                disabled={recordPayment.isPending || checkedIds.size === 0 || totalPayment === 0}
                            >
                                {recordPayment.isPending ? "Recording…" : totalPayment > 0 ? `Record ${xaf(totalPayment)}` : "Record Payment"}
                            </button>
                        </>
                    )}
                </>
            )}

            {/* ── RAISE MODE ── */}
            {mode === "raise" && (
                <>
                    <label style={s.sectionLabel}>
                        <span className="material-symbols-outlined" style={s.labelIcon}>receipt_add</span>
                        Raise New Invoice
                    </label>

                    <Field label="Term" required>
                        <select className="form-select" value={termId} onChange={(e) => setTermId(e.target.value)}>
                            <option value="">Choose term…</option>
                            {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </Field>

                    {/* Fee structure items */}
                    {feeStructures.length > 0 && (
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--secondary)", marginBottom: 6 }}>
                                Fee structure items for {student.class ?? "this class"}
                            </label>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {feeStructures.map((fs) => (
                                    <label key={fs.id} style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "6px 10px",
                                        borderRadius: 6,
                                        border: selectedFeeIds.has(fs.id) ? "1px solid var(--primary)" : "1px solid #e2e8f0",
                                        background: selectedFeeIds.has(fs.id) ? "rgba(var(--primary-rgb, 67,56,202),0.04)" : "#fff",
                                        cursor: "pointer",
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedFeeIds.has(fs.id)}
                                            onChange={() => toggleFeeItem(fs)}
                                            style={{ accentColor: "var(--primary)" }}
                                        />
                                        <span style={{ fontSize: 13 }}>
                                            {fs.name} — <strong>{xaf(fs.amount)}</strong>
                                            {!fs.is_mandatory && <span style={{ fontSize: 11, color: "var(--secondary)" }}> (optional)</span>}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Ad-hoc items */}
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--secondary)", marginBottom: 6 }}>
                            Ad-hoc charges
                        </label>
                        {adhocItems.map((item, idx) => (
                            <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 120px 32px", gap: 6, marginBottom: 6 }}>
                                <input
                                    className="form-control form-control-sm"
                                    placeholder="Description (e.g. Sports uniform)"
                                    value={item.description}
                                    onChange={(e) => updateAdhocItem(idx, "description", e.target.value)}
                                />
                                <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    placeholder="Amount"
                                    value={item.amount}
                                    onChange={(e) => updateAdhocItem(idx, "amount", e.target.value)}
                                />
                                <button className="btn btn-sm btn-outline-danger" onClick={() => removeAdhocItem(idx)} style={{ padding: "2px 6px" }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
                                </button>
                            </div>
                        ))}
                        <button className="btn btn-sm btn-outline-secondary" onClick={addAdhocItem}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span> Add line
                        </button>
                    </div>

                    {/* Raise total */}
                    {raiseTotal > 0 && (
                        <div style={s.totalBar}>
                            <span style={{ fontSize: 13 }}>Invoice total</span>
                            <strong style={{ fontSize: 18, color: "var(--primary)" }}>{xaf(raiseTotal)}</strong>
                        </div>
                    )}

                    <button
                        className="btn btn-primary"
                        onClick={submitInvoice}
                        disabled={generateInvoice.isPending || raiseTotal === 0}
                    >
                        {generateInvoice.isPending ? "Raising…" : raiseTotal > 0 ? `Raise Invoice — ${xaf(raiseTotal)}` : "Raise Invoice"}
                    </button>
                </>
            )}
        </div>
    );
}

/* ── Styles ── */
const s = {
    sectionLabel: { fontSize: 13, fontWeight: 600, color: "var(--secondary)", marginBottom: 6, display: "block" },
    labelIcon: { fontSize: 16, verticalAlign: -3, marginRight: 4 },
    dropdown: {
        position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
        background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
        maxHeight: 260, overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,.12)", marginTop: 4,
    },
    ddItem: {
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        padding: "10px 14px", border: "none", background: "transparent",
        cursor: "pointer", fontSize: 13, textAlign: "left", color: "inherit",
    },
    studentCard: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 14px", border: "1px solid var(--primary)", borderRadius: 8,
        background: "rgba(var(--primary-rgb, 67,56,202),0.04)",
    },
    avatarCircle: {
        width: 38, height: 38, borderRadius: "50%",
        background: "var(--primary-light, #e0e7ff)",
        display: "flex", alignItems: "center", justifyContent: "center",
    },
    modeTabs: { display: "flex", gap: 8, marginBottom: 4 },
    modeTab: {
        display: "flex", alignItems: "center", gap: 4, padding: "6px 14px",
        borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff",
        fontSize: 13, cursor: "pointer", color: "var(--secondary)",
    },
    modeTabActive: { borderColor: "var(--primary)", background: "rgba(var(--primary-rgb, 67,56,202),0.06)", color: "var(--primary)" },
    emptyState: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "24px 0", color: "var(--secondary)", fontSize: 13 },
    lumpRow: {
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        padding: "8px 12px", marginBottom: 8, background: "#f8fafc",
        borderRadius: 6, border: "1px dashed #cbd5e1",
    },
    invoiceList: { display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto", paddingRight: 4 },
    invoiceCard: { border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", transition: "all .15s" },
    invHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    invBody: { marginTop: 6, paddingLeft: 26 },
    invAmounts: { display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "var(--secondary)" },
    invPayRow: { display: "flex", alignItems: "center", gap: 8, marginTop: 8 },
    totalBar: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: 16, padding: "12px 16px",
        background: "linear-gradient(135deg, rgba(var(--primary-rgb, 67,56,202),.06), rgba(var(--primary-rgb, 67,56,202),.02))",
        borderRadius: 8, border: "1px solid rgba(var(--primary-rgb, 67,56,202),.15)",
    },
};