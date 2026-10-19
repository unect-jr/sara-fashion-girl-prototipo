import type { ResumoVendedora } from '../../store/selectors'
import { formatDateShort } from '../../lib/format'
import { describePrazo } from '../../lib/status'
import { COR_PRAZO } from '../prazoStyles'
import TracoPrazo from '../TracoPrazo'

interface PrazoTracoProps {
  resumo: ResumoVendedora
  hoje: string
}

// Traço do prazo de acerto do card de vendedora, com a legenda embaixo (Figma 16:66)
export default function PrazoTraco({ resumo, hoje }: PrazoTracoProps) {
  const { remessa, status, ultimoAcerto } = resumo
  const cor = status ? COR_PRAZO[status] : undefined

  return (
    <div className="flex w-full flex-col gap-2">
      <TracoPrazo remessa={remessa} status={status} hoje={hoje} />
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
