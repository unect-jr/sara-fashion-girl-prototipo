import { AnimatePresence, motion } from 'motion/react'
import { useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
import mais from '../../assets/icons/mais.svg'
import { useCarimbo } from '../../auth/useCarimbo'
import { CATEGORIA_LABEL, CATEGORIAS, CORES_AMOSTRA, TAMANHOS_GRADE } from '../../data/catalogo'
import type { Categoria, Produto } from '../../data/types'
import { formatCurrency, formatPecas } from '../../lib/format'
import { gradeVazia, parseMoeda, totalGrade, type Grade } from '../../lib/grade'
import { reduzirImagem } from '../../lib/imagem'
import { EASE_OUT } from '../../lib/motion'
import { getProduto, proximoIdProduto, proximoSku } from '../../store/selectors'
import { useAppStore } from '../../store/useAppStore'
import AmostraCor from '../ui/AmostraCor'
import Button from '../ui/Button'
import Field from '../ui/Field'
import { fieldClasses, fieldErrorId } from '../ui/fieldStyles'
import Modal from '../ui/Modal'
import { MODAL_BODY, MODAL_FOOTER } from '../ui/modalStyles'
import Select from '../ui/Select'
import GradeInputs from './GradeInputs'

interface ModalNovoProdutoProps {
  open: boolean
  // Com produto: modo edição (HU 2.2)
  produtoId?: string
  onClose: () => void
  onSuccess: (mensagem: string) => void
}

interface Erros {
  nome?: string
  custo?: string
  preco?: string
  cores?: string
  imagem?: string
}

const LATENCIA_MS = 600
const TAMANHO_MAXIMO_MB = 8

export default function ModalNovoProduto({ open, produtoId, onClose, onSuccess }: ModalNovoProdutoProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={produtoId ? 'Editar produto' : 'Novo produto'}
      subtitle={produtoId ? 'O SKU continua o mesmo' : 'O SKU é gerado quando você salvar'}
    >
      <ProdutoForm produtoId={produtoId} onClose={onClose} onSuccess={onSuccess} />
    </Modal>
  )
}

// Campo de moeda: aceita "62,00" e formata como R$ ao sair do campo
function formatarAoSair(texto: string): string {
  const valor = parseMoeda(texto)
  return valor > 0 ? formatCurrency(valor) : texto
}

