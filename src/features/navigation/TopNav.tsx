import { Button } from '../../components/ui/Button'
import type { TopNavItem } from '../../types'

interface TopNavProps {
  items: TopNavItem[]
  isActive: (item: TopNavItem) => boolean
  onSelectItem: (item: TopNavItem) => void
  onQuickGenerate: () => void
  onOpenExport: () => void
}

function classNames(...names: Array<string | false | undefined>): string {
  return names.filter(Boolean).join(' ')
}

export function TopNav({
  items,
  isActive,
  onSelectItem,
  onQuickGenerate,
  onOpenExport,
}: TopNavProps) {
  return (
    <header className="top-nav">
      <div className="brand-lockup">
        <p className="brand-name">AdVariant</p>
        <p className="breadcrumbs">Acme Corp / Summer Sale / Workspace</p>
      </div>

      <nav className="top-links" aria-label="Primary">
        {items.map((item) => (
          <button
            key={item.id}
            className={classNames('nav-pill', isActive(item) && 'nav-pill-active')}
            type="button"
            onClick={() => onSelectItem(item)}
            aria-current={isActive(item) ? 'page' : undefined}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="top-actions">
        <Button variant="ghost" onClick={onQuickGenerate}>
          Quick Generate
        </Button>
        <Button variant="secondary" onClick={onOpenExport}>
          Export Center
        </Button>
      </div>
    </header>
  )
}
