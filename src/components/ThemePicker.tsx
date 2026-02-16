import { Link } from 'react-router-dom'
import { themes } from '../data'

function ThemePreview({ className }: { className: string }) {
  return (
    <div className={`theme-preview ${className}`} aria-hidden>
      <div className="preview-top" />
      <div className="preview-grid">
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}

export function ThemePicker() {
  return (
    <div className="picker-shell">
      <header className="picker-header">
        <p className="kicker">AdVariant v1.0 Prototype</p>
        <h1>Choose A Visual Direction</h1>
        <p>
          Each option below uses a separate design system and interaction language
          while preserving the same product workflow.
        </p>
      </header>

      <section className="picker-grid" aria-label="Visual variants">
        {themes.map((theme) => (
          <article key={theme.id} className="picker-card">
            <ThemePreview className={theme.className} />
            <div className="picker-card-body">
              <p className="picker-label">{theme.label}</p>
              <p className="picker-tagline">{theme.tagline}</p>
              <p className="picker-summary">{theme.summary}</p>
              <Link className="picker-link" to={`/${theme.route}`}>
                Open {theme.label}
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="picker-footnote" aria-label="Included scope">
        <h2>Included from the specification</h2>
        <ul>
          <li>Client → Campaign → Ad hierarchy context and navigation</li>
          <li>6-step campaign setup wizard with AI assistance surfaces</li>
          <li>Generation modes (quick, custom, iterate) with job progress states</li>
          <li>Review grid with confidence scoring, status, and export settings</li>
          <li>Personality microcopy with contextual greetings and loading text</li>
        </ul>
      </section>
    </div>
  )
}
