const { findUserByEmail, createUser, createToken } = require('./_helpers/json-store')
const { sendVerificationEmail } = require('./_helpers/email')

const attempts = {}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request.' }) }
  }

  const { firstName, lastName, preferredName, email } = body

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'First name, last name, and email are required.' }) }
  }

  const emailNorm = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Please enter a valid email address.' }) }
  }

  const now = Date.now()
  attempts[emailNorm] = (attempts[emailNorm] || []).filter((t) => now - t < 60 * 60 * 1000)
  if (attempts[emailNorm].length >= 3) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Too many attempts. Please try again later.' }) }
  }
  attempts[emailNorm].push(now)

  const existing = await findUserByEmail(emailNorm)
  if (existing) {
    return { statusCode: 409, body: JSON.stringify({ error: 'An account with this email already exists. Please sign in.' }) }
  }

  try {
    await createUser({ firstName: firstName.trim(), lastName: lastName.trim(), preferredName: preferredName?.trim() || '', email: emailNorm })
    const token = await createToken(emailNorm, 'register')
    const name = preferredName?.trim() || firstName.trim()
    await sendVerificationEmail({ to: emailNorm, name, token, email: emailNorm })
    return { statusCode: 200, body: JSON.stringify({ message: 'Registration successful. Check your email.' }) }
  } catch (err) {
    console.error('Register error:', err.message)
    return { statusCode: 500, body: JSON.stringify({ error: 'Could not send verification email. Please try again.' }) }
  }
}
