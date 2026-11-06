import { AnimatePresence, motion } from 'motion/react'
import { EASE_OUT } from '../../lib/motion'

// Número que rola quando muda (inspirado no "Rolling text" do Skiper UI)
export default function NumeroRolante({ valor, className = '' }: { valor: number | string; className?: string }) {
  return (
    <span className={`relative inline-flex overflow-hidden tabular-nums ${className}`}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={valor}
          initial={{ y: '90%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-90%', opacity: 0 }}
          transition={{ duration: 0.22, ease: EASE_OUT }}
          className="inline-block"
        >
          {valor}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
