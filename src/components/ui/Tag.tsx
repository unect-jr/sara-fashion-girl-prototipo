import type { ReactNode } from 'react'

export type TagVariant = 'neutral' | 'warning' | 'info'

// Pílulas do card de produto: categoria (13:61), REPOR (13:63) e TUDO NA RUA (13:241)
const VARIANTS: Record<TagVariant, string> = {
  neutral: 'border-line bg-surface-muted text-caption leading-4 font-medium text-ink-detail',
  warning: 'border-warning bg-warning-tint font-label text-label leading-4 tracking-normal font-semibold text-warning',
  info: 'border-info bg-info-tint font-label text-label leading-4 tracking-normal font-semibold text-info',
}

export default function Tag({ variant = 'neutral', children }: { variant?: TagVariant; children: ReactNode }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2.75 py-1.5 whitespace-nowrap ${VARIANTS[variant]}`}>
      {children}
    </span>
  )
}
