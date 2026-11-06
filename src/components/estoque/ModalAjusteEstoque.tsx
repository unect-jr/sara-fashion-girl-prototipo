import { useState, type FormEvent } from 'react'
import { useCarimbo } from '../../auth/useCarimbo'
import { MOTIVO_AJUSTE_LABEL } from '../../data/catalogo'
import type { MotivoAjuste } from '../../data/types'
import { formatNumber } from '../../lib/format'
import { compararTamanho } from '../../store/consultas'
import { getProduto } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import Button from '../ui/Button'
import Field from '../ui/Field'
import { fieldClasses, fieldErrorId, NUMBER_RESET } from '../ui/fieldStyles'
import Modal from '../ui/Modal'
import { MODAL_BODY, MODAL_FOOTER } from '../ui/modalStyles'
import Segmented from '../ui/Segmented'
import Select from '../ui/Select'

interface ModalAjusteEstoqueProps {
  produtoId: string | null
  onClose: () => void
  onSuccess: (mensagem: string) => void
}

const MOTIVOS = (Object.keys(MOTIVO_AJUSTE_LABEL) as MotivoAjuste[]).map((valor) => ({ valor, rotulo: MOTIVO_AJUSTE_LABEL[valor] }))
const LATENCIA_MS = 500

// Ajuste manual do saldo no central com motivo obrigatório (HU 2.4)
export default function ModalAjusteEstoque({ produtoId, onClose, onSuccess }: ModalAjusteEstoqueProps) {
  return (
    <Modal open={produtoId !== null} onClose={onClose} title="Ajustar quantidade" subtitle="Corrige o saldo do central; o ajuste fica no histórico">
      {produtoId && <AjusteForm produtoId={produtoId} onClose={onClose} onSuccess={onSuccess} />}
    </Modal>
  )
}

function AjusteForm({ produtoId, onClose, onSuccess }: Omit<ModalAjusteEstoqueProps, 'produtoId'> & { produtoId: string }) {
  const { state, dispatch } = useAppStore()
  const carimbar = useCarimbo()
  const produto = getProduto(state.produtos, produtoId)
  const variacoes = (produto?.variacoes ?? []).toSorted((a, b) => a.cor.localeCompare(b.cor) || compararTamanho(a.tamanho, b.tamanho))

  const [indice, setIndice] = useState(0)
  const [quantidade, setQuantidade] = useState(String(variacoes[0]?.quantidadeCentral ?? 0))
  const [motivo, setMotivo] = useState<MotivoAjuste | ''>('')
  const [observacao, setObservacao] = useState('')
  const [erros, setErros] = useState<{ motivo?: string; quantidade?: string }>({})
  const [salvando, setSalvando] = useState(false)

  const variacao = variacoes[indice]
  if (!produto || !variacao) {
    return (
      <div data-modal-body className={MODAL_BODY}>
        <p className="text-sub text-brand">Produto não encontrado. Feche e tente de novo.</p>
      </div>
    )
  }

  const nova = Number.parseInt(quantidade, 10)
  const diferenca = Number.isFinite(nova) ? nova - variacao.quantidadeCentral : 0

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (salvando || !produto || !variacao) return
    const novosErros = {
      quantidade: !Number.isFinite(nova) || nova < 0 ? 'Informe o saldo correto (zero ou mais)' : diferenca === 0 ? 'O saldo informado é igual ao atual' : undefined,
      motivo: motivo ? undefined : 'Escolha o motivo do ajuste',
    }
    setErros(novosErros)
    if (novosErros.quantidade || novosErros.motivo || !motivo) return

    setSalvando(true)
    window.setTimeout(() => {
      dispatch({
        type: 'ajustarEstoque',
        ajuste: { produtoId: produto.id, tamanho: variacao.tamanho, cor: variacao.cor, novaQuantidade: nova, motivo, observacao },
        carimbo: carimbar(),
      })
      onSuccess(`Saldo de ${produto.nome} ${variacao.tamanho} ${variacao.cor} ajustado para ${nova} · ${MOTIVO_AJUSTE_LABEL[motivo]}`)
      onClose()
    }, LATENCIA_MS)
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div data-modal-body className={MODAL_BODY}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Field label="Peça" htmlFor="ajuste-variacao" className="flex-1">
            <Select
              id="ajuste-variacao"
              value={indice}
              onChange={(event) => {
                const proximo = Number(event.target.value)
                setIndice(proximo)
                setQuantidade(String(variacoes[proximo]?.quantidadeCentral ?? 0))
                setErros({})
              }}
            >
              {variacoes.map((v, i) => (
                <option key={`${v.cor}-${v.tamanho}`} value={i}>
                  {v.cor} · {v.tamanho} · {v.quantidadeCentral} no central
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Saldo correto" htmlFor="ajuste-quantidade" error={erros.quantidade} className="sm:w-36">
            <input
              id="ajuste-quantidade"
              data-autofocus
              type="number"
              inputMode="numeric"
              min={0}
              value={quantidade}
              onChange={(event) => {
                setQuantidade(event.target.value)
                setErros((atual) => ({ ...atual, quantidade: undefined }))
              }}
              onFocus={(event) => event.target.select()}
              aria-invalid={erros.quantidade ? true : undefined}
              aria-describedby={erros.quantidade ? fieldErrorId('ajuste-quantidade') : undefined}
              className={`${fieldClasses()} ${NUMBER_RESET} text-right tabular-nums`}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="font-label text-label font-semibold text-muted uppercase">Motivo</p>
          <Segmented
            rotulo="Motivo do ajuste"
            opcoes={MOTIVOS}
            valor={motivo}
            invalido={Boolean(erros.motivo)}
            onChange={(valor) => {
              setMotivo(valor)
              setErros((atual) => ({ ...atual, motivo: undefined }))
            }}
          />
          {erros.motivo && (
            <p role="alert" className="px-3.5 text-caption text-brand">
              {erros.motivo}
            </p>
          )}
        </div>

        <Field label="Observação (opcional)" htmlFor="ajuste-observacao">
          <input
            id="ajuste-observacao"
            placeholder="Ex.: costura aberta na barra"
            value={observacao}
            onChange={(event) => setObservacao(event.target.value)}
            className={fieldClasses()}
          />
        </Field>
      </div>

      <div className={MODAL_FOOTER}>
        <p className="text-button leading-4 text-muted tabular-nums">
          De {formatNumber(variacao.quantidadeCentral)} para {Number.isFinite(nova) && nova >= 0 ? formatNumber(nova) : '?'}
          {diferenca !== 0 && (
            <span className={`font-semibold ${diferenca > 0 ? 'text-info' : 'text-brand'}`}>
              {' '}
              ({diferenca > 0 ? '+' : '−'}
              {formatNumber(Math.abs(diferenca))})
            </span>
          )}
        </p>
        <div className="flex gap-2.5">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Confirmar ajuste'}
          </Button>
        </div>
      </div>
    </form>
  )
}
