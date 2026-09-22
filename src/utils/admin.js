import { clearSession } from './auth'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/*
 * Calendar days (entryDate, lastEntryDate, dailyActivity[].date) arrive as
 * UTC-midnight timestamps. Parsing them with new Date() would show the
 * previous day to anyone west of UTC, so read the YYYY-MM-DD part directly.
 */
export function formatDay(value) {
  if (!value) return '—'
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return '—'
  return `${d} ${MONTHS[m - 1]} ${y}`
}

// Short label for chart axes, e.g. "9 Sep".
export function formatShortDay(value) {
  const [, m, d] = String(value).slice(0, 10).split('-').map(Number)
  return m && d ? `${d} ${MONTHS[m - 1]}` : ''
}

// Real moments in time (createdAt, lastLoginAt, …) — shown in local time.
export function formatDateTime(value, fallback = '—') {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function fullName(user) {
  if (!user) return ''
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
}

/*
 * Shared handling for admin request failures.
 *
 * 401 → the session is gone: clear local user data and go to sign-in.
 * 403 → signed in but not an admin: the caller shows a "no access" screen.
 * Everything else → the caller shows err.message as-is.
 *
 * Returns true when the error was fully handled (navigation happened).
 */
export function handleAuthError(err, navigate) {
  if (err?.status === 401) {
    clearSession()
    navigate('/signin', { replace: true })
    return true
  }
  return false
}
