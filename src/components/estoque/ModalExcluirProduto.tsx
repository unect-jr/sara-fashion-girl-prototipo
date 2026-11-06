import { useState } from 'react'
import { formatPecas } from '../../lib/format'
import { temMovimentacao } from '../../store/consultas'
import { getProduto } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { MODAL_BODY, MODAL_FOOTER } from '../ui/modalStyles'

interface ModalExcluirProdutoProps {
  produtoId: string | null
  onClose: () => void
  onExcluido: (mensagem: string) => void
  onInativado: (mensagem: string) => void
}

const LATENCIA_MS = 400

// Regra (HU 2.1): produto com movimentação só pode ser inativado, não excluído
export default function ModalExcluirProduto({ produtoId, onClose, onExcluido, onInativado }: ModalExcluirProdutoProps) {
  return (
    <Modal open={produtoId !== null} onClose={onClose} title="Excluir produto" subtitle="Excluir apaga o modelo do catálogo">
      {produtoId && <Conteudo produtoId={produtoId} onClose={onClose} onExcluido={onExcluido} onInativado={onInativado} />}
    </Modal>
  )
}

function Conteudo({ produtoId, onClose, onExcluido, onInativado }: Omit<ModalExcluirProdutoProps, 'produtoId'> & { produtoId: string }) {
  const { state, dispatch } = useAppStore()
  const [salvando, setSalvando] = useState(false)
  const produto = getProduto(state.produtos, produtoId)
  if (!produto) return null

  const movimentado = temMovimentacao(state, produto.id)
  const noCentral = produto.variacoes.reduce((total, variacao) => total + variacao.quantidadeCentral, 0)
  const bloqueado = movimentado || noCentral > 0

  function confirmar() {
    if (!produto) return
    setSalvando(true)
    window.setTimeout(() => {
      if (bloqueado) {
        dispatch({ type: 'inativarProduto', produtoId: produto.id, inativo: true })
        onInativado(`${produto.nome} inativado · o histórico continua guardado`)
      } else {
        dispatch({ type: 'excluirProduto', produtoId: produto.id })
        onExcluido(`${produto.nome} excluído do catálogo`)
      }
      onClose()
    }, LATENCIA_MS)
  }

  return (
    <>
      <div data-modal-body className={MODAL_BODY}>
        {bloqueado ? (
          <div role="alert" className="flex flex-col gap-1 rounded-tile border border-brand bg-brand-tint px-3.5 py-3">
            <p className="text-sub font-semibold text-brand">Não é possível excluir {produto.nome}</p>
            <p className="text-caption text-ink-detail">
              {movimentado
                ? 'Este produto tem movimentações no histórico (entradas, remessas ou vendas). Para tirá-lo do catálogo sem perder o histórico, inative.'
                : `Ainda há ${formatPecas(noCentral)} no central. Ajuste o saldo para zero ou inative o produto.`}
            </p>
          </div>
        ) : (
          <p className="text-sub text-ink-detail">
            {produto.nome} ({produto.sku}) não tem movimentações nem peças no central. Excluir apaga o cadastro de vez.
          </p>
        )}
      </div>
      <div className={MODAL_FOOTER}>
        <span />
        <div className="flex gap-2.5">
          <Button onClick={onClose}>Voltar</Button>
          {(!bloqueado || !produto.inativo) && (
            <Button variant="primary" disabled={salvando} onClick={confirmar}>
              {salvando ? 'Salvando…' : bloqueado ? 'Inativar produto' : 'Excluir produto'}
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
