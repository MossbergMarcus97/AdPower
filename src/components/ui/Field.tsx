import type { InputHTMLAttributes, PropsWithChildren, ReactNode } from 'react'

interface RangeFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  valueLabel?: ReactNode
}

export function RangeField({ label, valueLabel, ...props }: RangeFieldProps) {
  return (
    <label className="field-card">
      <span className="field-label">
        {label}
        {valueLabel ? <strong>{valueLabel}</strong> : null}
      </span>
      <input {...props} type="range" />
    </label>
  )
}

interface ChoiceFieldProps {
  label: string
  children: ReactNode
}

export function ChoiceField({ label, children }: PropsWithChildren<ChoiceFieldProps>) {
  return (
    <article className="field-card choice-field">
      <p className="field-label">{label}</p>
      {children}
    </article>
  )
}
