import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import ModalAjusteEstoque from '../components/estoque/ModalAjusteEstoque'
import ModalEntradaMercadoria from '../components/estoque/ModalEntradaMercadoria'
import ModalExcluirProduto from '../components/estoque/ModalExcluirProduto'
import ModalNovoProduto from '../components/estoque/ModalNovoProduto'
import ListaMovimentacoes from '../components/movimentacoes/ListaMovimentacoes'
import PageHeader from '../components/PageHeader'
import AmostraCor from '../components/ui/AmostraCor'
import Button from '../components/ui/Button'
import { buttonClasses } from '../components/ui/buttonStyles'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Tag from '../components/ui/Tag'
import Toast, { type ToastMessage } from '../components/ui/Toast'
import Medida from '../components/vendedoras/Medida'
import { CATEGORIA_LABEL, TAMANHOS_GRADE } from '../data/catalogo'
import { formatCurrency, formatNumber, formatPecas } from '../lib/format'
import { historicoProduto, saldoComVendedoras } from '../store/consultas'
import { resumoEstoque } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'

type ModalAberto = 'editar' | 'ajuste' | 'entrada' | 'excluir' | null

const CABECALHO = 'px-3 pt-3 pb-2 text-left font-label text-label font-semibold text-muted uppercase'

// Detalhe do produto: saldo por cor e tamanho, com cada vendedora e histórico (HU 2.2, 2.4, 2.5, 2.6)
export default function ProdutoDetalhe() {
  const { id } = useParams()
  const { state, dispatch } = useAppStore()
  const navigate = useNavigate()
  const [modal, setModal] = useState<ModalAberto>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const resumo = useMemo(() => resumoEstoque(state).find((r) => r.produto.id === id), [state, id])
  const movimentacoes = useMemo(() => (id ? historicoProduto(state, id) : []), [state, id])
  const comVendedoras = useMemo(() => (id ? saldoComVendedoras(state, id) : []), [state, id])

  const fechar = useCallback(() => setModal(null), [])
  const avisar = useCallback((text: string) => setToast({ id: Date.now(), text }), [])
  const limparToast = useCallback(() => setToast(null), [])

  if (!resumo) {
    return (
      <>
        <PageHeader title="Produto" />
        <Card>
          <EmptyState
            title="Produto não encontrado"
            description="Ele pode ter sido excluído ou o link está incorreto."
            action={
              <Link to="/estoque" className={buttonClasses()}>
                Voltar para o Estoque
              </Link>
            }
          />
        </Card>
        <Toast toast={toast} onDismiss={limparToast} />
      </>
    )
  }

  const { produto, central, naRua, vendidas30d } = resumo
  const cores = [...new Set(produto.variacoes.map((variacao) => variacao.cor))]
  const margem = produto.preco > 0 ? (produto.preco - produto.custo) / produto.preco : 0
  const qtd = (cor: string, tamanho: string) => produto.variacoes.find((v) => v.cor === cor && v.tamanho === tamanho)?.quantidadeCentral ?? 0

  function alternarAtivo() {
    dispatch({ type: 'inativarProduto', produtoId: produto.id, inativo: !produto.inativo })
    avisar(produto.inativo ? `${produto.nome} voltou para o catálogo` : `${produto.nome} inativado · sai das listas de remessa e entrada`)
  }

  return (
    <>
      <PageHeader
        title={produto.nome}
        subtitle={
          <>
            <Link to="/estoque" className="underline-offset-2 hover:text-ink hover:underline">
              Estoque
            </Link>{' '}
            · {produto.sku} · {CATEGORIA_LABEL[produto.categoria]}
          </>
        }
        actions={
          <>
            <Button size="xs" onClick={() => setModal('editar')}>
              Editar
            </Button>
            <Button size="xs" onClick={() => setModal('ajuste')}>
              Ajustar quantidade
            </Button>
            <Button size="xs" variant="primary" onClick={() => setModal('entrada')}>
              Entrada de mercadoria
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section className="flex h-fit flex-col overflow-hidden rounded-card border border-line bg-surface">
          <div className="relative h-72 bg-surface-muted">
            {produto.imagem ? (
              <img src={produto.imagem} alt={produto.nome} className="size-full object-cover" />
            ) : (
              <span aria-hidden className="flex size-full items-center justify-center text-display font-semibold text-track">
                {produto.nome.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Tag>{CATEGORIA_LABEL[produto.categoria]}</Tag>
              {produto.inativo && <Tag variant="muted">INATIVO</Tag>}
            </div>
            <div className="flex gap-2">
              <Medida label="Preço de venda" value={formatCurrency(produto.preco)} detail={`custo ${formatCurrency(produto.custo)}`} />
              <Medida label="Margem" value={`${Math.round(margem * 100)}%`} detail={`${formatCurrency(produto.preco - produto.custo)} por peça`} />
            </div>
            <div className="flex gap-2">
              <Medida label="No central" value={formatNumber(central)} detail={formatCurrency(central * produto.custo)} apagada={central === 0} />
              <Medida label="Na rua" value={formatNumber(naRua)} detail={`${formatNumber(vendidas30d)} vendidas em 30 dias`} apagada={naRua === 0} />
            </div>
            <div aria-hidden className="h-px w-full bg-line" />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button size="xs" onClick={alternarAtivo}>
                {produto.inativo ? 'Reativar produto' : 'Inativar produto'}
              </Button>
              <Button size="xs" className="text-brand! hover:border-brand!" onClick={() => setModal('excluir')}>
                Excluir
              </Button>
            </div>
          </div>
        </section>

        <div className="flex min-w-0 flex-col gap-5">
          <Card title="Saldo no central por cor e tamanho" aside={formatPecas(central)}>
            <div className="overflow-x-auto border-t border-line px-card-x pb-3">
              <table className="w-full min-w-100 tabular-nums">
                <thead>
                  <tr>
                    <th className={CABECALHO}>Cor</th>
                    {TAMANHOS_GRADE.map((tamanho) => (
                      <th key={tamanho} className={`${CABECALHO} text-right!`}>
                        {tamanho}
                      </th>
                    ))}
                    <th className={`${CABECALHO} text-right!`}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cores.map((cor) => {
                    const total = TAMANHOS_GRADE.reduce((soma, tamanho) => soma + qtd(cor, tamanho), 0)
                    return (
                      <tr key={cor} className="border-t border-line">
                        <td className="px-3 py-2.5">
                          <span className="flex items-center gap-2 text-sub font-medium text-ink">
                            <AmostraCor cor={cor} />
                            {cor}
                          </span>
                        </td>
                        {TAMANHOS_GRADE.map((tamanho) => {
                          const quantidade = qtd(cor, tamanho)
                          return (
                            <td key={tamanho} className={`px-3 py-2.5 text-right text-sub ${quantidade === 0 ? 'text-track' : 'font-semibold text-ink'}`}>
                              {quantidade}
                            </td>
                          )
                        })}
                        <td className="px-3 py-2.5 text-right text-sub font-semibold text-ink">{total}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Com as vendedoras" aside={formatPecas(naRua)}>
            {comVendedoras.length === 0 ? (
              <EmptyState title="Nenhuma peça na rua" description="Quando este modelo sair em remessa, o saldo de cada vendedora aparece aqui." />
            ) : (
              <ul className="border-t border-line">
                {comVendedoras.map((saldo) => (
                  <li key={saldo.vendedora.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-line px-card-x py-3 last:border-b-0">
                    <Link to={`/vendedoras/${saldo.vendedora.id}`} className="w-44 truncate text-sub font-medium text-ink hover:underline">
                      {saldo.vendedora.nome}
                    </Link>
                    <p className="flex min-w-0 flex-1 flex-wrap gap-x-3 gap-y-1 text-caption text-ink-detail tabular-nums">
                      {saldo.itens.map((item) => (
                        <span key={`${item.cor}-${item.tamanho}`} className="flex items-center gap-1.5">
                          <AmostraCor cor={item.cor} tamanho="sm" />
                          {item.tamanho} {item.cor} · {item.quantidade}
                        </span>
                      ))}
                    </p>
                    <p className="text-sub font-semibold text-ink tabular-nums">{formatPecas(saldo.total)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Histórico de movimentações" aside={formatNumber(movimentacoes.length)}>
            <ListaMovimentacoes
              movimentacoes={movimentacoes}
              mostrarProduto={false}
              vazio={{ title: 'Nenhuma movimentação ainda', description: 'Entradas, saídas, vendas e ajustes desta peça aparecem aqui.' }}
            />
          </Card>
        </div>
      </div>

      <ModalNovoProduto open={modal === 'editar'} produtoId={produto.id} onClose={fechar} onSuccess={avisar} />
      <ModalAjusteEstoque produtoId={modal === 'ajuste' ? produto.id : null} onClose={fechar} onSuccess={avisar} />
      <ModalEntradaMercadoria open={modal === 'entrada'} produtoInicialId={produto.id} onClose={fechar} onSuccess={avisar} />
      <ModalExcluirProduto
        produtoId={modal === 'excluir' ? produto.id : null}
        onClose={fechar}
        onInativado={avisar}
        onExcluido={(mensagem) => navigate('/estoque', { state: { aviso: mensagem } })}
      />
      <Toast toast={toast} onDismiss={limparToast} />
    </>
  )
}
