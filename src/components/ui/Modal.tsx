import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import fechar from '../../assets/icons/fechar.svg'
import { EASE_OUT } from '../../lib/motion'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  // Corpo + rodapé (use MODAL_BODY / MODAL_FOOTER de modalStyles); só monta com o modal aberto
  children: ReactNode
}

const FOCUSABLE = 'input, select, textarea, button, a[href], [tabindex]:not([tabindex="-1"])'

// Modal dos fluxos (Figma 24:227 / 24:282): overlay com fade, painel com escala sutil, Esc fecha, foco preso
export default function Modal({ open, onClose, title, subtitle, children }: ModalProps) {
  const titleId = useId()
  const subtitleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const anterior = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Foca o campo marcado com data-autofocus, ou o primeiro do corpo
    const panel = panelRef.current
    const alvo = panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel?.querySelector<HTMLElement>(`[data-modal-body] :is(${FOCUSABLE})`)
    alvo?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const focaveis = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hasAttribute('disabled'))
      if (focaveis.length === 0) return
      const primeiro = focaveis[0]
      const ultimo = focaveis[focaveis.length - 1]
      if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault()
        ultimo.focus()
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault()
        primeiro.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      anterior?.focus()
    }
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={subtitle ? subtitleId : undefined}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="flex max-h-[calc(100dvh-2rem)] w-full max-w-modal flex-col overflow-hidden rounded-modal bg-surface shadow-modal"
          >
            <header className="flex shrink-0 items-center justify-between gap-4 pt-6 pr-5 pb-4.5 pl-6.5">
              <div className="flex min-w-0 flex-col gap-1">
                <h2 id={titleId} className="text-metric font-semibold text-ink">
                  {title}
                </h2>
                {subtitle && (
                  <p id={subtitleId} className="text-button leading-4 text-muted">
                    {subtitle}
                  </p>
                )}
              </div>
              <motion.button
                type="button"
                onClick={onClose}
                whileTap={{ scale: 0.92 }}
                aria-label="Fechar"
                className="shrink-0 rounded-full border border-line bg-surface-muted p-2.25 transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <img src={fechar} alt="" width={11} height={11} />
              </motion.button>
            </header>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
