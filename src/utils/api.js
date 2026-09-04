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
    throw new Error("Server returned an invalid response.");
  }

  if (!res.ok) {
    throw new Error(
      data.error || "Something went wrong. Please try again."
    );
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
};

