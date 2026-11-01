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
    // Shown as an average ("3+" counts as 3) rather than the most common answer
    averageUnit: 'times a night',
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
    averageUnit: 'out of 5',
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

export const TREND_LABELS = {
  improving: { icon: '▲', text: 'Improving', color: STATUS_COLORS.good },
  worsening: { icon: '▼', text: 'Getting worse', color: STATUS_COLORS.needsWork },
  stable: { icon: '▬', text: 'About the same', color: '#4a5568' },
  insufficient: { icon: '', text: 'Not enough records yet', color: '#4a5568' },
}

// Fewest records needed in each half of the period to call a trend
const TREND_MIN_RECORDS = 3
// Change smaller than this share of the answer range counts as "about the same"
const TREND_MIN_CHANGE = 0.1

function averageIndex(values, field) {
  if (values.length === 0) return null
  const total = values.reduce(
    (sum, value) => sum + field.options.indexOf(value),
    0
  )
  return total / values.length
}

/*
 * Totals for one item over a period: how often each answer was given, the
 * average (for number answers) or most common answer, and whether the
 * second half of the period was better or worse than the first.
 */
export function summarizeField(field, days, entryMap) {
  const valueOn = (date) => {
    const value = entryMap[date]?.[field.id]
    return field.options.includes(value) ? value : null
  }

  const values = days.map(valueOn).filter(Boolean)

  const counts = Object.fromEntries(field.options.map((option) => [option, 0]))
  values.forEach((value) => {
    counts[value] += 1
  })

  let headline = null
  if (values.length > 0) {
    if (field.averageUnit) {
      const average =
        values.reduce((sum, value) => sum + parseInt(value, 10), 0) /
        values.length
      headline = `Average: ${average.toFixed(1)} ${field.averageUnit}`
    } else {
      // Ties go to the better answer, so the summary never sounds harsher
      // than the record
      const ordered = field.lowerIsBetter
        ? field.options
        : [...field.options].reverse()
      const mostCommon = ordered.reduce((best, option) =>
        counts[option] > counts[best] ? option : best
      )
      headline = `Most common: ${mostCommon}`
    }
  }

  const half = Math.floor(days.length / 2)
  const firstHalf = days.slice(0, half).map(valueOn).filter(Boolean)
  const secondHalf = days.slice(half).map(valueOn).filter(Boolean)

  let trend = 'insufficient'
  if (
    firstHalf.length >= TREND_MIN_RECORDS &&
    secondHalf.length >= TREND_MIN_RECORDS
  ) {
    const change =
      (averageIndex(secondHalf, field) - averageIndex(firstHalf, field)) /
      (field.options.length - 1)

    if (Math.abs(change) < TREND_MIN_CHANGE) {
      trend = 'stable'
    } else {
      const wentDown = change < 0
      trend = wentDown === field.lowerIsBetter ? 'improving' : 'worsening'
    }
  }

  return { recorded: values.length, counts, headline, trend }
}

// "28 Oct"
export function dayMonth(dateStr) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}
