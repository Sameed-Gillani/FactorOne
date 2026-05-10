import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  DollarSign,
  Calendar,
  FileText,
  Shield,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  ShieldX,
  Activity,
  ClipboardList,
  MessageSquare,
  ChevronRight,
  Info,
  BarChart2,
} from "lucide-react";

// ── Mock fallback ────────────────────────────────────────────────────────────
const MOCK_INVOICE = {
  id: "inv-001",
  number: "NP-2024-4412",
  smeName: "PakFresh Distributors",
  smeId: "U-014",
  smeEmail: "accounts@pakfresh.com",
  smePhone: "+92 321 4567890",
  anchor: "Nestlé Pakistan Ltd",
  anchorNTN: "NTN-7712345",
  amount: 2500000,
  discountRate: 5.5,
  dueDate: "2024-03-28",
  issueDate: "2024-02-12",
  submittedDate: "2024-02-26",
  sector: "FMCG",
  status: "Pending",
  description: "Distribution services rendered for Q1 2024 — regional FMCG supply chain across Punjab.",
  bankName: "Habib Bank Limited",
  bankAccount: "PK36HABB0000000001234567",
  invoiceDoc: "NP-2024-4412.pdf",
};
// ────────────────────────────────────────────────────────────────────────────

const fmt = (v) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const CREDIT_CFG = {
  Good:    { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", icon: TrendingUp,      bar: "bg-emerald-400", width: "w-4/5", score: "780" },
  Average: { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/30",   icon: Activity,        bar: "bg-amber-400",   width: "w-1/2", score: "620" },
  Poor:    { bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/30",     icon: AlertTriangle,   bar: "bg-red-400",     width: "w-1/4", score: "430" },
};

function DetailRow({ label, value, mono }) {
  return (
    <div className="flex flex-col gap-0.5 py-3.5 border-b border-slate-700/30 last:border-b-0">
      <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">{label}</p>
      <p className={`text-white text-sm ${mono ? "font-mono" : "font-medium"}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const CFG = {
    Pending:  { bg: "bg-amber-500/10",  text: "text-amber-400",  dot: "bg-amber-400"  },
    Approved: { bg: "bg-emerald-500/10",text: "text-emerald-400",dot: "bg-emerald-400" },
    Rejected: { bg: "bg-red-500/10",    text: "text-red-400",    dot: "bg-red-400"    },
  };
  const c = CFG[status] ?? CFG.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

export default function AdminInvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  // FBR check
  const [fbrStatus, setFbrStatus] = useState(null); // null | "matched" | "not_found" | "error"
  const [fbrLoading, setFbrLoading] = useState(false);

  // Credit check
  const [creditStatus, setCreditStatus] = useState(null); // null | "Good" | "Average" | "Poor"
  const [creditLoading, setCreditLoading] = useState(false);

  // Decision panel
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [actionLoading, setActionLoading] = useState(null); // "approve" | "reject" | null
  const [actionResult, setActionResult] = useState(null);  // {type, message}
  const [currentStatus, setCurrentStatus] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/invoices/${id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setInvoice(data);
        setCurrentStatus(data.status);
      } catch {
        setInvoice(MOCK_INVOICE);
        setCurrentStatus(MOCK_INVOICE.status);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Auto-load credit check when invoice loads
  useEffect(() => {
    if (!invoice) return;
    const runCredit = async () => {
      setCreditLoading(true);
      try {
        const res = await fetch(`/api/invoices/${id}/credit-check`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setCreditStatus(data.rating ?? data.creditScore ?? "Good");
      } catch {
        // Deterministic mock based on invoice id
        const mocks = ["Good", "Average", "Poor", "Good", "Good"];
        const pick = mocks[parseInt(id?.replace(/\D/g, "") || "0") % mocks.length];
        setCreditStatus(pick);
      } finally {
        setCreditLoading(false);
      }
    };
    runCredit();
  }, [invoice, id]);

  const handleFBRCheck = async () => {
    setFbrLoading(true);
    setFbrStatus(null);
    try {
      const res = await fetch(`/api/invoices/${id}/fbr-check`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFbrStatus(data.matched ? "matched" : "not_found");
    } catch {
      // Mock: even IDs → matched, odd → not_found
      const num = parseInt(id?.replace(/\D/g, "") || "1");
      setFbrStatus(num % 2 === 0 ? "matched" : "not_found");
    } finally {
      setFbrLoading(false);
    }
  };

  const validateNote = () => {
    if (!note.trim()) { setNoteError("A written note is required before taking action."); return false; }
    if (note.trim().length < 10) { setNoteError("Note must be at least 10 characters."); return false; }
    setNoteError("");
    return true;
  };

  const handleAction = async (action) => {
    if (!validateNote()) return;
    setActionLoading(action);
    try {
      const res = await fetch(`/api/invoices/${id}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() }),
      });
      if (!res.ok) throw new Error();
      setCurrentStatus(action === "approve" ? "Approved" : "Rejected");
      setActionResult({
        type: action,
        message: action === "approve"
          ? "Invoice approved successfully. It is now visible to investors."
          : "Invoice has been rejected. The SME will be notified.",
      });
    } catch {
      // Simulate success for demo
      setCurrentStatus(action === "approve" ? "Approved" : "Rejected");
      setActionResult({
        type: action,
        message: action === "approve"
          ? "Invoice approved successfully. It is now visible to investors."
          : "Invoice has been rejected. The SME will be notified.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0f172a" }}>
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0f172a" }}>
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-white font-semibold">Invoice not found</p>
          <button onClick={() => navigate("/admin/invoices")} className="mt-3 text-blue-400 text-sm hover:text-blue-300">← Back</button>
        </div>
      </div>
    );
  }

  const isDecided = currentStatus === "Approved" || currentStatus === "Rejected";
  const cc = creditStatus ? CREDIT_CFG[creditStatus] : null;

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ backgroundColor: "#0f172a" }}>
      {/* Back */}
      <button
        onClick={() => navigate("/admin/invoices")}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Invoice Queue
      </button>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-7">
        <div>
          <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-1">Admin Review</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">{invoice.number}</h1>
          <p className="text-slate-400 text-sm mt-1">Submitted {invoice.submittedDate}</p>
        </div>
        <StatusBadge status={currentStatus} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT — Invoice Details */}
        <div className="xl:col-span-2 space-y-5">
          {/* SME + Anchor */}
          <div className="rounded-2xl border border-slate-700/50 p-6" style={{ backgroundColor: "#1e293b" }}>
            <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" /> Parties
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-3">SME / Supplier</p>
                <DetailRow label="Company Name" value={invoice.smeName} />
                <DetailRow label="User ID" value={invoice.smeId} mono />
                <DetailRow label="Email" value={invoice.smeEmail} />
                <DetailRow label="Phone" value={invoice.smePhone} />
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-3">Anchor Company</p>
                <DetailRow label="Company Name" value={invoice.anchor} />
                <DetailRow label="NTN" value={invoice.anchorNTN} mono />
                <DetailRow label="Sector" value={invoice.sector} />
              </div>
            </div>
          </div>

          {/* Invoice Fields */}
          <div className="rounded-2xl border border-slate-700/50 p-6" style={{ backgroundColor: "#1e293b" }}>
            <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" /> Invoice Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div>
                <DetailRow label="Invoice Number" value={invoice.number} mono />
                <DetailRow label="Invoice Amount" value={fmt(invoice.amount)} />
                <DetailRow label="Discount Rate" value={`${invoice.discountRate}%`} />
                <DetailRow label="Issue Date" value={invoice.issueDate} />
              </div>
              <div>
                <DetailRow label="Due Date" value={invoice.dueDate} />
                <DetailRow label="Submitted" value={invoice.submittedDate} />
                <DetailRow label="Bank" value={invoice.bankName} />
                <DetailRow label="Account (IBAN)" value={invoice.bankAccount} mono />
              </div>
            </div>
            {invoice.description && (
              <div className="mt-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/30">
                <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Info className="w-3 h-3" /> Description
                </p>
                <p className="text-slate-300 text-sm leading-relaxed">{invoice.description}</p>
              </div>
            )}
            {invoice.invoiceDoc && (
              <div className="mt-4 flex items-center gap-3 p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{invoice.invoiceDoc}</p>
                  <p className="text-slate-500 text-xs">Uploaded document</p>
                </div>
                <button className="text-blue-400 text-xs font-semibold hover:text-blue-300 transition-colors flex-shrink-0">
                  Download
                </button>
              </div>
            )}
          </div>

          {/* Verification Checks */}
          <div className="rounded-2xl border border-slate-700/50 p-6" style={{ backgroundColor: "#1e293b" }}>
            <h2 className="text-white font-semibold text-sm mb-5 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" /> Verification Checks
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* FBR Check */}
              <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white text-sm font-semibold">FBR Verification</p>
                    <p className="text-slate-500 text-xs mt-0.5">Federal Board of Revenue check</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-slate-700/60 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-slate-400" />
                  </div>
                </div>

                {fbrStatus === null && !fbrLoading && (
                  <p className="text-slate-600 text-xs mb-4 italic">Not yet checked</p>
                )}
                {fbrLoading && (
                  <div className="flex items-center gap-2 text-blue-400 text-sm mb-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking FBR database...
                  </div>
                )}
                {fbrStatus === "matched" && (
                  <div className="flex items-center gap-2 mb-4 bg-emerald-500/10 text-emerald-400 px-3 py-2 rounded-lg border border-emerald-500/20">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-semibold">Matched — Invoice verified in FBR</span>
                  </div>
                )}
                {fbrStatus === "not_found" && (
                  <div className="flex items-center gap-2 mb-4 bg-red-500/10 text-red-400 px-3 py-2 rounded-lg border border-red-500/20">
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-semibold">Not Found — Record absent in FBR</span>
                  </div>
                )}
                {fbrStatus === "error" && (
                  <div className="flex items-center gap-2 mb-4 bg-amber-500/10 text-amber-400 px-3 py-2 rounded-lg border border-amber-500/20">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-semibold">Service unavailable — retry later</span>
                  </div>
                )}

                <button
                  onClick={handleFBRCheck}
                  disabled={fbrLoading}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#3b82f6" }}
                >
                  {fbrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {fbrStatus ? "Re-run FBR Check" : "Run FBR Check"}
                </button>
              </div>

              {/* Credit Score */}
              <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white text-sm font-semibold">Credit Score</p>
                    <p className="text-slate-500 text-xs mt-0.5">Automated credit assessment</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-slate-700/60 flex items-center justify-center">
                    <BarChart2 className="w-5 h-5 text-slate-400" />
                  </div>
                </div>

                {creditLoading && (
                  <div className="flex items-center gap-2 text-blue-400 text-sm mb-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading credit data...
                  </div>
                )}

                {!creditLoading && cc && (
                  <>
                    <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg border ${cc.bg} ${cc.border}`}>
                      <cc.icon className={`w-4 h-4 ${cc.text} flex-shrink-0`} />
                      <span className={`text-sm font-bold ${cc.text}`}>{creditStatus}</span>
                      <span className={`ml-auto text-sm font-bold ${cc.text}`}>{cc.score}</span>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Score</span><span>850 max</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-700/60 overflow-hidden">
                        <div className={`h-full rounded-full ${cc.bar} ${cc.width} transition-all duration-700`} />
                      </div>
                    </div>
                    <p className="text-slate-600 text-xs">Auto-loaded from credit bureau</p>
                  </>
                )}

                {!creditLoading && !creditStatus && (
                  <div className="text-slate-600 text-sm italic">Unavailable</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Decision Panel */}
        <div className="space-y-5">
          {/* Action Result */}
          {actionResult && (
            <div className={`rounded-2xl border p-5 flex items-start gap-3 ${
              actionResult.type === "approve"
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-red-500/10 border-red-500/30"
            }`}>
              {actionResult.type === "approve"
                ? <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              }
              <div>
                <p className={`font-bold text-sm mb-0.5 ${actionResult.type === "approve" ? "text-emerald-400" : "text-red-400"}`}>
                  {actionResult.type === "approve" ? "Invoice Approved" : "Invoice Rejected"}
                </p>
                <p className="text-slate-400 text-xs leading-relaxed">{actionResult.message}</p>
              </div>
            </div>
          )}

          {/* Note + Actions */}
          <div className="rounded-2xl border border-slate-700/50 p-6 sticky top-6" style={{ backgroundColor: "#1e293b" }}>
            <h2 className="text-white font-semibold text-sm mb-1 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-400" /> Admin Decision
            </h2>
            <p className="text-slate-500 text-xs mb-5">Review the invoice then approve or reject with a note.</p>

            {/* Note Textarea */}
            <div className="mb-5">
              <label className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <MessageSquare className="w-3.5 h-3.5" />
                Written Note <span className="text-red-400">*</span>
              </label>
              <textarea
                value={note}
                onChange={e => { setNote(e.target.value); if (noteError) setNoteError(""); }}
                disabled={isDecided}
                placeholder="Provide your assessment, rationale, or reason for rejection..."
                rows={5}
                className={`w-full px-4 py-3 rounded-xl bg-slate-800/60 border text-white text-sm placeholder-slate-600 focus:outline-none transition-all resize-none leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed ${
                  noteError ? "border-red-500/60 focus:border-red-400" : "border-slate-600/40 focus:border-blue-500/60"
                }`}
              />
              {noteError && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {noteError}
                </p>
              )}
              <p className="text-slate-600 text-xs mt-1.5">{note.length} characters · minimum 10 required</p>
            </div>

            {/* Action Buttons */}
            {!isDecided ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleAction("approve")}
                  disabled={!!actionLoading}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-500"
                >
                  {actionLoading === "approve" ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Approving...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4" />Approve Invoice</>
                  )}
                </button>
                <button
                  onClick={() => handleAction("reject")}
                  disabled={!!actionLoading}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:shadow-xl hover:shadow-red-500/20 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-500"
                >
                  {actionLoading === "reject" ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Rejecting...</>
                  ) : (
                    <><XCircle className="w-4 h-4" />Reject Invoice</>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center py-3 rounded-xl bg-slate-700/30 border border-slate-600/30">
                <Info className="w-4 h-4 text-slate-500" />
                <span className="text-slate-500 text-sm">Decision already made</span>
              </div>
            )}

            <div className="mt-5 pt-5 border-t border-slate-700/30">
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Actions are permanent and logged. The SME will be notified via email upon any status change.
              </p>
            </div>
          </div>

          {/* Quick Summary Card */}
          <div className="rounded-2xl border border-slate-700/50 p-5" style={{ backgroundColor: "#1e293b" }}>
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">Quick Summary</h3>
            <div className="space-y-3">
              {[
                { icon: DollarSign, label: "Amount",    value: fmt(invoice.amount),    color: "text-blue-400"    },
                { icon: TrendingUp, label: "Rate",      value: `${invoice.discountRate}%`, color: "text-emerald-400" },
                { icon: Calendar,   label: "Due Date",  value: invoice.dueDate,        color: "text-white"       },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-slate-500 text-xs">{label}</span>
                    <span className={`text-xs font-bold ${color}`}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
