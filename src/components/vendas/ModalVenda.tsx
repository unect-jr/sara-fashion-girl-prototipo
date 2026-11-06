import { useMemo, useState, type FormEvent } from 'react'
import { useCarimbo } from '../../auth/useCarimbo'
import { FORMA_VENDA_LABEL, FORMAS_A_PRAZO, FORMAS_VENDA } from '../../data/catalogo'
import type { FormaPagamentoVenda } from '../../data/types'
import { gerarParcelas } from '../../lib/crediario'
import { addDays } from '../../lib/date'
import { formatCurrency, formatDateShort, formatPecas } from '../../lib/format'
import { roundCents } from '../../lib/remessa'
import { chaveVariacao, pecasEmMaos, proximoIdVenda } from '../../store/consultas'
import { useAppStore } from '../../store/useAppStore'
import AmostraCor from '../ui/AmostraCor'
import Button from '../ui/Button'
import Field from '../ui/Field'
import { fieldClasses, fieldErrorId } from '../ui/fieldStyles'
import Modal from '../ui/Modal'
import { MODAL_BODY, MODAL_FOOTER } from '../ui/modalStyles'
import Segmented from '../ui/Segmented'
import Select from '../ui/Select'
import SeletorPecas from './SeletorPecas'

interface ModalVendaProps {
  open: boolean
  onClose: () => void
  onSuccess: (mensagem: string) => void
  // Tela da vendedora: ela mesma, com as peças já escolhidas na tela
  vendedoraId?: string
  selecao?: Record<string, number>
  // Correção (HU 3.4): cancela a original com motivo e registra a certa
  corrigirVendaId?: string
}

interface Erros {
  vendedora?: string
  pecas?: string
  cliente?: string
  vencimento?: string
  motivo?: string
}

const OPCOES_FORMA = FORMAS_VENDA.map((valor) => ({ valor, rotulo: FORMA_VENDA_LABEL[valor] }))
const PARCELAS = [2, 3, 4, 5, 6]
const LATENCIA_MS = 600

export default function ModalVenda({ open, onClose, onSuccess, vendedoraId, selecao, corrigirVendaId }: ModalVendaProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={corrigirVendaId ? `Corrigir ${corrigirVendaId}` : vendedoraId ? 'Dar baixa na venda' : 'Registrar venda'}
      subtitle={corrigirVendaId ? 'A venda original fica cancelada e a corrigida entra no lugar' : 'As peças saem do saldo da vendedora na hora'}
    >
      <VendaForm onClose={onClose} onSuccess={onSuccess} vendedoraId={vendedoraId} selecao={selecao} corrigirVendaId={corrigirVendaId} />
    </Modal>
  )
}

function vencimentoPadrao(forma: FormaPagamentoVenda, hoje: string): string {
  return addDays(hoje, forma === 'parcelado' ? 30 : 7)
}

