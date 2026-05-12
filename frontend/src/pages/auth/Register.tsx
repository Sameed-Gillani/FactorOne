import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Building2, TrendingUp as InvestIcon, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'sme' | 'investor' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '', cnic: '',
    businessName: '', ntn: '', sector: '', city: '', experienceLevel: '',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!role) return;
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password,
        phone: form.phone, cnic: form.cnic, role,
        businessName: form.businessName, ntn: form.ntn, sector: form.sector,
        city: form.city, experienceLevel: form.experienceLevel });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-emerald-400 text-3xl">✓</span>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Registration Successful!</h2>
          <p className="text-slate-400 text-sm mb-6">Your account is pending admin approval. You'll receive a notification once approved.</p>
          <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium inline-block">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-2xl font-bold">FactorOne</span>
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2].map(s => (
              <div key={s} className={`h-1.5 w-16 rounded-full transition-colors ${step >= s ? 'bg-blue-600' : 'bg-slate-700'}`} />
            ))}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
          {error && <div className="mb-4 bg-red-500/15 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>}

          {step === 1 && (
            <div>
              <h2 className="text-white text-xl font-bold mb-2">Choose your role</h2>
              <p className="text-slate-400 text-sm mb-6">How will you use FactorOne?</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setRole('sme'); setStep(2); }}
                  className={`p-5 border-2 rounded-xl text-left transition-all ${role === 'sme' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500'}`}>
                  <Building2 className="w-8 h-8 text-blue-400 mb-3" />
                  <div className="text-white font-semibold text-sm">SME / Business</div>
                  <div className="text-slate-400 text-xs mt-1">List invoices to get funded</div>
                </button>
                <button onClick={() => { setRole('investor'); setStep(2); }}
                  className={`p-5 border-2 rounded-xl text-left transition-all ${role === 'investor' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 hover:border-slate-500'}`}>
                  <InvestIcon className="w-8 h-8 text-emerald-400 mb-3" />
                  <div className="text-white font-semibold text-sm">Investor</div>
                  <div className="text-slate-400 text-xs mt-1">Fund invoices and earn returns</div>
                </button>
              </div>
            </div>
          )}

          {step === 2 && role && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <button type="button" onClick={() => setStep(1)} className="text-slate-400 hover:text-white text-sm">←</button>
                <h2 className="text-white text-lg font-bold">{role === 'sme' ? 'Business Details' : 'Investor Details'}</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-slate-300 text-xs font-medium mb-1 block">Full Name *</label>
                  <input type="text" value={form.name} onChange={set('name')} required placeholder="Ahmed Ali"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="text-slate-300 text-xs font-medium mb-1 block">Email *</label>
                  <input type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-slate-300 text-xs font-medium mb-1 block">Phone</label>
                  <input type="tel" value={form.phone} onChange={set('phone')} placeholder="03XX-XXXXXXX"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-slate-300 text-xs font-medium mb-1 block">CNIC</label>
                  <input type="text" value={form.cnic} onChange={set('cnic')} placeholder="XXXXX-XXXXXXX-X"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                </div>

                {role === 'sme' ? (
                  <>
                    <div>
                      <label className="text-slate-300 text-xs font-medium mb-1 block">Business Name *</label>
                      <input type="text" value={form.businessName} onChange={set('businessName')} required placeholder="Company Ltd."
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-slate-300 text-xs font-medium mb-1 block">NTN *</label>
                      <input type="text" value={form.ntn} onChange={set('ntn')} required placeholder="1234567"
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-slate-300 text-xs font-medium mb-1 block">Sector</label>
                      <select value={form.sector} onChange={set('sector')}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500">
                        <option value="">Select sector</option>
                        <option value="Textile">Textile</option>
                        <option value="Logistics">Logistics</option>
                        <option value="IT Services">IT Services</option>
                        <option value="FMCG">FMCG</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-slate-300 text-xs font-medium mb-1 block">City</label>
                      <input type="text" value={form.city} onChange={set('city')} placeholder="Karachi"
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-slate-300 text-xs font-medium mb-1 block">Experience</label>
                      <select value={form.experienceLevel} onChange={set('experienceLevel')}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500">
                        <option value="">Select level</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-slate-300 text-xs font-medium mb-1 block">Password *</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')} required placeholder="Min 8 chars"
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 pr-10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-slate-300 text-xs font-medium mb-1 block">Confirm Password *</label>
                  <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required placeholder="Re-enter"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-lg font-semibold mt-2">
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
