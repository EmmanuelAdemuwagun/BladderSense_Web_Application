import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import FormField from '../components/FormField'
import { api } from '../utils/api'

export default function VerifyRegistration() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const emailFromLink = params.get('email') || ''
  const tokenFromLink = params.get('token') || ''

  /*
   * status:
   *   'form'    — waiting for the user to type their 6-character code
   *   'loading' — auto-verifying a code that arrived in the URL (email link)
   *   'success' — email verified
   */
  const [status, setStatus] = useState(tokenFromLink ? 'loading' : 'form')
  const [message, setMessage] = useState('')

  const [email, setEmail] = useState(emailFromLink)
  const [token, setToken] = useState('')
  const [emailError, setEmailError] = useState('')
  const [tokenError, setTokenError] = useState('')
  const [loading, setLoading] = useState(false)

  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState('')

  /*
   * Backward compatibility: if a code arrives in the URL (e.g. an emailed
   * link with ?email=&token=), verify it automatically. Normal registration
   * emails now send a 6-character code the user types in below instead.
   */
  useEffect(() => {
    if (!tokenFromLink) return

    if (!emailFromLink) {
      setStatus('form')
      setMessage(
        'This verification link is missing your email address. Please enter your email and code below.'
      )
      return
    }

    api
      .verifyRegistration({
        email: emailFromLink.trim().toLowerCase(),
        token: tokenFromLink.trim().toUpperCase(),
      })
      .then(() => {
        setStatus('success')
      })
      .catch((err) => {
        setStatus('form')
        setMessage(
          err?.message ||
            'This verification code is incorrect or has expired. Please enter it again below or request a new one.'
        )
      })
  }, [emailFromLink, tokenFromLink])

  async function handleVerify(e) {
    e.preventDefault()

    setEmailError('')
    setTokenError('')
    setMessage('')

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      setEmailError('Please enter your email address.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError('Please enter a valid email address.')
      return
    }

    /*
     * The verification code is 6 characters. Remove accidental spaces and
     * uppercase any letters so it matches the code in the email.
     */
    const cleanedToken = token.trim().replace(/\s/g, '').toUpperCase()

    if (!cleanedToken) {
      setTokenError('Please enter the 6-character verification code.')
      return
    }

    if (!/^[A-Z0-9]{6}$/.test(cleanedToken)) {
      setTokenError('The verification code must be exactly 6 characters.')
      return
    }

    setLoading(true)

    try {
      await api.verifyRegistration({
        email: normalizedEmail,
        token: cleanedToken,
      })

      setStatus('success')
    } catch (err) {
      setMessage(
        err?.message ||
          'This verification code is incorrect or has expired. Please try again or request a new one.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResendError('')
    setResendSuccess(false)
    setMessage('')

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      setResendError('Please enter your email address first.')
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
          'Unable to send a new verification code. Please try again.'
      )
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <>
      <Header title="Verify Your Email" backTo="/" />

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

              <p>
                Your email address has been verified successfully. You can now
                sign in to your BladderSense account.
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

          {status === 'form' && (
            <>
              <div style={{ fontSize: 64, marginBottom: 16 }}>📧</div>

              <h2>Enter Your Verification Code</h2>

              <p>
                We emailed a 6-character verification code to your inbox. Enter
                it below to finish creating your account.
              </p>

              {message && (
                <div className="alert alert--error" role="alert">
                  {message}
                </div>
              )}

              <form onSubmit={handleVerify} noValidate>
                <FormField
                  label="Email Address"
                  id="verify-email"
                  required
                  error={emailError}
                >
                  <input
                    id="verify-email"
                    className={`form-input${
                      emailError ? ' form-input--error' : ''
                    }`}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (emailError) setEmailError('')
                      if (message) setMessage('')
                    }}
                    autoComplete="email"
                    inputMode="email"
                    disabled={loading}
                  />
                </FormField>

                <FormField
                  label="6-Character Verification Code"
                  id="verify-token"
                  hint="Enter the code exactly as shown in the email."
                  error={tokenError}
                >
                  <input
                    id="verify-token"
                    className={`form-input${
                      tokenError ? ' form-input--error' : ''
                    }`}
                    type="text"
                    value={token}
                    onChange={(e) => {
                      const cleaned = e.target.value
                        .replace(/[^a-zA-Z0-9]/g, '')
                        .slice(0, 6)
                        .toUpperCase()

                      setToken(cleaned)
                      if (tokenError) setTokenError('')
                      if (message) setMessage('')
                    }}
                    maxLength={6}
                    minLength={6}
                    autoComplete="one-time-code"
                    autoCapitalize="characters"
                    spellCheck={false}
                    inputMode="text"
                    style={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.25em',
                      fontSize: 28,
                      fontWeight: 700,
                      textAlign: 'center',
                    }}
                    disabled={loading}
                    autoFocus
                  />
                </FormField>

                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={loading || token.length !== 6}
                >
                  {loading ? 'Verifying…' : 'Verify My Email'}
                </button>
              </form>

              <div className="card card--compact mt-md">
                <h3 className="mb-sm">Did not receive the code?</h3>

                <p className="text-muted">
                  Check your spam folder, or send yourself a new code. Codes
                  expire after 15 minutes.
                </p>

                {resendSuccess && (
                  <div className="alert alert--success" role="alert">
                    A new verification code has been sent. Please check your
                    inbox.
                  </div>
                )}

                {resendError && (
                  <div className="alert alert--error" role="alert">
                    {resendError}
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={handleResend}
                  disabled={resendLoading || loading}
                >
                  {resendLoading ? 'Sending…' : 'Resend Verification Code'}
                </button>
              </div>

              <div className="btn-stack mt-md">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => navigate('/signin')}
                  disabled={loading}
                >
                  Go to Sign In
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}
