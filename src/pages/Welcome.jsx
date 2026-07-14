import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { getSession } from '../utils/auth'

export default function Welcome() {
  const navigate = useNavigate()

  useEffect(() => {
    if (getSession()) navigate('/dashboard', { replace: true })
  }, [navigate])

  return (
    <main className="page--centered">
      <div className="welcome-hero">
        <div className="welcome-hero__icon" aria-hidden="true">🧑‍⚕️</div>
        <h1 className="welcome-hero__title">Bladder Health Guide for Men</h1>
        <p className="welcome-hero__subtitle">
          A practical guide to improving bladder control through small daily changes.
          Simple steps. Real results.
        </p>
        <div className="btn-stack">
          <button
            className="btn btn--primary"
            onClick={() => navigate('/register')}
          >
            Register — New User
          </button>
          <button
            className="btn btn--secondary"
            onClick={() => navigate('/signin')}
          >
            Sign In
          </button>
        </div>
        <p className="text-muted mt-lg">
          This is a secure, private guide for registered users only.
        </p>
      </div>
    </main>
  )
}
