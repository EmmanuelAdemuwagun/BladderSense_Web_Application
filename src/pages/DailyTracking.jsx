
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import { api } from '../utils/api'
import { CategoryKey } from '../content/categoryKey'
import { localDateString } from '../utils/date'

const TODAY = localDateString()

const FIELDS = [
  {
    id: 'nightTimeUrination',
    label: 'Night-time urination',
    sublabel: 'How many times did you get up?',
    options: ['0', '1', '2', '3+'],
  },
  {
    id: 'eveningFluids',
    label: 'Evening fluid intake',
    sublabel: 'How much did you drink after 6pm?',
    options: ['None', 'Small', 'Moderate', 'Large'],
  },
  {
    id: 'activityLevel',
    label: 'Activity level today',
    sublabel: 'How active were you?',
    options: ['None', 'Light', 'Moderate', 'High'],
  },
  {
    id: 'stressLevel',
    label: 'Stress level today',
    sublabel: '1 = very calm, 5 = very stressed',
    options: ['1', '2', '3', '4', '5'],
  },
  {
    id: 'sleepQuality',
    label: 'Sleep quality last night',
    sublabel: 'How well did you sleep?',
    options: ['Poor', 'Fair', 'Good'],
  },
]

function OptionGroup({
  fieldId,
  options,
  value,
  onChange,
  disabled,
}) {
  // Number answers (0–3+, 1–5) always sit on a single row
  const numeric = options.every((opt) => opt.length <= 2)

  return (
    <div
      className={`option-group${numeric ? ' option-group--row' : ''}`}
      style={
        numeric
          ? { gridTemplateColumns: `repeat(${options.length}, 1fr)` }
          : undefined
      }
      role="group"
    >
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`option-btn${
            value === opt ? ' option-btn--selected' : ''
          }`}
          onClick={() => {
            if (!disabled) {
              onChange(fieldId, opt)
            }
          }}
          aria-pressed={value === opt}
          disabled={disabled}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

// Today's answers once saved. A day's record can't be changed after saving.
function TodaySummary({ values, notes }) {
  return (
    <div className="card card--compact mb-md">
      <dl className="tracking-summary">
        {FIELDS.map((field) => (
          <div key={field.id} className="tracking-summary__row">
            <dt>{field.label}</dt>
            <dd>{values[field.id] || '—'}</dd>
          </div>
        ))}
      </dl>
      {notes && (
        <p className="tracking-summary__notes">
          <strong>Notes:</strong> {notes}
        </p>
      )}
    </div>
  )
}

/*
 * The API sends entryDate as a full timestamp
 * ("2026-10-27T00:00:00.000Z"), not "2026-10-27", so compare the date part.
 */
function isToday(entry) {
  return String(entry.entryDate).slice(0, 10) === TODAY
}

function entryToValues(entry) {
  return {
    nightTimeUrination: entry.nightTimeUrination || '',
    eveningFluids: entry.eveningFluids || '',
    activityLevel: entry.activityLevel || '',
    stressLevel: entry.stressLevel || '',
    sleepQuality: entry.sleepQuality || '',
  }
}

export default function DailyTracking() {
  const [values, setValues] = useState({})
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)

  const [error, setError] = useState('')
  // The question the user skipped when they last pressed Save
  const [missingId, setMissingId] = useState('')

  const [alreadyTracked, setAlreadyTracked] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadTracking() {
      try {
        const trackingData = await api.getTracking()

        if (!mounted) return

        const todayEntry = trackingData.entries?.find(
          isToday
        )

        if (todayEntry) {
          setValues(entryToValues(todayEntry))
          setNotes(todayEntry.notes || '')
          setAlreadyTracked(true)
        }
      } catch (err) {
        if (mounted) {
          setError(
            err.message || 'Unable to load your tracking data.'
          )
        }
      } finally {
        if (mounted) {
          setFetchLoading(false)
        }
      }
    }

    loadTracking()

    return () => {
      mounted = false
    }
  }, [])

  function handleChange(fieldId, val) {
    setValues((current) => ({
      ...current,
      [fieldId]: val,
    }))

    setError('')

    if (fieldId === missingId) {
      setMissingId('')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()

    setError('')

    const missingField = FIELDS.find(
      (field) => !values[field.id]
    )

    if (missingField) {
      // Take the user to the question they missed rather than
      // showing an error at the top of the page, out of sight.
      setMissingId(missingField.id)
      document
        .getElementById(`question-${missingField.id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setLoading(true)

    const payload = {
      entryDate: TODAY,
      nightTimeUrination: values.nightTimeUrination,
      eveningFluids: values.eveningFluids,
      activityLevel: values.activityLevel,
      stressLevel: values.stressLevel,
      sleepQuality: values.sleepQuality,
      notes: notes.trim(),
    }

    try {
      await api.saveTracking(payload)

      setAlreadyTracked(true)

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (err) {
      // Already saved today (e.g. on another device): show that record
      if (err.status === 409) {
        try {
          const data = await api.getTracking()
          const todayEntry = data.entries?.find(
            isToday
          )
          if (todayEntry) {
            setValues(entryToValues(todayEntry))
            setNotes(todayEntry.notes || '')
            setAlreadyTracked(true)
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
          }
        } catch {
          // Fall through to the error message below
        }
      }

      setError(
        err.message || 'Unable to save your tracking entry.'
      )

      // The error appears above the form, out of view of the Save button.
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } finally {
      setLoading(false)
    }
  }

  const todayFormatted = new Date().toLocaleDateString(
    'en-GB',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  )

  if (fetchLoading) {
    return (
      <main className="page">
        <div className="spinner" />
        <p className="loading-text">Loading…</p>
      </main>
    )
  }

  return (
    <>
      <Header
        title="Daily Tracking"
        backTo="/dashboard"
      />

      <main className="page">
        <p className="text-muted mb-md">
          {todayFormatted}
        </p>

        {error && (
          <div
            className="alert alert--error"
            role="alert"
          >
            {error}
          </div>
        )}

        {alreadyTracked ? (
          <>
            <div
              className="alert alert--success"
              role="status"
            >
              ✅ <strong>Today's record is saved.</strong>
              <br />
              You can add a new record tomorrow.
            </div>

            <TodaySummary values={values} notes={notes} />
          </>
        ) : (
          <>
            <div className="alert alert--info mb-md">
              This is not about perfection. It is about noticing
              patterns over time.
            </div>

            <form onSubmit={handleSubmit}>
              {FIELDS.map((field) => (
                <div
                  key={field.id}
                  id={`question-${field.id}`}
                  className={`card card--compact mb-md${
                    missingId === field.id ? ' card--missing' : ''
                  }`}
                >
                  <label className="tracking-label">
                    {field.label}
                  </label>

                  {missingId === field.id && (
                    <p className="tracking-missing" role="alert">
                      Please choose an answer for this question.
                    </p>
                  )}

                  <p
                    className="form-hint"
                    style={{ marginBottom: 12 }}
                  >
                    {field.sublabel}
                  </p>

                  <OptionGroup
                    fieldId={field.id}
                    options={field.options}
                    value={values[field.id] || ''}
                    onChange={handleChange}
                    disabled={loading}
                  />

                  {/* Objective category key — shown under every section */}
                  <CategoryKey fieldId={field.id} />
                </div>
              ))}

              <div className="card card--compact mb-md">
                <label
                  className="tracking-label"
                  htmlFor="notes"
                >
                  Notes for today (optional)
                </label>

                <p className="form-hint">
                  What did you try? What helped?
                </p>

                <textarea
                  id="notes"
                  className="form-input"
                  rows={4}
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value)
                    setError('')
                  }}
                  placeholder="e.g. Reduced fluids after 7pm. Went for a short walk."
                  style={{
                    minHeight: 100,
                    resize: 'vertical',
                  }}
                  disabled={loading}
                />
              </div>

              <p className="form-hint mb-md">
                Please check your answers. Once saved, today's record
                can't be changed.
              </p>

              <button
                type="submit"
                className="btn btn--primary"
                disabled={loading}
              >
                {loading ? 'Saving…' : "Save Today's Record"}
              </button>
            </form>
          </>
        )}

        <hr className="divider" />

        <Link
          to="/progress"
          className="btn btn--secondary"
        >
          📈 View My 7-Day Progress
        </Link>

        {alreadyTracked && (
          <Link
            to="/dashboard"
            className="btn btn--secondary mt-md"
          >
            Back to Dashboard
          </Link>
        )}
      </main>
    </>
  )
}
