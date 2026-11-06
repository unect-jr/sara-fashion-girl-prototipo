import { gerarParcelas } from '../lib/crediario'
import { addDays, diffDays, type ISODate } from '../lib/date'
import { roundCents } from '../lib/remessa'
import type { Acerto, Crediario, FormaPagamentoVenda, ItemVenda, Produto, Registro, Remessa, Tamanho, Usuario, Venda } from './types'

const CLIENTES = ['Ana Paula Reis', 'Bruna Lopes', 'Carla Mendes', 'Daniela Rocha', 'Eliane Duarte', 'Fernanda Lima', 'Gisele Martins', 'Helena Costa', 'Ingrid Souza', 'Jéssica Alves', 'Karina Neves', 'Larissa Pinto']

interface VendaManual {
  dias: number
  hora: string
  vendedoraId: string
  remessaId: string
  // Padrão: a própria vendedora lançou
  lancadoPorId?: string
  itens: [string, Tamanho, string, number][]
  forma: FormaPagamentoVenda
  cliente?: string
  // Dias até o 1º vencimento, a partir de hoje
  vencimento?: number
  parcelas?: number
  cancelada?: { dias: number; hora: string; motivo: string }
}

// Vendas ainda não acertadas: batem com os itens "baixada" de remessas.ts
const MANUAIS: VendaManual[] = [
  {
    dias: -6, hora: '15:40', vendedoraId: 'v5', remessaId: 'RM-0153', itens: [['p14', 'P', 'Branco', 1]], forma: 'avista',
    cancelada: { dias: -5, hora: '09:12', motivo: 'Cliente desistiu antes de levar a peça' },
  },
  { dias: -4, hora: '11:05', vendedoraId: 'v3', remessaId: 'RM-0149', itens: [['p24', 'P', 'Areia', 1]], forma: 'boleto', cliente: 'Simone Castro', vencimento: -1 },
  { dias: -3, hora: '16:20', vendedoraId: 'v2', remessaId: 'RM-0147', itens: [['p02', 'M', 'Preto', 1]], forma: 'pix', cliente: 'Aline Barros' },
  {
    dias: -2, hora: '10:30', vendedoraId: 'v4', remessaId: 'RM-0151', itens: [['p20', 'P', 'Preto', 1], ['p06', 'M', 'Branco', 1]],
    forma: 'pix-confianca', cliente: 'Renata Alves', vencimento: 3,
  },
  // Lançada pela Tati no lugar da Sueli
  { dias: -1, hora: '17:45', vendedoraId: 'v5', remessaId: 'RM-0153', lancadoPorId: 'u1', itens: [['p12', 'P', 'Nude', 1]], forma: 'avista' },
  { dias: 0, hora: '08:20', vendedoraId: 'v5', remessaId: 'RM-0153', itens: [['p08', 'M', 'Branco', 2]], forma: 'pix' },
  {
    dias: 0, hora: '08:45', vendedoraId: 'v2', remessaId: 'RM-0147', itens: [['p16', 'M', 'Jeans claro', 1]],
    forma: 'parcelado', parcelas: 3, cliente: 'Juliana Prado', vencimento: 30,
  },
]

interface Rascunho {
  venda: Omit<Venda, 'id'>
  credito?: { parcelas: number; vencimento: ISODate }
}

function precoDe(produtos: Produto[], produtoId: string): number {
  return produtos.find((produto) => produto.id === produtoId)?.preco ?? 0
}

function total(itens: ItemVenda[]): number {
  return roundCents(itens.reduce((soma, item) => soma + item.quantidade * item.preco, 0))
}

function hora(n: number): string {
  return `${String(9 + (n % 9)).padStart(2, '0')}:${String((n * 17) % 60).padStart(2, '0')}`
}

