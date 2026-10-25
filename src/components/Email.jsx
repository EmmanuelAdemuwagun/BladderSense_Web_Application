/*
 * Shows an email address that, when it is too long for a phone screen,
 * wraps at natural points — before a "." or after the "@" — instead of
 * in the middle of a word.
 */
export default function Email({ children }) {
  const email = String(children ?? '')
  const at = email.indexOf('@')

  if (at === -1) return email

  // "christopher.williams" → "christopher", <wbr>, ".williams"
  const localParts = email.slice(0, at).split('.')

  return (
    <>
      {localParts.map((part, i) => (
        <span key={i}>
          {i > 0 && <wbr />}
          {i > 0 && '.'}
          {part}
        </span>
      ))}
      @
      <wbr />
      {email.slice(at + 1)}
    </>
  )
}
