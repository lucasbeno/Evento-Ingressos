import type { ReactNode } from 'react'

type Tone = 'neutral' | 'success' | 'danger' | 'warning' | 'info'

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-surface-raised text-text-muted border-border',
  success: 'bg-success/15 text-success border-success/40',
  danger: 'bg-danger/15 text-danger border-danger/40',
  warning: 'bg-warning/15 text-warning border-warning/40',
  info: 'bg-magenta/15 text-magenta border-magenta/40',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold uppercase tracking-wider ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  )
}
