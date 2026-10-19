import type { Remessa } from '../data/types'
import { diffDays, type ISODate } from '../lib/date'
import type { StatusPrazo } from '../lib/status'
import { COR_PRAZO } from './prazoStyles'

interface TracoPrazoProps {
  // Sem remessa aberta: só o trilho cinza
  remessa?: Remessa
  status?: StatusPrazo
  hoje: ISODate
}

// O prazo fica a 78% do traço; o atraso avança além dele (Figma 16:66, 17:69)
const MARCO_PRAZO = 78

// Traço do prazo de acerto: saída → prazo
export default function TracoPrazo({ remessa, status, hoje }: TracoPrazoProps) {
  let progresso = 0
  if (remessa) {
    const total = Math.max(diffDays(remessa.prazoAcerto, remessa.dataSaida), 1)
    const decorrido = Math.max(diffDays(hoje, remessa.dataSaida), 0)
    progresso = Math.min((decorrido / total) * MARCO_PRAZO, 96)
  }
  const cor = remessa && status ? COR_PRAZO[status] : undefined

  return (
    <div aria-hidden className="relative h-3.5 w-full">
      <div className="absolute top-1.5 left-0 h-0.5 rounded-full bg-line" style={{ width: `${MARCO_PRAZO}%` }} />
      {cor && (
        <>
          <div
            className={`absolute top-[5.75px] left-0 h-[2.5px] rounded-full transition-[width] duration-500 ${cor.bg}`}
            style={{ width: `${progresso}%` }}
          />
          <div className={`absolute top-0.5 left-0 h-2.5 w-[1.5px] rounded-full ${cor.bg}`} />
          <div className={`absolute top-0.5 h-2.5 w-[1.5px] rounded-full ${cor.marco}`} style={{ left: `calc(${MARCO_PRAZO}% - 1.5px)` }} />
        </>
      )}
    </div>
  )
}
