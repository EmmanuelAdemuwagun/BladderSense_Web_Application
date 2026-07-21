import { useNavigate } from 'react-router-dom'
import { getSession } from '../utils/auth'

const areas = [
  {
    icon: '🌙',
    title: 'Night-time Urination & Fluid Balance',
    desc: 'Learn practical ways to manage fluid timing, evening habits, and night-time routines that may support better sleep and fewer interruptions.',
  },
  {
    icon: '🛏️',
    title: 'Sleep & Rest',
    desc: 'Improve sleep habits that may support both better rest and better bladder symptom management.',
  },
  {
    icon: '🚶',
    title: 'Movement, Activity & Healthy Weight',
    desc: 'Build confidence, mobility, strength, and healthy daily habits through gentle activity and movement.',
  },
  {
    icon: '🧠',
    title: 'Stress, Worry & Emotional Wellbeing',
    desc: 'Discover practical strategies that may help reduce stress, improve confidence, and make symptoms feel easier to manage.',
  },
]

const steps = [
  { number: '1', title: 'Register', desc: 'Create your free account in less than a minute.' },
  { number: '2', title: 'Explore Your Guide', desc: 'Choose the sections that matter most to you and work through them at your own pace.' },
  { number: '3', title: 'Create Your Personal Plan', desc: 'Select one or two areas to focus on and set small, realistic goals that fit your daily life.' },
  { number: '4', title: 'Track Your Progress', desc: 'Monitor symptoms, sleep, activity, and habits to identify patterns and celebrate improvements over time.' },
]

const whoFor = [
  'Men who wake up frequently during the night to urinate',
  'Men who experience urgency, leakage, or reduced bladder control',
  'Men who feel less confident leaving home because of bladder symptoms',
  'Men who want practical self-management strategies',
  'Men who want to improve sleep, confidence, and daily wellbeing',
  'Men who prefer small, manageable lifestyle changes',
  'Men who want to take an active role in improving their bladder health',
]

const whyUse = [
  'Easy-to-follow guidance',
  'Practical strategies you can try at home',
  'Personal goal setting',
  'Progress tracking and symptom monitoring',
  'Private and self-paced',
  'Designed specifically for older men',
]

