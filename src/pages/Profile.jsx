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
    return (
      <main className="page">
        <div className="spinner" />
        <p className="loading-text">Loading your profile…</p>
      </main>
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
    <>
      <Header title="My Profile" backTo="/dashboard" />

      <main className="page profile-page">
        {/* Profile introduction */}
        <section className="card mt-md profile-card">
          <div className="profile-intro">
            <div
              className="profile-avatar"
              aria-hidden="true"
            >
              {initials || 'U'}
            </div>

            <div className="profile-intro__content">
              <p className="profile-intro__welcome">
                Welcome back
              </p>

              <h2 className="profile-intro__name">
                {displayName}
              </h2>

              <p className="profile-intro__email">
                {user.email}
              </p>
            </div>
          </div>

          {/* Personal information */}
          <div className="profile-section">
            <h3>Personal information</h3>

            <p className="profile-section__description">
              These are the details associated with your
              BladderSense account.
            </p>

            <div className="profile-info-grid">
              <div className="profile-info-card">
                <span className="form-label">
                  First Name
                </span>

                <strong className="profile-info-value">
                  {user.firstName}
                </strong>
              </div>

              <div className="profile-info-card">
                <span className="form-label">
                  Last Name
                </span>

                <strong className="profile-info-value">
                  {user.lastName}
                </strong>
              </div>

              <div className="profile-info-card profile-info-card--email">
                <span className="form-label">
                  Email Address
                </span>

                <strong className="profile-info-value profile-info-value--email">
                  {user.email}
                </strong>

                <span className="profile-info-note">
                  Used for signing in to BladderSense
                </span>
              </div>
            </div>
          </div>

          <hr className="divider" />

          {/* Preferred name */}
          <div className="profile-section profile-section--preferred-name">
            <h3>How should we call you?</h3>

            <p className="profile-section__description">
              Your preferred name is what we will use when
              addressing you throughout the app. This is optional.
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
                  placeholder={
                    user.firstName || 'Enter a preferred name'
                  }
                  disabled={saving}
                />
              </FormField>

              <button
                type="submit"
                className="btn btn--primary"
                disabled={saving}
              >
                {saving
                  ? 'Saving…'
                  : 'Save Preferred Name'}
              </button>
            </form>
          </div>
        </section>

        {/* Account actions */}
        <section className="card card--compact mt-md profile-account-card">
          <h3>Account</h3>

          <p className="profile-section__description">
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

        <p className="profile-footer">
          BladderSense · Your personal tracking space
        </p>
      </main>
    </>
  )
}

