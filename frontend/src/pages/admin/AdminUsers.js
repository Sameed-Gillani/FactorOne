import React from "react";
import DashboardShell from "../../components/ui/DashboardShell";
const nav=[
  {to:"/admin/dashboard",label:"Dashboard",icon:<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={3} y={3} width={7} height={7}/><rect x={14} y={3} width={7} height={7}/><rect x={14} y={14} width={7} height={7}/><rect x={3} y={14} width={7} height={7}/></svg>},
  {to:"/admin/invoices",label:"Invoices",icon:<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>},
  {to:"/admin/users",label:"Users",icon:<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={9} cy={7} r={4}/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>},
];
export default function AdminUsers() {
  return (
    <DashboardShell navItems={nav}>
      <div className="animate-slide-up">
        <h1 className="font-display text-3xl text-white mb-6">User Management</h1>
        <div className="card p-8 text-center text-slate-500">User management coming soon.</div>
      </div>
    </DashboardShell>
  );
}
