// import { useState, useEffect, useRef } from 'react'
// import { useNavigate, Link } from 'react-router-dom'
// import Header from '../components/Header'
// import { getSessionUser, getSessionToken } from '../utils/auth'
// import { api } from '../utils/api'

// const TODAY = new Date().toISOString().split('T')[0]

// const FIELDS = [
//   { id: 'nightTimeUrination', label: 'Night-time urination', sublabel: 'How many times did you get up?', options: ['0', '1', '2', '3+'] },
//   { id: 'eveningFluids', label: 'Evening fluid intake', sublabel: 'How much did you drink after 6pm?', options: ['None', 'Small', 'Moderate', 'Large'] },
//   { id: 'activityLevel', label: 'Activity level today', sublabel: 'How active were you?', options: ['None', 'Light', 'Moderate', 'High'] },
//   { id: 'stressLevel', label: 'Stress level today', sublabel: '1 = very calm, 5 = very stressed', options: ['1', '2', '3', '4', '5'] },
//   { id: 'sleepQuality', label: 'Sleep quality last night', sublabel: 'How well did you sleep?', options: ['Poor', 'Fair', 'Good'] },
// ]

// function ReferenceKey() {
//   const [open, setOpen] = useState(false)
//   return (
//     <div className="ref-key mb-md">
//       <button
//         type="button"
//         className="ref-key__toggle"
//         onClick={() => setOpen((o) => !o)}
//         aria-expanded={open}
//       >
//         <span>📖 Guide to categories</span>
//         <span className="ref-key__arrow">{open ? '▲' : '▼'}</span>
//       </button>
//       {open && (
//         <div className="ref-key__body">
//           <div className="ref-key__group">
//             <p className="ref-key__heading">🥤 Evening fluid intake</p>
//             <p><strong>Small</strong> = 1 small drink</p>
//             <p><strong>Moderate</strong> = 2–3 drinks</p>
//             <p><strong>Large</strong> = several drinks or larger amounts in the evening</p>
//           </div>
//           <div className="ref-key__group">
//             <p className="ref-key__heading">🚶 Physical activity</p>
//             <p><strong>Light</strong> = short walks or light movement</p>
//             <p><strong>Moderate</strong> = regular walking or active movement</p>
//             <p><strong>Higher</strong> = longer periods of movement or exercise</p>
//           </div>
//           <div className="ref-key__group">
//             <p className="ref-key__heading">😴 Sleep quality</p>
//             <p><strong>Poor</strong> = very disrupted sleep</p>
//             <p><strong>Fair</strong> = some disruption but manageable</p>
//             <p><strong>Good</strong> = mostly restful sleep</p>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// function OptionGroup({ fieldId, options, value, onChange, disabled }) {
//   return (
//     <div className="option-group" role="group">
//       {options.map((opt) => (
//         <button
//           key={opt}
//           type="button"
//           className={`option-btn${value === opt ? ' option-btn--selected' : ''}`}
//           onClick={() => !disabled && onChange(fieldId, opt)}
//           aria-pressed={value === opt}
//           disabled={disabled}
//         >
//           {opt}
//         </button>
//       ))}
//     </div>
//   )
// }

// export default function DailyTracking() {
//   const navigate = useNavigate()
//   const user = getSessionUser()
//   const sessionToken = getSessionToken()

//   const [values, setValues] = useState({})
//   const [notes, setNotes] = useState('')
//   const [loading, setLoading] = useState(false)
//   const [fetchLoading, setFetchLoading] = useState(true)
//   const [success, setSuccess] = useState(false)
//   const [alreadyTracked, setAlreadyTracked] = useState(false)
//   const [editing, setEditing] = useState(false)
//   const [error, setError] = useState('')

//   useEffect(() => {
//     if (!user) { navigate('/', { replace: true }); return }
//     api.getTracking(sessionToken)
//       .then((data) => {
//         const todayEntry = data.entries?.find((e) => e.date === TODAY)
//         if (todayEntry) {
//           setValues(todayEntry.values || {})
//           setNotes(todayEntry.notes || '')
//           setAlreadyTracked(true)
//         }
//       })
//       .catch(() => {})
//       .finally(() => setFetchLoading(false))
//   }, [user, navigate, sessionToken])

//   if (!user) return null

//   function handleChange(fieldId, val) {
//     setValues((v) => ({ ...v, [fieldId]: val }))
//     setSuccess(false)
//   }

//   async function handleSubmit(e) {
//     e.preventDefault()
//     setError('')
//     setLoading(true)
//     try {
//       await api.saveTracking({ date: TODAY, values, notes }, sessionToken)
//       setSuccess(true)
//       setAlreadyTracked(true)
//       setEditing(false)
//       window.scrollTo({ top: 0, behavior: 'smooth' })
//     } catch (err) {
//       setError(err.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const todayFormatted = new Date().toLocaleDateString('en-GB', {
//     weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
//   })

//   const isReadOnly = alreadyTracked && !editing

//   return (
//     <>
//       <Header title="Daily Tracking" backTo="/dashboard" />
//       <main className="page">
//         <p className="text-muted mb-md">{todayFormatted}</p>

//         {fetchLoading ? (
//           <><div className="spinner" /><p className="loading-text">Loading…</p></>
//         ) : (
//           <>
//             {success && (
//               <div className="alert alert--success" role="alert">
//                 Today's record saved. Well done!
//               </div>
//             )}
//             {error && (
//               <div className="alert alert--error" role="alert">{error}</div>
//             )}

//             {alreadyTracked && !editing && (
//               <div className="alert alert--info mb-md">
//                 ✅ You have already recorded today. <br />
//                 <button className="btn btn--ghost mt-sm" style={{ display: 'inline', padding: 0 }} onClick={() => setEditing(true)}>
//                   Tap here to update today's entry
//                 </button>
//               </div>
//             )}

