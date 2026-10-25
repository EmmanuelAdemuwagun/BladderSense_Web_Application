/*
 * Today's date as YYYY-MM-DD in the user's own timezone.
 *
 * toISOString() would give the UTC date instead, which is still
 * "yesterday" shortly after midnight in the UK during summer time.
 */
export function localDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
