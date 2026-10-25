import { useLocation, useNavigate } from 'react-router-dom'
import { getSessionUser } from '../utils/auth'

export default function Header({
  title,
  showBack = true,
  backTo,
  onBack,
  showProfile = true,
  // Root screens (the dashboard) show a Home button where Back would be
  showHome = false,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getSessionUser()

  const onProfile = location.pathname === '/profile'

  const initials = `${user?.firstName?.charAt(0) || ''}${
    user?.lastName?.charAt(0) || ''
  }`.toUpperCase()

  function handleBack() {
    if (onBack) {
      return onBack()
    }

    if (backTo) {
      return navigate(backTo)
    }

    navigate(-1)
  }

  return (
    <header className="header">
      {/* Left: back control (omitted on root screens via showBack={false}) */}
      {showBack ? (
        <button
          type="button"
          className="header__back"
          onClick={handleBack}
          aria-label="Go back"
        >
          <span aria-hidden="true">←</span> Back
        </button>
      ) : showHome ? (
        <button
          type="button"
          className="header__back header__back--home"
          onClick={() => navigate('/')}
          aria-label="Go to the Bladder Sense home page"
        >
          <svg
            className="header__home-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 11l9-7 9 7" />
            <path d="M5 10v10h14V10" />
          </svg>
          Home
        </button>
      ) : (
        <span className="header__spacer" aria-hidden="true" />
      )}

      {/* Title */}
      <h1 className="header__title">{title}</h1>

      {/* Right: single account entry point (avatar → profile) */}
      {showProfile && user && !onProfile ? (
        <button
          type="button"
          className="header__avatar"
          onClick={() => navigate('/profile')}
          aria-label="Your profile and account"
          title="Profile & account"
        >
          {initials || 'U'}
        </button>
      ) : (
        <span className="header__spacer" aria-hidden="true" />
      )}
    </header>
  )
}
