import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

// Estado vazio/erro dentro de cards (sem mockup no Figma: derivado dos tokens)
export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-card-x py-12 text-center">
      <p className="text-row font-medium text-ink">{title}</p>
      {description && <p className="max-w-sm text-caption text-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
