import type { Produto, Remessa } from '../../data/types'
import { descreverGrade } from '../../lib/grade'
import { formatCurrency, formatDateShort, formatNumber, formatPecas } from '../../lib/format'
import { itensRomaneio } from '../../store/selectors'
import Button from '../ui/Button'

interface RemessaItensProps {
  remessa: Remessa
  produtos: Produto[]
}

const COLUNAS = 'grid grid-cols-[minmax(0,330fr)_minmax(0,260fr)_104px_60px_118px] gap-4 px-5'

// Itens do romaneio com o total (Figma 17:83)
export default function RemessaItens({ remessa, produtos }: RemessaItensProps) {
  const itens = itensRomaneio(remessa, produtos)
  const pecas = itens.reduce((total, item) => total + item.quantidade, 0)
  const total = itens.reduce((soma, item) => soma + item.subtotal, 0)

  return (
    <div className="border-t border-line bg-surface-muted">
      <div className="overflow-x-auto">
        <table className="w-full min-w-180 tabular-nums">
          <thead>
            <tr className={`${COLUNAS} pt-3.25 pb-2.25 text-left font-label text-label font-semibold text-muted uppercase`}>
              <th className="font-semibold">Produto</th>
              <th className="font-semibold">Grade</th>
              <th className="text-right font-semibold">Preço</th>
              <th className="text-right font-semibold">Qtd</th>
              <th className="text-right font-semibold">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.produto.id} className={`${COLUNAS} items-center border-b border-line py-2 last:border-b-0`}>
                <td className="flex min-w-0 items-center gap-2.25 whitespace-nowrap">
                  <span className="truncate text-sub font-medium text-ink">{item.produto.nome}</span>
                  <span className="text-micro leading-3.5 tracking-[0.03em] text-muted">{item.produto.sku}</span>
                </td>
                <td className="truncate text-button leading-4.25 text-ink-detail">{descreverGrade(item.grade)}</td>
                <td className="text-right text-button leading-4.25 text-ink-detail">{formatCurrency(item.produto.preco)}</td>
                <td className="text-right text-sub font-medium text-ink">{formatNumber(item.quantidade)}</td>
                <td className="text-right text-sub font-medium text-ink">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-5 pt-3.25 pb-3.5">
        <div className="flex items-center gap-2.25">
          <p className="text-button-sm leading-3.75 font-medium text-ink-detail">Comprovante assinado em {formatDateShort(remessa.dataSaida)}</p>
          {/* Pílula menor do Figma (17:141): 11.5px Medium */}
          <Button size="xs" className="px-3.25! text-caption! font-medium!" onClick={() => window.print()}>
            Imprimir romaneio
          </Button>
        </div>
        <div className="flex items-center gap-5 whitespace-nowrap tabular-nums">
          <p className="text-button-sm leading-3.75 text-muted">
            {formatPecas(pecas)} em {formatNumber(itens.length)} {itens.length === 1 ? 'modelo' : 'modelos'}
          </p>
          <p className="text-wordmark leading-4.75 font-semibold tracking-normal text-ink">{formatCurrency(total)}</p>
        </div>
      </div>
    </div>
  )
}
