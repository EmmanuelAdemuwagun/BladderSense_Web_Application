import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import AdminNoAccess from '../components/AdminNoAccess'
import { api } from '../utils/api'
import { formatDay, formatShortDay, formatDateTime, fullName, handleAuthError } from '../utils/admin'

const STATUS_OPTIONS = [
  { value: '', label: 'All users' },
  { value: 'verified', label: 'Verified' },
  { value: 'unverified', label: 'Unverified' },
  { value: 'admin', label: 'Admins' },
]

const PAGE_SIZE = 20

/* ---------------------------------------------
   14-day bar chart (one series, own scale)
--------------------------------------------- */
function ActivityChart({ title, days, field }) {
  const max = Math.max(1, ...days.map((d) => d[field] || 0))
  const total = days.reduce((sum, d) => sum + (d[field] || 0), 0)

  return (
    <figure className="admin-chart">
      <figcaption className="admin-chart__title">
        {title} <span className="admin-chart__total">· {total} in 14 days</span>
      </figcaption>

      <div className="admin-chart__bars" role="list">
        {days.map((d) => {
          const value = d[field] || 0
          const label = `${formatDay(d.date)}: ${value}`
          return (
            <div key={d.date} className="admin-chart__col" role="listitem" aria-label={label} title={label}>
              <span className="admin-chart__value">{value || ''}</span>
              <span
                className="admin-chart__bar"
                style={{ height: `${Math.max((value / max) * 100, value ? 4 : 0)}%` }}
              />
            </div>
          )
        })}
      </div>

      <div className="admin-chart__axis" aria-hidden="true">
        <span>{formatShortDay(days[0]?.date)}</span>
        <span>{formatShortDay(days[days.length - 1]?.date)}</span>
      </div>
    </figure>
  )
}

function StatCard({ label, value, hint }) {
  return (
    <div className="admin-stat">
      <span className="admin-stat__value">{value ?? '—'}</span>
      <span className="admin-stat__label">{label}</span>
      {hint && <span className="admin-stat__hint">{hint}</span>}
    </div>
  )
}

/* ---------------------------------------------
   Overview: stat cards + activity charts
--------------------------------------------- */
function Overview({ data }) {
  const { stats, dailyActivity = [] } = data

  return (
    <section className="card card--compact" aria-labelledby="admin-overview-title">
      <h2 id="admin-overview-title" className="mb-md">Overview</h2>

      <div className="admin-stats">
        <StatCard label="Total users" value={stats.totalUsers} hint={`${stats.verifiedUsers} verified`} />
        <StatCard label="New users" value={stats.newUsers7d} hint={`last 7 days · ${stats.newUsers30d} in 30`} />
        <StatCard label="Active users" value={stats.activeUsers7d} hint={`last 7 days · ${stats.activeUsers30d} in 30`} />
        <StatCard label="Entries" value={stats.entries7d} hint={`last 7 days · ${stats.totalEntries} total`} />
        <StatCard label="Reminders on" value={stats.remindersEnabled} />
        <StatCard label="Active sessions" value={stats.activeSessions} />
        <StatCard label="Admins" value={stats.adminUsers} />
      </div>

      {dailyActivity.length > 0 && (
        <div className="admin-charts">
          <ActivityChart title="Sign-ups per day" days={dailyActivity} field="signups" />
          <ActivityChart title="Entries per day" days={dailyActivity} field="entries" />
        </div>
      )}
    </section>
  )
}

/* ---------------------------------------------
   Users: search, filter, paginated list
--------------------------------------------- */
function UserRow({ user }) {
  return (
    <li>
      <Link to={`/admin/users/${encodeURIComponent(user.id)}`} className="admin-user">
        <span className="admin-user__main">
          <span className="admin-user__name">
            {fullName(user)}
            {user.preferredName && (
              <span className="admin-user__preferred"> ({user.preferredName})</span>
            )}
          </span>
          <span className="admin-user__email">{user.email}</span>

          <span className="admin-badges">
            {user.isAdmin && <span className="admin-badge admin-badge--admin">Admin</span>}
            {user.emailVerified ? (
              <span className="admin-badge admin-badge--ok">Verified</span>
            ) : (
              <span className="admin-badge admin-badge--warn">Unverified</span>
            )}
          </span>

          <span className="admin-user__meta">
            {user.entryCount} {user.entryCount === 1 ? 'entry' : 'entries'}
            {' · '}last entry {formatDay(user.lastEntryDate)}
            {' · '}joined {formatDateTime(user.createdAt)}
          </span>
        </span>

        <span className="nav-card__arrow" aria-hidden="true">›</span>
      </Link>
    </li>
  )
}

