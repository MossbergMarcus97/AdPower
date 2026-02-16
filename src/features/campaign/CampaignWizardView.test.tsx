import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { wizardSteps } from '../../data'
import { CampaignWizardView } from './CampaignWizardView'

describe('CampaignWizardView', () => {
  it('triggers step navigation callbacks', async () => {
    const user = userEvent.setup()
    const onSetStep = vi.fn()
    const onMoveStep = vi.fn()

    render(
      <CampaignWizardView
        steps={wizardSteps}
        stepIndex={0}
        objective="Conversion"
        onSetStep={onSetStep}
        onSetObjective={vi.fn()}
        onMoveStep={onMoveStep}
        onSaveDraft={vi.fn()}
      />, 
    )

    await user.click(screen.getByRole('tab', { name: /2 Objective Selection/i }))
    expect(onSetStep).toHaveBeenCalledWith(1)

    await user.click(screen.getByRole('button', { name: 'Next Step' }))
    expect(onMoveStep).toHaveBeenCalledWith('next')
  })
})
