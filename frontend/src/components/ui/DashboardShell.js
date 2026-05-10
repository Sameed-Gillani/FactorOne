import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Logo = () => (
  <span className="font-display text-xl text-white">
    Factor<span className="text-accent">One</span>
  </span>
);

export default function DashboardShell({ navItems, children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };

  const roleBadgeClass = {
    sme: "badge-blue",
    investor: "badge-green",
    admin: "badge badge-red",
  }[user?.role] || "badge-gray";

  return (
    <div className="min-h-screen bg-navy-900 flex">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-navy-800 border-r border-navy-700 flex flex-col
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}>

        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-navy-700 flex-shrink-0">
          <Logo />
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-navy-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center flex-shrink-0">
              <span className="text-accent font-bold text-sm">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-100 truncate">{user?.name}</p>
              <span className={`badge ${roleBadgeClass} text-[10px]`}>{user?.role?.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                  ${active
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "text-slate-400 hover:text-slate-100 hover:bg-navy-700"}`}>
                <span className={active ? "text-accent" : ""}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-navy-700">
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-danger hover:bg-danger/10 transition-all duration-150">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1={21} y1={12} x2={9} y2={12} />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Backdrop (mobile) ─────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main content ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-navy-800/80 backdrop-blur border-b border-navy-700 flex items-center px-4 lg:px-6 gap-4 flex-shrink-0 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 rounded-lg bg-navy-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1={3} y1={6} x2={21} y2={6} /><line x1={3} y1={12} x2={21} y2={12} /><line x1={3} y1={18} x2={21} y2={18} />
            </svg>
          </button>
          <div className="flex-1" />
          <div className="text-sm text-slate-500 font-mono hidden sm:block">
            {new Date().toLocaleDateString("en-PK", { weekday: "short", month: "short", day: "numeric" })}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
