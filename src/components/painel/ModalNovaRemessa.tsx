import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState, type FormEvent } from 'react'
import fechar from '../../assets/icons/fechar.svg'
import mais from '../../assets/icons/mais.svg'
import type { Tamanho } from '../../data/types'
import { addDays } from '../../lib/date'
import { formatCurrency, formatPecas } from '../../lib/format'
import { EASE_OUT } from '../../lib/motion'
import { proximoIdRemessa } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import Button from '../ui/Button'
import Field from '../ui/Field'
import { fieldClasses, NUMBER_RESET } from '../ui/fieldStyles'
import Modal from '../ui/Modal'
import { MODAL_BODY, MODAL_FOOTER } from '../ui/modalStyles'
import Select from '../ui/Select'

interface ModalNovaRemessaProps {
  open: boolean
  // Já abre com a vendedora escolhida (tela de Vendedoras)
  vendedoraInicialId?: string
  onClose: () => void
  onSuccess: (mensagem: string) => void
}

interface Opcao {
  chave: string
  produtoId: string
  tamanho: Tamanho
  cor: string
  disponivel: number
  preco: number
  label: string
}

interface Linha {
  key: number
  chave: string
  quantidade: number
}

const PRAZO_PADRAO_DIAS = 30
const LATENCIA_MS = 600

export default function ModalNovaRemessa({ open, vendedoraInicialId, onClose, onSuccess }: ModalNovaRemessaProps) {
  return (
    <Modal open={open} onClose={onClose} title="Nova remessa" subtitle="As peças saem do central e vão para a vendedora">
      <RemessaForm vendedoraInicialId={vendedoraInicialId} onClose={onClose} onSuccess={onSuccess} />
    </Modal>
  )
}

