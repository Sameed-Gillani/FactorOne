import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || "";
const POLL_INTERVAL = 30000; // 30 seconds

// Role-based nav links — adjust paths to match your router config
const NAV_LINKS = {
  admin: [
    { label: "Dashboard", path: "/admin/dashboard", icon: "dashboard" },
    { label: "Users", path: "/admin/users", icon: "users" },
    { label: "Investments", path: "/admin/investments", icon: "investments" },
    { label: "Wallet", path: "/wallet", icon: "wallet" },
    { label: "Notifications", path: "/notifications", icon: "bell" },
  ],
  investor: [
    { label: "Dashboard", path: "/investor/dashboard", icon: "dashboard" },
    { label: "Portfolio", path: "/investor/portfolio", icon: "investments" },
    { label: "Wallet", path: "/wallet", icon: "wallet" },
    { label: "Notifications", path: "/notifications", icon: "bell" },
  ],
  borrower: [
    { label: "Dashboard", path: "/borrower/dashboard", icon: "dashboard" },
    { label: "My Loans", path: "/borrower/loans", icon: "investments" },
    { label: "Wallet", path: "/wallet", icon: "wallet" },
    { label: "Notifications", path: "/notifications", icon: "bell" },
  ],
};

const ICONS = {
  dashboard: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  investments: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  wallet: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  bell: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  menu: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  logout: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  user: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

// Helper: get user from localStorage
function getUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getRole() {
  const user = getUser();
  return user?.role?.toLowerCase() || "investor";
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const pollRef = useRef(null);

  const user = getUser();
  const role = getRole();
  const links = NAV_LINKS[role] || NAV_LINKS.investor;

  const fetchUnreadCount = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const count = data.count ?? data.unreadCount ?? data.data?.count ?? 0;
      setUnreadCount(count);
    } catch {
      // Silently ignore network errors for polling
    }
  }, []);

  // Initial fetch + 30s polling
  useEffect(() => {
    fetchUnreadCount();
    pollRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [fetchUnreadCount]);

  // Reset unread count when visiting notifications page
  useEffect(() => {
    if (location.pathname === "/notifications") {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  function isActive(path) {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  }

  const initials = user
    ? `${user.firstName?.[0] || user.name?.[0] || "U"}${user.lastName?.[0] || ""}`.toUpperCase()
    : "U";

  const roleBadgeColor = {
    admin: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    investor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    borrower: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  }[role] || "bg-slate-700 text-slate-300 border-slate-600";

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#0f172a]/95 backdrop-blur-sm border-b border-slate-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50 group-hover:bg-blue-500 transition-colors">
                <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 20 20" fill="currentColor" width={18} height={18}>
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <span className="font-bold text-white text-lg tracking-tight hidden sm:block">
                Factor<span className="text-blue-400">One</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => {
                if (link.icon === "bell") return null; // Bell handled separately
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive(link.path)
                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                    }`}
                  >
                    {ICONS[link.icon]}
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">

              {/* Notification Bell */}
              <Link
                to="/notifications"
                className={`relative p-2.5 rounded-xl transition-all ${
                  isActive("/notifications")
                    ? "bg-blue-600/20 text-blue-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                }`}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold border-2 border-[#0f172a] leading-none">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((o) => !o)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-700/50 transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-medium text-white leading-none">
                      {user?.firstName || user?.name?.split(" ")[0] || "User"}
                    </span>
                    <span className={`text-[10px] font-semibold capitalize px-1.5 py-0.5 mt-0.5 rounded-full border ${roleBadgeColor}`}>
                      {role}
                    </span>
                  </div>
                  <svg
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform hidden sm:block ${profileOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-[#1e293b] border border-slate-700/60 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-700/60">
                      <p className="text-sm font-semibold text-white truncate">
                        {user?.firstName && user?.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user?.name || "User"}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email || ""}</p>
                    </div>
                    <div className="p-1.5">
                      <Link
                        to="/profile"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-700/60 transition-all"
                        onClick={() => setProfileOpen(false)}
                      >
                        {ICONS.user}
                        Profile Settings
                      </Link>
                      <Link
                        to="/wallet"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-700/60 transition-all"
                        onClick={() => setProfileOpen(false)}
                      >
                        {ICONS.wallet}
                        Wallet
                      </Link>
                      <div className="my-1 border-t border-slate-700/60" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                      >
                        {ICONS.logout}
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen((o) => !o)}
                className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-all"
                aria-label="Toggle menu"
              >
                {mobileOpen ? ICONS.close : ICONS.menu}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-700/60 bg-[#0f172a]">
            <div className="px-4 py-3 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive(link.path)
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                  }`}
                >
                  <span className="flex-shrink-0">{ICONS[link.icon]}</span>
                  {link.label}
                  {link.icon === "bell" && unreadCount > 0 && (
                    <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-blue-600 text-white text-xs font-bold">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              ))}
              <div className="pt-2 border-t border-slate-700/60 mt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                >
                  {ICONS.logout}
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