function ProdutoForm({ produtoId, onClose, onSuccess }: Omit<ModalNovoProdutoProps, 'open'>) {
  const { state, dispatch } = useAppStore()
  const carimbar = useCarimbo()
  const existente = produtoId ? getProduto(state.produtos, produtoId) : undefined
  const coresExistentes = existente ? [...new Set(existente.variacoes.map((variacao) => variacao.cor))] : []

  const [nome, setNome] = useState(existente?.nome ?? '')
  const [categoria, setCategoria] = useState<Categoria>(existente?.categoria ?? 'blusa')
  const [custo, setCusto] = useState(existente ? formatCurrency(existente.custo) : '')
  const [preco, setPreco] = useState(existente ? formatCurrency(existente.preco) : '')
  const [imagem, setImagem] = useState(existente?.imagem)
  // Cores novas; no cadastro cada uma tem a sua grade (saldo por cor e tamanho)
  const [cores, setCores] = useState<string[]>([])
  const [grades, setGrades] = useState<Record<string, Grade>>({})
  const [novaCor, setNovaCor] = useState<string | null>(null)
  const [erros, setErros] = useState<Erros>({})
  const [lendoImagem, setLendoImagem] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const pecas = cores.reduce((total, cor) => total + totalGrade(grades[cor] ?? gradeVazia()), 0)

  function confirmarCor() {
    const cor = novaCor?.trim()
    const repetida = [...coresExistentes, ...cores].some((atual) => atual.toLowerCase() === cor?.toLowerCase())
    if (cor && !repetida) {
      setCores((atual) => [...atual, cor])
      setGrades((atual) => ({ ...atual, [cor]: gradeVazia() }))
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

  async function escolherImagem(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0]
    event.target.value = ''
    if (!arquivo) return
    if (!arquivo.type.startsWith('image/')) {
      setErros((atual) => ({ ...atual, imagem: 'Escolha um arquivo de imagem (JPG, PNG ou WEBP)' }))
      return
    }
    if (arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
      setErros((atual) => ({ ...atual, imagem: `A foto pode ter até ${TAMANHO_MAXIMO_MB} MB` }))
      return
    }
    setLendoImagem(true)
    try {
      setImagem(await reduzirImagem(arquivo))
      setErros((atual) => ({ ...atual, imagem: undefined }))
    } catch {
      setErros((atual) => ({ ...atual, imagem: 'Não foi possível abrir essa foto. Tente outra.' }))
    } finally {
      setLendoImagem(false)
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (salvando || lendoImagem) return

    const valorCusto = parseMoeda(custo)
    const valorPreco = parseMoeda(preco)
    const novosErros: Erros = {
      nome: nome.trim() ? undefined : 'Informe o nome do modelo',
      custo: valorCusto > 0 ? undefined : 'Informe o preço de custo',
      preco: valorPreco <= 0 ? 'Informe o preço de venda' : valorPreco <= valorCusto ? 'Precisa ser maior que o custo' : undefined,
      cores: existente || cores.length > 0 ? undefined : 'Adicione ao menos uma cor',
    }
    setErros(novosErros)
    if (Object.values(novosErros).some(Boolean)) return

    setSalvando(true)
    window.setTimeout(() => {
      if (existente) {
        dispatch({
          type: 'editarProduto',
          produtoId: existente.id,
          dados: { nome: nome.trim(), categoria, custo: valorCusto, preco: valorPreco, imagem, coresNovas: cores },
        })
        onSuccess(`${nome.trim()} atualizado`)
      } else {
        const sku = proximoSku(state.produtos, categoria)
        const produto: Produto = {
          id: proximoIdProduto(state.produtos),
          sku,
          nome: nome.trim(),
          categoria,
          preco: valorPreco,
          custo: valorCusto,
          imagem,
          variacoes: cores.flatMap((cor) => TAMANHOS_GRADE.map((tamanho) => ({ tamanho, cor, quantidadeCentral: grades[cor]?.[tamanho] ?? 0 }))),
        }
        dispatch({ type: 'novoProduto', produto, carimbo: carimbar() })
        onSuccess(`${produto.nome} cadastrado · SKU ${sku}`)
      }
      onClose()
    }, LATENCIA_MS)
  }

  const erroProps = (campo: keyof Erros, id: string) => (erros[campo] ? { 'aria-invalid': true, 'aria-describedby': fieldErrorId(id) } : {})

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
              value={existente?.sku ?? ''}
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

        {/* Foto do produto (HU 2.1) */}
        <div className="flex flex-col gap-1.5">
          <p className="font-label text-label font-semibold text-muted uppercase">Foto</p>
          <div className="flex items-center gap-3.5 rounded-tile border border-dashed border-line-strong p-2.5">
            <div className="flex size-18 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-surface-muted">
              {imagem ? (
                <img src={imagem} alt="Foto do produto" className="size-full object-cover" />
              ) : (
                <span aria-hidden className="text-metric font-semibold text-track">
                  {nome.trim().charAt(0).toUpperCase() || '?'}
                </span>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="text-caption text-muted">{lendoImagem ? 'Preparando a foto…' : 'JPG, PNG ou WEBP de até 8 MB. A foto aparece no card do estoque.'}</p>
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-button leading-4 font-semibold text-ink-soft transition-colors focus-within:outline-2 focus-within:outline-brand hover:border-muted">
                  {imagem ? 'Trocar foto' : 'Escolher foto'}
                  <input type="file" accept="image/*" className="sr-only" onChange={escolherImagem} />
                </label>
                {imagem && (
                  <Button size="xs" onClick={() => setImagem(undefined)}>
                    Remover
                  </Button>
                )}
              </div>
            </div>
          </div>
          {erros.imagem && <p className="px-3.5 text-caption text-brand">{erros.imagem}</p>}
        </div>

        <div aria-hidden className="h-px w-full shrink-0 bg-line" />
        <p id="produto-cores" className="font-label text-label font-semibold text-muted uppercase">
          {existente ? 'Cores' : 'Cores e grade inicial no central'}
        </p>

        {existente && (
          <div className="flex flex-wrap gap-2">
            {coresExistentes.map((cor) => (
              <span key={cor} className="flex items-center gap-2 rounded-full border border-line bg-surface-muted py-1.75 pr-3.25 pl-2.75 text-button-sm leading-3.75 font-medium text-ink-soft">
                <AmostraCor cor={cor} />
                {cor}
              </span>
            ))}
          </div>
        )}

        <AnimatePresence initial={false}>
          {cores.map((cor) => (
            <motion.div
              key={cor}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="flex shrink-0 flex-col gap-2.5 rounded-tile border border-line bg-surface-muted p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sub font-medium text-ink">
                  <AmostraCor cor={cor} />
                  {cor}
                  {existente && <span className="text-caption font-normal text-muted">nova, entra zerada</span>}
                </span>
                <button
                  type="button"
                  onClick={() => setCores((atual) => atual.filter((item) => item !== cor))}
                  className="rounded-full px-2.5 py-1 text-caption font-medium text-muted transition-colors hover:bg-line hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
                >
                  Remover cor
                </button>
              </div>
              {!existente && (
                <GradeInputs
                  idPrefix={`produto-grade-${cor.replace(/\W+/g, '-')}`}
                  value={grades[cor] ?? gradeVazia()}
                  onChange={(grade) => setGrades((atual) => ({ ...atual, [cor]: grade }))}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <div role="group" aria-labelledby="produto-cores" className="flex flex-wrap items-center gap-2">
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
              .filter((cor) => !cores.includes(cor) && !coresExistentes.includes(cor))
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
        <p className="text-button leading-4 text-muted tabular-nums">
          {existente
            ? `${coresExistentes.length + cores.length} ${coresExistentes.length + cores.length === 1 ? 'cor' : 'cores'} · SKU ${existente.sku}`
            : `${formatPecas(pecas)} na grade inicial`}
        </p>
        <div className="flex gap-2.5">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={salvando || lendoImagem}>
            {salvando ? 'Salvando…' : existente ? 'Salvar alterações' : 'Salvar produto'}
          </Button>
        </div>
      </div>
    </form>
  )
}
