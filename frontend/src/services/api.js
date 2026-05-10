import axios from "axios";

// ── Axios instance ────────────────────────────────────────────
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach JWT from localStorage ─────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("fo_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 globally ─────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage
      localStorage.removeItem("fo_token");
      localStorage.removeItem("fo_user");
      // Only redirect if not already on an auth page
      if (!window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/register")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth API ──────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (credentials) => api.post("/auth/login", credentials),
  getMe: () => api.get("/auth/me"),
};

// ── Invoice API ───────────────────────────────────────────────
export const invoiceAPI = {
  submit: (formData) =>
    api.post("/invoices", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getMyInvoices: (params) => api.get("/invoices/my", { params }),
  getAllVerified: (params) => api.get("/invoices", { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  getAllAdmin: (params) => api.get("/invoices/admin/all", { params }),
  approve: (id, data) => api.patch(`/invoices/${id}/approve`, data),
  reject: (id, data) => api.patch(`/invoices/${id}/reject`, data),
  fbrCheck: (id) => api.get(`/invoices/${id}/fbr-check`),
  creditCheck: (id) => api.get(`/invoices/${id}/credit-check`),
};

// ── Investment API ────────────────────────────────────────────
export const investmentAPI = {
  place: (data) => api.post("/investments", data),
  getMyInvestments: (params) => api.get("/investments/my", { params }),
};

// ── Wallet API ────────────────────────────────────────────────
export const walletAPI = {
  getWallet: (params) => api.get("/wallet", { params }),
  topUp: (data) => api.post("/wallet/topup", data),
  withdraw: (data) => api.post("/wallet/withdraw", data),
};

export default api;
