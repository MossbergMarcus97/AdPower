import { useEffect, useMemo, useState } from 'react'
import {
  baseReviewVariants,
  campaigns,
  generationModes,
  generationStages,
  statCards,
  wizardSteps,
} from '../data'
import {
  errorMessages,
  getGreeting,
  getLoadingMessage,
  successMessages,
} from '../microcopy'
import type {
  AppView,
  CampaignObjective,
  GenerationMode,
  ReviewVariant,
  ThemeDefinition,
} from '../types'

const viewOptions: Array<{ id: AppView; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'campaign', label: 'New Campaign' },
  { id: 'generate', label: 'Generate Variants' },
  { id: 'review', label: 'Review & Export' },
]

type GenerationStatus = 'idle' | 'running' | 'completed' | 'failed'

type TopNavItem = {
  id: string
  label: string
  view: AppView
  step?: number
}

const topNavItems: TopNavItem[] = [
  { id: 'clients', label: 'Clients', view: 'dashboard' },
  { id: 'campaigns', label: 'Campaigns', view: 'campaign' },
  { id: 'generate', label: 'Generate', view: 'generate' },
  { id: 'review', label: 'Review', view: 'review' },
  { id: 'assets', label: 'Assets', view: 'campaign', step: 5 },
]

function classNames(...names: Array<string | false | undefined>): string {
  return names.filter(Boolean).join(' ')
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function formatPercent(progress: number): string {
  return `${Math.max(0, Math.min(progress, 100)).toFixed(0)}%`
}

function statusClass(status: ReviewVariant['status']): string {
  return `status-badge status-${status}`
}

export function VariantWorkspace({ theme }: { theme: ThemeDefinition }) {
  const [view, setView] = useState<AppView>('dashboard')
  const [greeting] = useState(() => getGreeting('Marcus'))

  const [wizardStep, setWizardStep] = useState(0)
  const [objective, setObjective] = useState<CampaignObjective>('Conversion')

  const [generationMode, setGenerationMode] = useState<GenerationMode>('custom')
  const [targetCount, setTargetCount] = useState(48)
  const [headlineVariations, setHeadlineVariations] = useState(8)
  const [visualVariations, setVisualVariations] = useState(6)
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [generationStage, setGenerationStage] = useState(generationStages[0])
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(
    null,
  )
  const [secondsElapsed, setSecondsElapsed] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState(getLoadingMessage(0))
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [actionMessage, setActionMessage] = useState('Swiss Precision is now the active production direction.')

  const [reviewVariants, setReviewVariants] = useState<ReviewVariant[]>(
    baseReviewVariants,
  )
  const [selectedVariants, setSelectedVariants] = useState<string[]>([])

  const [platformMeta, setPlatformMeta] = useState(true)
  const [platformInstagram, setPlatformInstagram] = useState(true)
  const [platformGoogle, setPlatformGoogle] = useState(true)
  const [platformLinkedIn, setPlatformLinkedIn] = useState(false)
  const [exportFormat, setExportFormat] = useState<'PNG' | 'JPG' | 'PDF'>('PNG')
  const [exportGrouping, setExportGrouping] = useState<
    'By Platform' | 'By Variant Group' | 'Flat'
  >('By Platform')

  const selectedCount = selectedVariants.length
  const approvedCount = useMemo(
    () => reviewVariants.filter((variant) => variant.status === 'approved').length,
    [reviewVariants],
  )

  const currentStep = wizardSteps[wizardStep]

  useEffect(() => {
    if (!actionMessage) {
      return
    }

    const timeout = window.setTimeout(() => {
      setActionMessage('')
    }, 3200)

    return () => window.clearTimeout(timeout)
  }, [actionMessage])

  useEffect(() => {
    if (generationStatus !== 'running' || generationStartedAt === null) {
      return
    }

    const interval = window.setInterval(() => {
      const elapsed = Math.max(
        1,
        Math.floor((Date.now() - generationStartedAt) / 1000),
      )
      setSecondsElapsed(elapsed)
      setLoadingMessage(getLoadingMessage(elapsed))

      setProgress((currentProgress) => {
        const nextProgress = Math.min(
          100,
          currentProgress + 6 + Math.floor(Math.random() * 10),
        )
        const stageIndex = Math.min(
          generationStages.length - 1,
          Math.floor((nextProgress / 100) * generationStages.length),
        )
        setGenerationStage(generationStages[stageIndex])

        if (nextProgress >= 100) {
          window.clearInterval(interval)
          setGenerationStatus('completed')
          setFeedbackMessage(pickRandom(successMessages))

          setReviewVariants((previous) => {
            const generated = Array.from({ length: 3 }, (_, index) => {
              const id = `var-generated-${Date.now()}-${index}`
              return {
                id,
                title: `Variant #${(previous.length + index + 1)
                  .toString()
                  .padStart(3, '0')}`,
                headline: `AI concept ${index + 1}: ${theme.label} conversion variant with stronger CTA framing.`,
                cta: ['Build It', 'Launch It', 'Get Started'][index % 3],
                confidence: Number((4 + Math.random() * 0.9).toFixed(1)),
                status: 'pending' as const,
                aiGenerated: true,
              }
            })

            return [...generated, ...previous]
          })

          return 100
        }

        return nextProgress
      })
    }, 750)

    return () => window.clearInterval(interval)
  }, [generationStartedAt, generationStatus, theme.label])

  function startGeneration(): void {
    setView('generate')
    setGenerationStatus('running')
    setProgress(0)
    setGenerationStage(generationStages[0])
    setGenerationStartedAt(Date.now())
    setSecondsElapsed(0)
    setLoadingMessage(getLoadingMessage(0))
    setFeedbackMessage('')
    setActionMessage('Generation queued. We are building a fresh Swiss-precision batch.')
  }

  function simulateFailure(): void {
    setGenerationStatus('failed')
    setFeedbackMessage(pickRandom(errorMessages))
  }

  function retryGeneration(): void {
    startGeneration()
  }

  function openView(nextView: AppView, message?: string, step?: number): void {
    setView(nextView)
    if (typeof step === 'number') {
      setWizardStep(step)
    }
    if (message) {
      setActionMessage(message)
    }
  }

  function navIsActive(item: TopNavItem): boolean {
    if (item.id === 'assets') {
      return view === 'campaign' && wizardStep === 5
    }

    return view === item.view
  }

  function toggleVariantSelection(variantId: string): void {
    setSelectedVariants((previous) =>
      previous.includes(variantId)
        ? previous.filter((id) => id !== variantId)
        : [...previous, variantId],
    )
  }

  function toggleSelectAll(): void {
    if (selectedVariants.length === reviewVariants.length) {
      setSelectedVariants([])
      return
    }

    setSelectedVariants(reviewVariants.map((variant) => variant.id))
  }

  function batchUpdateStatus(status: ReviewVariant['status']): void {
    if (selectedVariants.length === 0) {
      return
    }

    setReviewVariants((previous) =>
      previous.map((variant) =>
        selectedVariants.includes(variant.id) ? { ...variant, status } : variant,
      ),
    )
    setSelectedVariants([])
  }

  function moveStep(direction: 'prev' | 'next'): void {
    if (direction === 'prev') {
      setWizardStep((current) => Math.max(0, current - 1))
      return
    }

    setWizardStep((current) => Math.min(wizardSteps.length - 1, current + 1))
  }

  function queueExportPackage(): void {
    const selectedPlatforms = [
      platformMeta ? 'Meta Ads' : null,
      platformInstagram ? 'Instagram' : null,
      platformGoogle ? 'Google Ads' : null,
      platformLinkedIn ? 'LinkedIn' : null,
    ].filter(Boolean)

    const platformLabel =
      selectedPlatforms.length > 0 ? selectedPlatforms.join(', ') : 'No platform selected'

    setActionMessage(
      `Export package queued: ${platformLabel} · ${exportFormat} · ${exportGrouping}.`,
    )
  }

  return (
    <div className={classNames('variant-shell', theme.className)}>
      <div className="ambient-layer" aria-hidden />

      <header className="top-nav">
        <div className="brand-lockup">
          <p className="brand-name">AdVariant</p>
          <p className="breadcrumbs">Acme Corp / Summer Sale / Workspace</p>
        </div>

        <nav className="top-links" aria-label="Primary">
          {topNavItems.map((item) => (
            <button
              key={item.id}
              className={classNames('nav-pill', navIsActive(item) && 'nav-pill-active')}
              onClick={() =>
                openView(
                  item.view,
                  item.id === 'assets'
                    ? 'Asset setup loaded in Campaign step 6.'
                    : `${item.label} view loaded.`,
                  item.step,
                )
              }
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="top-actions">
          <button
            className="btn btn-ghost"
            onClick={() => openView('generate', 'Quick generation controls opened.')}
            type="button"
          >
            Quick Generate
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => openView('review', 'Review and export workspace opened.')}
            type="button"
          >
            Export Center
          </button>
        </div>
      </header>

      <div className="workspace-grid">
        <aside className="sidebar">
          <section className="sidebar-section">
            <p className="sidebar-title">Workflow</p>
            {viewOptions.map((option) => (
              <button
                key={option.id}
                className={classNames(
                  'sidebar-link',
                  view === option.id && 'sidebar-link-active',
                )}
                onClick={() => openView(option.id, `${option.label} workspace loaded.`)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </section>

          <section className="sidebar-section job-state">
            <p className="sidebar-title">Generation Queue</p>
            <p className="queue-status">{generationStatus.toUpperCase()}</p>
            <p className="queue-stage">{generationStage}</p>
            <div className="progress-track" role="presentation">
              <span style={{ width: formatPercent(progress) }} />
            </div>
            <p className="queue-meta">
              {formatPercent(progress)} complete · {secondsElapsed}s elapsed
            </p>
            <button
              className="btn btn-ai"
              onClick={startGeneration}
              type="button"
              disabled={generationStatus === 'running'}
            >
              {theme.ctaLabel}
            </button>
          </section>
        </aside>

        <main className="main-column">
          <section className="panel hero-panel">
            <p className="kicker">{theme.label}</p>
            <h1>{theme.heroTitle}</h1>
            <p className="hero-subtitle">{theme.heroSubtitle}</p>
            <p className="hero-greeting">{greeting}</p>
            {actionMessage && (
              <p className="action-message" role="status">
                {actionMessage}
              </p>
            )}
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={startGeneration} type="button">
                {theme.ctaLabel}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => openView('campaign', 'Campaign wizard opened.')}
                type="button"
              >
                Create Campaign
              </button>
            </div>
          </section>

          {view === 'dashboard' && (
            <section className="panel-stack">
              <section className="panel">
                <div className="section-head">
                  <h2>Campaign Operations Dashboard</h2>
                  <button
                    className="btn btn-ghost"
                    onClick={() => openView('dashboard', 'Showing all active campaigns.')}
                    type="button"
                  >
                    View All Campaigns
                  </button>
                </div>
                <div className="stats-grid">
                  {statCards.map((stat) => (
                    <article className="stat-card" key={stat.id}>
                      <p className="stat-label">{stat.label}</p>
                      <p className="stat-value">{stat.value}</p>
                      <p className="stat-hint">{stat.hint}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="panel">
                <div className="section-head">
                  <h2>Active Campaigns</h2>
                  <button
                    className="btn btn-ghost"
                    onClick={() => openView('campaign', 'New campaign setup initialized.')}
                    type="button"
                  >
                    + New Campaign
                  </button>
                </div>
                <div className="campaign-grid">
                  {campaigns.map((campaign) => (
                    <article className="campaign-card" key={campaign.id}>
                      <div className="card-row">
                        <p className="campaign-name">{campaign.name}</p>
                        <span className={`status-badge status-${campaign.status.toLowerCase().replace(/ /g, '-')}`}>
                          {campaign.status}
                        </span>
                      </div>
                      <p className="campaign-meta">
                        Objective: {campaign.objective} · Updated {campaign.updated}
                      </p>
                      <p className="campaign-meta">
                        Platforms: {campaign.platforms.join(', ')}
                      </p>
                      <div className="card-row split">
                        <p>{campaign.variantsGenerated} variants</p>
                        <p>{campaign.approved} approved</p>
                      </div>
                      <div className="card-actions">
                        <button className="btn btn-ghost" onClick={startGeneration} type="button">
                          Generate More
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() =>
                            openView('review', `Export workspace opened for ${campaign.name}.`)
                          }
                          type="button"
                        >
                          Export
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </section>
          )}

          {view === 'campaign' && (
            <section className="panel-stack">
              <section className="panel">
                <div className="section-head">
                  <h2>Campaign Creation Wizard (Step {wizardStep + 1}/6)</h2>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setActionMessage('Draft locked in. You can continue anytime.')}
                    type="button"
                  >
                    Save Draft
                  </button>
                </div>

                <div className="wizard-steps" role="tablist" aria-label="Campaign steps">
                  {wizardSteps.map((step, index) => (
                    <button
                      key={step.id}
                      className={classNames(
                        'wizard-step',
                        index === wizardStep && 'wizard-step-active',
                      )}
                      onClick={() => setWizardStep(index)}
                      type="button"
                    >
                      <span>{index + 1}</span>
                      {step.title}
                    </button>
                  ))}
                </div>

                <article className="wizard-panel">
                  <h3>{currentStep.title}</h3>
                  <p>{currentStep.detail}</p>
                  <ul>
                    {currentStep.fields.map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                  <div className="ai-note">
                    <p>AI Assist</p>
                    <strong>{currentStep.aiAssist}</strong>
                  </div>
                  <div className="objective-toggle" role="group" aria-label="Objective selection">
                    {(['Awareness', 'Consideration', 'Conversion'] as CampaignObjective[]).map((item) => (
                      <button
                        key={item}
                        className={classNames('objective-pill', objective === item && 'objective-pill-active')}
                        onClick={() => setObjective(item)}
                        type="button"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </article>

                <div className="wizard-controls">
                  <button
                    className="btn btn-secondary"
                    onClick={() => moveStep('prev')}
                    type="button"
                    disabled={wizardStep === 0}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => moveStep('next')}
                    type="button"
                    disabled={wizardStep === wizardSteps.length - 1}
                  >
                    Next Step
                  </button>
                </div>
              </section>
            </section>
          )}

          {view === 'generate' && (
            <section className="panel-stack">
              <section className="panel">
                <div className="section-head">
                  <h2>Generate Ad Variants</h2>
                  <p className="subtle">Modes from UX spec: quick, custom, iterate existing.</p>
                </div>

                <div className="mode-grid">
                  {generationModes.map((mode) => (
                    <button
                      key={mode.id}
                      className={classNames(
                        'mode-card',
                        generationMode === mode.id && 'mode-card-active',
                      )}
                      onClick={() => setGenerationMode(mode.id)}
                      type="button"
                    >
                      <p>{mode.label}</p>
                      <span>{mode.description}</span>
                    </button>
                  ))}
                </div>

                <div className="config-grid">
                  <label>
                    Target Variants: <strong>{targetCount}</strong>
                    <input
                      type="range"
                      min={20}
                      max={120}
                      step={2}
                      value={targetCount}
                      onChange={(event) => setTargetCount(Number(event.target.value))}
                    />
                  </label>

                  <label>
                    Headline Variations: <strong>{headlineVariations}</strong>
                    <input
                      type="range"
                      min={3}
                      max={16}
                      step={1}
                      value={headlineVariations}
                      onChange={(event) => setHeadlineVariations(Number(event.target.value))}
                    />
                  </label>

                  <label>
                    Visual Variations: <strong>{visualVariations}</strong>
                    <input
                      type="range"
                      min={2}
                      max={12}
                      step={1}
                      value={visualVariations}
                      onChange={(event) => setVisualVariations(Number(event.target.value))}
                    />
                  </label>
                </div>

                <div className="generation-status">
                  <p className="status-line">
                    Status: <strong>{generationStatus}</strong>
                  </p>
                  <p className="status-line">Stage: {generationStage}</p>
                  <p className="status-line">{loadingMessage}</p>
                  {feedbackMessage && <p className="feedback-line">{feedbackMessage}</p>}

                  <div className="progress-track" role="presentation">
                    <span style={{ width: formatPercent(progress) }} />
                  </div>

                  <div className="generation-controls">
                    <button
                      className="btn btn-primary"
                      onClick={startGeneration}
                      type="button"
                      disabled={generationStatus === 'running'}
                    >
                      {generationStatus === 'running' ? 'Generating...' : 'Generate Variants'}
                    </button>
                    <button className="btn btn-secondary" onClick={simulateFailure} type="button">
                      Simulate Failure
                    </button>
                    {generationStatus === 'failed' && (
                      <button className="btn btn-ai" onClick={retryGeneration} type="button">
                        Retry Generation
                      </button>
                    )}
                  </div>
                </div>
              </section>
            </section>
          )}

          {view === 'review' && (
            <section className="panel-stack">
              <section className="panel">
                <div className="section-head">
                  <h2>Review Grid & Batch Actions</h2>
                  <div className="batch-controls">
                    <button className="btn btn-ghost" onClick={toggleSelectAll} type="button">
                      {selectedCount === reviewVariants.length ? 'Clear All' : 'Select All'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => batchUpdateStatus('approved')} type="button">
                      Approve Selected
                    </button>
                    <button className="btn btn-secondary" onClick={() => batchUpdateStatus('rejected')} type="button">
                      Reject Selected
                    </button>
                  </div>
                </div>

                <p className="subtle">
                  {approvedCount} approved · {selectedCount} selected · AI confidence highlights shown per variant.
                </p>

                <div className="review-grid">
                  {reviewVariants.map((variant) => {
                    const selected = selectedVariants.includes(variant.id)
                    return (
                      <article
                        key={variant.id}
                        className={classNames('review-card', selected && 'review-card-selected')}
                      >
                        <div className="card-row">
                          <label className="checkbox-line">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleVariantSelection(variant.id)}
                            />
                            <span>{variant.title}</span>
                          </label>
                          <span className={statusClass(variant.status)}>{variant.status}</span>
                        </div>
                        <p className="variant-headline">{variant.headline}</p>
                        <div className="card-row split">
                          <p>CTA: {variant.cta}</p>
                          <p>Confidence {variant.confidence}/5</p>
                        </div>
                        {variant.aiGenerated && <span className="ai-chip">AI Generated</span>}
                      </article>
                    )
                  })}
                </div>
              </section>

              <section className="panel">
                <div className="section-head">
                  <h2>Export Configuration</h2>
                  <button className="btn btn-primary" onClick={queueExportPackage} type="button">
                    Generate Export Package
                  </button>
                </div>

                <div className="export-grid">
                  <article>
                    <p className="export-label">Platforms</p>
                    <label>
                      <input
                        checked={platformMeta}
                        onChange={(event) => setPlatformMeta(event.target.checked)}
                        type="checkbox"
                      />
                      Meta Ads
                    </label>
                    <label>
                      <input
                        checked={platformInstagram}
                        onChange={(event) => setPlatformInstagram(event.target.checked)}
                        type="checkbox"
                      />
                      Instagram
                    </label>
                    <label>
                      <input
                        checked={platformGoogle}
                        onChange={(event) => setPlatformGoogle(event.target.checked)}
                        type="checkbox"
                      />
                      Google Ads
                    </label>
                    <label>
                      <input
                        checked={platformLinkedIn}
                        onChange={(event) => setPlatformLinkedIn(event.target.checked)}
                        type="checkbox"
                      />
                      LinkedIn
                    </label>
                  </article>

                  <article>
                    <p className="export-label">Format</p>
                    {(['PNG', 'JPG', 'PDF'] as const).map((format) => (
                      <label key={format}>
                        <input
                          checked={exportFormat === format}
                          onChange={() => setExportFormat(format)}
                          type="radio"
                          name="export-format"
                        />
                        {format}
                      </label>
                    ))}
                  </article>

                  <article>
                    <p className="export-label">Organization</p>
                    {(['By Platform', 'By Variant Group', 'Flat'] as const).map((grouping) => (
                      <label key={grouping}>
                        <input
                          checked={exportGrouping === grouping}
                          onChange={() => setExportGrouping(grouping)}
                          type="radio"
                          name="export-grouping"
                        />
                        {grouping}
                      </label>
                    ))}
                  </article>
                </div>
              </section>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
