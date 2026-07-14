import { useNavigate } from 'react-router-dom'
import { getSessionUser } from '../utils/auth'

export default function Header({ title, showBack = true, backTo, onBack, showProfile = true }) {
  const navigate = useNavigate()
  const user = getSessionUser()

  function handleBack() {
    if (onBack) return onBack()
    if (backTo) return navigate(backTo)
    navigate(-1)
  }

  return (
    <header className="header">
      {/* Left: back button or home */}
      {showBack ? (
        <button className="header__back" onClick={handleBack} aria-label="Go back">
          ← Back
        </button>
      ) : (
        <button className="header__back" onClick={() => navigate('/')} aria-label="Go to home">
          🏠 Home
        </button>
      )}

      <h1 className="header__title">{title}</h1>

      {/* Right: profile button if logged in */}
      {showProfile && user && (
        <button
          className="header__back"
          onClick={() => navigate('/profile')}
          aria-label="My Profile"
        >
          Profile
        </button>
      )}
    </header>
  )
}
