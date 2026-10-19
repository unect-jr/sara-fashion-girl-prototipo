import type { ResumoVendedora } from '../../store/selectors'
import { diffDays } from '../../lib/date'
import { formatDateShort } from '../../lib/format'
import { describePrazo, type StatusPrazo } from '../../lib/status'

interface PrazoTracoProps {
  resumo: ResumoVendedora
  hoje: string
}

// O prazo fica a 78% do traço; o atraso avança além dele (Figma 16:66)
const MARCO_PRAZO = 78

const COR: Record<StatusPrazo, { bg: string; text: string; marco: string }> = {
  atrasado: { bg: 'bg-brand', text: 'font-semibold text-brand', marco: 'bg-brand' },
  'vence-hoje': { bg: 'bg-warning', text: 'font-semibold text-warning', marco: 'bg-warning' },
  'em-dia': { bg: 'bg-info', text: 'text-muted', marco: 'bg-track' },
}

// Traço do prazo de acerto: saída → prazo, com a legenda embaixo
export default function PrazoTraco({ resumo, hoje }: PrazoTracoProps) {
  const { remessa, status, ultimoAcerto } = resumo

  let progresso = 0
  if (remessa) {
    const total = Math.max(diffDays(remessa.prazoAcerto, remessa.dataSaida), 1)
    const decorrido = Math.max(diffDays(hoje, remessa.dataSaida), 0)
    progresso = Math.min((decorrido / total) * MARCO_PRAZO, 96)
  }
  const cor = status ? COR[status] : undefined

  return (
    <div className="flex w-full flex-col gap-2">
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
      <div className="flex items-center justify-between gap-2 text-caption leading-3.5 whitespace-nowrap text-muted">
        {remessa && cor ? (
          <>
            <span>saiu {formatDateShort(remessa.dataSaida)}</span>
            <span className={cor.text}>{describePrazo(remessa.prazoAcerto, hoje)}</span>
          </>
        ) : (
          <>
            <span>{ultimoAcerto ? `último acerto em ${formatDateShort(ultimoAcerto.data)}` : 'nenhum acerto ainda'}</span>
            <span>sem remessa aberta</span>
          </>
        )}
      </div>
    </div>
  )
}
