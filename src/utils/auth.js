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

const USER_KEY = 'gbapp_user'

export function saveSession(_token, user) {
  if (!user) return

  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getSession() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null

    const user = JSON.parse(raw)

    if (!user || !user.id) {
      clearSession()
      return null
    }

    return {
      user,
    }
  } catch {
    clearSession()
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(USER_KEY)
}

export function getSessionUser() {
  const session = getSession()
  return session ? session.user : null
}

/*
 * Authentication is now handled by the backend HTTP-only cookie.
 * This function is kept for compatibility with any existing code
 * that may still call getSessionToken().
 */
export function getSessionToken() {
  return null
}

export function updateSessionUser(updatedUser) {
  const session = getSession()

  if (session) {
    const updatedUserData = {
      ...session.user,
      ...updatedUser,
    }

    localStorage.setItem(USER_KEY, JSON.stringify(updatedUserData))
  }
}
