import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-lime text-ink hover:bg-lime-dim disabled:bg-lime/40 disabled:text-ink/50 shadow-[0_0_24px_-6px_rgba(212,255,63,0.6)]',
  secondary: 'bg-surface-raised text-text border border-border hover:border-lime/60 hover:text-lime',
  ghost: 'bg-transparent text-text-muted hover:text-text',
  danger: 'bg-danger text-white hover:bg-red-600 disabled:opacity-50',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 font-semibold tracking-wide transition-all disabled:cursor-not-allowed disabled:shadow-none ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  )
}
