/*
 * Objective "Simple guide to categories" key.
 *
 * Shown beneath every tracked metric — on both the Daily Tracking form and the
 * 7-Day Progress page — so users mean the same thing whenever they pick a
 * qualifier. Both pages import from here so the wording can never drift apart.
 *
 * - Evening fluid intake uses the latest quantified volumes.
 * - Activity and sleep use the owner's wording.
 * - Night-time urination and stress follow the guidebook's own scales
 *   (0-3+, and 1 low - 5 high) in the same plain-language style.
 */
export const CATEGORY_KEY = {
  nightTimeUrination: {
    intro: 'The number of times you got up to pass urine.',
    items: [
      ['0', 'Did not get up'],
      ['1–2', 'Got up once or twice'],
      ['3+', 'Got up three or more times'],
    ],
  },
  eveningFluids: {
    intro: 'Roughly how much you drank in the evening.',
    items: [
      ['Small', 'About 150–250 mL (½–1 cup)'],
      ['Moderate', 'About 300–500 mL (1–2 cups)'],
      ['Large', 'More than 500 mL (more than 2 cups)'],
    ],
  },
  activityLevel: {
    intro: null,
    items: [
      ['Light', 'Short walks or light movement'],
      ['Moderate', 'Regular walking or active movement'],
      ['High', 'Longer periods of movement or exercise'],
    ],
  },
  stressLevel: {
    intro: 'How stressed you felt today, from 1 to 5.',
    items: [
      ['1', 'Very calm and relaxed'],
      ['2–3', 'Mild to moderate stress'],
      ['4–5', 'High or very stressed'],
    ],
  },
  sleepQuality: {
    intro: null,
    items: [
      ['Poor', 'Very disrupted sleep'],
      ['Fair', 'Some disruption but manageable'],
      ['Good', 'Mostly restful sleep'],
    ],
  },
}

export function CategoryKey({ fieldId }) {
  const key = CATEGORY_KEY[fieldId]

  if (!key) {
    return null
  }

  return (
    <div className="progress-key">
      <p className="progress-key__title">What the options mean</p>

      {key.intro && (
        <p className="progress-key__intro">{key.intro}</p>
      )}

      {key.items.map(([term, desc]) => (
        <p key={term} className="progress-key__item">
          <span className="progress-key__term">{term}</span>
          {' = '}
          {desc}
        </p>
      ))}
    </div>
  )
}
