import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { SITE, PAGE_BY_PATH, PRIVATE_PATHS, GUIDE_TITLES } from '../content/seo.mjs'

/*
 * Keeps the document <head> in sync with the current route:
 * title, meta description, canonical, robots, and Open Graph / Twitter tags.
 *
 * Rendered once, high in the tree (inside the Router). On every navigation it
 * updates the head so each page has its own title and description — which is
 * what search engines read when they render the app.
 */

function setMeta(attr, key, content) {
  if (content == null) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export default function Seo() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Normalize a trailing slash so "/register/" matches "/register".
    const path = pathname !== '/' ? pathname.replace(/\/+$/, '') : '/'
    const page = PAGE_BY_PATH[path]

    // Guide pages and the app screens are login-gated → keep them out of search.
    const isGuide = path.startsWith('/guide/')
    const isPrivate =
      isGuide ||
      PRIVATE_PATHS.some((p) => path === p || path.startsWith(p + '/'))

    const title =
      page?.title ||
      GUIDE_TITLES[path] ||
      `${SITE.name} — Bladder Health Guide for Men`
    const description =
      page?.description ||
      'A practical, self-paced bladder health guide for older men.'
    const url = SITE.origin + (path === '/' ? '/' : path)

    document.title = title
    setMeta('name', 'description', description)

    // Private/login-gated screens: ask engines not to index them.
    setMeta(
      'name',
      'robots',
      isPrivate
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    )

    // Canonical only for known public pages; for anything else point at home.
    setCanonical(page ? url : SITE.origin + '/')

    // Open Graph + Twitter (only meaningful for public pages, harmless otherwise)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', page ? url : SITE.origin + '/')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
  }, [pathname])

  return null
}
