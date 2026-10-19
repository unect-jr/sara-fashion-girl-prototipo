import type { ISODate } from '../lib/date'

export type { ISODate }

export type Categoria = 'vestido' | 'blusa' | 'calca' | 'saia'
export type Tamanho = 'PP' | 'P' | 'M' | 'G' | 'GG'

// Identifica uma variação dentro do produto
export interface VariacaoRef {
  tamanho: Tamanho
  cor: string
}

export interface Variacao extends VariacaoRef {
  quantidadeCentral: number
}

export interface Produto {
  id: string
  nome: string
  categoria: Categoria
  preco: number
  // Custo unitário: o Painel mostra o estoque central "em custo"
  custo: number
  variacoes: Variacao[]
}

export interface Vendedora {
  id: string
  nome: string
  telefone: string
  // Bairro/região de atuação (coluna "VENDEDORA / REGIÃO" no Figma)
  regiao: string
  // Fração sobre o vendido (0.25 = 25%)
  comissao: number
  ativa: boolean
}

export interface ItemRemessa extends VariacaoRef {
  produtoId: string
  enviada: number
  devolvida: number
  vendida: number
}

// aberta: nada acertado; parcial: parte acertada; fechada: tudo acertado
export type StatusRemessa = 'aberta' | 'parcial' | 'fechada'

export interface Remessa {
  id: string
  vendedoraId: string
  dataSaida: ISODate
  prazoAcerto: ISODate
  itens: ItemRemessa[]
  status: StatusRemessa
}

export type FormaPagamento = 'pix' | 'dinheiro' | 'cartao' | 'crediario'

export interface Acerto {
  id: string
  remessaId: string
  data: ISODate
  valorBruto: number
  comissao: number
  valorAReceber: number
  formaPagamento: FormaPagamento
}

export interface Parcela {
  numero: number
  valor: number
  vencimento: ISODate
  paga: boolean
}

export interface Crediario {
  id: string
  cliente: string
  vendedoraId: string
  dataVenda: ISODate
  valorTotal: number
  parcelas: Parcela[]
}

export interface AppState {
  // Data de referência da demo; o seed e os status por prazo partem dela
  hoje: ISODate
  produtos: Produto[]
  vendedoras: Vendedora[]
  remessas: Remessa[]
  acertos: Acerto[]
  crediarios: Crediario[]
}
