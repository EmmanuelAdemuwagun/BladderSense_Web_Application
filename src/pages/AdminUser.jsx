import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import AdminNoAccess from '../components/AdminNoAccess'
import { api } from '../utils/api'
import { getSessionUser } from '../utils/auth'
import { formatDay, formatDateTime, fullName, handleAuthError } from '../utils/admin'

const TREND_LABELS = {
  improving: { text: '▲ Improving', className: 'admin-trend--up' },
  worsening: { text: '▼ Worsening', className: 'admin-trend--down' },
  stable: { text: '▬ Stable', className: 'admin-trend--flat' },
  'insufficient-data': { text: 'Not enough data yet', className: 'admin-trend--none' },
}

const SLEEP_LABELS = ['', 'Poor', 'Fair', 'Good']

function Trend({ direction }) {
  const trend = TREND_LABELS[direction] || TREND_LABELS['insufficient-data']
  return <span className={`admin-trend ${trend.className}`}>{trend.text}</span>
}

function InfoItem({ label, children }) {
  return (
    <div className="admin-info">
      <span className="admin-info__label">{label}</span>
      <span className="admin-info__value">{children}</span>
    </div>
  )
}

function SummaryCards({ summary }) {
  if (!summary) return null

  const adherence = summary.adherence || {}
  const nocturia = summary.nightTimeUrination || {}
  const sleep = summary.sleepQuality || {}
  const stress = summary.stressLevel || {}
  const sleepAverage = sleep.average
  const sleepWord = sleepAverage == null ? '' : SLEEP_LABELS[Math.round(sleepAverage)] || ''

  return (
    <div className="admin-stats">
      <div className="admin-stat">
        <span className="admin-stat__value">{adherence.percent ?? 0}%</span>
        <span className="admin-stat__label">Adherence</span>
        <span className="admin-stat__hint">
          {adherence.daysTracked ?? 0} of {adherence.expectedDays ?? 30} days tracked
        </span>
      </div>

      <div className="admin-stat">
        <span className="admin-stat__value">
          {nocturia.averagePerNight == null ? '—' : nocturia.averagePerNight}
        </span>
        <span className="admin-stat__label">Night-time trips / night</span>
        <Trend direction={nocturia.trend?.direction} />
      </div>

      <div className="admin-stat">
        <span className="admin-stat__value">
          {sleepAverage == null ? '—' : sleepAverage}
        </span>
        <span className="admin-stat__label">Sleep quality (1–3){sleepWord && ` · ${sleepWord}`}</span>
        <Trend direction={sleep.trend?.direction} />
      </div>

      <div className="admin-stat">
        <span className="admin-stat__value">{stress.average == null ? '—' : stress.average}</span>
        <span className="admin-stat__label">Average stress (1–5)</span>
      </div>
    </div>
  )
}

