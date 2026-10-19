import { TAMANHOS_GRADE } from '../data/catalogo'
import type { Tamanho } from '../data/types'

// Quantidades por tamanho digitadas nos modais do Estoque
export type Grade = Record<Tamanho, number>

export function gradeVazia(): Grade {
  return { PP: 0, P: 0, M: 0, G: 0, GG: 0 }
}

export function totalGrade(grade: Grade): number {
  return TAMANHOS_GRADE.reduce((total, tamanho) => total + grade[tamanho], 0)
}

// P 4 · M 6 · GG 2 (só os tamanhos com peças)
export function descreverGrade(grade: Grade): string {
  return TAMANHOS_GRADE.filter((tamanho) => grade[tamanho] > 0)
    .map((tamanho) => `${tamanho} ${grade[tamanho]}`)
    .join(' · ')
}

// "R$ 1.139,30", "62,5" ou "62.50" → número; vazio/inválido → 0
export function parseMoeda(texto: string): number {
  const limpo = texto.replace(/[R$\s]/g, '')
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  const valor = Number(normalizado)
  return Number.isFinite(valor) && valor > 0 ? valor : 0
}
