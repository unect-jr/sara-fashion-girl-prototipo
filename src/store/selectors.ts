import type { AppState, Crediario, Parcela, Produto, Remessa, VariacaoRef } from '../data/types'
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

// RM-0153 → RM-0154
export function proximoIdRemessa(remessas: Remessa[]): string {
  const maior = remessas.reduce((max, remessa) => Math.max(max, Number(remessa.id.replace('RM-', '')) || 0), 0)
  return `RM-${String(maior + 1).padStart(4, '0')}`
}
