import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileText, PlusCircle, TrendingUp, ShoppingBag,
  Users, Wallet, Bell, Settings, LogOut, ChevronRight, BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
}

const smeLinks: NavItem[] = [
  { label: 'Dashboard', to: '/sme/dashboard', icon: LayoutDashboard },
  { label: 'Submit Invoice', to: '/sme/submit', icon: PlusCircle },
  { label: 'My Invoices', to: '/sme/invoices', icon: FileText },
  { label: 'Wallet', to: '/wallet', icon: Wallet },
  { label: 'Notifications', to: '/notifications', icon: Bell },
];

const investorLinks: NavItem[] = [
  { label: 'Dashboard', to: '/investor/dashboard', icon: LayoutDashboard },
  { label: 'Marketplace', to: '/investor/marketplace', icon: ShoppingBag },
  { label: 'My Investments', to: '/investor/investments', icon: TrendingUp },
  { label: 'Wallet', to: '/wallet', icon: Wallet },
  { label: 'Notifications', to: '/notifications', icon: Bell },
];

const adminLinks: NavItem[] = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: BarChart3 },
  { label: 'Invoice Queue', to: '/admin/invoices', icon: FileText },
  { label: 'User Management', to: '/admin/users', icon: Users },
  { label: 'Notifications', to: '/notifications', icon: Bell },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  const links =
    user?.role === 'admin' ? adminLinks :
    user?.role === 'investor' ? investorLinks : smeLinks;

  const roleLabel =
    user?.role === 'admin' ? 'Admin' :
    user?.role === 'investor' ? 'Investor' : 'SME';

  const roleColor =
    user?.role === 'admin' ? 'text-amber-400' :
    user?.role === 'investor' ? 'text-emerald-400' : 'text-blue-400';

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-700/50 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">FactorOne</h1>
            <p className="text-slate-400 text-xs mt-0.5">Invoice Marketplace</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-slate-700/50">
        <div className="bg-slate-800 rounded-lg px-3 py-2.5">
          <p className="text-white text-sm font-medium truncate">{user?.name || 'User'}</p>
          <p className={`text-xs font-medium mt-0.5 ${roleColor}`}>{roleLabel}</p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} className="text-blue-200" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-slate-700/50 space-y-1">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
