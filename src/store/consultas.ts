import { ORDEM_TAMANHOS } from '../data/catalogo'
import type { AppState, Crediario, Movimentacao, Parcela, Produto, Tamanho, Usuario, VariacaoRef, Venda, Vendedora } from '../data/types'
import { diffDays } from '../lib/date'
import { pendentes, roundCents } from '../lib/remessa'
import { getProduto, remessasAbertas } from './selectors'

export function compararTamanho(a: Tamanho, b: Tamanho): number {
  return ORDEM_TAMANHOS.indexOf(a) - ORDEM_TAMANHOS.indexOf(b)
}

export function chaveVariacao(produtoId: string, ref: VariacaoRef): string {
  return `${produtoId}|${ref.tamanho}|${ref.cor}`
}

// ---------- Vendas ----------

export function vendaAcertada(venda: Venda): boolean {
  return venda.itens.some((item) => item.acertoId !== undefined)
}

export function pecasDaVenda(venda: Venda): number {
  return venda.itens.reduce((total, item) => total + item.quantidade, 0)
}

export type BloqueioVenda = 'cancelada' | 'acertada' | 'parcela-paga'

// Venda só pode ser cancelada/corrigida antes do acerto e sem parcela paga (HU 3.4)
export function bloqueioDaVenda(state: AppState, venda: Venda): BloqueioVenda | undefined {
  if (venda.cancelamento) return 'cancelada'
  if (vendaAcertada(venda)) return 'acertada'
  const crediario = state.crediarios.find((c) => c.id === venda.crediarioId)
  if (crediario?.parcelas.some((parcela) => parcela.paga)) return 'parcela-paga'
  return undefined
}

export const MOTIVO_BLOQUEIO: Record<BloqueioVenda, string> = {
  cancelada: 'Esta venda já foi cancelada.',
  acertada: 'Esta venda já entrou em um acerto e não pode mais ser alterada.',
  'parcela-paga': 'A cliente já pagou uma parcela desta venda. Estorne o pagamento antes de alterar.',
}

export interface TotaisVenda {
  vendas: number
  pecas: number
  valor: number
}

export function totaisVendas(vendas: Venda[]): TotaisVenda {
  const ativas = vendas.filter((venda) => !venda.cancelamento)
  return {
    vendas: ativas.length,
    pecas: ativas.reduce((total, venda) => total + pecasDaVenda(venda), 0),
    valor: roundCents(ativas.reduce((total, venda) => total + venda.total, 0)),
  }
}

export function vendasDoDia(state: AppState, vendedoraId?: string): TotaisVenda {
  return totaisVendas(state.vendas.filter((venda) => venda.data === state.hoje && (!vendedoraId || venda.vendedoraId === vendedoraId)))
}

export function proximoIdVenda(vendas: Venda[]): string {
  const maior = vendas.reduce((max, venda) => Math.max(max, Number(venda.id.replace('VD-', '')) || 0), 0)
  return `VD-${String(maior + 1).padStart(4, '0')}`
}

export function proximoIdCrediario(crediarios: Crediario[]): string {
  const maior = crediarios.reduce((max, crediario) => Math.max(max, Number(crediario.id.replace('CR-', '')) || 0), 0)
  return `CR-${String(maior + 1).padStart(2, '0')}`
}

// ---------- Peças com a vendedora ----------

export interface PecaEmMaos extends VariacaoRef {
  chave: string
  produto: Produto
  quantidade: number
}

// Saldo por variação somando as remessas abertas; `devolver` soma de volta as peças de uma venda em correção
export function pecasEmMaos(state: AppState, vendedoraId: string, devolver?: Venda): PecaEmMaos[] {
  const mapa = new Map<string, PecaEmMaos>()
  const somar = (produtoId: string, ref: VariacaoRef, quantidade: number) => {
    const produto = getProduto(state.produtos, produtoId)
    if (!produto || quantidade <= 0) return
    const chave = chaveVariacao(produtoId, ref)
    const atual = mapa.get(chave)
    if (atual) atual.quantidade += quantidade
    else mapa.set(chave, { chave, produto, tamanho: ref.tamanho, cor: ref.cor, quantidade })
  }
  for (const remessa of remessasAbertas(state.remessas)) {
    if (remessa.vendedoraId !== vendedoraId) continue
    for (const item of remessa.itens) somar(item.produtoId, item, pendentes(item))
  }
  if (devolver && !devolver.cancelamento) for (const item of devolver.itens) somar(item.produtoId, item, item.quantidade)
  return [...mapa.values()].toSorted(
    (a, b) => a.produto.nome.localeCompare(b.produto.nome) || compararTamanho(a.tamanho, b.tamanho) || a.cor.localeCompare(b.cor),
  )
}

