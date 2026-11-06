import { FORMAS_A_PRAZO, MOTIVO_AJUSTE_LABEL, TAMANHOS_GRADE } from '../data/catalogo'
import { createSeed } from '../data/seed'
import type { Acerto, AppState, Crediario, ItemRemessa, ItemVenda, Movimentacao, Produto, VariacaoRef, Venda } from '../data/types'
import { gerarParcelas } from '../lib/crediario'
import { baixadas, calcularValoresAcerto, pendentes, roundCents, sameVariacao, statusRemessa } from '../lib/remessa'
import type { Action, Carimbo, NovaRemessa, NovaVenda, NovoAcerto } from './actions'
import { bloqueioDaVenda, proximoIdCrediario, proximoIdVenda, temMovimentacao } from './consultas'
import { estoqueCentral, getProduto } from './selectors'

type NovaMovimentacao = Omit<Movimentacao, 'id'>

// Todo registro de estoque ganha um id sequencial (MV-00001…)
function comMovimentacoes(state: AppState, novas: NovaMovimentacao[]): Movimentacao[] {
  const inicio = state.movimentacoes.length
  return [...state.movimentacoes, ...novas.map((mov, i) => ({ ...mov, id: `MV-${String(inicio + i + 1).padStart(5, '0')}` }))]
}

function carimbar(carimbo: Carimbo, dados: Omit<NovaMovimentacao, 'data' | 'hora' | 'usuarioId'>): NovaMovimentacao {
  return { ...dados, data: carimbo.data, hora: carimbo.hora, usuarioId: carimbo.usuarioId }
}

function precoDe(produtos: Produto[], produtoId: string): number {
  return getProduto(produtos, produtoId)?.preco ?? 0
}

function totalItens(itens: ItemVenda[]): number {
  return roundCents(itens.reduce((total, item) => total + item.quantidade * item.preco, 0))
}

// Soma `delta` na variação do estoque central; cria a variação se ela ainda não existir
function ajustarCentral(produtos: Produto[], produtoId: string, ref: VariacaoRef, delta: number): Produto[] {
  return produtos.map((produto) => {
    if (produto.id !== produtoId) return produto
    const existe = produto.variacoes.some((variacao) => sameVariacao(variacao, ref))
    const variacoes = existe
      ? produto.variacoes.map((variacao) =>
          sameVariacao(variacao, ref) ? { ...variacao, quantidadeCentral: variacao.quantidadeCentral + delta } : variacao,
        )
      : [...produto.variacoes, { tamanho: ref.tamanho, cor: ref.cor, quantidadeCentral: delta }]
    return { ...produto, variacoes }
  })
}

// Regra: não pode sair mais do que existe no central (docs/produto.md §5)
function criarRemessa(state: AppState, nova: NovaRemessa, carimbo: Carimbo): AppState {
  const valida =
    nova.itens.length > 0 &&
    !state.remessas.some((remessa) => remessa.id === nova.id) &&
    nova.itens.every((item) => item.quantidade > 0 && item.quantidade <= estoqueCentral(state.produtos, item.produtoId, item))
  if (!valida) return state

  const itens: ItemRemessa[] = nova.itens.map(({ produtoId, tamanho, cor, quantidade }) => ({
    produtoId,
    tamanho,
    cor,
    enviada: quantidade,
    devolvida: 0,
    vendida: 0,
  }))
  const produtos = nova.itens.reduce((acc, item) => ajustarCentral(acc, item.produtoId, item, -item.quantidade), state.produtos)

  return {
    ...state,
    produtos,
    remessas: [...state.remessas, { ...nova, itens, status: 'aberta' }],
    movimentacoes: comMovimentacoes(
      state,
      nova.itens.map((item) =>
        carimbar(carimbo, { tipo: 'saida', produtoId: item.produtoId, tamanho: item.tamanho, cor: item.cor, quantidade: -item.quantidade, vendedoraId: nova.vendedoraId, referencia: nova.id }),
      ),
    ),
  }
}

