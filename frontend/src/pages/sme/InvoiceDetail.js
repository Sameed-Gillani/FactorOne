import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  AlertCircle,
  Clock,
  CheckCircle2,
  DollarSign,
  XCircle,
  FileText,
  Building2,
  Calendar,
  Hash,
  TrendingUp,
  RotateCcw,
  AlertTriangle,
  Eye,
  Download,
  Loader2,
} from "lucide-react";
import StatusBadge from "../../components/StatusBadge";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(n || 0);

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

// ─── Status → timeline steps mapping ─────────────────────────────────────────
const TIMELINE_STEPS = [
  {
    key: "submitted",
    label: "Submitted",
    icon: FileText,
    statuses: ["pending", "under_review", "approved", "funded", "completed", "repaid", "rejected", "overdue"],
  },
  {
    key: "under_review",
    label: "Under Review",
    icon: Eye,
    statuses: ["under_review", "approved", "funded", "completed", "repaid"],
  },
  {
    key: "approved",
    label: "Approved",
    icon: CheckCircle2,
    statuses: ["approved", "funded", "completed", "repaid"],
  },
  {
    key: "funded",
    label: "Funded",
    icon: DollarSign,
    statuses: ["funded", "completed", "repaid"],
  },
  {
    key: "repaid",
    label: "Repaid",
    icon: RotateCcw,
    statuses: ["completed", "repaid"],
  },
];

function getTimelineState(step, currentStatus) {
  if (currentStatus === "rejected") {
    if (step.key === "submitted") return "completed";
    if (step.key === "under_review" || step.key === "approved") return "rejected";
    return "future";
  }
  if (currentStatus === "overdue") {
    if (step.key === "submitted" || step.key === "under_review" || step.key === "approved")
      return "completed";
    if (step.key === "funded") return "overdue";
    return "future";
  }
  if (step.statuses.includes(currentStatus)) return "completed";
  return "future";
}

