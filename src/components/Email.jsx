/*
 * Shows an email address that, when it is too long for a phone screen,
 * wraps neatly after the "@" instead of in the middle of a word.
 */
export default function Email({ children }) {
  const email = String(children ?? '')
  const at = email.indexOf('@')

  if (at === -1) return email

  return (
    <>
      {email.slice(0, at + 1)}
      <wbr />
      {email.slice(at + 1)}
    </>
  )
}
