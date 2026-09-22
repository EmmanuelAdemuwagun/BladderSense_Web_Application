/*
 * API base URL.
 *
 * We call the API through a SAME-ORIGIN path ("/api") which Netlify proxies to
 * the backend (see netlify.toml). This keeps the session cookie first-party so
 * it persists on iOS Safari / Chrome, where third-party cookies are blocked.
 *
 * Can be overridden at build time with VITE_API_BASE if the API ever needs to
 * be called directly again.
 */
const BASE = import.meta.env.VITE_API_BASE || "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  let data;

  try {
    data = await res.json();
  } catch {
    const err = new Error("Server returned an invalid response.");
    err.status = res.status;
    throw err;
  }

  if (!res.ok) {
    const err = new Error(
      data.error || "Something went wrong. Please try again."
    );
    // Callers can branch on this (e.g. 401 → sign in, 403 → no access).
    err.status = res.status;
    throw err;
  }

  return data;
}

export const api = {
  // ============================
  // AUTHENTICATION
  // ============================

  register: (body) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  verifyRegistration: (body) =>
    request("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  requestLoginToken: (body) =>
    request("/auth/request-login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  verifyLoginToken: (body) =>
    request("/auth/verify-login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  logout: () =>
    request("/auth/logout", {
      method: "POST",
    }),

  deleteAccount: () =>
    request("/profile", {
      method: "DELETE",
    }),

  resendVerification: (body) =>
  request("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify(body),
  }),

  // ============================
  // PROFILE
  // ============================

  getProfile: () =>
    request("/profile"),

  updateProfile: (body) =>
    request("/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  // ============================
  // TRACKING
  // ============================

getTracking: () =>
  request("/tracking"),

saveTracking: (data) =>
  request("/tracking", {
    method: "POST",
    body: JSON.stringify(data),
  }),

updateTracking: (id, data) =>
  request(`/tracking/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),

  // ============================
  // ADMIN (server enforces admin access on every call)
  // ============================

  adminGetStats: () =>
    request("/admin/stats"),

  // params: { page, limit, search, status } — empty values are dropped.
  adminListUsers: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    ).toString();
    return request(`/admin/users${query ? `?${query}` : ""}`);
  },

  adminGetUser: (id) =>
    request(`/admin/users/${encodeURIComponent(id)}`),

  // body: { isAdmin?, emailVerified? } — send only what changes.
  adminUpdateUser: (id, body) =>
    request(`/admin/users/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  adminLogoutUser: (id) =>
    request(`/admin/users/${encodeURIComponent(id)}/logout`, {
      method: "POST",
    }),

  adminDeleteUser: (id) =>
    request(`/admin/users/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};
