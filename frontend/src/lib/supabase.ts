import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'sme' | 'investor' | 'admin';
export type UserStatus = 'pending' | 'active' | 'blocked';
export type InvoiceStatus = 'pending' | 'verified' | 'funded' | 'rejected';
export type FBRStatus = 'unchecked' | 'matched' | 'not_found';
export type CreditScore = 'N/A' | 'Good' | 'Average' | 'Poor';
export type TransactionType = 'topup' | 'investment' | 'disbursement' | 'withdrawal';
export type NotificationType = 'transaction' | 'system' | 'approval';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  cnic: string;
  role: UserRole;
  status: UserStatus;
  business_name: string;
  ntn: string;
  sector: string;
  city: string;
  experience_level: string;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  sme_id: string;
  anchor_company: string;
  amount_pkr: number;
  issue_date: string;
  due_date: string;
  ntn: string;
  sector: string;
  status: InvoiceStatus;
  admin_note: string;
  fbr_status: FBRStatus;
  credit_score: CreditScore;
  funded_amount: number;
  discount_rate: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Investment {
  id: string;
  investor_id: string;
  invoice_id: string;
  amount: number;
  expected_return: number;
  maturity_date: string;
  status: 'active' | 'matured' | 'cancelled';
  created_at: string;
  invoices?: Invoice;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export const formatPKR = (amount: number) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amount);

export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
