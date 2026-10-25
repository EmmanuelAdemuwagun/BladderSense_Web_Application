import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Header from '../components/Header'
import { guideSections } from '../content/guide'
import { api } from '../utils/api'
import { getSessionUser } from '../utils/auth'

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
          <h1 className="guide-title__heading">
            <span className="guide-title__icon" aria-hidden="true">
              {section.icon}
            </span>
            {section.title}
          </h1>
        </header>

        <div className="guide-key-message">
          <p>{section.content.keyMessage}</p>
        </div>

        {section.content.body.map((block, i) => renderBlock(block, i))}

        <hr className="divider" />

        {/* Prev / Next navigation */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-md)',
            flexWrap: 'wrap',
          }}
        >
          {prev && (
            <button
              className="btn btn--secondary"
              style={{ flex: 1 }}
              onClick={() => navigate(`/guide/${prev.id}`)}
            >
              ← {prev.title}
            </button>
          )}

          {next && (
            <button
              className="btn btn--primary"
              style={{ flex: 1 }}
              onClick={() => navigate(`/guide/${next.id}`)}
            >
              {next.title} →
            </button>
          )}
        </div>

        <button
          className="btn btn--ghost mt-md"
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'center',
          }}
        >
          Back to Dashboard
        </button>
      </main>
    </>
  )
}

