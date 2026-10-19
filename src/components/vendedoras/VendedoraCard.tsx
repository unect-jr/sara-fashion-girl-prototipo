import { Link } from 'react-router'
import { formatCurrency, formatMonth, formatNumber, formatPecas } from '../../lib/format'
import type { ResumoVendedora } from '../../store/selectors'
import { VARIANTE_ACERTO } from '../prazoStyles'
import Button from '../ui/Button'
import Medida from './Medida'
import PrazoTraco from './PrazoTraco'
import VendedoraAvatar from './VendedoraAvatar'

interface VendedoraCardProps {
  resumo: ResumoVendedora
  hoje: string
  onFazerAcerto: (remessaId: string) => void
  onNovaRemessa: (vendedoraId: string) => void
}

// Card de vendedora (Figma 16:59); o card todo leva ao detalhe
export default function VendedoraCard({ resumo, hoje, onFazerAcerto, onNovaRemessa }: VendedoraCardProps) {
  const { vendedora, remessa, status, emPoder, valorEmPoder, vendidoMes } = resumo

  return (
    <article className="relative flex w-full flex-col gap-4 rounded-card border border-line bg-surface p-5 transition-shadow hover:shadow-[0_8px_24px_-12px_rgb(18_18_15/0.18)]">
      <div className="flex items-center gap-3.25">
        <VendedoraAvatar nome={vendedora.nome} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.75">
          <h2 className="truncate text-title font-semibold text-ink">
            {/* Link esticado: o card inteiro é clicável sem aninhar botões dentro de <a> */}
            <Link
              to={`/vendedoras/${vendedora.id}`}
              className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-brand"
            >
              {vendedora.nome}
            </Link>
          </h2>
          <p className="truncate text-button-sm leading-3.75 text-muted">{vendedora.regiao}</p>
        </div>
      </div>

      <PrazoTraco resumo={resumo} hoje={hoje} />

      <div className="flex gap-2">
        <Medida
          label="Em poder dela"
          value={formatNumber(emPoder)}
          detail={emPoder > 0 ? formatCurrency(valorEmPoder) : '—'}
          apagada={emPoder === 0}
        />
        <Medida
          label={`Vendido em ${formatMonth(hoje)}`}
          value={formatPecas(vendidoMes.pecas)}
          detail={formatCurrency(vendidoMes.valorBruto)}
        />
      </div>

      <div aria-hidden className="h-px w-full bg-line" />

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.75 whitespace-nowrap">
          <p className="font-label text-label font-semibold text-muted uppercase">Comissão do mês</p>
          <p className="text-title leading-4.75 font-semibold text-ink tabular-nums">{formatCurrency(vendidoMes.comissao)}</p>
        </div>
        {remessa && status ? (
          <Button size="xs" variant={VARIANTE_ACERTO[status]} className="relative z-10" onClick={() => onFazerAcerto(remessa.id)}>
            Fazer acerto
          </Button>
        ) : (
          <Button size="xs" className="relative z-10" onClick={() => onNovaRemessa(vendedora.id)}>
            Nova remessa
          </Button>
        )}
      </div>
    </article>
  )
}
