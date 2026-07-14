const SESSION_KEY = 'gbapp_session'
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export function saveSession(token, user) {
  const session = {
    token,
    user,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    if (Date.now() > session.expiresAt) {
      clearSession()
      return null
    }
    return session
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function getSessionUser() {
  const s = getSession()
  return s ? s.user : null
}

export function getSessionToken() {
  const s = getSession()
  return s ? s.token : null
}

export function updateSessionUser(updatedUser) {
  const s = getSession()
  if (s) {
    s.user = { ...s.user, ...updatedUser }
    localStorage.setItem(SESSION_KEY, JSON.stringify(s))
  }
}
