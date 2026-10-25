import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Header from '../components/Header'
import { guideSections } from '../content/guide'
import { api } from '../utils/api'
import { getSessionUser } from '../utils/auth'
import { markSectionRead } from '../utils/guideProgress'

function renderBlock(block, i) {
  switch (block.type) {
    case 'paragraph':
      return <p key={i}>{block.text}</p>

    case 'heading':
      return (
        <h3 key={i} style={{ marginTop: 'var(--space-lg)' }}>
          {block.text}
        </h3>
      )

    case 'list':
      return (
        <ul key={i}>
          {block.items.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ul>
      )

    case 'checklist':
      return (
        <ul key={i} className="guide-checklist">
          {block.items.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ul>
      )

    case 'tip':
      return (
        <div key={i} className="guide-tip">
          💡 {block.text}
        </div>
      )

    default:
      return null
  }
}

export default function GuideSection() {
  const { sectionId } = useParams()
  const navigate = useNavigate()

  /*
   * Trust the locally saved session for access so a signed-in reader is never
   * bounced out of the guide by a transient API/cookie hiccup. We still verify
   * with the backend in the background, and only redirect home if there is no
   * local session at all.
   */
  const localUser = getSessionUser()

  const [authenticated, setAuthenticated] = useState(!!localUser)
  const [loading, setLoading] = useState(!localUser)

  useEffect(() => {
    let mounted = true

    api.getProfile()
      .then(() => {
        if (mounted) {
          setAuthenticated(true)
        }
      })
      .catch(() => {
        if (mounted && !getSessionUser()) {
          navigate('/', { replace: true })
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [navigate])

  const section = guideSections.find((s) => s.id === sectionId)

  // Tick this part off on the dashboard's topic list
  useEffect(() => {
    if (authenticated && section) {
      markSectionRead(section.id)
    }
  }, [authenticated, section])

  if (loading) {
    return (
      <main className="page">
        <div className="spinner" />
        <p className="loading-text">Loading…</p>
      </main>
    )
  }

  if (!authenticated) return null

  if (!section) {
    return (
      <>
        <Header title="Not Found" backTo="/dashboard" />
        <main className="page">
          <div className="card mt-md text-center">
            <p>This section could not be found.</p>
            <button
              className="btn btn--primary mt-md"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </>
    )
  }

  const currentIndex = guideSections.findIndex((s) => s.id === sectionId)
  const next = guideSections[currentIndex + 1]
  const prev = guideSections[currentIndex - 1]

  return (
    <>
      {/* The bar only has room for a short label; the full section
          name is the page heading below, where it can wrap freely. */}
      <Header title="Your Guide" backTo="/dashboard" />

      <main className="page guide-section">
        <header className="guide-title">
          <p className="guide-title__count">
            Part {currentIndex + 1} of {guideSections.length}
          </p>
          {/* h2: the header bar already holds the page's h1 */}
          <h2 className="guide-title__heading">
            <span className="guide-title__icon" aria-hidden="true">
              {section.icon}
            </span>
            {section.title}
          </h2>
          {section.fullTitle && (
            <p className="guide-title__full">{section.fullTitle}</p>
          )}
        </header>

        <div className="guide-key-message">
          <p>{section.content.keyMessage}</p>
        </div>

        {section.content.body.map((block, i) => renderBlock(block, i))}

        <hr className="divider" />

        {/* Next is the main action, so it comes first and full width;
            each button names where it goes. */}
        <nav className="guide-nav" aria-label="Guide pages">
          {next ? (
            <button
              className="btn btn--primary guide-nav__btn"
              onClick={() => navigate(`/guide/${next.id}`)}
            >
              <span className="guide-nav__label">Next</span>
              <span>{next.title}{'\u00a0'}→</span>
            </button>
          ) : (
            <p className="guide-nav__done">
              ✓ You have reached the end of the guide.
            </p>
          )}

          {prev && (
            <button
              className="btn btn--secondary guide-nav__btn"
              onClick={() => navigate(`/guide/${prev.id}`)}
            >
              <span className="guide-nav__label">Previous</span>
              <span>←{'\u00a0'}{prev.title}</span>
            </button>
          )}

          <button
            className="btn btn--ghost"
            onClick={() => navigate('/dashboard')}
          >
            Back to Home
          </button>
        </nav>
      </main>
    </>
  )
}

