import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layouts
import SMELayout from "./layouts/SMELayout";

// Auth guard
import ProtectedRoute from "./components/ProtectedRoute";

// SME pages
import SMEDashboard from "./pages/sme/SMEDashboard";
import SubmitInvoice from "./pages/sme/SubmitInvoice";
import MyInvoices from "./pages/sme/MyInvoices";
import InvoiceDetail from "./pages/sme/InvoiceDetail";

// Google Fonts — DM Sans
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href =
  "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap";
document.head.appendChild(fontLink);

// Global baseline styles injected once
const styleEl = document.createElement("style");
styleEl.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root {
    height: 100%;
    background: #0f172a;
    color: #e2e8f0;
    font-family: 'DM Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #0f172a; }
  ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #475569; }
  a { text-decoration: none; color: inherit; }
  button { font-family: 'DM Sans', sans-serif; }
  input, textarea, select { font-family: 'DM Sans', sans-serif; }
`;
document.head.appendChild(styleEl);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Root redirect ── */}
        <Route path="/" element={<Navigate to="/sme/dashboard" replace />} />

        {/* ── SME routes ── */}
        <Route
          path="/sme"
          element={
            <ProtectedRoute allowedRoles={["sme"]}>
              <SMELayout />
            </ProtectedRoute>
          }
        >
          {/* /sme → /sme/dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SMEDashboard />} />
          <Route path="submit-invoice" element={<SubmitInvoice />} />
          <Route path="invoices" element={<MyInvoices />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />
          {/* Wallet placeholder — replace with your Wallet page */}
          <Route
            path="wallet"
            element={
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#475569",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <p style={{ fontSize: "15px" }}>Wallet page coming soon.</p>
              </div>
            }
          />
        </Route>

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/sme/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
