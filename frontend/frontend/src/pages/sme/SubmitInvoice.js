import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardShell from "../../components/ui/DashboardShell";
import { invoiceAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const NAV = [
  { to: "/sme/dashboard", label: "Dashboard",    icon: "▦" },
  { to: "/sme/submit",    label: "Submit Invoice",icon: "➕" },
  { to: "/sme/invoices",  label: "My Invoices",  icon: "🧾" },
  { to: "/wallet",        label: "Wallet",       icon: "💳" },
  { to: "/notifications", label: "Notifications",icon: "🔔" },
];

const today = () => new Date().toISOString().split("T")[0];
const future = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().split("T")[0]; };

export default function SubmitInvoice() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [loading,  setLoading]  = useState(false);
  const [form, setForm] = useState({
    anchorCompany: "",
    amountPkr: "",
    issueDate: today(),
    dueDate: future(35),
    ntn: user?.ntn || "",
  });
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.anchorCompany.trim()) e.anchorCompany = "Required";
    if (!form.amountPkr || Number(form.amountPkr) < 50000) e.amountPkr = "Minimum PKR 50,000";
    if (!form.issueDate) e.issueDate = "Required";
    if (!form.dueDate)   e.dueDate   = "Required";
    else {
      const issue = new Date(form.issueDate);
      const due   = new Date(form.dueDate);
      const diff  = (due - issue) / 86400000;
      if (diff < 30) e.dueDate = "Must be at least 30 days after issue date";
    }
    if (!form.ntn.trim() || !/^\d{7}$/.test(form.ntn)) e.ntn = "Must be 7 digits";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      await invoiceAPI.submit(fd);
      toast.success("Invoice submitted successfully!");
      navigate("/sme/invoices");
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const fe = {};
        data.errors.forEach(({ field, message }) => { fe[field] = message; });
        setErrors(fe);
        toast.error("Please fix the errors below.");
      } else {
        toast.error(data?.message || "Submission failed.");
      }
    } finally { setLoading(false); }
  };

  return (
    <DashboardShell navItems={NAV}>
      <div className="max-w-2xl space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-3xl text-white">Submit Invoice</h1>
          <p className="text-slate-500 text-sm mt-1">Submit an invoice for discounting</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Anchor Company</label>
              <input value={form.anchorCompany} onChange={set("anchorCompany")} placeholder="e.g. Karachi Steel Works"
                className={`input-field ${errors.anchorCompany ? "border-danger" : ""}`} />
              {errors.anchorCompany && <p className="form-error">⚠ {errors.anchorCompany}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Invoice Amount (PKR)</label>
                <input type="number" value={form.amountPkr} onChange={set("amountPkr")} placeholder="Min 50,000"
                  className={`input-field ${errors.amountPkr ? "border-danger" : ""}`} />
                {errors.amountPkr && <p className="form-error">⚠ {errors.amountPkr}</p>}
              </div>
              <div>
                <label className="label">NTN (7 digits)</label>
                <input value={form.ntn} onChange={set("ntn")} placeholder="1234567" maxLength={7}
                  className={`input-field ${errors.ntn ? "border-danger" : ""}`} />
                {errors.ntn && <p className="form-error">⚠ {errors.ntn}</p>}
              </div>
              <div>
                <label className="label">Issue Date</label>
                <input type="date" value={form.issueDate} onChange={set("issueDate")}
                  className={`input-field ${errors.issueDate ? "border-danger" : ""}`} />
                {errors.issueDate && <p className="form-error">⚠ {errors.issueDate}</p>}
              </div>
              <div>
                <label className="label">Due Date (min 30 days)</label>
                <input type="date" value={form.dueDate} onChange={set("dueDate")}
                  className={`input-field ${errors.dueDate ? "border-danger" : ""}`} />
                {errors.dueDate && <p className="form-error">⚠ {errors.dueDate}</p>}
              </div>
            </div>

            <div className="bg-navy-900 rounded-xl p-4 border border-navy-600 text-sm text-slate-400">
              <p>💡 <strong className="text-slate-300">Tip:</strong> Use NTN <span className="font-mono text-accent">1234567</span> or <span className="font-mono text-accent">2345678</span> to get a matched FBR result.</p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Submitting…</> : "Submit Invoice"}
            </button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
