import { motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router'
import { TIPO_MOVIMENTACAO_LABEL } from '../../data/catalogo'
import type { Movimentacao, TipoMovimentacao } from '../../data/types'
import { formatDateShort, formatNumber } from '../../lib/format'
import { EASE_OUT } from '../../lib/motion'
import { nomeUsuario } from '../../store/consultas'
import { getProduto } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import AmostraCor from '../ui/AmostraCor'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import Tag, { type TagVariant } from '../ui/Tag'

interface ListaMovimentacoesProps {
  movimentacoes: Movimentacao[]
  // Na página do produto o nome já está no título
  mostrarProduto?: boolean
  vazio: { title: string; description: string }
}

const VARIANTE: Record<TipoMovimentacao, TagVariant> = {
  entrada: 'info',
  devolucao: 'info',
  saida: 'muted',
  venda: 'muted',
  ajuste: 'warning',
  cancelamento: 'brand',
}

const POR_PAGINA = 25

// Lista de entradas, saídas, devoluções, vendas e ajustes com data, hora e usuário (HU 2.6)
export default function ListaMovimentacoes({ movimentacoes, mostrarProduto = true, vazio }: ListaMovimentacoesProps) {
  const { state } = useAppStore()
  const [limite, setLimite] = useState(POR_PAGINA)

  if (movimentacoes.length === 0) return <EmptyState title={vazio.title} description={vazio.description} />

  const primeiroNome = (vendedoraId?: string) => state.vendedoras.find((v) => v.id === vendedoraId)?.nome.split(' ')[0] ?? 'vendedora'

  function origem(m: Movimentacao): string {
    switch (m.tipo) {
      case 'entrada':
        return [m.referencia, m.detalhe].filter(Boolean).join(' · ')
      case 'saida':
        return `Remessa ${m.referencia} para ${primeiroNome(m.vendedoraId)}`
      case 'devolucao':
        return `${primeiroNome(m.vendedoraId)} devolveu · ${m.referencia}${m.detalhe ? ` · ${m.detalhe}` : ''}`
      case 'venda':
        return `Venda ${m.referencia} de ${primeiroNome(m.vendedoraId)}${m.detalhe ? ` · ${m.detalhe}` : ''}`
      case 'cancelamento':
        return `Venda ${m.referencia} cancelada · ${m.motivo ?? ''}`
      case 'ajuste':
        return [m.motivo, m.detalhe].filter(Boolean).join(' · ')
    }
  }

  function onde(m: Movimentacao): string {
    if (m.tipo === 'venda' || m.tipo === 'cancelamento') return `com ${primeiroNome(m.vendedoraId)}`
    return 'no central'
  }

  return (
    <div className="border-t border-line">
      <ul>
        {movimentacoes.slice(0, limite).map((m, index) => {
          const produto = getProduto(state.produtos, m.produtoId)
          return (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT, delay: Math.min(index % POR_PAGINA, 12) * 0.025 }}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-card-x py-3 last:border-b-0"
            >
              <div className="flex w-24 shrink-0 flex-col gap-1">
                <p className="text-caption leading-3.5 text-muted tabular-nums">
                  {formatDateShort(m.data)} · {m.hora}
                </p>
                <div>
                  <Tag variant={VARIANTE[m.tipo]}>{TIPO_MOVIMENTACAO_LABEL[m.tipo].toUpperCase()}</Tag>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 basis-56 flex-col gap-0.75">
                <p className="flex min-w-0 items-center gap-2 text-sub font-medium text-ink">
                  {mostrarProduto && produto ? (
                    <Link to={`/estoque/${produto.id}`} className="truncate hover:underline">
                      {produto.nome}
                    </Link>
                  ) : null}
                  <span className={`flex shrink-0 items-center gap-1.5 ${mostrarProduto ? 'text-caption font-normal text-muted' : ''}`}>
                    <AmostraCor cor={m.cor} tamanho="sm" />
                    {m.tamanho} · {m.cor}
                  </span>
                </p>
                <p className="truncate text-caption text-muted">{origem(m)}</p>
              </div>
              <div className="flex w-32 shrink-0 flex-col items-end gap-0.5 text-right">
                <p className={`text-row font-semibold tabular-nums ${m.quantidade > 0 ? 'text-info' : 'text-ink'}`}>
                  {m.quantidade > 0 ? '+' : '−'}
                  {formatNumber(Math.abs(m.quantidade))} <span className="text-caption font-normal text-muted">{onde(m)}</span>
                </p>
                <p className="text-caption text-muted">por {nomeUsuario(state.usuarios, m.usuarioId)}</p>
              </div>
            </motion.li>
          )
        })}
      </ul>
      {movimentacoes.length > limite && (
        <div className="flex justify-center border-t border-line bg-surface-muted px-card-x py-3">
          <Button size="xs" onClick={() => setLimite((atual) => atual + POR_PAGINA)}>
            Mostrar mais {formatNumber(Math.min(POR_PAGINA, movimentacoes.length - limite))}
          </Button>
        </div>
      )}
    </div>
  )
}
