const { verifySessionToken, updateUser } = require('./_helpers/json-store')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const authHeader = event.headers.authorization || ''
  const sessionToken = authHeader.replace('Bearer ', '')
  if (!sessionToken) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Not signed in.' }) }
  }

  const user = await verifySessionToken(sessionToken)
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Session expired. Please sign in again.' }) }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request.' }) }
  }

  const { preferredName } = body
  if (typeof preferredName === 'undefined') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Nothing to update.' }) }
  }

  const updated = await updateUser(user.email, { preferredName: (preferredName || '').trim() })
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Profile updated.',
      user: {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        preferredName: updated.preferredName,
        email: updated.email,
      },
    }),
  }
}
