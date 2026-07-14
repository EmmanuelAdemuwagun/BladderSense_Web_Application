const { findUserByEmail, verifyToken, updateUser } = require('./_helpers/json-store')

exports.handler = async (event) => {
  const email = event.queryStringParameters?.email
  const token = event.queryStringParameters?.token

  if (!email || !token) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing email or token.' }) }
  }

  const emailNorm = email.toLowerCase()
  const user = await findUserByEmail(emailNorm)
  if (!user) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Account not found.' }) }
  }

  if (user.emailVerified) {
    return { statusCode: 200, body: JSON.stringify({ message: 'Email already verified. You can sign in.' }) }
  }

  const valid = await verifyToken(emailNorm, token.toUpperCase(), 'register')
  if (!valid) {
    return { statusCode: 400, body: JSON.stringify({ error: 'This verification word is incorrect or has expired. Please register again.' }) }
  }

  await updateUser(emailNorm, { emailVerified: true })
  return { statusCode: 200, body: JSON.stringify({ message: 'Email verified successfully.' }) }
}
