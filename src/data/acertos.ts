import { addDays, type ISODate } from '../lib/date'
import { calcularValoresAcerto } from '../lib/remessa'
import type { Acerto, FormaPagamento, Produto, Remessa, Vendedora } from './types'

interface AcertoSeed {
  id: string
  remessaId: string
  diasAtras: number
  formaPagamento: FormaPagamento
}

const ACERTOS: AcertoSeed[] = [
  { id: 'AC-001', remessaId: 'RM-0128', diasAtras: 68, formaPagamento: 'pix' },
  { id: 'AC-002', remessaId: 'RM-0136', diasAtras: 41, formaPagamento: 'dinheiro' },
  { id: 'AC-003', remessaId: 'RM-0139', diasAtras: 33, formaPagamento: 'pix' },
  // Acerto parcial da RM-0149, que segue aberta
  { id: 'AC-004', remessaId: 'RM-0149', diasAtras: 8, formaPagamento: 'pix' },
  { id: 'AC-005', remessaId: 'RM-0145', diasAtras: 5, formaPagamento: 'pix' },
]

// Valores calculados a partir das vendidas de cada remessa, para bater com o resto do seed
export function acertosSeed(hoje: ISODate, produtos: Produto[], vendedoras: Vendedora[], remessas: Remessa[]): Acerto[] {
  return ACERTOS.flatMap(({ id, remessaId, diasAtras, formaPagamento }) => {
    const remessa = remessas.find((r) => r.id === remessaId)
    const vendedora = vendedoras.find((v) => v.id === remessa?.vendedoraId)
    if (!remessa || !vendedora) return []

    return {
      id,
      remessaId,
      data: addDays(hoje, -diasAtras),
      formaPagamento,
      ...calcularValoresAcerto(remessa.itens, produtos, vendedora.comissao),
    }
  })
}
