import { useId, type ReactNode } from 'react'

interface CardProps {
  title?: string
  aside?: ReactNode
  children: ReactNode
  className?: string
}

// Card de seção (Figma 9:39): borda fina, cantos de 20px, cabeçalho opcional
export default function Card({ title, aside, children, className = '' }: CardProps) {
  const titleId = useId()

  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      className={`overflow-hidden rounded-card border border-line bg-surface ${className}`}
    >
      {title && (
        <header className="flex items-center justify-between gap-4 px-card-x pt-5.5 pb-4">
          <h2 id={titleId} className="text-heading font-semibold text-ink">
            {title}
          </h2>
          {aside && <div className="text-sub text-muted">{aside}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
