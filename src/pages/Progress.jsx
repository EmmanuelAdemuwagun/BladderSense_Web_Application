import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { api } from '../utils/api'

const FIELDS = [
  {
    id: 'nightTimeUrination',
    label: 'Night-time urination',
    icon: '🌙',
    options: ['0', '1', '2', '3+'],
    lowerIsBetter: true,
  },
  {
    id: 'eveningFluids',
    label: 'Evening fluids',
    icon: '🥤',
    options: ['None', 'Small', 'Moderate', 'Large'],
    lowerIsBetter: true,
  },
  {
    id: 'activityLevel',
    label: 'Activity level',
    icon: '🚶',
    options: ['None', 'Light', 'Moderate', 'High'],
    lowerIsBetter: false,
  },
  {
    id: 'stressLevel',
    label: 'Stress level',
    icon: '🧠',
    options: ['1', '2', '3', '4', '5'],
    lowerIsBetter: true,
  },
  {
    id: 'sleepQuality',
    label: 'Sleep quality',
    icon: '🛏️',
    options: ['Poor', 'Fair', 'Good'],
    lowerIsBetter: false,
  },
]

function getLast7Days() {
  const days = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }

  return days
}

function shortDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`)

  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
  })
}

function getDotColor(value, field) {
  const idx = field.options.indexOf(value)

  if (idx === -1) {
    return '#ccd6e0'
  }

  const max = field.options.length - 1

  // Prevent division by zero if a field ever has only one option.
  if (max === 0) {
    return '#1a7a3c'
  }

  const ratio = idx / max

  if (field.lowerIsBetter) {
    if (ratio <= 0.25) return '#1a7a3c'
    if (ratio <= 0.5) return '#d4ac0d'

    return '#922b21'
  }

  if (ratio >= 0.75) return '#1a7a3c'
  if (ratio >= 0.5) return '#d4ac0d'

  return '#922b21'
}

export default function Progress() {
  const navigate = useNavigate()

  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadProgress() {
      try {
        const data = await api.getTracking()

        if (!mounted) return

        setEntries(data.entries || [])
      } catch (err) {
        if (!mounted) return

        setError(err.message || 'Unable to load your progress.')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadProgress()

    return () => {
      mounted = false
    }
  }, [])

  const last7 = getLast7Days()

  const entryMap = {}

  entries.forEach((entry) => {
    entryMap[entry.date] = entry
  })

  const trackedCount = last7.filter(
    (date) => entryMap[date]
  ).length

  return (
    <>
      <Header
        title="My 7-Day Progress"
        backTo="/daily-tracking"
      />

      <main className="page">
        {loading ? (
          <>
            <div className="spinner" />
            <p className="loading-text">
              Loading your progress…
            </p>
          </>
        ) : (
          <>
            {error && (
              <div
                className="alert alert--error mb-md"
                role="alert"
              >
                {error}

                <button
                  type="button"
                  className="btn btn--ghost mt-sm"
                  onClick={() => navigate('/signin', { replace: true })}
                >
                  Sign In Again
                </button>
              </div>
            )}

            {/* Summary banner */}
            <div
              className="card card--compact mb-md"
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
              }}
            >
              <p
                style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Last 7 Days
              </p>

              <p
                style={{
                  margin: '6px 0 0',
                  opacity: 0.88,
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                {trackedCount} of 7 days recorded
              </p>
            </div>

            {trackedCount === 0 && (
              <div className="alert alert--info">
                No entries yet for the last 7 days.
                Start tracking today to see your progress here.
              </div>
            )}

            {/* Per-metric rows */}
            {FIELDS.map((field) => (
              <div
                key={field.id}
                className="card card--compact mb-md"
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 16,
                  }}
                >
                  <span
                    style={{ fontSize: 28 }}
                    aria-hidden="true"
                  >
                    {field.icon}
                  </span>

                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 'var(--font-size-base)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {field.label}
                  </span>
                </div>

                {/* 7-day dots */}
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    flexWrap: 'wrap',
                    marginBottom: 12,
                  }}
                >
                  {last7.map((date) => {
                    const entry = entryMap[date]
                    const value = entry?.values?.[field.id]

                    const color = value
                      ? getDotColor(value, field)
                      : '#e8edf2'

                    return (
                      <div
                        key={date}
                        style={{
                          textAlign: 'center',
                          flex: 1,
                          minWidth: 36,
                        }}
                      >
                        <div
                          title={
                            value
                              ? `${shortDate(date)}: ${value}`
                              : `${shortDate(date)}: Not recorded`
                          }
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: color,
                            margin: '0 auto 4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid rgba(0,0,0,0.08)',
                          }}
                        >
                          {value && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#fff',
                                lineHeight: 1,
                              }}
                            >
                              {value.length <= 2
                                ? value
                                : value.charAt(0)}
                            </span>
                          )}
                        </div>

                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--color-text-muted)',
                            display: 'block',
                          }}
                        >
                          {shortDate(date).split(' ')[0]}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Legend */}
                <div
                  style={{
                    display: 'flex',
                    gap: 16,
                    fontSize: 13,
                    color: 'var(--color-text-muted)',
                    flexWrap: 'wrap',
                  }}
                >
                  <span>
                    <span
                      style={{
                        color: '#1a7a3c',
                        fontWeight: 700,
                      }}
                    >
                      ●
                    </span>{' '}
                    Good
                  </span>

                  <span>
                    <span
                      style={{
                        color: '#d4ac0d',
                        fontWeight: 700,
                      }}
                    >
                      ●
                    </span>{' '}
                    Fair
                  </span>

                  <span>
                    <span
                      style={{
                        color: '#922b21',
                        fontWeight: 700,
                      }}
                    >
                      ●
                    </span>{' '}
                    Needs work
                  </span>

                  <span>
                    <span
                      style={{
                        color: '#e8edf2',
                        fontWeight: 700,
                        border: '1px solid #ccc',
                        borderRadius: '50%',
                        display: 'inline-block',
                        width: 12,
                        height: 12,
                      }}
                    />
                    {' '}Not recorded
                  </span>
                </div>
              </div>
            ))}

            {/* Notes from this week */}
            {last7.some(
              (date) => entryMap[date]?.notes
            ) && (
              <div className="card card--compact mb-md">
                <h3 className="mb-md">
                  📝 Your Notes This Week
                </h3>

                {last7
                  .filter(
                    (date) => entryMap[date]?.notes
                  )
                  .map((date) => (
                    <div
                      key={date}
                      style={{
                        marginBottom: 16,
                        paddingBottom: 16,
                        borderBottom:
                          '1px solid var(--color-border)',
                      }}
                    >
                      <p
                        style={{
                          fontWeight: 700,
                          color: 'var(--color-primary)',
                          marginBottom: 4,
                        }}
                      >
                        {shortDate(date)}
                      </p>

                      <p
                        style={{
                          margin: 0,
                          color: 'var(--color-text-muted)',
                          fontSize: 'var(--font-size-sm)',
                        }}
                      >
                        {entryMap[date].notes}
                      </p>
                    </div>
                  ))}
              </div>
            )}

            {/* Reminder */}
            <div className="guide-tip">
              💡 Patterns matter more than single days.
              Keep recording daily for the best picture.
            </div>
          </>
        )}
      </main>
    </>
  )
}



