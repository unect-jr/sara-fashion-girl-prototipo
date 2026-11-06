import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router'
import ModalLembretes from '../components/crediario/ModalLembretes'
import PageHeader from '../components/PageHeader'
import BarraFiltros, { CampoBusca } from '../components/ui/BarraFiltros'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Segmented from '../components/ui/Segmented'
import Select from '../components/ui/Select'
import Toast, { type ToastMessage } from '../components/ui/Toast'
import { FORMA_VENDA_LABEL } from '../data/catalogo'
import { formatCurrency, formatDateShort, formatNumber } from '../lib/format'
import { EASE_OUT } from '../lib/motion'
import { descreverVencimento, lembretesDoDia, linhasParcelas, type LinhaParcela, type SituacaoParcela, type TipoLembrete } from '../store/consultas'
import { useAppStore } from '../store/useAppStore'

const ENTALHE: Record<TipoLembrete, string> = { antes: 'bg-info', 'no-dia': 'bg-warning', depois: 'bg-brand' }
const COR_PRAZO = (dias: number) => (dias < 0 ? 'font-semibold text-brand' : dias === 0 ? 'font-semibold text-warning' : 'text-muted')

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

function soma(linhas: LinhaParcela[]): number {
  return linhas.reduce((total, linha) => total + linha.parcela.valor, 0)
}

