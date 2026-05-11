import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx={12} cy={12} r={3} />
  </svg>
);
const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1={1} y1={1} x2={23} y2={23} />
  </svg>
);
const BuildingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-8 h-8">
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
    <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
  </svg>
);
const TrendingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-8 h-8">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-12 h-12">
    <circle cx={12} cy={12} r={10} /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const SME_SECTORS = [
  "Textile & Garments", "Food & Beverages", "Construction & Materials",
  "IT & Software", "Healthcare & Pharma", "Agriculture & Farming",
  "Logistics & Transport", "Manufacturing", "Retail & Wholesale", "Other",
];
const EXPERIENCE_LEVELS = ["Beginner (< 1 year)", "Intermediate (1-3 years)", "Experienced (3-7 years)", "Expert (7+ years)"];
const PK_CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad",
  "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Hyderabad", "Other",
];

const INITIAL_FORM = {
  role: "",
  name: "", email: "", phone: "", cnic: "", password: "", confirmPassword: "",
  businessName: "", ntn: "", sector: "",
  city: "", experienceLevel: "",
};

const StepDot = ({ step, current, label }) => (
  <div className="flex flex-col items-center gap-1.5">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
      ${current > step ? "bg-success text-white" : current === step ? "bg-accent text-white shadow-glow-sm" : "bg-navy-700 text-slate-500"}`}>
      {current > step ? <CheckIcon /> : step}
    </div>
    <span className={`text-xs font-medium ${current === step ? "text-slate-300" : "text-slate-600"}`}>{label}</span>
  </div>
);

const StepLine = ({ active }) => (
  <div className={`flex-1 h-0.5 mb-5 transition-all duration-500 ${active ? "bg-accent/60" : "bg-navy-700"}`} />
);

const Field = ({ label, error, children }) => (
  <div>
    {label && <span className="label">{label}</span>}
    {children}
    {error && <p className="form-error">⚠ {error}</p>}
  </div>
);

const Input = ({ icon, error, ...props }) => (
  <div className="relative">
    {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>}
    <input
      {...props}
      className={`input-field ${icon ? "pl-10" : ""} ${error ? "border-danger focus:border-danger" : ""}`}
    />
  </div>
);

const Select = ({ error, children, ...props }) => (
  <select
    {...props}
    className={`input-field ${error ? "border-danger" : ""} appearance-none`}
  >
    {children}
  </select>
);

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => {
    const val = e.target ? e.target.value : e;
    setForm((p) => ({ ...p, [field]: val }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  // role shown in UI is "sme" but we send "borrower" to backend
  const backendRole = form.role === "sme" ? "borrower" : form.role;

  const validateStep2 = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Min 8 characters";
    if (!form.confirmPassword) e.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";

    if (form.role === "sme") {
      if (!form.businessName.trim()) e.businessName = "Business name is required";
      if (!form.ntn.trim()) e.ntn = "NTN is required";
      if (!form.sector) e.sector = "Please select a sector";
    }
    if (form.role === "investor") {
      if (!form.city) e.city = "Please select your city";
      if (!form.experienceLevel) e.experienceLevel = "Please select experience level";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const nameParts = form.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || firstName;

      const payload = {
        firstName,
        lastName,
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        role: backendRole, // ← sends "borrower" or "investor" to backend
        ...(form.role === "sme" && {
          businessName: form.businessName.trim(),
          ntn: form.ntn.trim(),
          sector: form.sector,
        }),
        ...(form.role === "investor" && {
          city: form.city,
          experienceLevel: form.experienceLevel,
        }),
      };

      const user = await register(payload);

      // redirect based on actual role returned from backend
      if (user.role === "investor") {
        navigate("/investor/dashboard");
      } else if (user.role === "borrower") {
        navigate("/sme/dashboard");
      } else {
        setStep(3);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const fieldErrors = {};
        data.errors.forEach(({ field, message }) => { fieldErrors[field] = message; });
        setErrors(fieldErrors);
        toast.error("Please fix the errors below.");
      } else {
        toast.error(data?.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-navy-900 bg-grid-pattern bg-grid flex items-center justify-center px-4 py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="relative w-full max-w-2xl animate-slide-up">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 mb-5 shadow-glow-sm">
              <svg className="w-7 h-7 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2Z" />
                <path d="M13 5v2M13 17v2M13 11v2" />
              </svg>
            </div>
            <h1 className="font-display text-3xl text-white">Factor<span className="text-accent">One</span></h1>
            <p className="text-slate-500 text-sm mt-1.5">Join the marketplace</p>
          </div>
          <div className="card gradient-border p-8">
            <h2 className="text-xl font-semibold text-white text-center mb-2">Create your account</h2>
            <p className="text-slate-500 text-sm text-center mb-8">Choose your role to get started</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <button onClick={() => { setForm((p) => ({ ...p, role: "sme" })); setStep(2); }}
                className="group relative p-7 rounded-2xl border-2 border-navy-600 bg-navy-900 hover:border-accent hover:bg-accent/5 hover:shadow-glow transition-all duration-300 text-left cursor-pointer">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-accent mb-5 group-hover:scale-110 transition-transform duration-300">
                  <BuildingIcon />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">SME / Business</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Submit invoices for early payment. Get funded in days, not months.</p>
                <ul className="mt-4 space-y-1.5">
                  {["Submit invoices for discounting", "Track funding in real-time", "Manage your business wallet"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-4 h-4 rounded-full bg-accent/15 text-accent flex items-center justify-center flex-shrink-0 text-[10px]">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </button>
              <button onClick={() => { setForm((p) => ({ ...p, role: "investor" })); setStep(2); }}
                className="group relative p-7 rounded-2xl border-2 border-navy-600 bg-navy-900 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all duration-300 text-left cursor-pointer">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-5 group-hover:scale-110 transition-transform duration-300">
                  <TrendingIcon />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Investor</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Earn superior returns by funding verified SME invoices.</p>
                <ul className="mt-4 space-y-1.5">
                  {["Browse verified invoices", "Earn up to 3% monthly return", "Full portfolio dashboard"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0 text-[10px]">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </button>
            </div>
            <p className="text-center text-sm text-slate-500 mt-7">
              Already have an account?{" "}
              <Link to="/login" className="text-accent hover:text-accent-light font-semibold transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-navy-900 bg-grid-pattern bg-grid flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="relative w-full max-w-md text-center animate-slide-up">
          <div className="card gradient-border p-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warning/10 border border-warning/25 text-warning mb-6 mx-auto animate-float">
              <ClockIcon />
            </div>
            <h2 className="font-display text-3xl text-white mb-3">Application Received!</h2>
            <p className="text-slate-400 leading-relaxed text-sm mb-8">
              Your account is pending review. Our team will verify your details within 1-2 business days.
            </p>
            <button onClick={() => navigate("/login")} className="btn-primary w-full">Back to Sign In</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 bg-grid-pattern bg-grid px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="relative w-full max-w-2xl mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl text-white">Factor<span className="text-accent">One</span></h1>
        </div>
        <div className="flex items-center mb-8 px-4">
          <StepDot step={1} current={step} label="Role" />
          <StepLine active={step >= 2} />
          <StepDot step={2} current={step} label="Details" />
          <StepLine active={step >= 3} />
          <StepDot step={3} current={step} label="Done" />
        </div>
        <div className="card gradient-border p-8">
          <div className="flex items-center gap-3 mb-7">
            <button onClick={() => setStep(1)} className="w-8 h-8 rounded-lg bg-navy-700 hover:bg-navy-600 flex items-center justify-center text-slate-400 hover:text-white transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            </button>
            <div>
              <h2 className="text-xl font-semibold text-white">{form.role === "sme" ? "SME Registration" : "Investor Registration"}</h2>
              <p className="text-slate-500 text-xs mt-0.5">Fill in your details to create your account</p>
            </div>
            <span className={`ml-auto badge ${form.role === "sme" ? "badge-blue" : "badge-green"}`}>{form.role === "sme" ? "SME" : "Investor"}</span>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-4 h-px bg-slate-600" />Personal Information<span className="flex-1 h-px bg-slate-600" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" error={errors.name}>
                  <Input type="text" name="name" value={form.name} onChange={set("name")} placeholder="Muhammad Ali" autoComplete="name" error={errors.name} />
                </Field>
                <Field label="Email Address" error={errors.email}>
                  <Input type="email" name="email" value={form.email} onChange={set("email")} placeholder="ali@company.com" autoComplete="email" error={errors.email} />
                </Field>
                <Field label="Phone Number" error={errors.phone}>
                  <Input type="tel" name="phone" value={form.phone} onChange={set("phone")} placeholder="03001234567" autoComplete="tel" error={errors.phone} />
                </Field>
                <Field label="Password" error={errors.password}>
                  <div className="relative">
                    <input type={showPwd ? "text" : "password"} name="password" value={form.password} onChange={set("password")} placeholder="Min 8 characters" autoComplete="new-password" className={`input-field pr-11 ${errors.password ? "border-danger" : ""}`} />
                    <button type="button" onClick={() => setShowPwd((p) => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors" tabIndex={-1}>{showPwd ? <EyeOffIcon /> : <EyeIcon />}</button>
                  </div>
                </Field>
                <Field label="Confirm Password" error={errors.confirmPassword}>
                  <div className="relative">
                    <input type={showConfirm ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Repeat password" autoComplete="new-password" className={`input-field pr-11 ${errors.confirmPassword ? "border-danger" : ""}`} />
                    <button type="button" onClick={() => setShowConfirm((p) => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors" tabIndex={-1}>{showConfirm ? <EyeOffIcon /> : <EyeIcon />}</button>
                  </div>
                </Field>
              </div>
            </div>
            {form.role === "sme" && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-4 h-px bg-slate-600" />Business Information<span className="flex-1 h-px bg-slate-600" />
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Field label="Business / Company Name" error={errors.businessName}>
                      <Input type="text" value={form.businessName} onChange={set("businessName")} placeholder="Pak Textile Mills Ltd" error={errors.businessName} />
                    </Field>
                  </div>
                  <Field label="NTN (7-digit)" error={errors.ntn}>
                    <Input type="text" value={form.ntn} onChange={set("ntn")} placeholder="1234567" maxLength={7} error={errors.ntn} />
                  </Field>
                  <Field label="Business Sector" error={errors.sector}>
                    <Select value={form.sector} onChange={set("sector")} error={errors.sector}>
                      <option value="">Select sector...</option>
                      {SME_SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </Field>
                </div>
              </div>
            )}
            {form.role === "investor" && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-4 h-px bg-slate-600" />Investment Profile<span className="flex-1 h-px bg-slate-600" />
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="City" error={errors.city}>
                    <Select value={form.city} onChange={set("city")} error={errors.city}>
                      <option value="">Select city...</option>
                      {PK_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </Select>
                  </Field>
                  <Field label="Investment Experience" error={errors.experienceLevel}>
                    <Select value={form.experienceLevel} onChange={set("experienceLevel")} error={errors.experienceLevel}>
                      <option value="">Select level...</option>
                      {EXPERIENCE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </Select>
                  </Field>
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary sm:w-auto">← Back</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}