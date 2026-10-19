import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import PageHeader from '../components/PageHeader'
import ModalAcerto from '../components/painel/ModalAcerto'
import ModalNovaRemessa from '../components/painel/ModalNovaRemessa'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Toast, { type ToastMessage } from '../components/ui/Toast'
import ModalNovaVendedora from '../components/vendedoras/ModalNovaVendedora'
import VendedoraCard from '../components/vendedoras/VendedoraCard'
import VendedorasFiltros, { type FiltrosVendedoras, type SituacaoVendedora } from '../components/vendedoras/VendedorasFiltros'
import { formatCurrency, formatMonth, formatNumber } from '../lib/format'
import { EASE_OUT } from '../lib/motion'
import { pecasNaRua, resumoVendedoras, valorNaRua, type ResumoVendedora } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'

type ModalAberto = { tipo: 'vendedora' } | { tipo: 'remessa'; vendedoraId?: string } | { tipo: 'acerto'; remessaId: string } | null

const FILTROS_INICIAIS: FiltrosVendedoras = { busca: '', regiao: '', situacao: '', somenteVencido: false }
const CARREGAMENTO_MS = 450
// BOM para o Excel abrir o CSV com acentos
const BOM = String.fromCharCode(0xfeff)

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

function situacao(resumo: ResumoVendedora): SituacaoVendedora {
  return resumo.status ?? 'sem-remessa'
}

// "Exportar lista": CSV simples com os números dos cards
function exportarCsv(resumos: ResumoVendedora[]) {
  const linhas = [
    ['Vendedora', 'Região', 'Peças em poder', 'Valor em poder', 'Vendido no mês', 'Comissão do mês'],
    ...resumos.map((r) => [
      r.vendedora.nome,
      r.vendedora.regiao,
      String(r.emPoder),
      r.valorEmPoder.toFixed(2).replace('.', ','),
      r.vendidoMes.valorBruto.toFixed(2).replace('.', ','),
      r.vendidoMes.comissao.toFixed(2).replace('.', ','),
    ]),
  ]
  const csv = linhas.map((linha) => linha.map((campo) => `"${campo.replaceAll('"', '""')}"`).join(';')).join('\n')
  const url = URL.createObjectURL(new Blob([BOM, csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'vendedoras.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export default function Vendedoras() {
  const { state } = useAppStore()
  const [params] = useSearchParams()
  // O Painel pode abrir a tela já filtrada (?situacao=atrasado)
  const [filtros, setFiltros] = useState<FiltrosVendedoras>(() => ({
    ...FILTROS_INICIAIS,
    somenteVencido: params.get('situacao') === 'atrasado',
  }))
  const [modal, setModal] = useState<ModalAberto>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [carregando, setCarregando] = useState(true)

  // Carregamento simulado na entrada da tela
  useEffect(() => {
    const timer = window.setTimeout(() => setCarregando(false), CARREGAMENTO_MS)
    return () => window.clearTimeout(timer)
  }, [])

  const resumos = useMemo(() => resumoVendedoras(state), [state])
  const regioes = useMemo(() => [...new Set(resumos.map((r) => r.vendedora.regiao))].sort(), [resumos])
  const comissaoMes = resumos.reduce((total, r) => total + r.vendidoMes.comissao, 0)
  const mes = formatMonth(state.hoje)

  const filtrados = useMemo(() => {
    const busca = normalizar(filtros.busca.trim())
    return resumos.filter(
      (r) =>
        (!busca || normalizar(r.vendedora.nome).includes(busca) || normalizar(r.vendedora.regiao).includes(busca)) &&
        (!filtros.regiao || r.vendedora.regiao === filtros.regiao) &&
        (!filtros.situacao || situacao(r) === filtros.situacao) &&
        (!filtros.somenteVencido || r.status === 'atrasado'),
    )
  }, [resumos, filtros])

  const fechar = useCallback(() => setModal(null), [])
  const avisar = useCallback((text: string) => setToast({ id: Date.now(), text }), [])
  const limparToast = useCallback(() => setToast(null), [])
  const fazerAcerto = useCallback((remessaId: string) => setModal({ tipo: 'acerto', remessaId }), [])
  const novaRemessa = useCallback((vendedoraId: string) => setModal({ tipo: 'remessa', vendedoraId }), [])

  return (
    <>
      <PageHeader
        title="Vendedoras"
        subtitle={`${formatNumber(resumos.length)} ativas · ${formatNumber(pecasNaRua(state.remessas))} peças em poder delas · ${formatCurrency(valorNaRua(state))} consignados`}
        actions={
          <>
            <Button size="xs" onClick={() => setModal({ tipo: 'vendedora' })}>
              Nova vendedora
            </Button>
            <Button size="xs" variant="primary" onClick={() => setModal({ tipo: 'remessa' })}>
              Nova remessa
            </Button>
          </>
        }
      />

      <div className="-mt-1 flex flex-col gap-5">
        <VendedorasFiltros
          filtros={filtros}
          regioes={regioes}
          onChange={setFiltros}
          contagem={`${formatNumber(filtrados.length)} de ${formatNumber(resumos.length)} vendedoras`}
        />

        {carregando ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Carregando vendedoras">
            {resumos.map((r) => (
              <div key={r.vendedora.id} className="h-72 animate-pulse rounded-card border border-line bg-surface" />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <Card>
            <EmptyState
              title="Nenhuma vendedora encontrada"
              description="Ajuste a busca ou os filtros para ver as outras vendedoras."
              action={<Button onClick={() => setFiltros(FILTROS_INICIAIS)}>Limpar filtros</Button>}
            />
          </Card>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtrados.map((r, index) => (
                <motion.li
                  key={r.vendedora.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT, delay: index * 0.04 } }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                  className="flex"
                >
                  <VendedoraCard resumo={r} hoje={state.hoje} onFazerAcerto={fazerAcerto} onNovaRemessa={novaRemessa} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}

        {!carregando && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-button leading-4 text-muted tabular-nums">
              {formatNumber(resumos.length)} vendedoras ativas · {formatCurrency(comissaoMes)} de comissão a pagar em {mes}
            </p>
            <Button size="xs" onClick={() => exportarCsv(filtrados)} disabled={filtrados.length === 0}>
              Exportar lista
            </Button>
          </div>
        )}
      </div>

      <ModalNovaVendedora open={modal?.tipo === 'vendedora'} onClose={fechar} onSuccess={avisar} />
      <ModalNovaRemessa
        open={modal?.tipo === 'remessa'}
        vendedoraInicialId={modal?.tipo === 'remessa' ? modal.vendedoraId : undefined}
        onClose={fechar}
        onSuccess={avisar}
      />
      <ModalAcerto remessaId={modal?.tipo === 'acerto' ? modal.remessaId : null} onClose={fechar} onSuccess={avisar} />
      <Toast toast={toast} onDismiss={limparToast} />
    </>
  )
}
