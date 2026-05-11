import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fo_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, Promise.reject);

// Auto-logout on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("fo_token");
      if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (d)  => api.post("/auth/register", d),
  login:    (d)  => api.post("/auth/login", d),
  getMe:    ()   => api.get("/auth/me"),
};

export const invoiceAPI = {
  submit:        (fd)     => api.post("/invoices", fd, { headers: { "Content-Type": "multipart/form-data" } }),
  getMy:         (p)      => api.get("/invoices/my", { params: p }),
  getAllVerified: (p)      => api.get("/invoices", { params: p }),
  getById:       (id)     => api.get(`/invoices/${id}`),
  approve:       (id, d)  => api.patch(`/invoices/${id}/approve`, d),
  reject:        (id, d)  => api.patch(`/invoices/${id}/reject`, d),
  fbrCheck:      (id)     => api.get(`/invoices/${id}/fbr-check`),
  creditCheck:   (id)     => api.get(`/invoices/${id}/credit-check`),
};

export const investmentAPI = {
  place:        (d) => api.post("/investments", d),
  getMy:        (p) => api.get("/investments/my", { params: p }),
};

export const walletAPI = {
  get:      (p) => api.get("/wallet", { params: p }),
  topUp:    (d) => api.post("/wallet/topup", d),
  withdraw: (d) => api.post("/wallet/withdraw", d),
};

export const adminAPI = {
  getUsers:      (p)      => api.get("/admin/users", { params: p }),
  activateUser:  (id)     => api.patch(`/admin/users/${id}/activate`),
  blockUser:     (id)     => api.patch(`/admin/users/${id}/block`),
  getInvoices:   (p)      => api.get("/admin/invoices", { params: p }),
  getStats:      ()       => api.get("/admin/stats"),
};

export const notificationAPI = {
  getAll:       (p)  => api.get("/notifications", { params: p }),
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markAllRead:  ()   => api.patch("/notifications/mark-all-read"),
  markRead:     (id) => api.patch(`/notifications/${id}/read`),
};

export default api;
