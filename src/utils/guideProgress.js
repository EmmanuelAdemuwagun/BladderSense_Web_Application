import { guideSections } from '../content/guide'
import { api } from './api'

/*
 * Remembers which guide parts the reader has opened, so the dashboard can
 * offer "Continue My Guide" and tick off parts already read.
 *
 * The backend is the source of truth, so progress follows the reader to any
 * browser or device. A copy is also kept on this device so the dashboard
 * shows progress instantly and nothing is lost if the API is unreachable;
 * the two are merged (union) whenever we sync. Storage can be unavailable
 * (private browsing); everything still works.
 */
const READ_KEY = 'bs_guide_read'

const knownIds = new Set(guideSections.map((section) => section.id))

export function getReadSections() {
  try {
    const ids = JSON.parse(localStorage.getItem(READ_KEY) || '[]')
    return new Set(Array.isArray(ids) ? ids : [])
  } catch {
    return new Set()
  }
}

function saveReadSections(read) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...read]))
  } catch {
    // Not saved locally; the server copy still has it.
  }
}

export function markSectionRead(id) {
  const read = getReadSections()
  read.add(id)
  saveReadSections(read)

  api.addGuideProgress([id]).catch(() => {
    // Kept locally; the next dashboard sync uploads it.
  })
}

/*
 * Merges this device's progress with the server's and returns the combined
 * set. Parts read here but missing on the server (read offline, or before
 * progress was saved to the server at all) are uploaded. If the server can't
 * be reached, the local progress is returned unchanged.
 */
export async function syncGuideProgress() {
  const local = getReadSections()

  let remote
  try {
    const data = await api.getGuideProgress()
    remote = new Set(data.readSections || [])
  } catch {
    return local
  }

  const merged = new Set([...remote, ...local])
  saveReadSections(merged)

  const missing = [...local].filter((id) => !remote.has(id) && knownIds.has(id))
  if (missing.length > 0) {
    api.addGuideProgress(missing).catch(() => {
      // Still saved locally; retried on the next sync.
    })
  }

  return merged
}

// The first part, in order, that has not been opened yet (null when all have).
export function nextUnreadSection(read = getReadSections()) {
  return guideSections.find((section) => !read.has(section.id)) || null
}