// O acerto fecha as vendas já baixadas pela vendedora, soma as vendidas informadas agora e devolve o resto ao central
function registrarAcerto(state: AppState, novo: NovoAcerto, carimbo: Carimbo): AppState {
  const remessa = state.remessas.find((r) => r.id === novo.remessaId)
  const vendedora = state.vendedoras.find((v) => v.id === remessa?.vendedoraId)
  if (!remessa || !vendedora) return state

  const informado = (atual: ItemRemessa) => novo.itens.find((item) => item.produtoId === atual.produtoId && sameVariacao(atual, item))
  const valida = novo.itens.every((item) => {
    const atual = remessa.itens.find((r) => r.produtoId === item.produtoId && sameVariacao(r, item))
    return atual !== undefined && item.devolvida >= 0 && item.vendida >= 0 && item.devolvida + item.vendida <= pendentes(atual)
  })
  const temAlgo = remessa.itens.some((atual) => {
    const item = informado(atual)
    return baixadas(atual) + (item?.devolvida ?? 0) + (item?.vendida ?? 0) > 0
  })
  if (!valida || !temAlgo) return state

  const acertoId = `AC-${String(state.acertos.length + 1).padStart(3, '0')}`
  const itens = remessa.itens.map((atual) => {
    const item = informado(atual)
    return {
      ...atual,
      vendida: atual.vendida + baixadas(atual) + (item?.vendida ?? 0),
      devolvida: atual.devolvida + (item?.devolvida ?? 0),
      baixada: 0,
    }
  })
  const vendidas = remessa.itens.map((atual) => ({ produtoId: atual.produtoId, vendida: baixadas(atual) + (informado(atual)?.vendida ?? 0) }))
  const acerto: Acerto = {
    id: acertoId,
    remessaId: remessa.id,
    data: novo.data,
    formaPagamento: novo.formaPagamento,
    usuarioId: carimbo.usuarioId,
    ...calcularValoresAcerto(vendidas, state.produtos, vendedora.comissao),
  }

  const produtos = novo.itens.reduce(
    (acc, item) => (item.devolvida > 0 ? ajustarCentral(acc, item.produtoId, item, item.devolvida) : acc),
    state.produtos,
  )

  // As vendas já registradas desta remessa passam a fazer parte do acerto
  const vendasAtualizadas = state.vendas.map((venda) =>
    venda.cancelamento || !venda.itens.some((item) => item.remessaId === remessa.id && !item.acertoId)
      ? venda
      : { ...venda, itens: venda.itens.map((item) => (item.remessaId === remessa.id && !item.acertoId ? { ...item, acertoId } : item)) },
  )

  // Vendidas que só apareceram no acerto viram uma venda própria, para o histórico bater
  const extras = novo.itens.filter((item) => item.vendida > 0)
  const vendaId = proximoIdVenda(state.vendas)
  const novas: Venda[] = []
  if (extras.length > 0) {
    const itensVenda: ItemVenda[] = extras.map((item) => ({
      produtoId: item.produtoId,
      tamanho: item.tamanho,
      cor: item.cor,
      quantidade: item.vendida,
      remessaId: remessa.id,
      preco: precoDe(state.produtos, item.produtoId),
      acertoId,
    }))
    novas.push({
      id: vendaId,
      data: novo.data,
      hora: carimbo.hora,
      vendedoraId: vendedora.id,
      lancadoPorId: carimbo.usuarioId,
      itens: itensVenda,
      total: totalItens(itensVenda),
      formaPagamento: 'avista',
      noAcerto: true,
    })
  }

  const movimentos: NovaMovimentacao[] = [
    ...novo.itens
      .filter((item) => item.devolvida > 0)
      .map((item) =>
        carimbar(carimbo, { tipo: 'devolucao', produtoId: item.produtoId, tamanho: item.tamanho, cor: item.cor, quantidade: item.devolvida, vendedoraId: vendedora.id, referencia: remessa.id, detalhe: `Acerto ${acertoId}` }),
      ),
    ...extras.map((item) =>
      carimbar(carimbo, { tipo: 'venda', produtoId: item.produtoId, tamanho: item.tamanho, cor: item.cor, quantidade: -item.vendida, vendedoraId: vendedora.id, referencia: vendaId, detalhe: `Informada no acerto ${acertoId}` }),
    ),
  ]

  return {
    ...state,
    produtos,
    remessas: state.remessas.map((r) => (r.id === remessa.id ? { ...r, itens, status: statusRemessa(itens) } : r)),
    acertos: [...state.acertos, acerto],
    vendas: [...vendasAtualizadas, ...novas],
    movimentacoes: comMovimentacoes(state, movimentos),
  }
}

