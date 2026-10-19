export type ButtonVariant = 'primary' | 'secondary' | 'warning'
export type ButtonSize = 'md' | 'sm' | 'xs'

interface ButtonStyleOptions {
  variant?: ButtonVariant
  size?: ButtonSize
}

const BASE =
  'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-50'

// Variantes da pílula no Figma (9:32 e 9:119/9:143/9:163); hover derivado dos tokens
const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-brand text-white hover:bg-brand/90',
  secondary: 'border-line-strong bg-surface text-ink-soft hover:border-muted hover:text-ink',
  warning: 'border-warning bg-surface text-warning hover:bg-warning/5',
}

// md: ações do topo (12.5px); sm: ação de linha "Fazer acerto" (12px); xs: topo do Estoque (Figma 13:32)
const SIZES: Record<ButtonSize, string> = {
  md: 'px-4 py-2.25 text-button',
  sm: 'px-4 py-2 text-button-sm',
  xs: 'px-4 py-1.5 text-button leading-4',
}

// Compartilhado com links que precisam parecer pílula (ex.: <Link> do router)
export function buttonClasses({ variant = 'secondary', size = 'md' }: ButtonStyleOptions = {}): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]}`
}
