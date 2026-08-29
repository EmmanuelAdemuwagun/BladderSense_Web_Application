// const SESSION_KEY = 'gbapp_session'
// const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// export function saveSession(token, user) {
//   const session = {
//     token,
//     user,
//     expiresAt: Date.now() + SESSION_DURATION_MS,
//   }
//   localStorage.setItem(SESSION_KEY, JSON.stringify(session))
// }

// export function getSession() {
//   try {
//     const raw = localStorage.getItem(SESSION_KEY)
//     if (!raw) return null
//     const session = JSON.parse(raw)
//     if (Date.now() > session.expiresAt) {
//       clearSession()
//       return null
//     }
//     return session
//   } catch {
//     return null
//   }
// }

// export function clearSession() {
//   localStorage.removeItem(SESSION_KEY)
// }

// export function getSessionUser() {
//   const s = getSession()
//   return s ? s.user : null
// }

// export function getSessionToken() {
//   const s = getSession()
//   return s ? s.token : null
// }

// export function updateSessionUser(updatedUser) {
//   const s = getSession()
//   if (s) {
//     s.user = { ...s.user, ...updatedUser }
//     localStorage.setItem(SESSION_KEY, JSON.stringify(s))
//   }
// }

// Authentication is now handled by the backend using
// an HTTP-only session cookie.
//
// Do not store authentication tokens or session data
// in localStorage.

export function saveSession() {
  // Kept temporarily for compatibility with older imports.
  // Authentication is handled by the backend.
}

export function getSession() {
  // Session state is managed by the backend.
  // The browser automatically sends the HTTP-only cookie.
  return null
}

export function clearSession() {
  // Session clearing is handled by the backend /api/auth/logout endpoint.
}

export function getSessionUser() {
  // User information should now be retrieved from the backend.
  return null
}

export function getSessionToken() {
  // No session token is stored in the frontend anymore.
  return null
}

export function updateSessionUser() {
  // User updates are now persisted through the backend.
}
