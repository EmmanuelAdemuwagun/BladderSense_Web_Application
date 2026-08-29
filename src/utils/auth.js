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

const SESSION_KEY = 'gbapp_session'

/*
 * The backend is now the source of truth for authentication.
 *
 * The browser stores the actual session in the HTTP-only
 * "bladdersense_session" cookie.
 *
 * localStorage is used only to remember basic user information
 * for immediate UI rendering. It is NOT used as an authentication token.
 */

export function saveSession(user) {
  const session = {
    user,
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)

    if (!raw) return null

    const session = JSON.parse(raw)

    if (!session || !session.user) {
      clearSession()
      return null
    }

    return session
  } catch {
    clearSession()
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function getSessionUser() {
  const session = getSession()
  return session ? session.user : null
}

export function updateSessionUser(updatedUser) {
  const session = getSession()

  if (session) {
    session.user = {
      ...session.user,
      ...updatedUser,
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }
}

export function updateSessionUser() {
  // User updates are now persisted through the backend.
}
