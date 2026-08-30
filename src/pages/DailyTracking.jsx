
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Header from '../components/Header'
import { api } from '../utils/api'

const TODAY = new Date().toISOString().split('T')[0]

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

function ReferenceKey() {
  const [open, setOpen] = useState(false)

  return (
    <div className="ref-key mb-md">
      <button
        type="button"
        className="ref-key__toggle"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span>📖 Guide to categories</span>

        <span className="ref-key__arrow">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className="ref-key__body">
          <div className="ref-key__group">
            <p className="ref-key__heading">
              🥤 Evening fluid intake
            </p>

            <p><strong>Small</strong> = 1 small drink</p>
            <p><strong>Moderate</strong> = 2–3 drinks</p>
            <p>
              <strong>Large</strong> = several drinks or larger amounts
              in the evening
            </p>
          </div>

          <div className="ref-key__group">
            <p className="ref-key__heading">
              🚶 Physical activity
            </p>

            <p>
              <strong>Light</strong> = short walks or light movement
            </p>

            <p>
              <strong>Moderate</strong> = regular walking or active movement
            </p>

            <p>
              <strong>High</strong> = longer periods of movement or exercise
            </p>
          </div>

          <div className="ref-key__group">
            <p className="ref-key__heading">
              😴 Sleep quality
            </p>

            <p>
              <strong>Poor</strong> = very disrupted sleep
            </p>

            <p>
              <strong>Fair</strong> = some disruption but manageable
            </p>

            <p>
              <strong>Good</strong> = mostly restful sleep
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function OptionGroup({
  fieldId,
  options,
  value,
  onChange,
  disabled,
}) {
  return (
    <div
      className="option-group"
      role="group"
      aria-label={fieldId}
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`option-btn${
            value === option ? ' option-btn--selected' : ''
          }`}
          onClick={() => {
            if (!disabled) {
              onChange(fieldId, option)
            }
          }}
          aria-pressed={value === option}
          disabled={disabled}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

export default function DailyTracking() {
  const navigate = useNavigate()

  const [values, setValues] = useState({})
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)

  const [success, setSuccess] = useState(false)
  const [alreadyTracked, setAlreadyTracked] = useState(false)
  const [editing, setEditing] = useState(false)

  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadTracking() {
      try {
        const trackingData = await api.getTracking()

        if (!mounted) return

        const todayEntry = (trackingData.entries || []).find(
          (entry) => {
            const entryDate = String(entry.entryDate).split('T')[0]
            return entryDate === TODAY
          }
        )

        if (todayEntry) {
          setValues({
            nightTimeUrination:
              todayEntry.nightTimeUrination || '',

            eveningFluids:
              todayEntry.eveningFluids || '',

            activityLevel:
              todayEntry.activityLevel || '',

            stressLevel:
              todayEntry.stressLevel || '',

            sleepQuality:
              todayEntry.sleepQuality || '',
          })

          setNotes(todayEntry.notes || '')
          setAlreadyTracked(true)
        }
      } catch (err) {
        if (!mounted) return

        /*
         * If the session has expired, send the user back
         * to the sign-in page rather than silently sending
         * them to the landing page.
         */
        navigate('/signin', { replace: true })
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
  }, [navigate])

  function handleChange(fieldId, value) {
    setValues((current) => ({
      ...current,
      [fieldId]: value,
    }))

    setSuccess(false)
    setError('')
  }

  function validateBeforeSubmit() {
    const requiredFields = [
      'nightTimeUrination',
      'eveningFluids',
      'activityLevel',
      'stressLevel',
      'sleepQuality',
    ]

    const missingField = requiredFields.find(
      (field) => !values[field]
    )

    if (missingField) {
      const field = FIELDS.find(
        (item) => item.id === missingField
      )

      return `Please select an option for "${field.label}".`
    }

    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()

    setError('')
    setSuccess(false)

    const validationError = validateBeforeSubmit()

    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      /*
       * IMPORTANT:
       * The backend expects these fields at the top level.
       * Do not send { date, values } here.
       */
      const payload = {
        entryDate: TODAY,
        nightTimeUrination: values.nightTimeUrination,
        eveningFluids: values.eveningFluids,
        activityLevel: values.activityLevel,
        stressLevel: values.stressLevel,
        sleepQuality: values.sleepQuality,
        notes: notes.trim() || null,
      }

      let result

      if (alreadyTracked) {
        /*
         * The current backend exposes PUT /api/tracking/:id.
         * We need the existing entry ID to update it.
         */
        const trackingData = await api.getTracking()

        const todayEntry = (trackingData.entries || []).find(
          (entry) =>
            String(entry.entryDate).split('T')[0] === TODAY
        )

        if (!todayEntry) {
          throw new Error(
            "Today's record could not be found. Please refresh the page and try again."
          )
        }

        result = await api.updateTracking(
          todayEntry.id,
          {
            nightTimeUrination: values.nightTimeUrination,
            eveningFluids: values.eveningFluids,
            activityLevel: values.activityLevel,
            stressLevel: values.stressLevel,
            sleepQuality: values.sleepQuality,
            notes: notes.trim() || null,
          }
        )
      } else {
        result = await api.saveTracking(payload)
      }

      /*
       * If the API returns the saved entry, use it to
       * synchronize the UI with the database.
       */
      if (result?.entry) {
        const savedEntry = result.entry

        setValues({
          nightTimeUrination:
            savedEntry.nightTimeUrination || '',

          eveningFluids:
            savedEntry.eveningFluids || '',

          activityLevel:
            savedEntry.activityLevel || '',

          stressLevel:
            savedEntry.stressLevel || '',

          sleepQuality:
            savedEntry.sleepQuality || '',
        })

        setNotes(savedEntry.notes || '')
      }

      setSuccess(true)
      setAlreadyTracked(true)
      setEditing(false)

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (err) {
      /*
       * api.js should expose the backend's error message.
       * If validation fields are returned, show them too.
       */
      let message = err.message || 'Unable to save today’s record.'

      if (err.fields && typeof err.fields === 'object') {
        const fieldMessages = Object.values(err.fields)

        if (fieldMessages.length > 0) {
          message = fieldMessages.join(' ')
        }
      }

      setError(message)
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

  const isReadOnly = alreadyTracked && !editing

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

        {success && (
          <div
            className="alert alert--success"
            role="alert"
          >
            {alreadyTracked && !editing
              ? "Today's record has been saved successfully."
              : "Today's record has been saved successfully."}
          </div>
        )}

        {error && (
          <div
            className="alert alert--error"
            role="alert"
          >
            {error}
          </div>
        )}

        {alreadyTracked && !editing && (
          <div className="alert alert--info mb-md">
            <strong>Today's tracking is already recorded.</strong>
            <br />

            <button
              type="button"
              className="btn btn--ghost mt-sm"
              onClick={() => {
                setEditing(true)
                setSuccess(false)
                setError('')
              }}
            >
              Update today's entry
            </button>
          </div>
        )}

        {!alreadyTracked && (
          <div className="alert alert--info mb-md">
            This is not about perfection. It is about noticing
            patterns over time.
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <ReferenceKey />

          {FIELDS.map((field) => (
            <div
              key={field.id}
              className="card card--compact mb-md"
            >
              <label className="tracking-label">
                {field.label}
              </label>

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
                disabled={isReadOnly || loading}
              />
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
                setSuccess(false)
                setError('')
              }}
              placeholder="e.g. Reduced fluids after 7pm. Went for a short walk."
              style={{
                minHeight: 100,
                resize: 'vertical',
              }}
              disabled={isReadOnly || loading}
              readOnly={isReadOnly}
            />
          </div>

          {!isReadOnly && (
            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading}
            >
              {loading
                ? 'Saving…'
                : alreadyTracked
                  ? "Update Today's Record"
                  : "Save Today's Record"}
            </button>
          )}

          {editing && (
            <button
              type="button"
              className="btn btn--secondary mt-md"
              onClick={() => {
                setEditing(false)
                setError('')
              }}
            >
              Cancel
            </button>
          )}
        </form>

        <hr className="divider" />

        <Link
          to="/progress"
          className="btn btn--secondary"
        >
          📊 View My 7-Day Progress
        </Link>
      </main>
    </>
  )
}

