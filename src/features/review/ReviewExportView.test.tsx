import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ReviewVariant } from '../../types'
import { ReviewExportView } from './ReviewExportView'

const variants: ReviewVariant[] = [
  {
    id: 'var-1',
    title: 'Variant #001',
    headline: 'Test headline 1',
    cta: 'CTA 1',
    confidence: 4.4,
    status: 'pending',
    aiGenerated: true,
  },
  {
    id: 'var-2',
    title: 'Variant #002',
    headline: 'Test headline 2',
    cta: 'CTA 2',
    confidence: 4.2,
    status: 'approved',
    aiGenerated: true,
  },
]

describe('ReviewExportView', () => {
  it('handles review batch actions and export selection updates', async () => {
    const user = userEvent.setup()
    const onToggleSelectAll = vi.fn()
    const onBatchStatusUpdate = vi.fn()
    const onUpdateExportSettings = vi.fn()

    render(
      <ReviewExportView
        variants={variants}
        selectedVariantIds={['var-1']}
        approvedCount={1}
        onToggleSelectAll={onToggleSelectAll}
        onToggleVariantSelection={vi.fn()}
        onBatchStatusUpdate={onBatchStatusUpdate}
        onVariantStatusUpdate={vi.fn()}
        exportSettings={{
          meta: true,
          instagram: false,
          google: true,
          linkedIn: false,
          format: 'PNG',
          grouping: 'By Platform',
        }}
        onUpdateExportSettings={onUpdateExportSettings}
        onQueueExport={vi.fn()}
        isLoading={false}
        errorMessage={null}
      />, 
    )

    await user.click(screen.getByRole('button', { name: 'Clear All' }))
    expect(onToggleSelectAll).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Approve Selected' }))
    expect(onBatchStatusUpdate).toHaveBeenCalledWith('approved')

    await user.click(screen.getByRole('checkbox', { name: 'Instagram' }))
    expect(onUpdateExportSettings).toHaveBeenCalledWith({ instagram: true })

    await user.click(screen.getByRole('radio', { name: 'PDF' }))
    expect(onUpdateExportSettings).toHaveBeenCalledWith({ format: 'PDF' })
  })
})
