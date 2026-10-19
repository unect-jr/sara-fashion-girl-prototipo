import type { FormaPagamento, ISODate, Produto, VariacaoRef } from '../data/types'

export interface EntradaItem extends VariacaoRef {
  quantidade: number
}

export interface NovaRemessaItem extends VariacaoRef {
  produtoId: string
  quantidade: number
}

export interface NovaRemessa {
  id: string
  vendedoraId: string
  dataSaida: ISODate
  prazoAcerto: ISODate
  itens: NovaRemessaItem[]
}

export interface AcertoItem extends VariacaoRef {
  produtoId: string
  devolvida: number
  vendida: number
}

export interface NovoAcerto {
  remessaId: string
  data: ISODate
  itens: AcertoItem[]
  formaPagamento: FormaPagamento
}

export type Action =
  | { type: 'entradaMercadoria'; produtoId: string; itens: EntradaItem[] }
  | { type: 'novoProduto'; produto: Produto }
  | { type: 'criarRemessa'; remessa: NovaRemessa }
  | { type: 'registrarAcerto'; acerto: NovoAcerto }
  | { type: 'marcarParcelaPaga'; crediarioId: string; numero: number }
  | { type: 'resetDemo'; hoje: ISODate }
