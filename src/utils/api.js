const BASE = '/.netlify/functions'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong. Please try again.')
  }
  return data
}

export const api = {
  register: (body) =>
    request('/register', { method: 'POST', body: JSON.stringify(body) }),

  verifyRegistration: (params) =>
    request(`/verify-registration?email=${encodeURIComponent(params.email)}&token=${params.token}`),

  requestLoginToken: (body) =>
    request('/request-login-token', { method: 'POST', body: JSON.stringify(body) }),

  verifyLoginToken: (body) =>
    request('/verify-login-token', { method: 'POST', body: JSON.stringify(body) }),

  updateProfile: (body, sessionToken) =>
    request('/update-profile', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify(body),
    }),

  saveTracking: (body, sessionToken) =>
    request('/save-tracking', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify(body),
    }),

  getTracking: (sessionToken) =>
    request('/get-tracking', {
      headers: { Authorization: `Bearer ${sessionToken}` },
    }),
}
