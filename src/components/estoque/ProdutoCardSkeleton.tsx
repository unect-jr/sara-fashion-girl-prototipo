// Placeholder do card enquanto o carregamento é simulado
export default function ProdutoCardSkeleton() {
  return (
    <div aria-hidden className="flex animate-pulse flex-col overflow-hidden rounded-card border border-line bg-surface">
      <div className="h-60 bg-surface-muted" />
      <div className="flex flex-col gap-3.5 px-5 py-4.5">
        <div className="h-7 w-20 rounded-full bg-surface-muted" />
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-2/3 rounded-full bg-line" />
          <div className="h-3 w-16 rounded-full bg-surface-muted" />
        </div>
        <div className="h-2.25 w-full rounded-full bg-line" />
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-7.5 flex-1 rounded-full bg-surface-muted" />
          ))}
        </div>
        <div className="h-px w-full bg-line" />
        <div className="h-4 w-24 rounded-full bg-line" />
      </div>
    </div>
  )
}
