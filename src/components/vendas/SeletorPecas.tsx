import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { formatCurrency } from '../../lib/format'
import { EASE_OUT } from '../../lib/motion'
import type { PecaEmMaos } from '../../store/consultas'
import AmostraCor from '../ui/AmostraCor'
import { CampoBusca } from '../ui/BarraFiltros'
import EmptyState from '../ui/EmptyState'
import Stepper from '../ui/Stepper'

interface SeletorPecasProps {
  pecas: PecaEmMaos[]
  quantidades: Record<string, number>
  onChange: (chave: string, quantidade: number) => void
  // "com você" na tela da vendedora, "com ela" na tela da loja
  rotuloSaldo: string
  vazio: { title: string; description: string }
}

const BUSCA_A_PARTIR_DE = 7

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

// Peças em mãos com contador; não deixa passar do saldo (HU 3.2)
export default function SeletorPecas({ pecas, quantidades, onChange, rotuloSaldo, vazio }: SeletorPecasProps) {
  const [busca, setBusca] = useState('')
  const [excedeu, setExcedeu] = useState<string | null>(null)

  if (pecas.length === 0) return <EmptyState title={vazio.title} description={vazio.description} />

  const termo = normalizar(busca.trim())
  const visiveis = termo ? pecas.filter((peca) => normalizar(`${peca.produto.nome} ${peca.produto.sku} ${peca.cor} ${peca.tamanho}`).includes(termo)) : pecas

  return (
    <div className="flex flex-col gap-2.5">
      {pecas.length >= BUSCA_A_PARTIR_DE && (
        <CampoBusca valor={busca} onChange={setBusca} placeholder="Buscar peça, cor ou tamanho" rotulo="Buscar peça" className="sm:w-full" />
      )}
      <ul className="flex flex-col gap-2">
        {visiveis.map((peca) => {
          const quantidade = quantidades[peca.chave] ?? 0
          return (
            <li
              key={peca.chave}
              className={`flex flex-col gap-1.5 rounded-tile border px-3.5 py-2.5 transition-colors ${quantidade > 0 ? 'border-info bg-info-tint/40' : 'border-line bg-surface'}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-surface-muted">
                  {peca.produto.imagem ? (
                    <img src={peca.produto.imagem} alt="" className="size-full object-cover" />
                  ) : (
                    <span aria-hidden className="text-row font-semibold text-track">
                      {peca.produto.nome.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="truncate text-sub font-medium text-ink">{peca.produto.nome}</p>
                  <p className="flex items-center gap-1.5 truncate text-caption text-muted tabular-nums">
                    <AmostraCor cor={peca.cor} tamanho="sm" />
                    {peca.tamanho} · {peca.cor} · {peca.quantidade} {rotuloSaldo} · {formatCurrency(peca.produto.preco)}
                  </p>
                </div>
                <Stepper
                  valor={quantidade}
                  maximo={peca.quantidade}
                  rotulo={`${peca.produto.nome} ${peca.tamanho} ${peca.cor}`}
                  onChange={(valor) => {
                    setExcedeu(null)
                    onChange(peca.chave, valor)
                  }}
                  onExcedeu={() => setExcedeu(peca.chave)}
                />
              </div>
              <AnimatePresence>
                {excedeu === peca.chave && (
                  <motion.p
                    role="alert"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: EASE_OUT }}
                    className="text-caption text-brand"
                  >
                    Só há {peca.quantidade} dessa peça {rotuloSaldo}. Não dá para baixar mais do que isso.
                  </motion.p>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ul>
      {visiveis.length === 0 && <p className="px-1 text-caption text-muted">Nenhuma peça bate com a busca.</p>}
    </div>
  )
}
