import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ChoiceField } from '../../components/ui/Field'
import type { ExportSettings, ReviewVariant, VariantStatus } from '../../types'

interface ReviewExportViewProps {
  variants: ReviewVariant[]
  selectedVariantIds: string[]
  approvedCount: number
  onToggleSelectAll: () => void
  onToggleVariantSelection: (variantId: string) => void
  onBatchStatusUpdate: (status: VariantStatus) => void
  onVariantStatusUpdate: (variantId: string, status: VariantStatus) => void
  exportSettings: ExportSettings
  onUpdateExportSettings: (settings: Partial<ExportSettings>) => void
  onQueueExport: () => void
  isLoading: boolean
  errorMessage: string | null
}

function classNames(...names: Array<string | false | undefined>): string {
  return names.filter(Boolean).join(' ')
}

function variantStatusTone(status: VariantStatus): 'approved' | 'pending' | 'rejected' {
  return status
}

export function ReviewExportView({
  variants,
  selectedVariantIds,
  approvedCount,
  onToggleSelectAll,
  onToggleVariantSelection,
  onBatchStatusUpdate,
  onVariantStatusUpdate,
  exportSettings,
  onUpdateExportSettings,
  onQueueExport,
  isLoading,
  errorMessage,
}: ReviewExportViewProps) {
  return (
    <section className="panel-stack">
      <Card>
        <div className="section-head">
          <h2>Review Grid & Batch Actions</h2>
          <div className="batch-controls">
            <Button variant="ghost" onClick={onToggleSelectAll}>
              {selectedVariantIds.length > 0 ? 'Clear All' : 'Select All'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => onBatchStatusUpdate('approved')}
              disabled={selectedVariantIds.length === 0}
            >
              Approve Selected
            </Button>
            <Button
              variant="secondary"
              onClick={() => onBatchStatusUpdate('rejected')}
              disabled={selectedVariantIds.length === 0}
            >
              Reject Selected
            </Button>
          </div>
        </div>

        <p className="subtle">
          {approvedCount} approved · {selectedVariantIds.length} selected · AI confidence highlights shown per variant.
        </p>

        {isLoading ? (
          <p className="empty-state">Loading variants...</p>
        ) : errorMessage ? (
          <p className="empty-state error" role="alert">
            {errorMessage}
          </p>
        ) : variants.length === 0 ? (
          <p className="empty-state">No variants yet. Generate a batch to start review.</p>
        ) : (
          <div className="review-grid">
            {variants.map((variant) => {
              const selected = selectedVariantIds.includes(variant.id)

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
                        onChange={() => onToggleVariantSelection(variant.id)}
                      />
                      <span>{variant.title}</span>
                    </label>

                    <Badge tone={variantStatusTone(variant.status)}>{variant.status}</Badge>
                  </div>

                  <p className="variant-headline">{variant.headline}</p>
                  {variant.body ? <p className="campaign-meta">{variant.body}</p> : null}

                  <div className="card-row split">
                    <p>CTA: {variant.cta}</p>
                    <p>Confidence {variant.confidence.toFixed(1)}/5</p>
                  </div>

                  <div className="card-actions">
                    <Button
                      variant="ghost"
                      onClick={() => onVariantStatusUpdate(variant.id, 'approved')}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => onVariantStatusUpdate(variant.id, 'rejected')}
                    >
                      Reject
                    </Button>
                  </div>

                  {variant.aiGenerated ? <span className="ai-chip">AI Generated</span> : null}
                </article>
              )
            })}
          </div>
        )}
      </Card>

      <Card>
        <div className="section-head">
          <h2>Export Configuration</h2>
          <Button variant="primary" onClick={onQueueExport}>
            Generate Export Package
          </Button>
        </div>

        <div className="export-grid">
          <ChoiceField label="Platforms">
            <label>
              <input
                checked={exportSettings.meta}
                onChange={(event) =>
                  onUpdateExportSettings({ meta: event.target.checked })
                }
                type="checkbox"
              />
              Meta Ads
            </label>
            <label>
              <input
                checked={exportSettings.instagram}
                onChange={(event) =>
                  onUpdateExportSettings({ instagram: event.target.checked })
                }
                type="checkbox"
              />
              Instagram
            </label>
            <label>
              <input
                checked={exportSettings.google}
                onChange={(event) =>
                  onUpdateExportSettings({ google: event.target.checked })
                }
                type="checkbox"
              />
              Google Ads
            </label>
            <label>
              <input
                checked={exportSettings.linkedIn}
                onChange={(event) =>
                  onUpdateExportSettings({ linkedIn: event.target.checked })
                }
                type="checkbox"
              />
              LinkedIn
            </label>
          </ChoiceField>

          <ChoiceField label="Format">
            {(['PNG', 'JPG', 'PDF'] as const).map((format) => (
              <label key={format}>
                <input
                  checked={exportSettings.format === format}
                  onChange={() => onUpdateExportSettings({ format })}
                  type="radio"
                  name="export-format"
                />
                {format}
              </label>
            ))}
          </ChoiceField>

          <ChoiceField label="Organization">
            {(['By Platform', 'By Variant Group', 'Flat'] as const).map((grouping) => (
              <label key={grouping}>
                <input
                  checked={exportSettings.grouping === grouping}
                  onChange={() => onUpdateExportSettings({ grouping })}
                  type="radio"
                  name="export-grouping"
                />
                {grouping}
              </label>
            ))}
          </ChoiceField>
        </div>
      </Card>
    </section>
  )
}
