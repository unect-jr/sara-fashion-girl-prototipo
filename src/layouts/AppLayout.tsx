import { MotionConfig, motion } from 'motion/react'
import { Outlet, useLocation } from 'react-router'
import Sidebar from '../components/Sidebar'
import { EASE_OUT } from '../lib/motion'

export default function AppLayout() {
  const location = useLocation()

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-dvh">
        <Sidebar />
        <main className="min-w-0 flex-1">
          {/* Transição entre páginas: fade + leve subida */}
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="flex flex-col gap-6 px-page-x pt-7.5 pb-10"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </MotionConfig>
  )
}
