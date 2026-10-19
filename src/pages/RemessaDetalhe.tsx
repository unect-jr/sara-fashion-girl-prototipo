import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import PageHeader from '../components/PageHeader'
import ModalAcerto from '../components/painel/ModalAcerto'
import RemessaCard from '../components/remessas/RemessaCard'
import { buttonClasses } from '../components/ui/buttonStyles'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Toast, { type ToastMessage } from '../components/ui/Toast'
import { formatCurrency, formatDateShort } from '../lib/format'
import { resumoRemessas } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'

const FORMA_PAGAMENTO = { pix: 'Pix', dinheiro: 'Dinheiro', cartao: 'Cartão', crediario: 'Crediário' }

// Detalhe da remessa (sem mockup): o romaneio aberto + os acertos registrados
export default function RemessaDetalhe() {
  const { id } = useParams()
  const { state } = useAppStore()
  const [acertoAberto, setAcertoAberto] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const resumo = useMemo(() => resumoRemessas(state).find((r) => r.remessa.id === id), [state, id])
  const acertos = state.acertos.filter((acerto) => acerto.remessaId === id).toSorted((a, b) => b.data.localeCompare(a.data))

  const fechar = useCallback(() => setAcertoAberto(null), [])
  const avisar = useCallback((text: string) => setToast({ id: Date.now(), text }), [])
  const limparToast = useCallback(() => setToast(null), [])

  if (!resumo) {
    return (
      <>
        <PageHeader title="Remessa" />
        <Card>
          <EmptyState
            title="Remessa não encontrada"
            description="Ela pode ter sido removida ou o link está incorreto."
            action={
              <Link to="/remessas" className={buttonClasses()}>
                Voltar para Remessas
              </Link>
            }
          />
        </Card>
      </>
    )
  }

  const { remessa, vendedora } = resumo

  return (
    <>
      <PageHeader
        title={remessa.id}
        subtitle={
          <>
            <Link to="/remessas" className="underline-offset-2 hover:text-ink hover:underline">
              Remessas
            </Link>{' '}
            ·{' '}
            {vendedora ? (
              <Link to={`/vendedoras/${vendedora.id}`} className="underline-offset-2 hover:text-ink hover:underline">
                {vendedora.nome}
              </Link>
            ) : (
              'Vendedora removida'
            )}{' '}
            · saiu {formatDateShort(remessa.dataSaida)} · prazo {formatDateShort(remessa.prazoAcerto)}
          </>
        }
      />

      <div className="flex flex-col gap-5">
        <RemessaCard key={remessa.id} resumo={resumo} produtos={state.produtos} hoje={state.hoje} defaultAberto onFazerAcerto={setAcertoAberto} />

        <Card title="Acertos" aside={String(acertos.length)}>
          {acertos.length === 0 ? (
            <EmptyState title="Nenhum acerto ainda" description="Use “Fazer acerto” quando a vendedora prestar contas." />
          ) : (
            <ul className="border-t border-line">
              {acertos.map((acerto) => (
                <li key={acerto.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-card-x py-3.5 tabular-nums last:border-b-0">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-row font-semibold text-ink">{formatDateShort(acerto.data)}</p>
                    <p className="text-caption text-muted">
                      {FORMA_PAGAMENTO[acerto.formaPagamento]} · vendido {formatCurrency(acerto.valorBruto)} · comissão {formatCurrency(acerto.comissao)}
                    </p>
                  </div>
                  <p className="text-row font-semibold text-ink">{formatCurrency(acerto.valorAReceber)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <ModalAcerto remessaId={acertoAberto} onClose={fechar} onSuccess={avisar} />
      <Toast toast={toast} onDismiss={limparToast} />
    </>
  )
}
