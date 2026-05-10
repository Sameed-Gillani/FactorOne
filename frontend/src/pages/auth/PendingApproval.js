import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function PendingApproval() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-navy-900 bg-grid-pattern bg-grid flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="relative w-full max-w-md text-center animate-slide-up">
        <div className="card gradient-border p-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warning/10 border border-warning/25 text-warning mb-6 mx-auto animate-float">
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <circle cx={12} cy={12} r={10} />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>

          <h2 className="font-display text-3xl text-white mb-3">Pending Approval</h2>

          {user && (
            <p className="text-slate-400 text-sm mb-2">
              Hi <strong className="text-white">{user.name}</strong>,
            </p>
          )}

          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Your <span className="badge badge-yellow">{user?.role?.toUpperCase() || "account"}</span> is under review by our team.
            You'll receive an email once approved — typically within <strong className="text-white">1–2 business days</strong>.
          </p>

          <div className="bg-navy-900 rounded-xl p-4 border border-navy-600 mb-7 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Email</span>
              <span className="text-slate-300">{user?.email || "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Role</span>
              <span className="text-slate-300 capitalize">{user?.role || "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Status</span>
              <span className="badge badge-yellow">Pending</span>
            </div>
          </div>

          <button onClick={() => { logout(); navigate("/login"); }} className="btn-secondary w-full">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
