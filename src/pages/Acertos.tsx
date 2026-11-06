import { motion } from 'motion/react'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router'
import PageHeader from '../components/PageHeader'
import AcertosPendentes from '../components/painel/AcertosPendentes'
import ModalAcerto from '../components/painel/ModalAcerto'
import BarraFiltros from '../components/ui/BarraFiltros'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Select from '../components/ui/Select'
import Tag from '../components/ui/Tag'
import Toast, { type ToastMessage } from '../components/ui/Toast'
import { FORMA_ACERTO_LABEL } from '../data/catalogo'
import { formatCurrency, formatDateShort, formatMonthYear, formatNumber } from '../lib/format'
import { EASE_OUT } from '../lib/motion'
import { nomeUsuario } from '../store/consultas'
import { acertosPendentes } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'

const COLUNAS = 'grid grid-cols-[88px_minmax(0,1.4fr)_88px_100px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-4 px-card-x'

// Acertos: o que está pendente e o histórico de prestações de contas
export default function Acertos() {
  const { state } = useAppStore()
  const [vendedoraId, setVendedoraId] = useState('')
  const [mes, setMes] = useState('')
  const [acertoAberto, setAcertoAberto] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const pendentes = acertosPendentes(state)
  const meses = useMemo(() => [...new Set(state.acertos.map((a) => a.data.slice(0, 7)))].sort().reverse(), [state.acertos])
  const historico = useMemo(
    () =>
      state.acertos
        .map((acerto) => {
          const remessa = state.remessas.find((r) => r.id === acerto.remessaId)
          return { acerto, remessa, vendedora: state.vendedoras.find((v) => v.id === remessa?.vendedoraId) }
        })
        .filter(({ acerto, vendedora }) => (!vendedoraId || vendedora?.id === vendedoraId) && (!mes || acerto.data.startsWith(mes)))
        .toSorted((a, b) => b.acerto.data.localeCompare(a.acerto.data) || b.acerto.id.localeCompare(a.acerto.id)),
    [state.acertos, state.remessas, state.vendedoras, vendedoraId, mes],
  )
  const somas = historico.reduce(
    (acc, { acerto }) => ({ bruto: acc.bruto + acerto.valorBruto, comissao: acc.comissao + acerto.comissao, receber: acc.receber + acerto.valorAReceber }),
    { bruto: 0, comissao: 0, receber: 0 },
  )

  const fechar = useCallback(() => setAcertoAberto(null), [])
  const avisar = useCallback((text: string) => setToast({ id: Date.now(), text }), [])
  const limparToast = useCallback(() => setToast(null), [])

  return (
    <>
      <PageHeader
        title="Acertos"
        subtitle={`${formatNumber(pendentes.length)} ${pendentes.length === 1 ? 'remessa espera' : 'remessas esperam'} acerto · ${formatNumber(state.acertos.length)} acertos registrados`}
      />

      <AcertosPendentes carregando={false} onFazerAcerto={setAcertoAberto} />

      <BarraFiltros contagem={`${formatNumber(historico.length)} ${historico.length === 1 ? 'acerto' : 'acertos'}`}>
        <Select size="sm" aria-label="Vendedora" value={vendedoraId} onChange={(event) => setVendedoraId(event.target.value)} className="w-48">
          <option value="">Todas as vendedoras</option>
          {state.vendedoras.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nome}
            </option>
          ))}
        </Select>
        <Select size="sm" aria-label="Mês" value={mes} onChange={(event) => setMes(event.target.value)} className="w-44">
          <option value="">Todos os meses</option>
          {meses.map((m) => (
            <option key={m} value={m}>
              {formatMonthYear(m)}
            </option>
          ))}
        </Select>
      </BarraFiltros>

      <Card title="Histórico de acertos" aside={`${formatCurrency(somas.receber)} recebidos`}>
        {historico.length === 0 ? (
          <EmptyState
            title="Nenhum acerto nesse filtro"
            description="Mude a vendedora ou o mês para ver outros acertos."
            action={
              <Button
                onClick={() => {
                  setVendedoraId('')
                  setMes('')
                }}
              >
                Limpar filtros
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-200">
              <div className={`${COLUNAS} border-y border-line bg-surface-muted py-2.25 font-label text-eyebrow font-semibold text-muted uppercase`}>
                <p>Data</p>
                <p>Vendedora</p>
                <p>Remessa</p>
                <p>Repasse</p>
                <p className="text-right">Vendido</p>
                <p className="text-right">Comissão</p>
                <p className="text-right">A receber</p>
              </div>
              <ul>
                {historico.map(({ acerto, remessa, vendedora }, index) => (
                  <motion.li
                    key={acerto.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: EASE_OUT, delay: Math.min(index, 10) * 0.03 }}
                    className={`${COLUNAS} border-b border-line py-3 tabular-nums last:border-b-0`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sub font-semibold text-ink">{formatDateShort(acerto.data)}</p>
                      <p className="text-caption text-muted">{acerto.id}</p>
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      {vendedora ? (
                        <Link to={`/vendedoras/${vendedora.id}`} className="truncate text-sub font-medium text-ink hover:underline">
                          {vendedora.nome}
                        </Link>
                      ) : (
                        <p className="text-sub text-muted">Vendedora removida</p>
                      )}
                      <p className="truncate text-caption text-muted">{acerto.usuarioId ? `registrado por ${nomeUsuario(state.usuarios, acerto.usuarioId)}` : vendedora?.regiao}</p>
                    </div>
                    {remessa ? (
                      <Link to={`/remessas/${remessa.id}`} className="text-sub font-medium text-info hover:underline">
                        {remessa.id}
                      </Link>
                    ) : (
                      <p className="text-sub text-muted">{acerto.remessaId}</p>
                    )}
                    <div>
                      <Tag>{FORMA_ACERTO_LABEL[acerto.formaPagamento]}</Tag>
                    </div>
                    <p className="text-right text-sub text-ink">{formatCurrency(acerto.valorBruto)}</p>
                    <p className="text-right text-sub text-ink-detail">{formatCurrency(acerto.comissao)}</p>
                    <p className="text-right text-sub font-semibold text-ink">{formatCurrency(acerto.valorAReceber)}</p>
                  </motion.li>
                ))}
              </ul>
              <div className={`${COLUNAS} border-t border-line bg-surface-muted py-3 text-button-sm font-semibold text-ink tabular-nums`}>
                <p className="col-span-4 text-muted">Total do filtro</p>
                <p className="text-right">{formatCurrency(somas.bruto)}</p>
                <p className="text-right">{formatCurrency(somas.comissao)}</p>
                <p className="text-right">{formatCurrency(somas.receber)}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      <ModalAcerto remessaId={acertoAberto} onClose={fechar} onSuccess={avisar} />
      <Toast toast={toast} onDismiss={limparToast} />
    </>
  )
}
