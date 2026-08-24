import type { InputHTMLAttributes, ReactNode } from 'react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: ReactNode
}

export function Field({ label, error, hint, id, className = '', ...props }: FieldProps) {
  const inputId = id ?? props.name
  return (
    <label className="flex flex-col gap-1.5" htmlFor={inputId}>
      <span className="text-sm font-semibold text-text-muted">{label}</span>
      <input
        id={inputId}
        className={`rounded-xl border bg-surface px-4 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-lime/60 ${
          error ? 'border-danger' : 'border-border'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
      {!error && hint}
    </label>
  )
}
