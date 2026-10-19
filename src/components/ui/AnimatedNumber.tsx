import { animate, useReducedMotion } from 'motion/react'
import { useLayoutEffect, useRef } from 'react'
import { EASE_OUT } from '../../lib/motion'

interface AnimatedNumberProps {
  value: number
  // Use uma função estável (ex.: formatCurrency), senão a contagem reinicia a cada render
  format: (value: number) => string
}

// Contagem animada dos indicadores do Painel; escreve direto no nó para não re-renderizar a cada quadro
export default function AnimatedNumber({ value, format }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const anterior = useRef(0)
  const reduzir = useReducedMotion()

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    if (reduzir) {
      anterior.current = value
      node.textContent = format(value)
      return
    }
    // anterior só avança a cada quadro: o StrictMode desmonta/remonta e a contagem recomeça do mesmo ponto
    node.textContent = format(anterior.current)
    const controls = animate(anterior.current, value, {
      duration: 0.7,
      ease: EASE_OUT,
      onUpdate: (atual) => {
        anterior.current = atual
        node.textContent = format(Number.isInteger(value) ? Math.round(atual) : atual)
      },
    })
    return () => controls.stop()
  }, [value, format, reduzir])

  return (
    <span ref={ref} className="tabular-nums">
      {format(value)}
    </span>
  )
}
