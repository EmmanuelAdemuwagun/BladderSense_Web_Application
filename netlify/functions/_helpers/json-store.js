const { v4: uuidv4 } = require('uuid')

// ---------------------------------------------------------------------------
// Storage — JSONBin.io in production, local JSON files in dev
// ---------------------------------------------------------------------------

const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`
const JSONBIN_KEY = process.env.JSONBIN_KEY

async function readDB() {
  if (JSONBIN_KEY) {
    const res = await fetch(`${JSONBIN_URL}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_KEY },
    })
    const json = await res.json()
    return json.record
  }
  // Local dev — use JSON files
  const fs = require('fs')
  const path = require('path')
  const DATA_DIR = process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.join(__dirname, '../../data')
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'db.json'), 'utf8'))
  } catch {
    return { users: [], tokens: [], tracking: [] }
  }
}

async function writeDB(db) {
  if (JSONBIN_KEY) {
    await fetch(JSONBIN_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_KEY,
      },
      body: JSON.stringify(db),
    })
    return
  }
  // Local dev — write JSON file
  const fs = require('fs')
  const path = require('path')
  const DATA_DIR = process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.join(__dirname, '../../data')
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(path.join(DATA_DIR, 'db.json'), JSON.stringify(db, null, 2), 'utf8')
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

async function findUserByEmail(email) {
  const db = await readDB()
  return (db.users || []).find((u) => u.email === email.toLowerCase()) || null
}

async function createUser(data) {
  const db = await readDB()
  const user = {
    id: uuidv4(),
    firstName: data.firstName,
    lastName: data.lastName,
    preferredName: data.preferredName || '',
    email: data.email.toLowerCase(),
    emailVerified: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  }
  db.users = [...(db.users || []), user]
  await writeDB(db)
  return user
}

async function updateUser(email, changes) {
  const db = await readDB()
  const idx = (db.users || []).findIndex((u) => u.email === email.toLowerCase())
  if (idx === -1) return null
  db.users[idx] = { ...db.users[idx], ...changes }
  await writeDB(db)
  return db.users[idx]
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

function generateToken() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  let token = ''
  for (let i = 0; i < 6; i++) token += letters[Math.floor(Math.random() * letters.length)]
  return token
}

async function createToken(email, purpose) {
  const db = await readDB()
  const tokens = (db.tokens || []).map((t) =>
    t.email === email.toLowerCase() && t.purpose === purpose && !t.used
      ? { ...t, used: true }
      : t
  )
  const token = generateToken()
  tokens.push({
    email: email.toLowerCase(),
    token,
    purpose,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    used: false,
  })
  db.tokens = tokens
  await writeDB(db)
  return token
}

async function verifyToken(email, token, purpose) {
  const db = await readDB()
  const tokens = db.tokens || []
  const match = tokens.find(
    (t) =>
      t.email === email.toLowerCase() &&
      t.token === token &&
      t.purpose === purpose &&
      !t.used &&
      new Date(t.expiresAt) > new Date()
  )
  if (!match) return false
  db.tokens = tokens.map((t) => (t === match ? { ...t, used: true } : t))
  await writeDB(db)
  return true
}

async function createSessionToken(email) {
  const db = await readDB()
  const sessionToken = uuidv4()
  db.tokens = [...(db.tokens || []), {
    email: email.toLowerCase(),
    token: sessionToken,
    purpose: 'session',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    used: false,
  }]
  await writeDB(db)
  return sessionToken
}

async function verifySessionToken(sessionToken) {
  const db = await readDB()
  const match = (db.tokens || []).find(
    (t) =>
      t.token === sessionToken &&
      t.purpose === 'session' &&
      !t.used &&
      new Date(t.expiresAt) > new Date()
  )
  if (!match) return null
  return (db.users || []).find((u) => u.email === match.email) || null
}

// ---------------------------------------------------------------------------
// Tracking
// ---------------------------------------------------------------------------

async function getUserTracking(email) {
  const db = await readDB()
  return (db.tracking || []).find((t) => t.email === email.toLowerCase()) || { email, entries: [] }
}

async function saveUserTracking(email, date, values, notes) {
  const db = await readDB()
  db.tracking = db.tracking || []
  let userRecord = db.tracking.find((t) => t.email === email.toLowerCase())
  if (!userRecord) {
    userRecord = { email: email.toLowerCase(), entries: [] }
    db.tracking.push(userRecord)
  }
  const existingIdx = userRecord.entries.findIndex((e) => e.date === date)
  const entry = { date, values, notes, updatedAt: new Date().toISOString() }
  if (existingIdx >= 0) {
    userRecord.entries[existingIdx] = entry
  } else {
    userRecord.entries.push(entry)
  }
  userRecord.entries.sort((a, b) => b.date.localeCompare(a.date))
  userRecord.entries = userRecord.entries.slice(0, 90)
  await writeDB(db)
}

module.exports = {
  findUserByEmail, createUser, updateUser,
  createToken, verifyToken,
  createSessionToken, verifySessionToken,
  getUserTracking, saveUserTracking,
}
