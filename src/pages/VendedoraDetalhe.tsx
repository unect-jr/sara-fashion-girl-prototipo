import { motion } from 'motion/react'
import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import PageHeader from '../components/PageHeader'
import ModalAcerto from '../components/painel/ModalAcerto'
import ModalNovaRemessa from '../components/painel/ModalNovaRemessa'
import Button from '../components/ui/Button'
import { buttonClasses } from '../components/ui/buttonStyles'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Toast, { type ToastMessage } from '../components/ui/Toast'
import Medida from '../components/vendedoras/Medida'
import PrazoTraco from '../components/vendedoras/PrazoTraco'
import VendedoraAvatar from '../components/vendedoras/VendedoraAvatar'
import type { Remessa } from '../data/types'
import { formatCurrency, formatDateShort, formatMonth, formatNumber, formatPecas } from '../lib/format'
import { EASE_OUT } from '../lib/motion'
import { describePrazo, getStatusPrazo, type StatusPrazo } from '../lib/status'
import { pecasNaRemessa, resumoVendedoras, valorConsignado } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'

type ModalAberto = { tipo: 'remessa' } | { tipo: 'acerto'; remessaId: string } | null

const COR_STATUS: Record<StatusPrazo, string> = {
  atrasado: 'font-semibold text-brand',
  'vence-hoje': 'font-semibold text-warning',
  'em-dia': 'text-info',
}

