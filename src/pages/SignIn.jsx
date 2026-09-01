
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import FormField from '../components/FormField'
import { api } from '../utils/api'
import { saveSession } from '../utils/auth'

export default function SignIn() {
  const navigate = useNavigate()

  const [step, setStep] = useState(1) // 1 = email, 2 = login code
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')

  const [emailError, setEmailError] = useState('')
  const [tokenError, setTokenError] = useState('')
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState('')

  async function handleResendVerification() {
  setResendError('')
  setResendSuccess(false)

  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail) {
    setResendError('Please enter your email address.')
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
        'Unable to resend the verification email. Please try again.'
    )
  } finally {
    setResendLoading(false)
  }
}

  async function handleEmailSubmit(e) {
    e.preventDefault()

    setEmailError('')
    setApiError('')

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      setEmailError('Please enter your email address.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError('Please enter a valid email address.')
      return
    }

    setLoading(true)

    try {
      await api.requestLoginToken({
        email: normalizedEmail,
      })

      setStep(2)
    } catch (err) {
      setApiError(
        err?.message || 'Unable to send your sign-in code. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleTokenSubmit(e) {
    e.preventDefault()

    setTokenError('')
    setApiError('')

    /*
     * The backend generates a 6-character login code.
     *
     * Normalize the user's input before validation:
     * - Remove accidental spaces
     * - Convert lowercase letters to uppercase
     */
    const cleanedToken = token
      .trim()
      .replace(/\s/g, '')
      .toUpperCase()

    if (!cleanedToken) {
      setTokenError('Please enter the 6-character sign-in code.')
      return
    }

    /*
     * Accept exactly six letters/numbers.
     *
     * This matches the backend token format while preventing
     * accidental spaces or unsupported characters.
     */
    if (!/^[A-Z0-9]{6}$/.test(cleanedToken)) {
      setTokenError('The sign-in code must be exactly 6 characters.')
      return
    }

    setLoading(true)

    try {
      const data = await api.verifyLoginToken({
        email: email.trim().toLowerCase(),
        token: cleanedToken,
      })

      /*
       * Authentication is handled by the backend using the
       * HTTP-only bladdersense_session cookie.
       *
       * We only save the user information locally so the
       * frontend can display the user's details.
       */
      if (!data?.user) {
        throw new Error('Login succeeded, but no user information was returned.')
      }

      saveSession(null, data.user)

      navigate('/dashboard', { replace: true })
    } catch (err) {
      setApiError(
        err?.message || 'Unable to sign you in. Please check your code and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header title="Sign In" backTo="/" showProfile={false} />

      <main className="page">
        <div className="card mt-md">

          {/* ============================
              STEP 1 — EMAIL
          ============================ */}
          {step === 1 && (
            <>
              <h2 className="mb-md">Enter Your Email</h2>

              <p className="mb-md">
                We will send you a 6-character sign-in code by email.
                No password is needed.
              </p>

              {apiError?.toLowerCase().includes('not been verified') && (
  <div className="card card--compact mt-md">
    <h3 className="mb-sm">
      Email not verified?
    </h3>

    <p className="text-muted">
      Your account has not been verified yet. If you did not
      receive the verification email, we can send you a new
      verification link.
    </p>

    {resendSuccess && (
      <div
        className="alert alert--success"
        role="alert"
      >
        A new verification email has been sent.
        Please check your inbox.
      </div>
    )}

    {resendError && (
      <div
        className="alert alert--error"
        role="alert"
      >
        {resendError}
      </div>
    )}

    <button
      type="button"
      className="btn btn--secondary"
      onClick={handleResendVerification}
      disabled={resendLoading || loading}
    >
      {resendLoading
        ? 'Sending…'
        : 'Resend Verification Email'}
    </button>
  </div>
)}

              <form onSubmit={handleEmailSubmit} noValidate>
                <FormField
                  label="Email Address"
                  id="email"
                  required
                  error={emailError}
                >
                  <input
                    id="email"
                    className={`form-input${
                      emailError ? ' form-input--error' : ''
                    }`}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)

                      if (emailError) {
                        setEmailError('')
                      }

                      if (apiError) {
                        setApiError('')
                      }
                    }}
                    autoComplete="email"
                    inputMode="email"
                    disabled={loading}
                  />
                </FormField>

                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={loading}
                >
                  {loading ? 'Sending…' : 'Send My Sign-In Code'}
                </button>
              </form>

              <p className="text-muted text-center mt-md">
                Not registered yet?{' '}

                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => navigate('/register')}
                  disabled={loading}
                >
                  Register here
                </button>
              </p>
            </>
          )}

          {/* ============================
              STEP 2 — LOGIN CODE
          ============================ */}
          {step === 2 && (
            <>
              <h2 className="mb-md">Enter Your Sign-In Code</h2>

              <div className="alert alert--info mb-md">
                We sent a 6-character code to{' '}
                <strong>{email}</strong>.
                Please check your email.
              </div>

              {apiError && (
  <div className="alert alert--error" role="alert">
    {apiError}
  </div>
)}

  <div className="card card--compact mt-md">
    <h3 className="mb-sm">
      Email not verified?
    </h3>

    <p className="text-muted">
      If you did not receive your verification email, we can
      send you a new verification link.
    </p>

    {resendSuccess && (
      <div
        className="alert alert--success"
        role="alert"
      >
        A new verification email has been sent. Please check
        your inbox.
      </div>
    )}

    {resendError && (
      <div
        className="alert alert--error"
        role="alert"
      >
        {resendError}
      </div>
    )}

    <button
      type="button"
      className="btn btn--secondary"
      onClick={handleResendVerification}
      disabled={resendLoading || loading}
    >
      {resendLoading
        ? 'Sending…'
        : 'Resend Verification Email'}
    </button>
  </div>


              <form onSubmit={handleTokenSubmit} noValidate>
                <FormField
                  label="6-Character Sign-In Code"
                  id="token"
                  hint="Enter the code exactly as shown in the email."
                  error={tokenError}
                >
                  <input
                    id="token"
                    className={`form-input${
                      tokenError ? ' form-input--error' : ''
                    }`}
                    type="text"
                    value={token}
                    onChange={(e) => {
                      /*
                       * Only keep letters and numbers.
                       * Convert letters to uppercase immediately.
                       */
                      const cleaned = e.target.value
                        .replace(/[^a-zA-Z0-9]/g, '')
                        .slice(0, 6)
                        .toUpperCase()

                      setToken(cleaned)

                      if (tokenError) {
                        setTokenError('')
                      }

                      if (apiError) {
                        setApiError('')
                      }
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
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              <hr className="divider" />

              <p className="text-muted text-center">
                Did not receive the email?{' '}

                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    setStep(1)
                    setToken('')
                    setApiError('')
                    setTokenError('')
                  }}
                  disabled={loading}
                >
                  Try again
                </button>
              </p>
            </>
          )}

        </div>
      </main>
    </>
  )
}

