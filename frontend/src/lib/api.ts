import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally - redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Types ────────────────────────────────────────────────────────────────────
export type UserRole = 'sme' | 'investor' | 'admin';
export type UserStatus = 'pending' | 'active' | 'blocked';
export type InvoiceStatus = 'pending' | 'verified' | 'funded' | 'rejected';
export type FBRStatus = 'unchecked' | 'matched' | 'not_found';
export type CreditScore = 'N/A' | 'Good' | 'Average' | 'Poor';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  cnic: string;
  role: UserRole;
  status: UserStatus;
  businessName?: string;
  ntn?: string;
  sector?: string;
  city?: string;
  experienceLevel?: string;
  createdAt: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  smeId: User | string;
  anchorCompany: string;
  amountPkr: number;
  issueDate: string;
  dueDate: string;
  ntn: string;
  sector: string;
  discountRate: number;
  fundedAmount: number;
  status: InvoiceStatus;
  adminNote: string;
  fbrStatus: FBRStatus;
  creditScore: CreditScore;
  file?: { url: string; originalName: string };
  createdAt: string;
}

export interface Investment {
  _id: string;
  investorId: string;
  invoiceId: Invoice | string;
  amount: number;
  expectedReturn: number;
  maturityDate: string;
  status: string;
  createdAt: string;
}

export interface Wallet {
  id: string;
  balance: number;
  frozenBalance: number;
  availableBalance: number;
  currency: string;
}

export interface Transaction {
  _id: string;
  type: string;
  direction: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export const formatPKR = (amount: number) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amount);

export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
