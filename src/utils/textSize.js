/*
 * Reader-chosen text size. Applied as data-text-size on <html>, where
 * global.css scales the font-size tokens. Kept on this device only.
 */
const KEY = 'bs_text_size'

export const TEXT_SIZES = [
  { id: 'standard', label: 'Standard' },
  { id: 'large', label: 'Large' },
  { id: 'largest', label: 'Largest' },
]

export function getTextSize() {
  try {
    const value = localStorage.getItem(KEY)
    return TEXT_SIZES.some((size) => size.id === value) ? value : 'standard'
  } catch {
    return 'standard'
  }
}

export function applyTextSize(size = getTextSize()) {
  document.documentElement.dataset.textSize = size
}

export function setTextSize(size) {
  try {
    localStorage.setItem(KEY, size)
  } catch {
    // Still applied for this visit.
  }
  applyTextSize(size)
}
