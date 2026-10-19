import { motion } from 'motion/react'
import lupa from '../../assets/icons/lupa.svg'
import remover from '../../assets/icons/remover.svg'
import { CATEGORIA_LABEL, CATEGORIAS, TAMANHOS_GRADE } from '../../data/catalogo'
import type { Categoria, Tamanho } from '../../data/types'
import Select from '../ui/Select'

export interface FiltrosEstoque {
  busca: string
  categoria: Categoria | ''
  tamanho: Tamanho | ''
  somenteBaixo: boolean
}

interface EstoqueFiltrosProps {
  filtros: FiltrosEstoque
  onChange: (filtros: FiltrosEstoque) => void
  contagem: string
}

// Barra de filtros do Estoque (Figma 13:37)
export default function EstoqueFiltros({ filtros, onChange, contagem }: EstoqueFiltrosProps) {
  const set = <K extends keyof FiltrosEstoque>(chave: K, valor: FiltrosEstoque[K]) => onChange({ ...filtros, [chave]: valor })

  return (
    <div
      role="search"
      className="flex flex-wrap items-center gap-2.5 rounded-card border border-line bg-surface py-3 pr-5 pl-4 xl:rounded-full"
    >
      <label className="flex w-full items-center gap-2.25 rounded-full border border-line bg-surface-muted px-3.5 py-2 transition-colors focus-within:border-info focus-within:ring-[0.5px] focus-within:ring-info sm:w-64.5">
        <img src={lupa} alt="" width={13} height={13} />
        <span className="sr-only">Buscar produto</span>
        <input
          type="search"
          value={filtros.busca}
          onChange={(event) => set('busca', event.target.value)}
          placeholder="Buscar por nome ou SKU"
          className="min-w-0 flex-1 bg-transparent text-sub text-ink outline-none placeholder:text-muted"
        />
      </label>

      <Select
        size="sm"
        aria-label="Categoria"
        value={filtros.categoria}
        onChange={(event) => set('categoria', event.target.value as Categoria | '')}
        className="w-41"
      >
        <option value="">Todas as categorias</option>
        {CATEGORIAS.map((categoria) => (
          <option key={categoria} value={categoria}>
            {CATEGORIA_LABEL[categoria]}
          </option>
        ))}
      </Select>

      <Select
        size="sm"
        aria-label="Tamanho"
        value={filtros.tamanho}
        onChange={(event) => set('tamanho', event.target.value as Tamanho | '')}
        className="w-39.5"
      >
        <option value="">Todos os tamanhos</option>
        {TAMANHOS_GRADE.map((tamanho) => (
          <option key={tamanho} value={tamanho}>
            Tamanho {tamanho}
          </option>
        ))}
      </Select>

      {/* Filtro ativo em âmbar (13:51); inativo segue o contorno dos seletores */}
      <motion.button
        type="button"
        aria-pressed={filtros.somenteBaixo}
        onClick={() => set('somenteBaixo', !filtros.somenteBaixo)}
        whileTap={{ scale: 0.97 }}
        className={`flex items-center gap-1.75 rounded-full border py-2 text-button leading-4 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
          filtros.somenteBaixo
            ? 'border-warning bg-warning-tint pr-2.75 pl-3.5 text-warning'
            : 'border-line-strong bg-surface px-3.5 text-ink-soft hover:border-muted'
        }`}
      >
        Estoque baixo
        {filtros.somenteBaixo && <img src={remover} alt="" width={9} height={9} />}
      </motion.button>

      <span className="hidden flex-1 xl:block" />
      <p className="ml-auto text-button leading-4 text-muted tabular-nums xl:ml-0">{contagem}</p>
    </div>
  )
}
