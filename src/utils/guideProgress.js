import { guideSections } from '../content/guide'
import { api } from './api'

/*
 * Remembers which guide parts the reader has opened, so the dashboard can
 * offer "Continue My Guide" and tick off parts already read.
 *
 * The backend is the source of truth, so progress follows the reader to any
 * browser or device. A copy is also kept on this device so the dashboard
 * shows progress instantly. Parts opened while the API was unreachable are
 * queued as "pending" and uploaded on the next sync; otherwise the server's
 * list replaces the local copy, so a reset on one device sticks everywhere.
 * Storage can be unavailable (private browsing); everything still works.
 */
const READ_KEY = 'bs_guide_read'
const PENDING_KEY = 'bs_guide_pending'
// Set once this device's pre-server progress has been uploaded
const MIGRATED_KEY = 'bs_guide_synced'

const knownIds = new Set(guideSections.map((section) => section.id))

function loadIds(key) {
  try {
    const ids = JSON.parse(localStorage.getItem(key) || '[]')
    return new Set(Array.isArray(ids) ? ids : [])
  } catch {
    return new Set()
  }
}

function saveIds(key, ids) {
  try {
    localStorage.setItem(key, JSON.stringify([...ids]))
  } catch {
    // Not saved locally; the server copy still has it.
  }
}

function isMigrated() {
  try {
    return localStorage.getItem(MIGRATED_KEY) === '1'
  } catch {
    return true
  }
}

function setMigrated() {
  try {
    localStorage.setItem(MIGRATED_KEY, '1')
  } catch {
    // Harmless: the next sync re-uploads, which the server ignores.
  }
}

function removePending(ids) {
  const pending = loadIds(PENDING_KEY)
  ids.forEach((id) => pending.delete(id))
  saveIds(PENDING_KEY, pending)
}

export function getReadSections() {
  return loadIds(READ_KEY)
}

export function markSectionRead(id) {
  const read = getReadSections()
  read.add(id)
  saveIds(READ_KEY, read)

  const pending = loadIds(PENDING_KEY)
  pending.add(id)
  saveIds(PENDING_KEY, pending)

  api
    .addGuideProgress([id])
    .then(() => removePending([id]))
    .catch(() => {
      // Stays pending; the next dashboard sync uploads it.
    })
}

/*
 * Fetches the server's progress, adds anything this device still has to
 * upload, and returns the result. If the server can't be reached, the local
 * progress is returned unchanged.
 */
export async function syncGuideProgress() {
  let remote
  try {
    const data = await api.getGuideProgress()
    remote = new Set(data.readSections || [])
  } catch {
    return getReadSections()
  }

  // Before the first sync, everything read on this device is new to the server
  const toUpload = isMigrated() ? loadIds(PENDING_KEY) : getReadSections()
  const missing = [...toUpload].filter((id) => !remote.has(id) && knownIds.has(id))

  const merged = new Set([...remote, ...missing])
  saveIds(READ_KEY, merged)

  if (missing.length === 0) {
    saveIds(PENDING_KEY, [])
    setMigrated()
  } else {
    api
      .addGuideProgress(missing)
      .then(() => {
        removePending(missing)
        setMigrated()
      })
      .catch(() => {
        saveIds(PENDING_KEY, new Set([...loadIds(PENDING_KEY), ...missing]))
      })
  }

  return merged
}

/*
 * Clears all progress so the reader starts the guide afresh. Resolves once
 * the server has cleared it too (or failed to), so a part opened straight
 * afterwards is never wiped by a reset that arrives late.
 */
export async function resetGuideProgress() {
  saveIds(READ_KEY, [])
  saveIds(PENDING_KEY, [])
  setMigrated()

  try {
    await api.resetGuideProgress()
  } catch {
    // Cleared on this device only; the next sync restores the server's list.
  }
}

// The first part, in order, that has not been opened yet (null when all have).
export function nextUnreadSection(read = getReadSections()) {
  return guideSections.find((section) => !read.has(section.id)) || null
}
