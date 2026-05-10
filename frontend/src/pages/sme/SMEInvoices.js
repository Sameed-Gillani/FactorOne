import React from "react";
import DashboardShell from "../../components/ui/DashboardShell";
const nav=[
  {to:"/sme/dashboard",label:"Dashboard",icon:<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={3} y={3} width={7} height={7}/><rect x={14} y={3} width={7} height={7}/><rect x={14} y={14} width={7} height={7}/><rect x={3} y={14} width={7} height={7}/></svg>},
  {to:"/sme/invoices",label:"My Invoices",icon:<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>},
  {to:"/sme/wallet",label:"Wallet",icon:<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={2} y={5} width={20} height={14} rx={2}/><line x1={2} y1={10} x2={22} y2={10}/></svg>},
];
export default function SMEInvoices() {
  return (
    <DashboardShell navItems={nav}>
      <div className="animate-slide-up">
        <h1 className="font-display text-3xl text-white mb-6">My Invoices</h1>
        <div className="card p-8 text-center text-slate-500">Invoice management coming soon.</div>
      </div>
    </DashboardShell>
  );
}