//             {!alreadyTracked && (
//               <div className="alert alert--info mb-md">
//                 This is not about perfection. It is about noticing patterns over time.
//               </div>
//             )}

//             <form onSubmit={handleSubmit}>
//               <ReferenceKey />
//               {FIELDS.map((field) => (
//                 <div key={field.id} className="card card--compact mb-md">
//                   <label className="tracking-label">{field.label}</label>
//                   <p className="form-hint" style={{ marginBottom: 12 }}>{field.sublabel}</p>
//                   <OptionGroup
//                     fieldId={field.id}
//                     options={field.options}
//                     value={values[field.id] || ''}
//                     onChange={handleChange}
//                     disabled={isReadOnly}
//                   />
//                 </div>
//               ))}

//               <div className="card card--compact mb-md">
//                 <label className="tracking-label" htmlFor="notes">Notes for today (optional)</label>
//                 <p className="form-hint">What did you try? What helped?</p>
//                 <textarea
//                   id="notes"
//                   className="form-input"
//                   rows={4}
//                   value={notes}
//                   onChange={(e) => setNotes(e.target.value)}
//                   placeholder="e.g. Reduced fluids after 7pm. Went for a short walk."
//                   style={{ minHeight: 100, resize: 'vertical' }}
//                   disabled={isReadOnly || loading}
//                   readOnly={isReadOnly}
//                 />
//               </div>

//               {!isReadOnly && (
//                 <button type="submit" className="btn btn--primary" disabled={loading}>
//                   {loading ? 'Saving…' : alreadyTracked ? 'Update Today\'s Record' : 'Save Today\'s Record'}
//                 </button>
//               )}

//               {editing && (
//                 <button type="button" className="btn btn--secondary mt-md" onClick={() => setEditing(false)}>
//                   Cancel
//                 </button>
//               )}
//             </form>

//             <hr className="divider" />
//             <Link to="/progress" className="btn btn--secondary">
//               📊 View My 7-Day Progress
//             </Link>
//           </>
//         )}
//       </main>
//     </>
//   )
// }

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
        <span className="ref-key__arrow">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="ref-key__body">
          <div className="ref-key__group">
            <p className="ref-key__heading">🥤 Evening fluid intake</p>
            <p><strong>Small</strong> = 1 small drink</p>
            <p><strong>Moderate</strong> = 2–3 drinks</p>
            <p><strong>Large</strong> = several drinks or larger amounts in the evening</p>
          </div>

          <div className="ref-key__group">
            <p className="ref-key__heading">🚶 Physical activity</p>
            <p><strong>Light</strong> = short walks or light movement</p>
            <p><strong>Moderate</strong> = regular walking or active movement</p>
            <p><strong>Higher</strong> = longer periods of movement or exercise</p>
          </div>

          <div className="ref-key__group">
            <p className="ref-key__heading">😴 Sleep quality</p>
            <p><strong>Poor</strong> = very disrupted sleep</p>
            <p><strong>Fair</strong> = some disruption but manageable</p>
            <p><strong>Good</strong> = mostly restful sleep</p>
          </div>
        </div>
      )}
    </div>
  )
}

function OptionGroup({ fieldId, options, value, onChange, disabled }) {
  return (
    <div className="option-group" role="group">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`option-btn${value === opt ? ' option-btn--selected' : ''}`}
          onClick={() => !disabled && onChange(fieldId, opt)}
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

  const [user, setUser] = useState(null)
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

    async function loadData() {
      try {
        const profileData = await api.getProfile()

        if (!mounted) return

        setUser(profileData.user || profileData)

        const trackingData = await api.getTracking()

        if (!mounted) return

        const todayEntry = trackingData.entries?.find(
          (entry) => entry.date === TODAY
        )

        if (todayEntry) {
          setValues(todayEntry.values || {})
          setNotes(todayEntry.notes || '')
          setAlreadyTracked(true)
        }
      } catch (err) {
        if (mounted) {
          navigate('/', { replace: true })
        }
      } finally {
        if (mounted) {
          setFetchLoading(false)
        }
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [navigate])

  if (fetchLoading) {
    return (
      <main className="page">
        <div className="spinner" />
        <p className="loading-text">Loading…</p>
      </main>
    )
  }

  if (!user) return null

  function handleChange(fieldId, val) {
    setValues((v) => ({ ...v, [fieldId]: val }))
    setSuccess(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.saveTracking({
        date: TODAY,
        values,
        notes,
      })

      setSuccess(true)
      setAlreadyTracked(true)
      setEditing(false)

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const isReadOnly = alreadyTracked && !editing

  return (
    <>
      <Header title="Daily Tracking" backTo="/dashboard" />

      <main className="page">
        <p className="text-muted mb-md">{todayFormatted}</p>

        {success && (
          <div className="alert alert--success" role="alert">
            Today's record saved. Well done!
          </div>
        )}

        {error && (
          <div className="alert alert--error" role="alert">
            {error}
          </div>
        )}

        {alreadyTracked && !editing && (
          <div className="alert alert--info mb-md">
            ✅ You have already recorded today. <br />

            <button
              className="btn btn--ghost mt-sm"
              style={{
                display: 'inline',
                padding: 0,
              }}
              onClick={() => setEditing(true)}
            >
              Tap here to update today's entry
            </button>
          </div>
        )}

        {!alreadyTracked && (
          <div className="alert alert--info mb-md">
            This is not about perfection. It is about noticing patterns over time.
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
                disabled={isReadOnly}
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
              onChange={(e) => setNotes(e.target.value)}
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
              onClick={() => setEditing(false)}
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

