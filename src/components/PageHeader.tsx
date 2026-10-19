import type { ReactNode } from 'react'
import { formatDateLong } from '../lib/format'
import { useAppStore } from '../store/useAppStore'

interface PageHeaderProps {
  title: string
  actions?: ReactNode
}

// Topo das páginas: título + data de hoje por extenso (Figma 9:28)
export default function PageHeader({ title, actions }: PageHeaderProps) {
  const { hoje } = useAppStore().state

  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-display font-semibold text-ink">{title}</h1>
        <time dateTime={hoje} className="text-sub text-muted">
          {formatDateLong(hoje)}
        </time>
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </header>
  )
}
