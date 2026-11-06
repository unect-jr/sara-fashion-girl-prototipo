import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import lupa from '../../assets/icons/lupa.svg'
import removerInfo from '../../assets/icons/remover-info.svg'
import remover from '../../assets/icons/remover.svg'

// Barra de filtros no molde das de Estoque e Remessas (Figma 13:37, 17:37)
export default function BarraFiltros({ children, contagem }: { children: ReactNode; contagem?: string }) {
  return (
    <div role="search" className="flex flex-wrap items-center gap-2.5 rounded-card border border-line bg-surface py-3 pr-5 pl-4 xl:rounded-full">
      {children}
      <span className="hidden flex-1 xl:block" />
      {contagem && <p className="ml-auto text-button leading-4 text-muted tabular-nums xl:ml-0">{contagem}</p>}
    </div>
  )
}

interface CampoBuscaProps {
  valor: string
  onChange: (valor: string) => void
  placeholder: string
  rotulo: string
  className?: string
}

export function CampoBusca({ valor, onChange, placeholder, rotulo, className = 'sm:w-64.5' }: CampoBuscaProps) {
  return (
    <label
      className={`flex w-full items-center gap-2.25 rounded-full border border-line bg-surface-muted px-3.5 py-2 transition-colors focus-within:border-info focus-within:ring-[0.5px] focus-within:ring-info ${className}`}
    >
      <img src={lupa} alt="" width={13} height={13} />
      <span className="sr-only">{rotulo}</span>
      <input
        type="search"
        value={valor}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sub text-ink outline-none placeholder:text-muted"
      />
    </label>
  )
}

interface FiltroAlternarProps {
  ativo: boolean
  onClick: () => void
  children: ReactNode
  tom?: 'warning' | 'info'
}

// Filtro liga/desliga em pílula (Figma 13:51 em âmbar, 17:51 em azul-marinho)
export function FiltroAlternar({ ativo, onClick, children, tom = 'info' }: FiltroAlternarProps) {
  const cores = tom === 'warning' ? 'border-warning bg-warning-tint text-warning' : 'border-info bg-info-tint text-info'
  return (
    <motion.button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={`flex items-center gap-1.75 rounded-full border py-2 text-button leading-4 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
        ativo ? `${cores} pr-2.75 pl-3.5` : 'border-line-strong bg-surface px-3.5 text-ink-soft hover:border-muted'
      }`}
    >
      {children}
      {ativo && <img src={tom === 'warning' ? remover : removerInfo} alt="" width={9} height={9} />}
    </motion.button>
  )
}
