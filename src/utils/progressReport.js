import {
  PROGRESS_FIELDS,
  STATUS_COLORS,
  STATUS_LABELS,
  TREND_LABELS,
  dayMonth,
  getStatusColor,
  shortDate,
  summarizeField,
} from '../content/progressFields'

/*
 * Builds and downloads an A4 PDF of one period's tracking (7 or 30 days).
 *
 * 7 days, one page: a table of every answer, a small chart per item and
 * the notes. 30 days: page 1 has a summary per item (average or most
 * common answer, trend, days per answer) and the charts; the full daily
 * table and notes follow. jsPDF is loaded only when the button is pressed,
 * so it doesn't slow down the app.
 */

const NAVY = '#1F4E79'
const TEXT = '#1a1a1a'
const MUTED = '#4a5568'
const GRID = '#d5dde6'

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 16
const CONTENT_W = PAGE_W - MARGIN * 2
const WEEK = 7

// The built-in PDF fonts can't draw emoji or most non-Latin symbols.
function pdfSafe(text) {
  return String(text)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '')
}

function yearDate(dateStr) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function drawChart(doc, field, days, entryMap, x, y, w, h) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(NAVY)
  doc.text(field.label, x, y + 4)

  // Label column only as wide as this chart's longest answer
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  const axisW =
    Math.max(...field.options.map((option) => doc.getTextWidth(option))) + 4
  const top = y + 9
  const dayH = 6
  const plotH = h - (top - y) - dayH
  const baseline = top + plotH
  const levels = field.options.length
  const step = plotH / levels
  const band = (w - axisW) / days.length
  const barW = Math.min(5, band * 0.6)
  const everyDay = days.length <= WEEK
  const levelY = (i) => baseline - step * (i + 1)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setLineWidth(0.2)

  field.options.forEach((option, i) => {
    doc.setDrawColor(GRID)
    doc.line(x + axisW, levelY(i), x + w, levelY(i))
    doc.setTextColor(MUTED)
    doc.text(option, x + axisW - 2, levelY(i), {
      align: 'right',
      baseline: 'middle',
    })
  })

  doc.setDrawColor('#8a99a8')
  doc.setLineWidth(0.3)
  doc.line(x + axisW, baseline, x + w, baseline)

  days.forEach((date, d) => {
    const value = entryMap[date]?.[field.id]
    const idx = value ? field.options.indexOf(value) : -1
    const cx = x + axisW + band * d + band / 2

    if (idx >= 0) {
      const barTop = levelY(idx)
      const barH = baseline - barTop
      const r = Math.min(0.9, barH / 2)
      doc.setFillColor(getStatusColor(value, field))
      // Rounded top, square at the baseline
      doc.roundedRect(cx - barW / 2, barTop, barW, barH, r, r, 'F')
      doc.rect(cx - barW / 2, baseline - r, barW, r, 'F')
    } else if (everyDay) {
      doc.setTextColor(MUTED)
      doc.setFontSize(8)
      doc.text('-', cx, baseline - 1.5, { align: 'center' })
    }

    // Long periods: a date every 7th day, counting back from the last
    if (everyDay || (days.length - 1 - d) % WEEK === 0) {
      doc.setFontSize(everyDay ? 7.5 : 6.5)
      doc.setTextColor(TEXT)
      doc.text(
        everyDay ? shortDate(date).split(' ')[0] : dayMonth(date),
        cx,
        baseline + 4,
        { align: 'center' }
      )
    }
  })
}

/*
 * One row per day, one column per item; returns the y below the table.
 * Starts a new page (with the header row repeated) if it runs out of room.
 */
