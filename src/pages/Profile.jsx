import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import FormField from '../components/FormField'
import Email from '../components/Email'
import { api } from '../utils/api'
import { clearSession } from '../utils/auth'
import { TEXT_SIZES, getTextSize, setTextSize } from '../utils/textSize'

export default function Profile() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferredName, setPreferredName] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [textSize, setTextSizeState] = useState(getTextSize)
  const location = useLocation()

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

  // "Make text bigger" links land here; jump to that setting once shown
  useEffect(() => {
    if (!loading && location.hash === '#text-size') {
      document.getElementById('text-size')?.scrollIntoView({ block: 'start' })
    }
  }, [loading, location.hash])

  function chooseTextSize(size) {
    setTextSize(size)
    setTextSizeState(size)
  }

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
    clearSession()
    navigate('/', { replace: true })
  }
}

async function handleDeleteAccount() {
  setDeleteError('')
  setDeleting(true)

  try {
    await api.deleteAccount()

    clearSession()
    navigate('/', { replace: true })
  } catch (err) {
    setDeleteError(
      err?.message ||
        'We could not delete your account. Please try again.'
    )
    setDeleting(false)
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
            </div>

            {/* Full width under the avatar so a long address has room */}
            <p className="profile-intro__email">
              <Email>{user.email}</Email>
            </p>
          </div>

          {/* Personal information */}
          <div className="profile-section">
            <h3>Personal information</h3>

            <p className="profile-section__description">
              These are the details associated with your
              BladderSense account.
            </p>

            <dl className="info-list">
              <div className="info-list__row">
                <dt className="info-list__label">First name</dt>
                <dd className="info-list__value">{user.firstName}</dd>
              </div>

              <div className="info-list__row">
                <dt className="info-list__label">Last name</dt>
                <dd className="info-list__value">{user.lastName}</dd>
              </div>

              <div className="info-list__row">
                <dt className="info-list__label">Email address</dt>
                <dd className="info-list__value">
                  <Email>{user.email}</Email>
                </dd>
              </div>
            </dl>
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

        {/* Text size */}
        <section
          id="text-size"
          className="card card--compact mt-md"
          aria-labelledby="text-size-title"
        >
          <h3 id="text-size-title">Text size</h3>

          <p className="profile-section__description">
            Choose the size that is most comfortable to read. This
            changes the text on every page, on this device.
          </p>

          <div className="text-size-options" role="group" aria-label="Text size">
            {TEXT_SIZES.map((size) => (
              <button
                key={size.id}
                type="button"
                className={`option-btn text-size-option text-size-option--${size.id}${
                  textSize === size.id ? ' option-btn--selected' : ''
                }`}
                aria-pressed={textSize === size.id}
                onClick={() => chooseTextSize(size.id)}
              >
                <span className="text-size-option__sample" aria-hidden="true">A</span>
                {size.label}
              </button>
            ))}
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

          <hr className="divider" />

          {/* Delete account */}
          <h3 className="danger-zone__title">Delete account</h3>

          <p className="profile-section__description">
            This permanently deletes your BladderSense account and all of
            your tracking data. This cannot be undone.
          </p>

          {deleteError && (
            <div className="alert alert--error mb-md" role="alert">
              {deleteError}
            </div>
          )}

          {!confirmingDelete ? (
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => {
                setDeleteError('')
                setConfirmingDelete(true)
              }}
            >
              Delete My Account
            </button>
          ) : (
            <div className="danger-zone__confirm">
              <p className="danger-zone__warning">
                Are you sure? This will erase your account and every
                tracking entry for good.
              </p>

              <div className="btn-stack">
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting
                    ? 'Deleting…'
                    : 'Yes, permanently delete everything'}
                </button>

                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        <p className="profile-footer">
          BladderSense · Your personal tracking space
          <br />
          Built by{' '}
          <a href="https://www.emmanuelademuwagun.org/company/" target="_blank" rel="noopener noreferrer">
            Jidoka Technologies
          </a>
        </p>
      </main>
    </>
  )
}

