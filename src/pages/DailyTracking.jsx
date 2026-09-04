
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
        onClick={() => setOpen((o) => !o)}
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
              🌙 Night-time urination
            </p>
            <p>The number of times you got up to pass urine.</p>
            <p><strong>0</strong> = did not get up</p>
            <p><strong>1 / 2</strong> = got up once or twice</p>
            <p><strong>3+</strong> = got up three or more times</p>
          </div>

          <div className="ref-key__group">
            <p className="ref-key__heading">
              🥤 Evening fluid intake
            </p>
            <p>Roughly how much you drank in the evening.</p>
            <p><strong>Small</strong> = about 150–250 mL (½–1 cup)</p>
            <p><strong>Moderate</strong> = about 300–500 mL (1–2 cups)</p>
            <p><strong>Large</strong> = more than 500 mL (more than 2 cups)</p>
          </div>

          <div className="ref-key__group">
            <p className="ref-key__heading">
              🚶 Activity level
            </p>
            <p><strong>None</strong> = little or no movement</p>
            <p><strong>Light</strong> = short walks or light movement</p>
            <p><strong>Moderate</strong> = regular walking or active movement</p>
            <p><strong>High</strong> = longer periods of movement or exercise</p>
          </div>

          <div className="ref-key__group">
            <p className="ref-key__heading">
              🧠 Stress level
            </p>
            <p>How stressed you felt today, from 1 to 5.</p>
            <p><strong>1</strong> = very calm and relaxed</p>
            <p><strong>3</strong> = moderately stressed</p>
            <p><strong>5</strong> = very stressed</p>
          </div>

          <div className="ref-key__group">
            <p className="ref-key__heading">
              😴 Sleep quality
            </p>
            <p><strong>Poor</strong> = very disrupted sleep</p>
            <p><strong>Fair</strong> = some disruption but manageable</p>
            <p><strong>Good</strong> = mostly restful sleep</p>
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
    <div className="option-group" role="group">
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

export default function DailyTracking() {
  const navigate = useNavigate()

  const [values, setValues] = useState({})
  const [notes, setNotes] = useState('')
  const [entryId, setEntryId] = useState(null)

  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)

  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [alreadyTracked, setAlreadyTracked] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadTracking() {
      try {
        const trackingData = await api.getTracking()

        if (!mounted) return

        const todayEntry = trackingData.entries?.find(
          (entry) => entry.entryDate === TODAY
        )

        if (todayEntry) {
          setEntryId(todayEntry.id)

          setValues({
            nightTimeUrination: todayEntry.nightTimeUrination || '',
            eveningFluids: todayEntry.eveningFluids || '',
            activityLevel: todayEntry.activityLevel || '',
            stressLevel: todayEntry.stressLevel || '',
            sleepQuality: todayEntry.sleepQuality || '',
          })

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

    setSuccess(false)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()

    setError('')
    setSuccess(false)

    const missingField = FIELDS.find(
      (field) => !values[field.id]
    )

    if (missingField) {
      setError(
        `Please select an option for "${missingField.label}".`
      )
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
      if (alreadyTracked && entryId) {
        await api.updateTracking(entryId, payload)
      } else {
        const data = await api.saveTracking(payload)

        if (data.entry?.id) {
          setEntryId(data.entry.id)
        }

        setAlreadyTracked(true)
      }

      setSuccess(true)
      setEditing(false)

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (err) {
      setError(
        err.message || 'Unable to save your tracking entry.'
      )
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
            Today's record has been saved successfully.
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
            ✅ You have already recorded today's information.

            <br />

            <button
              type="button"
              className="btn btn--ghost mt-sm"
              style={{
                display: 'inline',
                padding: 0,
              }}
              onClick={() => {
                setEditing(true)
                setSuccess(false)
                setError('')
              }}
            >
              Tap here if you want to update today's entry
            </button>
          </div>
        )}

        {!alreadyTracked && (
          <div className="alert alert--info mb-md">
            This is not about perfection. It is about noticing
            patterns over time.
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