function drawDailyTable(doc, days, entryMap, startY) {
  let y = startY
  const dayColW = 26
  const colW = (CONTENT_W - dayColW) / PROGRESS_FIELDS.length
  const rowH = days.length <= WEEK ? 6.8 : 6.2

  // Tall enough for a label that wraps onto two lines
  const headerH = 10

  const drawHeader = () => {
    doc.setFillColor('#eaf3fb')
    doc.rect(MARGIN, y, CONTENT_W, headerH, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(NAVY)
    doc.text('Day', MARGIN + 2, y + 4.4)
    PROGRESS_FIELDS.forEach((field, i) => {
      doc.text(field.label, MARGIN + dayColW + colW * i + 2, y + 4.4, {
        maxWidth: colW - 3,
      })
    })
    y += headerH
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
  }

  drawHeader()

  days.forEach((date, r) => {
    if (y + rowH > PAGE_H - 22) {
      doc.addPage()
      y = 20
      drawHeader()
    }

    const entry = entryMap[date]
    if (r % 2 === 1) {
      doc.setFillColor('#f6f8fa')
      doc.rect(MARGIN, y, CONTENT_W, rowH, 'F')
    }
    doc.setTextColor(TEXT)
    doc.text(dayLabel(date, days.length <= WEEK), MARGIN + 2, y + 4.4)

    PROGRESS_FIELDS.forEach((field, i) => {
      const cellX = MARGIN + dayColW + colW * i + 2
      const value = entry?.[field.id]
      if (!value) {
        doc.setTextColor(MUTED)
        doc.text(entry ? '-' : 'Not recorded', cellX, y + 4.4)
        return
      }
      // Coloured dot beside the answer; the words carry the meaning
      doc.setFillColor(getStatusColor(value, field))
      doc.circle(cellX + 1.3, y + 3.3, 1.3, 'F')
      doc.setTextColor(TEXT)
      doc.text(value, cellX + 4, y + 4.4)
    })
    y += rowH
  })

  doc.setDrawColor(GRID)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y)

  return y
}

function drawColourKey(doc, y) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  let keyX = MARGIN
  Object.entries(STATUS_LABELS).forEach(([status, label]) => {
    doc.setFillColor(STATUS_COLORS[status])
    doc.circle(keyX + 1.3, y - 1.1, 1.3, 'F')
    doc.setTextColor(TEXT)
    doc.text(label, keyX + 4, y)
    keyX += doc.getTextWidth(label) + 12
  })
  doc.setTextColor(MUTED)
  doc.text('Stress: 1 = very calm, 5 = very stressed', keyX + 4, y)
}

/*
 * Per item: average or most common answer, trend, and days per answer.
 * Returns the y below the table.
 */
function drawSummaryTable(doc, days, entryMap, startY) {
  let y = startY
  const cols = [
    { title: 'Item', w: 40 },
    { title: 'Overall', w: 46 },
    { title: 'Trend', w: 34 },
    { title: 'Days per answer', w: CONTENT_W - 120 },
  ]
  const colX = []
  cols.reduce((x, col) => {
    colX.push(x)
    return x + col.w
  }, MARGIN)

  doc.setFillColor('#eaf3fb')
  doc.rect(MARGIN, y, CONTENT_W, 7.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(NAVY)
  cols.forEach((col, i) => doc.text(col.title, colX[i] + 2, y + 5))
  y += 7.5

  PROGRESS_FIELDS.forEach((field, r) => {
    const { recorded, counts, headline, trend } = summarizeField(
      field,
      days,
      entryMap
    )
    const countText = field.options
      .map((option) => `${option}: ${counts[option]}`)
      .join('   ')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const countLines = doc.splitTextToSize(countText, cols[3].w - 4)
    const overall = recorded ? headline.replace(/^(Average|Most common): /, '') : 'No answers'
    const overallLines = doc.splitTextToSize(
      recorded ? `${headline.split(':')[0]}: ${overall}` : overall,
      cols[1].w - 4
    )
    const rowH = Math.max(countLines.length, overallLines.length, 1) * 4.2 + 3.6

    if (r % 2 === 1) {
      doc.setFillColor('#f6f8fa')
      doc.rect(MARGIN, y, CONTENT_W, rowH, 'F')
    }

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(TEXT)
    doc.text(field.label, colX[0] + 2, y + 5)

    doc.setFont('helvetica', 'normal')
    doc.text(overallLines, colX[1] + 2, y + 5)

    const trendLabel = TREND_LABELS[trend]
    if (trend !== 'insufficient') {
      doc.setFillColor(trendLabel.color)
      doc.circle(colX[2] + 3.3, y + 3.9, 1.3, 'F')
    }
    doc.setTextColor(trend === 'insufficient' ? MUTED : TEXT)
    doc.text(
      trend === 'insufficient' ? 'Not enough records' : trendLabel.text,
      colX[2] + (trend === 'insufficient' ? 2 : 6),
      y + 5,
      { maxWidth: cols[2].w - 6 }
    )

    doc.setTextColor(TEXT)
    doc.text(countLines, colX[3] + 2, y + 5)
    y += rowH
  })

  doc.setDrawColor(GRID)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y)

  return y
}