// Venda e baixa (HU 3.2): sai do saldo da vendedora, da remessa mais antiga para a mais nova
function registrarVenda(state: AppState, nova: NovaVenda, carimbo: Carimbo, corrigeVendaId?: string): AppState {
  const vendedora = state.vendedoras.find((v) => v.id === nova.vendedoraId)
  const aPrazo = FORMAS_A_PRAZO.includes(nova.formaPagamento)
  const cliente = nova.cliente?.trim() ?? ''
  const invalida =
    !vendedora ||
    nova.itens.length === 0 ||
    nova.itens.some((item) => item.quantidade <= 0) ||
    state.vendas.some((venda) => venda.id === nova.id) ||
    (aPrazo && (!cliente || nova.primeiroVencimento <= carimbo.data)) ||
    nova.parcelas < 1
  if (!vendedora || invalida) return state

  const abertas = state.remessas
    .filter((r) => r.vendedoraId === vendedora.id && r.status !== 'fechada')
    .toSorted((a, b) => a.dataSaida.localeCompare(b.dataSaida))
    .map((r) => ({ ...r, itens: r.itens.map((item) => ({ ...item })) }))

  const itens: ItemVenda[] = []
  for (const pedido of nova.itens) {
    let falta = pedido.quantidade
    for (const remessa of abertas) {
      for (const item of remessa.itens) {
        if (falta === 0) break
        if (item.produtoId !== pedido.produtoId || !sameVariacao(item, pedido)) continue
        const usar = Math.min(falta, pendentes(item))
        if (usar <= 0) continue
        item.baixada = baixadas(item) + usar
        falta -= usar
        itens.push({ produtoId: pedido.produtoId, tamanho: pedido.tamanho, cor: pedido.cor, quantidade: usar, remessaId: remessa.id, preco: precoDe(state.produtos, pedido.produtoId) })
      }
    }
    // Regra: não baixa mais do que a vendedora tem em mãos
    if (falta > 0) return state
  }

  const alteradas = new Map(abertas.map((r) => [r.id, { ...r, status: statusRemessa(r.itens) }]))
  const total = totalItens(itens)
  const crediario: Crediario | undefined = aPrazo
    ? {
        id: proximoIdCrediario(state.crediarios),
        cliente,
        vendedoraId: vendedora.id,
        dataVenda: carimbo.data,
        valorTotal: total,
        parcelas: gerarParcelas(total, nova.formaPagamento === 'parcelado' ? nova.parcelas : 1, nova.primeiroVencimento),
        vendaId: nova.id,
        forma: nova.formaPagamento,
      }
    : undefined
  const venda: Venda = {
    id: nova.id,
    data: carimbo.data,
    hora: carimbo.hora,
    vendedoraId: vendedora.id,
    lancadoPorId: carimbo.usuarioId,
    cliente: cliente || undefined,
    itens,
    total,
    formaPagamento: nova.formaPagamento,
    crediarioId: crediario?.id,
    corrigeVendaId,
  }

  return {
    ...state,
    remessas: state.remessas.map((r) => alteradas.get(r.id) ?? r),
    vendas: [...state.vendas, venda],
    crediarios: crediario ? [...state.crediarios, crediario] : state.crediarios,
    movimentacoes: comMovimentacoes(
      state,
      itens.map((item) =>
        carimbar(carimbo, { tipo: 'venda', produtoId: item.produtoId, tamanho: item.tamanho, cor: item.cor, quantidade: -item.quantidade, vendedoraId: vendedora.id, referencia: venda.id }),
      ),
    ),
  }
}