export default function Landing() {
  const navigate = useNavigate()
  const isLoggedIn = !!getSession()

  return (
    <div className="landing">

      {/* ── Top nav bar ── */}
      <nav className="landing-nav">
        <div className="landing-nav__inner">
          <div className="landing-nav__brand">
            <img src="/logo-icon.png" alt="Bladder Sense" className="landing-nav__logo" />
            <span className="landing-nav__brand-text">
              <span className="landing-nav__name">Bladder Sense</span>
              <span className="landing-nav__tagline">Better Days. Better Nights.</span>
            </span>
          </div>
          <div className="landing-nav__actions">
            {isLoggedIn ? (
              <button className="btn btn--primary landing-nav__btn" onClick={() => navigate('/dashboard')}>
                Go to My Guide
              </button>
            ) : (
              <>
                <button className="btn btn--secondary landing-nav__btn" onClick={() => navigate('/signin')}>
                  Sign In
                </button>
                <button className="btn btn--primary landing-nav__btn" onClick={() => navigate('/register')}>
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-container">
          <img src="/homepage-logo.png" alt="Bladder Sense" className="landing-hero__logo" />

          <p className="landing-hero__tagline-main">
            Small Steps. Better Control. Less Confidence.
          </p>

          <div className="landing-hero__trust">
            For Men &nbsp;•&nbsp; Developed With Clinical Expertise &nbsp;•&nbsp; Free to Use
          </div>

          <h1 className="landing-hero__title">Managing Bladder Control Made Simpler</h1>

          <p className="landing-hero__subtitle">
            A practical, private self-management guide designed to help older men improve bladder control,
            sleep, confidence, and daily wellbeing through small, manageable changes.
          </p>
          <p className="landing-hero__subtitle" style={{ marginTop: 12 }}>
            Learn what may be affecting your symptoms, choose strategies that fit your lifestyle,
            and track your progress over time.
          </p>

          <div className="landing-hero__cta">
            {isLoggedIn ? (
              <button className="btn btn--primary landing-cta-btn" onClick={() => navigate('/dashboard')}>
                Go to My Guide
              </button>
            ) : (
              <>
                <button className="btn btn--primary landing-cta-btn" onClick={() => navigate('/register')}>
                  Register — It's Free
                </button>
                <button className="btn btn--ghost-light landing-cta-btn" onClick={() => navigate('/signin')}>
                  Already registered? Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── You Are Not Alone ── */}
      <section className="landing-section landing-section--light">
        <div className="landing-container">
          <div className="landing-reassure">
            <div className="landing-reassure__icon" aria-hidden="true">🤝</div>
            <div>
              <h2 className="landing-section__title">You Are Not Alone</h2>
              <p className="landing-section__text">
                Many older men experience urinary incontinence (loss of bladder control).
              </p>
              <p className="landing-section__text">You may notice:</p>
              <ul className="landing-list">
                <li>urine leakage</li>
                <li>rushing urgently to the toilet</li>
                <li>waking multiple times during the night to urinate</li>
                <li>concerns about possible accidents</li>
              </ul>
              <p className="landing-section__text">
                These symptoms can affect sleep, confidence, daily activities, emotional wellbeing,
                and overall quality of life.
              </p>
              <p className="landing-section__text">
                <strong>The good news is that small, practical changes can make a meaningful difference over time.</strong>
              </p>
              <p className="landing-section__text">
                Bladder Sense helps you understand factors that may be affecting your bladder control and
                supports you in making gradual, manageable changes that fit your daily life.
              </p>
              <p className="landing-section__text">
                There is no need to change everything at once. Start with one area that feels most relevant
                to you and build from there.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 Areas ── */}
      <section className="landing-section">
        <div className="landing-container">
          <h2 className="landing-section__title text-center">Four Areas That Can Make a Difference</h2>
          <p className="landing-section__text text-center" style={{ marginBottom: 32 }}>
            These four areas were selected because they are common concerns in older men,
            are often linked to urinary symptoms, and are areas many people feel willing and able to work on.
          </p>
          <div className="landing-areas">
            {areas.map((area) => (
              <div key={area.title} className="landing-area-card">
                <div className="landing-area-card__icon" aria-hidden="true">{area.icon}</div>
                <h3 className="landing-area-card__title">{area.title}</h3>
                <p className="landing-area-card__desc">{area.desc}</p>
              </div>
            ))}
          </div>
          <div className="landing-tip">
            💡 You do not need to work on all four areas. Start with the one that feels most relevant to you.
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="landing-section landing-section--light">
        <div className="landing-container">
          <h2 className="landing-section__title text-center">How Bladder Sense Works</h2>
          <div className="landing-steps">
            {steps.map((step) => (
              <div key={step.title} className="landing-step">
                <div className="landing-step__number">{step.number}</div>
                <h3 className="landing-step__title">{step.title}</h3>
                <p className="landing-step__desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="landing-section">
        <div className="landing-container">
          <h2 className="landing-section__title text-center">Who Is Bladder Sense For?</h2>
          <div className="landing-whofor">
            {whoFor.map((item) => (
              <div key={item} className="landing-whofor__item">
                <span className="landing-whofor__check" aria-hidden="true">✔</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Use ── */}
      <section className="landing-section landing-section--light">
        <div className="landing-container">
          <h2 className="landing-section__title text-center">Why Use Bladder Sense?</h2>
          <div className="landing-whofor">
            {whyUse.map((item) => (
              <div key={item} className="landing-whofor__item">
                <span className="landing-whofor__check" aria-hidden="true">✔</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="landing-section landing-section--dark">
        <div className="landing-container text-center">
          <h2 style={{ color: '#fff', marginBottom: 12 }}>Ready to Get Started?</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'var(--font-size-base)', marginBottom: 8 }}>
            Small steps today can lead to meaningful improvements in bladder control,
            sleep, confidence, and quality of life over time.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'var(--font-size-sm)', marginBottom: 32 }}>
            Free to use &nbsp;•&nbsp; Private &nbsp;•&nbsp; Designed for older men
          </p>
          {isLoggedIn ? (
            <button className="btn btn--primary landing-cta-btn" onClick={() => navigate('/dashboard')}>
              Go to My Guide
            </button>
          ) : (
            <div className="btn-stack" style={{ maxWidth: 400, margin: '0 auto' }}>
              <button className="btn landing-cta-btn" style={{ background: '#fff', color: 'var(--color-primary)', fontWeight: 700 }} onClick={() => navigate('/register')}>
                Register — It's Free
              </button>
              <button className="btn btn--ghost-light landing-cta-btn" onClick={() => navigate('/signin')}>
                Already registered? Sign In
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <p>© 2026 Bladder Sense &nbsp;·&nbsp; Private &amp; Secure &nbsp;·&nbsp; Designed for older men</p>
      </footer>

    </div>
  )
}