// Contas a receber das clientes, baixa de parcela e lembretes (HU 4.2 e 4.3)
export default function Crediario() {
  const { state, dispatch } = useAppStore()
  const [aba, setAba] = useState<SituacaoParcela>('a-vencer')
  const [busca, setBusca] = useState('')
  const [vendedoraId, setVendedoraId] = useState('')
  const [lembretesAberto, setLembretesAberto] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const linhas = useMemo(() => linhasParcelas(state), [state])
  const lembretes = useMemo(() => lembretesDoDia(state), [state])
  const porSituacao = (situacao: SituacaoParcela) => linhas.filter((linha) => linha.situacao === situacao)
  const aVencer = porSituacao('a-vencer')
  const vencidas = porSituacao('vencida')
  const pagas = porSituacao('paga')

  const visiveis = useMemo(() => {
    const termo = normalizar(busca.trim())
    return linhas
      .filter((linha) => linha.situacao === aba)
      .filter((linha) => !vendedoraId || linha.crediario.vendedoraId === vendedoraId)
      .filter((linha) => !termo || normalizar(`${linha.crediario.cliente} ${linha.vendedora?.nome ?? ''} ${linha.crediario.vendaId ?? ''}`).includes(termo))
      .toSorted((a, b) =>
        aba === 'paga' ? (b.parcela.pagaEm ?? b.parcela.vencimento).localeCompare(a.parcela.pagaEm ?? a.parcela.vencimento) : a.dias - b.dias,
      )
  }, [linhas, aba, vendedoraId, busca])

  const avisar = useCallback((text: string) => setToast({ id: Date.now(), text }), [])
  const limparToast = useCallback(() => setToast(null), [])

  function marcarPaga(linha: LinhaParcela) {
    dispatch({ type: 'marcarParcelaPaga', crediarioId: linha.crediario.id, numero: linha.parcela.numero, data: state.hoje })
    const parcela = linha.crediario.parcelas.length > 1 ? `Parcela ${linha.parcela.numero}/${linha.crediario.parcelas.length}` : 'Cobrança'
    avisar(`${parcela} de ${linha.crediario.cliente} marcada como paga · ${formatCurrency(linha.parcela.valor)}`)
  }

  const resumoRegras = [
    state.lembretes.antes && `${state.lembretes.diasAntes} dias antes`,
    state.lembretes.noDia && 'no dia',
    state.lembretes.depois && 'depois do vencimento',
  ].filter(Boolean)

  return (
    <>
      <PageHeader
        title="Crediário"
        subtitle={`${formatCurrency(soma(aVencer) + soma(vencidas))} a receber das clientes · ${formatCurrency(soma(vencidas))} em atraso`}
        actions={
          <Button size="xs" onClick={() => setLembretesAberto(true)}>
            Configurar lembretes
          </Button>
        }
      />

      <Card title="Lembretes de hoje" aside={resumoRegras.length > 0 ? `avisa ${resumoRegras.join(', ')}` : 'lembretes desligados'}>
        {lembretes.length === 0 ? (
          <EmptyState title="Nenhuma cobrança para lembrar hoje" description="Quando uma parcela entrar nas regras de lembrete, ela aparece aqui e no Painel." />
        ) : (
          <ul className="border-t border-line">
            <AnimatePresence initial={false}>
              {lembretes.map(({ linha, tipo }) => (
                <motion.li
                  key={`${linha.crediario.id}-${linha.parcela.numero}`}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.25, ease: EASE_OUT }}
                  className="flex items-center gap-4 border-b border-line px-card-x py-3 last:border-b-0"
                >
                  <span aria-hidden className={`h-6.5 w-0.5 shrink-0 rounded-full ${ENTALHE[tipo]}`} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="truncate text-body font-medium text-ink">
                      {linha.crediario.cliente} · <span className={COR_PRAZO(linha.dias)}>{descreverVencimento(linha.dias)}</span>
                    </p>
                    <p className="truncate text-caption text-muted">
                      cliente da {linha.vendedora?.nome.split(' ')[0]} · vencimento {formatDateShort(linha.parcela.vencimento)}
                    </p>
                  </div>
                  <p className="hidden w-28 text-right text-body font-semibold text-ink tabular-nums sm:block">{formatCurrency(linha.parcela.valor)}</p>
                  <Button size="xs" onClick={() => marcarPaga(linha)}>
                    Marcar como paga
                  </Button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Card>

      <BarraFiltros contagem={`${formatNumber(visiveis.length)} ${visiveis.length === 1 ? 'parcela' : 'parcelas'}`}>
        <Segmented
          rotulo="Situação das parcelas"
          valor={aba}
          onChange={setAba}
          tamanho="sm"
          className="w-full sm:w-auto"
          opcoes={[
            { valor: 'a-vencer', rotulo: 'A vencer', detalhe: formatNumber(aVencer.length) },
            { valor: 'vencida', rotulo: 'Vencidas', detalhe: formatNumber(vencidas.length) },
            { valor: 'paga', rotulo: 'Pagas', detalhe: formatNumber(pagas.length) },
          ]}
        />
        <CampoBusca valor={busca} onChange={setBusca} placeholder="Buscar cliente ou venda" rotulo="Buscar parcela" className="sm:w-60" />
        <Select size="sm" aria-label="Vendedora" value={vendedoraId} onChange={(event) => setVendedoraId(event.target.value)} className="w-48">
          <option value="">Todas as vendedoras</option>
          {state.vendedoras.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nome}
            </option>
          ))}
        </Select>
      </BarraFiltros>

      <Card>
        {visiveis.length === 0 ? (
          <EmptyState
            title={aba === 'paga' ? 'Nenhuma parcela paga' : aba === 'vencida' ? 'Nenhuma parcela vencida' : 'Nenhuma parcela a vencer'}
            description={aba === 'vencida' ? 'Tudo em dia com as clientes.' : 'As vendas parceladas, no boleto ou no PIX de confiança aparecem aqui.'}
          />
        ) : (
          <ul>
            <AnimatePresence initial={false} mode="popLayout">
              {visiveis.map((linha) => {
                const { crediario, parcela } = linha
                return (
                  <motion.li
                    key={`${crediario.id}-${parcela.numero}`}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.25, ease: EASE_OUT }}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-card-x py-3.25 last:border-b-0"
                  >
                    <div className="flex min-w-0 flex-1 basis-52 flex-col gap-0.5">
                      <p className="truncate text-body font-medium text-ink">{crediario.cliente}</p>
                      <p className="truncate text-caption text-muted">
                        {linha.vendedora?.nome ?? 'Vendedora'} ·{' '}
                        {crediario.vendaId ? (
                          <Link to="/vendas" className="text-info hover:underline">
                            {crediario.vendaId}
                          </Link>
                        ) : (
                          `venda de ${formatDateShort(crediario.dataVenda)}`
                        )}{' '}
                        · {crediario.forma ? FORMA_VENDA_LABEL[crediario.forma] : 'Parcelado'}
                        {crediario.parcelas.length > 1 ? ` ${parcela.numero}/${crediario.parcelas.length}` : ''}
                      </p>
                    </div>
                    <div className="flex w-36 flex-col gap-0.5 tabular-nums">
                      <p className="text-sub text-ink">{formatDateShort(parcela.vencimento)}</p>
                      <p className={`text-caption ${parcela.paga ? 'text-muted' : COR_PRAZO(linha.dias)}`}>
                        {parcela.paga ? `paga em ${formatDateShort(parcela.pagaEm ?? parcela.vencimento)}` : descreverVencimento(linha.dias)}
                      </p>
                    </div>
                    <p className="w-28 text-right text-row font-semibold text-ink tabular-nums">{formatCurrency(parcela.valor)}</p>
                    <div className="flex w-36 justify-end">
                      {parcela.paga ? (
                        <span className="text-caption font-medium text-info">Recebida</span>
                      ) : (
                        <Button size="xs" variant={linha.dias < 0 ? 'primary' : linha.dias === 0 ? 'warning' : 'secondary'} onClick={() => marcarPaga(linha)}>
                          Marcar como paga
                        </Button>
                      )}
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        )}
      </Card>

      <ModalLembretes open={lembretesAberto} onClose={() => setLembretesAberto(false)} onSuccess={avisar} />
      <Toast toast={toast} onDismiss={limparToast} />
    </>
  )
}
