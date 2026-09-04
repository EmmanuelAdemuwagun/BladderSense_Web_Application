
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { api } from '../utils/api'
import { CategoryKey } from '../content/categoryKey'

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

/*
 * Return today's date using the user's local timezone.
 *
 * We deliberately do NOT use:
 *
 * new Date().toISOString()
 *
 * because that converts the date to UTC first.
 */
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0')
  const day = String(
    date.getDate()
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getLast7Days() {
  const days = []

  const today = new Date()

  today.setHours(12, 0, 0, 0)

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)

    d.setDate(
      today.getDate() - i
    )

    days.push(
      getLocalDateString(d)
    )
  }

  return days
}

/*
 * PostgreSQL may return a date as:
 *
 * 2026-08-30
 *
 * or potentially:
 *
 * 2026-08-30T00:00:00.000Z
 *
 * We only need the calendar date.
 */
function normalizeDate(value) {
  if (!value) {
    return ''
  }

  if (typeof value === 'string') {
    return value.slice(0, 10)
  }

  return getLocalDateString(
    new Date(value)
  )
}

function shortDate(dateStr) {
  const d = new Date(
    `${dateStr}T12:00:00`
  )

  return d.toLocaleDateString(
    'en-GB',
    {
      weekday: 'short',
      day: 'numeric',
    }
  )
}

function getDotColor(value, field) {
  const idx =
    field.options.indexOf(
      value
    )

  if (idx === -1) {
    return '#ccd6e0'
  }

  const max =
    field.options.length - 1

  if (max === 0) {
    return '#1a7a3c'
  }

  const ratio =
    idx / max

  if (field.lowerIsBetter) {
    if (ratio <= 0.25) {
      return '#1a7a3c'
    }

    if (ratio <= 0.5) {
      return '#d4ac0d'
    }

    return '#922b21'
  }

  if (ratio >= 0.75) {
    return '#1a7a3c'
  }

  if (ratio >= 0.5) {
    return '#d4ac0d'
  }

  return '#922b21'
}

