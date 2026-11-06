import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import NumeroRolante from '../components/ui/NumeroRolante'
import Toast, { type ToastMessage } from '../components/ui/Toast'
import ModalVenda from '../components/vendas/ModalVenda'
import SeletorPecas from '../components/vendas/SeletorPecas'
import VendaLinha from '../components/vendas/VendaLinha'
import Medida from '../components/vendedoras/Medida'
import { formatCurrency, formatDateShort, formatMonth, formatNumber, formatPecas } from '../lib/format'
import { roundCents } from '../lib/remessa'
import { describePrazo } from '../lib/status'
import { pecasEmMaos, totaisVendas, vendasDoDia } from '../store/consultas'
import { remessasAbertas } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'

const SPRING = { type: 'spring', stiffness: 420, damping: 34 } as const

// Tela da vendedora (HU 3.2): só as peças dela, marca o que vendeu e dá baixa na hora
export default function VendaBaixa() {
  const { state } = useAppStore()
  const { usuario } = useAuth()
  const vendedora = state.vendedoras.find((v) => v.id === usuario?.vendedoraId)
  const [quantidades, setQuantidades] = useState<Record<string, number>>({})
  const [modalAberto, setModalAberto] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const pecas = useMemo(() => (vendedora ? pecasEmMaos(state, vendedora.id) : []), [state, vendedora])
  const minhas = useMemo(
    () =>
      vendedora
        ? state.vendas.filter((venda) => venda.vendedoraId === vendedora.id).toSorted((a, b) => `${b.data} ${b.id}`.localeCompare(`${a.data} ${a.id}`))
        : [],
    [state.vendas, vendedora],
  )

  const avisar = useCallback((text: string) => setToast({ id: Date.now(), text }), [])
  const limparToast = useCallback(() => setToast(null), [])

  if (!vendedora) {
    return (
      <>
        <PageHeader title="Venda e baixa" />
        <Card>
          <EmptyState title="Seu acesso não está ligado a uma vendedora" description="Peça para a administração da loja revisar o seu cadastro." />
        </Card>
      </>
    )
  }

  const emMaos = pecas.reduce((total, peca) => total + peca.quantidade, 0)
  const valorEmMaos = pecas.reduce((total, peca) => total + peca.quantidade * peca.produto.preco, 0)
  const hoje = vendasDoDia(state, vendedora.id)
  const mes = totaisVendas(minhas.filter((venda) => venda.data.startsWith(state.hoje.slice(0, 7))))
  const proxima = remessasAbertas(state.remessas)
    .filter((r) => r.vendedoraId === vendedora.id)
    .toSorted((a, b) => a.prazoAcerto.localeCompare(b.prazoAcerto))[0]

  const selecionadas = pecas.filter((peca) => (quantidades[peca.chave] ?? 0) > 0)
  const pecasSelecionadas = selecionadas.reduce((total, peca) => total + (quantidades[peca.chave] ?? 0), 0)
  const valorSelecionado = roundCents(selecionadas.reduce((total, peca) => total + (quantidades[peca.chave] ?? 0) * peca.produto.preco, 0))

  return (
    <>
      <PageHeader title={`Olá, ${vendedora.nome.split(' ')[0]}`} />

      <section className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Medida label="Com você" value={formatPecas(emMaos)} detail={formatCurrency(valorEmMaos)} apagada={emMaos === 0} />
          <Medida label="Vendido hoje" value={formatCurrency(hoje.valor)} detail={formatPecas(hoje.pecas)} apagada={hoje.pecas === 0} />
          <Medida label={`Vendido em ${formatMonth(state.hoje)}`} value={formatCurrency(mes.valor)} detail={formatPecas(mes.pecas)} />
        </div>
        {proxima && (
          <p className="text-caption text-muted">
            Próximo acerto com a loja: {formatDateShort(proxima.prazoAcerto)} ({describePrazo(proxima.prazoAcerto, state.hoje)}) · remessa {proxima.id}
          </p>
        )}
      </section>

      <Card title="Suas peças" aside="toque em + no que você vendeu">
        <div className="px-card-x pb-5">
          <SeletorPecas
            pecas={pecas}
            quantidades={quantidades}
            rotuloSaldo="com você"
            onChange={(chave, quantidade) => setQuantidades((atual) => ({ ...atual, [chave]: quantidade }))}
            vazio={{ title: 'Você não tem peças em mãos', description: 'Quando a loja enviar uma remessa, as peças aparecem aqui.' }}
          />
        </div>
      </Card>

      <Card title="Suas vendas" aside={formatNumber(minhas.length)}>
        {minhas.length === 0 ? (
          <EmptyState title="Nenhuma venda ainda" description="As vendas que você der baixa aparecem aqui." />
        ) : (
          <ul className="border-t border-line">
            {minhas.slice(0, 10).map((venda) => (
              <VendaLinha key={venda.id} venda={venda} mostrarVendedora={false} />
            ))}
          </ul>
        )}
      </Card>

      {/* Espaço para a barra flutuante não cobrir a lista */}
      {pecasSelecionadas > 0 && <div aria-hidden className="h-16" />}

      {/* Barra que surge e cresce com a seleção (inspirada no "Dynamic island" do Skiper UI) */}
      <div className="pointer-events-none fixed inset-x-4 bottom-6 z-30 flex justify-center lg:left-[calc(var(--spacing-rail)+1rem)]">
        <AnimatePresence>
          {pecasSelecionadas > 0 && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 24, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.85 }}
              transition={SPRING}
              className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink py-2 pr-2 pl-5 text-white shadow-modal"
            >
              <p className="flex items-center gap-1.5 text-button font-medium whitespace-nowrap tabular-nums">
                <NumeroRolante valor={pecasSelecionadas} /> {pecasSelecionadas === 1 ? 'peça' : 'peças'} ·{' '}
                <NumeroRolante valor={formatCurrency(valorSelecionado)} />
              </p>
              <button
                type="button"
                onClick={() => setQuantidades({})}
                className="rounded-full px-3 py-1.5 text-button-sm font-medium text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-white"
              >
                Limpar
              </button>
              <Button variant="primary" size="sm" onClick={() => setModalAberto(true)}>
                Dar baixa
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ModalVenda
        open={modalAberto}
        vendedoraId={vendedora.id}
        selecao={quantidades}
        onClose={() => setModalAberto(false)}
        onSuccess={(mensagem) => {
          setQuantidades({})
          avisar(mensagem)
        }}
      />
      <Toast toast={toast} onDismiss={limparToast} />
    </>
  )
}
