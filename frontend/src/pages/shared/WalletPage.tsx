import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import api, { formatPKR, formatDate } from '../../lib/api';

export default function WalletPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [processing, setProcessing] = useState('');
  const [message, setMessage] = useState('');

  const load = () => {
    api.get('/wallet').then(res => {
      setWallet(res.data.wallet);
      setTransactions(res.data.transactions?.records || []);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(topupAmount);
    if (!amount || amount < 100) { setMessage('Minimum top-up is PKR 100.'); return; }
    setProcessing('topup');
    try {
      await api.post('/wallet/topup', { amount });
      setMessage(`PKR ${formatPKR(amount)} added to wallet.`);
      setTopupAmount('');
      load();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Top-up failed.');
    } finally {
      setProcessing('');
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 500) { setMessage('Minimum withdrawal is PKR 500.'); return; }
    setProcessing('withdraw');
    try {
      await api.post('/wallet/withdraw', { amount });
      setMessage(`PKR ${formatPKR(amount)} withdrawal processed.`);
      setWithdrawAmount('');
      load();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Withdrawal failed.');
    } finally {
      setProcessing('');
    }
  };

  const txIcon = (dir: string) => dir === 'credit'
    ? <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
    : <ArrowUpRight className="w-4 h-4 text-red-400" />;

  const txColor = (dir: string) => dir === 'credit' ? 'text-emerald-400' : 'text-red-400';

  return (
    <PageLayout title="Wallet">
      <div className="max-w-3xl mx-auto space-y-5">
        {message && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-blue-400 text-sm">
            {message}
            <button onClick={() => setMessage('')} className="ml-2 text-slate-400 hover:text-white">×</button>
          </div>
        )}

        {/* Balance Card */}
        {!loading && wallet && (
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-blue-200" />
              <span className="text-blue-200 text-sm">Available Balance</span>
            </div>
            <p className="text-white text-4xl font-bold">{formatPKR(wallet.availableBalance)}</p>
            {wallet.frozenBalance > 0 && (
              <p className="text-blue-200 text-sm mt-2">{formatPKR(wallet.frozenBalance)} frozen (in active investments)</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-3 text-sm">Add Funds</h3>
            <form onSubmit={handleTopup} className="space-y-3">
              <input type="number" value={topupAmount} onChange={e => setTopupAmount(e.target.value)}
                placeholder="Amount (min PKR 100)" min="100"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
              <button type="submit" disabled={processing === 'topup'}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold">
                {processing === 'topup' ? 'Processing...' : 'Add Funds'}
              </button>
            </form>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-3 text-sm">Withdraw</h3>
            <form onSubmit={handleWithdraw} className="space-y-3">
              <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                placeholder="Amount (min PKR 500)" min="500"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
              <button type="submit" disabled={processing === 'withdraw'}
                className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold">
                {processing === 'withdraw' ? 'Processing...' : 'Withdraw'}
              </button>
            </form>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700">
            <h3 className="text-white font-semibold">Transaction History</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No transactions yet.</div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {transactions.map((tx: any) => (
                <div key={tx._id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                      {txIcon(tx.direction)}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium capitalize">{tx.type}</p>
                      <p className="text-slate-400 text-xs">{tx.description || formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${txColor(tx.direction)}`}>
                      {tx.direction === 'credit' ? '+' : '-'}{formatPKR(tx.amount)}
                    </p>
                    <p className="text-slate-500 text-xs">Balance: {formatPKR(tx.balanceAfter)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
