import { MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { Inicio, SoAdmin, SoVendedor } from './auth/Guardas'
import AppLayout from './layouts/AppLayout'
import Acertos from './pages/Acertos'
import Crediario from './pages/Crediario'
import Estoque from './pages/Estoque'
import Login from './pages/Login'
import Movimentacoes from './pages/Movimentacoes'
import NaoEncontrada from './pages/NaoEncontrada'
import ProdutoDetalhe from './pages/ProdutoDetalhe'
import Relatorios from './pages/Relatorios'
import RemessaDetalhe from './pages/RemessaDetalhe'
import Remessas from './pages/Remessas'
import Usuarios from './pages/Usuarios'
import VendaBaixa from './pages/VendaBaixa'
import VendedoraDetalhe from './pages/VendedoraDetalhe'
import Vendedoras from './pages/Vendedoras'
import Vendas from './pages/Vendas'

const admin = (pagina: ReactNode) => <SoAdmin>{pagina}</SoAdmin>

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Inicio /> },
      { path: 'estoque', element: admin(<Estoque />) },
      { path: 'estoque/:id', element: admin(<ProdutoDetalhe />) },
      { path: 'movimentacoes', element: admin(<Movimentacoes />) },
      { path: 'vendedoras', element: admin(<Vendedoras />) },
      { path: 'vendedoras/:id', element: admin(<VendedoraDetalhe />) },
      { path: 'remessas', element: admin(<Remessas />) },
      { path: 'remessas/:id', element: admin(<RemessaDetalhe />) },
      { path: 'vendas', element: admin(<Vendas />) },
      { path: 'acertos', element: admin(<Acertos />) },
      { path: 'crediario', element: admin(<Crediario />) },
      { path: 'relatorios', element: admin(<Relatorios />) },
      { path: 'usuarios', element: admin(<Usuarios />) },
      {
        path: 'venda',
        element: (
          <SoVendedor>
            <VendaBaixa />
          </SoVendedor>
        ),
      },
      { path: '*', element: <NaoEncontrada /> },
    ],
  },
])

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <RouterProvider router={router} />
    </MotionConfig>
  )
}
