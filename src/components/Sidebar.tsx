import { NavLink } from 'react-router'
import marcador from '../assets/marcador.svg'

interface NavItem {
  to: string
  label: string
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Painel', end: true },
  { to: '/estoque', label: 'Estoque' },
  { to: '/vendedoras', label: 'Vendedoras' },
  { to: '/remessas', label: 'Remessas' },
  { to: '/acertos', label: 'Acertos' },
  { to: '/crediario', label: 'Crediário' },
]

// Trilho lateral (Figma 13:3)
export default function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-dvh w-rail shrink-0 flex-col overflow-y-auto border-r border-rail-line bg-rail">
      {/* Logo pendente no Figma: wordmark em texto até o arquivo chegar */}
      <div className="flex flex-col gap-0.75 px-6 pt-6.5 pb-6">
        <span className="font-label text-wordmark font-semibold text-ink">SARAH</span>
        <span className="text-tagline text-muted">fashion girl</span>
      </div>
      <div className="h-px w-full bg-rail-line" />
      <nav aria-label="Principal" className="flex flex-col gap-0.75 px-3.5 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-full px-3.5 py-2.25 text-body leading-4.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                isActive ? 'bg-surface font-semibold text-ink' : 'text-muted hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <img src={marcador} alt="" width={6} height={6} className="shrink-0" />
                ) : (
                  <span aria-hidden="true" className="size-1.5 shrink-0" />
                )}
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
