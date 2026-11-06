import { useState, type FormEvent } from 'react'
import { useCarimbo } from '../../auth/useCarimbo'
import { formatCurrency, formatDateShort, formatPecas } from '../../lib/format'
import { bloqueioDaVenda, MOTIVO_BLOQUEIO, pecasDaVenda } from '../../store/consultas'
import { getProduto } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import Button from '../ui/Button'
import Field from '../ui/Field'
import { fieldClasses, fieldErrorId } from '../ui/fieldStyles'
import Modal from '../ui/Modal'
import { MODAL_BODY, MODAL_FOOTER } from '../ui/modalStyles'

interface ModalCancelarVendaProps {
  vendaId: string | null
  onClose: () => void
  onSuccess: (mensagem: string) => void
}

const LATENCIA_MS = 500

// Cancelamento com motivo obrigatório; as peças voltam ao saldo da vendedora (HU 3.4)
export default function ModalCancelarVenda({ vendaId, onClose, onSuccess }: ModalCancelarVendaProps) {
  return (
    <Modal open={vendaId !== null} onClose={onClose} title="Cancelar venda" subtitle="As peças voltam para o saldo da vendedora">
      {vendaId && <CancelarForm vendaId={vendaId} onClose={onClose} onSuccess={onSuccess} />}
    </Modal>
  )
}

function CancelarForm({ vendaId, onClose, onSuccess }: Omit<ModalCancelarVendaProps, 'vendaId'> & { vendaId: string }) {
  const { state, dispatch } = useAppStore()
  const carimbar = useCarimbo()
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState<string>()
  const [salvando, setSalvando] = useState(false)

  const venda = state.vendas.find((v) => v.id === vendaId)
  const vendedora = state.vendedoras.find((v) => v.id === venda?.vendedoraId)
  if (!venda) return null
  const bloqueio = bloqueioDaVenda(state, venda)
  const temCobranca = state.crediarios.some((c) => c.id === venda.crediarioId)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (salvando || !venda || bloqueio) return
    if (!motivo.trim()) {
      setErro('Explique o motivo do cancelamento')
      return
    }
    setSalvando(true)
    window.setTimeout(() => {
      dispatch({ type: 'cancelarVenda', vendaId: venda.id, motivo, carimbo: carimbar() })
      const pecas = pecasDaVenda(venda)
      onSuccess(`Venda ${venda.id} cancelada · ${formatPecas(pecas)} ${pecas === 1 ? 'voltou' : 'voltaram'} para ${vendedora?.nome.split(' ')[0] ?? 'a vendedora'}`)
      onClose()
    }, LATENCIA_MS)
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div data-modal-body className={MODAL_BODY}>
        <div className="flex flex-col gap-2 rounded-tile border border-line bg-surface-muted px-3.5 py-3">
          <p className="text-sub font-medium text-ink">
            {venda.id} · {vendedora?.nome} · {formatDateShort(venda.data)} às {venda.hora}
          </p>
          <ul className="flex flex-col gap-0.5 text-caption text-muted tabular-nums">
            {venda.itens.map((item, index) => (
              <li key={index}>
                {item.quantidade}× {getProduto(state.produtos, item.produtoId)?.nome} · {item.tamanho} · {item.cor}
              </li>
            ))}
          </ul>
          <p className="text-sub font-semibold text-ink tabular-nums">{formatCurrency(venda.total)}</p>
        </div>

        {bloqueio ? (
          <p role="alert" className="rounded-tile border border-brand bg-brand-tint px-3.5 py-3 text-caption text-brand">
            {MOTIVO_BLOQUEIO[bloqueio]}
          </p>
        ) : (
          <>
            {temCobranca && <p className="text-caption text-muted">A cobrança desta venda no Crediário também é desfeita.</p>}
            <Field label="Motivo do cancelamento" htmlFor="cancelar-motivo" error={erro}>
              <textarea
                id="cancelar-motivo"
                data-autofocus
                rows={3}
                placeholder="Ex.: a cliente desistiu antes de levar a peça"
                value={motivo}
                onChange={(event) => {
                  setMotivo(event.target.value)
                  setErro(undefined)
                }}
                aria-invalid={erro ? true : undefined}
                aria-describedby={erro ? fieldErrorId('cancelar-motivo') : undefined}
                className={`${fieldClasses()} resize-none rounded-tile!`}
              />
            </Field>
          </>
        )}
      </div>
      <div className={MODAL_FOOTER}>
        <span />
        <div className="flex gap-2.5">
          <Button onClick={onClose}>Voltar</Button>
          {!bloqueio && (
            <Button type="submit" variant="primary" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Cancelar venda'}
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
