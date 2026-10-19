import { motion } from 'motion/react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { diffDays } from '../../lib/date'
import { formatCurrency, formatDateShort, formatNumber, formatPecas } from '../../lib/format'
import { EASE_OUT } from '../../lib/motion'
import { pendentes } from '../../lib/remessa'
import { describePrazo, type StatusPrazo } from '../../lib/status'
import { acertosPendentes, type AcertoPendente } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import Button from '../ui/Button'
import type { ButtonVariant } from '../ui/buttonStyles'
import Card from '../ui/Card'
import EmptyState from '../ui/EmptyState'

interface AcertosPendentesProps {
  carregando: boolean
  onFazerAcerto: (remessaId: string) => void
}

// Cores por status (carmim / âmbar / azul-marinho) e variante do botão "Fazer acerto" (Figma 9:119, 9:143, 9:163)
const STATUS: Record<StatusPrazo, { rotulo: string; bg: string; text: string; botao: ButtonVariant; traco: string }> = {
  atrasado: { rotulo: 'Atrasado', bg: 'bg-brand', text: 'text-brand', botao: 'primary', traco: 'h-[2.5px]' },
  'vence-hoje': { rotulo: 'Vence hoje', bg: 'bg-warning', text: 'text-warning', botao: 'warning', traco: 'h-0.5' },
  'em-dia': { rotulo: 'Em dia', bg: 'bg-info', text: 'text-muted', botao: 'secondary', traco: 'h-[1.5px]' },
}

const EYEBROW = 'font-label text-eyebrow font-semibold text-muted uppercase'
// Colunas da tabela (Figma 9:94); a de prazo estica
const COL = {
  vendedora: 'w-60 shrink-0',
  remessa: 'w-21.5 shrink-0',
  prazo: 'min-w-0 flex-1',
  pecas: 'w-16 shrink-0 text-right',
  valor: 'w-30 shrink-0 text-right',
  acao: 'flex w-28 shrink-0 justify-end',
}
// O trilho do prazo ocupa 70% da coluna; o atraso avança além dele (Figma 9:108)
const TRILHO = 70

function Legenda() {
  return (
    <ul className="flex flex-wrap items-center gap-4" aria-label="Legenda">
      {(Object.keys(STATUS) as StatusPrazo[]).map((status) => (
        <li key={status} className="flex items-center gap-1.5">
          <span aria-hidden className="relative flex h-2.5 w-6.5 items-center">
            <span className={`w-full rounded-full ${STATUS[status].bg} ${STATUS[status].traco}`} />
            {status !== 'em-dia' && <span className={`absolute right-0 h-2 w-[1.5px] rounded-full ${STATUS[status].bg}`} />}
          </span>
          <span className={`${EYEBROW} tracking-[0.09em]`}>{STATUS[status].rotulo}</span>
        </li>
      ))}
    </ul>
  )
}

