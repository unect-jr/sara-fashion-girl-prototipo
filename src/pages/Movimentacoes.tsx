import { useMemo, useState } from 'react'
import ListaMovimentacoes from '../components/movimentacoes/ListaMovimentacoes'
import PageHeader from '../components/PageHeader'
import BarraFiltros, { CampoBusca } from '../components/ui/BarraFiltros'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Select from '../components/ui/Select'
import { TIPO_MOVIMENTACAO_LABEL } from '../data/catalogo'
import type { TipoMovimentacao } from '../data/types'
import { addDays } from '../lib/date'
import { formatNumber } from '../lib/format'
import { ordenarMovimentacoes } from '../store/consultas'
import { getProduto } from '../store/selectors'
import { useAppStore } from '../store/useAppStore'

type Periodo = '7' | '30' | '90' | ''

interface Filtros {
  busca: string
  tipo: TipoMovimentacao | ''
  periodo: Periodo
  usuarioId: string
}

const INICIAIS: Filtros = { busca: '', tipo: '', periodo: '30', usuarioId: '' }
const TIPOS = Object.keys(TIPO_MOVIMENTACAO_LABEL) as TipoMovimentacao[]

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

// Histórico geral de entradas, saídas e ajustes para rastrear divergências (HU 2.6)
export default function Movimentacoes() {
  const { state } = useAppStore()
  const [filtros, setFiltros] = useState<Filtros>(INICIAIS)
  const set = <K extends keyof Filtros>(chave: K, valor: Filtros[K]) => setFiltros((atual) => ({ ...atual, [chave]: valor }))

  const filtradas = useMemo(() => {
    const busca = normalizar(filtros.busca.trim())
    const inicio = filtros.periodo ? addDays(state.hoje, -Number(filtros.periodo)) : ''
    return ordenarMovimentacoes(
      state.movimentacoes.filter((m) => {
        const produto = getProduto(state.produtos, m.produtoId)
        const texto = normalizar(`${produto?.nome ?? ''} ${produto?.sku ?? ''} ${m.referencia ?? ''} ${m.cor}`)
        return (
          (!busca || texto.includes(busca)) &&
          (!filtros.tipo || m.tipo === filtros.tipo) &&
          (!inicio || m.data > inicio) &&
          (!filtros.usuarioId || m.usuarioId === filtros.usuarioId)
        )
      }),
    )
  }, [state.movimentacoes, state.produtos, state.hoje, filtros])

  const entraram = filtradas.filter((m) => m.quantidade > 0 && m.tipo !== 'cancelamento').reduce((t, m) => t + m.quantidade, 0)
  const sairam = filtradas.filter((m) => m.quantidade < 0 && m.tipo !== 'venda').reduce((t, m) => t - m.quantidade, 0)

  return (
    <>
      <PageHeader
        title="Movimentações"
        subtitle={`${formatNumber(filtradas.length)} registros · ${formatNumber(entraram)} peças entraram no central e ${formatNumber(sairam)} saíram`}
      />

      <div className="-mt-1 flex flex-col gap-5">
        <BarraFiltros contagem={`${formatNumber(filtradas.length)} ${filtradas.length === 1 ? 'registro' : 'registros'}`}>
          <CampoBusca valor={filtros.busca} onChange={(valor) => set('busca', valor)} placeholder="Buscar peça, SKU, NF ou documento" rotulo="Buscar movimentação" className="sm:w-72" />
          <Select size="sm" aria-label="Tipo" value={filtros.tipo} onChange={(event) => set('tipo', event.target.value as TipoMovimentacao | '')} className="w-40">
            <option value="">Todos os tipos</option>
            {TIPOS.map((tipo) => (
              <option key={tipo} value={tipo}>
                {TIPO_MOVIMENTACAO_LABEL[tipo]}
              </option>
            ))}
          </Select>
          <Select size="sm" aria-label="Período" value={filtros.periodo} onChange={(event) => set('periodo', event.target.value as Periodo)} className="w-40">
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="">Todo o período</option>
          </Select>
          <Select size="sm" aria-label="Usuário" value={filtros.usuarioId} onChange={(event) => set('usuarioId', event.target.value)} className="w-40">
            <option value="">Todos os usuários</option>
            {state.usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nome}
              </option>
            ))}
          </Select>
        </BarraFiltros>

        <Card>
          <ListaMovimentacoes
            movimentacoes={filtradas}
            vazio={{ title: 'Nenhuma movimentação encontrada', description: 'Mude o período, o tipo ou limpe a busca para ver outros registros.' }}
          />
          {filtradas.length === 0 && (
            <div className="-mt-6 flex justify-center pb-8">
              <Button onClick={() => setFiltros(INICIAIS)}>Limpar filtros</Button>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
