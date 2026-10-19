import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState, type FormEvent } from 'react'
import fechar from '../../assets/icons/fechar.svg'
import mais from '../../assets/icons/mais.svg'
import { FORNECEDORES, TAMANHOS_GRADE } from '../../data/catalogo'
import type { Produto } from '../../data/types'
import { formatCurrency, formatPecas } from '../../lib/format'
import { descreverGrade, gradeVazia, totalGrade, type Grade } from '../../lib/grade'
import { EASE_OUT } from '../../lib/motion'
import { getProduto } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import Button from '../ui/Button'
import Field from '../ui/Field'
import { fieldClasses, fieldErrorId } from '../ui/fieldStyles'
import Modal from '../ui/Modal'
import { MODAL_BODY, MODAL_FOOTER } from '../ui/modalStyles'
import Select from '../ui/Select'
import GradeInputs from './GradeInputs'

interface ModalEntradaMercadoriaProps {
  open: boolean
  onClose: () => void
  // Produto já escolhido ao abrir pelo card
  produtoInicialId?: string
  onSuccess: (mensagem: string) => void
}

interface PecaEntrada {
  key: number
  produtoId: string
  cor: string
  grade: Grade
}

interface Erros {
  notaFiscal?: string
  pecas?: string
  editor?: string
}

// Latência simulada para o estado "Salvando…"
const LATENCIA_MS = 600

function coresDoProduto(produto: Produto | undefined): string[] {
  return [...new Set(produto?.variacoes.map((variacao) => variacao.cor) ?? [])]
}

export default function ModalEntradaMercadoria({ open, onClose, produtoInicialId, onSuccess }: ModalEntradaMercadoriaProps) {
  return (
    <Modal open={open} onClose={onClose} title="Entrada de mercadoria" subtitle="As peças entram no estoque central">
      <EntradaForm onClose={onClose} produtoInicialId={produtoInicialId} onSuccess={onSuccess} />
    </Modal>
  )
}

