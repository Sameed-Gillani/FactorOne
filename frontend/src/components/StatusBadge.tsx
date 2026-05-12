type BadgeVariant = 'pending' | 'verified' | 'funded' | 'rejected' | 'active' | 'matured' | 'cancelled' | 'matched' | 'not_found' | 'unchecked' | 'Good' | 'Average' | 'Poor' | 'N/A' | 'topup' | 'investment' | 'disbursement' | 'withdrawal' | 'transaction' | 'system' | 'approval' | 'sme' | 'investor' | 'admin' | string;

const variantMap: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  verified: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  funded: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-300 border border-red-500/30',
  active: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  matured: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  cancelled: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
  matched: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  not_found: 'bg-red-500/15 text-red-300 border border-red-500/30',
  unchecked: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
  Good: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  Average: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  Poor: 'bg-red-500/15 text-red-300 border border-red-500/30',
  'N/A': 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
  topup: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  investment: 'bg-red-500/15 text-red-300 border border-red-500/30',
  disbursement: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  withdrawal: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  transaction: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  system: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
  approval: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  sme: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  investor: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  admin: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  'blocked': 'bg-red-500/15 text-red-300 border border-red-500/30',
};

const labelMap: Record<string, string> = {
  not_found: 'Not Found',
  'N/A': 'N/A',
  topup: 'Top Up',
};

export default function StatusBadge({ status }: { status: BadgeVariant }) {
  const cls = variantMap[status] ?? 'bg-slate-500/15 text-slate-300 border border-slate-500/30';
  const label = labelMap[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}
