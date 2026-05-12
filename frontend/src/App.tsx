import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReactNode } from 'react';

import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import SMEDashboard from './pages/sme/SMEDashboard';
import SubmitInvoice from './pages/sme/SubmitInvoice';
import MyInvoices from './pages/sme/MyInvoices';
import InvoiceDetail from './pages/sme/InvoiceDetail';
import InvestorDashboard from './pages/investor/InvestorDashboard';
import Marketplace from './pages/investor/Marketplace';
import InvestorInvoiceDetail from './pages/investor/InvoiceDetail';
import MyInvestments from './pages/investor/MyInvestments';
import AdminDashboard from './pages/admin/AdminDashboard';
import InvoiceQueue from './pages/admin/InvoiceQueue';
import AdminInvoiceDetail from './pages/admin/AdminInvoiceDetail';
import UserManagement from './pages/admin/UserManagement';
import WalletPage from './pages/shared/WalletPage';
import NotificationsPage from './pages/shared/NotificationsPage';
import SettingsPage from './pages/shared/SettingsPage';

function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (user.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center bg-slate-800 border border-slate-700 rounded-2xl p-8">
          <div className="w-16 h-16 bg-amber-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-amber-400 text-3xl font-bold">!</span>
          </div>
          <h2 className="text-white text-xl font-bold">Account Pending Approval</h2>
          <p className="text-slate-400 mt-2 text-sm">Your account is under review. You will be notified once approved.</p>
          <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; }}
            className="mt-5 inline-block text-blue-400 text-sm hover:text-blue-300">Back to Login</button>
        </div>
      </div>
    );
  }

  if (user.status === 'blocked') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center bg-slate-800 border border-red-500/30 rounded-2xl p-8">
          <h2 className="text-white text-xl font-bold">Account Blocked</h2>
          <p className="text-slate-400 mt-2 text-sm">Your account has been blocked. Please contact support.</p>
          <button onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}
            className="mt-5 inline-block text-blue-400 text-sm hover:text-blue-300">Back to Login</button>
        </div>
      </div>
    );
  }

  if (roles && !roles.includes(user.role)) {
    const defaults: Record<string, string> = { sme: '/sme/dashboard', investor: '/investor/dashboard', admin: '/admin/dashboard' };
    return <Navigate to={defaults[user.role] ?? '/login'} replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (user && user.status === 'active') {
    const routes: Record<string, string> = { sme: '/sme/dashboard', investor: '/investor/dashboard', admin: '/admin/dashboard' };
    return <Navigate to={routes[user.role] ?? '/'} replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  const defaultRoute = user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'investor' ? '/investor/dashboard' : user?.role === 'sme' ? '/sme/dashboard' : '/';

  return (
    <Routes>
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      <Route path="/sme/dashboard" element={<ProtectedRoute roles={['sme']}><SMEDashboard /></ProtectedRoute>} />
      <Route path="/sme/submit" element={<ProtectedRoute roles={['sme']}><SubmitInvoice /></ProtectedRoute>} />
      <Route path="/sme/invoices" element={<ProtectedRoute roles={['sme']}><MyInvoices /></ProtectedRoute>} />
      <Route path="/sme/invoices/:id" element={<ProtectedRoute roles={['sme']}><InvoiceDetail /></ProtectedRoute>} />

      <Route path="/investor/dashboard" element={<ProtectedRoute roles={['investor']}><InvestorDashboard /></ProtectedRoute>} />
      <Route path="/investor/marketplace" element={<ProtectedRoute roles={['investor']}><Marketplace /></ProtectedRoute>} />
      <Route path="/investor/invoices/:id" element={<ProtectedRoute roles={['investor']}><InvestorInvoiceDetail /></ProtectedRoute>} />
      <Route path="/investor/investments" element={<ProtectedRoute roles={['investor']}><MyInvestments /></ProtectedRoute>} />

      <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/invoices" element={<ProtectedRoute roles={['admin']}><InvoiceQueue /></ProtectedRoute>} />
      <Route path="/admin/invoices/:id" element={<ProtectedRoute roles={['admin']}><AdminInvoiceDetail /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><UserManagement /></ProtectedRoute>} />

      <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to={defaultRoute} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
