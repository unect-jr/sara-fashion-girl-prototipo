import PageHeader from '../components/PageHeader'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'

export default function Painel() {
  return (
    <>
      <PageHeader title="Painel" />
      <Card>
        <EmptyState title="Tela em construção" description="Esta tela entra nos próximos marcos do protótipo." />
      </Card>
    </>
  )
}
