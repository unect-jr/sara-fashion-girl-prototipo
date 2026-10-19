import { SKU_PREFIXO } from '../data/catalogo'
import type { AppState, Categoria, Crediario, Parcela, Produto, Remessa, Tamanho, VariacaoRef } from '../data/types'
import { addDays } from '../lib/date'
import { pendentes, sameVariacao } from '../lib/remessa'
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
