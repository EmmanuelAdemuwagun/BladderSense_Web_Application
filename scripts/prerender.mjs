/*
 * Post-build prerender (no browser required).
 *
 * Vite outputs a single dist/index.html for the SPA. Search engines that do
 * not fully render JavaScript (notably Bing) then see the same title,
 * description, and empty body on every route. This script fixes that by
 * writing a static HTML file per public route with:
 *   - a route-specific <title>, meta description, canonical, and Open Graph tags
 *   - a crawlable <noscript> block with the page heading and intro text
 *
 * The React app still boots normally on top of these files, so users get the
 * full interactive experience; crawlers get real per-page HTML.
 *
 * It also regenerates dist/sitemap.xml with today's date.
 *
 * Pure Node string operations — safe to run in the Netlify build.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE, PAGES } from '../src/content/seo.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dirname, '..', 'dist')
const INDEX = join(DIST, 'index.html')

function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function replaceMetaByName(html, name, content) {
  const re = new RegExp(`<meta[^>]*\\bname="${name}"[^>]*>`)
  const tag = `<meta name="${name}" content="${esc(content)}" />`
  return re.test(html) ? html.replace(re, tag) : html
}

function replaceMetaByProp(html, prop, content) {
  const re = new RegExp(`<meta[^>]*\\bproperty="${prop}"[^>]*>`)
  const tag = `<meta property="${prop}" content="${esc(content)}" />`
  return re.test(html) ? html.replace(re, tag) : html
}

function buildPageHtml(baseHtml, page) {
  const url = SITE.origin + page.path
  let html = baseHtml

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`)
  html = replaceMetaByName(html, 'description', page.description)
  html = replaceMetaByProp(html, 'og:title', page.title)
  html = replaceMetaByProp(html, 'og:description', page.description)
  html = replaceMetaByProp(html, 'og:url', url)
  html = replaceMetaByName(html, 'twitter:title', page.title)
  html = replaceMetaByName(html, 'twitter:description', page.description)
  html = html.replace(
    /<link[^>]*rel="canonical"[^>]*>/,
    `<link rel="canonical" href="${esc(url)}" />`
  )

  const noscript =
    `<noscript>` +
    `<main style="max-width:720px;margin:0 auto;padding:24px;` +
    `font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.6;color:#1a1a1a;">` +
    `<h1>${esc(page.h1)}</h1>` +
    `<p>${esc(page.intro)}</p>` +
    `<p><a href="/">BladderSense home</a> &middot; ` +
    `<a href="/register">Create a free account</a> &middot; ` +
    `<a href="/signin">Sign in</a></p>` +
    `</main></noscript>`
  html = html.replace(/<noscript>[\s\S]*?<\/noscript>/, noscript)

  return html
}

function generateSitemap() {
  const today = new Date().toISOString().slice(0, 10)
  const urls = PAGES.map(
    (p) =>
      `  <url>\n` +
      `    <loc>${SITE.origin}${p.path}</loc>\n` +
      `    <lastmod>${today}</lastmod>\n` +
      `    <changefreq>${p.changefreq || 'monthly'}</changefreq>\n` +
      `    <priority>${(p.priority ?? 0.6).toFixed(1)}</priority>\n` +
      `  </url>`
  ).join('\n')

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls}\n` +
    `</urlset>\n`
  )
}

function main() {
  let baseHtml
  try {
    baseHtml = readFileSync(INDEX, 'utf8')
  } catch {
    console.warn('[prerender] dist/index.html not found — skipping prerender.')
    return
  }

  let count = 0
  for (const page of PAGES) {
    // '/' is already dist/index.html (hand-authored head) — leave it as-is.
    if (page.path === '/') continue

    const html = buildPageHtml(baseHtml, page)
    const outFile = join(DIST, page.path.replace(/^\//, ''), 'index.html')
    mkdirSync(dirname(outFile), { recursive: true })
    writeFileSync(outFile, html, 'utf8')
    count++
  }

  writeFileSync(join(DIST, 'sitemap.xml'), generateSitemap(), 'utf8')

  console.log(
    `[prerender] Wrote ${count} static route pages and refreshed sitemap.xml`
  )
}

try {
  main()
} catch (err) {
  // Never fail the production build over prerendering — log and move on.
  console.warn('[prerender] Skipped due to error:', err?.message || err)
}
