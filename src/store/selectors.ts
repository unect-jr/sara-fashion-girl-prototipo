import { SKU_PREFIXO } from '../data/catalogo'
import type {
  Acerto,
  AppState,
  Categoria,
  Crediario,
  Parcela,
  Produto,
  Remessa,
  ItemVenda,
  Tamanho,
  VariacaoRef,
  Venda,
  Vendedora,
} from '../data/types'
import { addDays } from '../lib/date'
import { pendentes, roundCents, sameVariacao } from '../lib/remessa'
import { getStatusPrazo, type StatusPrazo } from '../lib/status'

// Alerta de estoque baixo: ≤ 3 unidades no central (docs/produto.md §5)
export const LIMITE_ESTOQUE_BAIXO = 3

export function getProduto(produtos: Produto[], produtoId: string): Produto | undefined {
  return produtos.find((produto) => produto.id === produtoId)
}

// Quantidade disponível no central para uma variação
export function estoqueCentral(produtos: Produto[], produtoId: string, ref: VariacaoRef): number {
  return getProduto(produtos, produtoId)?.variacoes.find((variacao) => sameVariacao(variacao, ref))?.quantidadeCentral ?? 0
}

export function pecasCentral(produtos: Produto[]): number {
  return produtos.reduce(
    (total, produto) => total + produto.variacoes.reduce((soma, variacao) => soma + variacao.quantidadeCentral, 0),
    0,
  )
}

export function custoCentral(produtos: Produto[]): number {
  return produtos.reduce(
    (total, produto) =>
      total + produto.variacoes.reduce((soma, variacao) => soma + variacao.quantidadeCentral * produto.custo, 0),
    0,
  )
}

export function remessasAbertas(remessas: Remessa[]): Remessa[] {
  return remessas.filter((remessa) => remessa.status !== 'fechada')
}

export function pecasNaRemessa(remessa: Remessa): number {
  return remessa.itens.reduce((total, item) => total + pendentes(item), 0)
}

// Valor de venda das peças que ainda estão com a vendedora
export function valorConsignado(remessa: Remessa, produtos: Produto[]): number {
  return remessa.itens.reduce(
    (total, item) => total + pendentes(item) * (getProduto(produtos, item.produtoId)?.preco ?? 0),
    0,
  )
}

export function pecasNaRua(remessas: Remessa[]): number {
  return remessasAbertas(remessas).reduce((total, remessa) => total + pecasNaRemessa(remessa), 0)
}

export function valorNaRua(state: AppState): number {
  return remessasAbertas(state.remessas).reduce((total, remessa) => total + valorConsignado(remessa, state.produtos), 0)
}

export interface AcertoPendente {
  remessa: Remessa
  status: StatusPrazo
  pecas: number
  valor: number
}

// Remessas abertas ordenadas pelo prazo (a mais urgente primeiro)
export function acertosPendentes(state: AppState): AcertoPendente[] {
  return remessasAbertas(state.remessas)
    .toSorted((a, b) => a.prazoAcerto.localeCompare(b.prazoAcerto))
    .map((remessa) => ({
      remessa,
      status: getStatusPrazo(remessa.prazoAcerto, state.hoje),
      pecas: pecasNaRemessa(remessa),
      valor: valorConsignado(remessa, state.produtos),
    }))
}

export function parcelasEmAberto(crediario: Crediario): Parcela[] {
  return crediario.parcelas.filter((parcela) => !parcela.paga)
}

export function saldoCrediario(crediarios: Crediario[]): number {
  return crediarios.reduce(
    (total, crediario) => total + parcelasEmAberto(crediario).reduce((soma, parcela) => soma + parcela.valor, 0),
    0,
  )
}

