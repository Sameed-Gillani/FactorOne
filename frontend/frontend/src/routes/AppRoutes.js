import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { PublicRoute, SMERoute, InvestorRoute, AdminRoute, AuthRoute } from "./ProtectedRoute";

const LoginPage        = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage     = lazy(() => import("../pages/auth/RegisterPage"));
const PendingApproval  = lazy(() => import("../pages/auth/PendingApproval"));
const BlockedPage      = lazy(() => import("../pages/auth/BlockedPage"));

const SMEDashboard     = lazy(() => import("../pages/sme/SMEDashboard"));
const SMEInvoices      = lazy(() => import("../pages/sme/SMEInvoices"));

const InvestorDashboard = lazy(() => import("../pages/investor/InvestorDashboard"));
const InvestorMarket    = lazy(() => import("../pages/investor/InvestorMarket"));
const InvestorPortfolio = lazy(() => import("../pages/investor/InvestorPortfolio"));

const AdminDashboard   = lazy(() => import("../pages/admin/AdminDashboard"));
const AdminInvoices    = lazy(() => import("../pages/admin/AdminInvoices"));
const AdminUsers       = lazy(() => import("../pages/admin/AdminUsers"));

const WalletPage       = lazy(() => import("../pages/shared/WalletPage"));
const NotificationsPage= lazy(() => import("../pages/shared/NotificationsPage"));

const Loader = () => (
  <div className="min-h-screen bg-navy-900 flex items-center justify-center">
    <div className="w-10 h-10 rounded-full border-2 border-navy-600 border-t-accent animate-spin" />
  </div>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public */}
        <Route path="/login"            element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register"         element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        <Route path="/blocked"          element={<BlockedPage />} />

        {/* SME */}
        <Route path="/sme/dashboard" element={<SMERoute><SMEDashboard /></SMERoute>} />
        <Route path="/sme/invoices"  element={<SMERoute><SMEInvoices /></SMERoute>} />
        <Route path="/sme/submit"    element={<SMERoute><React.Suspense fallback={<Loader/>}>{React.createElement(lazy(() => import("../pages/sme/SubmitInvoice")))}</React.Suspense></SMERoute>} />

        {/* Investor */}
        <Route path="/investor/dashboard" element={<InvestorRoute><InvestorDashboard /></InvestorRoute>} />
        <Route path="/investor/market"    element={<InvestorRoute><InvestorMarket /></InvestorRoute>} />
        <Route path="/investor/portfolio" element={<InvestorRoute><InvestorPortfolio /></InvestorRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/invoices"  element={<AdminRoute><AdminInvoices /></AdminRoute>} />
        <Route path="/admin/users"     element={<AdminRoute><AdminUsers /></AdminRoute>} />

        {/* Shared */}
        <Route path="/wallet"        element={<AuthRoute><WalletPage /></AuthRoute>} />
        <Route path="/notifications" element={<AuthRoute><NotificationsPage /></AuthRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
