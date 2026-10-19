import type { ISODate } from '../lib/date'
import { acertosSeed } from './acertos'
import { crediariosSeed } from './crediarios'
import { produtosSeed } from './produtos'
import { remessasSeed } from './remessas'
import type { AppState } from './types'
import { vendedorasSeed } from './vendedoras'

// Monta o estado inicial da demo com datas relativas a `hoje`
export function createSeed(hoje: ISODate): AppState {
  const produtos = structuredClone(produtosSeed)
  const vendedoras = structuredClone(vendedorasSeed)
  const remessas = remessasSeed(hoje)

  return {
    hoje,
    produtos,
    vendedoras,
    remessas,
    acertos: acertosSeed(hoje, produtos, vendedoras, remessas),
    crediarios: crediariosSeed(hoje),
  }
}
