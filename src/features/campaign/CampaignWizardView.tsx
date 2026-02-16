import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import type { CampaignObjective, WizardStep } from '../../types'

interface CampaignWizardViewProps {
  steps: WizardStep[]
  stepIndex: number
  objective: CampaignObjective
  onSetStep: (stepIndex: number) => void
  onSetObjective: (objective: CampaignObjective) => void
  onMoveStep: (direction: 'prev' | 'next') => void
  onSaveDraft: () => void
}

function classNames(...names: Array<string | false | undefined>): string {
  return names.filter(Boolean).join(' ')
}

const objectiveOptions: CampaignObjective[] = [
  'Awareness',
  'Consideration',
  'Conversion',
]

export function CampaignWizardView({
  steps,
  stepIndex,
  objective,
  onSetStep,
  onSetObjective,
  onMoveStep,
  onSaveDraft,
}: CampaignWizardViewProps) {
  const step = steps[stepIndex]

  return (
    <section className="panel-stack">
      <Card>
        <div className="section-head">
          <h2>Campaign Creation Wizard (Step {stepIndex + 1}/6)</h2>
          <Button variant="ghost" onClick={onSaveDraft}>
            Save Draft
          </Button>
        </div>

        <div className="wizard-steps" role="tablist" aria-label="Campaign steps">
          {steps.map((item, index) => (
            <button
              key={item.id}
              className={classNames('wizard-step', index === stepIndex && 'wizard-step-active')}
              onClick={() => onSetStep(index)}
              type="button"
              role="tab"
              aria-selected={index === stepIndex}
              aria-label={`${index + 1} ${item.title}`}
            >
              <span>{index + 1}</span>
              {item.title}
            </button>
          ))}
        </div>

        <article className="wizard-panel">
          <h3>{step.title}</h3>
          <p>{step.detail}</p>
          <ul>
            {step.fields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>

          <div className="ai-note">
            <p>AI Assist</p>
            <strong>{step.aiAssist}</strong>
          </div>

          <div className="objective-toggle" role="group" aria-label="Objective selection">
            {objectiveOptions.map((option) => (
              <button
                key={option}
                className={classNames(
                  'objective-pill',
                  objective === option && 'objective-pill-active',
                )}
                onClick={() => onSetObjective(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        </article>

        <div className="wizard-controls">
          <Button
            variant="secondary"
            onClick={() => onMoveStep('prev')}
            disabled={stepIndex === 0}
          >
            Previous
          </Button>
          <Button
            variant="primary"
            onClick={() => onMoveStep('next')}
            disabled={stepIndex === steps.length - 1}
          >
            Next Step
          </Button>
        </div>
      </Card>
    </section>
  )
}