function TracoPrazo({ item, hoje }: { item: AcertoPendente; hoje: string }) {
  const { remessa, status } = item
  const duracao = Math.max(diffDays(remessa.prazoAcerto, remessa.dataSaida), 1)
  const decorrido = Math.max(diffDays(hoje, remessa.dataSaida), 0)
  const preenchido = Math.min((decorrido / duracao) * TRILHO, 100)
  const cor = STATUS[status]
  const marcoFinal = status === 'em-dia' ? 'bg-track' : cor.bg

  return (
    <div className="flex flex-col gap-1.5">
      <div aria-hidden className="relative h-4.5">
        <div className="absolute top-[8.5px] left-0 h-px rounded-full bg-track" style={{ width: `${TRILHO}%` }} />
        <motion.div
          className={`absolute top-[7.75px] left-0 h-[2.5px] rounded-full ${cor.bg}`}
          initial={{ width: 0 }}
          animate={{ width: `${preenchido}%` }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        />
        <div className={`absolute top-[3.5px] left-0 h-2.75 w-[1.5px] rounded-full ${cor.bg}`} />
        <div className={`absolute top-[3.5px] h-2.75 w-[1.5px] -translate-x-full rounded-full ${marcoFinal}`} style={{ left: `${TRILHO}%` }} />
      </div>
      <div className="flex items-center justify-between gap-2 text-micro whitespace-nowrap">
        <span className="text-muted">saiu {formatDateShort(remessa.dataSaida)}</span>
        <span className={`${status === 'em-dia' ? '' : 'font-semibold'} ${cor.text}`}>{describePrazo(remessa.prazoAcerto, hoje)}</span>
      </div>
    </div>
  )
}

function LinhaSkeleton() {
  return (
    <div aria-hidden className="flex animate-pulse items-center gap-5 border-b border-line px-card-x py-4">
      <div className={`${COL.vendedora} flex flex-col gap-1.5`}>
        <div className="h-4 w-2/3 rounded-full bg-line" />
        <div className="h-3 w-1/3 rounded-full bg-surface-muted" />
      </div>
      <div className={`${COL.remessa} h-3.5 rounded-full bg-surface-muted`} />
      <div className={`${COL.prazo} h-1 rounded-full bg-line`} />
      <div className="h-8 w-28 shrink-0 rounded-full bg-surface-muted" />
    </div>
  )
}

// Seção "Acertos pendentes" (Figma 9:74): remessas abertas por prazo, a mais urgente primeiro
export default function AcertosPendentes({ carregando, onFazerAcerto }: AcertosPendentesProps) {
  const { state } = useAppStore()
  const itens = useMemo(() => acertosPendentes(state), [state])
  // A faixa de detalhe acompanha só a primeira remessa atrasada (Figma 9:121)
  const emFocoId = itens.find((item) => item.status === 'atrasado')?.remessa.id
  const maisAntiga = itens.reduce<string | undefined>(
    (antiga, item) => (!antiga || item.remessa.dataSaida < antiga ? item.remessa.dataSaida : antiga),
    undefined,
  )

  function detalhe(item: AcertoPendente) {
    const anteriores = state.remessas.filter(
      (remessa) => remessa.vendedoraId === item.remessa.vendedoraId && remessa.id !== item.remessa.id,
    )
    const ultimoAcerto = state.acertos
      .filter((acerto) => anteriores.some((remessa) => remessa.id === acerto.remessaId))
      .reduce<string | undefined>((ultima, acerto) => (!ultima || acerto.data > ultima ? acerto.data : ultima), undefined)
    const modelos = new Set(item.remessa.itens.filter((i) => pendentes(i) > 0).map((i) => i.produtoId)).size
    return { ultimoAcerto, modelos }
  }

  return (
    <Card title="Acertos pendentes" aside={<Legenda />}>
      <div className="overflow-x-auto">
        <div className="min-w-240">
          <div className={`flex items-center gap-5 border-y border-line bg-surface-muted px-card-x py-2.25 ${EYEBROW}`}>
            <p className={COL.vendedora}>Vendedora / Região</p>
            <p className={COL.remessa}>Remessa</p>
            <p className={COL.prazo}>Saída → Prazo</p>
            <p className={COL.pecas}>Peças</p>
            <p className={COL.valor}>Consignado</p>
            <p className={COL.acao} aria-hidden />
          </div>

          {carregando ? (
            <div aria-busy="true" aria-label="Carregando acertos">
              {[0, 1, 2].map((i) => (
                <LinhaSkeleton key={i} />
              ))}
            </div>
          ) : itens.length === 0 ? (
            <EmptyState title="Nenhum acerto pendente" description="Todas as remessas estão acertadas. Crie uma nova remessa para começar." />
          ) : (
            <ul>
              {itens.map((item, index) => {
                const vendedora = state.vendedoras.find((v) => v.id === item.remessa.vendedoraId)
                const cor = STATUS[item.status]
                const foco = item.remessa.id === emFocoId ? detalhe(item) : null
                return (
                  <motion.li
                    key={item.remessa.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT, delay: index * 0.04 } }}
                    className="border-b border-line"
                  >
                    <div className="flex items-center gap-5 px-card-x py-3.25">
                      <div className={`${COL.vendedora} flex flex-col gap-0.75`}>
                        <Link
                          to={`/vendedoras/${item.remessa.vendedoraId}`}
                          className="truncate text-row font-medium text-ink hover:underline focus-visible:outline-2 focus-visible:outline-brand"
                        >
                          {vendedora?.nome ?? 'Vendedora'}
                        </Link>
                        <p className="truncate text-caption leading-3.5 text-muted">{vendedora?.regiao}</p>
                      </div>
                      <p className={`${COL.remessa} text-button leading-4 font-medium text-ink-soft`}>{item.remessa.id}</p>
                      <div className={COL.prazo}>
                        <TracoPrazo item={item} hoje={state.hoje} />
                      </div>
                      <p className={`${COL.pecas} text-row font-medium text-ink tabular-nums`}>{formatNumber(item.pecas)}</p>
                      <p className={`${COL.valor} text-row font-semibold text-ink tabular-nums`}>{formatCurrency(item.valor)}</p>
                      <div className={COL.acao}>
                        <Button size="sm" variant={cor.botao} onClick={() => onFazerAcerto(item.remessa.id)}>
                          Fazer acerto
                        </Button>
                      </div>
                    </div>
                    {foco && (
                      <div className="flex gap-5 bg-brand-tint px-card-x pt-2.25 pb-2.75 text-caption leading-3.5 whitespace-nowrap">
                        <p className="font-semibold text-brand">prazo venceu em {formatDateShort(item.remessa.prazoAcerto)}</p>
                        <p className="text-ink-detail">
                          {foco.ultimoAcerto ? `último acerto em ${formatDateShort(foco.ultimoAcerto)}` : 'nenhum acerto anterior'}
                        </p>
                        <p className="text-ink-detail tabular-nums">
                          {formatPecas(item.pecas)} · {formatNumber(foco.modelos)} {foco.modelos === 1 ? 'modelo' : 'modelos'}
                        </p>
                      </div>
                    )}
                  </motion.li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-muted px-card-x py-3.75 text-button-sm leading-3.75">
        <p className="text-muted tabular-nums">
          {itens.length === 0
            ? 'Nenhuma remessa em aberto'
            : `${itens.length} ${itens.length === 1 ? 'remessa' : 'remessas'} em aberto · a mais antiga saiu há ${diffDays(state.hoje, maisAntiga ?? state.hoje)} dias`}
        </p>
        <Link to="/remessas" className="font-medium text-info hover:underline focus-visible:outline-2 focus-visible:outline-brand">
          Ver todas as remessas
        </Link>
      </div>
    </Card>
  )
}