// Detalhe da vendedora: resumo, remessas abertas e histórico (sem mockup: reaproveita o card da lista)
export default function VendedoraDetalhe() {
  const { id } = useParams()
  const { state } = useAppStore()
  const [modal, setModal] = useState<ModalAberto>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const resumo = useMemo(() => resumoVendedoras(state).find((r) => r.vendedora.id === id), [state, id])
  const remessas = useMemo(
    () => state.remessas.filter((remessa) => remessa.vendedoraId === id).toSorted((a, b) => b.dataSaida.localeCompare(a.dataSaida)),
    [state.remessas, id],
  )
  const abertas = remessas.filter((remessa) => remessa.status !== 'fechada')
  const fechadas = remessas.filter((remessa) => remessa.status === 'fechada')

  const fechar = useCallback(() => setModal(null), [])
  const avisar = useCallback((text: string) => setToast({ id: Date.now(), text }), [])
  const limparToast = useCallback(() => setToast(null), [])

  if (!resumo) {
    return (
      <>
        <PageHeader title="Vendedora" />
        <Card>
          <EmptyState
            title="Vendedora não encontrada"
            description="Ela pode ter sido removida ou o link está incorreto."
            action={
              <Link to="/vendedoras" className={buttonClasses()}>
                Voltar para Vendedoras
              </Link>
            }
          />
        </Card>
      </>
    )
  }

  const { vendedora } = resumo

  return (
    <>
      <PageHeader
        title={vendedora.nome}
        subtitle={
          <>
            <Link to="/vendedoras" className="underline-offset-2 hover:text-ink hover:underline">
              Vendedoras
            </Link>{' '}
            · {vendedora.regiao} · {vendedora.telefone || 'sem telefone'} · comissão de {Math.round(vendedora.comissao * 100)}%
          </>
        }
        actions={
          <Button size="xs" variant="primary" onClick={() => setModal({ tipo: 'remessa' })}>
            Nova remessa
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section className="flex h-fit flex-col gap-4 rounded-card border border-line bg-surface p-5">
          <div className="flex items-center gap-3.25">
            <VendedoraAvatar nome={vendedora.nome} size="lg" />
            <div className="flex min-w-0 flex-col gap-0.75">
              <p className="truncate text-title font-semibold text-ink">{vendedora.nome}</p>
              <p className="truncate text-button-sm text-muted">{vendedora.regiao}</p>
            </div>
          </div>
          <PrazoTraco resumo={resumo} hoje={state.hoje} />
          <div className="flex gap-2">
            <Medida
              label="Em poder dela"
              value={formatNumber(resumo.emPoder)}
              detail={resumo.emPoder > 0 ? formatCurrency(resumo.valorEmPoder) : '—'}
              apagada={resumo.emPoder === 0}
            />
            <Medida
              label={`Vendido em ${formatMonth(state.hoje)}`}
              value={formatPecas(resumo.vendidoMes.pecas)}
              detail={formatCurrency(resumo.vendidoMes.valorBruto)}
            />
          </div>
          <div aria-hidden className="h-px w-full bg-line" />
          <div className="flex flex-col gap-0.75">
            <p className="font-label text-label font-semibold text-muted uppercase">Comissão do mês</p>
            <p className="text-title font-semibold text-ink tabular-nums">{formatCurrency(resumo.vendidoMes.comissao)}</p>
          </div>
        </section>

        <div className="flex flex-col gap-5">
          <Card title="Remessas abertas" aside={formatNumber(abertas.length)}>
            {abertas.length === 0 ? (
              <EmptyState
                title="Nenhuma remessa aberta"
                description="Todas as peças dela já foram acertadas."
                action={<Button onClick={() => setModal({ tipo: 'remessa' })}>Criar remessa</Button>}
              />
            ) : (
              <ListaRemessas remessas={abertas} onFazerAcerto={(remessaId) => setModal({ tipo: 'acerto', remessaId })} />
            )}
          </Card>
          <Card title="Histórico" aside={formatNumber(fechadas.length)}>
            {fechadas.length === 0 ? (
              <EmptyState title="Sem histórico ainda" description="As remessas acertadas aparecem aqui." />
            ) : (
              <ListaRemessas remessas={fechadas} />
            )}
          </Card>
        </div>
      </div>

      <ModalNovaRemessa open={modal?.tipo === 'remessa'} vendedoraInicialId={vendedora.id} onClose={fechar} onSuccess={avisar} />
      <ModalAcerto remessaId={modal?.tipo === 'acerto' ? modal.remessaId : null} onClose={fechar} onSuccess={avisar} />
      <Toast toast={toast} onDismiss={limparToast} />
    </>
  )
}

interface ListaRemessasProps {
  remessas: Remessa[]
  onFazerAcerto?: (remessaId: string) => void
}

function ListaRemessas({ remessas, onFazerAcerto }: ListaRemessasProps) {
  const { state } = useAppStore()

  return (
    <ul className="border-t border-line">
      {remessas.map((remessa, index) => {
        const enviadas = remessa.itens.reduce((total, item) => total + item.enviada, 0)
        const vendidas = remessa.itens.reduce((total, item) => total + item.vendida, 0)
        const status = getStatusPrazo(remessa.prazoAcerto, state.hoje)
        const aberta = remessa.status !== 'fechada'

        return (
          <motion.li
            key={remessa.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT, delay: index * 0.04 }}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-card-x py-3.5 last:border-b-0"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Link to={`/remessas/${remessa.id}`} className="text-row font-semibold text-ink hover:underline">
                {remessa.id}
              </Link>
              <p className="text-caption text-muted">
                saiu {formatDateShort(remessa.dataSaida)} · prazo {formatDateShort(remessa.prazoAcerto)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-0.5 text-right tabular-nums">
              {aberta ? (
                <>
                  <p className="text-sub text-ink">
                    {formatPecas(pecasNaRemessa(remessa))} · {formatCurrency(valorConsignado(remessa, state.produtos))}
                  </p>
                  <p className={`text-caption ${COR_STATUS[status]}`}>{describePrazo(remessa.prazoAcerto, state.hoje)}</p>
                </>
              ) : (
                <>
                  <p className="text-sub text-ink">
                    {formatNumber(vendidas)} de {formatPecas(enviadas)} vendidas
                  </p>
                  <p className="text-caption text-muted">acertada</p>
                </>
              )}
            </div>
            {aberta && onFazerAcerto && (
              <Button size="xs" variant={status === 'atrasado' ? 'primary' : status === 'vence-hoje' ? 'warning' : 'secondary'} onClick={() => onFazerAcerto(remessa.id)}>
                Fazer acerto
              </Button>
            )}
          </motion.li>
        )
      })}
    </ul>
  )
}