// Cancelamento com motivo (HU 3.4): as peças voltam ao saldo da vendedora e a cobrança é desfeita
function cancelarVenda(state: AppState, vendaId: string, motivo: string, carimbo: Carimbo): AppState {
  const venda = state.vendas.find((v) => v.id === vendaId)
  const texto = motivo.trim()
  if (!venda || !texto || bloqueioDaVenda(state, venda)) return state

  const remessas = state.remessas.map((remessa) => {
    const daRemessa = venda.itens.filter((item) => item.remessaId === remessa.id)
    if (daRemessa.length === 0) return remessa
    const itens = remessa.itens.map((item) => {
      const devolver = daRemessa.filter((i) => i.produtoId === item.produtoId && sameVariacao(i, item)).reduce((t, i) => t + i.quantidade, 0)
      return devolver > 0 ? { ...item, baixada: Math.max(baixadas(item) - devolver, 0) } : item
    })
    return { ...remessa, itens, status: statusRemessa(itens) }
  })

  return {
    ...state,
    remessas,
    vendas: state.vendas.map((v) =>
      v.id === vendaId ? { ...v, cancelamento: { data: carimbo.data, hora: carimbo.hora, usuarioId: carimbo.usuarioId, motivo: texto } } : v,
    ),
    crediarios: state.crediarios.filter((c) => c.id !== venda.crediarioId),
    movimentacoes: comMovimentacoes(
      state,
      venda.itens.map((item) =>
        carimbar(carimbo, { tipo: 'cancelamento', produtoId: item.produtoId, tamanho: item.tamanho, cor: item.cor, quantidade: item.quantidade, vendedoraId: venda.vendedoraId, referencia: venda.id, motivo: texto }),
      ),
    ),
  }
}

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'entradaMercadoria': {
      if (action.itens.length === 0 || action.itens.some((item) => item.quantidade <= 0) || !action.notaFiscal.trim()) return state
      const produtos = action.itens.reduce((acc, item) => ajustarCentral(acc, action.produtoId, item, item.quantidade), state.produtos)
      return {
        ...state,
        produtos,
        movimentacoes: comMovimentacoes(
          state,
          action.itens.map((item) => ({
            ...carimbar(action.carimbo, { tipo: 'entrada', produtoId: action.produtoId, tamanho: item.tamanho, cor: item.cor, quantidade: item.quantidade, referencia: `NF ${action.notaFiscal.trim()}`, detalhe: action.fornecedor }),
            data: action.data,
          })),
        ),
      }
    }
    case 'novoProduto': {
      if (state.produtos.some((produto) => produto.id === action.produto.id)) return state
      const iniciais = action.produto.variacoes.filter((variacao) => variacao.quantidadeCentral > 0)
      // Produto novo entra no topo da grade do Estoque; a grade inicial fica no histórico
      return {
        ...state,
        produtos: [action.produto, ...state.produtos],
        movimentacoes: comMovimentacoes(
          state,
          iniciais.map((variacao) =>
            carimbar(action.carimbo, { tipo: 'entrada', produtoId: action.produto.id, tamanho: variacao.tamanho, cor: variacao.cor, quantidade: variacao.quantidadeCentral, referencia: 'Cadastro', detalhe: 'Grade inicial do produto' }),
          ),
        ),
      }
    }
    case 'editarProduto': {
      const { dados } = action
      if (!dados.nome.trim() || dados.custo <= 0 || dados.preco <= dados.custo) return state
      return {
        ...state,
        produtos: state.produtos.map((produto) => {
          if (produto.id !== action.produtoId) return produto
          const existentes = new Set(produto.variacoes.map((variacao) => variacao.cor))
          const novas = dados.coresNovas
            .filter((cor) => !existentes.has(cor))
            .flatMap((cor) => TAMANHOS_GRADE.map((tamanho) => ({ tamanho, cor, quantidadeCentral: 0 })))
          return { ...produto, nome: dados.nome.trim(), categoria: dados.categoria, preco: dados.preco, custo: dados.custo, imagem: dados.imagem, variacoes: [...produto.variacoes, ...novas] }
        }),
      }
    }
    case 'inativarProduto':
      return { ...state, produtos: state.produtos.map((p) => (p.id === action.produtoId ? { ...p, inativo: action.inativo } : p)) }
    case 'excluirProduto': {
      // Regra: produto com movimentação ou peças no central só pode ser inativado
      const produto = getProduto(state.produtos, action.produtoId)
      const comPecas = produto?.variacoes.some((variacao) => variacao.quantidadeCentral > 0)
      if (!produto || comPecas || temMovimentacao(state, produto.id)) return state
      return { ...state, produtos: state.produtos.filter((p) => p.id !== produto.id) }
    }
    case 'ajustarEstoque': {
      const { ajuste, carimbo } = action
      const delta = ajuste.novaQuantidade - estoqueCentral(state.produtos, ajuste.produtoId, ajuste)
      if (ajuste.novaQuantidade < 0 || delta === 0 || !MOTIVO_AJUSTE_LABEL[ajuste.motivo]) return state
      return {
        ...state,
        produtos: ajustarCentral(state.produtos, ajuste.produtoId, ajuste, delta),
        movimentacoes: comMovimentacoes(state, [
          carimbar(carimbo, { tipo: 'ajuste', produtoId: ajuste.produtoId, tamanho: ajuste.tamanho, cor: ajuste.cor, quantidade: delta, motivo: MOTIVO_AJUSTE_LABEL[ajuste.motivo], detalhe: ajuste.observacao.trim() || undefined }),
        ]),
      }
    }
    case 'novaVendedora':
      if (state.vendedoras.some((vendedora) => vendedora.id === action.vendedora.id)) return state
      return { ...state, vendedoras: [...state.vendedoras, action.vendedora] }
    case 'criarRemessa':
      return criarRemessa(state, action.remessa, action.carimbo)
    case 'registrarAcerto':
      return registrarAcerto(state, action.acerto, action.carimbo)
    case 'registrarVenda':
      return registrarVenda(state, action.venda, action.carimbo)
    case 'cancelarVenda':
      return cancelarVenda(state, action.vendaId, action.motivo, action.carimbo)
    case 'corrigirVenda': {
      // Corrigir = cancelar a original com motivo e registrar a certa, tudo ou nada
      const cancelado = cancelarVenda(state, action.vendaId, action.motivo, action.carimbo)
      if (cancelado === state) return state
      const corrigido = registrarVenda(cancelado, action.venda, action.carimbo, action.vendaId)
      return corrigido === cancelado ? state : corrigido
    }
    case 'marcarParcelaPaga':
      return {
        ...state,
        crediarios: state.crediarios.map((crediario) =>
          crediario.id === action.crediarioId
            ? {
                ...crediario,
                parcelas: crediario.parcelas.map((parcela) =>
                  parcela.numero === action.numero ? { ...parcela, paga: true, pagaEm: action.data } : parcela,
                ),
              }
            : crediario,
        ),
      }
    case 'salvarLembretes':
      if (action.lembretes.diasAntes < 1 || action.lembretes.diasAntes > 30) return state
      return { ...state, lembretes: action.lembretes }
    case 'salvarUsuario': {
      const usuario = action.usuario
      const email = usuario.email.trim().toLowerCase()
      const emailEmUso = state.usuarios.some((u) => u.id !== usuario.id && u.email.toLowerCase() === email)
      const semVendedora = usuario.perfil === 'vendedor' && !state.vendedoras.some((v) => v.id === usuario.vendedoraId)
      if (!usuario.nome.trim() || !email.includes('@') || emailEmUso || semVendedora || usuario.senha.length < 6) return state
      const limpo = { ...usuario, nome: usuario.nome.trim(), email, vendedoraId: usuario.perfil === 'vendedor' ? usuario.vendedoraId : undefined }
      const existe = state.usuarios.some((u) => u.id === usuario.id)
      return {
        ...state,
        usuarios: existe ? state.usuarios.map((u) => (u.id === usuario.id ? limpo : u)) : [...state.usuarios, limpo],
      }
    }
    case 'alterarAcessoUsuario':
      return { ...state, usuarios: state.usuarios.map((u) => (u.id === action.usuarioId ? { ...u, ativo: action.ativo } : u)) }
    case 'resetDemo':
      return createSeed(action.hoje)
  }
}
