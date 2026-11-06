import { motion } from 'motion/react'
import { EASE_OUT } from '../../lib/motion'

interface InterruptorProps {
  ligado: boolean
  onChange: (ligado: boolean) => void
  rotulo: string
  descricao?: string
}

// Liga/desliga com o pino deslizando (sem mockup no Figma: derivado dos tokens)
export default function Interruptor({ ligado, onChange, rotulo, descricao }: InterruptorProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      onClick={() => onChange(!ligado)}
      className="flex w-full items-center justify-between gap-4 rounded-tile border border-line px-3.5 py-3 text-left transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-brand"
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sub font-medium text-ink">{rotulo}</span>
        {descricao && <span className="text-caption text-muted">{descricao}</span>}
      </span>
      <span className={`flex h-5.5 w-9.5 shrink-0 rounded-full p-0.75 transition-colors ${ligado ? 'justify-end bg-info' : 'justify-start bg-track'}`}>
        <motion.span layout transition={{ duration: 0.2, ease: EASE_OUT }} className="size-4 rounded-full bg-surface shadow-[0_1px_2px_rgb(18_18_15/0.2)]" />
      </span>
    </button>
  )
}