export function saldoEmAtraso(crediarios: Crediario[], hoje: AppState['hoje']): number {
  return crediarios.reduce(
    (total, crediario) =>
      total +
      parcelasEmAberto(crediario)
        .filter((parcela) => getStatusPrazo(parcela.vencimento, hoje) === 'atrasado')
        .reduce((soma, parcela) => soma + parcela.valor, 0),
    0,
  )
}

export interface VendidoNoMes {
  pecas: number
  valorBruto: number
  comissao: number
}

// Itens de vendas ativas que ainda não passaram por acerto (venda e baixa da vendedora)
export function itensSemAcerto(state: AppState): { venda: Venda; item: ItemVenda }[] {
  return state.vendas
    .filter((venda) => !venda.cancelamento)
    .flatMap((venda) => venda.itens.filter((item) => !item.acertoId).map((item) => ({ venda, item })))
}

// Vendido no mês de "hoje": acertos do mês + vendas registradas e ainda não acertadas
export function vendidoNoMes(state: AppState, vendedoraId?: string): VendidoNoMes {
  const mes = state.hoje.slice(0, 7)
  const remessas = state.remessas.filter((remessa) => !vendedoraId || remessa.vendedoraId === vendedoraId)
  const ids = new Set(remessas.map((remessa) => remessa.id))
  const doMes = state.acertos.filter((acerto) => ids.has(acerto.remessaId) && acerto.data.startsWith(mes))
  const remessaIds = new Set(doMes.map((acerto) => acerto.remessaId))
  let pecas = remessas
    .filter((remessa) => remessaIds.has(remessa.id))
    .reduce((total, remessa) => total + remessa.itens.reduce((soma, item) => soma + item.vendida, 0), 0)
  let valorBruto = doMes.reduce((total, acerto) => total + acerto.valorBruto, 0)
  let comissao = doMes.reduce((total, acerto) => total + acerto.comissao, 0)

  for (const { venda, item } of itensSemAcerto(state)) {
    if (!venda.data.startsWith(mes) || (vendedoraId && venda.vendedoraId !== vendedoraId)) continue
    const taxa = state.vendedoras.find((vendedora) => vendedora.id === venda.vendedoraId)?.comissao ?? 0
    pecas += item.quantidade
    valorBruto += item.quantidade * item.preco
    comissao += item.quantidade * item.preco * taxa
  }
  return { pecas, valorBruto: roundCents(valorBruto), comissao: roundCents(comissao) }
}

export interface VariacaoBaixa extends VariacaoRef {
  produto: Produto
  quantidadeCentral: number
}

export function estoqueBaixo(produtos: Produto[]): VariacaoBaixa[] {
  return produtos.flatMap((produto) =>
    produto.variacoes
      .filter((variacao) => variacao.quantidadeCentral <= LIMITE_ESTOQUE_BAIXO)
      .map((variacao) => ({ ...variacao, produto })),
  )
}

// Etiqueta do card: TUDO NA RUA (nada no central, peças com vendedoras) ou REPOR (algum tamanho esgotado)
export type EtiquetaEstoque = 'tudo-na-rua' | 'repor'

export interface ResumoProduto {
  produto: Produto
  central: number
  naRua: number
  porTamanho: Record<Tamanho, number>
  vendidas30d: number
  etiqueta?: EtiquetaEstoque
  estoqueBaixo: boolean
}

const JANELA_GIRO_DIAS = 30