// "Tue 28" within a week; "Tue 28 Oct" when a period spans months
function dayLabel(date, isWeek) {
  return isWeek
    ? shortDate(date)
    : `${shortDate(date).split(' ')[0]} ${dayMonth(date)}`
}

function sectionTitle(doc, text, y) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12.5)
  doc.setTextColor(NAVY)
  doc.text(text, MARGIN, y)
}

// Five charts, two per row; returns the top of the charts and the y below
function drawCharts(doc, days, entryMap, y, chartH) {
  const gap = 10
  const chartW = (CONTENT_W - gap) / 2
  PROGRESS_FIELDS.forEach((field, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    drawChart(
      doc,
      field,
      days,
      entryMap,
      MARGIN + col * (chartW + gap),
      y + row * (chartH + 5),
      chartW,
      chartH
    )
  })
  return {
    chartW,
    gap,
    bottom: y + Math.ceil(PROGRESS_FIELDS.length / 2) * (chartH + 5) + 1,
  }
}

export async function downloadProgressReport({ days, entryMap, user }) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const isWeek = days.length <= WEEK
  const name = user
    ? [user.preferredName || user.firstName, user.lastName]
        .filter(Boolean)
        .join(' ')
    : ''
  const recorded = days.filter((date) => entryMap[date]).length
  const percent = Math.round((recorded / days.length) * 100)
  const today = new Date()
  const createdOn = today.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // ---- Header band
  doc.setFillColor(NAVY)
  doc.rect(0, 0, PAGE_W, 26, 'F')
  doc.setTextColor('#ffffff')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('BladderSense', MARGIN, 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.text(`${days.length}-Day Progress Report`, MARGIN, 19.5)

  // ---- Who and when
  let y = 35
  doc.setTextColor(TEXT)
  doc.setFontSize(11)
  const details = [
    name && ['Name', pdfSafe(name)],
    ['Period', `${yearDate(days[0])} to ${yearDate(days[days.length - 1])}`],
    [
      'Days recorded',
      isWeek
        ? `${recorded} of ${days.length}`
        : `${recorded} of ${days.length} (${percent}%)`,
    ],
    ['Report created', createdOn],
  ].filter(Boolean)

  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, MARGIN, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, MARGIN + 34, y)
    y += 5.5
  })

  const notes = days.filter((date) => entryMap[date]?.notes)
  let notesPlaced = false

  if (isWeek) {
    // ---- One page: daily table, charts, notes beside the last chart
    y += 3
    sectionTitle(doc, 'Daily answers', y)
    y += 3
    y = drawDailyTable(doc, days, entryMap, y)

    y += 5.5
    drawColourKey(doc, y)

    y += 7
    sectionTitle(doc, 'Your week at a glance', y)
    y += 3

    const chartH = 33
    const chartsTop = y
    const { chartW, gap, bottom } = drawCharts(doc, days, entryMap, y, chartH)
    y = bottom

    /*
     * With an odd number of charts the last row has a free slot on the
     * right. Short notes go there so a typical week fits on one page;
     * longer ones get their own section below (on a new page if needed).
     */
    const slotFree = PROGRESS_FIELDS.length % 2 === 1
    const slotX = MARGIN + chartW + gap
    const slotY =
      chartsTop + Math.floor(PROGRESS_FIELDS.length / 2) * (chartH + 5)
    const slotDateW = 12
    const slotLineH = 3.6

    doc.setFont('helvetica', 'normal').setFontSize(8.5)
    const slotNotes = notes.map((date) => ({
      date,
      lines: doc.splitTextToSize(
        pdfSafe(entryMap[date].notes),
        chartW - slotDateW
      ),
    }))
    const slotHeight = slotNotes.reduce(
      (total, note) => total + note.lines.length * slotLineH + 1.5,
      0
    )

    if (notes.length > 0 && slotFree && slotHeight <= chartH - 7) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10.5)
      doc.setTextColor(NAVY)
      doc.text('Your notes', slotX, slotY + 4)

      let noteY = slotY + 10
      slotNotes.forEach(({ date, lines }) => {
        doc.setFontSize(8.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(TEXT)
        doc.text(shortDate(date), slotX, noteY)
        doc.setFont('helvetica', 'normal')
        doc.text(lines, slotX + slotDateW, noteY)
        noteY += lines.length * slotLineH + 1.5
      })
      notesPlaced = true
    }
  } else {
    // ---- Page 1: summary per item and the charts
    y += 3
    sectionTitle(doc, 'Summary', y)
    y += 3
    y = drawSummaryTable(doc, days, entryMap, y)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(MUTED)
    doc.text(
      'Trend compares the second half of the period with the first half. ' +
        '"Night-time urination" counts 3+ as 3.',
      MARGIN,
      y + 4.5
    )

    y += 10
    drawColourKey(doc, y)

    y += 7
    sectionTitle(doc, `Your ${days.length} days at a glance`, y)
    y += 3
    y = drawCharts(doc, days, entryMap, y, 36).bottom

    // ---- Next page: every day's answers
    doc.addPage()
    y = 20
    sectionTitle(doc, 'Daily answers', y)
    y += 3
    y = drawDailyTable(doc, days, entryMap, y)
    y += 9
  }

  // ---- Notes, full width, continuing onto new pages as needed
  if (notes.length > 0 && !notesPlaced) {
    const dateW = isWeek ? 26 : 30
    const ensureRoom = (needed) => {
      if (y + needed > PAGE_H - 22) {
        doc.addPage()
        y = 20
      }
    }

    ensureRoom(16)
    sectionTitle(doc, 'Your notes', y)
    y += 6

    notes.forEach((date) => {
      const lines = doc
        .setFont('helvetica', 'normal')
        .setFontSize(10)
        .splitTextToSize(pdfSafe(entryMap[date].notes), CONTENT_W - dateW)
      ensureRoom(lines.length * 4.6 + 3)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(TEXT)
      doc.text(dayLabel(date, isWeek), MARGIN, y)
      doc.setFont('helvetica', 'normal')
      doc.text(lines, MARGIN + dateW, y)
      y += lines.length * 4.6 + 3
    })
  }

  // ---- Footer on every page
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setDrawColor(GRID)
    doc.line(MARGIN, PAGE_H - 17, PAGE_W - MARGIN, PAGE_H - 17)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(MUTED)
    doc.text(
      'This report supports self-management and is not a replacement for medical advice. ' +
        'You may wish to share it with your doctor or nurse.',
      MARGIN,
      PAGE_H - 12,
      { maxWidth: CONTENT_W - 20 }
    )
    doc.text(`Page ${p} of ${pages}`, PAGE_W - MARGIN, PAGE_H - 12, {
      align: 'right',
    })
  }

  doc.save(
    `bladdersense-${days.length}-day-progress-${days[0]}-to-${days[days.length - 1]}.pdf`
  )
}
