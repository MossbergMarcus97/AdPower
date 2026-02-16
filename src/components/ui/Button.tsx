import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'ai'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

function classNames(...names: Array<string | false | undefined>): string {
  return names.filter(Boolean).join(' ')
}

export function Button({
  variant = 'primary',
  className,
  children,
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button className={classNames('btn', `btn-${variant}`, className)} {...props}>
      {children}
    </button>
  )
}