// Totais por produto para a grade do Estoque; percorre remessas e acertos uma vez só
export function resumoEstoque(state: AppState): ResumoProduto[] {
  const naRua = new Map<string, number>()
  for (const remessa of remessasAbertas(state.remessas)) {
    for (const item of remessa.itens) naRua.set(item.produtoId, (naRua.get(item.produtoId) ?? 0) + pendentes(item))
  }

  // Giro: vendidas das remessas que tiveram acerto nos últimos 30 dias
  const inicioJanela = addDays(state.hoje, -JANELA_GIRO_DIAS)
  const remessasComGiro = new Set(state.acertos.filter((a) => a.data >= inicioJanela).map((a) => a.remessaId))
  const vendidas = new Map<string, number>()
  for (const remessa of state.remessas) {
    if (!remessasComGiro.has(remessa.id)) continue
    for (const item of remessa.itens) vendidas.set(item.produtoId, (vendidas.get(item.produtoId) ?? 0) + item.vendida)
  }
  // Mais o que as vendedoras já baixaram e ainda não acertaram
  for (const { venda, item } of itensSemAcerto(state)) {
    if (venda.data >= inicioJanela) vendidas.set(item.produtoId, (vendidas.get(item.produtoId) ?? 0) + item.quantidade)
  }

  return state.produtos.map((produto) => {
    const porTamanho: Record<Tamanho, number> = { PP: 0, P: 0, M: 0, G: 0, GG: 0 }
    for (const variacao of produto.variacoes) porTamanho[variacao.tamanho] += variacao.quantidadeCentral
    const tamanhos = [...new Set(produto.variacoes.map((variacao) => variacao.tamanho))]
    const central = tamanhos.reduce((total, tamanho) => total + porTamanho[tamanho], 0)
    const rua = naRua.get(produto.id) ?? 0

    let etiqueta: EtiquetaEstoque | undefined
    if (central === 0 && rua > 0) etiqueta = 'tudo-na-rua'
    else if (tamanhos.some((tamanho) => porTamanho[tamanho] === 0)) etiqueta = 'repor'

    return {
      produto,
      central,
      naRua: rua,
      porTamanho,
      vendidas30d: vendidas.get(produto.id) ?? 0,
      etiqueta,
      estoqueBaixo: tamanhos.some((tamanho) => porTamanho[tamanho] <= LIMITE_ESTOQUE_BAIXO),
    }
  })
}

export interface ResumoVendedora {
  vendedora: Vendedora
  // Remessa aberta de prazo mais próximo (a que define o traço do card)
  remessa?: Remessa
  status?: StatusPrazo
  ultimoAcerto?: Acerto
  emPoder: number
  valorEmPoder: number
  vendidoMes: VendidoNoMes
}

// Totais por vendedora para a grade de Vendedoras (Figma 16:57)
export function resumoVendedoras(state: AppState): ResumoVendedora[] {
  return state.vendedoras
    .filter((vendedora) => vendedora.ativa)
    .map((vendedora) => {
      const daVendedora = state.remessas.filter((remessa) => remessa.vendedoraId === vendedora.id)
      const abertas = remessasAbertas(daVendedora).toSorted((a, b) => a.prazoAcerto.localeCompare(b.prazoAcerto))
      const ids = new Set(daVendedora.map((remessa) => remessa.id))
      const acertos = state.acertos.filter((acerto) => ids.has(acerto.remessaId))

      return {
        vendedora,
        remessa: abertas[0],
        status: abertas[0] && getStatusPrazo(abertas[0].prazoAcerto, state.hoje),
        ultimoAcerto: acertos.toSorted((a, b) => b.data.localeCompare(a.data))[0],
        emPoder: abertas.reduce((total, remessa) => total + pecasNaRemessa(remessa), 0),
        valorEmPoder: abertas.reduce((total, remessa) => total + valorConsignado(remessa, state.produtos), 0),
        vendidoMes: vendidoNoMes(state, vendedora.id),
      }
    })
}

export interface ResumoRemessa {
  remessa: Remessa
  vendedora?: Vendedora
  aberta: boolean
  // Só nas abertas
  status?: StatusPrazo
  // Abertas: o que ainda está na rua; fechadas: o que foi enviado
  pecas: number
  valor: number
  vendidas: number
  devolvidas: number
  ultimoAcerto?: Acerto
}

