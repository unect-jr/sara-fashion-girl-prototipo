import { diffDays, type ISODate } from './date'

// Status por prazo (docs/produto.md §5), usado em remessas, acertos e parcelas
export type StatusPrazo = 'atrasado' | 'vence-hoje' | 'em-dia'

export function getStatusPrazo(prazo: ISODate, hoje: ISODate): StatusPrazo {
  const dias = diffDays(prazo, hoje)
  if (dias < 0) return 'atrasado'
  if (dias === 0) return 'vence-hoje'
  return 'em-dia'
}

// "atrasado há 7 dias", "vence hoje", "faltam 5 dias"
export function describePrazo(prazo: ISODate, hoje: ISODate): string {
  const dias = diffDays(prazo, hoje)
  if (dias < 0) return `atrasado há ${-dias} ${-dias === 1 ? 'dia' : 'dias'}`
  if (dias === 0) return 'vence hoje'
  return dias === 1 ? 'falta 1 dia' : `faltam ${dias} dias`
}
