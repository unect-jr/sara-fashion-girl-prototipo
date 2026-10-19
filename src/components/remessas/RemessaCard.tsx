import { AnimatePresence, motion } from 'motion/react'
import { useId, useState } from 'react'
import { Link } from 'react-router'
import type { ISODate, Produto } from '../../data/types'
import { formatCurrency, formatDateShort, formatPecas } from '../../lib/format'
import { EASE_OUT } from '../../lib/motion'
import { describePrazo, type StatusPrazo } from '../../lib/status'
import type { ResumoRemessa } from '../../store/selectors'
import { COR_PRAZO, VARIANTE_ACERTO } from '../prazoStyles'
import TracoPrazo from '../TracoPrazo'
import Button from '../ui/Button'
import { buttonClasses } from '../ui/buttonStyles'
import Tag, { type TagVariant } from '../ui/Tag'
import VendedoraAvatar from '../vendedoras/VendedoraAvatar'
import RemessaItens from './RemessaItens'

interface RemessaCardProps {
  resumo: ResumoRemessa
  produtos: Produto[]
  hoje: ISODate
  defaultAberto?: boolean
  onFazerAcerto: (remessaId: string) => void
}

// Pílula de situação (Figma 17:78, 17:166, 17:191, 17:263)
const SITUACAO: Record<StatusPrazo, { label: string; variant: TagVariant }> = {
  atrasado: { label: 'Atrasada', variant: 'brand' },
  'vence-hoje': { label: 'Vence hoje', variant: 'warning' },
  'em-dia': { label: 'Em aberto', variant: 'info' },
}

// Romaneio de uma remessa (Figma 17:58): linha-resumo que abre a lista de itens
export default function RemessaCard({ resumo, produtos, hoje, defaultAberto = false, onFazerAcerto }: RemessaCardProps) {
  const { remessa, vendedora, status, pecas, valor, vendidas, devolvidas, ultimoAcerto } = resumo
  const [aberto, setAberto] = useState(defaultAberto)
  const itensId = useId()
  const situacao = status ? SITUACAO[status] : { label: 'Acertada', variant: 'muted' as const }

  return (
    <article className="overflow-hidden rounded-card border border-line bg-surface transition-shadow hover:shadow-[0_8px_24px_-12px_rgb(18_18_15/0.18)]">
      <div className="relative flex flex-wrap items-center gap-4 px-5 py-4.5">
        {/* Botão esticado: a linha toda abre o romaneio; as ações ficam acima dele */}
        <button
          type="button"
          aria-expanded={aberto}
          aria-controls={itensId}
          aria-label={`${aberto ? 'Fechar' : 'Abrir'} itens da ${remessa.id}`}
          onClick={() => setAberto((valor) => !valor)}
          className="absolute inset-0 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
        />

        <div className="pointer-events-none flex w-20 flex-col gap-0.75 pr-3 whitespace-nowrap">
          <p className="text-title font-semibold tracking-normal text-ink">{remessa.id}</p>
          <p className="text-caption leading-3.5 text-muted">saiu {formatDateShort(remessa.dataSaida)}</p>
        </div>

        <div className="pointer-events-none flex w-55 items-center gap-2.75">
          <VendedoraAvatar nome={vendedora?.nome ?? '?'} size="sm" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="truncate text-body font-medium text-ink">{vendedora?.nome ?? 'Vendedora removida'}</p>
            <p className="truncate text-caption leading-3.5 text-muted">{vendedora?.regiao}</p>
          </div>
        </div>

        <div className="pointer-events-none flex w-57.5 flex-col gap-1.75">
          <TracoPrazo remessa={status ? remessa : undefined} status={status} hoje={hoje} />
          <p className={`text-caption leading-3.5 whitespace-nowrap ${status ? COR_PRAZO[status].text : 'text-muted'}`}>
            {status
              ? describePrazo(remessa.prazoAcerto, hoje)
              : `acertada${ultimoAcerto ? ` em ${formatDateShort(ultimoAcerto.data)}` : ''} · vendeu ${vendidas}, devolveu ${devolvidas}`}
          </p>
        </div>

        <p className="pointer-events-none w-19 text-right text-body font-medium text-ink tabular-nums">{formatPecas(pecas)}</p>
        <p className="pointer-events-none w-28 text-right text-row leading-4.5 font-semibold text-ink tabular-nums">{formatCurrency(valor)}</p>
        <div className="pointer-events-none">
          <Tag variant={situacao.variant}>{situacao.label.toUpperCase()}</Tag>
        </div>

        <div className="relative ml-auto flex flex-1 justify-end">
          {status ? (
            <Button size="xs" variant={VARIANTE_ACERTO[status]} className="px-3.75!" onClick={() => onFazerAcerto(remessa.id)}>
              Fazer acerto
            </Button>
          ) : (
            <Link to={`/remessas/${remessa.id}`} className={`${buttonClasses({ size: 'xs' })} px-3.75!`}>
              Ver acerto
            </Link>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div
            id={itensId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
          >
            <RemessaItens remessa={remessa} produtos={produtos} />
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  )
}
