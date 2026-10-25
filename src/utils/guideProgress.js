import { guideSections } from '../content/guide'

/*
 * Remembers which guide parts the reader has opened, on this device, so the
 * dashboard can offer "Continue My Guide" and tick off parts already read.
 * Storage can be unavailable (private browsing); everything still works,
 * the guide just starts from the beginning.
 */
const READ_KEY = 'bs_guide_read'

export function getReadSections() {
  try {
    const ids = JSON.parse(localStorage.getItem(READ_KEY) || '[]')
    return new Set(Array.isArray(ids) ? ids : [])
  } catch {
    return new Set()
  }
}

export function markSectionRead(id) {
  try {
    const read = getReadSections()
    read.add(id)
    localStorage.setItem(READ_KEY, JSON.stringify([...read]))
  } catch {
    // Not saved; nothing else depends on it.
  }
}

// The first part, in order, that has not been opened yet (null when all have).
export function nextUnreadSection(read = getReadSections()) {
  return guideSections.find((section) => !read.has(section.id)) || null
}