function EntriesTable({ entries }) {
  if (!entries?.length) {
    return <p className="text-muted">No tracking entries yet.</p>
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Night trips</th>
            <th scope="col">Evening fluids</th>
            <th scope="col">Activity</th>
            <th scope="col">Stress</th>
            <th scope="col">Sleep</th>
            <th scope="col">Notes</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="admin-table__nowrap">{formatDay(entry.entryDate)}</td>
              <td>{entry.nightTimeUrination}</td>
              <td>{entry.eveningFluids}</td>
              <td>{entry.activityLevel}</td>
              <td>{entry.stressLevel}</td>
              <td>{entry.sleepQuality}</td>
              {/* User-written text: rendered as plain text by React. */}
              <td className="admin-table__notes">{entry.notes || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminUser() {
  const { id } = useParams()
  const navigate = useNavigate()
  const me = getSessionUser()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [forbidden, setForbidden] = useState(false)

  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  // Which confirmation panel is open: 'admin' | 'logout' | 'delete' | null
  const [confirming, setConfirming] = useState(null)
  const [deleteEmail, setDeleteEmail] = useState('')

  /*
   * Shared failure handling for this screen.
   * 401 → sign in, 403 → no access, 404 → back to the list with a message.
   */
  const handleError = useCallback(
    (err, setMessage) => {
      if (handleAuthError(err, navigate)) return
      if (err.status === 403) return setForbidden(true)
      if (err.status === 404) {
        navigate('/admin', { replace: true, state: { flash: err.message || 'That user no longer exists.' } })
        return
      }
      setMessage(err.message)
    },
    [navigate]
  )

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      setData(await api.adminGetUser(id))
    } catch (err) {
      handleError(err, setLoadError)
    } finally {
      setLoading(false)
    }
  }, [id, handleError])

  useEffect(() => {
    load()
  }, [load])

  async function runAction(action, successMessage) {
    setBusy(true)
    setActionError('')
    setActionMessage('')
    try {
      const result = await action()
      setConfirming(null)
      setActionMessage(successMessage(result))
      return result
    } catch (err) {
      handleError(err, setActionError)
      return null
    } finally {
      setBusy(false)
    }
  }

  async function handleToggleAdmin() {
    const makeAdmin = !data.user.isAdmin
    const result = await runAction(
      () => api.adminUpdateUser(id, { isAdmin: makeAdmin }),
      (r) => r.message || (makeAdmin ? 'Admin access granted.' : 'Admin access removed.')
    )
    if (result?.user) {
      setData((prev) => ({ ...prev, user: { ...prev.user, ...result.user } }))
    }
  }

  async function handleToggleVerified() {
    const result = await runAction(
      () => api.adminUpdateUser(id, { emailVerified: !data.user.emailVerified }),
      (r) => r.message || 'Email status updated.'
    )
    if (result?.user) {
      setData((prev) => ({ ...prev, user: { ...prev.user, ...result.user } }))
    }
  }

  async function handleLogoutEverywhere() {
    const result = await runAction(
      () => api.adminLogoutUser(id),
      (r) => `${r.message || 'User signed out of all devices.'} (${r.sessionsRevoked} session${r.sessionsRevoked === 1 ? '' : 's'} ended)`
    )
    if (result) {
      setData((prev) => ({ ...prev, user: { ...prev.user, activeSessions: 0 } }))
    }
  }

  async function handleDelete() {
    setBusy(true)
    setActionError('')
    setActionMessage('')
    try {
      const result = await api.adminDeleteUser(id)
      navigate('/admin', {
        replace: true,
        state: { flash: result.message || `${data.user.email} was deleted.` },
      })
    } catch (err) {
      handleError(err, setActionError)
      setBusy(false)
    }
  }

  if (forbidden) return <AdminNoAccess />

  if (loading && !data) {
    return (
      <>
        <Header title="User details" backTo="/admin" />
        <main className="page">
          <div className="spinner" />
          <p className="loading-text">Loading user…</p>
        </main>
      </>
    )
  }

  if (!data) {
    return (
      <>
        <Header title="User details" backTo="/admin" />
        <main className="page">
          <div className="alert alert--error mt-md" role="alert">
            {loadError || 'Unable to load this user.'}
          </div>
          <button type="button" className="btn btn--primary" onClick={load}>
            Try again
          </button>
          <Link to="/admin" className="btn btn--ghost mt-sm">Back to users</Link>
        </main>
      </>
    )
  }

  const { user, reminders, recentEntries, summary } = data
  const isSelf = me?.id != null && String(me.id) === String(user.id)
  const emailMatches = deleteEmail.trim().toLowerCase() === String(user.email).toLowerCase()

  return (
    <>
      <Header title="User details" backTo="/admin" />

      <main className="page page--wide">
        {/* Account */}
        <section className="card card--compact mt-md">
          <h2 className="admin-detail__name">{fullName(user)}</h2>
          <p className="admin-user__email">{user.email}</p>

          <div className="admin-badges mb-md">
            {user.isAdmin && <span className="admin-badge admin-badge--admin">Admin</span>}
            {user.emailVerified ? (
              <span className="admin-badge admin-badge--ok">Verified</span>
            ) : (
              <span className="admin-badge admin-badge--warn">Unverified</span>
            )}
            {isSelf && <span className="admin-badge">You</span>}
          </div>

          <div className="admin-info-grid">
            <InfoItem label="Preferred name">{user.preferredName || '—'}</InfoItem>
            <InfoItem label="Joined">{formatDateTime(user.createdAt)}</InfoItem>
            <InfoItem label="Last sign-in">{formatDateTime(user.lastLoginAt, 'Never')}</InfoItem>
            <InfoItem label="Active sessions">{user.activeSessions ?? 0}</InfoItem>
            <InfoItem label="Entries">{user.entryCount}</InfoItem>
            <InfoItem label="Last entry">{formatDay(user.lastEntryDate)}</InfoItem>
          </div>
        </section>

        {/* Reminders */}
        <section className="card card--compact">
          <h3 className="mb-md">Reminders</h3>
          <div className="admin-info-grid">
            <InfoItem label="Email reminders">{reminders?.remindersEnabled ? 'On' : 'Off'}</InfoItem>
            <InfoItem label="Frequency">
              {reminders?.frequency === 'weekly' ? 'Weekly' : 'Daily'}
            </InfoItem>
            <InfoItem label="Last reminded">{formatDateTime(reminders?.lastRemindedAt, 'Never')}</InfoItem>
          </div>
        </section>

        {/* 30-day summary */}
        <section className="card card--compact">
          <h3 className="mb-md">
            Last 30 days
            {summary?.period && (
              <span className="admin-count">
                {' '}({formatDay(summary.period.startDate)} – {formatDay(summary.period.endDate)})
              </span>
            )}
          </h3>
          <SummaryCards summary={summary} />
        </section>

        {/* Recent entries */}
        <section className="card card--compact">
          <h3 className="mb-md">Recent entries</h3>
          <EntriesTable entries={recentEntries} />
        </section>

        {/* Actions */}
        <section className="card card--compact">
          <h3 className="mb-md">Actions</h3>

          {actionMessage && (
            <div className="alert alert--success mb-md" role="status">{actionMessage}</div>
          )}
          {actionError && (
            <div className="alert alert--error mb-md" role="alert">{actionError}</div>
          )}

          <div className="btn-stack">
            {/* Admins cannot remove their own admin access; the server rejects it too. */}
            {!(isSelf && user.isAdmin) &&
              (confirming === 'admin' ? (
                <div className="danger-zone__confirm">
                  <p className="danger-zone__warning">
                    {user.isAdmin
                      ? `Remove admin access from ${user.email}?`
                      : `Give ${user.email} full admin access? They will be able to see and delete every account.`}
                  </p>
                  <div className="btn-stack">
                    <button type="button" className="btn btn--danger" onClick={handleToggleAdmin} disabled={busy}>
                      {busy ? 'Saving…' : user.isAdmin ? 'Yes, remove admin' : 'Yes, make admin'}
                    </button>
                    <button type="button" className="btn btn--secondary" onClick={() => setConfirming(null)} disabled={busy}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setConfirming('admin')}
                  disabled={busy}
                >
                  {user.isAdmin ? 'Remove admin' : 'Make admin'}
                </button>
              ))}

            <button type="button" className="btn btn--secondary" onClick={handleToggleVerified} disabled={busy}>
              {user.emailVerified ? 'Mark email as unverified' : 'Mark email as verified'}
            </button>

            {confirming === 'logout' ? (
              <div className="danger-zone__confirm">
                <p className="danger-zone__warning">
                  Sign {user.email} out on every device?
                </p>
                <div className="btn-stack">
                  <button type="button" className="btn btn--danger" onClick={handleLogoutEverywhere} disabled={busy}>
                    {busy ? 'Signing out…' : 'Yes, sign them out'}
                  </button>
                  <button type="button" className="btn btn--secondary" onClick={() => setConfirming(null)} disabled={busy}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setConfirming('logout')}
                disabled={busy}
              >
                Sign out of all devices
              </button>
            )}
          </div>

          {/* Admins delete their own account from Profile, not here. */}
          {!isSelf && (
            <>
              <hr className="divider" />
              <h3 className="danger-zone__title">Delete user</h3>
              <p className="profile-section__description mb-md">
                Permanently deletes this account and all of its tracking data. This cannot be undone.
              </p>

              {confirming === 'delete' ? (
                <div className="danger-zone__confirm">
                  <p className="danger-zone__warning">
                    Type <strong>{user.email}</strong> to confirm.
                  </p>
                  <input
                    className="form-input mb-md"
                    type="email"
                    value={deleteEmail}
                    onChange={(e) => setDeleteEmail(e.target.value)}
                    aria-label="Type the user's email to confirm deletion"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={busy}
                  />
                  <div className="btn-stack">
                    <button
                      type="button"
                      className="btn btn--danger"
                      onClick={handleDelete}
                      disabled={busy || !emailMatches}
                    >
                      {busy ? 'Deleting…' : 'Permanently delete user'}
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => {
                        setConfirming(null)
                        setDeleteEmail('')
                      }}
                      disabled={busy}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={() => {
                    setActionError('')
                    setDeleteEmail('')
                    setConfirming('delete')
                  }}
                  disabled={busy}
                >
                  Delete user
                </button>
              )}
            </>
          )}
        </section>
      </main>
    </>
  )
}
