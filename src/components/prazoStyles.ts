import type { StatusPrazo } from '../lib/status'
import type { ButtonVariant } from './ui/buttonStyles'

// Cores do traço de prazo e da legenda (Figma 16:66, 17:69)
export const COR_PRAZO: Record<StatusPrazo, { bg: string; text: string; marco: string }> = {
  atrasado: { bg: 'bg-brand', text: 'font-semibold text-brand', marco: 'bg-brand' },
  'vence-hoje': { bg: 'bg-warning', text: 'font-semibold text-warning', marco: 'bg-warning' },
  'em-dia': { bg: 'bg-info', text: 'text-muted', marco: 'bg-track' },
}

// "Fazer acerto" segue a urgência do prazo (Figma 16:88, 17:81, 17:169, 17:194)
export const VARIANTE_ACERTO: Record<StatusPrazo, ButtonVariant> = {
  atrasado: 'primary',
  'vence-hoje': 'warning',
  'em-dia': 'secondary',
}
