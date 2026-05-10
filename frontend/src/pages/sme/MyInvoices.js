import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  FileText,
} from "lucide-react";
import StatusBadge from "../../components/StatusBadge";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ALL_STATUSES = [
  "all",
  "pending",
  "under_review",
  "approved",
  "funded",
  "completed",
  "repaid",
  "rejected",
  "overdue",
];

const STATUS_LABELS = {
  all: "All",
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  funded: "Funded",
  completed: "Completed",
  repaid: "Repaid",
  rejected: "Rejected",
  overdue: "Overdue",
};

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
        month: "short",
        year: "numeric",
      })
    : "—";

export default function MyInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (activeFilter !== "all") params.set("status", activeFilter);
      const res = await fetch(
        `${API_BASE}/api/invoices/my?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setInvoices(data.data || data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // ── Derived list ────────────────────────────────────────────────────────────
  const filtered = invoices
    .filter((inv) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        inv.invoiceNumber?.toLowerCase().includes(q) ||
        inv.debtor?.name?.toLowerCase().includes(q) ||
        inv.anchorCompany?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest")
        return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "amount_desc")
        return (b.amount || 0) - (a.amount || 0);
      if (sortBy === "amount_asc")
        return (a.amount || 0) - (b.amount || 0);
      return 0;
    });

  // Count per status for filter pills
  const counts = invoices.reduce((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div
      style={{
        padding: "28px",
        background: "#0f172a",
        minHeight: "100%",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── Page Header ── */}
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
          <h2
            style={{
              margin: "0 0 4px",
              fontSize: "22px",
              fontWeight: "700",
              color: "#f1f5f9",
              letterSpacing: "-0.4px",
            }}
          >
            My Invoices
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#475569" }}>
            {loading
              ? "Loading..."
              : `${invoices.length} invoice${invoices.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={fetchInvoices}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "10px",
              background: "transparent",
              border: "1px solid #334155",
              color: "#94a3b8",
              fontSize: "13px",
              fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <RefreshCw
              size={14}
              style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
            />
            Refresh
          </button>
          <button
            onClick={() => navigate("/sme/submit-invoice")}
            style={{
              padding: "8px 16px",
              borderRadius: "10px",
              background: "#3b82f6",
              border: "none",
              color: "#fff",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: "0 4px 12px #3b82f640",
            }}
          >
            + Submit Invoice
          </button>
        </div>
      </div>

      {/* ── Status filter pills ── */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        {ALL_STATUSES.map((s) => {
          const isActive = activeFilter === s;
          const count = s === "all" ? invoices.length : counts[s] || 0;
          return (
            <button
              key={s}
              onClick={() => setActiveFilter(s)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "20px",
                background: isActive ? "#3b82f6" : "#1e293b",
                border: `1px solid ${isActive ? "#3b82f6" : "#334155"}`,
                color: isActive ? "#fff" : "#64748b",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s ease",
              }}
            >
              {STATUS_LABELS[s]}
              {count > 0 && (
                <span
                  style={{
                    padding: "0px 5px",
                    borderRadius: "10px",
                    background: isActive ? "#ffffff30" : "#334155",
                    color: isActive ? "#fff" : "#94a3b8",
                    fontSize: "10px",
                    fontWeight: "700",
                    lineHeight: "16px",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Search + Sort ── */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            position: "relative",
            flex: 1,
            minWidth: "200px",
          }}
        >
          <Search
            size={15}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#475569",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice # or company…"
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              borderRadius: "10px",
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#e2e8f0",
              fontSize: "13px",
              fontFamily: "'DM Sans', sans-serif",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ position: "relative" }}>
          <Filter
            size={14}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#475569",
              pointerEvents: "none",
            }}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "9px 12px 9px 32px",
              borderRadius: "10px",
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#94a3b8",
              fontSize: "13px",
              fontFamily: "'DM Sans', sans-serif",
              outline: "none",
              cursor: "pointer",
              appearance: "none",
              WebkitAppearance: "none",
              paddingRight: "30px",
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount_desc">Amount: High → Low</option>
            <option value="amount_asc">Amount: Low → High</option>
          </select>
        </div>
      </div>

      {/* ── Table card ── */}
      <div
        style={{
          background: "#1e293b",
          borderRadius: "16px",
          border: "1px solid #334155",
          overflow: "hidden",
        }}
      >
        {error && (
          <div
            style={{
              padding: "20px",
              color: "#f87171",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading && !error && (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid #0f172a",
                  display: "flex",
                  gap: "20px",
                  alignItems: "center",
                }}
              >
                {[110, 170, 90, 80, 80, 60].map((w, j) => (
                  <div
                    key={j}
                    style={{
                      height: "13px",
                      width: `${w}px`,
                      borderRadius: "4px",
                      background:
                        "linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 1.4s infinite",
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            ))}
          </>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div
            style={{ padding: "60px 20px", textAlign: "center" }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "14px",
                background: "#3b82f618",
                border: "1px solid #3b82f630",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <FileText size={26} color="#3b82f6" />
            </div>
            <h3
              style={{
                margin: "0 0 6px",
                fontSize: "15px",
                fontWeight: "700",
                color: "#e2e8f0",
              }}
            >
              {search || activeFilter !== "all"
                ? "No invoices match your filters"
                : "No invoices yet"}
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#475569" }}>
              {search || activeFilter !== "all"
                ? "Try adjusting your search or filter."
                : "Submit your first invoice to get started."}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid #334155" }}>
                  {[
                    "Invoice No.",
                    "Anchor Company",
                    "Amount (PKR)",
                    "Due Date",
                    "Status",
                    "Submitted",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "11px 16px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#475569",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, idx) => (
                  <tr
                    key={inv._id}
                    style={{
                      borderBottom:
                        idx < filtered.length - 1
                          ? "1px solid #0f172a"
                          : "none",
                      transition: "background 0.1s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#0f172a60";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    onClick={() => navigate(`/sme/invoices/${inv._id}`)}
                  >
                    <td style={{ padding: "13px 16px" }}>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "12px",
                          color: "#3b82f6",
                          fontWeight: "600",
                          background: "#3b82f610",
                          padding: "2px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        {inv.invoiceNumber || "—"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        color: "#e2e8f0",
                        fontWeight: "500",
                        maxWidth: "180px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {inv.debtor?.name || inv.anchorCompany || "—"}
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        color: "#94a3b8",
                        fontWeight: "600",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmt(inv.amount || inv.amountPkr)}
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        color: "#64748b",
                        fontSize: "12px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmtDate(inv.dueDate)}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <StatusBadge status={inv.status} size="sm" />
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        color: "#64748b",
                        fontSize: "12px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmtDate(inv.createdAt)}
                    </td>
                    <td
                      style={{ padding: "13px 16px", textAlign: "right" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => navigate(`/sme/invoices/${inv._id}`)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "5px 12px",
                          borderRadius: "7px",
                          background: "#3b82f615",
                          border: "1px solid #3b82f630",
                          color: "#3b82f6",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #1e293b; }
        input::placeholder { color: #475569; }
        input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px #3b82f618; }
      `}</style>
    </div>
  );
}
