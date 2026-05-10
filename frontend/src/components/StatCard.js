import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * StatCard — reusable metric card for dashboards.
 *
 * Props:
 *   title        string   — metric label
 *   value        string   — main display value
 *   subtitle     string   — optional sub-text below value
 *   icon         node     — lucide icon component (e.g. <FileText />)
 *   iconColor    string   — icon background accent color (hex)
 *   trend        number   — positive/negative % change vs previous period
 *   trendLabel   string   — e.g. "vs last month"
 *   loading      bool     — show skeleton shimmer
 *   onClick      fn       — make card clickable
 */
export default function StatCard({
  title = "Metric",
  value = "—",
  subtitle,
  icon,
  iconColor = "#3b82f6",
  trend,
  trendLabel = "vs last period",
  loading = false,
  onClick,
}) {
  const hasTrend = trend !== undefined && trend !== null;
  const isPositive = trend > 0;
  const isNeutral = trend === 0;

  const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const trendColor = isNeutral ? "#64748b" : isPositive ? "#10b981" : "#f87171";

  return (
    <div
      onClick={onClick}
      style={{
        background: "#1e293b",
        borderRadius: "16px",
        padding: "20px 22px",
        border: "1px solid #334155",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.border = `1px solid ${iconColor}55`;
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = `0 8px 24px ${iconColor}18`;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.border = "1px solid #334155";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      {/* Subtle glow blob in top-right */}
      <div
        style={{
          position: "absolute",
          top: "-20px",
          right: "-20px",
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: `${iconColor}12`,
          pointerEvents: "none",
        }}
      />

      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "14px",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            fontWeight: "600",
            color: "#64748b",
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {title}
        </p>

        {icon && (
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: `${iconColor}1a`,
              border: `1px solid ${iconColor}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: iconColor,
              flexShrink: 0,
            }}
          >
            {React.cloneElement(icon, { size: 17 })}
          </div>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div
            style={{
              height: "28px",
              width: "60%",
              borderRadius: "6px",
              background: "linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.4s infinite",
            }}
          />
          <div
            style={{
              height: "14px",
              width: "40%",
              borderRadius: "4px",
              background: "linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.4s infinite 0.2s",
            }}
          />
        </div>
      ) : (
        <>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: "26px",
              fontWeight: "700",
              color: "#f1f5f9",
              letterSpacing: "-0.8px",
              lineHeight: 1.2,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {value}
          </p>

          {subtitle && (
            <p
              style={{
                margin: "0 0 10px",
                fontSize: "12px",
                color: "#475569",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {subtitle}
            </p>
          )}

          {/* Trend badge */}
          {hasTrend && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                marginTop: subtitle ? "0" : "8px",
                padding: "3px 8px",
                borderRadius: "20px",
                background: `${trendColor}15`,
                border: `1px solid ${trendColor}30`,
              }}
            >
              <TrendIcon size={11} color={trendColor} />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: trendColor,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {isPositive ? "+" : ""}
                {trend}% {trendLabel}
              </span>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
