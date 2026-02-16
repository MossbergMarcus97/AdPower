import type { HTMLAttributes, PropsWithChildren } from 'react'

type BadgeTone =
  | 'approved'
  | 'pending'
  | 'rejected'
  | 'active'
  | 'generating'
  | 'needs-review'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone: BadgeTone
}

function classNames(...names: Array<string | false | undefined>): string {
  return names.filter(Boolean).join(' ')
}

export function Badge({
  children,
  className,
  tone,
  ...props
}: PropsWithChildren<BadgeProps>) {
  return (
    <span className={classNames('status-badge', `status-${tone}`, className)} {...props}>
      {children}
    </span>
  )
}
