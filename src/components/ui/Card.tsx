import type { HTMLAttributes, PropsWithChildren } from 'react'

function classNames(...names: Array<string | false | undefined>): string {
  return names.filter(Boolean).join(' ')
}

export function Card({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLElement>>) {
  return (
    <section className={classNames('panel', className)} {...props}>
      {children}
    </section>
  )
}
