import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import StatusBadge from '../../components/StatusBadge';
import api, { Invoice, formatPKR, formatDate } from '../../lib/api';

export default function InvestorInvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [investAmount, setInvestAmount] = useState('');
  const [investing, setInvesting] = useState(false);
  const [investError, setInvestError] = useState('');
  const [investSuccess, setInvestSuccess] = useState(false);
  const [wallet, setWallet] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/invoices/${id}`),
      api.get('/wallet'),
    ]).then(([invRes, walletRes]) => {
      setInvoice(invRes.data.invoice);
      setWallet(walletRes.data.wallet);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const remaining = invoice ? invoice.amountPkr - (invoice.fundedAmount || 0) : 0;
  const amount = parseFloat(investAmount) || 0;
  const expectedReturn = amount * ((invoice?.discountRate || 3) / 100);
  const daysLeft = invoice ? Math.ceil((new Date(invoice.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  const handleInvest = async () => {
    setInvestError('');
    if (amount < 10000) { setInvestError('Minimum investment is PKR 10,000.'); return; }
    if (amount > remaining) { setInvestError(`Maximum you can invest: ${formatPKR(remaining)}.`); return; }
    if (wallet && amount > wallet.availableBalance) { setInvestError('Insufficient wallet balance. Please top up.'); return; }
    setInvesting(true);
    try {
      await api.post('/investments', { invoiceId: id, amount });
      setInvestSuccess(true);
      setTimeout(() => navigate('/investor/investments'), 2000);
    } catch (err: any) {
      setInvestError(err?.response?.data?.message || 'Investment failed. Please try again.');
    } finally {
      setInvesting(false);
    }
  };

  if (loading) return <PageLayout title="Invoice Detail"><div className="p-8 text-center text-slate-400">Loading...</div></PageLayout>;
  if (!invoice) return <PageLayout title="Invoice Detail"><div className="p-8 text-center text-slate-400">Invoice not found.</div></PageLayout>;

  return (
    <PageLayout title="Invoice Detail">
      <div className="max-w-5xl mx-auto">
        <Link to="/investor/marketplace" className="text-slate-400 hover:text-white text-sm mb-4 inline-block">← Back to Marketplace</Link>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Invoice Info */}
          <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-xs font-mono">{invoice.invoiceNumber}</p>
                <h2 className="text-white text-xl font-bold mt-1">{invoice.anchorCompany}</h2>
                {invoice.sector && <p className="text-slate-500 text-sm">{invoice.sector}</p>}
              </div>
              <StatusBadge status={invoice.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Invoice Amount', formatPKR(invoice.amountPkr)],
                ['Discount Rate', `${invoice.discountRate}%`],
                ['Issue Date', formatDate(invoice.issueDate)],
                ['Due Date', formatDate(invoice.dueDate)],
                ['Days to Maturity', `${daysLeft} days`],
                ['Credit Score', invoice.creditScore],
                ['FBR Status', invoice.fbrStatus],
                ['NTN', invoice.ntn],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-slate-400 text-xs mb-0.5">{label}</p>
                  <p className="text-white font-medium">{val}</p>
                </div>
              ))}
            </div>

            {/* Funding Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Funding Progress</span>
                <span className="text-white">{formatPKR(invoice.fundedAmount || 0)} / {formatPKR(invoice.amountPkr)}</span>
              </div>
              <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.round(((invoice.fundedAmount || 0) / invoice.amountPkr) * 100)}%` }} />
              </div>
              <p className="text-slate-400 text-xs mt-1">{formatPKR(remaining)} remaining to be funded</p>
            </div>
          </div>

          {/* Investment Panel */}
          <div className="space-y-4">
            {/* Wallet balance */}
            {wallet && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <p className="text-slate-400 text-xs mb-1">Your Wallet Balance</p>
                <p className="text-white text-2xl font-bold">{formatPKR(wallet.availableBalance)}</p>
                <Link to="/wallet" className="text-blue-400 text-xs hover:text-blue-300 mt-1 inline-block">Top up →</Link>
              </div>
            )}

            {/* Yield Calculator */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
              <h3 className="text-white font-semibold">Yield Calculator</h3>

              {investSuccess ? (
                <div className="text-center py-4">
                  <div className="text-emerald-400 text-4xl mb-2">✓</div>
                  <p className="text-emerald-400 font-semibold">Investment Placed!</p>
                  <p className="text-slate-400 text-xs mt-1">Redirecting to portfolio...</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-slate-400 text-xs mb-1.5 block">Investment Amount (PKR)</label>
                    <input type="number" value={investAmount} onChange={e => setInvestAmount(e.target.value)}
                      min="10000" max={remaining} placeholder="Min PKR 10,000"
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
                  </div>

                  {amount > 0 && (
                    <div className="bg-slate-900 rounded-lg p-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">You Invest</span>
                        <span className="text-white font-medium">{formatPKR(amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Expected Return</span>
                        <span className="text-emerald-400 font-medium">+{formatPKR(expectedReturn)}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                        <span className="text-slate-400">Total at Maturity</span>
                        <span className="text-white font-bold">{formatPKR(amount + expectedReturn)}</span>
                      </div>
                      <p className="text-slate-500 text-xs">By {formatDate(invoice.dueDate)}</p>
                    </div>
                  )}

                  {investError && <p className="text-red-400 text-xs">{investError}</p>}

                  <button onClick={handleInvest} disabled={investing || !investAmount || invoice.status !== 'verified'}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold text-sm transition-colors">
                    {investing ? 'Processing...' : invoice.status !== 'verified' ? 'Not Available' : 'Invest Now'}
                  </button>
                  <p className="text-slate-500 text-xs text-center">Minimum investment: PKR 10,000</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
