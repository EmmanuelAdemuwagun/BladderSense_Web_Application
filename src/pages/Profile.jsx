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

async function loadProfile() {
  try {
    const data = await api.getProfile()
    if (!mounted) return

    const profile = data.user || data

    setUser(profile)
    setPreferredName(profile.preferredName || '')
  } catch {
    if (mounted) {
      navigate('/', { replace: true })
    }
  } finally {
    if (mounted) {
      setLoading(false)
    }
  }
}

loadProfile()

return () => {
  mounted = false
}


}, [navigate])

if (loading) {
return ( <main className="page"> <div className="spinner" /> <p className="loading-text">Loading your profile…</p> </main>
)
}

if (!user) return null

const displayName =
user.preferredName?.trim() ||
user.firstName ||
'User'

const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`
.toUpperCase()

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
  setError(err.message || 'Unable to update your profile.')
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
<> <Header title="My Profile" backTo="/dashboard" />

  <main className="page">
    {/* Profile introduction */}
    <section className="card mt-md">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          paddingBottom: 20,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 64,
            height: 64,
            minWidth: 64,
            borderRadius: '50%',
            background: 'var(--color-primary)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.04em',
          }}
        >
          {initials || 'U'}
        </div>

        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: '0 0 4px',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)',
            }}
          >
            Welcome back
          </p>

          <h2
            style={{
              margin: 0,
              color: 'var(--color-primary)',
              fontSize: 'var(--font-size-xl)',
            }}
          >
            {displayName}
          </h2>

          <p
            style={{
              margin: '5px 0 0',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)',
              overflowWrap: 'anywhere',
            }}
          >
            {user.email}
          </p>
        </div>
      </div>

      {/* Personal information */}
      <div style={{ marginTop: 24 }}>
        <h3
          style={{
            margin: '0 0 6px',
            fontSize: 'var(--font-size-lg)',
          }}
        >
          Personal information
        </h3>

        <p
          style={{
            margin: '0 0 18px',
            color: 'var(--color-text-muted)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          These are the details associated with your BladderSense account.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          <div
            style={{
              padding: 14,
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              background: 'var(--color-background, #fff)',
            }}
          >
            <span
              className="form-label"
              style={{
                display: 'block',
                marginBottom: 6,
              }}
            >
              First Name
            </span>

            <strong
              style={{
                display: 'block',
                fontSize: 'var(--font-size-base)',
              }}
            >
              {user.firstName}
            </strong>
          </div>

          <div
            style={{
              padding: 14,
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              background: 'var(--color-background, #fff)',
            }}
          >
            <span
              className="form-label"
              style={{
                display: 'block',
                marginBottom: 6,
              }}
            >
              Last Name
            </span>

            <strong
              style={{
                display: 'block',
                fontSize: 'var(--font-size-base)',
              }}
            >
              {user.lastName}
            </strong>
          </div>

          <div
            style={{
              padding: 14,
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              background: 'var(--color-background, #fff)',
              gridColumn: '1 / -1',
            }}
          >
            <span
              className="form-label"
              style={{
                display: 'block',
                marginBottom: 6,
              }}
            >
              Email Address
            </span>

            <strong
              style={{
                display: 'block',
                fontSize: 'var(--font-size-base)',
                overflowWrap: 'anywhere',
              }}
            >
              {user.email}
            </strong>

            <span
              style={{
                display: 'inline-block',
                marginTop: 6,
                fontSize: 12,
                color: 'var(--color-text-muted)',
              }}
            >
              Used for signing in to BladderSense
            </span>
          </div>
        </div>
      </div>

      <hr className="divider" />

      {/* Preferred name */}
      <div>
        <h3
          style={{
            margin: '0 0 6px',
            fontSize: 'var(--font-size-lg)',
          }}
        >
          How should we call you?
        </h3>

        <p
          style={{
            margin: '0 0 18px',
            color: 'var(--color-text-muted)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          Your preferred name is what we will use when addressing you
          throughout the app. This is optional.
        </p>

        {success && (
          <div
            className="alert alert--success mb-md"
            role="alert"
          >
            Your preferred name has been updated successfully.
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

        <form onSubmit={handleSave} noValidate>
          <FormField
            label="Preferred Name"
            id="preferredName"
            hint="Leave this blank if you would rather be called by your first name."
          >
            <input
              id="preferredName"
              className="form-input"
              type="text"
              value={preferredName}
              onChange={(e) => {
                setPreferredName(e.target.value)
                setSuccess(false)
                setError('')
              }}
              autoCapitalize="words"
              autoComplete="nickname"
              placeholder={user.firstName || 'Enter a preferred name'}
              disabled={saving}
            />
          </FormField>

          <button
            type="submit"
            className="btn btn--primary"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Preferred Name'}
          </button>
        </form>
      </div>
    </section>

    {/* Account actions */}
    <section
      className="card card--compact mt-md"
      style={{
        border: '1px solid var(--color-border)',
      }}
    >
      <h3
        style={{
          margin: '0 0 6px',
          fontSize: 'var(--font-size-base)',
        }}
      >
        Account
      </h3>

      <p
        style={{
          margin: '0 0 14px',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        Finished for now? You can safely sign out of your account.
      </p>

      <button
        type="button"
        className="btn btn--secondary"
        onClick={handleLogout}
      >
        Sign Out
      </button>
    </section>

    <p
      style={{
        textAlign: 'center',
        margin: '20px 0',
        fontSize: 12,
        color: 'var(--color-text-muted)',
      }}
    >
      BladderSense · Your personal tracking space
    </p>
  </main>
</>

)
}
