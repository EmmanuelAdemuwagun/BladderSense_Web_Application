
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

/*
 * Return the 7 calendar dates for a given week.
 *
 * weekOffset 0 = the current week (ending today)
 * weekOffset 1 = the previous week (ending 7 days ago)
 * weekOffset 2 = two weeks ago, and so on.
 *
 * This lets the user step back through earlier weeks while the
 * on-screen layout stays exactly the same (always 7 days).
 */
function getWeekDays(weekOffset = 0) {
  const days = []

  const today = new Date()

  today.setHours(12, 0, 0, 0)

  const anchor = 7 * weekOffset

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)

    d.setDate(
      today.getDate() - anchor - i
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

/*
 * "12 May" style label used for the week range caption, so the
 * user always knows exactly which dates they are looking at.
 */
function longDate(dateStr) {
  const d = new Date(
    `${dateStr}T12:00:00`
  )

  return d.toLocaleDateString(
    'en-GB',
    {
      day: 'numeric',
      month: 'long',
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

  // 0 = current week; each increment steps one week further back.
  const [weekOffset, setWeekOffset] =
    useState(0)

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
    getWeekDays(weekOffset)

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

  const isCurrentWeek =
    weekOffset === 0

  const windowStart =
    last7[0]

  const windowEnd =
    last7[last7.length - 1]

  // Enable "Previous week" only while there is still older data to show.
  const hasOlderData =
    entries.some(
      (entry) =>
        normalizeDate(
          entry.entryDate
        ) < windowStart
    )

  const rangeLabel =
    `${longDate(windowStart)} – ${longDate(windowEnd)}`

  function goPreviousWeek() {
    setWeekOffset(
      (offset) => offset + 1
    )
  }

  function goNextWeek() {
    setWeekOffset(
      (offset) =>
        Math.max(0, offset - 1)
    )
  }

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
                {isCurrentWeek
                  ? 'Last 7 Days'
                  : 'Earlier Week'}
              </p>

              <p
                style={{
                  margin:
                    '6px 0 0',
                  fontSize:
                    'var(--font-size-base)',
                  fontWeight: 600,
                }}
              >
                {rangeLabel}
              </p>

              <p
                style={{
                  margin:
                    '4px 0 0',
                  opacity: 0.88,
                  fontSize:
                    'var(--font-size-sm)',
                }}
              >
                {trackedCount} of 7 days recorded
              </p>
            </div>

            {/* Week navigation — step back through earlier weeks */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginBottom:
                  'var(--space-md, 16px)',
              }}
            >
              <button
                type="button"
                className="btn btn--secondary"
                onClick={goPreviousWeek}
                disabled={!hasOlderData}
                aria-label="Show the previous week"
                style={{
                  flex: 1,
                  minHeight: 54,
                  fontSize:
                    'var(--font-size-base)',
                }}
              >
                ◀ Previous week
              </button>

              <button
                type="button"
                className="btn btn--secondary"
                onClick={goNextWeek}
                disabled={isCurrentWeek}
                aria-label="Show the next week"
                style={{
                  flex: 1,
                  minHeight: 54,
                  fontSize:
                    'var(--font-size-base)',
                }}
              >
                Next week ▶
              </button>
            </div>

            {trackedCount === 0 && (
              <div className="alert alert--info mb-md">
                {isCurrentWeek
                  ? 'No entries yet for the last 7 days. Start tracking today to see your progress here.'
                  : 'No entries were recorded during this week.'}
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
                          background:
                            '#1a7a3c',
                          border:
                            '1px solid #ccc',
                          borderRadius:
                            '50%',
                          display:
                            'inline-block',
                          verticalAlign:
                            'middle',
                          width: 16,
                          height: 16,
                        }}
                      />{' '}
                      Good
                    </span>

                    <span>
                      <span
                        style={{
                          background:
                            '#d4ac0d',
                          border:
                            '1px solid #ccc',
                          borderRadius:
                            '50%',
                          display:
                            'inline-block',
                          verticalAlign:
                            'middle',
                          width: 16,
                          height: 16,
                        }}
                      />{' '}
                      Fair
                    </span>

                    <span>
                      <span
                        style={{
                          background:
                            '#922b21',
                          border:
                            '1px solid #ccc',
                          borderRadius:
                            '50%',
                          display:
                            'inline-block',
                          verticalAlign:
                            'middle',
                          width: 16,
                          height: 16,
                        }}
                      />{' '}
                      Needs work
                    </span>

                    <span>
                      <span
                        style={{
                          background:
                            '#e8edf2',
                          border:
                            '1px solid #ccc',
                          borderRadius:
                            '50%',
                          display:
                            'inline-block',
                          verticalAlign:
                            'middle',
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

