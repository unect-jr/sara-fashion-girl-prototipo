import type { ISODate } from '../lib/date'
import { acertosSeed } from './acertos'
import { LEMBRETES_PADRAO } from './catalogo'
import { crediariosSeed } from './crediarios'
import { movimentacoesSeed } from './movimentacoes'
import { produtosSeed } from './produtos'
import { remessasSeed } from './remessas'
import type { AppState } from './types'
import { usuariosSeed } from './usuarios'
import { vendasSeed } from './vendas'
import { vendedorasSeed } from './vendedoras'

// Monta o estado inicial da demo com datas relativas a `hoje`
export function createSeed(hoje: ISODate): AppState {
  const produtos = structuredClone(produtosSeed)
  const vendedoras = structuredClone(vendedorasSeed)
  const usuarios = structuredClone(usuariosSeed)
  const remessas = remessasSeed(hoje)
  const acertos = acertosSeed(hoje, produtos, vendedoras, remessas)
  const crediariosAntigos = crediariosSeed(hoje)
  const { vendas, crediarios } = vendasSeed(hoje, produtos, remessas, acertos, usuarios, crediariosAntigos.length + 1)

  return {
    hoje,
    produtos,
    vendedoras,
    remessas,
    acertos,
    crediarios: [...crediariosAntigos, ...crediarios],
    usuarios,
    vendas,
    movimentacoes: movimentacoesSeed(hoje, remessas, acertos, vendas),
    lembretes: { ...LEMBRETES_PADRAO },
  }
}
