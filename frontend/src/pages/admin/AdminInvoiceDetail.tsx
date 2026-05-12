import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Search, TrendingUp } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import StatusBadge from '../../components/StatusBadge';
import api, { Invoice, formatPKR, formatDate } from '../../lib/api';

export default function AdminInvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNote, setAdminNote] = useState('');
  const [fbrLoading, setFbrLoading] = useState(false);
  const [creditLoading, setCreditLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    api.get(`/invoices/${id}`).then(res => {
      setInvoice(res.data.invoice);
      setAdminNote(res.data.invoice?.adminNote || '');
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const runFBR = async () => {
    setFbrLoading(true);
    try {
      const res = await api.get(`/invoices/${id}/fbr-check`);
      setInvoice(prev => prev ? { ...prev, fbrStatus: res.data.fbrStatus } : prev);
      setMessage(res.data.message);
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'FBR check failed.');
    } finally {
      setFbrLoading(false);
    }
  };

  const runCredit = async () => {
    setCreditLoading(true);
    try {
      const res = await api.get(`/invoices/${id}/credit-check`);
      setInvoice(prev => prev ? { ...prev, creditScore: res.data.creditScore } : prev);
      setMessage(res.data.message);
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Credit check failed.');
    } finally {
      setCreditLoading(false);
    }
  };

  const handleDecision = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !adminNote.trim()) {
      setMessage('A rejection reason is required.'); return;
    }
    setActionLoading(true);
    try {
      await api.patch(`/invoices/${id}/${action}`, { adminNote });
      setMessage(`Invoice ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
      setTimeout(() => navigate('/admin/invoices'), 1500);
    } catch (e: any) {
      setMessage(e?.response?.data?.message || `${action} failed.`);
    } finally {
      setActionLoading(false);
    }
  };

  const fbrColor = { unchecked: 'text-slate-400', matched: 'text-emerald-400 bg-emerald-500/10', not_found: 'text-red-400 bg-red-500/10' };
  const creditColor = { 'N/A': 'text-slate-400', Good: 'text-emerald-400 bg-emerald-500/10', Average: 'text-amber-400 bg-amber-500/10', Poor: 'text-red-400 bg-red-500/10' };

  if (loading) return <PageLayout title="Invoice Review"><div className="p-8 text-center text-slate-400">Loading...</div></PageLayout>;
  if (!invoice) return <PageLayout title="Invoice Review"><div className="p-8 text-center text-slate-400">Invoice not found.</div></PageLayout>;

  const sme = typeof invoice.smeId === 'object' ? invoice.smeId : null;

  return (
    <PageLayout title="Invoice Review">
      <div className="max-w-4xl mx-auto space-y-5">
        <Link to="/admin/invoices" className="text-slate-400 hover:text-white text-sm">← Invoice Queue</Link>

        {message && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-blue-400 text-sm">{message}</div>
        )}

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Invoice Details */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-white text-lg font-bold">{invoice.invoiceNumber}</h2>
                  <p className="text-slate-400 text-sm">{invoice.anchorCompany}</p>
                </div>
                <StatusBadge status={invoice.status} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Amount', formatPKR(invoice.amountPkr)],
                  ['Discount Rate', `${invoice.discountRate}%`],
                  ['Issue Date', formatDate(invoice.issueDate)],
                  ['Due Date', formatDate(invoice.dueDate)],
                  ['NTN', invoice.ntn],
                  ['Sector', invoice.sector || '—'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-slate-400 text-xs mb-0.5">{label}</p>
                    <p className="text-white font-medium">{val}</p>
                  </div>
                ))}
              </div>

              {sme && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-slate-400 text-xs mb-2">SME Details</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-slate-400 text-xs">Business</p><p className="text-white">{sme.businessName || sme.name}</p></div>
                    <div><p className="text-slate-400 text-xs">Email</p><p className="text-white">{sme.email}</p></div>
                    <div><p className="text-slate-400 text-xs">Phone</p><p className="text-white">{sme.phone || '—'}</p></div>
                    <div><p className="text-slate-400 text-xs">NTN</p><p className="text-white">{sme.ntn || invoice.ntn}</p></div>
                  </div>
                </div>
              )}
            </div>

            {/* Verification Checks */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
              <h3 className="text-white font-semibold">Verification Checks</h3>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">FBR NTN Check</p>
                  <p className="text-slate-400 text-xs">Verify NTN against FBR records</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${fbrColor[invoice.fbrStatus] || 'text-slate-400'}`}>
                    {invoice.fbrStatus}
                  </span>
                  <button onClick={runFBR} disabled={fbrLoading}
                    className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                    <Search className="w-3.5 h-3.5" />
                    {fbrLoading ? 'Checking...' : 'Check FBR'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">Credit Score</p>
                  <p className="text-slate-400 text-xs">Anchor company credit rating</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${creditColor[invoice.creditScore] || 'text-slate-400'}`}>
                    {invoice.creditScore}
                  </span>
                  <button onClick={runCredit} disabled={creditLoading}
                    className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {creditLoading ? 'Checking...' : 'Check Credit'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Decision Panel */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4 h-fit">
            <h3 className="text-white font-semibold">Decision</h3>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Admin Note {invoice.status === 'pending' ? '(required for rejection)' : ''}</label>
              <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={4}
                placeholder="Write a note or reason..."
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none" />
            </div>

            {invoice.status === 'pending' ? (
              <div className="space-y-2">
                <button onClick={() => handleDecision('approve')} disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold">
                  <CheckCircle className="w-4 h-4" /> {actionLoading ? 'Processing...' : 'Approve Invoice'}
                </button>
                <button onClick={() => handleDecision('reject')} disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold">
                  <XCircle className="w-4 h-4" /> {actionLoading ? 'Processing...' : 'Reject Invoice'}
                </button>
              </div>
            ) : (
              <div className={`text-center py-2 rounded-lg text-sm font-medium ${
                invoice.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400' :
                invoice.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                'bg-blue-500/10 text-blue-400'
              }`}>
                {invoice.status === 'verified' ? '✓ Approved' : invoice.status === 'rejected' ? '✗ Rejected' : `Status: ${invoice.status}`}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
