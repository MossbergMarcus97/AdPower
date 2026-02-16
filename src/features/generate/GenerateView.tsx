import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { RangeField } from '../../components/ui/Field'
import { Progress } from '../../components/ui/Progress'
import type { GenerationModeOption, JobStatus } from '../../types'

interface GenerateViewProps {
  modes: GenerationModeOption[]
  selectedMode: string
  targetCount: number
  headlineVariations: number
  visualVariations: number
  status: JobStatus
  stage: string
  progress: number
  loadingMessage: string
  feedbackMessage: string
  debugEnabled: boolean
  onSelectMode: (mode: GenerationModeOption['id']) => void
  onSetTargetCount: (value: number) => void
  onSetHeadlineVariations: (value: number) => void
  onSetVisualVariations: (value: number) => void
  onGenerate: () => void
  onSimulateFailure: () => void
}

function classNames(...names: Array<string | false | undefined>): string {
  return names.filter(Boolean).join(' ')
}

export function GenerateView({
  modes,
  selectedMode,
  targetCount,
  headlineVariations,
  visualVariations,
  status,
  stage,
  progress,
  loadingMessage,
  feedbackMessage,
  debugEnabled,
  onSelectMode,
  onSetTargetCount,
  onSetHeadlineVariations,
  onSetVisualVariations,
  onGenerate,
  onSimulateFailure,
}: GenerateViewProps) {
  return (
    <section className="panel-stack">
      <Card>
        <div className="section-head">
          <h2>Generate Ad Variants</h2>
          <p className="subtle">Modes from UX spec: quick, custom, iterate existing.</p>
        </div>

        <div className="mode-grid">
          {modes.map((mode) => (
            <button
              key={mode.id}
              className={classNames('mode-card', selectedMode === mode.id && 'mode-card-active')}
              onClick={() => onSelectMode(mode.id)}
              type="button"
            >
              <p>{mode.label}</p>
              <span>{mode.description}</span>
            </button>
          ))}
        </div>

        <div className="config-grid">
          <RangeField
            label="Target Variants"
            valueLabel={targetCount}
            min={20}
            max={120}
            step={2}
            value={targetCount}
            onChange={(event) => onSetTargetCount(Number(event.target.value))}
          />

          <RangeField
            label="Headline Variations"
            valueLabel={headlineVariations}
            min={3}
            max={16}
            step={1}
            value={headlineVariations}
            onChange={(event) => onSetHeadlineVariations(Number(event.target.value))}
          />

          <RangeField
            label="Visual Variations"
            valueLabel={visualVariations}
            min={2}
            max={12}
            step={1}
            value={visualVariations}
            onChange={(event) => onSetVisualVariations(Number(event.target.value))}
          />
        </div>

        <div className="generation-status">
          <p className="status-line">
            Status: <strong>{status}</strong>
          </p>
          <p className="status-line">Stage: {stage}</p>
          <p className="status-line">{loadingMessage}</p>
          {feedbackMessage ? <p className="feedback-line">{feedbackMessage}</p> : null}

          <Progress value={progress} ariaLabel="Generation progress" />

          <div className="generation-controls">
            <Button variant="primary" onClick={onGenerate} disabled={status === 'running'}>
              {status === 'running' ? 'Generating...' : 'Generate Variants'}
            </Button>

            {debugEnabled ? (
              <Button variant="secondary" onClick={onSimulateFailure}>
                Simulate Failure
              </Button>
            ) : null}
          </div>
        </div>
      </Card>
    </section>
  )
}
