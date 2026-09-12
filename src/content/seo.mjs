// Single source of truth for per-page SEO.
//
// Used in three places so nothing drifts:
//   1. The client <Seo> component (sets <title>/<meta> per route at runtime)
//   2. scripts/prerender.mjs (writes static per-route HTML at build time)
//   3. scripts/prerender.mjs (regenerates sitemap.xml)
//
// This is an .mjs file so it can be imported cleanly by both Vite (client)
// and a plain Node build script.
//
// NOTE: The guide pages require a signed-in session (GuideSection redirects
// logged-out visitors home), so they are intentionally NOT indexable and are
// kept out of PAGES, the sitemap, and the prerender. They are marked noindex
// and blocked in robots.txt. If the guide is ever made public, move those
// routes into PAGES.

export const SITE = {
  origin: 'https://bladdersense.com',
  name: 'BladderSense',
  image: 'https://bladdersense.com/homepage-logo.png',
  imageAlt: 'BladderSense — Better Days. Better Nights.',
}

// Public, indexable pages. `intro` is the crawlable sentence injected into the
// static HTML (helps engines that do not run JavaScript, e.g. Bing).
export const PAGES = [
  {
    path: '/',
    title: 'BladderSense — Bladder Health Guide for Men | Better Days, Better Nights',
    description:
      'BladderSense is a practical, self-paced bladder health guide for older men — improve night-time urination, sleep, and bladder control through small daily changes. Free, private, and easy to follow.',
    h1: 'BladderSense — Bladder Health Guide for Men',
    intro:
      'A practical, self-paced guide that helps older men improve bladder control, reduce night-time urination, sleep better, and feel more confident through small daily changes.',
    priority: 1.0,
    changefreq: 'weekly',
  },
  {
    path: '/register',
    title: 'Create Your Free Account | BladderSense',
    description:
      'Register for a free, private BladderSense account and start improving your bladder control, sleep, and confidence with a simple self-paced guide for older men.',
    h1: 'Create Your Free Account',
    intro:
      'Create a free, private BladderSense account in under a minute and start your personal bladder health plan.',
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: '/signin',
    title: 'Sign In | BladderSense',
    description:
      'Sign in to your BladderSense account to track symptoms, follow your guide, and view your progress.',
    h1: 'Sign In',
    intro: 'Sign in to your BladderSense account to continue your bladder health journey.',
    priority: 0.5,
    changefreq: 'monthly',
  },
]

// Private / login-gated routes: keep them out of search results (noindex).
export const PRIVATE_PATHS = [
  '/dashboard',
  '/profile',
  '/daily-tracking',
  '/progress',
  '/verify-registration',
]

// The guide is login-gated too. Titles here are only for the browser tab (UX)
// when a signed-in reader views a section; these routes are noindex.
export const GUIDE_TITLES = {
  '/guide/welcome': 'Welcome | BladderSense',
  '/guide/why-4-areas': 'Why These 4 Areas? | BladderSense',
  '/guide/how-to-use': 'How to Use This Guide | BladderSense',
  '/guide/night-time': 'Night-time Urination & Fluid Balance | BladderSense',
  '/guide/sleep': 'Sleep & Rest | BladderSense',
  '/guide/movement': 'Movement, Activity & Healthy Weight | BladderSense',
  '/guide/stress': 'Stress, Worry & Emotional Wellbeing | BladderSense',
  '/guide/pelvic-floor': 'Pelvic Floor Exercises | BladderSense',
  '/guide/practical-support': 'Practical Support & Products | BladderSense',
  '/guide/personal-plan': 'My Personal Plan | BladderSense',
  '/guide/tips': 'Tips for Success | BladderSense',
  '/guide/seek-help': 'When to Seek Medical Help | BladderSense',
  '/guide/final-message': 'Final Message | BladderSense',
}

// Convenience lookup by path.
export const PAGE_BY_PATH = Object.fromEntries(PAGES.map((p) => [p.path, p]))
