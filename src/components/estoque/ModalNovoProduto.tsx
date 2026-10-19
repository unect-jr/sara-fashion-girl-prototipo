import { AnimatePresence, motion } from 'motion/react'
import { useState, type FormEvent, type KeyboardEvent } from 'react'
import mais from '../../assets/icons/mais.svg'
import { CATEGORIA_LABEL, CATEGORIAS, CORES_AMOSTRA, TAMANHOS_GRADE } from '../../data/catalogo'
import type { Categoria, Produto } from '../../data/types'
import { formatCurrency, formatPecas } from '../../lib/format'
import { gradeVazia, parseMoeda, totalGrade, type Grade } from '../../lib/grade'
import { EASE_OUT } from '../../lib/motion'
import { proximoIdProduto, proximoSku } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import Button from '../ui/Button'
import Field from '../ui/Field'
import { fieldClasses, fieldErrorId } from '../ui/fieldStyles'
import Modal from '../ui/Modal'
import { MODAL_BODY, MODAL_FOOTER } from '../ui/modalStyles'
import Select from '../ui/Select'
import GradeInputs from './GradeInputs'

interface ModalNovoProdutoProps {
  open: boolean
  onClose: () => void
  onSuccess: (mensagem: string) => void
}

interface Erros {
  nome?: string
  custo?: string
  preco?: string
  cores?: string
}

const LATENCIA_MS = 600

export default function ModalNovoProduto({ open, onClose, onSuccess }: ModalNovoProdutoProps) {
  return (
    <Modal open={open} onClose={onClose} title="Novo produto" subtitle="O SKU é gerado quando você salvar">
      <NovoProdutoForm onClose={onClose} onSuccess={onSuccess} />
    </Modal>
  )
}

// Campo de moeda: aceita "62,00" e formata como R$ ao sair do campo
function formatarAoSair(texto: string): string {
  const valor = parseMoeda(texto)
  return valor > 0 ? formatCurrency(valor) : texto
}

