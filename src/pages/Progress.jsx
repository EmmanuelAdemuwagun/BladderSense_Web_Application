
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { api } from '../utils/api'
import { CategoryKey } from '../content/categoryKey'
import ProgressChart from '../components/ProgressChart'
import PeriodSummary from '../components/PeriodSummary'
import { getSessionUser } from '../utils/auth'
import { downloadProgressReport } from '../utils/progressReport'
import {
  PROGRESS_FIELDS as FIELDS,
  longDate,
  shortDate,
} from '../content/progressFields'

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
 * Return the calendar dates for one period of `length` days (7 or 30).
 *
 * offset 0 = the period ending today
 * offset 1 = the period before that (ending `length` days ago)
 * offset 2 = the one before that, and so on.
 *
 * This lets the user step back through earlier periods while the
 * on-screen layout stays exactly the same.
 */
function getPeriodDays(length, offset = 0) {
  const days = []

  const today = new Date()

  today.setHours(12, 0, 0, 0)

  const anchor = length * offset

  for (let i = length - 1; i >= 0; i--) {
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

export default function Progress() {
  const navigate = useNavigate()

  const [entries, setEntries] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [downloading, setDownloading] =
    useState(false)

  const [downloadError, setDownloadError] =
    useState('')

  // Days per period: 7 (a week) or 30 (a month)
  const [period, setPeriod] =
    useState(7)

  // 0 = the period ending today; each increment steps one period further back.
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

  const periodDays =
    getPeriodDays(period, weekOffset)

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
    periodDays.filter(
      (date) =>
        Boolean(
          entryMap[date]
        )
    ).length

  const isCurrentWeek =
    weekOffset === 0

  const windowStart =
    periodDays[0]

  const windowEnd =
    periodDays[periodDays.length - 1]

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

  async function handleDownload() {
    setDownloading(true)
    setDownloadError('')

    try {
      await downloadProgressReport({
        days: periodDays,
        entryMap,
        user: getSessionUser(),
      })
    } catch {
      setDownloadError(
        'The report could not be created. Please try again.'
      )
    } finally {
      setDownloading(false)
    }
  }

  function choosePeriod(length) {
    setPeriod(length)
    setWeekOffset(0)
    setDownloadError('')
  }

  const isWeek =
    period === 7

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
        title={`My ${period}-Day Progress`}
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

            {/* 7 days or 30 days */}
            <div
              className="period-toggle mb-md"
              role="group"
              aria-label="Show progress for"
            >
              {[7, 30].map((length) => (
                <button
                  key={length}
                  type="button"
                  className={`period-toggle__btn${
                    period === length ? ' period-toggle__btn--active' : ''
                  }`}
                  aria-pressed={period === length}
                  onClick={() => choosePeriod(length)}
                >
                  {length} Days
                </button>
              ))}
            </div>

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
                  ? `Last ${period} Days`
                  : isWeek
                    ? 'Earlier Week'
                    : 'Earlier 30 Days'}
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
                {trackedCount} of {period} days recorded
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
                aria-label={isWeek ? 'Show the previous week' : 'Show the previous 30 days'}
                style={{
                  flex: 1,
                  minHeight: 54,
                  fontSize:
                    'var(--font-size-base)',
                }}
              >
                {isWeek ? '◀ Previous week' : '◀ Previous 30 days'}
              </button>

              <button
                type="button"
                className="btn btn--secondary"
                onClick={goNextWeek}
                disabled={isCurrentWeek}
                aria-label={isWeek ? 'Show the next week' : 'Show the next 30 days'}
                style={{
                  flex: 1,
                  minHeight: 54,
                  fontSize:
                    'var(--font-size-base)',
                }}
              >
                {isWeek ? 'Next week ▶' : 'Next 30 days ▶'}
              </button>
            </div>

            {trackedCount === 0 && (
              <div className="alert alert--info mb-md">
                {isCurrentWeek
                  ? `No entries yet for the last ${period} days. Start tracking today to see your progress here.`
                  : isWeek
                    ? 'No entries were recorded during this week.'
                    : 'No entries were recorded during these 30 days.'}
              </div>
            )}

            {/* PDF of the week on screen */}
            {trackedCount > 0 && (
              <div className="mb-md">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  {downloading
                    ? 'Creating report…'
                    : '📄 Download PDF Report'}
                </button>

                {downloadError && (
                  <div
                    className="alert alert--error mt-sm"
                    role="alert"
                  >
                    {downloadError}
                  </div>
                )}
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

                  {/* 30 days: a short summary above the chart */}
                  {!isWeek && (
                    <PeriodSummary
                      field={field}
                      days={periodDays}
                      entryMap={entryMap}
                    />
                  )}

                  <ProgressChart
                    field={field}
                    days={periodDays}
                    entryMap={entryMap}
                  />

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
            {periodDays.some(
              (date) =>
                entryMap[date]
                  ?.notes
            ) && (
              <div className="card card--compact mb-md">
                <h3 className="mb-md">
                  {isWeek
                    ? '📝 Your Notes This Week'
                    : '📝 Your Notes for These 30 Days'}
                </h3>

                {periodDays
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

