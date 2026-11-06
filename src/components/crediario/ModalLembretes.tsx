import { useState, type FormEvent } from 'react'
import { useAppStore } from '../../store/useAppStore'
import Button from '../ui/Button'
import Field from '../ui/Field'
import { fieldClasses, fieldErrorId, NUMBER_RESET } from '../ui/fieldStyles'
import Interruptor from '../ui/Interruptor'
import Modal from '../ui/Modal'
import { MODAL_BODY, MODAL_FOOTER } from '../ui/modalStyles'

interface ModalLembretesProps {
  open: boolean
  onClose: () => void
  onSuccess: (mensagem: string) => void
}

// Regras dos lembretes de vencimento (HU 4.3)
export default function ModalLembretes({ open, onClose, onSuccess }: ModalLembretesProps) {
  return (
    <Modal open={open} onClose={onClose} title="Lembretes de vencimento" subtitle="Quando as parcelas aparecem como pendência no Painel e no Crediário">
      <LembretesForm onClose={onClose} onSuccess={onSuccess} />
    </Modal>
  )
}

function LembretesForm({ onClose, onSuccess }: Omit<ModalLembretesProps, 'open'>) {
  const { state, dispatch } = useAppStore()
  const [config, setConfig] = useState(state.lembretes)
  const [dias, setDias] = useState(String(state.lembretes.diasAntes))
  const [erro, setErro] = useState<string>()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const diasAntes = Number.parseInt(dias, 10)
    if (config.antes && (!Number.isFinite(diasAntes) || diasAntes < 1 || diasAntes > 30)) {
      setErro('Use um número de 1 a 30 dias')
      return
    }
    dispatch({ type: 'salvarLembretes', lembretes: { ...config, diasAntes: Number.isFinite(diasAntes) && diasAntes >= 1 ? Math.min(diasAntes, 30) : config.diasAntes } })
    onSuccess('Lembretes de vencimento atualizados')
    onClose()
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div data-modal-body className={MODAL_BODY}>
        <Interruptor
          ligado={config.antes}
          onChange={(antes) => setConfig((atual) => ({ ...atual, antes }))}
          rotulo="Antes do vencimento"
          descricao={`Avisa a partir de ${dias || '?'} dias antes`}
        />
        {config.antes && (
          <Field label="Quantos dias antes" htmlFor="lembrete-dias" error={erro} className="sm:w-44">
            <input
              id="lembrete-dias"
              type="number"
              inputMode="numeric"
              min={1}
              max={30}
              value={dias}
              onChange={(event) => {
                setDias(event.target.value)
                setErro(undefined)
              }}
              aria-invalid={erro ? true : undefined}
              aria-describedby={erro ? fieldErrorId('lembrete-dias') : undefined}
              className={`${fieldClasses()} ${NUMBER_RESET} tabular-nums`}
            />
          </Field>
        )}
        <Interruptor ligado={config.noDia} onChange={(noDia) => setConfig((atual) => ({ ...atual, noDia }))} rotulo="No dia do vencimento" descricao="Parcelas que vencem hoje" />
        <Interruptor
          ligado={config.depois}
          onChange={(depois) => setConfig((atual) => ({ ...atual, depois }))}
          rotulo="Depois do vencimento"
          descricao="Parcelas vencidas e ainda não pagas"
        />
        <p className="text-caption text-muted">Parcela marcada como paga nunca gera lembrete.</p>
      </div>
      <div className={MODAL_FOOTER}>
        <span />
        <div className="flex gap-2.5">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary">
            Salvar lembretes
          </Button>
        </div>
      </div>
    </form>
  )
}