// Linhas da tela de Remessas (Figma 17:57): abertas pelo prazo, depois as acertadas mais recentes
export function resumoRemessas(state: AppState): ResumoRemessa[] {
  const resumos = state.remessas.map((remessa): ResumoRemessa => {
    const aberta = remessa.status !== 'fechada'
    const enviadas = remessa.itens.reduce((total, item) => total + item.enviada, 0)
    const valorEnviado = remessa.itens.reduce(
      (total, item) => total + item.enviada * (getProduto(state.produtos, item.produtoId)?.preco ?? 0),
      0,
    )
    return {
      remessa,
      vendedora: state.vendedoras.find((vendedora) => vendedora.id === remessa.vendedoraId),
      aberta,
      status: aberta ? getStatusPrazo(remessa.prazoAcerto, state.hoje) : undefined,
      pecas: aberta ? pecasNaRemessa(remessa) : enviadas,
      valor: aberta ? valorConsignado(remessa, state.produtos) : valorEnviado,
      vendidas: remessa.itens.reduce((total, item) => total + item.vendida, 0),
      devolvidas: remessa.itens.reduce((total, item) => total + item.devolvida, 0),
      ultimoAcerto: state.acertos
        .filter((acerto) => acerto.remessaId === remessa.id)
        .toSorted((a, b) => b.data.localeCompare(a.data))[0],
    }
  })
  return [
    ...resumos.filter((r) => r.aberta).toSorted((a, b) => a.remessa.prazoAcerto.localeCompare(b.remessa.prazoAcerto)),
    ...resumos
      .filter((r) => !r.aberta)
      .toSorted((a, b) => (b.ultimoAcerto?.data ?? b.remessa.dataSaida).localeCompare(a.ultimoAcerto?.data ?? a.remessa.dataSaida)),
  ]
}

export interface ItemRomaneio {
  produto: Produto
  grade: Record<Tamanho, number>
  quantidade: number
  subtotal: number
}

// Itens do romaneio agrupados por produto, com a grade enviada (Figma 17:83)
export function itensRomaneio(remessa: Remessa, produtos: Produto[]): ItemRomaneio[] {
  const porProduto = new Map<string, ItemRomaneio>()
  for (const item of remessa.itens) {
    const produto = getProduto(produtos, item.produtoId)
    if (!produto) continue
    const atual = porProduto.get(produto.id) ?? { produto, grade: { PP: 0, P: 0, M: 0, G: 0, GG: 0 }, quantidade: 0, subtotal: 0 }
    atual.grade[item.tamanho] += item.enviada
    atual.quantidade += item.enviada
    atual.subtotal += item.enviada * produto.preco
    porProduto.set(produto.id, atual)
  }
  return [...porProduto.values()]
}

// v6 → v7
export function proximoIdVendedora(vendedoras: Vendedora[]): string {
  const maior = vendedoras.reduce((max, vendedora) => Math.max(max, Number(vendedora.id.slice(1)) || 0), 0)
  return `v${maior + 1}`
}

// VST-0312 → próximo número livre da categoria (VST-0313)
export function proximoSku(produtos: Produto[], categoria: Categoria): string {
  const prefixo = SKU_PREFIXO[categoria]
  const maior = produtos
    .filter((produto) => produto.sku.startsWith(`${prefixo}-`))
    .reduce((max, produto) => Math.max(max, Number(produto.sku.slice(prefixo.length + 1)) || 0), 0)
  return `${prefixo}-${String(maior + 1).padStart(4, '0')}`
}

// p26 → p27
export function proximoIdProduto(produtos: Produto[]): string {
  const maior = produtos.reduce((max, produto) => Math.max(max, Number(produto.id.slice(1)) || 0), 0)
  return `p${String(maior + 1).padStart(2, '0')}`
}

// RM-0153 → RM-0154
export function proximoIdRemessa(remessas: Remessa[]): string {
  const maior = remessas.reduce((max, remessa) => Math.max(max, Number(remessa.id.replace('RM-', '')) || 0), 0)
  return `RM-${String(maior + 1).padStart(4, '0')}`
}
