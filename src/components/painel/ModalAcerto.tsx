import { useState, type FormEvent } from 'react'
import { useCarimbo } from '../../auth/useCarimbo'
import { FORMA_ACERTO_LABEL } from '../../data/catalogo'
import type { FormaPagamento } from '../../data/types'
import { formatCurrency, formatPecas } from '../../lib/format'
import { baixadas, calcularValoresAcerto, pendentes } from '../../lib/remessa'
import { describePrazo } from '../../lib/status'
import { getProduto } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import AmostraCor from '../ui/AmostraCor'
import Button from '../ui/Button'
import Field from '../ui/Field'
import { fieldClasses, NUMBER_RESET } from '../ui/fieldStyles'
import Modal from '../ui/Modal'
import { MODAL_BODY, MODAL_FOOTER } from '../ui/modalStyles'
import Select from '../ui/Select'

interface ModalAcertoProps {
  remessaId: string | null
  onClose: () => void
  onSuccess: (mensagem: string) => void
}

const FORMAS = Object.keys(FORMA_ACERTO_LABEL) as FormaPagamento[]
const LATENCIA_MS = 600

// Acerto: fecha as vendas que a vendedora já registrou, soma as vendidas informadas agora e devolve o resto
export default function ModalAcerto({ remessaId, onClose, onSuccess }: ModalAcertoProps) {
  return (
    <Modal open={remessaId !== null} onClose={onClose} title="Registrar acerto" subtitle="Informe o que foi vendido; o resto volta ao central">
      {remessaId && <AcertoForm remessaId={remessaId} onClose={onClose} onSuccess={onSuccess} />}
    </Modal>
  )
}

function AcertoForm({ remessaId, onClose, onSuccess }: Omit<ModalAcertoProps, 'remessaId'> & { remessaId: string }) {
  const { state, dispatch } = useAppStore()
  const carimbar = useCarimbo()
  const remessa = state.remessas.find((r) => r.id === remessaId)
  const vendedora = state.vendedoras.find((v) => v.id === remessa?.vendedoraId)
  const itens = remessa?.itens.filter((item) => pendentes(item) > 0) ?? []
  const comBaixa = remessa?.itens.filter((item) => baixadas(item) > 0) ?? []

  const [vendidas, setVendidas] = useState<number[]>(() => itens.map(() => 0))
  const [forma, setForma] = useState<FormaPagamento>('pix')
  const [salvando, setSalvando] = useState(false)

  if (!remessa || !vendedora) {
    return (
      <div data-modal-body className={MODAL_BODY}>
        <p className="text-sub text-brand">Remessa não encontrada. Feche e tente de novo.</p>
      </div>
    )
  }

  const pecasBaixadas = comBaixa.reduce((total, item) => total + baixadas(item), 0)
  const valorBaixado = comBaixa.reduce((total, item) => total + baixadas(item) * (getProduto(state.produtos, item.produtoId)?.preco ?? 0), 0)
  const valores = calcularValoresAcerto(
    [
      ...comBaixa.map((item) => ({ produtoId: item.produtoId, vendida: baixadas(item) })),
      ...itens.map((item, i) => ({ produtoId: item.produtoId, vendida: vendidas[i] })),
    ],
    state.produtos,
    vendedora.comissao,
  )
  const totalVendidas = pecasBaixadas + vendidas.reduce((total, n) => total + n, 0)
  const totalPendentes = itens.reduce((total, item) => total + pendentes(item), 0)

  function alterar(index: number, texto: string, maximo: number) {
    const numero = Math.min(Math.max(Number.parseInt(texto, 10) || 0, 0), maximo)
    setVendidas((atual) => atual.map((n, i) => (i === index ? numero : n)))
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (salvando || !remessa) return
    setSalvando(true)
    window.setTimeout(() => {
      dispatch({
        type: 'registrarAcerto',
        acerto: {
          remessaId: remessa.id,
          data: state.hoje,
          formaPagamento: forma,
          itens: itens.map((item, i) => ({
            produtoId: item.produtoId,
            tamanho: item.tamanho,
            cor: item.cor,
            vendida: vendidas[i],
            devolvida: pendentes(item) - vendidas[i],
          })),
        },
        carimbo: carimbar(),
      })
      onSuccess(`Acerto da ${remessa.id} registrado · ${formatCurrency(valores.valorAReceber)} a receber`)
      onClose()
    }, LATENCIA_MS)
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div data-modal-body className={MODAL_BODY}>
        <div className="flex flex-col gap-0.75 rounded-tile border border-line bg-surface-muted px-3.5 py-2.75">
          <p className="text-sub font-medium text-ink">
            {vendedora.nome} · {remessa.id}
          </p>
          <p className="text-caption text-muted">
            {formatPecas(totalPendentes)} com a vendedora · {describePrazo(remessa.prazoAcerto, state.hoje)}
          </p>
        </div>

        {pecasBaixadas > 0 && (
          <div className="flex flex-col gap-0.75 rounded-tile border border-info bg-info-tint px-3.5 py-2.75">
            <p className="text-sub font-medium text-info">
              {formatPecas(pecasBaixadas)} já vendidas pela {vendedora.nome.split(' ')[0]} · {formatCurrency(valorBaixado)}
            </p>
            <p className="text-caption text-ink-detail">Ela registrou essas vendas na hora; elas entram neste acerto automaticamente.</p>
          </div>
        )}

        {itens.length > 0 && (
          <>
            <p className="font-label text-label font-semibold text-muted uppercase">Vendidas sem registro, por item</p>
            <ul className="flex flex-col gap-2">
              {itens.map((item, i) => {
                const produto = getProduto(state.produtos, item.produtoId)
                const maximo = pendentes(item)
                const id = `acerto-item-${i}`
                return (
                  <li key={id} className="flex items-center gap-3 rounded-tile border border-line px-3.5 py-2">
                    <label htmlFor={id} className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-sub font-medium text-ink">{produto?.nome ?? item.produtoId}</span>
                      <span className="flex items-center gap-1.5 truncate text-caption text-muted tabular-nums">
                        <AmostraCor cor={item.cor} tamanho="sm" />
                        {item.tamanho} · {item.cor} · {maximo} com ela · devolve {maximo - vendidas[i]}
                      </span>
                    </label>
                    <input
                      id={id}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={maximo}
                      value={vendidas[i]}
                      onChange={(event) => alterar(i, event.target.value, maximo)}
                      onFocus={(event) => event.target.select()}
                      className={`${fieldClasses()} ${NUMBER_RESET} w-18! shrink-0 text-right tabular-nums`}
                    />
                  </li>
                )
              })}
            </ul>
          </>
        )}

        <Field label="Repasse da vendedora" htmlFor="acerto-forma">
          <Select id="acerto-forma" value={forma} onChange={(event) => setForma(event.target.value as FormaPagamento)}>
            {FORMAS.map((opcao) => (
              <option key={opcao} value={opcao}>
                {FORMA_ACERTO_LABEL[opcao]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className={MODAL_FOOTER}>
        <p className="text-button leading-4 text-muted tabular-nums">
          {formatPecas(totalVendidas)} · {formatCurrency(valores.valorBruto)} − {formatCurrency(valores.comissao)} de comissão ={' '}
          <span className="font-semibold text-ink">{formatCurrency(valores.valorAReceber)}</span>
        </p>
        <div className="flex gap-2.5">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Confirmar acerto'}
          </Button>
        </div>
      </div>
    </form>
  )
}
