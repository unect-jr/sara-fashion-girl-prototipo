import { useCallback, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import BarraFiltros, { CampoBusca } from '../components/ui/BarraFiltros'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Select from '../components/ui/Select'
import Toast, { type ToastMessage } from '../components/ui/Toast'
import ModalCancelarVenda from '../components/vendas/ModalCancelarVenda'
import ModalVenda from '../components/vendas/ModalVenda'
import VendaLinha from '../components/vendas/VendaLinha'
import { addDays } from '../lib/date'
import { formatCurrency, formatNumber, formatPecas } from '../lib/format'
import { totaisVendas } from '../store/consultas'
import { useAppStore } from '../store/useAppStore'

type Periodo = 'hoje' | '7' | '30' | 'mes' | ''

interface Filtros {
  busca: string
  periodo: Periodo
  vendedoraId: string
  produtoId: string
  situacao: '' | 'ativas' | 'canceladas'
}

type ModalAberto = { tipo: 'nova' } | { tipo: 'corrigir'; vendaId: string } | { tipo: 'cancelar'; vendaId: string } | null

const INICIAIS: Filtros = { busca: '', periodo: '30', vendedoraId: '', produtoId: '', situacao: '' }
const ROTULO_PERIODO: Record<Periodo, string> = { hoje: 'hoje', '7': 'nos últimos 7 dias', '30': 'nos últimos 30 dias', mes: 'neste mês', '': 'no total' }
const POR_PAGINA = 30

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

// Histórico de vendas com filtros por período, vendedora e produto (HU 3.3), cancelar e corrigir (HU 3.4)
export default function Vendas() {
  const { state } = useAppStore()
  const [filtros, setFiltros] = useState<Filtros>(INICIAIS)
  const [modal, setModal] = useState<ModalAberto>(null)
  const [limite, setLimite] = useState(POR_PAGINA)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const set = <K extends keyof Filtros>(chave: K, valor: Filtros[K]) => {
    setFiltros((atual) => ({ ...atual, [chave]: valor }))
    setLimite(POR_PAGINA)
  }

  const filtradas = useMemo(() => {
    const busca = normalizar(filtros.busca.trim())
    const inicio =
      filtros.periodo === 'hoje'
        ? state.hoje
        : filtros.periodo === 'mes'
          ? `${state.hoje.slice(0, 7)}-01`
          : filtros.periodo
            ? addDays(state.hoje, -Number(filtros.periodo) + 1)
            : ''
    return state.vendas
      .filter((venda) => {
        const vendedora = state.vendedoras.find((v) => v.id === venda.vendedoraId)
        return (
          (!busca || normalizar(`${venda.id} ${venda.cliente ?? ''} ${vendedora?.nome ?? ''}`).includes(busca)) &&
          (!inicio || venda.data >= inicio) &&
          (!filtros.vendedoraId || venda.vendedoraId === filtros.vendedoraId) &&
          (!filtros.produtoId || venda.itens.some((item) => item.produtoId === filtros.produtoId)) &&
          (!filtros.situacao || (filtros.situacao === 'canceladas') === Boolean(venda.cancelamento))
        )
      })
      .toSorted((a, b) => `${b.data} ${b.id}`.localeCompare(`${a.data} ${a.id}`))
  }, [state.vendas, state.vendedoras, state.hoje, filtros])

  const totais = totaisVendas(filtradas)
  const vendedoras = useMemo(() => state.vendedoras.toSorted((a, b) => a.nome.localeCompare(b.nome)), [state.vendedoras])
  const produtos = useMemo(() => state.produtos.toSorted((a, b) => a.nome.localeCompare(b.nome)), [state.produtos])

  const fechar = useCallback(() => setModal(null), [])
  const avisar = useCallback((text: string) => setToast({ id: Date.now(), text }), [])
  const limparToast = useCallback(() => setToast(null), [])

  return (
    <>
      <PageHeader
        title="Vendas"
        subtitle={`${formatNumber(totais.vendas)} ${totais.vendas === 1 ? 'venda' : 'vendas'} ${ROTULO_PERIODO[filtros.periodo]} · ${formatPecas(totais.pecas)} · ${formatCurrency(totais.valor)}`}
        actions={
          <Button size="xs" variant="primary" onClick={() => setModal({ tipo: 'nova' })}>
            Registrar venda
          </Button>
        }
      />

      <div className="-mt-1 flex flex-col gap-5">
        <BarraFiltros contagem={`${formatNumber(filtradas.length)} ${filtradas.length === 1 ? 'registro' : 'registros'}`}>
          <CampoBusca valor={filtros.busca} onChange={(valor) => set('busca', valor)} placeholder="Número, cliente ou vendedora" rotulo="Buscar venda" className="sm:w-60" />
          <Select size="sm" aria-label="Período" value={filtros.periodo} onChange={(event) => set('periodo', event.target.value as Periodo)} className="w-40">
            <option value="hoje">Hoje</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="mes">Este mês</option>
            <option value="">Todo o período</option>
          </Select>
          <Select size="sm" aria-label="Vendedora" value={filtros.vendedoraId} onChange={(event) => set('vendedoraId', event.target.value)} className="w-46">
            <option value="">Todas as vendedoras</option>
            {vendedoras.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
              </option>
            ))}
          </Select>
          <Select size="sm" aria-label="Produto" value={filtros.produtoId} onChange={(event) => set('produtoId', event.target.value)} className="w-46">
            <option value="">Todos os produtos</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Select>
          <Select size="sm" aria-label="Situação" value={filtros.situacao} onChange={(event) => set('situacao', event.target.value as Filtros['situacao'])} className="w-46">
            <option value="">Ativas e canceladas</option>
            <option value="ativas">Só ativas</option>
            <option value="canceladas">Só canceladas</option>
          </Select>
        </BarraFiltros>

        <Card>
          {filtradas.length === 0 ? (
            <EmptyState
              title="Nenhuma venda encontrada"
              description="Nenhuma venda bate com esses filtros. Mude o período ou limpe os filtros."
              action={<Button onClick={() => setFiltros(INICIAIS)}>Limpar filtros</Button>}
            />
          ) : (
            <ul>
              {filtradas.slice(0, limite).map((venda) => (
                <VendaLinha
                  key={venda.id}
                  venda={venda}
                  onCancelar={(vendaId) => setModal({ tipo: 'cancelar', vendaId })}
                  onCorrigir={(vendaId) => setModal({ tipo: 'corrigir', vendaId })}
                />
              ))}
            </ul>
          )}
          {filtradas.length > limite && (
            <div className="flex justify-center border-t border-line bg-surface-muted px-card-x py-3">
              <Button size="xs" onClick={() => setLimite((atual) => atual + POR_PAGINA)}>
                Mostrar mais vendas
              </Button>
            </div>
          )}
        </Card>
      </div>

      <ModalVenda open={modal?.tipo === 'nova'} onClose={fechar} onSuccess={avisar} />
      <ModalVenda
        key={modal?.tipo === 'corrigir' ? modal.vendaId : 'corrigir'}
        open={modal?.tipo === 'corrigir'}
        corrigirVendaId={modal?.tipo === 'corrigir' ? modal.vendaId : undefined}
        onClose={fechar}
        onSuccess={avisar}
      />
      <ModalCancelarVenda vendaId={modal?.tipo === 'cancelar' ? modal.vendaId : null} onClose={fechar} onSuccess={avisar} />
      <Toast toast={toast} onDismiss={limparToast} />
    </>
  )
}
