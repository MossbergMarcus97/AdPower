import { Button } from '../../components/ui/Button'
import { Progress } from '../../components/ui/Progress'
import type { AppView } from '../../types'

interface SidebarProps {
  viewOptions: Array<{ id: AppView; label: string }>
  activeView: AppView
  queueStatus: string
  queueStage: string
  progress: number
  elapsedSeconds: number
  ctaLabel: string
  isGenerating: boolean
  onSelectView: (view: AppView) => void
  onStartGeneration: () => void
}

function classNames(...names: Array<string | false | undefined>): string {
  return names.filter(Boolean).join(' ')
}

export function Sidebar({
  viewOptions,
  activeView,
  queueStatus,
  queueStage,
  progress,
  elapsedSeconds,
  ctaLabel,
  isGenerating,
  onSelectView,
  onStartGeneration,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <section className="sidebar-section">
        <p className="sidebar-title">Workflow</p>
        {viewOptions.map((option) => (
          <button
            key={option.id}
            className={classNames('sidebar-link', option.id === activeView && 'sidebar-link-active')}
            onClick={() => onSelectView(option.id)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </section>

      <section className="sidebar-section job-state">
        <p className="sidebar-title">Generation Queue</p>
        <p className="queue-status">{queueStatus}</p>
        <p className="queue-stage">{queueStage}</p>
        <Progress value={progress} ariaLabel="Generation progress" />
        <p className="queue-meta">
          {progress.toFixed(0)}% complete · {elapsedSeconds}s elapsed
        </p>
        <Button variant="ai" onClick={onStartGeneration} disabled={isGenerating}>
          {ctaLabel}
        </Button>
      </section>
    </aside>
  )
}
