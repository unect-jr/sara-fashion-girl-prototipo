import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { EASE_OUT } from '../../lib/motion'

export interface ToastMessage {
  id: number
  text: string
}

interface ToastProps {
  toast: ToastMessage | null
  onDismiss: () => void
}

const DURACAO_MS = 3200

// Aviso discreto de sucesso após uma ação (sem mockup no Figma: derivado dos tokens)
export default function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(onDismiss, DURACAO_MS)
    return () => window.clearTimeout(timer)
  }, [toast, onDismiss])

  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-4 bottom-6 z-60 flex justify-center sm:justify-end">
      <AnimatePresence>
        {toast && (
          <motion.p
            key={toast.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="flex items-center gap-2.5 rounded-full bg-ink px-4.5 py-3 text-button font-medium text-white shadow-modal"
          >
            <span aria-hidden className="size-1.75 rounded-full bg-white" />
            {toast.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
