import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function BlockedPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center animate-slide-up">
        <div className="card gradient-border p-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-danger/10 border border-danger/25 text-danger mb-6 mx-auto">
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <circle cx={12} cy={12} r={10} />
              <line x1={15} y1={9} x2={9} y2={15} />
              <line x1={9} y1={9} x2={15} y2={15} />
            </svg>
          </div>
          <h2 className="font-display text-3xl text-white mb-3">Account Suspended</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-7">
            Your account has been suspended. Please contact{" "}
            <a href="mailto:support@factorone.pk" className="text-accent hover:underline">support@factorone.pk</a>{" "}
            for assistance.
          </p>
          <button onClick={() => { logout(); navigate("/login"); }} className="btn-secondary w-full">
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
