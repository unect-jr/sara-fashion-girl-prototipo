import type { ISODate } from '../lib/date'

export type { ISODate }

export type Categoria = 'vestido' | 'blusa' | 'calca' | 'saia' | 'conjunto'
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
  // Código exibido no card (ex.: VST-0312)
  sku: string
  nome: string
  categoria: Categoria
  // Caminho em public/ ou data URL da foto enviada; sem imagem usa placeholder
  imagem?: string
  preco: number
  // Custo unitário: o Painel mostra o estoque central "em custo"
  custo: number
  variacoes: Variacao[]
  // Produto com movimentação não pode ser excluído, só inativado (HU 2.1)
  inativo?: boolean
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
  // Vendidas e já acertadas
  vendida: number
  // Vendidas pela vendedora na hora (venda e baixa) e ainda não acertadas
  baixada?: number
}

// aberta: nada acertado; parcial: parte acertada ou vendida; fechada: tudo acertado
export type StatusRemessa = 'aberta' | 'parcial' | 'fechada'

export interface Remessa {
  id: string
  vendedoraId: string
  dataSaida: ISODate
  prazoAcerto: ISODate
  itens: ItemRemessa[]
  status: StatusRemessa
}

// Como a vendedora repassa o valor no acerto
export type FormaPagamento = 'pix' | 'dinheiro' | 'cartao' | 'crediario'

export interface Acerto {
  id: string
  remessaId: string
  data: ISODate
  valorBruto: number
  comissao: number
  valorAReceber: number
  formaPagamento: FormaPagamento
  usuarioId?: string
}

export interface Parcela {
  numero: number
  valor: number
  vencimento: ISODate
  paga: boolean
  pagaEm?: ISODate
}

export interface Crediario {
  id: string
  cliente: string
  vendedoraId: string
  dataVenda: ISODate
  valorTotal: number
  parcelas: Parcela[]
  vendaId?: string
  forma?: FormaPagamentoVenda
}

export type Perfil = 'admin' | 'vendedor'

// Protótipo sem backend: a senha fica em memória só para simular o login
export interface Usuario {
  id: string
  nome: string
  email: string
  senha: string
  perfil: Perfil
  // Perfil vendedor: qual vendedora este acesso representa
  vendedoraId?: string
  ativo: boolean
}

// Como a cliente paga a vendedora (HU 4.1)
export type FormaPagamentoVenda = 'avista' | 'pix' | 'boleto' | 'parcelado' | 'pix-confianca'

export interface ItemVenda extends VariacaoRef {
  produtoId: string
  // Remessa de onde a peça saiu (a baixa sai da mais antiga)
  remessaId: string
  quantidade: number
  preco: number
  // Preenchido quando o item entra em um acerto
  acertoId?: string
}

export interface Registro {
  data: ISODate
  hora: string
  usuarioId: string
  motivo: string
}

export interface Venda {
  id: string
  data: ISODate
  hora: string
  vendedoraId: string
  // Quem lançou: a própria vendedora ou alguém da loja no lugar dela
  lancadoPorId: string
  cliente?: string
  itens: ItemVenda[]
  total: number
  formaPagamento: FormaPagamentoVenda
  crediarioId?: string
  cancelamento?: Registro
  // Venda que esta corrige (a original fica cancelada)
  corrigeVendaId?: string
  // Vendida que só foi informada na hora do acerto
  noAcerto?: boolean
}

export type TipoMovimentacao = 'entrada' | 'saida' | 'devolucao' | 'venda' | 'ajuste' | 'cancelamento'
export type MotivoAjuste = 'erro' | 'perda' | 'avaria'

export interface Movimentacao extends VariacaoRef {
  id: string
  tipo: TipoMovimentacao
  data: ISODate
  hora: string
  usuarioId: string
  produtoId: string
  // Positivo entra, negativo sai, do ponto de vista de quem guarda a peça (central ou vendedora)
  quantidade: number
  vendedoraId?: string
  // Documento de origem: NF, remessa ou venda
  referencia?: string
  detalhe?: string
  motivo?: string
}

// Lembretes de cobrança do crediário (HU 4.3)
export interface ConfigLembretes {
  antes: boolean
  diasAntes: number
  noDia: boolean
  depois: boolean
}

export interface AppState {
  // Data de referência da demo; o seed e os status por prazo partem dela
  hoje: ISODate
  produtos: Produto[]
  vendedoras: Vendedora[]
  remessas: Remessa[]
  acertos: Acerto[]
  crediarios: Crediario[]
  usuarios: Usuario[]
  vendas: Venda[]
  movimentacoes: Movimentacao[]
  lembretes: ConfigLembretes
}
