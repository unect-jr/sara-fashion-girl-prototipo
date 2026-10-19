import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import EstoqueFiltros, { type FiltrosEstoque } from '../components/estoque/EstoqueFiltros'
import ModalEntradaMercadoria from '../components/estoque/ModalEntradaMercadoria'
import ModalNovoProduto from '../components/estoque/ModalNovoProduto'
import ProdutoCard from '../components/estoque/ProdutoCard'
import ProdutoCardSkeleton from '../components/estoque/ProdutoCardSkeleton'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Toast, { type ToastMessage } from '../components/ui/Toast'
import { formatNumber } from '../lib/format'
import { EASE_OUT } from '../lib/motion'
import { pecasCentral, pecasNaRua, resumoEstoque } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'

type ModalAberto = { tipo: 'entrada'; produtoId?: string } | { tipo: 'novo' } | null

const FILTROS_INICIAIS: FiltrosEstoque = { busca: '', categoria: '', tamanho: '', somenteBaixo: false }
// Duas fileiras de três, como no Figma; "Ver todos os modelos" abre o resto
const POR_PAGINA = 6
const CARREGAMENTO_MS = 450

// Busca sem acento e sem caixa: "calca" acha "Calça"
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

function plural(quantidade: number, singular: string, varios: string): string {
  return `${formatNumber(quantidade)} ${quantidade === 1 ? singular : varios}`
}

export default function Estoque() {
  const { state } = useAppStore()
  const [filtros, setFiltros] = useState(FILTROS_INICIAIS)
  const [mostrarTodos, setMostrarTodos] = useState(false)
  const [modal, setModal] = useState<ModalAberto>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [carregando, setCarregando] = useState(true)

  // Carregamento simulado na entrada da tela
  useEffect(() => {
    const timer = window.setTimeout(() => setCarregando(false), CARREGAMENTO_MS)
    return () => window.clearTimeout(timer)
  }, [])

  const resumo = useMemo(() => resumoEstoque(state), [state])
  const central = pecasCentral(state.produtos)
  const naRua = pecasNaRua(state.remessas)
  const paraRepor = resumo.filter((item) => item.etiqueta).length

  const filtrados = useMemo(() => {
    const busca = normalizar(filtros.busca.trim())
    return resumo.filter(
      ({ produto, porTamanho, estoqueBaixo }) =>
        (!busca || normalizar(produto.nome).includes(busca) || normalizar(produto.sku).includes(busca)) &&
        (!filtros.categoria || produto.categoria === filtros.categoria) &&
        (!filtros.tamanho || porTamanho[filtros.tamanho] > 0) &&
        (!filtros.somenteBaixo || estoqueBaixo),
    )
  }, [resumo, filtros])

  const visiveis = mostrarTodos ? filtrados : filtrados.slice(0, POR_PAGINA)

  const abrir = (proximo: Exclude<ModalAberto, null>) => setModal(proximo)
  const fechar = useCallback(() => setModal(null), [])
  const avisar = useCallback((text: string) => setToast({ id: Date.now(), text }), [])
  const limparToast = useCallback(() => setToast(null), [])

  return (
    <>
      <PageHeader
        title="Estoque"
        subtitle={`${plural(central + naRua, 'peça', 'peças')} em ${plural(state.produtos.length, 'modelo', 'modelos')} · ${formatNumber(central)} no central, ${formatNumber(naRua)} na rua`}
        actions={
          <>
            <Button size="xs" onClick={() => abrir({ tipo: 'novo' })}>
              Novo produto
            </Button>
            <Button size="xs" variant="primary" onClick={() => abrir({ tipo: 'entrada' })}>
              Entrada de mercadoria
            </Button>
          </>
        }
      />

      <div className="-mt-1 flex flex-col gap-5">
        <EstoqueFiltros
          filtros={filtros}
          onChange={setFiltros}
          contagem={`${formatNumber(visiveis.length)} de ${plural(filtrados.length, 'modelo', 'modelos')}`}
        />

        {carregando ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Carregando estoque">
            {Array.from({ length: POR_PAGINA }, (_, i) => (
              <ProdutoCardSkeleton key={i} />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <Card>
            <EmptyState
              title="Nenhum modelo encontrado"
              description="Ajuste a busca ou os filtros para ver outros modelos do estoque."
              action={<Button onClick={() => setFiltros(FILTROS_INICIAIS)}>Limpar filtros</Button>}
            />
          </Card>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visiveis.map((item, index) => (
                <motion.li
                  key={item.produto.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT, delay: (index % POR_PAGINA) * 0.04 } }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                  className="flex"
                >
                  <ProdutoCard resumo={item} onSelect={() => abrir({ tipo: 'entrada', produtoId: item.produto.id })} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}

        {!carregando && filtrados.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-button leading-4 text-muted tabular-nums">
              Mostrando {formatNumber(visiveis.length)} de {plural(filtrados.length, 'modelo', 'modelos')}
              {paraRepor > 0 && ` · ${formatNumber(paraRepor)} ${paraRepor === 1 ? 'precisa' : 'precisam'} de reposição`}
            </p>
            {filtrados.length > POR_PAGINA && (
              <Button size="xs" onClick={() => setMostrarTodos((atual) => !atual)}>
                {mostrarTodos ? 'Mostrar menos' : 'Ver todos os modelos'}
              </Button>
            )}
          </div>
        )}
      </div>

      <ModalEntradaMercadoria
        open={modal?.tipo === 'entrada'}
        onClose={fechar}
        produtoInicialId={modal?.tipo === 'entrada' ? modal.produtoId : undefined}
        onSuccess={avisar}
      />
      <ModalNovoProduto
        open={modal?.tipo === 'novo'}
        onClose={fechar}
        onSuccess={(text) => {
          // Limpa os filtros para o produto novo aparecer no topo da grade
          setFiltros(FILTROS_INICIAIS)
          avisar(text)
        }}
      />
      <Toast toast={toast} onDismiss={limparToast} />
    </>
  )
}
