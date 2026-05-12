import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import StatusBadge from '../../components/StatusBadge';
import api, { Invoice, formatPKR, formatDate } from '../../lib/api';

export default function SMEInvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get(`/invoices/${id}`).then(res => setInvoice(res.data.invoice))
      .catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLayout title="Invoice Detail"><div className="p-8 text-center text-slate-400">Loading...</div></PageLayout>;
  if (!invoice) return <PageLayout title="Invoice Detail"><div className="p-8 text-center text-slate-400">Invoice not found.</div></PageLayout>;

  const funded = invoice.fundedAmount || 0;
  const pct = Math.round((funded / invoice.amountPkr) * 100);

  return (
    <PageLayout title="Invoice Detail">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link to="/sme/invoices" className="text-slate-400 hover:text-white text-sm">← My Invoices</Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 text-sm font-mono">{invoice.invoiceNumber}</span>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between">
            <h2 className="text-white text-xl font-bold">{invoice.invoiceNumber}</h2>
            <StatusBadge status={invoice.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['Anchor Company', invoice.anchorCompany],
              ['Amount', formatPKR(invoice.amountPkr)],
              ['Discount Rate', `${invoice.discountRate}%`],
              ['Issue Date', formatDate(invoice.issueDate)],
              ['Due Date', formatDate(invoice.dueDate)],
              ['NTN', invoice.ntn],
              ['Sector', invoice.sector || '—'],
              ['FBR Status', invoice.fbrStatus],
              ['Credit Score', invoice.creditScore],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-slate-400 text-xs mb-0.5">{label}</p>
                <p className="text-white font-medium">{val}</p>
              </div>
            ))}
          </div>

          {invoice.status === 'verified' && (
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Funding Progress</span>
                <span>{pct}% funded</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-slate-400 mt-1">{formatPKR(funded)} of {formatPKR(invoice.amountPkr)}</p>
            </div>
          )}

          {invoice.adminNote && (
            <div className={`rounded-lg p-3 text-sm ${invoice.status === 'rejected' ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'}`}>
              <span className="font-medium">Admin Note: </span>{invoice.adminNote}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
