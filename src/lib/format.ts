import { parseISODate, type ISODate } from './date'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const integer = new Intl.NumberFormat('pt-BR')
const longDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
const shortDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })

// R$ 1.234,56
export function formatCurrency(value: number): string {
  return currency.format(value)
}

// 1.436
export function formatNumber(value: number): string {
  return integer.format(value)
}

// 1 peça / 1.436 peças
export function formatPecas(quantidade: number): string {
  return `${formatNumber(quantidade)} ${quantidade === 1 ? 'peça' : 'peças'}`
}

// quinta-feira, 18 de setembro
export function formatDateLong(iso: ISODate): string {
  return longDate.format(parseISODate(iso))
}

const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' })

// setembro
export function formatMonth(iso: ISODate): string {
  return monthName.format(parseISODate(iso))
}

const monthYear = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })

// "2026-09" → Setembro de 2026
export function formatMonthYear(mes: string): string {
  const texto = monthYear.format(parseISODate(`${mes}-01`))
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// 12/08
export function formatDateShort(iso: ISODate): string {
  return shortDate.format(parseISODate(iso))
}
