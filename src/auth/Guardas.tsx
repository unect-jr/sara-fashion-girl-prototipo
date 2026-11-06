import type { ReactNode } from 'react'
import { Link, Navigate } from 'react-router'
import PageHeader from '../components/PageHeader'
import { buttonClasses } from '../components/ui/buttonStyles'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Painel from '../pages/Painel'
import { useAuth } from './useAuth'

// Estoque geral, dashboards e cobranças são só do administrador (HU 1.1 e 1.2)
export function SoAdmin({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()
  if (usuario?.perfil === 'admin') return children
  return (
    <>
      <PageHeader title="Acesso restrito" />
      <Card>
        <EmptyState
          title="Esta área é só da administração"
          description="Com o seu acesso você registra as vendas e dá baixa nas peças que estão com você."
          action={
            <Link to="/venda" className={buttonClasses({ variant: 'primary' })}>
              Ir para Venda e baixa
            </Link>
          }
        />
      </Card>
    </>
  )
}

// A tela de venda e baixa é da vendedora; a loja lança vendas pela tela Vendas
export function SoVendedor({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()
  if (usuario?.perfil === 'vendedor') return children
  return <Navigate to="/vendas" replace />
}

export function Inicio() {
  const { usuario } = useAuth()
  return usuario?.perfil === 'vendedor' ? <Navigate to="/venda" replace /> : <Painel />
}
