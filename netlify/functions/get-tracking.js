const { verifySessionToken, getUserTracking } = require('./_helpers/json-store')

exports.handler = async (event) => {
  const authHeader = event.headers.authorization || ''
  const sessionToken = authHeader.replace('Bearer ', '')
  const user = await verifySessionToken(sessionToken)
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Session expired. Please sign in again.' }) }
  }

  const record = await getUserTracking(user.email)
  return { statusCode: 200, body: JSON.stringify({ entries: record.entries || [] }) }
}
