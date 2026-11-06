import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { EASE_OUT } from '../../lib/motion'

export interface LinhaBarra {
  chave: string
  titulo: ReactNode
  subtitulo?: string
  valor: number
  rotuloValor: string
  detalhe?: string
}

interface BarrasHorizontaisProps {
  linhas: LinhaBarra[]
  cor?: 'info' | 'brand' | 'muted'
  // Posição no ranking (só quando a ordem importa)
  numerar?: boolean
}

const COR = { info: 'bg-info', brand: 'bg-brand', muted: 'bg-track' }

// Lista com barra proporcional, para ranking e comparação entre vendedoras
export default function BarrasHorizontais({ linhas, cor = 'info', numerar = false }: BarrasHorizontaisProps) {
  const maximo = Math.max(0, ...linhas.map((linha) => linha.valor))

  return (
    <ul className="flex flex-col">
      {linhas.map((linha, index) => (
        <li key={linha.chave} className="flex items-center gap-3 border-b border-line px-card-x py-2.75 last:border-b-0">
          {numerar && <span className="w-4 shrink-0 text-caption font-semibold text-muted tabular-nums">{index + 1}</span>}
          <div className="flex min-w-0 flex-1 flex-col gap-1.25">
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate text-sub font-medium text-ink">{linha.titulo}</p>
              <p className="shrink-0 text-sub font-semibold text-ink tabular-nums">{linha.rotuloValor}</p>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${maximo > 0 ? (linha.valor / maximo) * 100 : 0}%` }}
                transition={{ duration: 0.6, ease: EASE_OUT, delay: index * 0.04 }}
                className={`h-full rounded-full ${COR[cor]}`}
              />
            </div>
            {(linha.subtitulo || linha.detalhe) && (
              <div className="flex justify-between gap-3 text-caption text-muted tabular-nums">
                <span className="truncate">{linha.subtitulo}</span>
                <span className="shrink-0">{linha.detalhe}</span>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
