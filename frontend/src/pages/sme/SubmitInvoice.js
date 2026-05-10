import React, { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileImage,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  Sparkles,
} from "lucide-react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

// ─── Field config ─────────────────────────────────────────────────────────────
const INITIAL_FORM = {
  invoiceNumber: "",
  anchorCompany: "",
  amountPkr: "",
  issueDate: "",
  dueDate: "",
  ntn: "",
  description: "",
};

const VALIDATORS = {
  invoiceNumber: (v) => (!v.trim() ? "Invoice number is required" : ""),
  anchorCompany: (v) => (!v.trim() ? "Anchor / buyer company is required" : ""),
  amountPkr: (v) => {
    if (!v) return "Amount is required";
    if (isNaN(Number(v)) || Number(v) <= 0) return "Enter a valid amount";
    return "";
  },
  issueDate: (v) => (!v ? "Issue date is required" : ""),
  dueDate: (v, form) => {
    if (!v) return "Due date is required";
    if (form.issueDate && v <= form.issueDate)
      return "Due date must be after issue date";
    return "";
  },
  ntn: (v) =>
    v && !/^\d{7}$/.test(v.replace(/-/g, ""))
      ? "NTN must be 7 digits"
      : "",
};

// ─── OCR parser — extract fields from raw Tesseract text ─────────────────────
function parseOCRText(text) {
  const result = {};
  const lines = text.split("\n").map((l) => l.trim());
  const flat = text.replace(/\s+/g, " ");

  // Invoice number patterns
  const invMatch =
    flat.match(/inv(?:oice)?[\s#:.-]*([A-Z0-9/-]{3,20})/i) ||
    flat.match(/no\.?\s*[:.-]?\s*([A-Z0-9/-]{4,20})/i);
  if (invMatch) result.invoiceNumber = invMatch[1].trim();

  // Amount — look for PKR / Rs / large number
  const amtMatch =
    flat.match(/(?:PKR|Rs\.?|amount)[^\d]*([0-9,]+(?:\.\d{1,2})?)/i) ||
    flat.match(/total[^\d]*([0-9,]{4,}(?:\.\d{1,2})?)/i);
  if (amtMatch)
    result.amountPkr = amtMatch[1].replace(/,/g, "");

  // NTN
  const ntnMatch = flat.match(/NTN[\s:.-]*([0-9-]{7,11})/i);
  if (ntnMatch) result.ntn = ntnMatch[1].trim();

  // Company name — look for "Bill To / Buyer / Sold To"
  const companyMatch =
    flat.match(/(?:bill\s*to|buyer|sold\s*to|anchor)[:\s]+([A-Za-z][A-Za-z\s&.,'()-]{3,50})/i);
  if (companyMatch) result.anchorCompany = companyMatch[1].trim();

  // Dates — DD/MM/YYYY or YYYY-MM-DD
  const dateMatches = [
    ...flat.matchAll(/\b(\d{2}[\/.-]\d{2}[\/.-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/g),
  ].map((m) => m[1]);

  const toISO = (s) => {
    if (/^\d{4}-/.test(s)) return s;
    const [d, m, y] = s.split(/[\/.-]/);
    const year = y?.length === 2 ? "20" + y : y;
    return `${year}-${m?.padStart(2, "0")}-${d?.padStart(2, "0")}`;
  };

  if (dateMatches[0]) {
    const iso = toISO(dateMatches[0]);
    if (!isNaN(Date.parse(iso))) result.issueDate = iso;
  }
  if (dateMatches[1]) {
    const iso = toISO(dateMatches[1]);
    if (!isNaN(Date.parse(iso))) result.dueDate = iso;
  }

  return result;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SubmitInvoice() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedPreview, setUploadedPreview] = useState(null);
  const [dragging, setDragging] = useState(false);

  const [ocrStatus, setOcrStatus] = useState("idle"); // idle | loading | done | error
  const [ocrMessage, setOcrMessage] = useState("");
  const [ocrFields, setOcrFields] = useState([]); // fields auto-filled

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateField = useCallback(
    (name, value, currentForm) => {
      const validator = VALIDATORS[name];
      return validator ? validator(value, currentForm || form) : "";
    },
    [form]
  );

  const validateAll = () => {
    const errs = {};
    Object.keys(VALIDATORS).forEach((key) => {
      const err = validateField(key, form[key], form);
      if (err) errs[key] = err;
    });
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value, updated),
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  // ── OCR Processing ──────────────────────────────────────────────────────────
  const runOCR = async (file) => {
    setOcrStatus("loading");
    setOcrMessage("Reading document...");
    try {
      // Dynamic import of Tesseract.js — only loaded when needed
      const Tesseract = await import("tesseract.js");
      setOcrMessage("Analysing invoice text...");

      const result = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setOcrMessage(
              `Reading document... ${Math.round(m.progress * 100)}%`
            );
          }
        },
      });

      const raw = result.data.text;
      const parsed = parseOCRText(raw);
      const filled = [];

      const fieldLabels = {
        invoiceNumber: "Invoice Number",
        anchorCompany: "Anchor Company",
        amountPkr: "Amount",
        issueDate: "Issue Date",
        dueDate: "Due Date",
        ntn: "NTN",
      };

      const updates = {};
      Object.entries(parsed).forEach(([key, val]) => {
        if (val && !form[key]) {
          updates[key] = val;
          filled.push(fieldLabels[key] || key);
        }
      });

      if (Object.keys(updates).length > 0) {
        setForm((prev) => ({ ...prev, ...updates }));
        setOcrFields(filled);
        setOcrStatus("done");
        setOcrMessage(
          `Auto-filled ${filled.length} field${filled.length > 1 ? "s" : ""}: ${filled.join(", ")}`
        );
      } else {
        setOcrStatus("done");
        setOcrMessage(
          "OCR complete — no fields auto-detected. Please fill in manually."
        );
        setOcrFields([]);
      }
    } catch (err) {
      console.error("OCR error:", err);
      setOcrStatus("error");
      setOcrMessage("Could not read document. Please fill fields manually.");
    }
  };

  // ── File handling ───────────────────────────────────────────────────────────
  const handleFile = (file) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setOcrStatus("error");
      setOcrMessage("Only JPG, PNG, WEBP, or PDF files are accepted.");
      return;
    }
    setUploadedFile(file);
    if (file.type !== "application/pdf") {
      setUploadedPreview(URL.createObjectURL(file));
    } else {
      setUploadedPreview(null);
    }
    setOcrStatus("idle");
    runOCR(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const removeFile = () => {
    setUploadedFile(null);
    setUploadedPreview(null);
    setOcrStatus("idle");
    setOcrMessage("");
    setOcrFields([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const allTouched = Object.keys(VALIDATORS).reduce(
      (acc, k) => ({ ...acc, [k]: true }),
      {}
    );
    setTouched(allTouched);

    const errs = validateAll();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const token = localStorage.getItem("token");
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => v && body.append(k, v));
      if (uploadedFile) body.append("document", uploadedFile);

      const res = await fetch(`${API_BASE}/api/invoices`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);

      setSubmitSuccess(true);
      setTimeout(() => navigate("/sme/invoices"), 2200);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Input styles ─────────────────────────────────────────────────────────────
  const inputStyle = (name) => ({
    width: "100%",
    padding: "10px 13px",
    borderRadius: "10px",
    background: "#0f172a",
    border: `1px solid ${
      errors[name] && touched[name] ? "#f87171" : "#334155"
    }`,
    color: "#e2e8f0",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    transition: "border 0.15s ease",
    boxSizing: "border-box",
  });

  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    letterSpacing: "0.3px",
    textTransform: "uppercase",
    fontFamily: "'DM Sans', sans-serif",
  };

  const errorStyle = {
    marginTop: "5px",
    fontSize: "11px",
    color: "#f87171",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontFamily: "'DM Sans', sans-serif",
  };

  // ── Success screen ───────────────────────────────────────────────────────────
  if (submitSuccess) {
    return (
      <div
        style={{
          minHeight: "100%",
          background: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "#10b98118",
              border: "2px solid #10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              animation: "pop 0.4s cubic-bezier(0.175,0.885,0.32,1.275)",
            }}
          >
            <CheckCircle2 size={34} color="#10b981" />
          </div>
          <h2
            style={{
              margin: "0 0 8px",
              fontSize: "22px",
              fontWeight: "700",
              color: "#f1f5f9",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Invoice Submitted!
          </h2>
          <p style={{ color: "#64748b", fontFamily: "'DM Sans', sans-serif" }}>
            Redirecting to My Invoices…
          </p>
        </div>
        <style>{`@keyframes pop { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "28px",
        background: "#0f172a",
        minHeight: "100%",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: "28px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "12px",
            background: "transparent",
            border: "none",
            color: "#64748b",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
            padding: 0,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <ChevronLeft size={15} /> Back
        </button>
        <h2
          style={{
            margin: "0 0 4px",
            fontSize: "22px",
            fontWeight: "700",
            color: "#f1f5f9",
            letterSpacing: "-0.4px",
          }}
        >
          Submit Invoice
        </h2>
        <p style={{ margin: 0, fontSize: "13px", color: "#475569" }}>
          Upload your invoice document and we'll auto-fill the form for you.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          maxWidth: "1000px",
        }}
      >
        {/* ── LEFT: Upload zone ── */}
        <div>
          <div
            style={{
              background: "#1e293b",
              borderRadius: "16px",
              border: "1px solid #334155",
              overflow: "hidden",
              marginBottom: "16px",
            }}
          >
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #334155" }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Sparkles size={16} color="#3b82f6" />
                Upload Invoice Document
              </h3>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "12px",
                  color: "#475569",
                }}
              >
                OCR will auto-fill fields from the document
              </p>
            </div>

            <div style={{ padding: "16px" }}>
              {/* Drop zone */}
              {!uploadedFile ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragging ? "#3b82f6" : "#334155"}`,
                    borderRadius: "12px",
                    padding: "40px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    background: dragging ? "#3b82f608" : "transparent",
                  }}
                >
                  <Upload
                    size={32}
                    color={dragging ? "#3b82f6" : "#475569"}
                    style={{ marginBottom: "12px" }}
                  />
                  <p
                    style={{
                      margin: "0 0 6px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#e2e8f0",
                    }}
                  >
                    Drag & drop invoice here
                  </p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#475569" }}>
                    or click to browse · JPG, PNG, WEBP, PDF
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: "none" }}
                    onChange={(e) => handleFile(e.target.files[0])}
                  />
                </div>
              ) : (
                <div
                  style={{
                    borderRadius: "12px",
                    border: "1px solid #334155",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {uploadedPreview ? (
                    <img
                      src={uploadedPreview}
                      alt="Invoice preview"
                      style={{
                        width: "100%",
                        maxHeight: "220px",
                        objectFit: "contain",
                        background: "#0f172a",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: "100px",
                        background: "#0f172a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        color: "#64748b",
                        fontSize: "13px",
                      }}
                    >
                      <FileImage size={20} /> {uploadedFile.name}
                    </div>
                  )}
                  <button
                    onClick={removeFile}
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "#0f172aCC",
                      border: "1px solid #334155",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "#94a3b8",
                      padding: 0,
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* OCR Status bar */}
            {ocrStatus !== "idle" && (
              <div
                style={{
                  padding: "12px 16px",
                  borderTop: "1px solid #334155",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "12px",
                  fontWeight: "500",
                  color:
                    ocrStatus === "error"
                      ? "#f87171"
                      : ocrStatus === "done" && ocrFields.length > 0
                      ? "#10b981"
                      : "#94a3b8",
                  background:
                    ocrStatus === "loading" ? "#3b82f608" : "transparent",
                }}
              >
                {ocrStatus === "loading" && (
                  <Loader2
                    size={14}
                    style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}
                  />
                )}
                {ocrStatus === "done" && ocrFields.length > 0 && (
                  <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                )}
                {ocrStatus === "error" && (
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                )}
                <span>{ocrMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Form fields ── */}
        <div
          style={{
            background: "#1e293b",
            borderRadius: "16px",
            border: "1px solid #334155",
            padding: "20px",
          }}
        >
          <h3
            style={{
              margin: "0 0 18px",
              fontSize: "14px",
              fontWeight: "700",
              color: "#f1f5f9",
            }}
          >
            Invoice Details
          </h3>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}
          >
            {/* Invoice Number */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>
                Invoice Number *
                {ocrFields.includes("Invoice Number") && (
                  <span
                    style={{
                      marginLeft: "6px",
                      fontSize: "9px",
                      color: "#10b981",
                      background: "#10b98118",
                      padding: "1px 6px",
                      borderRadius: "10px",
                      fontWeight: "600",
                    }}
                  >
                    OCR
                  </span>
                )}
              </label>
              <input
                name="invoiceNumber"
                value={form.invoiceNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. INV-2024-001"
                style={inputStyle("invoiceNumber")}
              />
              {errors.invoiceNumber && touched.invoiceNumber && (
                <div style={errorStyle}>
                  <AlertCircle size={10} /> {errors.invoiceNumber}
                </div>
              )}
            </div>

            {/* Anchor Company */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>
                Anchor / Buyer Company *
                {ocrFields.includes("Anchor Company") && (
                  <span
                    style={{
                      marginLeft: "6px",
                      fontSize: "9px",
                      color: "#10b981",
                      background: "#10b98118",
                      padding: "1px 6px",
                      borderRadius: "10px",
                      fontWeight: "600",
                    }}
                  >
                    OCR
                  </span>
                )}
              </label>
              <input
                name="anchorCompany"
                value={form.anchorCompany}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Company name"
                style={inputStyle("anchorCompany")}
              />
              {errors.anchorCompany && touched.anchorCompany && (
                <div style={errorStyle}>
                  <AlertCircle size={10} /> {errors.anchorCompany}
                </div>
              )}
            </div>

            {/* Amount */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>
                Amount (PKR) *
                {ocrFields.includes("Amount") && (
                  <span
                    style={{
                      marginLeft: "6px",
                      fontSize: "9px",
                      color: "#10b981",
                      background: "#10b98118",
                      padding: "1px 6px",
                      borderRadius: "10px",
                      fontWeight: "600",
                    }}
                  >
                    OCR
                  </span>
                )}
              </label>
              <input
                name="amountPkr"
                type="number"
                min="0"
                value={form.amountPkr}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. 500000"
                style={inputStyle("amountPkr")}
              />
              {errors.amountPkr && touched.amountPkr && (
                <div style={errorStyle}>
                  <AlertCircle size={10} /> {errors.amountPkr}
                </div>
              )}
            </div>

            {/* Issue Date */}
            <div>
              <label style={labelStyle}>
                Issue Date *
                {ocrFields.includes("Issue Date") && (
                  <span
                    style={{
                      marginLeft: "6px",
                      fontSize: "9px",
                      color: "#10b981",
                      background: "#10b98118",
                      padding: "1px 6px",
                      borderRadius: "10px",
                      fontWeight: "600",
                    }}
                  >
                    OCR
                  </span>
                )}
              </label>
              <input
                name="issueDate"
                type="date"
                value={form.issueDate}
                onChange={handleChange}
                onBlur={handleBlur}
                style={{
                  ...inputStyle("issueDate"),
                  colorScheme: "dark",
                }}
              />
              {errors.issueDate && touched.issueDate && (
                <div style={errorStyle}>
                  <AlertCircle size={10} /> {errors.issueDate}
                </div>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label style={labelStyle}>
                Due Date *
                {ocrFields.includes("Due Date") && (
                  <span
                    style={{
                      marginLeft: "6px",
                      fontSize: "9px",
                      color: "#10b981",
                      background: "#10b98118",
                      padding: "1px 6px",
                      borderRadius: "10px",
                      fontWeight: "600",
                    }}
                  >
                    OCR
                  </span>
                )}
              </label>
              <input
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleChange}
                onBlur={handleBlur}
                style={{ ...inputStyle("dueDate"), colorScheme: "dark" }}
              />
              {errors.dueDate && touched.dueDate && (
                <div style={errorStyle}>
                  <AlertCircle size={10} /> {errors.dueDate}
                </div>
              )}
            </div>

            {/* NTN */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>
                NTN (optional)
                {ocrFields.includes("NTN") && (
                  <span
                    style={{
                      marginLeft: "6px",
                      fontSize: "9px",
                      color: "#10b981",
                      background: "#10b98118",
                      padding: "1px 6px",
                      borderRadius: "10px",
                      fontWeight: "600",
                    }}
                  >
                    OCR
                  </span>
                )}
              </label>
              <input
                name="ntn"
                value={form.ntn}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="7-digit NTN"
                style={inputStyle("ntn")}
              />
              {errors.ntn && touched.ntn && (
                <div style={errorStyle}>
                  <AlertCircle size={10} /> {errors.ntn}
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Description (optional)</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Brief description of goods/services..."
                rows={3}
                style={{
                  ...inputStyle("description"),
                  resize: "vertical",
                  minHeight: "72px",
                }}
              />
            </div>
          </div>

          {/* Submit error */}
          {submitError && (
            <div
              style={{
                marginTop: "14px",
                padding: "10px 14px",
                borderRadius: "10px",
                background: "#f8717118",
                border: "1px solid #f8717130",
                color: "#f87171",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <AlertCircle size={14} />
              {submitError}
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || ocrStatus === "loading"}
            style={{
              marginTop: "18px",
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              background:
                submitting || ocrStatus === "loading" ? "#1e3a5f" : "#3b82f6",
              border: "none",
              color:
                submitting || ocrStatus === "loading" ? "#64748b" : "#fff",
              fontSize: "14px",
              fontWeight: "700",
              cursor:
                submitting || ocrStatus === "loading"
                  ? "not-allowed"
                  : "pointer",
              fontFamily: "'DM Sans', sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.15s ease",
              boxShadow:
                submitting || ocrStatus === "loading"
                  ? "none"
                  : "0 4px 14px #3b82f640",
            }}
          >
            {submitting ? (
              <>
                <Loader2
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Submitting…
              </>
            ) : ocrStatus === "loading" ? (
              <>
                <Loader2
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Reading document…
              </>
            ) : (
              "Submit Invoice"
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
        input::placeholder, textarea::placeholder { color: #475569; }
        input:focus, textarea:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px #3b82f618;
        }
      `}</style>
    </div>
  );
}
