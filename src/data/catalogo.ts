import type { Categoria, ConfigLembretes, FormaPagamento, FormaPagamentoVenda, MotivoAjuste, Perfil, Tamanho, TipoMovimentacao } from './types'

// Rótulos no plural, como nas pílulas do card de produto (Figma 13:61)
export const CATEGORIA_LABEL: Record<Categoria, string> = {
  vestido: 'Vestidos',
  blusa: 'Blusas',
  calca: 'Calças',
  saia: 'Saias',
  conjunto: 'Conjuntos',
}

export const CATEGORIAS = Object.keys(CATEGORIA_LABEL) as Categoria[]

// Prefixo do SKU gerado ao salvar um produto novo
export const SKU_PREFIXO: Record<Categoria, string> = {
  vestido: 'VST',
  blusa: 'BLS',
  calca: 'CLC',
  saia: 'SAI',
  conjunto: 'CJT',
}

// Tamanhos exibidos na grade do card e dos modais
export const TAMANHOS_GRADE: Tamanho[] = ['P', 'M', 'G', 'GG']
export const ORDEM_TAMANHOS: Tamanho[] = ['PP', 'P', 'M', 'G', 'GG']

// Amostras de cor (Figma 24:333–24:339 e cores do seed); cor sem amostra cai no neutro
export const CORES_AMOSTRA: Record<string, string> = {
  Preto: '#1a1a18',
  Vinho: '#6e1430',
  'Off-white': '#efebe2',
  Branco: '#ffffff',
  Bege: '#d9c7a7',
  Areia: '#d8c8aa',
  Caramelo: '#a8692f',
  Nude: '#e3c3a8',
  Rosa: '#e8b4c0',
  Champanhe: '#e6d3b1',
  'Verde-oliva': '#6b6b3a',
  'Azul-claro': '#a9c4e0',
  Cáqui: '#a39572',
  Mescla: '#a9a9a4',
  'Jeans claro': '#7f9fc4',
  'Jeans escuro': '#2f4a6e',
}

// Fornecedores mock do modal Entrada de mercadoria
export const FORNECEDORES = ['Malharia Vila Rica', 'Confecções Aurora', 'Tecelagem Bom Retiro', 'Ateliê Dona Flor']

// Repasse da vendedora no acerto
export const FORMA_ACERTO_LABEL: Record<FormaPagamento, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  crediario: 'Crediário',
}

// Pagamento da cliente na venda (HU 4.1)
export const FORMA_VENDA_LABEL: Record<FormaPagamentoVenda, string> = {
  avista: 'À vista',
  pix: 'PIX',
  boleto: 'Boleto',
  parcelado: 'Parcelado',
  'pix-confianca': 'PIX de confiança',
}

export const FORMAS_VENDA = Object.keys(FORMA_VENDA_LABEL) as FormaPagamentoVenda[]

// Formas que geram contas a receber e exigem o nome da cliente
export const FORMAS_A_PRAZO: FormaPagamentoVenda[] = ['boleto', 'parcelado', 'pix-confianca']

export const MOTIVO_AJUSTE_LABEL: Record<MotivoAjuste, string> = {
  erro: 'Erro de contagem',
  perda: 'Perda',
  avaria: 'Avaria',
}

export const TIPO_MOVIMENTACAO_LABEL: Record<TipoMovimentacao, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  devolucao: 'Devolução',
  venda: 'Venda',
  ajuste: 'Ajuste',
  cancelamento: 'Cancelamento',
}

export const PERFIL_LABEL: Record<Perfil, string> = {
  admin: 'Administrador',
  vendedor: 'Vendedor',
}

export const LEMBRETES_PADRAO: ConfigLembretes = { antes: true, diasAntes: 3, noDia: true, depois: true }
