import { Link } from 'react-router'
import PageHeader from '../components/PageHeader'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'

export default function NaoEncontrada() {
  return (
    <>
      <PageHeader title="Página não encontrada" />
      <Card>
        <EmptyState
          title="Este endereço não existe"
          description="Confira o link ou volte para o Painel."
          action={
            <Link to="/" className="text-button font-medium text-info hover:underline">
              Ir para o Painel
            </Link>
          }
        />
      </Card>
    </>
  )
}
