const { verifySessionToken, saveUserTracking } = require('./_helpers/json-store')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const authHeader = event.headers.authorization || ''
  const sessionToken = authHeader.replace('Bearer ', '')
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

  const { date, values, notes } = body
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid date.' }) }
  }

  await saveUserTracking(user.email, date, values || {}, notes || '')
  return { statusCode: 200, body: JSON.stringify({ message: 'Tracking saved.' }) }
}
