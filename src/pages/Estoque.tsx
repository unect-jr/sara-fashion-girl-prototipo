import PageHeader from '../components/PageHeader'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'

export default function Estoque() {
  return (
    <>
      <PageHeader title="Estoque" />
      <Card>
        <EmptyState title="Tela em construção" description="Esta tela entra nos próximos marcos do protótipo." />
      </Card>
    </>
  )
}
