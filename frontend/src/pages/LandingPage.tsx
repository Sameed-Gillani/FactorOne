import { Link } from 'react-router-dom';
import { TrendingUp, Shield, Zap, CheckCircle, ArrowRight, Building2, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">FactorOne</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#how" className="hover:text-white transition-colors">How It Works</a>
            <a href="#why" className="hover:text-white transition-colors">Why FactorOne</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-slate-300 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">Login</Link>
            <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-400 text-sm mb-6">
            <Zap className="w-4 h-4" /> Pakistan's SME Invoice Discounting Platform
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Unlock Your Invoice.<br /><span className="text-blue-500">Get Paid Today.</span>
          </h1>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            FactorOne connects Pakistani SMEs with investors — turning unpaid invoices into immediate cash, without banks or collateral.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
              I'm an SME <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/register" className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-colors">
              I'm an Investor <TrendingUp className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-slate-800 bg-slate-900/50 py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'SMEs Onboarded', value: '500+' },
            { label: 'Invoices Funded', value: 'PKR 2.4B+' },
            { label: 'Avg. Return', value: '12–18%' },
            { label: 'Avg. Funding Time', value: '24 hrs' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-slate-400 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-slate-400">Three simple steps to unlock your working capital</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Submit Your Invoice', desc: 'Upload your invoice from a corporate client. Our OCR system reads the details automatically.', icon: '📄' },
              { step: '02', title: 'Get Verified', desc: 'Our team verifies your invoice using FBR records and anchor company credit scoring.', icon: '✅' },
              { step: '03', title: 'Receive Funds', desc: 'Once an investor funds your invoice, the amount is credited to your wallet immediately.', icon: '💰' },
            ].map(item => (
              <div key={item.step} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="text-blue-500 text-sm font-mono font-bold mb-2">{item.step}</div>
                <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why FactorOne */}
      <section id="why" className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Why FactorOne?</h2>
            <p className="text-slate-400">Built for Pakistan's SME ecosystem</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'No Collateral Required', desc: 'We use the creditworthiness of your corporate client — not your personal assets — as the basis for financing.', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { icon: CheckCircle, title: 'Verified Invoices Only', desc: 'Every invoice is checked against FBR records and anchor company credit scores before going live on the marketplace.', color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { icon: TrendingUp, title: 'Fast Returns for Investors', desc: 'Short-duration (30–90 day) investments backed by real corporate payment obligations, yielding 12–18% p.a.', color: 'text-amber-400', bg: 'bg-amber-500/10' },
            ].map(item => (
              <div key={item.title} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-slate-400 mb-8">Join hundreds of Pakistani SMEs and investors already using FactorOne.</p>
          <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-4 rounded-xl inline-flex items-center gap-2 text-lg transition-colors">
            Create Free Account <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-6 text-center text-slate-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold">FactorOne</span>
        </div>
        <p>© {new Date().getFullYear()} FactorOne. SME Invoice Discounting Marketplace — Pakistan.</p>
      </footer>
    </div>
  );
}
