import React from "react";
import DashboardShell from "../../components/ui/DashboardShell";
const nav=[
  {to:"/investor/dashboard",label:"Dashboard",icon:<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={3} y={3} width={7} height={7}/><rect x={14} y={3} width={7} height={7}/><rect x={14} y={14} width={7} height={7}/><rect x={3} y={14} width={7} height={7}/></svg>},
  {to:"/investor/market",label:"Marketplace",icon:<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx={9} cy={21} r={1}/><circle cx={20} cy={21} r={1}/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>},
  {to:"/investor/portfolio",label:"Portfolio",icon:<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>},
  {to:"/investor/wallet",label:"Wallet",icon:<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={2} y={5} width={20} height={14} rx={2}/><line x1={2} y1={10} x2={22} y2={10}/></svg>},
];
export default function InvestorMarket() {
  return (
    <DashboardShell navItems={nav}>
      <div className="animate-slide-up">
        <h1 className="font-display text-3xl text-white mb-6">Invoice Marketplace</h1>
        <div className="card p-8 text-center text-slate-500">Marketplace coming soon.</div>
      </div>
    </DashboardShell>
  );
}