function Users({ onForbidden }) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const page = Math.max(1, Number(params.get('page')) || 1)
  const status = params.get('status') || ''
  const search = params.get('search') || ''

  const [searchInput, setSearchInput] = useState(search)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  function updateParams(changes) {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined || (key === 'page' && value === 1)) {
        next.delete(key)
      } else {
        next.set(key, String(value))
      }
    })
    setParams(next, { replace: true })
  }

  // Keep the box in sync when the URL changes (e.g. browser back).
  useEffect(() => {
    setSearchInput((current) => (current.trim() === search ? current : search))
  }, [search])

  // Debounce typing into the search box (~300 ms) before querying.
  useEffect(() => {
    if (searchInput.trim() === search) return undefined
    const timer = setTimeout(() => {
      updateParams({ search: searchInput.trim(), page: 1 })
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')

    api
      .adminListUsers({ page, limit: PAGE_SIZE, search, status })
      .then((result) => {
        if (mounted) setData(result)
      })
      .catch((err) => {
        if (!mounted || handleAuthError(err, navigate)) return
        if (err.status === 403) return onForbidden()
        setError(err.message)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [page, search, status, reloadKey, navigate, onForbidden])

  const pagination = data?.pagination
  const users = data?.users || []

  return (
    <section className="card card--compact" aria-labelledby="admin-users-title">
      <h2 id="admin-users-title" className="mb-md">
        Users
        {pagination && <span className="admin-count"> ({pagination.total})</span>}
      </h2>

      <div className="admin-filters">
        <label className="form-label" htmlFor="admin-search">Search</label>
        <input
          id="admin-search"
          className="form-input"
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Name or email"
          autoComplete="off"
          spellCheck={false}
        />

        <label className="form-label" htmlFor="admin-status">Show</label>
        <select
          id="admin-status"
          className="form-input"
          value={status}
          onChange={(e) => updateParams({ status: e.target.value, page: 1 })}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="alert alert--error mt-md" role="alert">
          {error}
          <button type="button" className="btn btn--ghost" onClick={() => setReloadKey((k) => k + 1)}>
            Try again
          </button>
        </div>
      )}

      {loading && !data ? (
        <div className="spinner" />
      ) : (
        <>
          {users.length === 0 && !error ? (
            <p className="text-muted text-center mt-md">No users match these filters.</p>
          ) : (
            <ul className={`admin-user-list${loading ? ' admin-user-list--loading' : ''}`} aria-busy={loading}>
              {users.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </ul>
          )}

          {pagination && pagination.totalPages > 1 && (
            <nav className="admin-pagination" aria-label="Pages">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => updateParams({ page: page - 1 })}
                disabled={loading || page <= 1}
              >
                ‹ Previous
              </button>
              <span className="admin-pagination__label">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => updateParams({ page: page + 1 })}
                disabled={loading || page >= pagination.totalPages}
              >
                Next ›
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}

export default function Admin() {
  const navigate = useNavigate()
  const location = useLocation()

  const [stats, setStats] = useState(null)
  const [statsError, setStatsError] = useState('')
  const [forbidden, setForbidden] = useState(false)
  const [flash] = useState(location.state?.flash || '')

  // Drop the one-off flash message from history so a refresh does not repeat it.
  useEffect(() => {
    if (location.state?.flash) {
      navigate(location.pathname + location.search, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let mounted = true

    api
      .adminGetStats()
      .then((data) => {
        if (mounted) setStats(data)
      })
      .catch((err) => {
        if (!mounted || handleAuthError(err, navigate)) return
        if (err.status === 403) return setForbidden(true)
        setStatsError(err.message)
      })

    return () => {
      mounted = false
    }
  }, [navigate])

  const onForbidden = useCallback(() => setForbidden(true), [])

  if (forbidden) return <AdminNoAccess />

  return (
    <>
      <Header title="Admin" backTo="/dashboard" />

      <main className="page page--wide">
        {flash && (
          <div className="alert alert--success mt-md" role="status">
            {flash}
          </div>
        )}

        {statsError ? (
          <div className="alert alert--error mt-md" role="alert">{statsError}</div>
        ) : stats ? (
          <div className="mt-md">
            <Overview data={stats} />
          </div>
        ) : (
          <div className="spinner" />
        )}

        <Users onForbidden={onForbidden} />
      </main>
    </>
  )
}
