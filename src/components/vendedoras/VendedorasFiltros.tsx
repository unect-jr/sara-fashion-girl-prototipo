import { motion } from 'motion/react'
import lupa from '../../assets/icons/lupa.svg'
import remover from '../../assets/icons/remover.svg'
import type { StatusPrazo } from '../../lib/status'
import Select from '../ui/Select'

export type SituacaoVendedora = StatusPrazo | 'sem-remessa'

export interface FiltrosVendedoras {
  busca: string
  regiao: string
  situacao: SituacaoVendedora | ''
  somenteVencido: boolean
}

const SITUACOES: { value: SituacaoVendedora; label: string }[] = [
  { value: 'atrasado', label: 'Acerto atrasado' },
  { value: 'vence-hoje', label: 'Vence hoje' },
  { value: 'em-dia', label: 'Em dia' },
  { value: 'sem-remessa', label: 'Sem remessa aberta' },
]

interface VendedorasFiltrosProps {
  filtros: FiltrosVendedoras
  regioes: string[]
  onChange: (filtros: FiltrosVendedoras) => void
  contagem: string
}

// Barra de filtros de Vendedoras (Figma 16:37), no mesmo molde da do Estoque
export default function VendedorasFiltros({ filtros, regioes, onChange, contagem }: VendedorasFiltrosProps) {
  const set = <K extends keyof FiltrosVendedoras>(chave: K, valor: FiltrosVendedoras[K]) => onChange({ ...filtros, [chave]: valor })

  return (
    <div
      role="search"
      className="flex flex-wrap items-center gap-2.5 rounded-card border border-line bg-surface py-3 pr-5 pl-4 xl:rounded-full"
    >
      <label className="flex w-full items-center gap-2.25 rounded-full border border-line bg-surface-muted px-3.5 py-2 transition-colors focus-within:border-info focus-within:ring-[0.5px] focus-within:ring-info sm:w-59">
        <img src={lupa} alt="" width={13} height={13} />
        <span className="sr-only">Buscar vendedora</span>
        <input
          type="search"
          value={filtros.busca}
          onChange={(event) => set('busca', event.target.value)}
          placeholder="Buscar vendedora"
          className="min-w-0 flex-1 bg-transparent text-sub text-ink outline-none placeholder:text-muted"
        />
      </label>

      <Select size="sm" aria-label="Região" value={filtros.regiao} onChange={(event) => set('regiao', event.target.value)} className="w-37.5">
        <option value="">Todas as regiões</option>
        {regioes.map((regiao) => (
          <option key={regiao} value={regiao}>
            {regiao}
          </option>
        ))}
      </Select>

      <Select
        size="sm"
        aria-label="Situação"
        value={filtros.situacao}
        onChange={(event) => set('situacao', event.target.value as SituacaoVendedora | '')}
        className="w-39.5"
      >
        <option value="">Todas as situações</option>
        {SITUACOES.map((situacao) => (
          <option key={situacao.value} value={situacao.value}>
            {situacao.label}
          </option>
        ))}
      </Select>

      {/* Filtro ativo em carmim (16:51); inativo segue o contorno dos seletores */}
      <motion.button
        type="button"
        aria-pressed={filtros.somenteVencido}
        onClick={() => set('somenteVencido', !filtros.somenteVencido)}
        whileTap={{ scale: 0.97 }}
        className={`flex items-center gap-1.75 rounded-full border py-2 text-button leading-4 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
          filtros.somenteVencido
            ? 'border-brand bg-brand-tint pr-2.75 pl-3.5 text-brand'
            : 'border-line-strong bg-surface px-3.5 text-ink-soft hover:border-muted'
        }`}
      >
        Acerto vencido
        {filtros.somenteVencido && <img src={remover} alt="" width={9} height={9} />}
      </motion.button>

      <span className="hidden flex-1 xl:block" />
      <p className="ml-auto text-button leading-4 text-muted tabular-nums xl:ml-0">{contagem}</p>
    </div>
  )
}
