import type { ItemRemessa, Produto, StatusRemessa, VariacaoRef } from '../data/types'

export function sameVariacao(a: VariacaoRef, b: VariacaoRef): boolean {
  return a.tamanho === b.tamanho && a.cor === b.cor
}

// Peças que ainda estão com a vendedora
export function pendentes(item: ItemRemessa): number {
  return item.enviada - item.devolvida - item.vendida
}

export function statusRemessa(itens: ItemRemessa[]): StatusRemessa {
  if (itens.every((item) => pendentes(item) === 0)) return 'fechada'
  if (itens.some((item) => item.devolvida + item.vendida > 0)) return 'parcial'
  return 'aberta'
}

export function roundCents(value: number): number {
  return Math.round(value * 100) / 100
}

// Valor a receber = Σ(vendidas × preço) − comissão (docs/produto.md §5)
export function calcularValoresAcerto(
  vendidas: { produtoId: string; vendida: number }[],
  produtos: Produto[],
  taxaComissao: number,
) {
  const valorBruto = roundCents(
    vendidas.reduce((total, item) => {
      const preco = produtos.find((produto) => produto.id === item.produtoId)?.preco ?? 0
      return total + item.vendida * preco
    }, 0),
  )
  const comissao = roundCents(valorBruto * taxaComissao)
  return { valorBruto, comissao, valorAReceber: roundCents(valorBruto - comissao) }
}
