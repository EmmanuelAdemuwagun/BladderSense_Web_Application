import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import FormField from '../components/FormField'
import { api } from '../utils/api'

export default function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    preferredName: '',
    email: '',
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [apiError, setApiError] = useState('')

  function validate() {
    const e = {}

    if (!form.firstName.trim()) {
      e.firstName = 'Please enter your first name.'
    }

    if (!form.lastName.trim()) {
      e.lastName = 'Please enter your last name.'
    }

    if (!form.email.trim()) {
      e.email = 'Please enter your email address.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Please enter a valid email address.'
    }

    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError('')

    const errs = validate()

    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setErrors({})
    setLoading(true)

    try {
      await api.register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        preferredName: form.preferredName.trim(),
        email: form.email.trim().toLowerCase(),
      })

      setSubmitted(true)
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function set(field) {
    return (e) => {
      const value = e.target.value

      setForm((f) => ({
        ...f,
        [field]: value,
      }))

      if (errors[field]) {
        setErrors((er) => ({
          ...er,
          [field]: '',
        }))
      }

      if (apiError) {
        setApiError('')
      }
    }
  }

  if (submitted) {
    return (
      <>
        <Header title="Registration Sent" backTo="/" />

        <main className="page">
          <div className="card text-center mt-lg">
            <div style={{ fontSize: 64, marginBottom: 16 }}>✉️</div>

            <h2>Check Your Email</h2>

            <p>
              We have sent a verification email to:
              <strong className="email-inline">{form.email}</strong>
            </p>

            <p>
              Please check your email and click the verification link to
complete your registration.
            </p>

            <div className="alert alert--info mt-md">
              The word expires in <strong>15 minutes</strong>.
            </div>

            <button
              className="btn btn--primary mt-md"
              onClick={() => navigate('/signin')}
            >
              Go to Sign In
            </button>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Header title="Register" backTo="/" />

      <main className="page">
        <div className="card mt-md">
          <h2 className="mb-md">Create Your Account</h2>

          {apiError && (
            <div className="alert alert--error" role="alert">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <FormField
              label="First Name"
              id="firstName"
              required
              error={errors.firstName}
            >
              <input
                id="firstName"
                className={`form-input${errors.firstName ? ' form-input--error' : ''}`}
                type="text"
                value={form.firstName}
                onChange={set('firstName')}
                autoComplete="given-name"
                autoCapitalize="words"
                disabled={loading}
              />
            </FormField>

            <FormField
              label="Last Name"
              id="lastName"
              required
              error={errors.lastName}
            >
              <input
                id="lastName"
                className={`form-input${errors.lastName ? ' form-input--error' : ''}`}
                type="text"
                value={form.lastName}
                onChange={set('lastName')}
                autoComplete="family-name"
                autoCapitalize="words"
                disabled={loading}
              />
            </FormField>

            <FormField
              label="Preferred Name"
              id="preferredName"
              hint="Optional — the name you like to be called (e.g. Johnny)"
              error={errors.preferredName}
            >
              <input
                id="preferredName"
                className="form-input"
                type="text"
                value={form.preferredName}
                onChange={set('preferredName')}
                autoComplete="nickname"
                autoCapitalize="words"
                disabled={loading}
              />
            </FormField>

            <FormField
              label="Email Address"
              id="email"
              required
              error={errors.email}
            >
              <input
                id="email"
                className={`form-input${errors.email ? ' form-input--error' : ''}`}
                type="email"
                value={form.email}
                onChange={set('email')}
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
              {loading ? 'Registering…' : 'Register'}
            </button>
          </form>

          <p className="text-muted text-center mt-md">
            Already have an account?{' '}

            <button
              className="btn btn--ghost"
              onClick={() => navigate('/signin')}
            >
              Sign In
            </button>
          </p>
        </div>
      </main>
    </>
  )
}
//     </>
//   )
// }
