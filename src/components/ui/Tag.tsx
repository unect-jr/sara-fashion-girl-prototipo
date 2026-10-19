import type { ReactNode } from 'react'

export type TagVariant = 'neutral' | 'warning' | 'info' | 'brand' | 'muted'

// Pílulas do card de produto: categoria (13:61), REPOR (13:63) e TUDO NA RUA (13:241);
// situação da remessa: ATRASADA (17:78) e ACERTADA (17:263)
const VARIANTS: Record<TagVariant, string> = {
  neutral: 'border-line bg-surface-muted text-caption leading-4 font-medium text-ink-detail',
  brand: 'border-brand bg-brand-tint font-label text-label leading-4 tracking-normal font-semibold text-brand',
  muted: 'border-line bg-surface-muted font-label text-label leading-4 tracking-normal font-semibold text-muted',
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
