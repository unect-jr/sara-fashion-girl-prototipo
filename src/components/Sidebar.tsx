import { motion } from 'motion/react'
import { NavLink } from 'react-router'
import marcador from '../assets/marcador.svg'
import { useAuth } from '../auth/useAuth'
import { PERFIL_LABEL } from '../data/catalogo'
import { EASE_OUT } from '../lib/motion'
import Button from './ui/Button'
import VendedoraAvatar from './vendedoras/VendedoraAvatar'

interface NavItem {
  to: string
  label: string
  end?: boolean
}

const NAV_ADMIN: NavItem[] = [
  { to: '/', label: 'Painel', end: true },
  { to: '/estoque', label: 'Estoque' },
  { to: '/movimentacoes', label: 'Movimentações' },
  { to: '/vendedoras', label: 'Vendedoras' },
  { to: '/remessas', label: 'Remessas' },
  { to: '/vendas', label: 'Vendas' },
  { to: '/acertos', label: 'Acertos' },
  { to: '/crediario', label: 'Crediário' },
  { to: '/relatorios', label: 'Relatórios' },
  { to: '/usuarios', label: 'Usuários' },
]

// A vendedora só enxerga a tela de venda e baixa (HU 1.2)
const NAV_VENDEDOR: NavItem[] = [{ to: '/venda', label: 'Venda e baixa' }]

interface SidebarProps {
  variante?: 'fixa' | 'gaveta'
  className?: string
  onNavigate?: () => void
}

// Trilho lateral (Figma 13:3)
export default function Sidebar({ variante = 'fixa', className = '', onNavigate }: SidebarProps) {
  const { usuario, sair } = useAuth()
  const itens = usuario?.perfil === 'vendedor' ? NAV_VENDEDOR : NAV_ADMIN

  return (
    <aside
      className={`${variante === 'fixa' ? 'sticky top-0 h-dvh' : 'h-full'} w-rail shrink-0 flex-col overflow-y-auto border-r border-rail-line bg-rail ${className}`}
    >
      {/* Logo pendente no Figma: wordmark em texto até o arquivo chegar */}
      <div className="flex flex-col gap-0.75 px-6 pt-6.5 pb-6">
        <span className="font-label text-wordmark font-semibold text-ink">SARAH</span>
        <span className="text-tagline text-muted">fashion girl</span>
      </div>
      <div className="h-px w-full bg-rail-line" />
      <nav aria-label="Principal" className="flex flex-col gap-0.75 px-3.5 py-4">
        {itens.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex items-center gap-2.5 rounded-full px-3.5 py-2.25 text-body leading-4.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                isActive ? 'font-semibold text-ink' : 'text-muted hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Pílula do item ativo desliza entre os itens */}
                {isActive && (
                  <motion.span layoutId={`nav-ativo-${variante}`} transition={{ duration: 0.35, ease: EASE_OUT }} className="absolute inset-0 rounded-full bg-surface" />
                )}
                {isActive ? (
                  <img src={marcador} alt="" width={6} height={6} className="relative shrink-0" />
                ) : (
                  <span aria-hidden="true" className="relative size-1.5 shrink-0" />
                )}
                {/* Texto que rola no hover (inspirado no "Text roll navigation" do Skiper UI) */}
                <span className="relative block h-4.5 overflow-hidden">
                  <span className="block transition-transform duration-300 ease-out motion-safe:group-hover:-translate-y-full">{item.label}</span>
                  <span aria-hidden className="absolute inset-x-0 top-full block transition-transform duration-300 ease-out motion-safe:group-hover:-translate-y-full">
                    {item.label}
                  </span>
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {usuario && (
        <div className="mt-auto flex flex-col gap-3 border-t border-rail-line px-5 py-4.5">
          <div className="flex items-center gap-2.5">
            <VendedoraAvatar nome={usuario.nome} size="sm" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="truncate text-body font-semibold text-ink">{usuario.nome}</p>
              <p className="truncate text-caption text-muted">{PERFIL_LABEL[usuario.perfil]}</p>
            </div>
          </div>
          <Button size="xs" className="w-full" onClick={() => sair()}>
            Sair
          </Button>
        </div>
      )}
    </aside>
  )
}
