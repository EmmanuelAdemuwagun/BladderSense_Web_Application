// import { useEffect, useState } from 'react'
// import { useNavigate, Link } from 'react-router-dom'
// import { api } from '../utils/api'
// import { guideSections } from '../content/guide'

// export default function Dashboard() {
//   const navigate = useNavigate()

//   const [user, setUser] = useState(null)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     api.getProfile()
//       .then((data) => {
//         setUser(data.user || data)
//       })
//       .catch(() => {
//         navigate('/signin', { replace: true })
//       })
//       .finally(() => {
//         setLoading(false)
//       })
//   }, [navigate])

//   if (loading) {
//     return (
//       <main className="page">
//         <div className="spinner" />
//         <p className="loading-text">Loading…</p>
//       </main>
//     )
//   }

//   if (!user) return null

//   const displayName = user.preferredName || user.firstName

// async function handleLogout() {
//   try {
//     await api.logout()
//   } catch (error) {
//     console.error('Logout error:', error)
//   } finally {
//     navigate('/', { replace: true })
//   }
// }

//   return (
//     <>
//       <header className="header">
//         <button className="header__back" onClick={() => navigate('/')} aria-label="Home">
//           🏠 Home
//         </button>
//         <h1 className="header__title">Bladder Health Guide</h1>
//         <button className="header__back" onClick={() => navigate('/profile')} aria-label="My Profile">
//           Profile
//         </button>
//       </header>

//       <main className="page">
//         {/* Welcome banner */}
//         <div className="card card--compact mb-md" style={{ background: 'var(--color-primary)', color: '#fff', borderRadius: 'var(--radius)' }}>
//           <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: 0 }}>
//             Welcome, {displayName} 👋
//           </p>
//           <p style={{ fontSize: 'var(--font-size-sm)', margin: '6px 0 0', opacity: 0.88 }}>
//             Your personal bladder health guide
//           </p>
//         </div>

//         {/* Daily Tracking */}
//         <Link to="/daily-tracking" className="nav-card mb-md" style={{ borderColor: 'var(--color-primary)', background: '#eaf3fb' }}>
//           <span className="nav-card__icon">📊</span>
//           <span className="nav-card__text">
//             <span className="nav-card__title">Daily Tracking</span>
//             <span className="nav-card__desc">Record today's symptoms and progress</span>
//           </span>
//           <span className="nav-card__arrow">›</span>
//         </Link>

//         {/* Progress */}
//         <Link to="/progress" className="nav-card mb-md" style={{ borderColor: '#1a7a3c', background: '#d4edda' }}>
//           <span className="nav-card__icon">📊</span>
//           <span className="nav-card__text">
//             <span className="nav-card__title" style={{ color: '#1a7a3c' }}>My 7-Day Progress</span>
//             <span className="nav-card__desc">See how you have been doing this week</span>
//           </span>
//           <span className="nav-card__arrow">›</span>
//         </Link>

//         {/* Guide sections */}
//         <h2 className="mt-md mb-md">Your Guide</h2>
//         <nav className="nav-grid" aria-label="Guide sections">
//           {guideSections.map((section) => (
//             <Link
//               key={section.id}
//               to={`/guide/${section.id}`}
//               className="nav-card"
//             >
//               <span className="nav-card__icon" aria-hidden="true">{section.icon}</span>
//               <span className="nav-card__text">
//                 <span className="nav-card__title">{section.title}</span>
//                 <span className="nav-card__desc">{section.shortDesc}</span>
//               </span>
//               <span className="nav-card__arrow" aria-hidden="true">›</span>
//             </Link>
//           ))}
//         </nav>

//         <hr className="divider" />
//         <button className="btn btn--secondary" onClick={handleLogout}>
//           Sign Out
//         </button>
//         <p className="text-muted text-center mt-sm">
//           Signed in as {user.email}
//         </p>
//       </main>

//     </>
//   )
// }