export interface SaldoVendedora {
  vendedora: Vendedora
  itens: (VariacaoRef & { quantidade: number })[]
  total: number
}

// Quanto de um produto está com cada vendedora (HU 2.5)
export function saldoComVendedoras(state: AppState, produtoId: string): SaldoVendedora[] {
  return state.vendedoras
    .map((vendedora) => {
      const itens = pecasEmMaos(state, vendedora.id)
        .filter((peca) => peca.produto.id === produtoId)
        .map(({ tamanho, cor, quantidade }) => ({ tamanho, cor, quantidade }))
      return { vendedora, itens, total: itens.reduce((soma, item) => soma + item.quantidade, 0) }
    })
    .filter((saldo) => saldo.total > 0)
    .toSorted((a, b) => b.total - a.total)
}

// ---------- Produtos e movimentações ----------

export function temMovimentacao(state: AppState, produtoId: string): boolean {
  return (
    state.movimentacoes.some((m) => m.produtoId === produtoId) ||
    state.remessas.some((r) => r.itens.some((i) => i.produtoId === produtoId)) ||
    state.vendas.some((v) => v.itens.some((i) => i.produtoId === produtoId))
  )
}

export function ordenarMovimentacoes(lista: Movimentacao[]): Movimentacao[] {
  return lista.toSorted((a, b) => `${b.data} ${b.id}`.localeCompare(`${a.data} ${a.id}`))
}

export function historicoProduto(state: AppState, produtoId: string): Movimentacao[] {
  return ordenarMovimentacoes(state.movimentacoes.filter((m) => m.produtoId === produtoId))
}

export function coresDoEstoque(produtos: Produto[]): string[] {
  return [...new Set(produtos.flatMap((produto) => produto.variacoes.map((variacao) => variacao.cor)))].sort((a, b) => a.localeCompare(b))
}

// ---------- Usuários ----------

export function nomeUsuario(usuarios: Usuario[], usuarioId: string | undefined): string {
  return usuarios.find((usuario) => usuario.id === usuarioId)?.nome ?? 'Sistema'
}

export function proximoIdUsuario(usuarios: Usuario[]): string {
  const maior = usuarios.reduce((max, usuario) => Math.max(max, Number(usuario.id.slice(1)) || 0), 0)
  return `u${maior + 1}`
}

// ---------- Crediário ----------

export type SituacaoParcela = 'a-vencer' | 'vencida' | 'paga'

export interface LinhaParcela {
  crediario: Crediario
  parcela: Parcela
  vendedora?: Vendedora
  situacao: SituacaoParcela
  // Dias até o vencimento (negativo = vencida)
  dias: number
}

export function linhasParcelas(state: AppState): LinhaParcela[] {
  return state.crediarios.flatMap((crediario) =>
    crediario.parcelas.map((parcela) => {
      const dias = diffDays(parcela.vencimento, state.hoje)
      return {
        crediario,
        parcela,
        vendedora: state.vendedoras.find((v) => v.id === crediario.vendedoraId),
        situacao: parcela.paga ? 'paga' : dias < 0 ? 'vencida' : 'a-vencer',
        dias,
      } satisfies LinhaParcela
    }),
  )
}

export type TipoLembrete = 'antes' | 'no-dia' | 'depois'

export interface Lembrete {
  linha: LinhaParcela
  tipo: TipoLembrete
}

// Parcelas em aberto que caem nas regras de lembrete ligadas (HU 4.3); paga nunca gera alerta
export function lembretesDoDia(state: AppState): Lembrete[] {
  const { antes, diasAntes, noDia, depois } = state.lembretes
  return linhasParcelas(state)
    .filter((linha) => linha.situacao !== 'paga')
    .flatMap((linha): Lembrete[] => {
      if (linha.dias < 0 && depois) return [{ linha, tipo: 'depois' }]
      if (linha.dias === 0 && noDia) return [{ linha, tipo: 'no-dia' }]
      if (linha.dias > 0 && linha.dias <= diasAntes && antes) return [{ linha, tipo: 'antes' }]
      return []
    })
    .toSorted((a, b) => a.linha.dias - b.linha.dias)
}

// "vence em 3 dias", "vence hoje", "venceu há 2 dias"
export function descreverVencimento(dias: number): string {
  if (dias === 0) return 'vence hoje'
  if (dias > 0) return dias === 1 ? 'vence amanhã' : `vence em ${dias} dias`
  return -dias === 1 ? 'venceu ontem' : `venceu há ${-dias} dias`
}
