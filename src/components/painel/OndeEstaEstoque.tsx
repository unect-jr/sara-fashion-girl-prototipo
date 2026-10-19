import { motion } from 'motion/react'
import { useMemo, type ReactNode } from 'react'
import { parseISODate } from '../../lib/date'
import { formatCurrency, formatPecas } from '../../lib/format'
import { EASE_OUT } from '../../lib/motion'
import { custoCentral, pecasCentral, pecasNaRua, saldoCrediario, saldoEmAtraso, valorNaRua, vendidoNoMes } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import AnimatedNumber from '../ui/AnimatedNumber'
import Card from '../ui/Card'

const mesLongo = new Intl.DateTimeFormat('pt-BR', { month: 'long' })
const percentual = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 })

const EYEBROW = 'font-label text-eyebrow font-semibold uppercase'

interface MedidaProps {
  rotulo: string
  valor: ReactNode
  detalhe: ReactNode
  detalheAlerta?: boolean
}

function Medida({ rotulo, valor, detalhe, detalheAlerta = false }: MedidaProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.25">
      <p className={`${EYEBROW} text-muted`}>{rotulo}</p>
      <p className="text-metric font-semibold text-ink">{valor}</p>
      <p className={`text-caption ${detalheAlerta ? 'text-brand' : 'text-muted'} tabular-nums`}>{detalhe}</p>
    </div>
  )
}

// Seção "Onde está o estoque" (Figma 9:39): faixa central × na rua e tira de medidas do mês
export default function OndeEstaEstoque() {
  const { state } = useAppStore()

  const dados = useMemo(() => {
    const central = pecasCentral(state.produtos)
    const naRua = pecasNaRua(state.remessas)
    const vendido = vendidoNoMes(state)
    return {
      central,
      naRua,
      total: central + naRua,
      custo: custoCentral(state.produtos),
      consignado: valorNaRua(state),
      vendido,
      aReceber: saldoCrediario(state.crediarios),
      emAtraso: saldoEmAtraso(state.crediarios, state.hoje),
    }
  }, [state])

  const fracaoCentral = dados.total > 0 ? (dados.central / dados.total) * 100 : 100
  const taxaComissao = dados.vendido.valorBruto > 0 ? dados.vendido.comissao / dados.vendido.valorBruto : state.vendedoras[0]?.comissao ?? 0

  return (
    <Card title="Onde está o estoque" aside={<span className="tabular-nums">{formatPecas(dados.total)} no total</span>}>
      <div className="flex flex-col gap-2.75 px-card-x pb-5.5">
        {/* Faixa: central (grafite) + na rua (azul-marinho), com marcos nas pontas e na divisa */}
        <div
          className="relative h-3.5"
          role="img"
          aria-label={`${formatPecas(dados.central)} no central e ${formatPecas(dados.naRua)} na rua`}
        >
          <div className="absolute inset-x-0 top-0.75 flex h-2 gap-0.5">
            <motion.div
              className="rounded-full bg-ink-soft"
              initial={{ width: '0%' }}
              animate={{ width: `${fracaoCentral}%` }}
              transition={{ duration: 0.7, ease: EASE_OUT }}
            />
            <div className="flex-1 rounded-full bg-info" />
          </div>
          <div className="absolute top-0 left-0 h-3.5 w-[1.5px] rounded-full bg-ink-soft" />
          <motion.div
            className="absolute top-0 h-3.5 w-[1.5px] rounded-full bg-ink-soft"
            initial={{ left: '0%' }}
            animate={{ left: `${fracaoCentral}%` }}
            transition={{ duration: 0.7, ease: EASE_OUT }}
          />
          <div className="absolute top-0 right-0 h-3.5 w-[1.5px] rounded-full bg-info" />
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className={`${EYEBROW} text-ink-soft`}>Central</p>
            <p className="text-body font-medium text-ink tabular-nums">
              {formatPecas(dados.central)} · {formatCurrency(dados.custo)} em custo
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <p className={`${EYEBROW} text-info`}>Na rua, com as vendedoras</p>
            <p className="text-body font-medium text-ink tabular-nums">
              {formatPecas(dados.naRua)} · {formatCurrency(dados.consignado)} consignados
            </p>
          </div>
        </div>

        <div aria-hidden className="h-px w-full bg-line" />

        <div className="flex flex-col gap-4 pt-1.5 sm:flex-row sm:items-center sm:gap-5">
          <Medida
            rotulo={`Vendido em ${mesLongo.format(parseISODate(state.hoje))}`}
            valor={<AnimatedNumber value={dados.vendido.pecas} format={formatPecas} />}
            detalhe={`${formatCurrency(dados.vendido.valorBruto)} em vendas`}
          />
          <div aria-hidden className="hidden h-11.5 w-px shrink-0 bg-line sm:block" />
          <Medida
            rotulo="Comissão a pagar"
            valor={<AnimatedNumber value={dados.vendido.comissao} format={formatCurrency} />}
            detalhe={`${percentual.format(taxaComissao)} sobre o vendido`}
          />
          <div aria-hidden className="hidden h-11.5 w-px shrink-0 bg-line sm:block" />
          <Medida
            rotulo="A receber das clientes"
            valor={<AnimatedNumber value={dados.aReceber} format={formatCurrency} />}
            detalhe={dados.emAtraso > 0 ? `${formatCurrency(dados.emAtraso)} em atraso` : 'nada em atraso'}
            detalheAlerta={dados.emAtraso > 0}
          />
        </div>
      </div>
    </Card>
  )
}
