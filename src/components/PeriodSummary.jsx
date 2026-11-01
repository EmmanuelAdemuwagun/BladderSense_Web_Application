import {
  TREND_LABELS,
  getStatusColor,
  summarizeField,
} from '../content/progressFields'

/*
 * Summary of one tracked item over a longer period: the average or most
 * common answer, whether the second half of the period was better than the
 * first, and how many days each answer was given.
 */
export default function PeriodSummary({ field, days, entryMap }) {
  const { recorded, counts, headline, trend } = summarizeField(
    field,
    days,
    entryMap
  )

  if (recorded === 0) {
    return (
      <p className="period-summary__empty">
        No answers recorded in these {days.length} days.
      </p>
    )
  }

  const trendLabel = TREND_LABELS[trend]

  return (
    <div className="period-summary">
      <p className="period-summary__headline">{headline}</p>

      <p className="period-summary__trend">
        <span
          className="period-summary__badge"
          style={{ borderColor: trendLabel.color, color: trendLabel.color }}
        >
          {trendLabel.icon && (
            <span aria-hidden="true">{trendLabel.icon} </span>
          )}
          {trendLabel.text}
        </span>
        {trend !== 'insufficient' && (
          <span className="period-summary__trend-note">
            second half compared with first half
          </span>
        )}
      </p>

      <ul className="period-summary__counts" aria-label="Days per answer">
        {field.options.map((option) => (
          <li key={option}>
            <span
              className="period-summary__dot"
              style={{ background: getStatusColor(option, field) }}
              aria-hidden="true"
            />
            {option}: <strong>{counts[option]}</strong>{' '}
            {counts[option] === 1 ? 'day' : 'days'}
          </li>
        ))}
      </ul>
    </div>
  )
}
