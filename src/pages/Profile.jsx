// import { useState, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
// import Header from '../components/Header'
// import FormField from '../components/FormField'
// import { getSessionUser, getSessionToken, updateSessionUser, clearSession } from '../utils/auth'
// import { api } from '../utils/api'

// export default function Profile() {
//   const navigate = useNavigate()
//   const user = getSessionUser()
//   const sessionToken = getSessionToken()

//   const [preferredName, setPreferredName] = useState(user?.preferredName || '')
//   const [loading, setLoading] = useState(false)
//   const [success, setSuccess] = useState(false)
//   const [error, setError] = useState('')

//   useEffect(() => {
//     if (!user) navigate('/', { replace: true })
//   }, [user, navigate])

//   if (!user) return null

//   async function handleSave(e) {
//     e.preventDefault()
//     setError('')
//     setSuccess(false)
//     setLoading(true)
//     try {
//       await api.updateProfile({ preferredName: preferredName.trim() }, sessionToken)
//       updateSessionUser({ preferredName: preferredName.trim() })
//       setSuccess(true)
//     } catch (err) {
//       setError(err.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   function handleLogout() {
//     clearSession()
//     navigate('/', { replace: true })
//   }

//   return (
//     <>
//       <Header title="My Profile" backTo="/dashboard" />
//       <main className="page">
//         <div className="card mt-md">
//           <h2 className="mb-md">Your Details</h2>

//           <div className="form-group">
//             <span className="form-label">First Name</span>
//             <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, padding: '10px 0' }}>
//               {user.firstName}
//             </p>
//           </div>

//           <div className="form-group">
//             <span className="form-label">Last Name</span>
//             <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, padding: '10px 0' }}>
//               {user.lastName}
//             </p>
//           </div>

//           <div className="form-group">
//             <span className="form-label">Email</span>
//             <p style={{ fontSize: 'var(--font-size-base)', padding: '10px 0', color: 'var(--color-text-muted)' }}>
//               {user.email}
//             </p>
//           </div>

//           <hr className="divider" />

//           <h3 className="mb-md">Edit Preferred Name</h3>
//           <p className="mb-md" style={{ color: 'var(--color-text-muted)' }}>
//             This is how we greet you in the app.
//           </p>

//           {success && (
//             <div className="alert alert--success mb-md" role="alert">
//               Your preferred name has been updated.
//             </div>
//           )}
//           {error && (
//             <div className="alert alert--error mb-md" role="alert">
//               {error}
//             </div>
//           )}

//           <form onSubmit={handleSave}>
//             <FormField label="Preferred Name" id="preferredName" hint="Optional — leave blank to use your first name">
//               <input
//                 id="preferredName"
//                 className="form-input"
//                 type="text"
//                 value={preferredName}
//                 onChange={(e) => {
//                   setPreferredName(e.target.value)
//                   setSuccess(false)
//                 }}
//                 autoCapitalize="words"
//                 autoComplete="nickname"
//                 disabled={loading}
//               />
//             </FormField>
//             <button type="submit" className="btn btn--primary" disabled={loading}>
//               {loading ? 'Saving…' : 'Save Changes'}
//             </button>
//           </form>

//           <hr className="divider" />
//           <button className="btn btn--secondary" onClick={handleLogout}>
//             Sign Out
//           </button>
//         </div>
//       </main>
//     </>
//   )
// }

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import FormField from '../components/FormField'
import { api } from '../utils/api'

export default function Profile() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferredName, setPreferredName] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    api.getProfile()
      .then((data) => {
        if (!mounted) return

        const profile = data.user || data

        setUser(profile)
        setPreferredName(profile.preferredName || '')
      })
      .catch(() => {
        if (mounted) {
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

  if (loading) {
    return (
      <main className="page">
        <div className="spinner" />
        <p className="loading-text">Loading…</p>
      </main>
    )
  }

  if (!user) return null

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)

    const updatedPreferredName = preferredName.trim()

    try {
      const data = await api.updateProfile({
        preferredName: updatedPreferredName,
      })

      const updatedUser = data.user || {
        ...user,
        preferredName: updatedPreferredName,
      }

      setUser(updatedUser)
      setPreferredName(updatedUser.preferredName || '')
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    try {
      await api.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      navigate('/', { replace: true })
    }
  }

  return (
    <>
      <Header title="My Profile" backTo="/dashboard" />

      <main className="page">
        <div className="card mt-md">
          <h2 className="mb-md">Your Details</h2>

          <div className="form-group">
            <span className="form-label">First Name</span>
            <p
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 600,
                padding: '10px 0',
              }}
            >
              {user.firstName}
            </p>
          </div>

          <div className="form-group">
            <span className="form-label">Last Name</span>
            <p
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 600,
                padding: '10px 0',
              }}
            >
              {user.lastName}
            </p>
          </div>

          <div className="form-group">
            <span className="form-label">Email</span>
            <p
              style={{
                fontSize: 'var(--font-size-base)',
                padding: '10px 0',
                color: 'var(--color-text-muted)',
              }}
            >
              {user.email}
            </p>
          </div>

          <hr className="divider" />

          <h3 className="mb-md">Edit Preferred Name</h3>

          <p
            className="mb-md"
            style={{ color: 'var(--color-text-muted)' }}
          >
            This is how we greet you in the app.
          </p>

          {success && (
            <div
              className="alert alert--success mb-md"
              role="alert"
            >
              Your preferred name has been updated.
            </div>
          )}

          {error && (
            <div
              className="alert alert--error mb-md"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSave}>
            <FormField
              label="Preferred Name"
              id="preferredName"
              hint="Optional — leave blank to use your first name"
            >
              <input
                id="preferredName"
                className="form-input"
                type="text"
                value={preferredName}
                onChange={(e) => {
                  setPreferredName(e.target.value)
                  setSuccess(false)
                }}
                autoCapitalize="words"
                autoComplete="nickname"
                disabled={saving}
              />
            </FormField>

            <button
              type="submit"
              className="btn btn--primary"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>

          <hr className="divider" />

          <button
            className="btn btn--secondary"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </main>
    </>
  )
}

