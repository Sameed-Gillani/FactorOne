import React from "react";
import DashboardShell from "../../components/ui/DashboardShell";
import { useAuth } from "../../context/AuthContext";
const nav=[
  {to:"/sme/dashboard",label:"Dashboard",icon:<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={3} y={3} width={7} height={7}/><rect x={14} y={3} width={7} height={7}/><rect x={14} y={14} width={7} height={7}/><rect x={3} y={14} width={7} height={7}/></svg>},
  {to:"/sme/invoices",label:"My Invoices",icon:<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>},
  {to:"/sme/wallet",label:"Wallet",icon:<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={2} y={5} width={20} height={14} rx={2}/><line x1={2} y1={10} x2={22} y2={10}/></svg>},
];
export default function SMEDashboard() {
  const { user } = useAuth();
  return (
    <DashboardShell navItems={nav}>
      <div className="animate-slide-up">
        <h1 className="font-display text-3xl text-white mb-1">Welcome, {user?.name?.split(" ")[0]} 👋</h1>
        <p className="text-slate-500 text-sm mb-8">Here's your SME overview</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[["Total Invoices","0"],["Funded","PKR 0"],["Pending","0"]].map(([l,v])=>(
            <div key={l} className="card p-6"><p className="text-slate-500 text-sm mb-2">{l}</p><p className="text-2xl font-bold text-white">{v}</p></div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
