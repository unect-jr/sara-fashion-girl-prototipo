import { motion } from 'motion/react'
import NumeroRolante from './NumeroRolante'

interface StepperProps {
  valor: number
  maximo: number
  rotulo: string
  onChange: (valor: number) => void
  // Tentou passar do máximo: a tela avisa em vez de aceitar
  onExcedeu?: () => void
}

const BOTAO =
  'flex size-7.5 items-center justify-center rounded-full text-row font-semibold text-ink-soft transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand'

export default function Stepper({ valor, maximo, rotulo, onChange, onExcedeu }: StepperProps) {
  const noLimite = valor >= maximo

  return (
    <div className={`flex shrink-0 items-center gap-0.5 rounded-full border bg-surface p-0.75 ${valor > 0 ? 'border-info' : 'border-line-strong'}`}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        aria-label={`Diminuir ${rotulo}`}
        disabled={valor === 0}
        onClick={() => onChange(valor - 1)}
        className={`${BOTAO} disabled:pointer-events-none disabled:opacity-30`}
      >
        −
      </motion.button>
      <NumeroRolante valor={valor} className={`w-6 justify-center text-row font-semibold ${valor > 0 ? 'text-ink' : 'text-muted'}`} />
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        aria-label={`Aumentar ${rotulo}`}
        aria-disabled={noLimite}
        onClick={() => (noLimite ? onExcedeu?.() : onChange(valor + 1))}
        className={`${BOTAO} ${noLimite ? 'opacity-30' : ''}`}
      >
        +
      </motion.button>
    </div>
  )
}