// ─── Detail row ───────────────────────────────────────────────────────────────
function DetailRow({ icon: Icon, label, value, mono = false, accent }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "13px 0",
        borderBottom: "1px solid #1e293b",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          background: `${accent || "#3b82f6"}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "1px",
        }}
      >
        <Icon size={14} color={accent || "#3b82f6"} />
      </div>
      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: "0 0 2px",
            fontSize: "11px",
            fontWeight: "600",
            color: "#475569",
            letterSpacing: "0.4px",
            textTransform: "uppercase",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {label}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: "600",
            color: "#e2e8f0",
            fontFamily: mono ? "monospace" : "'DM Sans', sans-serif",
          }}
        >
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/invoices/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 404) throw new Error("Invoice not found");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setInvoice(data.data || data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100%",
          background: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ textAlign: "center", color: "#475569" }}>
          <Loader2
            size={28}
            style={{ animation: "spin 1s linear infinite", marginBottom: "10px" }}
            color="#3b82f6"
          />
          <p style={{ margin: 0, fontSize: "13px" }}>Loading invoice…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100%",
          background: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <AlertCircle size={40} color="#f87171" style={{ marginBottom: "14px" }} />
          <h3 style={{ color: "#f1f5f9", margin: "0 0 8px", fontSize: "18px", fontWeight: "700" }}>
            {error}
          </h3>
          <p style={{ color: "#64748b", margin: "0 0 20px", fontSize: "13px" }}>
            This invoice may have been removed or you may not have permission to view it.
          </p>
          <button
            onClick={() => navigate("/sme/invoices")}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              background: "#3b82f6",
              border: "none",
              color: "#fff",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Back to My Invoices
          </button>
        </div>
      </div>
    );
  }

  const status = invoice?.status || "pending";
  const isRejected = status === "rejected";
  const fundingPercent =
    invoice?.amount > 0
      ? Math.min(100, Math.round(((invoice.fundedAmount || 0) / invoice.amount) * 100))
      : 0;

  return (
    <div
      style={{
        padding: "28px",
        background: "#0f172a",
        minHeight: "100%",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── Back ── */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "20px",
          background: "transparent",
          border: "none",
          color: "#64748b",
          fontSize: "13px",
          fontWeight: "500",
          cursor: "pointer",
          padding: 0,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <ChevronLeft size={15} /> Back to My Invoices
      </button>

      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: "700",
                color: "#f1f5f9",
                letterSpacing: "-0.4px",
              }}
            >
              Invoice{" "}
              <span
                style={{
                  fontFamily: "monospace",
                  color: "#3b82f6",
                  background: "#3b82f610",
                  padding: "2px 10px",
                  borderRadius: "8px",
                  fontSize: "18px",
                }}
              >
                {invoice?.invoiceNumber || id}
              </span>
            </h2>
            <StatusBadge status={status} size="md" />
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "#475569" }}>
            Submitted {fmtDateTime(invoice?.createdAt)}
          </p>
        </div>
        {invoice?.documents?.length > 0 && (
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "10px",
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#94a3b8",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <Download size={14} /> Download Document
          </button>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "20px",
          alignItems: "flex-start",
        }}
      >
        {/* ── LEFT column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Rejection notice */}
          {isRejected && (
            <div
              style={{
                padding: "16px 20px",
                borderRadius: "14px",
                background: "#f8717112",
                border: "1px solid #f8717130",
                display: "flex",
                gap: "14px",
                alignItems: "flex-start",
              }}
            >
              <XCircle size={22} color="#f87171" style={{ flexShrink: 0, marginTop: "1px" }} />
              <div>
                <h4
                  style={{
                    margin: "0 0 4px",
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#f87171",
                  }}
                >
                  Invoice Rejected
                </h4>
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "#fca5a5",
                    lineHeight: 1.5,
                  }}
                >
                  {invoice?.rejectionReason ||
                    "Your invoice was reviewed and could not be approved at this time. Please contact support for more details."}
                </p>
              </div>
            </div>
          )}

          {/* Admin note */}
          {invoice?.adminNotes && !isRejected && (
            <div
              style={{
                padding: "14px 18px",
                borderRadius: "12px",
                background: "#3b82f610",
                border: "1px solid #3b82f630",
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
              }}
            >
              <AlertCircle size={16} color="#3b82f6" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <p
                  style={{
                    margin: "0 0 2px",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#3b82f6",
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                  }}
                >
                  Admin Note
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "#93c5fd",
                    lineHeight: 1.5,
                  }}
                >
                  {invoice.adminNotes}
                </p>
              </div>
            </div>
          )}

          {/* Invoice details card */}
          <div
            style={{
              background: "#1e293b",
              borderRadius: "16px",
              border: "1px solid #334155",
              padding: "20px",
            }}
          >
            <h3
              style={{
                margin: "0 0 4px",
                fontSize: "14px",
                fontWeight: "700",
                color: "#f1f5f9",
              }}
            >
              Invoice Details
            </h3>
            <div style={{ borderTop: "1px solid #334155", marginTop: "14px" }}>
              <DetailRow
                icon={Hash}
                label="Invoice Number"
                value={invoice?.invoiceNumber}
                mono
              />
              <DetailRow
                icon={Building2}
                label="Anchor / Buyer Company"
                value={invoice?.debtor?.name || invoice?.anchorCompany}
              />
              <DetailRow
                icon={DollarSign}
                label="Invoice Amount"
                value={fmt(invoice?.amount || invoice?.amountPkr)}
                accent="#10b981"
              />
              <DetailRow
                icon={Calendar}
                label="Issue Date"
                value={fmtDate(invoice?.issueDate)}
                accent="#a78bfa"
              />
              <DetailRow
                icon={Calendar}
                label="Due Date"
                value={fmtDate(invoice?.dueDate)}
                accent="#f59e0b"
              />
              {invoice?.ntn && (
                <DetailRow
                  icon={Hash}
                  label="NTN"
                  value={invoice.ntn}
                  mono
                />
              )}
              {invoice?.description && (
                <DetailRow
                  icon={FileText}
                  label="Description"
                  value={invoice.description}
                />
              )}
            </div>
          </div>

          {/* Funding progress */}
          {["funded", "completed", "repaid"].includes(status) && (
            <div
              style={{
                background: "#1e293b",
                borderRadius: "16px",
                border: "1px solid #334155",
                padding: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "14px",
                }}
              >
                <h3
                  style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#f1f5f9" }}
                >
                  Funding Progress
                </h3>
                <span
                  style={{ fontSize: "13px", fontWeight: "700", color: "#10b981" }}
                >
                  {fundingPercent}%
                </span>
              </div>
              <div
                style={{
                  height: "8px",
                  borderRadius: "4px",
                  background: "#0f172a",
                  overflow: "hidden",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${fundingPercent}%`,
                    borderRadius: "4px",
                    background: "linear-gradient(90deg, #10b981, #34d399)",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  color: "#64748b",
                }}
              >
                <span>Funded: {fmt(invoice.fundedAmount || 0)}</span>
                <span>Total: {fmt(invoice.amount)}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Timeline ── */}
        <div
          style={{
            background: "#1e293b",
            borderRadius: "16px",
            border: "1px solid #334155",
            padding: "20px",
            position: "sticky",
            top: "80px",
          }}
        >
          <h3
            style={{ margin: "0 0 20px", fontSize: "14px", fontWeight: "700", color: "#f1f5f9" }}
          >
            Status Timeline
          </h3>

          <div style={{ position: "relative" }}>
            {/* Vertical line */}
            <div
              style={{
                position: "absolute",
                left: "15px",
                top: "0",
                bottom: "0",
                width: "1px",
                background: "#334155",
                zIndex: 0,
              }}
            />

            {/* Rejected track */}
            {isRejected && (
              <div style={{ position: "relative", zIndex: 1 }}>
                {TIMELINE_STEPS.slice(0, 2).map((step, i) => {
                  const stepState = getTimelineState(step, status);
                  const Icon = step.icon;
                  const isDone = stepState === "completed";
                  return (
                    <TimelineStep
                      key={step.key}
                      icon={Icon}
                      label={step.label}
                      state={i === 1 ? "rejected" : "completed"}
                      date={i === 0 ? fmtDate(invoice?.createdAt) : null}
                      isLast={false}
                    />
                  );
                })}
                <TimelineStep
                  icon={XCircle}
                  label="Rejected"
                  state="rejected"
                  date={fmtDate(invoice?.updatedAt)}
                  isLast
                  accent="#f87171"
                />
              </div>
            )}

            {/* Normal track */}
            {!isRejected &&
              TIMELINE_STEPS.map((step, i) => {
                const stepState = getTimelineState(step, status);
                const Icon = step.icon;
                return (
                  <TimelineStep
                    key={step.key}
                    icon={Icon}
                    label={step.label}
                    state={stepState}
                    date={
                      i === 0
                        ? fmtDate(invoice?.createdAt)
                        : step.key === status
                        ? fmtDate(invoice?.updatedAt)
                        : null
                    }
                    isLast={i === TIMELINE_STEPS.length - 1}
                  />
                );
              })}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Timeline step sub-component ─────────────────────────────────────────────
