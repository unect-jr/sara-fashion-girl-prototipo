import { motion } from 'motion/react'
import { useId } from 'react'
import { EASE_OUT } from '../../lib/motion'

export interface OpcaoSegmentada<T extends string> {
  valor: T
  rotulo: string
  detalhe?: string
}

interface SegmentedProps<T extends string> {
  opcoes: OpcaoSegmentada<T>[]
  // Valor fora das opções = nada escolhido ainda
  valor: T | ''
  onChange: (valor: T) => void
  rotulo: string
  tamanho?: 'md' | 'sm'
  invalido?: boolean
  className?: string
}

// Escolha em pílulas com marcador deslizante (inspirado no "Expandable tabs" do Skiper UI)
export default function Segmented<T extends string>({ opcoes, valor, onChange, rotulo, tamanho = 'md', invalido = false, className = '' }: SegmentedProps<T>) {
  const id = useId()

  return (
    <div
      role="radiogroup"
      aria-label={rotulo}
      aria-invalid={invalido || undefined}
      className={`flex flex-wrap gap-1 rounded-card border bg-surface-muted p-1 sm:rounded-full ${invalido ? 'border-brand' : 'border-line'} ${className}`}
    >
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === valor
        return (
          <button
            key={opcao.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => onChange(opcao.valor)}
            className={`relative flex-1 rounded-full font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              tamanho === 'sm' ? 'px-3 py-1.5 text-button-sm leading-3.75' : 'px-3.5 py-2 text-button leading-4'
            } ${ativo ? 'text-ink' : 'text-muted hover:text-ink'}`}
          >
            {ativo && (
              <motion.span
                layoutId={`segmento-${id}`}
                transition={{ duration: 0.3, ease: EASE_OUT }}
                className="absolute inset-0 rounded-full border border-line-strong bg-surface shadow-[0_1px_2px_rgb(18_18_15/0.06)]"
              />
            )}
            <span className="relative flex items-center justify-center gap-1.5">
              {opcao.rotulo}
              {opcao.detalhe && <span className="text-muted tabular-nums">{opcao.detalhe}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}
