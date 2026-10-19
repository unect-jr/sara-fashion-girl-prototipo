import { createBrowserRouter, RouterProvider } from 'react-router'
import AppLayout from './layouts/AppLayout'
import Acertos from './pages/Acertos'
import Crediario from './pages/Crediario'
import Estoque from './pages/Estoque'
import NaoEncontrada from './pages/NaoEncontrada'
import Painel from './pages/Painel'
import RemessaDetalhe from './pages/RemessaDetalhe'
import Remessas from './pages/Remessas'
import VendedoraDetalhe from './pages/VendedoraDetalhe'
import Vendedoras from './pages/Vendedoras'

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Painel /> },
      { path: 'estoque', element: <Estoque /> },
      { path: 'vendedoras', element: <Vendedoras /> },
      { path: 'vendedoras/:id', element: <VendedoraDetalhe /> },
      { path: 'remessas', element: <Remessas /> },
      { path: 'remessas/:id', element: <RemessaDetalhe /> },
      { path: 'acertos', element: <Acertos /> },
      { path: 'crediario', element: <Crediario /> },
      { path: '*', element: <NaoEncontrada /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
