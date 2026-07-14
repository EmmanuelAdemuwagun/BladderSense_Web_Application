const { findUserByEmail, createToken } = require('./_helpers/json-store')
const { sendLoginEmail } = require('./_helpers/email')

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

  const { email } = body
  if (!email?.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Email address is required.' }) }
  }

  const emailNorm = email.trim().toLowerCase()

  const now = Date.now()
  attempts[emailNorm] = (attempts[emailNorm] || []).filter((t) => now - t < 60 * 60 * 1000)
  if (attempts[emailNorm].length >= 5) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Too many attempts. Please wait a while and try again.' }) }
  }
  attempts[emailNorm].push(now)

  const user = await findUserByEmail(emailNorm)
  if (!user || !user.emailVerified) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'If that email is registered and verified, a sign-in word has been sent.' }),
    }
  }

  try {
    const token = await createToken(emailNorm, 'login')
    const name = user.preferredName || user.firstName
    await sendLoginEmail({ to: emailNorm, name, token })
    return { statusCode: 200, body: JSON.stringify({ message: 'Sign-in word sent. Check your email.' }) }
  } catch (err) {
    console.error('Login email error:', err.message)
    return { statusCode: 500, body: JSON.stringify({ error: 'Could not send sign-in email. Please try again.' }) }
  }
}
