import { createSeed } from '../data/seed'
import type { Acerto, AppState, ItemRemessa, Produto, VariacaoRef } from '../data/types'
import { calcularValoresAcerto, pendentes, sameVariacao, statusRemessa } from '../lib/remessa'
import type { Action, NovaRemessa, NovoAcerto } from './actions'
import { estoqueCentral } from './selectors'

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
function criarRemessa(state: AppState, nova: NovaRemessa): AppState {
  const valida =
    nova.itens.length > 0 &&
    !state.remessas.some((remessa) => remessa.id === nova.id) &&
    nova.itens.every(
      (item) => item.quantidade > 0 && item.quantidade <= estoqueCentral(state.produtos, item.produtoId, item),
    )
  if (!valida) return state

  const itens: ItemRemessa[] = nova.itens.map(({ produtoId, tamanho, cor, quantidade }) => ({
    produtoId,
    tamanho,
    cor,
    enviada: quantidade,
    devolvida: 0,
    vendida: 0,
  }))
  const produtos = nova.itens.reduce(
    (acc, item) => ajustarCentral(acc, item.produtoId, item, -item.quantidade),
    state.produtos,
  )

  return {
    ...state,
    produtos,
    remessas: [...state.remessas, { ...nova, itens, status: 'aberta' }],
  }
}

// Regra: devolvida + vendida ≤ enviada; devolvidas voltam ao central
function registrarAcerto(state: AppState, novo: NovoAcerto): AppState {
  const remessa = state.remessas.find((r) => r.id === novo.remessaId)
  const vendedora = state.vendedoras.find((v) => v.id === remessa?.vendedoraId)
  if (!remessa || !vendedora) return state

  const movimentados = novo.itens.filter((item) => item.devolvida + item.vendida > 0)
  const valida =
    movimentados.length > 0 &&
    novo.itens.every((item) => {
      const atual = remessa.itens.find((r) => r.produtoId === item.produtoId && sameVariacao(r, item))
      return atual !== undefined && item.devolvida >= 0 && item.vendida >= 0 && item.devolvida + item.vendida <= pendentes(atual)
    })
  if (!valida) return state

  const itens = remessa.itens.map((atual) => {
    const movimento = movimentados.find((item) => item.produtoId === atual.produtoId && sameVariacao(atual, item))
    return movimento
      ? { ...atual, devolvida: atual.devolvida + movimento.devolvida, vendida: atual.vendida + movimento.vendida }
      : atual
  })
  const produtos = movimentados.reduce(
    (acc, item) => (item.devolvida > 0 ? ajustarCentral(acc, item.produtoId, item, item.devolvida) : acc),
    state.produtos,
  )
  const acerto: Acerto = {
    id: `AC-${String(state.acertos.length + 1).padStart(3, '0')}`,
    remessaId: remessa.id,
    data: novo.data,
    formaPagamento: novo.formaPagamento,
    ...calcularValoresAcerto(movimentados, state.produtos, vendedora.comissao),
  }

  return {
    ...state,
    produtos,
    remessas: state.remessas.map((r) => (r.id === remessa.id ? { ...r, itens, status: statusRemessa(itens) } : r)),
    acertos: [...state.acertos, acerto],
  }
}

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'entradaMercadoria': {
      if (action.itens.some((item) => item.quantidade <= 0)) return state
      const produtos = action.itens.reduce(
        (acc, item) => ajustarCentral(acc, action.produtoId, item, item.quantidade),
        state.produtos,
      )
      return { ...state, produtos }
    }
    case 'novoProduto':
      if (state.produtos.some((produto) => produto.id === action.produto.id)) return state
      // Produto novo entra no topo da grade do Estoque
      return { ...state, produtos: [action.produto, ...state.produtos] }
    case 'novaVendedora':
      if (state.vendedoras.some((vendedora) => vendedora.id === action.vendedora.id)) return state
      return { ...state, vendedoras: [...state.vendedoras, action.vendedora] }
    case 'criarRemessa':
      return criarRemessa(state, action.remessa)
    case 'registrarAcerto':
      return registrarAcerto(state, action.acerto)
    case 'marcarParcelaPaga':
      return {
        ...state,
        crediarios: state.crediarios.map((crediario) =>
          crediario.id === action.crediarioId
            ? {
                ...crediario,
                parcelas: crediario.parcelas.map((parcela) =>
                  parcela.numero === action.numero ? { ...parcela, paga: true } : parcela,
                ),
              }
            : crediario,
        ),
      }
    case 'resetDemo':
      return createSeed(action.hoje)
  }
}
