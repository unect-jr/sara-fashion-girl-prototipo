import { motion } from 'motion/react'
import lupa from '../../assets/icons/lupa.svg'
import remover from '../../assets/icons/remover-info.svg'
import type { Vendedora } from '../../data/types'
import { formatMonthYear } from '../../lib/format'
import Select from '../ui/Select'

export interface FiltrosRemessas {
  busca: string
  vendedoraId: string
  // "YYYY-MM"; vazio = todos os meses
  mes: string
  somenteAbertas: boolean
}

interface RemessasFiltrosProps {
  filtros: FiltrosRemessas
  vendedoras: Vendedora[]
  meses: string[]
  onChange: (filtros: FiltrosRemessas) => void
  contagem: string
}

// Barra de filtros de Remessas (Figma 17:37), no mesmo molde da de Vendedoras
export default function RemessasFiltros({ filtros, vendedoras, meses, onChange, contagem }: RemessasFiltrosProps) {
  const set = <K extends keyof FiltrosRemessas>(chave: K, valor: FiltrosRemessas[K]) => onChange({ ...filtros, [chave]: valor })

  return (
    <div
      role="search"
      className="flex flex-wrap items-center gap-2.5 rounded-card border border-line bg-surface py-3 pr-5 pl-4 xl:rounded-full"
    >
      <label className="flex w-full items-center gap-2.25 rounded-full border border-line bg-surface-muted px-3.5 py-2 transition-colors focus-within:border-info focus-within:ring-[0.5px] focus-within:ring-info sm:w-68">
        <img src={lupa} alt="" width={13} height={13} />
        <span className="sr-only">Buscar remessa</span>
        <input
          type="search"
          value={filtros.busca}
          onChange={(event) => set('busca', event.target.value)}
          placeholder="Buscar por número ou vendedora"
          className="min-w-0 flex-1 bg-transparent text-sub text-ink outline-none placeholder:text-muted"
        />
      </label>

      <Select size="sm" aria-label="Vendedora" value={filtros.vendedoraId} onChange={(event) => set('vendedoraId', event.target.value)} className="w-42">
        <option value="">Todas as vendedoras</option>
        {vendedoras.map((vendedora) => (
          <option key={vendedora.id} value={vendedora.id}>
            {vendedora.nome}
          </option>
        ))}
      </Select>

      <Select size="sm" aria-label="Mês" value={filtros.mes} onChange={(event) => set('mes', event.target.value)} className="w-38">
        <option value="">Todos os meses</option>
        {meses.map((mes) => (
          <option key={mes} value={mes}>
            {formatMonthYear(mes)}
          </option>
        ))}
      </Select>

      {/* Filtro ativo em azul-marinho (17:51); inativo segue o contorno dos seletores */}
      <motion.button
        type="button"
        aria-pressed={filtros.somenteAbertas}
        onClick={() => set('somenteAbertas', !filtros.somenteAbertas)}
        whileTap={{ scale: 0.97 }}
        className={`flex items-center gap-1.75 rounded-full border py-2 text-button leading-4 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
          filtros.somenteAbertas
            ? 'border-info bg-info-tint pr-2.75 pl-3.5 text-info'
            : 'border-line-strong bg-surface px-3.5 text-ink-soft hover:border-muted'
        }`}
      >
        Em aberto
        {filtros.somenteAbertas && <img src={remover} alt="" width={9} height={9} />}
      </motion.button>

      <span className="hidden flex-1 xl:block" />
      <p className="ml-auto text-button leading-4 text-muted tabular-nums xl:ml-0">{contagem}</p>
    </div>
  )
}