function TimelineStep({ icon: Icon, label, state, date, isLast, accent }) {
  const stateStyles = {
    completed: {
      dot: "#3b82f6",
      dotBg: "#3b82f618",
      iconColor: "#3b82f6",
      labelColor: "#e2e8f0",
    },
    rejected: {
      dot: accent || "#f87171",
      dotBg: "#f8717118",
      iconColor: accent || "#f87171",
      labelColor: "#fca5a5",
    },
    overdue: {
      dot: "#fb923c",
      dotBg: "#fb923c18",
      iconColor: "#fb923c",
      labelColor: "#fdba74",
    },
    future: {
      dot: "#334155",
      dotBg: "#1e293b",
      iconColor: "#475569",
      labelColor: "#475569",
    },
  };

  const s = stateStyles[state] || stateStyles.future;

  return (
    <div
      style={{
        display: "flex",
        gap: "14px",
        paddingBottom: isLast ? "0" : "22px",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div
        style={{
          width: "31px",
          height: "31px",
          borderRadius: "50%",
          background: s.dotBg,
          border: `2px solid ${s.dot}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={14} color={s.iconColor} />
      </div>
      <div style={{ paddingTop: "4px" }}>
        <p
          style={{
            margin: "0 0 2px",
            fontSize: "13px",
            fontWeight: "600",
            color: s.labelColor,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {label}
        </p>
        {date && (
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              color: "#475569",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {date}
          </p>
        )}
      </div>
    </div>
  );
}