function NovoProdutoForm({ onClose, onSuccess }: Omit<ModalNovoProdutoProps, 'open'>) {
  const { state, dispatch } = useAppStore()
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState<Categoria>('blusa')
  const [custo, setCusto] = useState('')
  const [preco, setPreco] = useState('')
  const [grade, setGrade] = useState<Grade>(gradeVazia)
  const [cores, setCores] = useState<string[]>([])
  const [novaCor, setNovaCor] = useState<string | null>(null)
  const [erros, setErros] = useState<Erros>({})
  const [salvando, setSalvando] = useState(false)

  const pecas = totalGrade(grade)

  function confirmarCor() {
    const cor = novaCor?.trim()
    if (cor && !cores.some((existente) => existente.toLowerCase() === cor.toLowerCase())) {
      setCores((atual) => [...atual, cor])
      setErros((atual) => ({ ...atual, cores: undefined }))
    }
    setNovaCor(null)
  }

  // Enter adiciona a cor sem enviar o formulário; Esc cancela sem fechar o modal
  function onCorKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      confirmarCor()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      setNovaCor(null)
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (salvando) return

    const valorCusto = parseMoeda(custo)
    const valorPreco = parseMoeda(preco)
    const novosErros: Erros = {
      nome: nome.trim() ? undefined : 'Informe o nome do modelo',
      custo: valorCusto > 0 ? undefined : 'Informe o preço de custo',
      preco:
        valorPreco <= 0 ? 'Informe o preço de venda' : valorPreco <= valorCusto ? 'Precisa ser maior que o custo' : undefined,
      cores: cores.length > 0 ? undefined : 'Adicione ao menos uma cor',
    }
    setErros(novosErros)
    if (Object.values(novosErros).some(Boolean)) return

    setSalvando(true)
    window.setTimeout(() => {
      const sku = proximoSku(state.produtos, categoria)
      // A grade inicial vai para a primeira cor; as demais entram zeradas
      const produto: Produto = {
        id: proximoIdProduto(state.produtos),
        sku,
        nome: nome.trim(),
        categoria,
        preco: valorPreco,
        custo: valorCusto,
        variacoes: cores.flatMap((cor, index) =>
          TAMANHOS_GRADE.map((tamanho) => ({ tamanho, cor, quantidadeCentral: index === 0 ? grade[tamanho] : 0 })),
        ),
      }
      dispatch({ type: 'novoProduto', produto })
      onSuccess(`${produto.nome} cadastrado · SKU ${sku}`)
      onClose()
    }, LATENCIA_MS)
  }

  const erroProps = (campo: keyof Erros, id: string) =>
    erros[campo] ? { 'aria-invalid': true, 'aria-describedby': fieldErrorId(id) } : {}

  return (
    <form noValidate onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div data-modal-body className={MODAL_BODY}>
        <Field label="Nome do modelo" htmlFor="produto-nome" error={erros.nome}>
          <input
            id="produto-nome"
            data-autofocus
            placeholder="Ex.: Tricot gola alta"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            className={fieldClasses()}
            {...erroProps('nome', 'produto-nome')}
          />
        </Field>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Field label="Categoria" htmlFor="produto-categoria" className="flex-1">
            <Select id="produto-categoria" value={categoria} onChange={(event) => setCategoria(event.target.value as Categoria)}>
              {CATEGORIAS.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {CATEGORIA_LABEL[opcao]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="SKU" htmlFor="produto-sku" className="sm:w-45">
            <input
              id="produto-sku"
              readOnly
              tabIndex={-1}
              value=""
              placeholder="gerado ao salvar"
              className={`${fieldClasses()} bg-surface-muted`}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Field label="Preço de custo" htmlFor="produto-custo" error={erros.custo} className="flex-1">
            <input
              id="produto-custo"
              inputMode="decimal"
              placeholder="R$ 0,00"
              value={custo}
              onChange={(event) => setCusto(event.target.value)}
              onBlur={() => setCusto(formatarAoSair(custo))}
              className={`${fieldClasses()} tabular-nums`}
              {...erroProps('custo', 'produto-custo')}
            />
          </Field>
          <Field label="Preço de venda" htmlFor="produto-preco" error={erros.preco} className="flex-1">
            <input
              id="produto-preco"
              inputMode="decimal"
              placeholder="R$ 0,00"
              value={preco}
              onChange={(event) => setPreco(event.target.value)}
              onBlur={() => setPreco(formatarAoSair(preco))}
              className={`${fieldClasses()} tabular-nums`}
              {...erroProps('preco', 'produto-preco')}
            />
          </Field>
        </div>

        <div aria-hidden className="h-px w-full shrink-0 bg-line" />
        <p className="font-label text-label font-semibold text-muted uppercase">Grade inicial no central</p>
        <GradeInputs idPrefix="produto-grade" value={grade} onChange={setGrade} />

        <p id="produto-cores" className="font-label text-label font-semibold text-muted uppercase">
          Cores
        </p>
        <div role="group" aria-labelledby="produto-cores" className="flex flex-wrap items-center gap-2">
          <AnimatePresence initial={false}>
            {cores.map((cor) => (
              <motion.button
                key={cor}
                type="button"
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18, ease: EASE_OUT }}
                onClick={() => setCores((atual) => atual.filter((item) => item !== cor))}
                aria-label={`Remover cor ${cor}`}
                title="Remover cor"
                className="flex items-center gap-2 rounded-full border border-line bg-surface-muted py-1.75 pr-3.25 pl-2.75 text-button-sm leading-3.75 font-medium text-ink-soft transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
              >
                <span
                  aria-hidden
                  className="size-3 rounded-full border border-line-strong"
                  style={{ backgroundColor: CORES_AMOSTRA[cor] ?? 'var(--color-line)' }}
                />
                {cor}
              </motion.button>
            ))}
          </AnimatePresence>

          {novaCor !== null ? (
            <input
              autoFocus
              list="produto-cores-sugestoes"
              aria-label="Nome da nova cor"
              placeholder="Nome da cor"
              value={novaCor}
              onChange={(event) => setNovaCor(event.target.value)}
              onKeyDown={onCorKeyDown}
              onBlur={confirmarCor}
              className="w-36 rounded-full border border-info bg-surface px-3.25 py-1.75 text-button-sm leading-3.75 font-medium text-ink ring-[0.5px] ring-info outline-none placeholder:font-normal placeholder:text-muted"
            />
          ) : (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setNovaCor('')}
              aria-describedby={erros.cores ? 'produto-cores-erro' : undefined}
              className={`flex items-center gap-1.75 rounded-full border border-dashed py-1.75 pr-3.25 pl-3 text-button-sm leading-3.75 font-medium text-info transition-colors hover:bg-info-tint focus-visible:outline-2 focus-visible:outline-brand ${erros.cores ? 'border-brand' : 'border-line-strong'}`}
            >
              <img src={mais} alt="" width={11} height={11} />
              Cor
            </motion.button>
          )}
          <datalist id="produto-cores-sugestoes">
            {Object.keys(CORES_AMOSTRA)
              .filter((cor) => !cores.includes(cor))
              .map((cor) => (
                <option key={cor} value={cor} />
              ))}
          </datalist>
        </div>
        {erros.cores && (
          <p id="produto-cores-erro" className="px-3.5 text-caption text-brand">
            {erros.cores}
          </p>
        )}
      </div>

      <div className={MODAL_FOOTER}>
        <p className="text-button leading-4 text-muted tabular-nums">{formatPecas(pecas)} na grade inicial</p>
        <div className="flex gap-2.5">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar produto'}
          </Button>
        </div>
      </div>
    </form>
  )
}
