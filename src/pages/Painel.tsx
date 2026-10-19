import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import ModalEntradaMercadoria from '../components/estoque/ModalEntradaMercadoria'
import PageHeader from '../components/PageHeader'
import AcertosPendentes from '../components/painel/AcertosPendentes'
import ModalAcerto from '../components/painel/ModalAcerto'
import ModalNovaRemessa from '../components/painel/ModalNovaRemessa'
import OndeEstaEstoque from '../components/painel/OndeEstaEstoque'
import PrecisaAtencao from '../components/painel/PrecisaAtencao'
import Button from '../components/ui/Button'
import { buttonClasses } from '../components/ui/buttonStyles'
import Toast, { type ToastMessage } from '../components/ui/Toast'

type ModalAberto = { tipo: 'entrada'; produtoId?: string } | { tipo: 'remessa' } | { tipo: 'acerto'; remessaId: string } | null

const CARREGAMENTO_MS = 450

export default function Painel() {
  const [modal, setModal] = useState<ModalAberto>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [carregando, setCarregando] = useState(true)

  // Carregamento simulado na entrada da tela
  useEffect(() => {
    const timer = window.setTimeout(() => setCarregando(false), CARREGAMENTO_MS)
    return () => window.clearTimeout(timer)
  }, [])

  const fechar = useCallback(() => setModal(null), [])
  const avisar = useCallback((text: string) => setToast({ id: Date.now(), text }), [])
  const limparToast = useCallback(() => setToast(null), [])
  const repor = useCallback((produtoId: string) => setModal({ tipo: 'entrada', produtoId }), [])
  const fazerAcerto = useCallback((remessaId: string) => setModal({ tipo: 'acerto', remessaId }), [])

  return (
    <>
      <PageHeader
        title="Painel"
        actions={
          <>
            <Button onClick={() => setModal({ tipo: 'entrada' })}>Entrada de mercadoria</Button>
            <Link to="/crediario" className={buttonClasses()}>
              Registrar recebimento
            </Link>
            <Button variant="primary" onClick={() => setModal({ tipo: 'remessa' })}>
              Nova remessa
            </Button>
          </>
        }
      />

      <OndeEstaEstoque />
      <AcertosPendentes carregando={carregando} onFazerAcerto={fazerAcerto} />
      <PrecisaAtencao onRepor={repor} />

      <ModalEntradaMercadoria
        open={modal?.tipo === 'entrada'}
        onClose={fechar}
        produtoInicialId={modal?.tipo === 'entrada' ? modal.produtoId : undefined}
        onSuccess={avisar}
      />
      <ModalNovaRemessa open={modal?.tipo === 'remessa'} onClose={fechar} onSuccess={avisar} />
      <ModalAcerto remessaId={modal?.tipo === 'acerto' ? modal.remessaId : null} onClose={fechar} onSuccess={avisar} />
      <Toast toast={toast} onDismiss={limparToast} />
    </>
  )
}
