import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Wallet,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Shield,
} from "lucide-react";

// ─── Nav config per role ─────────────────────────────────────────────────────
const NAV_ITEMS = {
  sme: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/sme/dashboard" },
    { label: "Submit Invoice", icon: FilePlus, path: "/sme/submit-invoice" },
    { label: "My Invoices", icon: FileText, path: "/sme/invoices" },
    { label: "Wallet", icon: Wallet, path: "/sme/wallet" },
  ],
  investor: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/investor/dashboard" },
    { label: "Marketplace", icon: TrendingUp, path: "/investor/marketplace" },
    { label: "My Investments", icon: BarChart3, path: "/investor/investments" },
    { label: "Wallet", icon: Wallet, path: "/investor/wallet" },
  ],
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { label: "Users", icon: Users, path: "/admin/users" },
    { label: "Invoices", icon: FileText, path: "/admin/invoices" },
    { label: "Stats", icon: BarChart3, path: "/admin/stats" },
    { label: "Settings", icon: Settings, path: "/admin/settings" },
  ],
};

const ROLE_LABELS = {
  sme: { label: "SME Portal", icon: FileText, color: "#3b82f6" },
  investor: { label: "Investor Portal", icon: TrendingUp, color: "#10b981" },
  admin: { label: "Admin Panel", icon: Shield, color: "#f59e0b" },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Sidebar({ role = "sme", user = {}, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const items = NAV_ITEMS[role] || NAV_ITEMS.sme;
  const roleConfig = ROLE_LABELS[role] || ROLE_LABELS.sme;
  const RoleIcon = roleConfig.icon;

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  return (
    <aside
      style={{
        width: collapsed ? "72px" : "240px",
        minHeight: "100vh",
        background: "#0f172a",
        borderRight: "1px solid #1e3a5f",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
        position: "relative",
        flexShrink: 0,
        zIndex: 40,
      }}
    >
      {/* ── Logo / Brand ── */}
      <div
        style={{
          padding: collapsed ? "20px 0" : "20px 20px",
          borderBottom: "1px solid #1e293b",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          overflow: "hidden",
          minHeight: "68px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: `linear-gradient(135deg, ${roleConfig.color}, ${roleConfig.color}99)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: `0 0 16px ${roleConfig.color}40`,
          }}
        >
          <RoleIcon size={18} color="#fff" />
        </div>
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                fontSize: "15px",
                fontWeight: "700",
                color: "#f1f5f9",
                letterSpacing: "-0.3px",
                whiteSpace: "nowrap",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              FactorOne
            </div>
            <div
              style={{
                fontSize: "11px",
                color: roleConfig.color,
                fontWeight: "500",
                whiteSpace: "nowrap",
                letterSpacing: "0.2px",
              }}
            >
              {roleConfig.label}
            </div>
          </div>
        )}
      </div>

      {/* ── Nav Links ── */}
      <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: collapsed ? "11px 0" : "11px 20px",
                justifyContent: collapsed ? "center" : "flex-start",
                margin: "2px 8px",
                borderRadius: "10px",
                textDecoration: "none",
                transition: "all 0.15s ease",
                background: isActive ? `${roleConfig.color}1a` : "transparent",
                color: isActive ? roleConfig.color : "#94a3b8",
                fontWeight: isActive ? "600" : "400",
                fontSize: "14px",
                fontFamily: "'DM Sans', sans-serif",
                borderLeft: isActive
                  ? `2px solid ${roleConfig.color}`
                  : "2px solid transparent",
                overflow: "hidden",
                whiteSpace: "nowrap",
                position: "relative",
              })}
              title={collapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    style={{ flexShrink: 0 }}
                    color={isActive ? roleConfig.color : "#64748b"}
                  />
                  {!collapsed && (
                    <span style={{ transition: "opacity 0.2s" }}>
                      {item.label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── User Profile ── */}
      {!collapsed && (
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid #1e293b",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${roleConfig.color}cc, ${roleConfig.color}55)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: "700",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {user?.fullName
              ? user.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "U"}
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#e2e8f0",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {user?.fullName || "User"}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#475569",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.email || ""}
            </div>
          </div>
        </div>
      )}

      {/* ── Logout ── */}
      <div
        style={{
          padding: collapsed ? "12px 0" : "8px 12px 16px",
          borderTop: collapsed ? "1px solid #1e293b" : "none",
        }}
      >
        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? "10px 0" : "10px 12px",
            borderRadius: "10px",
            background: "transparent",
            border: "none",
            color: "#64748b",
            cursor: "pointer",
            fontSize: "14px",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: "500",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fee2e220";
            e.currentTarget.style.color = "#f87171";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#64748b";
          }}
        >
          <LogOut size={17} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* ── Collapse Toggle ── */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          position: "absolute",
          top: "22px",
          right: "-12px",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          background: "#1e293b",
          border: "1px solid #334155",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#64748b",
          zIndex: 50,
          transition: "all 0.15s ease",
          padding: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#334155";
          e.currentTarget.style.color = "#94a3b8";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#1e293b";
          e.currentTarget.style.color = "#64748b";
        }}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </aside>
  );
}
