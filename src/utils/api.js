const BASE = "https://bladdersense-582048c5cf7e.herokuapp.com/api";

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

  saveTracking: (body) =>
    request("/tracking", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getTracking: () =>
    request("/tracking"),
};
