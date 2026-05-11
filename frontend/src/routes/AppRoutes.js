import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { PublicRoute, BorrowerRoute, InvestorRoute, AdminRoute, AuthRoute } from "./ProtectedRoute";

// ── Lazy-loaded pages ────────────────────────────────────────────────────────
const LoginPage       = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage    = lazy(() => import("../pages/auth/RegisterPage"));
const PendingApproval = lazy(() => import("../pages/auth/PendingApproval"));
const BlockedPage     = lazy(() => import("../pages/auth/BlockedPage"));

// Borrower (SME)
const SMEDashboard = lazy(() => import("../pages/sme/SMEDashboard"));
const SMEInvoices  = lazy(() => import("../pages/sme/SMEInvoices"));
const SMEWallet    = lazy(() => import("../pages/sme/SMEWallet"));

// Investor — point to the REAL full pages
const InvestorDashboard = lazy(() => import("../pages/investor/InvestorDashboard"));
const Marketplace       = lazy(() => import("../pages/investor/Marketplace"));
const InvoiceDetail     = lazy(() => import("../pages/investor/InvoiceDetail"));
const MyInvestments     = lazy(() => import("../pages/investor/MyInvestments"));
const InvestorWallet    = lazy(() => import("../pages/investor/InvestorWallet"));

// Admin — point to the REAL full pages
const AdminDashboard  = lazy(() => import("../pages/admin/AdminDashboard"));
const InvoiceQueue    = lazy(() => import("../pages/admin/InvoiceQueue"));
const AdminInvoiceDetail = lazy(() => import("../pages/admin/AdminInvoiceDetail"));
const UserManagement  = lazy(() => import("../pages/admin/UserManagement"));

// ── Page-level Suspense fallback ─────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen bg-navy-900 flex items-center justify-center">
    <div className="w-10 h-10 rounded-full border-2 border-navy-600 border-t-accent animate-spin" />
  </div>
);

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* ── Root redirect ──────────────────────────────────────────────── */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ── Public routes ─────────────────────────────────────────────── */}
      <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/pending-approval" element={<PendingApproval />} />
      <Route path="/blocked"          element={<BlockedPage />} />

      {/* ── Borrower / SME routes ──────────────────────────────────────── */}
      <Route path="/sme/dashboard" element={<BorrowerRoute><SMEDashboard /></BorrowerRoute>} />
      <Route path="/sme/invoices"  element={<BorrowerRoute><SMEInvoices /></BorrowerRoute>} />
      <Route path="/sme/wallet"    element={<BorrowerRoute><SMEWallet /></BorrowerRoute>} />

      {/* ── Investor routes ────────────────────────────────────────────── */}
      <Route path="/investor/dashboard" element={<InvestorRoute><InvestorDashboard /></InvestorRoute>} />
      <Route path="/investor/market"    element={<InvestorRoute><Marketplace /></InvestorRoute>} />
      <Route path="/investor/market/:id" element={<InvestorRoute><InvoiceDetail /></InvestorRoute>} />
      <Route path="/investor/portfolio" element={<InvestorRoute><MyInvestments /></InvestorRoute>} />
      <Route path="/investor/wallet"    element={<InvestorRoute><InvestorWallet /></InvestorRoute>} />

      {/* ── Admin routes ───────────────────────────────────────────────── */}
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/invoices"  element={<AdminRoute><InvoiceQueue /></AdminRoute>} />
      <Route path="/admin/invoices/:id" element={<AdminRoute><AdminInvoiceDetail /></AdminRoute>} />
      <Route path="/admin/users"     element={<AdminRoute><UserManagement /></AdminRoute>} />

      {/* ── Catch-all ──────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;