export default function Progress() {
  const navigate = useNavigate()

  const [entries, setEntries] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  useEffect(() => {
    let mounted = true

    async function loadProgress() {
      try {
        const data =
          await api.getTracking()

        if (!mounted) {
          return
        }

        const receivedEntries =
          Array.isArray(data.entries)
            ? data.entries
            : []

        setEntries(
          receivedEntries
        )
      } catch (err) {
        if (!mounted) {
          return
        }

        setError(
          err.message ||
          'Unable to load your progress.'
        )
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

  const last7 =
    getLast7Days()

  /*
   * Create a lookup table:
   *
   * {
   *   "2026-08-30": entry,
   *   "2026-08-29": entry,
   *   ...
   * }
   *
   * This uses entryDate from the backend.
   */
  const entryMap = {}

  entries.forEach((entry) => {
    const date =
      normalizeDate(
        entry.entryDate
      )

    if (date) {
      entryMap[date] =
        entry
    }
  })

  const trackedCount =
    last7.filter(
      (date) =>
        Boolean(
          entryMap[date]
        )
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
                  onClick={() =>
                    navigate(
                      '/signin',
                      {
                        replace: true,
                      }
                    )
                  }
                >
                  Sign In Again
                </button>
              </div>
            )}

            {/* Summary */}
            <div
              className="card card--compact mb-md"
              style={{
                background:
                  'var(--color-primary)',
                color: '#fff',
              }}
            >
              <p
                style={{
                  fontSize:
                    'var(--font-size-lg)',
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Last 7 Days
              </p>

              <p
                style={{
                  margin:
                    '6px 0 0',
                  opacity: 0.88,
                  fontSize:
                    'var(--font-size-sm)',
                }}
              >
                {trackedCount} of 7 days recorded
              </p>
            </div>

            {trackedCount === 0 && (
              <div className="alert alert--info mb-md">
                No entries yet for
                the last 7 days.
                Start tracking today
                to see your progress
                here.
              </div>
            )}

            {/* Metrics */}
            {FIELDS.map(
              (field) => (
                <div
                  key={field.id}
                  className="card card--compact mb-md"
                >
                  <div
                    style={{
                      display:
                        'flex',
                      alignItems:
                        'center',
                      gap: 10,
                      marginBottom:
                        16,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 28,
                      }}
                      aria-hidden="true"
                    >
                      {field.icon}
                    </span>

                    <span
                      style={{
                        fontWeight: 700,
                        fontSize:
                          'var(--font-size-base)',
                        color:
                          'var(--color-primary)',
                      }}
                    >
                      {field.label}
                    </span>
                  </div>

                  {/* Seven days */}
                  <div
                    style={{
                      display:
                        'flex',
                      gap: 6,
                      flexWrap:
                        'wrap',
                      marginBottom:
                        12,
                    }}
                  >
                    {last7.map(
                      (date) => {
                        const entry =
                          entryMap[
                            date
                          ]

                        const value =
                          entry?.[
                            field.id
                          ]

                        const color =
                          value
                            ? getDotColor(
                                value,
                                field
                              )
                            : '#e8edf2'

                        return (
                          <div
                            key={date}
                            style={{
                              textAlign:
                                'center',
                              flex: 1,
                              minWidth:
                                36,
                            }}
                          >
                            <div
                              title={
                                value
                                  ? `${shortDate(
                                      date
                                    )}: ${value}`
                                  : `${shortDate(
                                      date
                                    )}: Not recorded`
                              }
                              style={{
                                width:
                                  40,
                                height:
                                  40,
                                borderRadius:
                                  '50%',
                                background:
                                  color,
                                margin:
                                  '0 auto 5px',
                                display:
                                  'flex',
                                alignItems:
                                  'center',
                                justifyContent:
                                  'center',
                                border:
                                  '2px solid rgba(0,0,0,0.08)',
                              }}
                            >
                              {value && (
                                <span
                                  style={{
                                    fontSize:
                                      14,
                                    fontWeight:
                                      800,
                                    color:
                                      '#fff',
                                    lineHeight:
                                      1,
                                  }}
                                >
                                  {String(
                                    value
                                  ).length <=
                                  2
                                    ? value
                                    : String(
                                        value
                                      ).charAt(
                                        0
                                      )}
                                </span>
                              )}
                            </div>

                            <span
                              style={{
                                fontSize:
                                  16,
                                fontWeight:
                                  800,
                                color:
                                  'var(--color-text)',
                                display:
                                  'block',
                              }}
                            >
                              {shortDate(
                                date
                              ).split(
                                ' '
                              )[0]}
                            </span>
                          </div>
                        )
                      }
                    )}
                  </div>

                  {/* Legend */}
                  <div
                    style={{
                      display:
                        'flex',
                      gap: 16,
                      fontSize: 17,
                      fontWeight: 700,
                      color:
                        'var(--color-text)',
                      flexWrap:
                        'wrap',
                    }}
                  >
                    <span>
                      <span
                        style={{
                          color:
                            '#1a7a3c',
                          fontWeight:
                            700,
                        }}
                      >
                        ●
                      </span>{' '}
                      Good
                    </span>

                    <span>
                      <span
                        style={{
                          color:
                            '#d4ac0d',
                          fontWeight:
                            700,
                        }}
                      >
                        ●
                      </span>{' '}
                      Fair
                    </span>

                    <span>
                      <span
                        style={{
                          color:
                            '#922b21',
                          fontWeight:
                            700,
                        }}
                      >
                        ●
                      </span>{' '}
                      Needs work
                    </span>

                    <span>
                      <span
                        style={{
                          color:
                            '#e8edf2',
                          fontWeight:
                            700,
                          border:
                            '1px solid #ccc',
                          borderRadius:
                            '50%',
                          display:
                            'inline-block',
                          width: 16,
                          height: 16,
                        }}
                      />

                      {' '}Not recorded
                    </span>
                  </div>

                  {/* Objective category key — shown under every section */}
                  <CategoryKey fieldId={field.id} />
                </div>
              )
            )}

            {/* Notes */}
            {last7.some(
              (date) =>
                entryMap[date]
                  ?.notes
            ) && (
              <div className="card card--compact mb-md">
                <h3 className="mb-md">
                  📝 Your Notes This Week
                </h3>

                {last7
                  .filter(
                    (date) =>
                      entryMap[
                        date
                      ]?.notes
                  )
                  .map(
                    (date) => (
                      <div
                        key={date}
                        style={{
                          marginBottom:
                            16,
                          paddingBottom:
                            16,
                          borderBottom:
                            '1px solid var(--color-border)',
                        }}
                      >
                        <p
                          style={{
                            fontWeight:
                              700,
                            color:
                              'var(--color-primary)',
                            marginBottom:
                              4,
                          }}
                        >
                          {shortDate(
                            date
                          )}
                        </p>

                        <p
                          style={{
                            margin: 0,
                            color:
                              'var(--color-text-muted)',
                            fontSize:
                              'var(--font-size-sm)',
                          }}
                        >
                          {
                            entryMap[
                              date
                            ].notes
                          }
                        </p>
                      </div>
                    )
                  )}
              </div>
            )}

            {/* Reminder */}
            <div className="guide-tip">
              💡 Patterns matter
              more than single days.
              Keep recording daily
              for the best picture.
            </div>
          </>
        )}
      </main>
    </>
  )
}

