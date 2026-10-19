import { addDays, type ISODate } from '../lib/date'
import { roundCents } from '../lib/remessa'
import type { Crediario, Parcela } from './types'

// Parcelas mensais (30 dias); a diferença de centavos fica na última
function parcelas(valorTotal: number, quantidade: number, primeiroVencimento: ISODate, pagas: number): Parcela[] {
  const valor = roundCents(valorTotal / quantidade)
  return Array.from({ length: quantidade }, (_, index) => ({
    numero: index + 1,
    valor: index === quantidade - 1 ? roundCents(valorTotal - valor * (quantidade - 1)) : valor,
    vencimento: addDays(primeiroVencimento, index * 30),
    paga: index < pagas,
  }))
}

function crediario(id: string, cliente: string, vendedoraId: string, dataVenda: ISODate, valorTotal: number, quantidade: number, pagas: number): Crediario {
  return {
    id,
    cliente,
    vendedoraId,
    dataVenda,
    valorTotal,
    parcelas: parcelas(valorTotal, quantidade, addDays(dataVenda, 30), pagas),
  }
}

// Cobrem parcela vencida há mais de 15 dias, parcela que vence hoje e parcelas futuras
export function crediariosSeed(hoje: ISODate): Crediario[] {
  const dia = (offset: number) => addDays(hoje, offset)

  return [
    // 1ª parcela venceu há 20 dias e não foi paga
    crediario('CR-01', 'Patrícia Gomes', 'v1', dia(-50), 359.7, 3, 0),
    // 1ª paga; 2ª venceu há 16 dias
    crediario('CR-02', 'Luciana Ribeiro', 'v2', dia(-76), 479.6, 4, 1),
    // 1ª paga; 2ª vence hoje
    crediario('CR-03', 'Vanessa Teixeira', 'v3', dia(-60), 299.7, 3, 1),
  ]
}
