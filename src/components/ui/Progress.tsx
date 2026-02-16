interface ProgressProps {
  value: number
  className?: string
  ariaLabel?: string
}

export function Progress({
  value,
  className,
  ariaLabel = 'Progress',
}: ProgressProps) {
  return (
    <div
      className={className ? `progress-track ${className}` : 'progress-track'}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
    >
      <span style={{ width: `${Math.max(0, Math.min(value, 100)).toFixed(0)}%` }} />
    </div>
  )
}
