import React from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  AlertTriangle,
  Eye,
  RotateCcw,
  Loader2,
} from "lucide-react";

/**
 * StatusBadge — color-coded invoice/user status pill.
 *
 * Supported statuses:
 *   pending   → yellow
 *   approved  → blue
 *   verified  → blue
 *   funded    → green
 *   completed → emerald
 *   repaid    → teal
 *   rejected  → red
 *   overdue   → orange
 *   blocked   → red
 *   active    → green
 *   review    → purple
 *
 * Props:
 *   status   string  — one of the above keys (case-insensitive)
 *   size     "sm" | "md" | "lg"
 *   dot      bool    — show colored dot instead of icon (compact variant)
 */

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "#f59e0b",
    bg: "#f59e0b18",
    border: "#f59e0b35",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "#3b82f6",
    bg: "#3b82f618",
    border: "#3b82f635",
    icon: CheckCircle2,
  },
  verified: {
    label: "Verified",
    color: "#3b82f6",
    bg: "#3b82f618",
    border: "#3b82f635",
    icon: CheckCircle2,
  },
  under_review: {
    label: "Under Review",
    color: "#a78bfa",
    bg: "#a78bfa18",
    border: "#a78bfa35",
    icon: Eye,
  },
  review: {
    label: "In Review",
    color: "#a78bfa",
    bg: "#a78bfa18",
    border: "#a78bfa35",
    icon: Eye,
  },
  funded: {
    label: "Funded",
    color: "#10b981",
    bg: "#10b98118",
    border: "#10b98135",
    icon: DollarSign,
  },
  completed: {
    label: "Completed",
    color: "#10b981",
    bg: "#10b98118",
    border: "#10b98135",
    icon: CheckCircle2,
  },
  repaid: {
    label: "Repaid",
    color: "#14b8a6",
    bg: "#14b8a618",
    border: "#14b8a635",
    icon: RotateCcw,
  },
  rejected: {
    label: "Rejected",
    color: "#f87171",
    bg: "#f8717118",
    border: "#f8717135",
    icon: XCircle,
  },
  blocked: {
    label: "Blocked",
    color: "#f87171",
    bg: "#f8717118",
    border: "#f8717135",
    icon: XCircle,
  },
  overdue: {
    label: "Overdue",
    color: "#fb923c",
    bg: "#fb923c18",
    border: "#fb923c35",
    icon: AlertTriangle,
  },
  active: {
    label: "Active",
    color: "#10b981",
    bg: "#10b98118",
    border: "#10b98135",
    icon: CheckCircle2,
  },
  processing: {
    label: "Processing",
    color: "#38bdf8",
    bg: "#38bdf818",
    border: "#38bdf835",
    icon: Loader2,
  },
};

const SIZE_CONFIG = {
  sm: { fontSize: "10px", padding: "2px 7px", iconSize: 10, gap: "4px" },
  md: { fontSize: "12px", padding: "4px 10px", iconSize: 12, gap: "5px" },
  lg: { fontSize: "13px", padding: "5px 12px", iconSize: 13, gap: "6px" },
};

export default function StatusBadge({ status = "pending", size = "md", dot = false }) {
  const key = (status || "").toLowerCase().replace(/\s+/g, "_");
  const config = STATUS_CONFIG[key] || {
    label: status || "Unknown",
    color: "#64748b",
    bg: "#64748b18",
    border: "#64748b35",
    icon: Clock,
  };

  const sizeConfig = SIZE_CONFIG[size] || SIZE_CONFIG.md;
  const Icon = config.icon;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: sizeConfig.gap,
        padding: sizeConfig.padding,
        borderRadius: "20px",
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
        fontSize: sizeConfig.fontSize,
        fontWeight: "600",
        fontFamily: "'DM Sans', sans-serif",
        letterSpacing: "0.2px",
        whiteSpace: "nowrap",
        lineHeight: 1,
      }}
    >
      {dot ? (
        <span
          style={{
            width: sizeConfig.iconSize - 2,
            height: sizeConfig.iconSize - 2,
            borderRadius: "50%",
            background: config.color,
            display: "inline-block",
            flexShrink: 0,
          }}
        />
      ) : (
        <Icon
          size={sizeConfig.iconSize}
          style={{
            flexShrink: 0,
            animation: key === "processing" ? "spin 1.5s linear infinite" : "none",
          }}
        />
      )}
      {config.label}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}
