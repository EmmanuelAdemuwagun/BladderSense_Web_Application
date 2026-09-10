import { useLocation, useNavigate } from 'react-router-dom'
import { getSessionUser, clearSession } from '../utils/auth'
import { api } from '../utils/api'

export default function Header({
  title,
  showBack = true,
  backTo,
  onBack,
  showProfile = true,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getSessionUser()

  const isDashboard = location.pathname === '/dashboard'

  function handleBack() {
    if (onBack) {
      return onBack()
    }

    if (backTo) {
      return navigate(backTo)
    }

    navigate(-1)
  }

  function handleRightAction() {
    if (isDashboard) {
      navigate('/profile')
    } else {
      navigate('/dashboard')
    }
  }

  async function handleSignOut() {
    try {
      await api.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      clearSession()
      navigate('/', { replace: true })
    }
  }

  return (
    <header className="header">
      {/* Left navigation */}
      {showBack ? (
        <button
          type="button"
          className="header__back"
          onClick={handleBack}
          aria-label="Go back"
        >
          ← Back
        </button>
      ) : (
        <button
          type="button"
          className="header__back"
          onClick={() => navigate('/')}
          aria-label="Go to home"
        >
          🏠 Home
        </button>
      )}

      {/* Page title */}
      <h1 className="header__title">
        {title}
      </h1>

      {/* Authenticated navigation */}
      {showProfile && user && (
        <div className="header__actions">
          <button
            type="button"
            className="header__back"
            onClick={handleRightAction}
            aria-label={
              isDashboard
                ? 'Go to My Profile'
                : 'Go to Dashboard'
            }
          >
            {isDashboard ? 'Profile' : 'Dashboard'}
          </button>

          <button
            type="button"
            className="header__back header__signout"
            onClick={handleSignOut}
            aria-label="Sign out of your account"
          >
            Sign Out
          </button>
        </div>
      )}
    </header>
  )
}
