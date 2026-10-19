import { motion } from 'motion/react'
import pontoCentral from '../../assets/icons/ponto-central.svg'
import pontoRua from '../../assets/icons/ponto-rua.svg'
import pontoVazio from '../../assets/icons/ponto-vazio.svg'
import { CATEGORIA_LABEL, TAMANHOS_GRADE } from '../../data/catalogo'
import { formatCurrency, formatNumber } from '../../lib/format'
import { EASE_OUT } from '../../lib/motion'
import type { ResumoProduto } from '../../store/selectors'
import Tag from '../ui/Tag'

interface ProdutoCardProps {
  resumo: ResumoProduto
  onSelect: () => void
}

const BARRA = { duration: 0.4, ease: EASE_OUT }

// Card de produto (Figma 19:2 e variantes): onde estão as peças, grade do central e giro
export default function ProdutoCard({ resumo, onSelect }: ProdutoCardProps) {
  const { produto, central, naRua, porTamanho, vendidas30d, etiqueta } = resumo

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      className="flex w-full cursor-pointer flex-col overflow-hidden rounded-card border border-line bg-surface text-left transition-shadow hover:shadow-modal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <span className="relative block h-60 w-full shrink-0 bg-surface-muted">
        {produto.imagem ? (
          <img src={produto.imagem} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <span aria-hidden className="flex size-full items-center justify-center text-display font-semibold text-track">
            {produto.nome.charAt(0)}
          </span>
        )}
      </span>

      <span className="flex w-full flex-col gap-3.5 px-5 py-4.5">
        <span className="flex items-center justify-between gap-2">
          <Tag>{CATEGORIA_LABEL[produto.categoria]}</Tag>
          {etiqueta === 'repor' && <Tag variant="warning">REPOR</Tag>}
          {etiqueta === 'tudo-na-rua' && <Tag variant="info">TUDO NA RUA</Tag>}
        </span>

        <span className="flex min-w-0 flex-col gap-0.75">
          <span className="truncate text-heading font-semibold text-ink">{produto.nome}</span>
          <span className="text-caption leading-3.5 tracking-[0.04em] text-muted">{produto.sku}</span>
        </span>

        {/* Faixa: central (grafite) e na rua (azul-marinho), proporcionais */}
        <span className="flex flex-col gap-2.25">
          <span aria-hidden className="flex h-2.25 w-full gap-0.75 overflow-hidden rounded-full bg-line">
            {central > 0 && (
              <motion.span
                initial={false}
                animate={{ flexGrow: central }}
                transition={BARRA}
                className="basis-0 rounded-full bg-ink-soft"
              />
            )}
            {naRua > 0 && (
              <motion.span
                initial={false}
                animate={{ flexGrow: naRua }}
                transition={BARRA}
                className="basis-0 rounded-full bg-info"
              />
            )}
          </span>
          <span className="flex items-center justify-between gap-2 text-button leading-4 font-medium tabular-nums">
            <span className={`flex items-center gap-1.75 ${central > 0 ? 'text-ink-soft' : 'text-warning'}`}>
              <img src={central > 0 ? pontoCentral : pontoVazio} alt="" width={7} height={7} />
              {formatNumber(central)} no central
            </span>
            <span className={`flex items-center gap-1.75 ${naRua > 0 ? 'text-info' : 'text-muted'}`}>
              <img src={naRua > 0 ? pontoRua : pontoVazio} alt="" width={7} height={7} />
              {formatNumber(naRua)} na rua
            </span>
          </span>
        </span>

        <span className="flex gap-2">
          {TAMANHOS_GRADE.map((tamanho) => {
            const quantidade = porTamanho[tamanho]
            const vazio = quantidade === 0
            return (
              <span
                key={tamanho}
                className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border py-1.75 ${vazio ? 'border-line text-track' : 'border-line-strong bg-surface-muted'}`}
              >
                <span className={`font-label text-eyebrow leading-3.25 font-semibold tracking-[0.1em] ${vazio ? '' : 'text-muted'}`}>
                  {tamanho}
                </span>
                <span className={`text-body leading-4 font-semibold tabular-nums ${vazio ? '' : 'text-ink'}`}>{quantidade}</span>
              </span>
            )
          })}
        </span>

        <span aria-hidden className="h-px w-full bg-line" />

        <span className="flex items-center justify-between gap-2">
          <span className="text-heading font-semibold text-ink tabular-nums">{formatCurrency(produto.preco)}</span>
          <span className="text-caption text-muted">
            {formatNumber(vendidas30d)} {vendidas30d === 1 ? 'vendida' : 'vendidas'} em 30 dias
          </span>
        </span>
      </span>
      <span className="sr-only">Dar entrada de mercadoria</span>
    </motion.button>
  )
}
