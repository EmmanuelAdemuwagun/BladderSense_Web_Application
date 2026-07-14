import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { api } from '../utils/api'

export default function VerifyRegistration() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    const email = params.get('email')
    const token = params.get('token')
    if (!email || !token) {
      setStatus('error')
      setMessage('This link is missing information. Please request a new verification email.')
      return
    }
    api.verifyRegistration({ email, token })
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error')
        setMessage(err.message)
      })
  }, [params])

  return (
    <>
      <Header title="Email Verification" backTo="/" />
      <main className="page">
        <div className="card mt-lg text-center">
          {status === 'loading' && (
            <>
              <div className="spinner" />
              <p className="loading-text">Verifying your email…</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
              <h2>Email Verified!</h2>
              <p>Your email address has been verified. You can now sign in.</p>
              <button
                className="btn btn--primary mt-md"
                onClick={() => navigate('/signin')}
              >
                Go to Sign In
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
              <h2>Verification Failed</h2>
              <div className="alert alert--error">
                {message || 'This link may have expired or already been used.'}
              </div>
              <p>
                You can still sign in manually using the 6-letter word from your
                email, or register again if needed.
              </p>
              <div className="btn-stack mt-md">
                <button
                  className="btn btn--primary"
                  onClick={() => navigate('/signin')}
                >
                  Go to Sign In
                </button>
                <button
                  className="btn btn--secondary"
                  onClick={() => navigate('/register')}
                >
                  Register Again
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}
