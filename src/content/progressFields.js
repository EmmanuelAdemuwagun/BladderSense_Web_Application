/*
 * The five things tracked each day, as shown on the Progress page, its
 * charts and the PDF report. Options run from the lowest answer to the
 * highest; lowerIsBetter says which end is good.
 */
export const PROGRESS_FIELDS = [
  {
    id: 'nightTimeUrination',
    label: 'Night-time urination',
    icon: '🌙',
    options: ['0', '1', '2', '3+'],
    lowerIsBetter: true,
  },
  {
    id: 'eveningFluids',
    label: 'Evening fluids',
    icon: '🥤',
    options: ['None', 'Small', 'Moderate', 'Large'],
    lowerIsBetter: true,
  },
  {
    id: 'activityLevel',
    label: 'Activity level',
    icon: '🚶',
    options: ['None', 'Light', 'Moderate', 'High'],
    lowerIsBetter: false,
  },
  {
    id: 'stressLevel',
    label: 'Stress level',
    icon: '🧠',
    options: ['1', '2', '3', '4', '5'],
    lowerIsBetter: true,
  },
  {
    id: 'sleepQuality',
    label: 'Sleep quality',
    icon: '🛏️',
    options: ['Poor', 'Fair', 'Good'],
    lowerIsBetter: false,
  },
]

export const STATUS_COLORS = {
  good: '#1a7a3c',
  fair: '#d4ac0d',
  needsWork: '#922b21',
  none: '#e8edf2',
}

export const STATUS_LABELS = {
  good: 'Good',
  fair: 'Fair',
  needsWork: 'Needs work',
}

// 'good' | 'fair' | 'needsWork', or null when the value isn't an option
export function getStatus(value, field) {
  const idx = field.options.indexOf(value)

  if (idx === -1) {
    return null
  }

  const max = field.options.length - 1

  if (max === 0) {
    return 'good'
  }

  const ratio = idx / max

  if (field.lowerIsBetter) {
    if (ratio <= 0.25) return 'good'
    if (ratio <= 0.5) return 'fair'
    return 'needsWork'
  }

  if (ratio >= 0.75) return 'good'
  if (ratio >= 0.5) return 'fair'
  return 'needsWork'
}

export function getStatusColor(value, field) {
  const status = getStatus(value, field)
  return status ? STATUS_COLORS[status] : '#ccd6e0'
}

/*
 * "Tue 27" for a YYYY-MM-DD date. Parsed at midday so the day can't slip
 * across a timezone boundary.
 */
export function shortDate(dateStr) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
  })
}

// "27 October"
export function longDate(dateStr) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
  })
}
