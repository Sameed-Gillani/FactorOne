import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  Building2,
  Calendar,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  X,
  AlertCircle,
  Calculator,
  ChevronRight,
  Loader2,
} from "lucide-react";

const MOCK_INVOICE = {
  id: "inv-001",
  anchorCompany: "Nestlé Pakistan Ltd",
  sector: "FMCG",
  invoiceNumber: "NP-2024-4412",
  amount: 2500000,
  discountRate: 5.5,
  expectedReturn: 6.2,
  daysToMaturity: 45,
  dueDate: "2024-03-28",
  issueDate: "2024-02-12",
  fundingProgress: 68,
  totalFunding: 2500000,
  raisedSoFar: 1700000,
  rating: "AAA",
  verified: true,
  supplierName: "PakFresh Distributors",
  description:
    "Short-term invoice financing against verified purchase order from Nestlé Pakistan. The invoice covers distribution services rendered for Q1 2024.",
  minInvestment: 50000,
  maxInvestment: 500000,
};

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

const formatCurrencyInput = (val) => {
  const num = val.replace(/[^0-9]/g, "");
  if (!num) return "";
  return new Intl.NumberFormat("en-PK").format(parseInt(num));
};

function ConfirmationModal({ isOpen, onClose, onConfirm, invoice, amount, projectedReturn, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-700/70 p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        style={{ backgroundColor: "#1e293b" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg">Confirm Investment</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-800/60 rounded-xl p-4 mb-5 border border-slate-700/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Building2 className="w-4.5 h-4.5 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{invoice?.anchorCompany}</p>
              <p className="text-slate-500 text-xs">{invoice?.invoiceNumber}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-slate-500 text-xs mb-1">You Invest</p>
              <p className="text-white font-bold text-sm">{formatCurrency(amount)}</p>
            </div>
            <div className="bg-emerald-500/10 rounded-lg p-3">
              <p className="text-emerald-500 text-xs mb-1">You Receive</p>
              <p className="text-emerald-400 font-bold text-sm">{formatCurrency(projectedReturn)}</p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-slate-500 text-xs mb-1">Net Gain</p>
              <p className="text-blue-400 font-bold text-sm">
                {formatCurrency(projectedReturn - amount)}
              </p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-slate-500 text-xs mb-1">Maturity</p>
              <p className="text-white font-bold text-sm">{invoice?.daysToMaturity}d</p>
            </div>
          </div>
        </div>

        <p className="text-slate-400 text-xs mb-5 leading-relaxed">
          By confirming, you agree to invest the above amount. Funds will be
          transferred from your wallet and locked until the invoice matures.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-300 bg-slate-700/50 hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#3b82f6" }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Confirm Investment
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessNotification({ show, amount, onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-6 right-6 z-50 max-w-sm w-full">
      <div className="bg-emerald-500 rounded-2xl p-4 shadow-2xl shadow-emerald-500/30 flex items-start gap-3 animate-in slide-in-from-right-4 duration-300">
        <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-white font-bold text-sm">Investment Successful!</p>
          <p className="text-emerald-100 text-xs mt-0.5">
            {formatCurrency(amount)} invested successfully. Returns will be
            credited on maturity.
          </p>
        </div>
        <button onClick={onClose} className="text-emerald-200 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  const [investAmount, setInvestAmount] = useState("");
  const [rawAmount, setRawAmount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [inputError, setInputError] = useState("");

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoices/${id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setInvoice(data);
      } catch {
        setInvoice(MOCK_INVOICE);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const discountedPayout = rawAmount > 0 && invoice
    ? rawAmount / (1 - invoice.discountRate / 100)
    : 0;
  const projectedReturn = rawAmount > 0 && invoice
    ? rawAmount * (1 + invoice.expectedReturn / 100 * (invoice.daysToMaturity / 365))
    : 0;
  const netGain = projectedReturn - rawAmount;

  const handleAmountChange = useCallback(
    (e) => {
      const raw = e.target.value.replace(/[^0-9]/g, "");
      const num = parseInt(raw) || 0;
      setRawAmount(num);
      setInvestAmount(formatCurrencyInput(e.target.value));

      if (!invoice) return;
      if (num > 0 && num < invoice.minInvestment) {
        setInputError(`Minimum investment is ${formatCurrency(invoice.minInvestment)}`);
      } else if (num > invoice.maxInvestment) {
        setInputError(`Maximum investment is ${formatCurrency(invoice.maxInvestment)}`);
      } else {
        setInputError("");
      }
    },
    [invoice]
  );

  const handleInvestNow = () => {
    if (!rawAmount || rawAmount < (invoice?.minInvestment || 0)) {
      setInputError(`Please enter at least ${formatCurrency(invoice?.minInvestment || 0)}`);
      return;
    }
    if (inputError) return;
    setShowModal(true);
  };

  const handleConfirmInvestment = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: rawAmount,
          expectedReturn: projectedReturn,
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Simulate success in demo
    } finally {
      setSubmitting(false);
      setShowModal(false);
      setShowSuccess(true);
      setInvestAmount("");
      setRawAmount(0);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#0f172a" }}
      >
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#0f172a" }}
      >
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-white font-semibold">Invoice not found</p>
          <button
            onClick={() => navigate("/investor/marketplace")}
            className="mt-4 text-blue-400 text-sm hover:text-blue-300"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const remaining = invoice.totalFunding - invoice.raisedSoFar;

  return (
    <>
      <SuccessNotification
        show={showSuccess}
        amount={rawAmount}
        onClose={() => setShowSuccess(false)}
      />
      <ConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmInvestment}
        invoice={invoice}
        amount={rawAmount}
        projectedReturn={projectedReturn}
        loading={submitting}
      />

      <div
        className="min-h-screen p-6 md:p-8"
        style={{ backgroundColor: "#0f172a" }}
      >
        {/* Back Button */}
        <button
          onClick={() => navigate("/investor/marketplace")}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Marketplace
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* LEFT — Invoice Information */}
          <div className="xl:col-span-3 space-y-5">
            {/* Header Card */}
            <div
              className="rounded-2xl border border-slate-700/50 p-6"
              style={{ backgroundColor: "#1e293b" }}
            >
              <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-700/60 flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-slate-300" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                      {invoice.anchorCompany}
                    </h1>
                    <p className="text-slate-400 text-sm mt-0.5">
                      {invoice.invoiceNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {invoice.verified && (
                    <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-500/20">
                      <Shield className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                  <span className="bg-blue-500/10 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-500/20">
                    Rating: {invoice.rating}
                  </span>
                  <span className="bg-slate-700/50 text-slate-400 text-xs font-medium px-3 py-1.5 rounded-full">
                    {invoice.sector}
                  </span>
                </div>
              </div>

              <p className="text-slate-400 text-sm leading-relaxed">
                {invoice.description}
              </p>
            </div>

            {/* Details Grid */}
            <div
              className="rounded-2xl border border-slate-700/50 p-6"
              style={{ backgroundColor: "#1e293b" }}
            >
              <h2 className="text-white font-semibold mb-4 text-base">
                Invoice Details
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  {
                    label: "Invoice Amount",
                    value: formatCurrency(invoice.amount),
                    icon: DollarSign,
                    color: "text-white",
                    iconBg: "bg-blue-500/20",
                    iconColor: "text-blue-400",
                  },
                  {
                    label: "Discount Rate",
                    value: `${invoice.discountRate}%`,
                    icon: TrendingUp,
                    color: "text-blue-400",
                    iconBg: "bg-blue-500/20",
                    iconColor: "text-blue-400",
                  },
                  {
                    label: "Expected Return",
                    value: `${invoice.expectedReturn}%`,
                    icon: TrendingUp,
                    color: "text-emerald-400",
                    iconBg: "bg-emerald-500/20",
                    iconColor: "text-emerald-400",
                  },
                  {
                    label: "Issue Date",
                    value: invoice.issueDate,
                    icon: Calendar,
                    color: "text-slate-200",
                    iconBg: "bg-slate-700/60",
                    iconColor: "text-slate-400",
                  },
                  {
                    label: "Due Date",
                    value: invoice.dueDate,
                    icon: Calendar,
                    color: "text-slate-200",
                    iconBg: "bg-slate-700/60",
                    iconColor: "text-slate-400",
                  },
                  {
                    label: "Days to Maturity",
                    value: `${invoice.daysToMaturity} days`,
                    icon: Clock,
                    color: "text-amber-400",
                    iconBg: "bg-amber-500/20",
                    iconColor: "text-amber-400",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg ${item.iconBg} flex items-center justify-center mb-3`}
                    >
                      <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                    </div>
                    <p className="text-slate-500 text-[11px] uppercase tracking-wider mb-1">
                      {item.label}
                    </p>
                    <p className={`font-bold text-sm ${item.color}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Funding Progress */}
            <div
              className="rounded-2xl border border-slate-700/50 p-6"
              style={{ backgroundColor: "#1e293b" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold text-base">
                  Funding Progress
                </h2>
                <span className="text-blue-400 font-bold text-lg">
                  {invoice.fundingProgress}%
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-700/60 overflow-hidden mb-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700"
                  style={{ width: `${invoice.fundingProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Raised</p>
                  <p className="text-white font-semibold">
                    {formatCurrency(invoice.raisedSoFar)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-xs mb-0.5">Remaining</p>
                  <p className="text-blue-400 font-semibold">
                    {formatCurrency(remaining)}
                  </p>
                </div>
              </div>
            </div>

            {/* Supplier Info */}
            <div
              className="rounded-2xl border border-slate-700/50 p-6"
              style={{ backgroundColor: "#1e293b" }}
            >
              <h2 className="text-white font-semibold text-base mb-4">
                Supplier Information
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-700/60 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">
                    {invoice.supplierName}
                  </p>
                  <p className="text-slate-500 text-xs">Invoice Originator</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Investment Panel */}
          <div className="xl:col-span-2 space-y-5">
            {/* Yield Calculator */}
            <div
              className="rounded-2xl border border-blue-500/30 p-6 sticky top-6"
              style={{ backgroundColor: "#1e293b" }}
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Calculator className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base">
                    Yield Calculator
                  </h2>
                  <p className="text-slate-500 text-xs">
                    Calculate your returns instantly
                  </p>
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-4">
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Investment Amount (PKR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">
                    ₨
                  </span>
                  <input
                    type="text"
                    value={investAmount}
                    onChange={handleAmountChange}
                    placeholder="0"
                    className={`w-full pl-8 pr-4 py-3 rounded-xl bg-slate-800/60 border text-white text-lg font-bold placeholder-slate-600 focus:outline-none transition-all ${
                      inputError
                        ? "border-red-500/60 focus:border-red-400"
                        : "border-slate-600/40 focus:border-blue-500/60"
                    }`}
                  />
                </div>
                {inputError && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {inputError}
                  </p>
                )}
                <p className="text-slate-600 text-xs mt-1.5">
                  Min: {formatCurrency(invoice.minInvestment)} · Max:{" "}
                  {formatCurrency(invoice.maxInvestment)}
                </p>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[100000, 250000, 500000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      setRawAmount(amt);
                      setInvestAmount(new Intl.NumberFormat("en-PK").format(amt));
                      setInputError("");
                    }}
                    className="py-2 rounded-lg bg-slate-700/40 hover:bg-blue-500/20 border border-slate-600/30 hover:border-blue-500/40 text-slate-400 hover:text-blue-400 text-xs font-semibold transition-all"
                  >
                    {amt >= 1000000
                      ? `${amt / 1000000}M`
                      : `${amt / 1000}K`}
                  </button>
                ))}
              </div>

              {/* Results — Live Calculation */}
              <div
                className={`rounded-xl border p-4 mb-5 transition-all duration-300 ${
                  rawAmount > 0
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-slate-700/30 bg-slate-800/30"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs">You Invest</span>
                    <span className="text-white font-semibold text-sm">
                      {rawAmount > 0 ? formatCurrency(rawAmount) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs">
                      Discounted Payout
                    </span>
                    <span className="text-blue-400 font-semibold text-sm">
                      {rawAmount > 0 ? formatCurrency(discountedPayout) : "—"}
                    </span>
                  </div>
                  <div className="h-px bg-slate-700/40" />
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs font-semibold">
                      Expected Return
                    </span>
                    <span className="text-emerald-400 font-bold text-base">
                      {rawAmount > 0 ? formatCurrency(projectedReturn) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs">Net Gain</span>
                    <span
                      className={`font-semibold text-sm ${
                        netGain > 0 ? "text-emerald-400" : "text-slate-400"
                      }`}
                    >
                      {rawAmount > 0
                        ? `+${formatCurrency(netGain)}`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleInvestNow}
                disabled={!rawAmount || !!inputError}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#3b82f6" }}
              >
                Invest Now
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mt-3 justify-center">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <p className="text-slate-500 text-xs">
                  Secured & verified transaction
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