// Histórico: cada peça vendida das remessas já acertadas vira uma venda, espalhada entre a saída e o acerto
function historicas(produtos: Produto[], remessas: Remessa[], acertos: Acerto[], usuarios: Usuario[]): Rascunho[] {
  const rascunhos: Rascunho[] = []
  let n = 0
  for (const remessa of remessas) {
    const acerto = acertos.filter((a) => a.remessaId === remessa.id).toSorted((a, b) => b.data.localeCompare(a.data))[0]
    if (!acerto) continue
    const inicio = addDays(remessa.dataSaida, 1)
    const janela = Math.max(diffDays(acerto.data, inicio), 1)
    const lancadoPorId = usuarios.find((u) => u.vendedoraId === remessa.vendedoraId)?.id ?? 'u1'
    for (const item of remessa.itens) {
      let restante = item.vendida
      while (restante > 0) {
        const quantidade = Math.min(restante, n % 3 === 0 ? 2 : 1)
        restante -= quantidade
        const itens: ItemVenda[] = [
          { produtoId: item.produtoId, tamanho: item.tamanho, cor: item.cor, remessaId: remessa.id, quantidade, preco: precoDe(produtos, item.produtoId), acertoId: acerto.id },
        ]
        rascunhos.push({
          venda: {
            data: addDays(inicio, (n * 5) % janela),
            hora: hora(n),
            vendedoraId: remessa.vendedoraId,
            lancadoPorId,
            cliente: n % 2 === 0 ? CLIENTES[n % CLIENTES.length] : undefined,
            itens,
            total: total(itens),
            formaPagamento: n % 4 === 0 ? 'avista' : 'pix',
          },
        })
        n++
      }
    }
  }
  return rascunhos
}

function manuais(hoje: ISODate, produtos: Produto[], usuarios: Usuario[]): Rascunho[] {
  return MANUAIS.map((m) => {
    const itens: ItemVenda[] = m.itens.map(([produtoId, tamanho, cor, quantidade]) => ({
      produtoId, tamanho, cor, quantidade, remessaId: m.remessaId, preco: precoDe(produtos, produtoId),
    }))
    const cancelamento: Registro | undefined = m.cancelada && {
      data: addDays(hoje, m.cancelada.dias), hora: m.cancelada.hora, usuarioId: 'u1', motivo: m.cancelada.motivo,
    }
    return {
      venda: {
        data: addDays(hoje, m.dias),
        hora: m.hora,
        vendedoraId: m.vendedoraId,
        lancadoPorId: m.lancadoPorId ?? usuarios.find((u) => u.vendedoraId === m.vendedoraId)?.id ?? 'u1',
        cliente: m.cliente,
        itens,
        total: total(itens),
        formaPagamento: m.forma,
        cancelamento,
      },
      credito: m.vencimento !== undefined ? { parcelas: m.parcelas ?? 1, vencimento: addDays(hoje, m.vencimento) } : undefined,
    }
  })
}

// Monta vendas (em ordem cronológica, VD-0001 em diante) e o crediário das vendas a prazo
export function vendasSeed(hoje: ISODate, produtos: Produto[], remessas: Remessa[], acertos: Acerto[], usuarios: Usuario[], proximoCrediario: number) {
  const rascunhos = [...historicas(produtos, remessas, acertos, usuarios), ...manuais(hoje, produtos, usuarios)].toSorted((a, b) =>
    `${a.venda.data} ${a.venda.hora}`.localeCompare(`${b.venda.data} ${b.venda.hora}`),
  )
  const vendas: Venda[] = []
  const crediarios: Crediario[] = []
  rascunhos.forEach(({ venda, credito }, index) => {
    const id = `VD-${String(index + 1).padStart(4, '0')}`
    let crediarioId: string | undefined
    if (credito && venda.cliente) {
      crediarioId = `CR-${String(proximoCrediario + crediarios.length).padStart(2, '0')}`
      crediarios.push({
        id: crediarioId,
        cliente: venda.cliente,
        vendedoraId: venda.vendedoraId,
        dataVenda: venda.data,
        valorTotal: venda.total,
        parcelas: gerarParcelas(venda.total, credito.parcelas, credito.vencimento),
        vendaId: id,
        forma: venda.formaPagamento,
      })
    }
    vendas.push({ ...venda, id, crediarioId })
  })
  return { vendas, crediarios }
}
