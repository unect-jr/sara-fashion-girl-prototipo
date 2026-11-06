import { addDays, type ISODate } from '../lib/date'
import type { Acerto, MotivoAjuste, Movimentacao, Remessa, Tamanho, Venda } from './types'
import { MOTIVO_AJUSTE_LABEL } from './catalogo'

type NovaMovimentacao = Omit<Movimentacao, 'id'>

// Entradas de mercadoria antes do período da demo
const ENTRADAS: { dias: number; nf: string; fornecedor: string; usuarioId: string; itens: [string, Tamanho, string, number][] }[] = [
  { dias: -45, nf: '17.880', fornecedor: 'Confecções Aurora', usuarioId: 'u2', itens: [['p02', 'P', 'Preto', 4], ['p02', 'M', 'Preto', 6], ['p02', 'G', 'Preto', 4]] },
  { dias: -20, nf: '18.204', fornecedor: 'Malharia Vila Rica', usuarioId: 'u1', itens: [['p08', 'M', 'Branco', 5], ['p08', 'G', 'Branco', 4], ['p08', 'M', 'Preto', 4]] },
  { dias: -6, nf: '18.391', fornecedor: 'Tecelagem Bom Retiro', usuarioId: 'u1', itens: [['p16', 'P', 'Jeans claro', 2], ['p16', 'M', 'Jeans claro', 3], ['p16', 'G', 'Jeans claro', 3]] },
]

const AJUSTES: { dias: number; produtoId: string; tamanho: Tamanho; cor: string; quantidade: number; motivo: MotivoAjuste; detalhe: string; usuarioId: string }[] = [
  { dias: -18, produtoId: 'p04', tamanho: 'M', cor: 'Preto', quantidade: 1, motivo: 'erro', detalhe: 'A contagem anterior pulou uma caixa', usuarioId: 'u2' },
  { dias: -12, produtoId: 'p09', tamanho: 'P', cor: 'Branco', quantidade: -1, motivo: 'perda', detalhe: 'Peça não encontrada no inventário', usuarioId: 'u1' },
  { dias: -3, produtoId: 'p20', tamanho: 'G', cor: 'Preto', quantidade: -1, motivo: 'avaria', detalhe: 'Costura aberta na barra', usuarioId: 'u1' },
]

// Histórico coerente com o resto do seed: entradas, saídas das remessas, devoluções dos acertos, vendas e ajustes
export function movimentacoesSeed(hoje: ISODate, remessas: Remessa[], acertos: Acerto[], vendas: Venda[]): Movimentacao[] {
  const lista: NovaMovimentacao[] = []

  for (const entrada of ENTRADAS) {
    for (const [produtoId, tamanho, cor, quantidade] of entrada.itens) {
      lista.push({ tipo: 'entrada', data: addDays(hoje, entrada.dias), hora: '10:20', usuarioId: entrada.usuarioId, produtoId, tamanho, cor, quantidade, referencia: `NF ${entrada.nf}`, detalhe: entrada.fornecedor })
    }
  }

  remessas.forEach((remessa, index) => {
    for (const item of remessa.itens) {
      lista.push({ tipo: 'saida', data: remessa.dataSaida, hora: '08:40', usuarioId: index % 2 === 0 ? 'u1' : 'u2', produtoId: item.produtoId, tamanho: item.tamanho, cor: item.cor, quantidade: -item.enviada, vendedoraId: remessa.vendedoraId, referencia: remessa.id })
    }
  })

  for (const acerto of acertos) {
    const remessa = remessas.find((r) => r.id === acerto.remessaId)
    if (!remessa) continue
    for (const item of remessa.itens.filter((i) => i.devolvida > 0)) {
      lista.push({ tipo: 'devolucao', data: acerto.data, hora: '17:30', usuarioId: 'u2', produtoId: item.produtoId, tamanho: item.tamanho, cor: item.cor, quantidade: item.devolvida, vendedoraId: remessa.vendedoraId, referencia: remessa.id, detalhe: `Acerto ${acerto.id}` })
    }
  }

  for (const venda of vendas) {
    for (const item of venda.itens) {
      lista.push({ tipo: 'venda', data: venda.data, hora: venda.hora, usuarioId: venda.lancadoPorId, produtoId: item.produtoId, tamanho: item.tamanho, cor: item.cor, quantidade: -item.quantidade, vendedoraId: venda.vendedoraId, referencia: venda.id })
      if (venda.cancelamento) {
        lista.push({ tipo: 'cancelamento', data: venda.cancelamento.data, hora: venda.cancelamento.hora, usuarioId: venda.cancelamento.usuarioId, produtoId: item.produtoId, tamanho: item.tamanho, cor: item.cor, quantidade: item.quantidade, vendedoraId: venda.vendedoraId, referencia: venda.id, motivo: venda.cancelamento.motivo })
      }
    }
  }

  for (const ajuste of AJUSTES) {
    lista.push({ tipo: 'ajuste', data: addDays(hoje, ajuste.dias), hora: '14:10', usuarioId: ajuste.usuarioId, produtoId: ajuste.produtoId, tamanho: ajuste.tamanho, cor: ajuste.cor, quantidade: ajuste.quantidade, motivo: MOTIVO_AJUSTE_LABEL[ajuste.motivo], detalhe: ajuste.detalhe })
  }

  return lista
    .toSorted((a, b) => `${a.data} ${a.hora}`.localeCompare(`${b.data} ${b.hora}`))
    .map((movimentacao, index) => ({ ...movimentacao, id: `MV-${String(index + 1).padStart(5, '0')}` }))
}