function VendaForm({ onClose, onSuccess, vendedoraId: vendedoraFixa, selecao, corrigirVendaId }: Omit<ModalVendaProps, 'open'>) {
  const { state, dispatch } = useAppStore()
  const carimbar = useCarimbo()
  const original = corrigirVendaId ? state.vendas.find((venda) => venda.id === corrigirVendaId) : undefined
  const creditoOriginal = state.crediarios.find((c) => c.id === original?.crediarioId)

  const vendedorasComPecas = useMemo(
    () => state.vendedoras.filter((v) => v.ativa && pecasEmMaos(state, v.id).length > 0),
    [state],
  )
  const [vendedoraId, setVendedoraId] = useState(vendedoraFixa ?? original?.vendedoraId ?? vendedorasComPecas[0]?.id ?? '')
  // Na correção, as peças da venda original voltam a contar como disponíveis
  const pecas = useMemo(() => (vendedoraId ? pecasEmMaos(state, vendedoraId, original) : []), [state, vendedoraId, original])

  const [quantidades, setQuantidades] = useState<Record<string, number>>(() => {
    if (selecao) return selecao
    if (!original) return {}
    const iniciais: Record<string, number> = {}
    for (const item of original.itens) {
      const chave = chaveVariacao(item.produtoId, item)
      iniciais[chave] = (iniciais[chave] ?? 0) + item.quantidade
    }
    return iniciais
  })
  const [forma, setForma] = useState<FormaPagamentoVenda>(original?.formaPagamento ?? 'pix')
  const [cliente, setCliente] = useState(original?.cliente ?? '')
  const [parcelas, setParcelas] = useState(creditoOriginal && creditoOriginal.parcelas.length > 1 ? creditoOriginal.parcelas.length : 3)
  const [vencimento, setVencimento] = useState(creditoOriginal?.parcelas[0]?.vencimento ?? vencimentoPadrao(forma, state.hoje))
  const [motivo, setMotivo] = useState('')
  const [erros, setErros] = useState<Erros>({})
  const [salvando, setSalvando] = useState(false)

  const vendedora = state.vendedoras.find((v) => v.id === vendedoraId)
  const escolhidas = pecas.filter((peca) => (quantidades[peca.chave] ?? 0) > 0)
  const totalPecas = escolhidas.reduce((total, peca) => total + (quantidades[peca.chave] ?? 0), 0)
  const total = roundCents(escolhidas.reduce((soma, peca) => soma + (quantidades[peca.chave] ?? 0) * peca.produto.preco, 0))
  const aPrazo = FORMAS_A_PRAZO.includes(forma)
  const previa = aPrazo && total > 0 ? gerarParcelas(total, forma === 'parcelado' ? parcelas : 1, vencimento) : []

  function trocarForma(proxima: FormaPagamentoVenda) {
    setForma(proxima)
    setVencimento(vencimentoPadrao(proxima, state.hoje))
    setErros((atual) => ({ ...atual, cliente: undefined, vencimento: undefined }))
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (salvando) return
    const novosErros: Erros = {
      vendedora: vendedoraId ? undefined : 'Escolha a vendedora',
      pecas: totalPecas > 0 ? undefined : 'Escolha ao menos uma peça vendida',
      cliente: aPrazo && !cliente.trim() ? 'Informe o nome da cliente para a cobrança' : undefined,
      vencimento: aPrazo && vencimento <= state.hoje ? 'O vencimento precisa ser depois de hoje' : undefined,
      motivo: original && !motivo.trim() ? 'Explique o motivo da correção' : undefined,
    }
    setErros(novosErros)
    if (Object.values(novosErros).some(Boolean)) return

    const id = proximoIdVenda(state.vendas)
    const venda = {
      id,
      vendedoraId,
      cliente: cliente.trim() || undefined,
      itens: escolhidas.map((peca) => ({ produtoId: peca.produto.id, tamanho: peca.tamanho, cor: peca.cor, quantidade: quantidades[peca.chave] ?? 0 })),
      formaPagamento: forma,
      parcelas: forma === 'parcelado' ? parcelas : 1,
      primeiroVencimento: vencimento,
    }
    setSalvando(true)
    window.setTimeout(() => {
      const carimbo = carimbar()
      if (original) {
        dispatch({ type: 'corrigirVenda', vendaId: original.id, motivo, venda, carimbo })
        onSuccess(`Venda ${original.id} corrigida · a nova é a ${id}`)
      } else {
        dispatch({ type: 'registrarVenda', venda, carimbo })
        onSuccess(`Venda ${id} registrada · ${formatPecas(totalPecas)} · ${formatCurrency(total)}`)
      }
      onClose()
    }, LATENCIA_MS)
  }

  const descreveErro = (campo: keyof Erros, id: string) => (erros[campo] ? { 'aria-invalid': true, 'aria-describedby': fieldErrorId(id) } : {})

  return (
    <form noValidate onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div data-modal-body className={MODAL_BODY}>
        {!vendedoraFixa && !original && (
          <Field label="Vendedora" htmlFor="venda-vendedora" error={erros.vendedora}>
            <Select
              id="venda-vendedora"
              value={vendedoraId}
              onChange={(event) => {
                setVendedoraId(event.target.value)
                setQuantidades({})
              }}
            >
              {vendedorasComPecas.length === 0 && <option value="">Nenhuma vendedora com peças em mãos</option>}
              {vendedorasComPecas.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome} · {v.regiao}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {original && vendedora && (
          <p className="rounded-tile border border-line bg-surface-muted px-3.5 py-2.75 text-caption text-muted">
            Venda de {vendedora.nome} em {formatDateShort(original.data)} às {original.hora} · {formatCurrency(original.total)}
          </p>
        )}

        <p className="font-label text-label font-semibold text-muted uppercase">Peças vendidas</p>
        {selecao ? (
          <ul className="flex flex-col gap-2">
            {escolhidas.map((peca) => (
              <li key={peca.chave} className="flex items-center gap-3 rounded-tile border border-line px-3.5 py-2.5">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="truncate text-sub font-medium text-ink">{peca.produto.nome}</p>
                  <p className="flex items-center gap-1.5 text-caption text-muted">
                    <AmostraCor cor={peca.cor} tamanho="sm" />
                    {peca.tamanho} · {peca.cor}
                  </p>
                </div>
                <p className="text-sub text-ink-detail tabular-nums">{quantidades[peca.chave]} ×</p>
                <p className="w-24 text-right text-sub font-semibold text-ink tabular-nums">{formatCurrency((quantidades[peca.chave] ?? 0) * peca.produto.preco)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <SeletorPecas
            pecas={pecas}
            quantidades={quantidades}
            rotuloSaldo="com ela"
            onChange={(chave, quantidade) => {
              setQuantidades((atual) => ({ ...atual, [chave]: quantidade }))
              setErros((atual) => ({ ...atual, pecas: undefined }))
            }}
            vazio={{ title: 'Nenhuma peça com essa vendedora', description: 'Ela precisa receber uma remessa antes de vender.' }}
          />
        )}
        {erros.pecas && (
          <p role="alert" className="px-3.5 text-caption text-brand">
            {erros.pecas}
          </p>
        )}

        <div aria-hidden className="h-px w-full shrink-0 bg-line" />
        <p className="font-label text-label font-semibold text-muted uppercase">Pagamento da cliente</p>
        <Segmented rotulo="Forma de pagamento" opcoes={OPCOES_FORMA} valor={forma} onChange={trocarForma} tamanho="sm" />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Field label={aPrazo ? 'Cliente' : 'Cliente (opcional)'} htmlFor="venda-cliente" error={erros.cliente} className="flex-1">
            <input
              id="venda-cliente"
              placeholder="Nome de quem comprou"
              value={cliente}
              onChange={(event) => {
                setCliente(event.target.value)
                setErros((atual) => ({ ...atual, cliente: undefined }))
              }}
              className={fieldClasses()}
              {...descreveErro('cliente', 'venda-cliente')}
            />
          </Field>
          {forma === 'parcelado' && (
            <Field label="Parcelas" htmlFor="venda-parcelas" className="sm:w-28">
              <Select id="venda-parcelas" value={parcelas} onChange={(event) => setParcelas(Number(event.target.value))}>
                {PARCELAS.map((n) => (
                  <option key={n} value={n}>
                    {n}×
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {aPrazo && (
            <Field
              label={forma === 'parcelado' ? '1º vencimento' : forma === 'boleto' ? 'Vencimento' : 'Pagar até'}
              htmlFor="venda-vencimento"
              error={erros.vencimento}
              className="sm:w-40"
            >
              <input
                id="venda-vencimento"
                type="date"
                min={addDays(state.hoje, 1)}
                value={vencimento}
                onChange={(event) => setVencimento(event.target.value)}
                className={fieldClasses()}
                {...descreveErro('vencimento', 'venda-vencimento')}
              />
            </Field>
          )}
        </div>
        {previa.length > 0 && (
          <p className="px-3.5 text-caption text-muted tabular-nums">
            {previa.length === 1
              ? `Cobrança de ${formatCurrency(previa[0].valor)} em ${formatDateShort(previa[0].vencimento)}`
              : `${previa.length}× de ${formatCurrency(previa[0].valor)} · vencimentos ${previa.map((p) => formatDateShort(p.vencimento)).join(', ')}`}
            . Entra no Crediário.
          </p>
        )}

        {original && (
          <Field label="Motivo da correção" htmlFor="venda-motivo" error={erros.motivo}>
            <textarea
              id="venda-motivo"
              rows={2}
              placeholder="Ex.: lancei o tamanho errado"
              value={motivo}
              onChange={(event) => {
                setMotivo(event.target.value)
                setErros((atual) => ({ ...atual, motivo: undefined }))
              }}
              className={`${fieldClasses()} resize-none rounded-tile!`}
              {...descreveErro('motivo', 'venda-motivo')}
            />
          </Field>
        )}
      </div>

      <div className={MODAL_FOOTER}>
        <p className="text-button leading-4 text-muted tabular-nums">
          {formatPecas(totalPecas)} · <span className="font-semibold text-ink">{formatCurrency(total)}</span>
        </p>
        <div className="flex gap-2.5">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={salvando}>
            {salvando ? 'Salvando…' : original ? 'Salvar correção' : 'Confirmar venda'}
          </Button>
        </div>
      </div>
    </form>
  )
}
