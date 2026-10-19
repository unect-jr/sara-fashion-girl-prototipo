import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import ModalAcerto from '../components/painel/ModalAcerto'
import ModalNovaRemessa from '../components/painel/ModalNovaRemessa'
import RemessaCard from '../components/remessas/RemessaCard'
import RemessasFiltros, { type FiltrosRemessas } from '../components/remessas/RemessasFiltros'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Toast, { type ToastMessage } from '../components/ui/Toast'
import { formatCurrency, formatMonth, formatNumber } from '../lib/format'
import { EASE_OUT } from '../lib/motion'
import { pecasNaRua, resumoRemessas, valorNaRua, type ResumoRemessa } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'

type ModalAberto = { tipo: 'remessa' } | { tipo: 'acerto'; remessaId: string } | null

const CARREGAMENTO_MS = 450

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

// A remessa conta no mês se esteve na rua em algum dia dele ("YYYY-MM")
function ativaNoMes({ remessa, aberta, ultimoAcerto }: ResumoRemessa, mes: string): boolean {
  const fim = aberta ? '9999-12' : (ultimoAcerto?.data ?? remessa.dataSaida).slice(0, 7)
  return remessa.dataSaida.slice(0, 7) <= mes && fim >= mes
}

// "2026-07" → "2026-08"
function proximoMes(mes: string): string {
  const [ano, m] = mes.split('-').map(Number)
  return m === 12 ? `${ano + 1}-01` : `${ano}-${String(m + 1).padStart(2, '0')}`
}

export default function Remessas() {
  const { state } = useAppStore()
  const mesAtual = state.hoje.slice(0, 7)
  const filtrosIniciais: FiltrosRemessas = { busca: '', vendedoraId: '', mes: mesAtual, somenteAbertas: false }
  const [filtros, setFiltros] = useState<FiltrosRemessas>(filtrosIniciais)
  const [modal, setModal] = useState<ModalAberto>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [carregando, setCarregando] = useState(true)

  // Carregamento simulado na entrada da tela
  useEffect(() => {
    const timer = window.setTimeout(() => setCarregando(false), CARREGAMENTO_MS)
    return () => window.clearTimeout(timer)
  }, [])

  const resumos = useMemo(() => resumoRemessas(state), [state])
  const abertas = resumos.filter((r) => r.aberta).length
  const vendedoras = useMemo(() => state.vendedoras.toSorted((a, b) => a.nome.localeCompare(b.nome)), [state.vendedoras])

  // Do mês da remessa mais antiga até hoje, o mais recente primeiro
  const meses = useMemo(() => {
    const lista: string[] = []
    let mes = resumos.reduce((min, r) => (r.remessa.dataSaida < min ? r.remessa.dataSaida : min), state.hoje).slice(0, 7)
    while (mes <= mesAtual) {
      lista.unshift(mes)
      mes = proximoMes(mes)
    }
    return lista
  }, [resumos, state.hoje, mesAtual])

  const doMes = useMemo(() => (filtros.mes ? resumos.filter((r) => ativaNoMes(r, filtros.mes)) : resumos), [resumos, filtros.mes])

  const filtrados = useMemo(() => {
    const busca = normalizar(filtros.busca.trim())
    return doMes.filter(
      (r) =>
        (!busca || normalizar(r.remessa.id).includes(busca) || normalizar(r.vendedora?.nome ?? '').includes(busca)) &&
        (!filtros.vendedoraId || r.remessa.vendedoraId === filtros.vendedoraId) &&
        (!filtros.somenteAbertas || r.aberta),
    )
  }, [doMes, filtros])

  const abertasNoMes = doMes.filter((r) => r.aberta).length
  const acertadasNoMes = doMes.length - abertasNoMes

  const fechar = useCallback(() => setModal(null), [])
  const avisar = useCallback((text: string) => setToast({ id: Date.now(), text }), [])
  const limparToast = useCallback(() => setToast(null), [])
  const fazerAcerto = useCallback((remessaId: string) => setModal({ tipo: 'acerto', remessaId }), [])

  return (
    <>
      <PageHeader
        title="Remessas"
        subtitle={`${formatNumber(abertas)} em aberto · ${formatNumber(pecasNaRua(state.remessas))} peças na rua · ${formatCurrency(valorNaRua(state))} consignados`}
        actions={
          <>
            <Button size="xs" onClick={() => window.print()}>
              Imprimir romaneios
            </Button>
            <Button size="xs" variant="primary" onClick={() => setModal({ tipo: 'remessa' })}>
              Nova remessa
            </Button>
          </>
        }
      />

      <div className="-mt-1 flex flex-col gap-5">
        <RemessasFiltros
          filtros={filtros}
          vendedoras={vendedoras}
          meses={meses}
          onChange={setFiltros}
          contagem={`${formatNumber(filtrados.length)} ${filtrados.length === 1 ? 'remessa' : 'remessas'}`}
        />

        {carregando ? (
          <div className="flex flex-col gap-3.5" aria-busy="true" aria-label="Carregando remessas">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="h-18 animate-pulse rounded-card border border-line bg-surface" />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <Card>
            <EmptyState
              title="Nenhuma remessa encontrada"
              description="Ajuste a busca ou os filtros, ou crie uma nova remessa."
              action={<Button onClick={() => setFiltros(filtrosIniciais)}>Limpar filtros</Button>}
            />
          </Card>
        ) : (
          <ul className="flex flex-col gap-3.5">
            <AnimatePresence mode="popLayout">
              {filtrados.map((r, index) => (
                <motion.li
                  key={r.remessa.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT, delay: index * 0.04 } }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                >
                  <RemessaCard
                    resumo={r}
                    produtos={state.produtos}
                    hoje={state.hoje}
                    defaultAberto={index === 0}
                    onFazerAcerto={fazerAcerto}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}

        {!carregando && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-button leading-4 text-muted tabular-nums">
              {formatNumber(doMes.length)} {doMes.length === 1 ? 'remessa' : 'remessas'}
              {filtros.mes ? ` em ${formatMonth(`${filtros.mes}-01`)}` : ''} · {formatNumber(abertasNoMes)} em aberto,{' '}
              {formatNumber(acertadasNoMes)} {acertadasNoMes === 1 ? 'acertada' : 'acertadas'}
            </p>
            <Button
              size="xs"
              className="font-medium!"
              onClick={() => setFiltros({ ...filtros, mes: '', somenteAbertas: false })}
              disabled={!filtros.mes && !filtros.somenteAbertas}
            >
              Ver histórico completo
            </Button>
          </div>
        )}
      </div>

      <ModalNovaRemessa open={modal?.tipo === 'remessa'} onClose={fechar} onSuccess={avisar} />
      <ModalAcerto remessaId={modal?.tipo === 'acerto' ? modal.remessaId : null} onClose={fechar} onSuccess={avisar} />
      <Toast toast={toast} onDismiss={limparToast} />
    </>
  )
}
