import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth'
import Sidebar from '../components/Sidebar'
import { buttonClasses } from '../components/ui/buttonStyles'
import { EASE_OUT } from '../lib/motion'

export default function AppLayout() {
  const location = useLocation()
  const { usuario } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)

  // Sem sessão (ou sessão expirada): volta para o login
  if (!usuario) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-dvh">
      <Sidebar className="hidden lg:flex" />

      {/* Menu recolhível no celular e no tablet */}
      <AnimatePresence>
        {menuAberto && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="fixed inset-0 z-40 flex lg:hidden"
          >
            <button type="button" aria-label="Fechar menu" onClick={() => setMenuAberto(false)} className="absolute inset-0 bg-overlay" />
            <motion.div initial={{ x: -32 }} animate={{ x: 0 }} exit={{ x: -32 }} transition={{ duration: 0.25, ease: EASE_OUT }} className="relative h-full">
              <Sidebar variante="gaveta" className="flex" onNavigate={() => setMenuAberto(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="min-w-0 flex-1">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-rail-line bg-rail px-5 py-3 lg:hidden">
          <div className="flex flex-col gap-0.5">
            <span className="font-label text-wordmark font-semibold text-ink">SARAH</span>
            <span className="text-tagline text-muted">fashion girl</span>
          </div>
          <button type="button" aria-expanded={menuAberto} onClick={() => setMenuAberto(true)} className={buttonClasses({ size: 'xs' })}>
            Menu
          </button>
        </div>
        {/* Transição entre páginas: fade + leve subida */}
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
          className="flex flex-col gap-6 px-5 pt-6 pb-10 sm:px-page-x sm:pt-7.5"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  )
}
