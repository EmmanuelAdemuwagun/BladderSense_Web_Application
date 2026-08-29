// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import Header from '../components/Header'
// import FormField from '../components/FormField'
// import { api } from '../utils/api'

// export default function SignIn() {
//   const navigate = useNavigate()
//   const [step, setStep] = useState(1) // 1 = email, 2 = token
//   const [email, setEmail] = useState('')
//   const [token, setToken] = useState('')
//   const [emailError, setEmailError] = useState('')
//   const [tokenError, setTokenError] = useState('')
//   const [apiError, setApiError] = useState('')
//   const [loading, setLoading] = useState(false)

//   async function handleEmailSubmit(e) {
//     e.preventDefault()
//     setApiError('')
//     if (!email.trim()) return setEmailError('Please enter your email address.')
//     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
//       return setEmailError('Please enter a valid email address.')
//     }
//     setEmailError('')
//     setLoading(true)
//     try {
//       await api.requestLoginToken({ email: email.trim().toLowerCase() })
//       setStep(2)
//     } catch (err) {
//       setApiError(err.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   async function handleTokenSubmit(e) {
//     e.preventDefault()
//     setApiError('')
//     const cleaned = token.trim().toUpperCase()
//     if (!cleaned) return setTokenError('Please enter the 6-letter sign-in word.')
//     if (cleaned.length !== 6 || !/^[A-Z]+$/.test(cleaned)) {
//       return setTokenError('The sign-in word must be exactly 6 letters.')
//     }
//     setTokenError('')
//     setLoading(true)
//     try {
//       const data = await api.verifyLoginToken({
//         email: email.trim().toLowerCase(),
//         token: cleaned,
//       })

//       navigate('/dashboard', { replace: true })
//     } catch (err) {
//       setApiError(err.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <>
//       <Header title="Sign In" backTo="/" />
//       <main className="page">
//         <div className="card mt-md">
//           {step === 1 && (
//             <>
//               <h2 className="mb-md">Enter Your Email</h2>
//               <p className="mb-md">
//                 We will send you a 6-letter sign-in word by email. No password needed.
//               </p>
//               {apiError && (
//                 <div className="alert alert--error" role="alert">
//                   {apiError}
//                 </div>
//               )}
//               <form onSubmit={handleEmailSubmit} noValidate>
//                 <FormField label="Email Address" id="email" required error={emailError}>
//                   <input
//                     id="email"
//                     className={`form-input${emailError ? ' form-input--error' : ''}`}
//                     type="email"
//                     value={email}
//                     onChange={(e) => {
//                       setEmail(e.target.value)
//                       if (emailError) setEmailError('')
//                     }}
//                     autoComplete="email"
//                     inputMode="email"
//                     disabled={loading}
//                   />
//                 </FormField>
//                 <button type="submit" className="btn btn--primary" disabled={loading}>
//                   {loading ? 'Sending…' : 'Send My Sign-In Word'}
//                 </button>
//               </form>
//               <p className="text-muted text-center mt-md">
//                 Not registered yet?{' '}
//                 <button className="btn btn--ghost" onClick={() => navigate('/register')}>
//                   Register here
//                 </button>
//               </p>
//             </>
//           )}

