import { useState, type FormEvent } from 'react'
import { proximoIdVendedora } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import Button from '../ui/Button'
import Field from '../ui/Field'
import { fieldClasses, fieldErrorId } from '../ui/fieldStyles'
import Modal from '../ui/Modal'
import { MODAL_BODY, MODAL_FOOTER } from '../ui/modalStyles'

interface ModalNovaVendedoraProps {
  open: boolean
  onClose: () => void
  onSuccess: (mensagem: string) => void
}

// Comissão padrão do mock (docs/produto.md §4)
const COMISSAO_PADRAO = 25
const LATENCIA_MS = 500

// Cadastro simples de vendedora (sem mockup no Figma: mesma linguagem dos outros modais)
export default function ModalNovaVendedora({ open, onClose, onSuccess }: ModalNovaVendedoraProps) {
  return (
    <Modal open={open} onClose={onClose} title="Nova vendedora" subtitle="Ela já pode receber remessas depois de cadastrada">
      <VendedoraForm onClose={onClose} onSuccess={onSuccess} />
    </Modal>
  )
}

function VendedoraForm({ onClose, onSuccess }: Omit<ModalNovaVendedoraProps, 'open'>) {
  const { state, dispatch } = useAppStore()
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [regiao, setRegiao] = useState('')
  const [comissao, setComissao] = useState(COMISSAO_PADRAO)
  const [tentou, setTentou] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const erros = {
    nome: nome.trim().length < 3 ? 'Informe o nome completo' : undefined,
    regiao: !regiao.trim() ? 'Informe a região de atuação' : undefined,
    comissao: comissao <= 0 || comissao >= 100 ? 'Use um percentual entre 1 e 99' : undefined,
  }
  const valido = !erros.nome && !erros.regiao && !erros.comissao

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    setTentou(true)
    if (!valido || salvando) return
    setSalvando(true)
    // Latência simulada para o feedback de salvamento
    window.setTimeout(() => {
      dispatch({
        type: 'novaVendedora',
        vendedora: {
          id: proximoIdVendedora(state.vendedoras),
          nome: nome.trim(),
          telefone: telefone.trim(),
          regiao: regiao.trim(),
          comissao: comissao / 100,
          ativa: true,
        },
      })
      onSuccess(`${nome.trim()} cadastrada`)
      onClose()
    }, LATENCIA_MS)
  }

  const erro = (campo: keyof typeof erros) => (tentou ? erros[campo] : undefined)
  const aria = (campo: keyof typeof erros, id: string) => ({
    'aria-invalid': Boolean(erro(campo)),
    'aria-describedby': erro(campo) ? fieldErrorId(id) : undefined,
  })

  return (
    <form noValidate onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div data-modal-body className={MODAL_BODY}>
        <Field label="Nome" htmlFor="vendedora-nome" error={erro('nome')}>
          <input
            id="vendedora-nome"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Ex.: Josiane Lima"
            className={fieldClasses()}
            {...aria('nome', 'vendedora-nome')}
          />
        </Field>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Field label="Região" htmlFor="vendedora-regiao" error={erro('regiao')} className="flex-1">
            <input
              id="vendedora-regiao"
              value={regiao}
              onChange={(event) => setRegiao(event.target.value)}
              placeholder="Bairro ou região"
              className={fieldClasses()}
              {...aria('regiao', 'vendedora-regiao')}
            />
          </Field>
          <Field label="Telefone" htmlFor="vendedora-telefone" className="flex-1">
            <input
              id="vendedora-telefone"
              type="tel"
              value={telefone}
              onChange={(event) => setTelefone(event.target.value)}
              placeholder="(11) 90000-0000"
              className={fieldClasses()}
            />
          </Field>
          <Field label="Comissão (%)" htmlFor="vendedora-comissao" error={erro('comissao')} className="sm:w-32">
            <input
              id="vendedora-comissao"
              type="number"
              inputMode="numeric"
              value={comissao}
              onChange={(event) => setComissao(Number.parseInt(event.target.value, 10) || 0)}
              className={`${fieldClasses()} tabular-nums`}
              {...aria('comissao', 'vendedora-comissao')}
            />
          </Field>
        </div>
      </div>

      <div className={MODAL_FOOTER}>
        <p className="text-button leading-4 text-muted">Comissão sobre o valor vendido em cada acerto</p>
        <div className="flex gap-2.5">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Cadastrar'}
          </Button>
        </div>
      </div>
    </form>
  )
}