function RemessaForm({ vendedoraInicialId, onClose, onSuccess }: Omit<ModalNovaRemessaProps, 'open'>) {
  const { state, dispatch } = useAppStore()
  const vendedoras = state.vendedoras.filter((v) => v.ativa)

  // Só variações com estoque no central podem sair
  const opcoes = useMemo<Opcao[]>(
    () =>
      state.produtos.flatMap((produto) =>
        produto.variacoes
          .filter((variacao) => variacao.quantidadeCentral > 0)
          .map((variacao) => ({
            chave: `${produto.id}|${variacao.tamanho}|${variacao.cor}`,
            produtoId: produto.id,
            tamanho: variacao.tamanho,
            cor: variacao.cor,
            disponivel: variacao.quantidadeCentral,
            preco: produto.preco,
            label: `${produto.nome} · ${variacao.tamanho} · ${variacao.cor} (${variacao.quantidadeCentral})`,
          })),
      ),
    [state.produtos],
  )

  const [vendedoraId, setVendedoraId] = useState(vendedoraInicialId ?? vendedoras[0]?.id ?? '')
  const [prazo, setPrazo] = useState(addDays(state.hoje, PRAZO_PADRAO_DIAS))
  const [linhas, setLinhas] = useState<Linha[]>(() => (opcoes[0] ? [{ key: 1, chave: opcoes[0].chave, quantidade: 1 }] : []))
  const [erro, setErro] = useState<string>()
  const [salvando, setSalvando] = useState(false)

  const opcao = (chave: string) => opcoes.find((o) => o.chave === chave)
  const totalPecas = linhas.reduce((total, linha) => total + linha.quantidade, 0)
  const totalValor = linhas.reduce((total, linha) => total + linha.quantidade * (opcao(linha.chave)?.preco ?? 0), 0)

  function atualizar(key: number, parcial: Partial<Linha>) {
    setErro(undefined)
    setLinhas((atual) => atual.map((linha) => (linha.key === key ? { ...linha, ...parcial } : linha)))
  }

  function adicionar() {
    // Sugere a primeira variação ainda não usada
    const livre = opcoes.find((o) => !linhas.some((linha) => linha.chave === o.chave))
    if (!livre) return
    setLinhas((atual) => [...atual, { key: Date.now(), chave: livre.chave, quantidade: 1 }])
  }

  function validar(): string | undefined {
    if (!vendedoraId) return 'Escolha a vendedora'
    if (prazo <= state.hoje) return 'O prazo de acerto precisa ser depois de hoje'
    if (linhas.length === 0) return 'Adicione ao menos uma peça'
    const chaves = linhas.map((linha) => linha.chave)
    if (new Set(chaves).size !== chaves.length) return 'A mesma variação aparece duas vezes'
    for (const linha of linhas) {
      const o = opcao(linha.chave)
      if (!o || linha.quantidade <= 0) return 'Informe uma quantidade maior que zero'
      if (linha.quantidade > o.disponivel) return `Só há ${o.disponivel} de ${o.label.split(' (')[0]} no central`
    }
    return undefined
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (salvando) return
    const mensagem = validar()
    setErro(mensagem)
    if (mensagem) return

    const id = proximoIdRemessa(state.remessas)
    setSalvando(true)
    window.setTimeout(() => {
      dispatch({
        type: 'criarRemessa',
        remessa: {
          id,
          vendedoraId,
          dataSaida: state.hoje,
          prazoAcerto: prazo,
          itens: linhas.flatMap((linha) => {
            const o = opcao(linha.chave)
            return o ? [{ produtoId: o.produtoId, tamanho: o.tamanho, cor: o.cor, quantidade: linha.quantidade }] : []
          }),
        },
      })
      const nome = state.vendedoras.find((v) => v.id === vendedoraId)?.nome ?? 'vendedora'
      onSuccess(`Remessa ${id} criada · ${formatPecas(totalPecas)} com ${nome}`)
      onClose()
    }, LATENCIA_MS)
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div data-modal-body className={MODAL_BODY}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Field label="Vendedora" htmlFor="remessa-vendedora" className="flex-1">
            <Select id="remessa-vendedora" value={vendedoraId} onChange={(event) => setVendedoraId(event.target.value)}>
              {vendedoras.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome} · {v.regiao}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Prazo de acerto" htmlFor="remessa-prazo" className="sm:w-44">
            <input
              id="remessa-prazo"
              type="date"
              value={prazo}
              min={addDays(state.hoje, 1)}
              onChange={(event) => setPrazo(event.target.value)}
              className={fieldClasses()}
            />
          </Field>
        </div>

        <div aria-hidden className="h-px w-full shrink-0 bg-line" />
        <p className="font-label text-label font-semibold text-muted uppercase">Peças da remessa</p>

        {opcoes.length === 0 ? (
          <p className="text-sub text-muted">O estoque central está vazio. Dê entrada de mercadoria primeiro.</p>
        ) : (
          <AnimatePresence initial={false}>
            {linhas.map((linha, index) => (
              <motion.div
                key={linha.key}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className="flex shrink-0 items-center gap-2"
              >
                <Select
                  aria-label={`Peça ${index + 1}`}
                  value={linha.chave}
                  onChange={(event) => atualizar(linha.key, { chave: event.target.value })}
                  className="flex-1"
                >
                  {opcoes.map((o) => (
                    <option key={o.chave} value={o.chave}>
                      {o.label}
                    </option>
                  ))}
                </Select>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  aria-label={`Quantidade da peça ${index + 1}`}
                  value={linha.quantidade}
                  onChange={(event) => atualizar(linha.key, { quantidade: Math.max(Number.parseInt(event.target.value, 10) || 0, 0) })}
                  onFocus={(event) => event.target.select()}
                  className={`${fieldClasses()} ${NUMBER_RESET} w-18 shrink-0 text-right tabular-nums`}
                />
                <button
                  type="button"
                  onClick={() => setLinhas((atual) => atual.filter((item) => item.key !== linha.key))}
                  aria-label={`Remover peça ${index + 1}`}
                  className="shrink-0 rounded-full p-2 transition-colors hover:bg-line focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <img src={fechar} alt="" width={11} height={11} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {opcoes.length > linhas.length && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.99 }}
            onClick={adicionar}
            className="flex shrink-0 items-center justify-center gap-2.25 rounded-tile border border-dashed border-line-strong px-3.5 py-3 text-button leading-4 font-medium text-info transition-colors hover:bg-info-tint focus-visible:outline-2 focus-visible:outline-brand"
          >
            <img src={mais} alt="" width={11} height={11} />
            Adicionar peça à remessa
          </motion.button>
        )}

        {erro && (
          <p role="alert" className="px-3.5 text-caption text-brand">
            {erro}
          </p>
        )}
      </div>

      <div className={MODAL_FOOTER}>
        <p className="text-button leading-4 text-muted tabular-nums">
          {formatPecas(totalPecas)} · {formatCurrency(totalValor)} consignados
        </p>
        <div className="flex gap-2.5">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={salvando || opcoes.length === 0}>
            {salvando ? 'Salvando…' : 'Criar remessa'}
          </Button>
        </div>
      </div>
    </form>
  )
}
