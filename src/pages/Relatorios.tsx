import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import PageHeader from '../components/PageHeader'
import BarrasHorizontais from '../components/relatorios/BarrasHorizontais'
import GraficoBarras, { type Barra } from '../components/relatorios/GraficoBarras'
import BarraFiltros from '../components/ui/BarraFiltros'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Segmented from '../components/ui/Segmented'
import Select from '../components/ui/Select'
import Medida from '../components/vendedoras/Medida'
import type { ItemVenda, Venda } from '../data/types'
import { addDays } from '../lib/date'
import { formatCurrency, formatDateShort, formatNumber, formatPecas } from '../lib/format'
import { roundCents } from '../lib/remessa'
import { useAppStore } from '../store/useAppStore'

type Periodo = '7' | '30' | '90'

const PERIODOS = [
  { valor: '7' as const, rotulo: '7 dias' },
  { valor: '30' as const, rotulo: '30 dias' },
  { valor: '90' as const, rotulo: '90 dias' },
]
const RANKING = 5

interface Linha {
  venda: Venda
  item: ItemVenda
}

// Gráficos de vendas por período, vendedora e produto, com ranking (HU 5.2)
export default function Relatorios() {
  const { state } = useAppStore()
  const [periodo, setPeriodo] = useState<Periodo>('30')
  const [vendedoraId, setVendedoraId] = useState('')
  const [produtoId, setProdutoId] = useState('')

  const dias = Number(periodo)
  const inicio = addDays(state.hoje, -dias + 1)

  // Itens vendidos no período (vendas ativas), já filtrados por vendedora e produto
  const linhas = useMemo<Linha[]>(
    () =>
      state.vendas
        .filter((venda) => !venda.cancelamento && venda.data >= inicio && venda.data <= state.hoje && (!vendedoraId || venda.vendedoraId === vendedoraId))
        .flatMap((venda) => venda.itens.filter((item) => !produtoId || item.produtoId === produtoId).map((item) => ({ venda, item }))),
    [state.vendas, state.hoje, inicio, vendedoraId, produtoId],
  )

  const faturamento = roundCents(linhas.reduce((t, { item }) => t + item.quantidade * item.preco, 0))
  const pecas = linhas.reduce((t, { item }) => t + item.quantidade, 0)
  const vendas = new Set(linhas.map(({ venda }) => venda.id)).size

  // 7 e 30 dias por dia; 90 dias por semana
  const barras = useMemo<Barra[]>(() => {
    const passo = dias > 30 ? 7 : 1
    const grupos: Barra[] = []
    for (let offset = 0; offset < dias; offset += passo) {
      const de = addDays(inicio, offset)
      const ate = addDays(de, passo - 1)
      const doGrupo = linhas.filter(({ venda }) => venda.data >= de && venda.data <= ate)
      const valor = roundCents(doGrupo.reduce((t, { item }) => t + item.quantidade * item.preco, 0))
      const qtd = doGrupo.reduce((t, { item }) => t + item.quantidade, 0)
      grupos.push({
        chave: de,
        rotulo: passo === 1 ? formatDateShort(de) : `${formatDateShort(de)}`,
        valor,
        detalhe: passo === 1 ? formatPecas(qtd) : `${formatPecas(qtd)} na semana`,
      })
    }
    return grupos
  }, [linhas, dias, inicio])

  const porVendedora = useMemo(
    () =>
      state.vendedoras
        .map((vendedora) => {
          const daVendedora = linhas.filter(({ venda }) => venda.vendedoraId === vendedora.id)
          return {
            vendedora,
            valor: roundCents(daVendedora.reduce((t, { item }) => t + item.quantidade * item.preco, 0)),
            pecas: daVendedora.reduce((t, { item }) => t + item.quantidade, 0),
          }
        })
        .filter((linha) => !vendedoraId || linha.vendedora.id === vendedoraId)
        .toSorted((a, b) => b.valor - a.valor),
    [state.vendedoras, linhas, vendedoraId],
  )

  // Ranking por peças; os menos vendidos incluem modelos ativos sem venda no período
  const porProduto = useMemo(
    () =>
      state.produtos
        .filter((produto) => !produto.inativo && (!produtoId || produto.id === produtoId))
        .map((produto) => {
          const doProduto = linhas.filter(({ item }) => item.produtoId === produto.id)
          return {
            produto,
            pecas: doProduto.reduce((t, { item }) => t + item.quantidade, 0),
            valor: roundCents(doProduto.reduce((t, { item }) => t + item.quantidade * item.preco, 0)),
          }
        }),
    [state.produtos, linhas, produtoId],
  )
  const maisVendidos = porProduto.filter((p) => p.pecas > 0).toSorted((a, b) => b.pecas - a.pecas || b.valor - a.valor).slice(0, RANKING)
  const menosVendidos = porProduto.toSorted((a, b) => a.pecas - b.pecas || a.valor - b.valor).slice(0, RANKING)

  const produtos = useMemo(() => state.produtos.toSorted((a, b) => a.nome.localeCompare(b.nome)), [state.produtos])
  const linhaProduto = (p: (typeof porProduto)[number]) => ({
    chave: p.produto.id,
    titulo: (
      <Link to={`/estoque/${p.produto.id}`} className="hover:underline">
        {p.produto.nome}
      </Link>
    ),
    subtitulo: p.produto.sku,
    valor: p.pecas,
    rotuloValor: formatPecas(p.pecas),
    detalhe: formatCurrency(p.valor),
  })

  return (
    <>
      <PageHeader title="Relatórios" subtitle={`Vendas de ${formatDateShort(inicio)} a ${formatDateShort(state.hoje)}`} />

      <div className="-mt-1 flex flex-col gap-5">
        <BarraFiltros>
          <Segmented rotulo="Período" opcoes={PERIODOS} valor={periodo} onChange={setPeriodo} tamanho="sm" className="w-full sm:w-auto" />
          <Select size="sm" aria-label="Vendedora" value={vendedoraId} onChange={(event) => setVendedoraId(event.target.value)} className="w-48">
            <option value="">Todas as vendedoras</option>
            {state.vendedoras.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
              </option>
            ))}
          </Select>
          <Select size="sm" aria-label="Produto" value={produtoId} onChange={(event) => setProdutoId(event.target.value)} className="w-52">
            <option value="">Todos os produtos</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Select>
        </BarraFiltros>

        <section className="flex flex-col gap-2 rounded-card border border-line bg-surface p-5 sm:flex-row">
          <Medida label="Faturamento" value={formatCurrency(faturamento)} detail={`${formatNumber(vendas)} ${vendas === 1 ? 'venda' : 'vendas'}`} apagada={faturamento === 0} />
          <Medida label="Peças vendidas" value={formatNumber(pecas)} detail={`em ${dias} dias`} apagada={pecas === 0} />
          <Medida label="Ticket médio" value={formatCurrency(vendas > 0 ? faturamento / vendas : 0)} detail="por venda" apagada={vendas === 0} />
        </section>

        <Card title={dias > 30 ? 'Vendas por semana' : 'Vendas por dia'} aside={formatCurrency(faturamento)}>
          <GraficoBarras barras={barras} formatar={formatCurrency} vazio="Nenhuma venda nesse período. Escolha um período maior ou outra vendedora." />
        </Card>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Card title="Por vendedora" className="h-fit">
            <div className="border-t border-line">
              <BarrasHorizontais
                linhas={porVendedora.map((linha) => ({
                  chave: linha.vendedora.id,
                  titulo: linha.vendedora.nome,
                  subtitulo: linha.vendedora.regiao,
                  valor: linha.valor,
                  rotuloValor: formatCurrency(linha.valor),
                  detalhe: formatPecas(linha.pecas),
                }))}
              />
            </div>
          </Card>
          <Card title="Mais vendidos" aside="por peças" className="h-fit">
            {maisVendidos.length === 0 ? (
              <EmptyState title="Nenhuma venda no período" description="O ranking aparece quando houver vendas." />
            ) : (
              <div className="border-t border-line">
                <BarrasHorizontais numerar linhas={maisVendidos.map(linhaProduto)} />
              </div>
            )}
          </Card>
          <Card title="Menos vendidos" aside="modelos ativos" className="h-fit">
            <div className="border-t border-line">
              <BarrasHorizontais numerar cor="brand" linhas={menosVendidos.map(linhaProduto)} />
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
