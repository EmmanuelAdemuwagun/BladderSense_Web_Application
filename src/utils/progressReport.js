import {
  PROGRESS_FIELDS,
  STATUS_COLORS,
  STATUS_LABELS,
  getStatus,
  getStatusColor,
  longDate,
  shortDate,
} from '../content/progressFields'

/*
 * Builds and downloads an A4 PDF of one week's tracking: a table of every
 * answer, a small chart per item and the week's notes. jsPDF is loaded only
 * when the button is pressed, so it doesn't slow down the app.
 */

const NAVY = '#1F4E79'
const TEXT = '#1a1a1a'
const MUTED = '#4a5568'
const GRID = '#d5dde6'

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 16
const CONTENT_W = PAGE_W - MARGIN * 2

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

  const axisW = 19
  const top = y + 9
  const dayH = 6
  const plotH = h - (top - y) - dayH
  const baseline = top + plotH
  const levels = field.options.length
  const step = plotH / levels
  const band = (w - axisW) / days.length
  const barW = Math.min(5, band * 0.55)
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
    } else {
      doc.setTextColor(MUTED)
      doc.setFontSize(8)
      doc.text('-', cx, baseline - 1.5, { align: 'center' })
    }

    doc.setFontSize(7.5)
    doc.setTextColor(TEXT)
    doc.text(shortDate(date).split(' ')[0], cx, baseline + 4, {
      align: 'center',
    })
  })
}

export async function downloadProgressReport({ days, entryMap, user }) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const name = user
    ? [user.preferredName || user.firstName, user.lastName]
        .filter(Boolean)
        .join(' ')
    : ''
  const recorded = days.filter((date) => entryMap[date]).length
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
  doc.text('7-Day Progress Report', MARGIN, 19.5)

  // ---- Who and when
  let y = 35
  doc.setTextColor(TEXT)
  doc.setFontSize(11)
  const details = [
    name && ['Name', pdfSafe(name)],
    ['Period', `${yearDate(days[0])} to ${yearDate(days[days.length - 1])}`],
    ['Days recorded', `${recorded} of ${days.length}`],
    ['Report created', createdOn],
  ].filter(Boolean)

  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, MARGIN, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, MARGIN + 34, y)
    y += 5.5
  })

  // ---- Table of answers
  y += 3
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12.5)
  doc.setTextColor(NAVY)
  doc.text('Daily answers', MARGIN, y)
  y += 3

  const dayColW = 26
  const colW = (CONTENT_W - dayColW) / PROGRESS_FIELDS.length
  const rowH = 6.8

  doc.setFillColor('#eaf3fb')
  doc.rect(MARGIN, y, CONTENT_W, rowH + 1.5, 'F')
  doc.setFontSize(8.5)
  doc.setTextColor(NAVY)
  doc.text('Day', MARGIN + 2, y + 5.5)
  PROGRESS_FIELDS.forEach((field, i) => {
    doc.text(field.label, MARGIN + dayColW + colW * i + 2, y + 5.5, {
      maxWidth: colW - 3,
    })
  })
  y += rowH + 1.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  days.forEach((date, r) => {
    const entry = entryMap[date]
    if (r % 2 === 1) {
      doc.setFillColor('#f6f8fa')
      doc.rect(MARGIN, y, CONTENT_W, rowH, 'F')
    }
    doc.setTextColor(TEXT)
    doc.text(shortDate(date), MARGIN + 2, y + 4.6)

    PROGRESS_FIELDS.forEach((field, i) => {
      const cellX = MARGIN + dayColW + colW * i + 2
      const value = entry?.[field.id]
      if (!value) {
        doc.setTextColor(MUTED)
        doc.text(entry ? '-' : 'Not recorded', cellX, y + 4.6)
        return
      }
      // Coloured dot beside the answer; the words carry the meaning
      doc.setFillColor(getStatusColor(value, field))
      doc.circle(cellX + 1.3, y + 3.5, 1.3, 'F')
      doc.setTextColor(TEXT)
      doc.text(value, cellX + 4, y + 4.6)
    })
    y += rowH
  })

  doc.setDrawColor(GRID)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y)

  // Colour key
  y += 5.5
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

  // ---- Charts, two per row
  y += 7
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12.5)
  doc.setTextColor(NAVY)
  doc.text('Your week at a glance', MARGIN, y)
  y += 3

  const gap = 10
  const chartW = (CONTENT_W - gap) / 2
  const chartH = 33
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
  const chartsTop = y
  y += Math.ceil(PROGRESS_FIELDS.length / 2) * (chartH + 5) + 1

  // ---- Notes
  const notes = days.filter((date) => entryMap[date]?.notes)

  /*
   * With an odd number of charts the last row has a free slot on the
   * right. Short notes go there so a typical week fits on one page;
   * longer ones get their own section below (on a new page if needed).
   */
  const slotFree = PROGRESS_FIELDS.length % 2 === 1
  const slotX = MARGIN + chartW + gap
  const slotY = chartsTop + Math.floor(PROGRESS_FIELDS.length / 2) * (chartH + 5)
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
  } else if (notes.length > 0) {
    const ensureRoom = (needed) => {
      if (y + needed > PAGE_H - 22) {
        doc.addPage()
        y = 20
      }
    }

    ensureRoom(16)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12.5)
    doc.setTextColor(NAVY)
    doc.text('Your notes', MARGIN, y)
    y += 6

    notes.forEach((date) => {
      const lines = doc
        .setFont('helvetica', 'normal')
        .setFontSize(10)
        .splitTextToSize(pdfSafe(entryMap[date].notes), CONTENT_W - 26)
      ensureRoom(lines.length * 4.6 + 3)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(TEXT)
      doc.text(shortDate(date), MARGIN, y)
      doc.setFont('helvetica', 'normal')
      doc.text(lines, MARGIN + 26, y)
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

  doc.save(`bladdersense-progress-${days[0]}-to-${days[days.length - 1]}.pdf`)
}
