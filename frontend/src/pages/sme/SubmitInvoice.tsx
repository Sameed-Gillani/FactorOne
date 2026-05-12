import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, FileText, Loader } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import api from '../../lib/api';

export default function SubmitInvoice() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    invoiceNumber: '', anchorCompany: '', amountPkr: '',
    issueDate: '', dueDate: '', ntn: '', sector: '', discountRate: '3',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleFile = async (f: File) => {
    setFile(f);
    setOcrLoading(true);
    try {
      const Tesseract = (await import('tesseract.js')).default;
      const { data: { text } } = await Tesseract.recognize(f, 'eng');

      // Try to extract key fields from OCR text
      const amountMatch = text.match(/(?:PKR|Rs\.?|Amount)[:\s]*([0-9,]+(?:\.[0-9]{2})?)/i);
      const invNumMatch = text.match(/(?:Invoice\s*(?:No|Number|#)[:\s]*)([A-Z0-9/-]+)/i);
      const dateMatch = text.match(/(?:Date)[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);

      setForm(prev => ({
        ...prev,
        invoiceNumber: invNumMatch?.[1]?.trim() || prev.invoiceNumber,
        amountPkr: amountMatch?.[1]?.replace(/,/g, '') || prev.amountPkr,
        issueDate: dateMatch?.[1] ? new Date(dateMatch[1]).toISOString().slice(0, 10) : prev.issueDate,
      }));
    } catch {
      // OCR failed silently — user fills manually
    } finally {
      setOcrLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (file) formData.append('invoiceFile', file);

      await api.post('/invoices', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate('/sme/invoices');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout title="Submit Invoice">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-white text-lg font-semibold mb-5">New Invoice Submission</h2>

          {error && <div className="mb-4 bg-red-500/15 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>}

          {/* OCR Upload Zone */}
          <div
            className="border-2 border-dashed border-slate-600 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer mb-6 transition-colors"
            onDrop={handleDrop} onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {ocrLoading ? (
              <div className="flex flex-col items-center gap-2 text-blue-400">
                <Loader className="w-8 h-8 animate-spin" />
                <p className="text-sm">Reading document...</p>
              </div>
            ) : file ? (
              <div className="flex items-center justify-center gap-3 text-emerald-400">
                <FileText className="w-6 h-6" />
                <span className="text-sm font-medium">{file.name}</span>
                <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }}
                  className="text-slate-400 hover:text-red-400 ml-2"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Drag & drop or click to upload invoice</p>
                <p className="text-slate-500 text-xs mt-1">JPG, PNG or PDF · Max 5MB · OCR will auto-fill fields</p>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 text-xs font-medium mb-1 block">Invoice Number *</label>
                <input type="text" value={form.invoiceNumber} onChange={set('invoiceNumber')} required placeholder="INV-2024-001"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-slate-300 text-xs font-medium mb-1 block">NTN *</label>
                <input type="text" value={form.ntn} onChange={set('ntn')} required placeholder="1234567"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="text-slate-300 text-xs font-medium mb-1 block">Anchor Company *</label>
                <input type="text" value={form.anchorCompany} onChange={set('anchorCompany')} required placeholder="e.g. Packages Limited"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-slate-300 text-xs font-medium mb-1 block">Amount (PKR) *</label>
                <input type="number" value={form.amountPkr} onChange={set('amountPkr')} required min="50000" placeholder="500000"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-slate-300 text-xs font-medium mb-1 block">Discount Rate (%)</label>
                <input type="number" value={form.discountRate} onChange={set('discountRate')} min="1" max="10" step="0.5"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-slate-300 text-xs font-medium mb-1 block">Issue Date *</label>
                <input type="date" value={form.issueDate} onChange={set('issueDate')} required
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-slate-300 text-xs font-medium mb-1 block">Due Date * (min 30 days)</label>
                <input type="date" value={form.dueDate} onChange={set('dueDate')} required
                  min={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="text-slate-300 text-xs font-medium mb-1 block">Sector</label>
                <select value={form.sector} onChange={set('sector')}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Select sector (optional)</option>
                  <option value="Textile">Textile</option>
                  <option value="Logistics">Logistics</option>
                  <option value="IT Services">IT Services</option>
                  <option value="FMCG">FMCG</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate('/sme/invoices')}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg text-sm font-medium">Cancel</button>
              <button type="submit" disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold">
                {submitting ? 'Submitting...' : 'Submit Invoice'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}
