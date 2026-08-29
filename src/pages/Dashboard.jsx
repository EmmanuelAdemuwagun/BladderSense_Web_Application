import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../utils/api'
import { guideSections } from '../content/guide'

export default function Dashboard() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getProfile()
      .then((data) => {
        setUser(data.user || data)
      })
      .catch(() => {
        navigate('/signin', { replace: true })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [navigate])

  if (loading) {
    return (
      <main className="page">
        <div className="spinner" />
        <p className="loading-text">Loading…</p>
      </main>
    )
  }

  if (!user) return null

  const displayName = user.preferredName || user.firstName

async function handleLogout() {
  try {
    await api.logout()
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    navigate('/', { replace: true })
  }
}

  return (
    <>
      <header className="header">
        <button className="header__back" onClick={() => navigate('/')} aria-label="Home">
          🏠 Home
        </button>
        <h1 className="header__title">Bladder Health Guide</h1>
        <button className="header__back" onClick={() => navigate('/profile')} aria-label="My Profile">
          Profile
        </button>
      </header>

      <main className="page">
        {/* Welcome banner */}
        <div className="card card--compact mb-md" style={{ background: 'var(--color-primary)', color: '#fff', borderRadius: 'var(--radius)' }}>
          <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: 0 }}>
            Welcome, {displayName} 👋
          </p>
          <p style={{ fontSize: 'var(--font-size-sm)', margin: '6px 0 0', opacity: 0.88 }}>
            Your personal bladder health guide
          </p>
        </div>

        {/* Daily Tracking */}
        <Link to="/daily-tracking" className="nav-card mb-md" style={{ borderColor: 'var(--color-primary)', background: '#eaf3fb' }}>
          <span className="nav-card__icon">📊</span>
          <span className="nav-card__text">
            <span className="nav-card__title">Daily Tracking</span>
            <span className="nav-card__desc">Record today's symptoms and progress</span>
          </span>
          <span className="nav-card__arrow">›</span>
        </Link>

        {/* Progress */}
        <Link to="/progress" className="nav-card mb-md" style={{ borderColor: '#1a7a3c', background: '#d4edda' }}>
          <span className="nav-card__icon">📊</span>
          <span className="nav-card__text">
            <span className="nav-card__title" style={{ color: '#1a7a3c' }}>My 7-Day Progress</span>
            <span className="nav-card__desc">See how you have been doing this week</span>
          </span>
          <span className="nav-card__arrow">›</span>
        </Link>

        {/* Guide sections */}
        <h2 className="mt-md mb-md">Your Guide</h2>
        <nav className="nav-grid" aria-label="Guide sections">
          {guideSections.map((section) => (
            <Link
              key={section.id}
              to={`/guide/${section.id}`}
              className="nav-card"
            >
              <span className="nav-card__icon" aria-hidden="true">{section.icon}</span>
              <span className="nav-card__text">
                <span className="nav-card__title">{section.title}</span>
                <span className="nav-card__desc">{section.shortDesc}</span>
              </span>
              <span className="nav-card__arrow" aria-hidden="true">›</span>
            </Link>
          ))}
        </nav>

        <hr className="divider" />
        <button className="btn btn--secondary" onClick={handleLogout}>
          Sign Out
        </button>
        <p className="text-muted text-center mt-sm">
          Signed in as {user.email}
        </p>
      </main>
    </>
  )
}