//           {step === 2 && (
//             <>
//               <h2 className="mb-md">Enter Your Sign-In Word</h2>
//               <div className="alert alert--info mb-md">
//                 We sent a 6-letter word to <strong>{email}</strong>. Please check your email.
//               </div>
//               {apiError && (
//                 <div className="alert alert--error" role="alert">
//                   {apiError}
//                 </div>
//               )}
//               <form onSubmit={handleTokenSubmit} noValidate>
//                 <FormField
//                   label="Your 6-Letter Sign-In Word"
//                   id="token"
//                   hint="Type the word exactly as shown in the email. Capital letters."
//                   error={tokenError}
//                 >
//                   <input
//                     id="token"
//                     className={`form-input${tokenError ? ' form-input--error' : ''}`}
//                     type="text"
//                     value={token}
//                     onChange={(e) => {
//                       setToken(e.target.value.toUpperCase())
//                       if (tokenError) setTokenError('')
//                     }}
//                     maxLength={6}
//                     autoComplete="one-time-code"
//                     style={{ textTransform: 'uppercase', letterSpacing: '0.25em', fontSize: 28, fontWeight: 700 }}
//                     disabled={loading}
//                     autoFocus
//                   />
//                 </FormField>
//                 <button type="submit" className="btn btn--primary" disabled={loading}>
//                   {loading ? 'Signing in…' : 'Sign In'}
//                 </button>
//               </form>
//               <hr className="divider" />
//               <p className="text-muted text-center">
//                 Did not receive the email?{' '}
//                 <button
//                   className="btn btn--ghost"
//                   onClick={() => {
//                     setStep(1)
//                     setToken('')
//                     setApiError('')
//                   }}
//                 >
//                   Try again
//                 </button>
//               </p>
//             </>
//           )}
//         </div>
//       </main>
//     </>
//   )
// }

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import FormField from '../components/FormField'
import { api } from '../utils/api'

export default function SignIn() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1 = email, 2 = token
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [emailError, setEmailError] = useState('')
  const [tokenError, setTokenError] = useState('')
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleEmailSubmit(e) {
    e.preventDefault()
    setApiError('')

    if (!email.trim()) {
      return setEmailError('Please enter your email address.')
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setEmailError('Please enter a valid email address.')
    }

    setEmailError('')
    setLoading(true)

    try {
      await api.requestLoginToken({
        email: email.trim().toLowerCase(),
      })

      setStep(2)
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleTokenSubmit(e) {
    e.preventDefault()
    setApiError('')

    const cleaned = token.trim().toUpperCase()

    if (!cleaned) {
      return setTokenError('Please enter the 6-letter sign-in word.')
    }

    if (cleaned.length !== 6 || !/^[A-Z]+$/.test(cleaned)) {
      return setTokenError('The sign-in word must be exactly 6 letters.')
    }

    setTokenError('')
    setLoading(true)

    try {
      await api.verifyLoginToken({
        email: email.trim().toLowerCase(),
        token: cleaned,
      })

      // The backend creates the authenticated session and
      // sets the HTTP-only session cookie.
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header title="Sign In" backTo="/" />

      <main className="page">
        <div className="card mt-md">
          {step === 1 && (
            <>
              <h2 className="mb-md">Enter Your Email</h2>

              <p className="mb-md">
                We will send you a 6-letter sign-in word by email. No password needed.
              </p>

              {apiError && (
                <div className="alert alert--error" role="alert">
                  {apiError}
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
                    className={`form-input${emailError ? ' form-input--error' : ''}`}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (emailError) setEmailError('')
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
                  {loading ? 'Sending…' : 'Send My Sign-In Word'}
                </button>
              </form>

              <p className="text-muted text-center mt-md">
                Not registered yet?{' '}
                <button
                  className="btn btn--ghost"
                  onClick={() => navigate('/register')}
                >
                  Register here
                </button>
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="mb-md">Enter Your Sign-In Word</h2>

              <div className="alert alert--info mb-md">
                We sent a 6-letter word to <strong>{email}</strong>. Please check your email.
              </div>

              {apiError && (
                <div className="alert alert--error" role="alert">
                  {apiError}
                </div>
              )}

              <form onSubmit={handleTokenSubmit} noValidate>
                <FormField
                  label="Your 6-Letter Sign-In Word"
                  id="token"
                  hint="Type the word exactly as shown in the email. Capital letters."
                  error={tokenError}
                >
                  <input
                    id="token"
                    className={`form-input${tokenError ? ' form-input--error' : ''}`}
                    type="text"
                    value={token}
                    onChange={(e) => {
                      setToken(e.target.value.toUpperCase())
                      if (tokenError) setTokenError('')
                    }}
                    maxLength={6}
                    autoComplete="one-time-code"
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
                  disabled={loading}
                >
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              <hr className="divider" />

              <p className="text-muted text-center">
                Did not receive the email?{' '}
                <button
                  className="btn btn--ghost"
                  onClick={() => {
                    setStep(1)
                    setToken('')
                    setApiError('')
                  }}
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
```

