import { AnimatePresence, motion } from 'motion/react'
import { useId, useState } from 'react'
import { Link } from 'react-router'
import { FORMA_VENDA_LABEL } from '../../data/catalogo'
import type { Venda } from '../../data/types'
import { formatCurrency, formatDateShort, formatPecas } from '../../lib/format'
import { EASE_OUT } from '../../lib/motion'
import { bloqueioDaVenda, nomeUsuario, pecasDaVenda, vendaAcertada } from '../../store/consultas'
import { getProduto } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import AmostraCor from '../ui/AmostraCor'
import Button from '../ui/Button'
import Tag from '../ui/Tag'

interface VendaLinhaProps {
  venda: Venda
  mostrarVendedora?: boolean
  onCancelar?: (vendaId: string) => void
  onCorrigir?: (vendaId: string) => void
}

// Linha do histórico de vendas: abre os itens; ações só enquanto a venda pode mudar (HU 3.3 e 3.4)
export default function VendaLinha({ venda, mostrarVendedora = true, onCancelar, onCorrigir }: VendaLinhaProps) {
  const { state } = useAppStore()
  const [aberta, setAberta] = useState(false)
  const itensId = useId()
  const vendedora = state.vendedoras.find((v) => v.id === venda.vendedoraId)
  const lancouOutro = !state.usuarios.some((u) => u.id === venda.lancadoPorId && u.vendedoraId === venda.vendedoraId)
  const primeiro = getProduto(state.produtos, venda.itens[0]?.produtoId ?? '')
  const outros = venda.itens.length - 1
  const podeMudar = !bloqueioDaVenda(state, venda)
  const credito = state.crediarios.find((c) => c.id === venda.crediarioId)

  return (
    <li className={`border-b border-line last:border-b-0 ${venda.cancelamento ? 'bg-surface-muted/60' : ''}`}>
      <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2 px-card-x py-3.25">
        <button
          type="button"
          aria-expanded={aberta}
          aria-controls={itensId}
          aria-label={`${aberta ? 'Fechar' : 'Ver'} itens da ${venda.id}`}
          onClick={() => setAberta((atual) => !atual)}
          className="absolute inset-0 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
        />
        <div className="pointer-events-none flex w-24 shrink-0 flex-col gap-0.5">
          <p className={`text-row font-semibold ${venda.cancelamento ? 'text-muted line-through' : 'text-ink'}`}>{venda.id}</p>
          <p className="text-caption text-muted tabular-nums">
            {formatDateShort(venda.data)} · {venda.hora}
          </p>
        </div>
        {mostrarVendedora && (
          <div className="pointer-events-none flex w-44 min-w-0 flex-col gap-0.5">
            <p className="truncate text-body font-medium text-ink">{vendedora?.nome ?? 'Vendedora'}</p>
            <p className="truncate text-caption text-muted">
              {venda.noAcerto ? 'informada no acerto' : lancouOutro ? `lançada por ${nomeUsuario(state.usuarios, venda.lancadoPorId)}` : 'lançada por ela'}
            </p>
          </div>
        )}
        <div className="pointer-events-none flex min-w-0 flex-1 basis-40 flex-col gap-0.5">
          <p className="truncate text-sub text-ink">
            {primeiro?.nome}
            {outros > 0 && <span className="text-muted"> + {outros}</span>}
          </p>
          <p className="truncate text-caption text-muted">
            {formatPecas(pecasDaVenda(venda))}
            {venda.cliente ? ` · ${venda.cliente}` : ''}
          </p>
        </div>
        <div className="pointer-events-none flex items-center gap-2 sm:w-56 sm:justify-end">
          <Tag>{FORMA_VENDA_LABEL[venda.formaPagamento]}</Tag>
          {venda.cancelamento ? (
            <Tag variant="brand">CANCELADA</Tag>
          ) : vendaAcertada(venda) ? (
            <Tag variant="muted">ACERTADA</Tag>
          ) : (
            <Tag variant="info">A ACERTAR</Tag>
          )}
        </div>
        <p className={`pointer-events-none w-24 text-right text-row font-semibold tabular-nums ${venda.cancelamento ? 'text-muted line-through' : 'text-ink'}`}>
          {formatCurrency(venda.total)}
        </p>
        {(onCorrigir || onCancelar) && (
          <div className="relative flex gap-2 sm:w-42 sm:justify-end">
            {podeMudar && onCorrigir && (
              <Button size="xs" onClick={() => onCorrigir(venda.id)}>
                Corrigir
              </Button>
            )}
            {podeMudar && onCancelar && (
              <Button size="xs" className="text-brand! hover:border-brand!" onClick={() => onCancelar(venda.id)}>
                Cancelar
              </Button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {aberta && (
          <motion.div
            id={itensId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 border-t border-line bg-surface-muted px-card-x py-3">
              <ul className="flex flex-col gap-1">
                {venda.itens.map((item, index) => {
                  const produto = getProduto(state.produtos, item.produtoId)
                  return (
                    <li key={index} className="flex flex-wrap items-center gap-x-3 text-caption text-ink-detail tabular-nums">
                      <span className="flex min-w-0 flex-1 items-center gap-1.5">
                        <AmostraCor cor={item.cor} tamanho="sm" />
                        {item.quantidade}× {produto?.nome} · {item.tamanho} · {item.cor}
                      </span>
                      <Link to={`/remessas/${item.remessaId}`} className="text-info hover:underline">
                        {item.remessaId}
                      </Link>
                      <span className="w-22 text-right font-medium text-ink">{formatCurrency(item.quantidade * item.preco)}</span>
                    </li>
                  )
                })}
              </ul>
              {credito && (
                <p className="text-caption text-muted">
                  {credito.parcelas.length === 1 ? 'Cobrança' : `${credito.parcelas.length} parcelas`} no crediário · próximo vencimento{' '}
                  {formatDateShort(credito.parcelas.find((p) => !p.paga)?.vencimento ?? credito.parcelas[0].vencimento)}
                </p>
              )}
              {venda.corrigeVendaId && <p className="text-caption text-muted">Corrige a venda {venda.corrigeVendaId}</p>}
              {venda.cancelamento && (
                <p className="text-caption text-brand">
                  Cancelada em {formatDateShort(venda.cancelamento.data)} às {venda.cancelamento.hora} por{' '}
                  {nomeUsuario(state.usuarios, venda.cancelamento.usuarioId)} · {venda.cancelamento.motivo}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}
