import { motion } from 'motion/react'
import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router'
import type { AppState } from '../../data/types'
import { diffDays } from '../../lib/date'
import { formatCurrency, formatPecas } from '../../lib/format'
import { EASE_OUT } from '../../lib/motion'
import { pecasNaRemessa, remessasAbertas, resumoEstoque, valorConsignado } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import Card from '../ui/Card'
import EmptyState from '../ui/EmptyState'

interface PrecisaAtencaoProps {
  onRepor: (produtoId: string) => void
}

type Tom = 'atrasado' | 'aviso' | 'info'

interface Alerta {
  id: string
  tom: Tom
  titulo: string
  detalhe: string
  valor?: number
  acao: ReactNode
}

// Entalhe colorido à esquerda de cada alerta (Figma 9:213, 9:220, 9:227)
const ENTALHE: Record<Tom, string> = { atrasado: 'bg-brand', aviso: 'bg-warning', info: 'bg-info' }

const PARCELA_DIAS = 15
const RUA_DIAS = 30

const LINK = 'text-button leading-4 font-medium text-info hover:underline focus-visible:outline-2 focus-visible:outline-brand'
const lista = new Intl.ListFormat('pt-BR', { type: 'conjunction' })

function primeiroNome(state: AppState, vendedoraId: string): string {
  return state.vendedoras.find((v) => v.id === vendedoraId)?.nome.split(' ')[0] ?? 'vendedora'
}

function montarAlertas(state: AppState, onRepor: (produtoId: string) => void): Alerta[] {
  const alertas: Alerta[] = []

  // Parcelas do crediário vencidas há mais de 15 dias
  const vencidas = state.crediarios.flatMap((crediario) =>
    crediario.parcelas
      .filter((parcela) => !parcela.paga && diffDays(state.hoje, parcela.vencimento) > PARCELA_DIAS)
      .map((parcela) => ({ parcela, vendedoraId: crediario.vendedoraId })),
  )
  if (vencidas.length > 0) {
    const nomes = [...new Set(vencidas.map((v) => v.vendedoraId))].map((id) => `da ${primeiroNome(state, id)}`)
    alertas.push({
      id: 'parcelas',
      tom: 'atrasado',
      titulo: `${vencidas.length} ${vencidas.length === 1 ? 'parcela vencida' : 'parcelas vencidas'} há mais de ${PARCELA_DIAS} dias`,
      detalhe: `clientes ${lista.format(nomes)}`,
      valor: vencidas.reduce((total, v) => total + v.parcela.valor, 0),
      acao: (
        <Link to="/crediario" className={LINK}>
          Ver no crediário
        </Link>
      ),
    })
  }

  // Peças paradas na rua há mais de 30 dias
  const paradas = remessasAbertas(state.remessas).filter((remessa) => diffDays(state.hoje, remessa.dataSaida) > RUA_DIAS)
  const pecasParadas = paradas.reduce((total, remessa) => total + pecasNaRemessa(remessa), 0)
  if (pecasParadas > 0) {
    const vendedoras = new Set(paradas.map((remessa) => remessa.vendedoraId))
    alertas.push({
      id: 'rua',
      tom: 'aviso',
      titulo: `${formatPecas(pecasParadas)} fora há mais de ${RUA_DIAS} dias sem acerto`,
      detalhe:
        vendedoras.size === 1
          ? `com a ${primeiroNome(state, [...vendedoras][0])}`
          : `espalhadas em ${vendedoras.size} vendedoras`,
      valor: paradas.reduce((total, remessa) => total + valorConsignado(remessa, state.produtos), 0),
      acao: (
        <Link to="/remessas" className={LINK}>
          Ver peças
        </Link>
      ),
    })
  }

  // Tamanhos zerados no central: destaca o modelo com mais peças na rua
  const zerados = resumoEstoque(state)
    .map((resumo) => ({
      resumo,
      tamanhos: [...new Set(resumo.produto.variacoes.map((v) => v.tamanho))].filter((t) => resumo.porTamanho[t] === 0),
    }))
    .filter((item) => item.tamanhos.length > 0)
    .toSorted((a, b) => b.resumo.naRua - a.resumo.naRua)
  if (zerados.length > 0) {
    const { resumo, tamanhos } = zerados[0]
    const outros = zerados.length - 1
    alertas.push({
      id: 'repor',
      tom: 'info',
      titulo: `${resumo.produto.nome} — ${lista.format(tamanhos)} ${tamanhos.length === 1 ? 'zerado' : 'zerados'} no central`,
      detalhe: `${resumo.naRua} na rua${outros > 0 ? ` · mais ${outros} ${outros === 1 ? 'modelo' : 'modelos'} para repor` : ''}`,
      acao: (
        <button type="button" onClick={() => onRepor(resumo.produto.id)} className={LINK}>
          Repor
        </button>
      ),
    })
  }

  return alertas
}

// Seção "Precisa de atenção" (Figma 9:208): alertas calculados a partir do estado
export default function PrecisaAtencao({ onRepor }: PrecisaAtencaoProps) {
  const { state } = useAppStore()
  const alertas = useMemo(() => montarAlertas(state, onRepor), [state, onRepor])

  return (
    <Card title="Precisa de atenção" aside={`${alertas.length} ${alertas.length === 1 ? 'item' : 'itens'}`}>
      {alertas.length === 0 ? (
        <EmptyState title="Tudo em ordem" description="Nenhuma parcela vencida, remessa parada ou tamanho zerado no central." />
      ) : (
        <ul>
          {alertas.map((alerta, index) => (
            <motion.li
              key={alerta.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT, delay: index * 0.04 } }}
              className="flex items-center gap-4 border-b border-line px-card-x py-3.25 last:border-b-0"
            >
              <span aria-hidden className={`h-6.5 w-0.5 shrink-0 rounded-full ${ENTALHE[alerta.tom]}`} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.75">
                <p className="truncate text-body font-medium text-ink">{alerta.titulo}</p>
                <p className="truncate text-caption text-muted">{alerta.detalhe}</p>
              </div>
              <p
                className={`hidden w-30 shrink-0 text-right text-body font-semibold tabular-nums sm:block ${alerta.valor === undefined ? 'text-muted' : 'text-ink'}`}
              >
                {alerta.valor === undefined ? '—' : formatCurrency(alerta.valor)}
              </p>
              <div className="flex w-29 shrink-0 justify-end">{alerta.acao}</div>
            </motion.li>
          ))}
        </ul>
      )}
    </Card>
  )
}
