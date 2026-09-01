import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import FormField from '../components/FormField'
import { api } from '../utils/api'

export default function VerifyRegistration() {
const [params] = useSearchParams()
const navigate = useNavigate()

const emailFromLink = params.get('email') || ''

const [status, setStatus] = useState('loading')
const [message, setMessage] = useState('')
const [email, setEmail] = useState(emailFromLink)

const [resendLoading, setResendLoading] = useState(false)
const [resendSuccess, setResendSuccess] = useState(false)
const [resendError, setResendError] = useState('')

useEffect(() => {
const emailFromUrl = params.get('email')
const token = params.get('token')

  
if (!emailFromUrl || !token) {
  setStatus('error')
  setMessage(
    'This verification link is missing information. Please request a new verification email.'
  )
  return
}

setEmail(emailFromUrl)

api.verifyRegistration({
  email: emailFromUrl,
  token,
})
  .then(() => {
    setStatus('success')
  })
  .catch((err) => {
    setStatus('error')
    setMessage(
      err?.message ||
        'This verification link may have expired or already been used.'
    )
  })

}, [params])

async function handleResend() {
setResendError('')
setResendSuccess(false)


const normalizedEmail = email.trim().toLowerCase()

if (!normalizedEmail) {
  setResendError('Please enter your email address.')
  return
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
  setResendError('Please enter a valid email address.')
  return
}

setResendLoading(true)

try {
  await api.resendVerification({
    email: normalizedEmail,
  })

  setResendSuccess(true)
} catch (err) {
  setResendError(
    err?.message ||
      'Unable to send a new verification email. Please try again.'
  )
} finally {
  setResendLoading(false)
}

}

return (
<> <Header title="Email Verification" backTo="/" />

  <main className="page">
    <div className="card mt-lg text-center">

      {status === 'loading' && (
        <>
          <div className="spinner" />
          <p className="loading-text">
            Verifying your email…
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          <div
            style={{
              fontSize: 64,
              marginBottom: 16,
            }}
          >
            ✅
          </div>

          <h2>Email Verified!</h2>

          <p>
            Your email address has been verified successfully.
            You can now sign in to your BladderSense account.
          </p>

          <button
            type="button"
            className="btn btn--primary mt-md"
            onClick={() => navigate('/signin')}
          >
            Go to Sign In
          </button>
        </>
      )}

      {status === 'error' && (
        <>
          <div
            style={{
              fontSize: 64,
              marginBottom: 16,
            }}
          >
            ⚠️
          </div>

          <h2>Verification Link Unavailable</h2>

          <div className="alert alert--error">
            {message ||
              'This verification link may have expired or already been used.'}
          </div>

          <p>
            Verification links expire after 15 minutes. If you did
            not receive the original email or the link has expired,
            you can request a new one below.
          </p>

          <div className="card card--compact mt-md">
            <h3 className="mb-md">
              Send a New Verification Email
            </h3>

            <FormField
              label="Email Address"
              id="resend-email"
              required
              error={resendError}
            >
              <input
                id="resend-email"
                className={`form-input${
                  resendError ? ' form-input--error' : ''
                }`}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setResendError('')
                  setResendSuccess(false)
                }}
                autoComplete="email"
                inputMode="email"
                disabled={resendLoading}
              />
            </FormField>

            {resendSuccess && (
              <div
                className="alert alert--success"
                role="alert"
              >
                A new verification email has been sent. Please
                check your inbox and use the new verification link.
              </div>
            )}

            <button
              type="button"
              className="btn btn--primary"
              onClick={handleResend}
              disabled={resendLoading}
            >
              {resendLoading
                ? 'Sending…'
                : 'Resend Verification Email'}
            </button>
          </div>

          <div className="btn-stack mt-md">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => navigate('/signin')}
            >
              Go to Sign In
            </button>

            <button
              type="button"
              className="btn btn--ghost"
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
