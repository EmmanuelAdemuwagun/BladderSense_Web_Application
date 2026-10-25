import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/*
 * Scrolls the window back to the top whenever the user moves to a new page.
 *
 * In a single-page app the browser keeps the previous page's scroll position,
 * so tapping a guide card halfway down the dashboard would otherwise open the
 * guide section halfway down too. Back/forward navigation (POP) is left alone
 * so the browser can restore where the user was.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    // A #link (e.g. /profile#text-size) scrolls to its own target
    if (navigationType !== 'POP' && !hash) {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash, navigationType])

  return null
}
