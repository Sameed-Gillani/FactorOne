/**
 * api.js — thin fetch wrapper that automatically attaches the JWT
 * and normalises error responses.
 *
 * Usage:
 *   import api from "../utils/api";
 *
 *   const { data } = await api.get("/invoices/my");
 *   const { data } = await api.post("/invoices", formData);      // FormData
 *   const { data } = await api.post("/auth/login", { email });   // JSON
 *   const { data } = await api.patch("/invoices/123/status", { status: "funded" });
 */

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function getToken() {
  return localStorage.getItem("token");
}

async function request(method, path, body, isFormData = false) {
  const token = getToken();

  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData) headers["Content-Type"] = "application/json";

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, options);

  // Handle 401 — clear session and reload
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return;
  }

  let data;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const message =
      (typeof data === "object" && data?.message) ||
      `Request failed with status ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return { data, status: res.status };
}

const api = {
  get: (path) => request("GET", path),
  post: (path, body, isFormData = false) =>
    request("POST", path, body, isFormData),
  put: (path, body) => request("PUT", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),

  // Convenience helpers
  postForm: (path, formData) => request("POST", path, formData, true),
};

export default api;
