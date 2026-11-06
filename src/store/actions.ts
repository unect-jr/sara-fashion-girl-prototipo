import type {
  Categoria,
  ConfigLembretes,
  FormaPagamento,
  FormaPagamentoVenda,
  ISODate,
  MotivoAjuste,
  Produto,
  Usuario,
  VariacaoRef,
  Vendedora,
} from '../data/types'

// Quem fez e quando: toda movimentação guarda usuário, data e hora
export interface Carimbo {
  usuarioId: string
  data: ISODate
  hora: string
}

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
  // Vendidas que a vendedora ainda não tinha registrado
  vendida: number
}

export interface NovoAcerto {
  remessaId: string
  data: ISODate
  itens: AcertoItem[]
  formaPagamento: FormaPagamento
}

export interface NovaVendaItem extends VariacaoRef {
  produtoId: string
  quantidade: number
}

export interface NovaVenda {
  id: string
  vendedoraId: string
  cliente?: string
  itens: NovaVendaItem[]
  formaPagamento: FormaPagamentoVenda
  // Parcelado: 2 a 6; boleto e PIX de confiança: 1
  parcelas: number
  primeiroVencimento: ISODate
}

export interface DadosProduto {
  nome: string
  categoria: Categoria
  preco: number
  custo: number
  imagem?: string
  coresNovas: string[]
}

export interface AjusteEstoque extends VariacaoRef {
  produtoId: string
  novaQuantidade: number
  motivo: MotivoAjuste
  observacao: string
}

export type Action =
  | { type: 'entradaMercadoria'; produtoId: string; itens: EntradaItem[]; notaFiscal: string; fornecedor: string; data: ISODate; carimbo: Carimbo }
  | { type: 'novoProduto'; produto: Produto; carimbo: Carimbo }
  | { type: 'editarProduto'; produtoId: string; dados: DadosProduto }
  | { type: 'inativarProduto'; produtoId: string; inativo: boolean }
  | { type: 'excluirProduto'; produtoId: string }
  | { type: 'ajustarEstoque'; ajuste: AjusteEstoque; carimbo: Carimbo }
  | { type: 'novaVendedora'; vendedora: Vendedora }
  | { type: 'criarRemessa'; remessa: NovaRemessa; carimbo: Carimbo }
  | { type: 'registrarAcerto'; acerto: NovoAcerto; carimbo: Carimbo }
  | { type: 'registrarVenda'; venda: NovaVenda; carimbo: Carimbo }
  | { type: 'cancelarVenda'; vendaId: string; motivo: string; carimbo: Carimbo }
  | { type: 'corrigirVenda'; vendaId: string; motivo: string; venda: NovaVenda; carimbo: Carimbo }
  | { type: 'marcarParcelaPaga'; crediarioId: string; numero: number; data: ISODate }
  | { type: 'salvarLembretes'; lembretes: ConfigLembretes }
  | { type: 'salvarUsuario'; usuario: Usuario }
  | { type: 'alterarAcessoUsuario'; usuarioId: string; ativo: boolean }
  | { type: 'resetDemo'; hoje: ISODate }
