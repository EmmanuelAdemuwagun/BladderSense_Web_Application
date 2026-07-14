import { useParams, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import Header from '../components/Header'
import { guideSections } from '../content/guide'
import { getSessionUser } from '../utils/auth'

function renderBlock(block, i) {
  switch (block.type) {
    case 'paragraph':
      return <p key={i}>{block.text}</p>
    case 'heading':
      return <h3 key={i} style={{ marginTop: 'var(--space-lg)' }}>{block.text}</h3>
    case 'list':
      return (
        <ul key={i}>
          {block.items.map((item, j) => <li key={j}>{item}</li>)}
        </ul>
      )
    case 'checklist':
      return (
        <ul key={i} className="guide-checklist">
          {block.items.map((item, j) => <li key={j}>{item}</li>)}
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
  const user = getSessionUser()

  useEffect(() => {
    if (!user) navigate('/', { replace: true })
  }, [user, navigate])

  const section = guideSections.find((s) => s.id === sectionId)

  if (!section) {
    return (
      <>
        <Header title="Not Found" backTo="/dashboard" />
        <main className="page">
          <div className="card mt-md text-center">
            <p>This section could not be found.</p>
            <button className="btn btn--primary mt-md" onClick={() => navigate('/dashboard')}>
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
      <Header title={section.title} backTo="/dashboard" />
      <main className="page guide-section">
        <div className="guide-key-message">
          <p>{section.content.keyMessage}</p>
        </div>

        {section.content.body.map((block, i) => renderBlock(block, i))}

        <hr className="divider" />

        {/* Prev / Next navigation */}
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
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
          style={{ display: 'block', width: '100%', textAlign: 'center' }}
        >
          Back to Dashboard
        </button>
      </main>
    </>
  )
}
