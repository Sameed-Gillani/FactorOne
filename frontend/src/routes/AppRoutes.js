import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { PublicRoute, SMERoute, InvestorRoute, AdminRoute, AuthRoute } from "./ProtectedRoute";

// ── Lazy-loaded pages ────────────────────────────────────────
const LoginPage       = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage    = lazy(() => import("../pages/auth/RegisterPage"));
const PendingApproval = lazy(() => import("../pages/auth/PendingApproval"));
const BlockedPage     = lazy(() => import("../pages/auth/BlockedPage"));

// SME
const SMEDashboard    = lazy(() => import("../pages/sme/SMEDashboard"));
const SMEInvoices     = lazy(() => import("../pages/sme/SMEInvoices"));
const SMEWallet       = lazy(() => import("../pages/sme/SMEWallet"));

// Investor
const InvestorDashboard = lazy(() => import("../pages/investor/InvestorDashboard"));
const InvestorMarket    = lazy(() => import("../pages/investor/InvestorMarket"));
const InvestorPortfolio = lazy(() => import("../pages/investor/InvestorPortfolio"));
const InvestorWallet    = lazy(() => import("../pages/investor/InvestorWallet"));

// Admin
const AdminDashboard  = lazy(() => import("../pages/admin/AdminDashboard"));
const AdminInvoices   = lazy(() => import("../pages/admin/AdminInvoices"));
const AdminUsers      = lazy(() => import("../pages/admin/AdminUsers"));

// ── Page-level Suspense fallback ─────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen bg-navy-900 flex items-center justify-center">
    <div className="w-10 h-10 rounded-full border-2 border-navy-600 border-t-accent animate-spin" />
  </div>
);

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* ── Root redirect ──────────────────────────────────── */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ── Public routes ──────────────────────────────────── */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/pending-approval" element={<PendingApproval />} />
      <Route path="/blocked" element={<BlockedPage />} />

      {/* ── SME routes ─────────────────────────────────────── */}
      <Route path="/sme/dashboard" element={<SMERoute><SMEDashboard /></SMERoute>} />
      <Route path="/sme/invoices"  element={<SMERoute><SMEInvoices /></SMERoute>} />
      <Route path="/sme/wallet"    element={<SMERoute><SMEWallet /></SMERoute>} />

      {/* ── Investor routes ────────────────────────────────── */}
      <Route path="/investor/dashboard"  element={<InvestorRoute><InvestorDashboard /></InvestorRoute>} />
      <Route path="/investor/market"     element={<InvestorRoute><InvestorMarket /></InvestorRoute>} />
      <Route path="/investor/portfolio"  element={<InvestorRoute><InvestorPortfolio /></InvestorRoute>} />
      <Route path="/investor/wallet"     element={<InvestorRoute><InvestorWallet /></InvestorRoute>} />

      {/* ── Admin routes ───────────────────────────────────── */}
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/invoices"  element={<AdminRoute><AdminInvoices /></AdminRoute>} />
      <Route path="/admin/users"     element={<AdminRoute><AdminUsers /></AdminRoute>} />

      {/* ── Catch-all ──────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