import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Header from '../components/Header'
import { api } from '../utils/api'
import { getSessionUser, saveSession, clearSession } from '../utils/auth'
import { guideSections } from '../content/guide'
import { localDateString } from '../utils/date'
import {
  getReadSections,
  nextUnreadSection,
  resetGuideProgress,
  syncGuideProgress,
} from '../utils/guideProgress'

export default function Dashboard() {
  const navigate = useNavigate()

  /*
   * Seed from the locally saved user so a returning, signed-in user sees their
   * dashboard immediately — no spinner, no flash of the sign-in page.
   */
  const localUser = getSessionUser()

  const [user, setUser] = useState(localUser)
  const [loading, setLoading] = useState(!localUser)
  // null = not known yet; true/false once today's entries have loaded
  const [trackedToday, setTrackedToday] = useState(null)
  const [showTopics, setShowTopics] = useState(false)
  // This device's copy first, then the merged server copy once it loads
  const [readSections, setReadSections] = useState(getReadSections)

  useEffect(() => {
    let mounted = true

    async function loadProfile() {
      try {
        const data = await api.getProfile()
        const freshUser = data.user || data

        if (mounted && freshUser) {
          setUser(freshUser)
          saveSession(null, freshUser)
        }
      } catch {
        /*
         * Only send the user to sign-in if we have no local session at all.
         * If a local session exists, keep them on the dashboard: the API may
         * be temporarily unreachable, and ejecting a signed-in senior back to
         * the login screen is exactly the behaviour we want to avoid.
         */
        if (mounted && !getSessionUser()) {
          clearSession()
          navigate('/signin', { replace: true })
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadProfile()

    syncGuideProgress().then((read) => {
      if (mounted) {
        setReadSections(read)
      }
    })

    api
      .getTracking()
      .then((data) => {
        const today = localDateString()
        if (mounted) {
          setTrackedToday(
            (data.entries || []).some(
              (entry) => String(entry.entryDate).slice(0, 10) === today
            )
          )
        }
      })
      .catch(() => {
        // Leave the status unknown; the card still works without it.
      })

    return () => {
      mounted = false
    }
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

  // Finished readers start over: clear progress, then open the first part
  async function readAgain(event) {
    event.preventDefault()
    await resetGuideProgress()
    setReadSections(new Set())
    navigate(`/guide/${guideSections[0].id}`)
  }

  const readCount = guideSections.filter((s) => readSections.has(s.id)).length
  const nextSection = nextUnreadSection(readSections)

  return (
    <>
      <Header title="My Dashboard" showBack={false} showHome />

      <main className="page">
        {/* Welcome banner */}
        <div
          className="card card--compact mb-md"
          style={{
            background: 'var(--color-primary)',
            color: '#fff',
            borderRadius: 'var(--radius)',
          }}
        >
          <p
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 700,
              margin: 0,
            }}
          >
            Welcome, {displayName} 👋
          </p>

          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              margin: '6px 0 0',
              opacity: 0.88,
            }}
          >
            Your personal bladder health guide
          </p>
        </div>

        {/* Your guide — the one main next step */}
        <section className="guide-start mb-md" aria-labelledby="guide-start-title">
          <h2 id="guide-start-title" className="guide-start__title">Your Guide</h2>
          <p className="guide-start__progress">
            {readCount === 0
              ? `${guideSections.length} short parts. Read them in order, at your own pace.`
              : `You have read ${readCount} of ${guideSections.length} parts.`}
          </p>
          <div
            className="guide-start__bar"
            role="progressbar"
            aria-label="Guide parts read"
            aria-valuemin={0}
            aria-valuemax={guideSections.length}
            aria-valuenow={readCount}
          >
            <span style={{ width: `${(readCount / guideSections.length) * 100}%` }} />
          </div>
          <Link
            to={`/guide/${(nextSection || guideSections[0]).id}`}
            className="btn btn--primary guide-start__btn"
            onClick={nextSection ? undefined : readAgain}
          >
            <span>
              {readCount === 0
                ? 'Start My Guide'
                : nextSection
                  ? 'Continue My Guide'
                  : 'Read the Guide Again'}
            </span>
            <span className="guide-start__next">
              {nextSection
                ? `Part ${guideSections.indexOf(nextSection) + 1}: ${nextSection.title}\u00a0→`
                : 'You have read every part ✓'}
            </span>
          </Link>
        </section>

        {/* Daily Tracking */}
        <Link
          to="/daily-tracking"
          className="nav-card mb-md"
          style={{
            borderColor: 'var(--color-primary)',
            background: '#eaf3fb',
          }}
        >
          <span className="nav-card__icon" aria-hidden="true">📝</span>

          <span className="nav-card__text">
            <span className="nav-card__title">Daily Tracking</span>
            <span className="nav-card__desc">
              {trackedToday === true
                ? "Today's record is saved. Tap to view or change it."
                : "Record today's symptoms. It takes about a minute."}
            </span>
            {trackedToday !== null && (
              <span
                className={`status-pill ${
                  trackedToday ? 'status-pill--done' : 'status-pill--todo'
                }`}
              >
                {trackedToday ? '✓ Done today' : 'Not done yet today'}
              </span>
            )}
          </span>

          <span className="nav-card__arrow">›</span>
        </Link>

        {/* Progress */}
        <Link
          to="/progress"
          className="nav-card mb-md"
          style={{
            borderColor: '#1a7a3c',
            background: '#d4edda',
          }}
        >
          <span className="nav-card__icon" aria-hidden="true">📈</span>

          <span className="nav-card__text">
            <span
              className="nav-card__title"
              style={{ color: '#1a7a3c' }}
            >
              My 7-Day Progress
            </span>

            <span className="nav-card__desc">
              See how you have been doing this week
            </span>
          </span>

          <span className="nav-card__arrow">›</span>
        </Link>

        {/* Admin (UI hint only — the server enforces access on every admin call) */}
        {user.isAdmin === true && (
          <Link
            to="/admin"
            className="nav-card mb-md"
            style={{ borderColor: 'var(--color-gold)', background: 'var(--color-warning-bg)' }}
          >
            <span className="nav-card__icon" aria-hidden="true">🛠️</span>

            <span className="nav-card__text">
              <span className="nav-card__title">Admin</span>
              <span className="nav-card__desc">
                Platform stats and user management
              </span>
            </span>

            <span className="nav-card__arrow" aria-hidden="true">›</span>
          </Link>
        )}

        {/* All topics — tucked behind one button so the page offers one
            clear next step instead of thirteen choices at once */}
        <button
          type="button"
          className="btn btn--secondary mt-md"
          aria-expanded={showTopics}
          aria-controls="all-topics"
          onClick={() => setShowTopics((open) => !open)}
        >
          {showTopics ? 'Hide All Topics ▲' : `View All ${guideSections.length} Topics ▼`}
        </button>

        {showTopics && (
          <nav id="all-topics" className="nav-grid mt-md" aria-label="All guide topics">
            {guideSections.map((section, i) => (
              <Link
                key={section.id}
                to={`/guide/${section.id}`}
                className="nav-card"
              >
                <span className="nav-card__icon" aria-hidden="true">
                  {section.icon}
                </span>

                <span className="nav-card__text">
                  <span className="nav-card__step">Part {i + 1}</span>
                  <span className="nav-card__title">
                    {section.title}
                  </span>

                  <span className="nav-card__desc">
                    {section.shortDesc}
                  </span>

                  {readSections.has(section.id) && (
                    <span className="status-pill status-pill--done">
                      ✓ Read
                    </span>
                  )}
                </span>

                <span className="nav-card__arrow" aria-hidden="true">
                  ›
                </span>
              </Link>
            ))}
          </nav>
        )}

        <p className="text-center mt-lg">
          <Link to="/profile#text-size" className="text-link">
            Text too small? Make it bigger
          </Link>
        </p>
      </main>
    </>
  )
}

