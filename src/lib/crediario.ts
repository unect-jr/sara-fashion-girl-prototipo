import type { Parcela } from '../data/types'
import { addDays, type ISODate } from './date'
import { roundCents } from './remessa'

// Parcelas a cada 30 dias; a diferença de centavos fica na última
export function gerarParcelas(valorTotal: number, quantidade: number, primeiroVencimento: ISODate, pagas = 0): Parcela[] {
  const valor = roundCents(valorTotal / quantidade)
  return Array.from({ length: quantidade }, (_, index) => ({
    numero: index + 1,
    valor: index === quantidade - 1 ? roundCents(valorTotal - valor * (quantidade - 1)) : valor,
    vencimento: addDays(primeiroVencimento, index * 30),
    paga: index < pagas,
  }))
}