// Montado a cada abertura do modal: o estado do formulário começa limpo
function EntradaForm({ onClose, produtoInicialId, onSuccess }: Omit<ModalEntradaMercadoriaProps, 'open'>) {
  const { state, dispatch } = useAppStore()
  const produtoPadrao = produtoInicialId ?? state.produtos[0]?.id ?? ''

  const [fornecedor, setFornecedor] = useState(FORNECEDORES[0])
  const [notaFiscal, setNotaFiscal] = useState('')
  const [data, setData] = useState(state.hoje)
  const [volumes, setVolumes] = useState('')
  const [pecas, setPecas] = useState<PecaEntrada[]>([])
  const [editorAberto, setEditorAberto] = useState(true)
  const [editorProduto, setEditorProduto] = useState(produtoPadrao)
  const [editorCor, setEditorCor] = useState(coresDoProduto(getProduto(state.produtos, produtoPadrao))[0] ?? '')
  const [editorGrade, setEditorGrade] = useState<Grade>(gradeVazia)
  const [erros, setErros] = useState<Erros>({})
  const [salvando, setSalvando] = useState(false)

  const coresEditor = coresDoProduto(getProduto(state.produtos, editorProduto))

  const totais = useMemo(
    () =>
      pecas.reduce(
        (acc, peca) => {
          const quantidade = totalGrade(peca.grade)
          const custo = getProduto(state.produtos, peca.produtoId)?.custo ?? 0
          return { pecas: acc.pecas + quantidade, custo: acc.custo + quantidade * custo }
        },
        { pecas: 0, custo: 0 },
      ),
    [pecas, state.produtos],
  )

  function trocarProdutoEditor(produtoId: string) {
    setEditorProduto(produtoId)
    setEditorCor(coresDoProduto(getProduto(state.produtos, produtoId))[0] ?? '')
  }

  function pecaDoEditor(): PecaEntrada | null {
    if (!editorAberto || totalGrade(editorGrade) === 0 || !editorProduto) return null
    return { key: Date.now(), produtoId: editorProduto, cor: editorCor, grade: editorGrade }
  }

  function adicionarPeca() {
    const peca = pecaDoEditor()
    if (!peca) {
      setErros((atual) => ({ ...atual, editor: 'Informe ao menos uma peça na grade' }))
      return
    }
    setPecas((atual) => [...atual, peca])
    setEditorGrade(gradeVazia())
    setEditorAberto(false)
    setErros({})
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (salvando) return

    // Grade preenchida no editor e não adicionada também entra
    const pendente = pecaDoEditor()
    const todas = pendente ? [...pecas, pendente] : pecas
    const novosErros: Erros = {
      notaFiscal: notaFiscal.trim() ? undefined : 'Informe o número da nota fiscal',
      pecas: todas.length > 0 ? undefined : 'Adicione ao menos uma peça à entrada',
    }
    setErros(novosErros)
    if (novosErros.notaFiscal || novosErros.pecas) return

    setSalvando(true)
    window.setTimeout(() => {
      for (const peca of todas) {
        dispatch({
          type: 'entradaMercadoria',
          produtoId: peca.produtoId,
          itens: TAMANHOS_GRADE.filter((tamanho) => peca.grade[tamanho] > 0).map((tamanho) => ({
            tamanho,
            cor: peca.cor,
            quantidade: peca.grade[tamanho],
          })),
        })
      }
      const total = todas.reduce((soma, peca) => soma + totalGrade(peca.grade), 0)
      onSuccess(`Entrada da NF ${notaFiscal.trim()} registrada · ${formatPecas(total)} no central`)
      onClose()
    }, LATENCIA_MS)
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div data-modal-body className={MODAL_BODY}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Field label="Fornecedor" htmlFor="entrada-fornecedor" className="flex-1">
            <Select id="entrada-fornecedor" value={fornecedor} onChange={(event) => setFornecedor(event.target.value)}>
              {FORNECEDORES.map((nome) => (
                <option key={nome}>{nome}</option>
              ))}
            </Select>
          </Field>
          <Field label="Nota fiscal" htmlFor="entrada-nf" error={erros.notaFiscal} className="sm:w-40">
            <input
              id="entrada-nf"
              data-autofocus
              inputMode="numeric"
              placeholder="00.000"
              value={notaFiscal}
              onChange={(event) => setNotaFiscal(event.target.value)}
              aria-invalid={erros.notaFiscal ? true : undefined}
              aria-describedby={erros.notaFiscal ? fieldErrorId('entrada-nf') : undefined}
              className={fieldClasses()}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Field label="Data da entrada" htmlFor="entrada-data" className="flex-1">
            <input
              id="entrada-data"
              type="date"
              value={data}
              max={state.hoje}
              onChange={(event) => setData(event.target.value)}
              className={fieldClasses()}
            />
          </Field>
          <Field label="Volumes recebidos" htmlFor="entrada-volumes" className="flex-1">
            <input
              id="entrada-volumes"
              placeholder="Ex.: 3 caixas"
              value={volumes}
              onChange={(event) => setVolumes(event.target.value)}
              className={fieldClasses()}
            />
          </Field>
        </div>

        <div aria-hidden className="h-px w-full shrink-0 bg-line" />
        <p className="font-label text-label font-semibold text-muted uppercase">Peças desta entrada</p>

        <AnimatePresence initial={false}>
          {pecas.map((peca) => {
            const produto = getProduto(state.produtos, peca.produtoId)
            const quantidade = totalGrade(peca.grade)
            return (
              <motion.div
                key={peca.key}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className="flex shrink-0 items-center gap-3 rounded-tile border border-line bg-surface-muted py-2.75 pr-2.5 pl-3.5"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.75">
                  <p className="truncate text-sub font-medium text-ink">
                    {produto?.nome} · {produto?.sku}
                  </p>
                  <p className="truncate text-caption leading-3.5 text-muted">
                    {peca.cor} · {descreverGrade(peca.grade)}
                  </p>
                </div>
                <p className="w-18 shrink-0 text-right text-sub font-medium text-ink tabular-nums">{formatPecas(quantidade)}</p>
                <p className="hidden w-25 shrink-0 text-right text-sub font-semibold text-ink tabular-nums sm:block">
                  {formatCurrency(quantidade * (produto?.custo ?? 0))}
                </p>
                <button
                  type="button"
                  onClick={() => setPecas((atual) => atual.filter((item) => item.key !== peca.key))}
                  aria-label={`Remover ${produto?.nome ?? 'peça'} da entrada`}
                  className="shrink-0 rounded-full p-2 transition-colors hover:bg-line focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <img src={fechar} alt="" width={11} height={11} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {editorAberto ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="flex shrink-0 flex-col gap-3 rounded-tile border border-line bg-surface-muted p-3.5"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <Field label="Peça" htmlFor="entrada-produto" className="flex-1">
                <Select id="entrada-produto" value={editorProduto} onChange={(event) => trocarProdutoEditor(event.target.value)}>
                  {state.produtos.map((produto) => (
                    <option key={produto.id} value={produto.id}>
                      {produto.nome} · {produto.sku}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Cor" htmlFor="entrada-cor" className="sm:w-40">
                <Select id="entrada-cor" value={editorCor} onChange={(event) => setEditorCor(event.target.value)}>
                  {coresEditor.map((cor) => (
                    <option key={cor}>{cor}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <GradeInputs
              idPrefix="entrada-grade"
              value={editorGrade}
              onChange={(grade) => {
                setEditorGrade(grade)
                if (erros.editor) setErros((atual) => ({ ...atual, editor: undefined }))
              }}
              invalid={Boolean(erros.editor)}
              describedBy={erros.editor ? 'entrada-grade-erro' : undefined}
            />
            {erros.editor && (
              <p id="entrada-grade-erro" className="px-3.5 text-caption text-brand">
                {erros.editor}
              </p>
            )}
            <div className="flex justify-end gap-2">
              {pecas.length > 0 && (
                <Button size="xs" onClick={() => setEditorAberto(false)}>
                  Cancelar
                </Button>
              )}
              <Button size="xs" variant="primary" onClick={adicionarPeca}>
                Adicionar à entrada
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            type="button"
            whileTap={{ scale: 0.99 }}
            onClick={() => {
              setEditorAberto(true)
              setErros({})
            }}
            className="flex shrink-0 items-center justify-center gap-2.25 rounded-tile border border-dashed border-line-strong px-3.5 py-3 text-button leading-4 font-medium text-info transition-colors hover:bg-info-tint focus-visible:outline-2 focus-visible:outline-brand"
          >
            <img src={mais} alt="" width={11} height={11} />
            Adicionar peça à entrada
          </motion.button>
        )}

        {erros.pecas && <p className="px-3.5 text-caption text-brand">{erros.pecas}</p>}
      </div>

      <div className={MODAL_FOOTER}>
        <p className="text-button leading-4 text-muted tabular-nums">
          {formatPecas(totais.pecas)} · {formatCurrency(totais.custo)} em custo
        </p>
        <div className="flex gap-2.5">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Confirmar entrada'}
          </Button>
        </div>
      </div>
    </form>
  )
}
