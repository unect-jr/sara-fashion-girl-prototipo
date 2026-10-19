interface MedidaProps {
  label: string
  value: string
  detail: string
  // Valor zerado fica todo em cinza (Figma 16:228)
  apagada?: boolean
}

// Tile de número do card de vendedora (Figma 16:75)
export default function Medida({ label, value, detail, apagada = false }: MedidaProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-tile border border-line bg-surface-muted px-3.25 pt-2.75 pb-3 whitespace-nowrap">
      <p className="truncate font-label text-label font-semibold text-muted uppercase">{label}</p>
      <p className={`text-title leading-4.75 font-semibold tabular-nums ${apagada ? 'text-muted' : 'text-ink'}`}>{value}</p>
      <p className="text-caption leading-3.5 text-muted tabular-nums">{detail}</p>
    </div>
  )
}
