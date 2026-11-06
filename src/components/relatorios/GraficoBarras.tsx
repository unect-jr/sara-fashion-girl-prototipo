import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { EASE_OUT } from '../../lib/motion'

export interface Barra {
  chave: string
  rotulo: string
  valor: number
  detalhe: string
}

interface GraficoBarrasProps {
  barras: Barra[]
  formatar: (valor: number) => string
  vazio: string
}

const GUIAS = [0.25, 0.5, 0.75, 1]

// Arredonda o topo da escala para as guias caírem em valores redondos (479 → 500)
function topoDaEscala(valor: number): number {
  if (valor <= 0) return 0
  const base = 10 ** Math.floor(Math.log10(valor))
  const passo = [1, 2, 2.5, 4, 5, 10].map((fator) => fator * base).find((candidato) => candidato >= valor)
  return passo ?? 10 * base
}

// Barras verticais com dica que acompanha o cursor (inspirada no "Custom tooltip" do Skiper UI)
export default function GraficoBarras({ barras, formatar, vazio }: GraficoBarrasProps) {
  const [ativo, setAtivo] = useState<number | null>(null)
  const maximo = topoDaEscala(Math.max(0, ...barras.map((barra) => barra.valor)))
  const passoRotulo = Math.max(1, Math.ceil(barras.length / 8))
  const barraAtiva = ativo !== null ? barras[ativo] : undefined

  return (
    <div className="flex flex-col gap-2 px-card-x pb-5">
      <div className="relative h-56" onMouseLeave={() => setAtivo(null)}>
        {GUIAS.map((guia) => (
          <div key={guia} aria-hidden className="absolute inset-x-0 border-t border-dashed border-line" style={{ bottom: `${guia * 100}%` }}>
            {maximo > 0 && <span className="absolute -top-2.5 right-0 bg-surface pl-1.5 text-micro text-muted tabular-nums">{formatar(maximo * guia)}</span>}
          </div>
        ))}
        <div className="absolute inset-0 flex items-end gap-[3px] border-b border-line-strong pr-16">
          {barras.map((barra, index) => {
            const altura = maximo > 0 ? Math.max((barra.valor / maximo) * 100, barra.valor > 0 ? 1.5 : 0) : 0
            return (
              <button
                key={barra.chave}
                type="button"
                aria-label={`${barra.rotulo}: ${formatar(barra.valor)}, ${barra.detalhe}`}
                onMouseEnter={() => setAtivo(index)}
                onFocus={() => setAtivo(index)}
                onBlur={() => setAtivo(null)}
                className="relative flex h-full min-w-0 flex-1 items-end focus-visible:outline-2 focus-visible:outline-brand"
              >
                <motion.span
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.5, ease: EASE_OUT, delay: Math.min(index * 0.015, 0.4) }}
                  style={{ height: `${altura}%`, originY: 1 }}
                  className={`block w-full rounded-t-[4px] transition-colors ${ativo === index ? 'bg-brand' : 'bg-info'}`}
                />
              </button>
            )
          })}
        </div>

        {maximo === 0 && (
          <p className="absolute inset-0 flex items-center justify-center pr-16 text-sub text-muted">{vazio}</p>
        )}

        <AnimatePresence>
          {barraAtiva && ativo !== null && (
            <motion.div
              key="dica"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0, left: `calc(${((ativo + 0.5) / barras.length) * 100}% - ${((ativo + 0.5) / barras.length) * 4}rem)` }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-tile bg-ink px-3 py-2 text-white shadow-modal"
            >
              <p className="text-caption whitespace-nowrap text-white/70">{barraAtiva.rotulo}</p>
              <p className="text-sub font-semibold whitespace-nowrap tabular-nums">{formatar(barraAtiva.valor)}</p>
              <p className="text-caption whitespace-nowrap text-white/70">{barraAtiva.detalhe}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex gap-[3px] pr-16">
        {barras.map((barra, index) => (
          <span key={barra.chave} className="min-w-0 flex-1 text-center text-micro whitespace-nowrap text-muted tabular-nums">
            {index % passoRotulo === 0 ? barra.rotulo : ''}
          </span>
        ))}
      </div>
    </div>
  )
}
