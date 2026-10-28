import { useState } from 'react'
import {
  STATUS_COLORS,
  getStatus,
  getStatusColor,
  shortDate,
} from '../content/progressFields'

/*
 * Seven-day column chart for one tracked item.
 *
 * Answers are ordered (e.g. None < Small < Moderate < Large), so each
 * answer gets its own gridline, labelled on the left, and a column rises to
 * the line of that day's answer. The lowest answer still gets a short
 * column, so "0" or "None" never looks the same as a day with no record.
 * Column colour is the same Good / Fair / Needs work colour as the legend.
 * Tapping a column spells out that day's answer under the chart.
 */
const WIDTH = 340
// Room for the answer labels on the left: sized to this chart's longest
// label (about 10 units per character at the 17px label size)
const AXIS_CHAR_W = 10
const AXIS_PAD = 14
const TOP = 10
const PLOT_H = 150
const DAY_H = 48
const BAR_W = 24
const RADIUS = 4

function columnPath(x, y, w, h) {
  const r = Math.min(RADIUS, h)
  // Rounded top, square at the baseline
  return [
    `M${x},${y + h}`,
    `V${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `H${x + w - r}`,
    `Q${x + w},${y} ${x + w},${y + r}`,
    `V${y + h}`,
    'Z',
  ].join(' ')
}

export default function ProgressChart({ field, days, entryMap }) {
  const [selected, setSelected] = useState(null)

  const AXIS_W =
    Math.max(...field.options.map((option) => option.length)) * AXIS_CHAR_W +
    AXIS_PAD
  const levels = field.options.length
  const step = PLOT_H / levels
  const band = (WIDTH - AXIS_W) / days.length
  const baseline = TOP + PLOT_H

  // y of the gridline for answer index i (0 = lowest answer)
  const levelY = (i) => baseline - step * (i + 1)

  const summary = days
    .map((date) => {
      const value = entryMap[date]?.[field.id]
      return `${shortDate(date)}: ${value || 'not recorded'}`
    })
    .join(', ')

  const selectedValue = selected ? entryMap[selected]?.[field.id] : null
  const selectedStatus = selectedValue ? getStatus(selectedValue, field) : null

  return (
    <div className="progress-chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${baseline + DAY_H}`}
        role="img"
        aria-label={`${field.label}, last 7 days. ${summary}`}
      >
        {/* Gridline and label for every possible answer */}
        {field.options.map((option, i) => (
          <g key={option}>
            <line
              x1={AXIS_W}
              x2={WIDTH}
              y1={levelY(i)}
              y2={levelY(i)}
              className="progress-chart__grid"
            />
            <text
              x={AXIS_W - 8}
              y={levelY(i)}
              className="progress-chart__axis"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {option}
            </text>
          </g>
        ))}

        <line
          x1={AXIS_W}
          x2={WIDTH}
          y1={baseline}
          y2={baseline}
          className="progress-chart__baseline"
        />

        {days.map((date, d) => {
          const value = entryMap[date]?.[field.id]
          const idx = value ? field.options.indexOf(value) : -1
          const cx = AXIS_W + band * d + band / 2
          const [weekday, dayNum] = shortDate(date).split(' ')
          const isSelected = selected === date

          return (
            <g
              key={date}
              className="progress-chart__day"
              onClick={() => setSelected(isSelected ? null : date)}
            >
              <title>{`${shortDate(date)}: ${value || 'Not recorded'}`}</title>

              {/* Hit area covers the whole day, not just the column */}
              <rect
                x={cx - band / 2}
                y={TOP}
                width={band}
                height={PLOT_H + DAY_H}
                fill={isSelected ? 'rgba(31,78,121,0.08)' : 'transparent'}
                rx={6}
              />

              {idx >= 0 ? (
                <path
                  d={columnPath(
                    cx - BAR_W / 2,
                    levelY(idx),
                    BAR_W,
                    baseline - levelY(idx)
                  )}
                  fill={getStatusColor(value, field)}
                />
              ) : (
                <text
                  x={cx}
                  y={baseline - 8}
                  textAnchor="middle"
                  className="progress-chart__missing"
                >
                  –
                </text>
              )}

              <text
                x={cx}
                y={baseline + 20}
                textAnchor="middle"
                className="progress-chart__day-label"
              >
                {weekday}
              </text>
              <text
                x={cx}
                y={baseline + 40}
                textAnchor="middle"
                className="progress-chart__day-num"
              >
                {dayNum}
              </text>
            </g>
          )
        })}
      </svg>

      <p className="progress-chart__readout" aria-live="polite">
        {selected ? (
          <>
            <strong>{shortDate(selected)}:</strong>{' '}
            {selectedValue ? (
              <>
                {selectedValue}
                {selectedStatus && (
                  <>
                    {' '}
                    <span
                      className="progress-chart__swatch"
                      style={{ background: STATUS_COLORS[selectedStatus] }}
                      aria-hidden="true"
                    />
                  </>
                )}
              </>
            ) : (
              'Not recorded'
            )}
          </>
        ) : (
          'Tap a day to see your answer.'
        )}
      </p>
    </div>
  )
}
