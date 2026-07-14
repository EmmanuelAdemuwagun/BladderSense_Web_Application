const { findUserByEmail, verifyToken, updateUser, createSessionToken } = require('./_helpers/json-store')

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

  const { email, token } = body
  if (!email?.trim() || !token?.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Email and sign-in word are required.' }) }
  }

  const emailNorm = email.trim().toLowerCase()
  const tokenUpper = token.trim().toUpperCase()

  const user = await findUserByEmail(emailNorm)
  if (!user || !user.emailVerified) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Incorrect sign-in word, or it has expired. Please try again.' }) }
  }

  const valid = await verifyToken(emailNorm, tokenUpper, 'login')
  if (!valid) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Incorrect sign-in word, or it has expired. Please request a new one.' }) }
  }

  const updatedUser = await updateUser(emailNorm, { lastLoginAt: new Date().toISOString() })
  const sessionToken = await createSessionToken(emailNorm)

  const safeUser = {
    id: updatedUser.id,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    preferredName: updatedUser.preferredName,
    email: updatedUser.email,
    lastLoginAt: updatedUser.lastLoginAt,
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ sessionToken, user: safeUser }),
  }
}
