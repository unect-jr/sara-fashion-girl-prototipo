// Campo em pílula dos modais (Figma 24:299); foco em azul-marinho com 1.5px (24:293)
const FIELD =
  'w-full rounded-full border bg-surface text-ink outline-none transition-colors placeholder:font-normal placeholder:text-muted focus:border-info focus:ring-[0.5px] focus:ring-info aria-invalid:border-brand aria-invalid:ring-brand'

export type FieldSize = 'md' | 'sm'

// md: modais (13px, 10px de respiro); sm: barra de filtros do Estoque (13:43)
const SIZES: Record<FieldSize, string> = {
  md: 'border-line-strong px-3.5 py-2.5 text-sub font-medium',
  sm: 'border-line-strong px-3.5 py-2 text-sub text-ink-soft',
}

export function fieldClasses(size: FieldSize = 'md'): string {
  return `${FIELD} ${SIZES[size]}`
}

// id da mensagem de erro, para o aria-describedby do campo
export function fieldErrorId(htmlFor: string): string {
  return `${htmlFor}-erro`
}

// Esconde as setas do input numérico (a grade usa só o teclado)
export const NUMBER_RESET = '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
