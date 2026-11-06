import { addDays, type ISODate } from '../lib/date'
import { gerarParcelas } from '../lib/crediario'
import type { Crediario } from './types'

function crediario(id: string, cliente: string, vendedoraId: string, dataVenda: ISODate, valorTotal: number, quantidade: number, pagas: number): Crediario {
  return {
    id,
    cliente,
    vendedoraId,
    dataVenda,
    valorTotal,
    forma: 'parcelado',
    parcelas: gerarParcelas(valorTotal, quantidade, addDays(dataVenda, 30), pagas),
  }
}

// Vendas anteriores ao sistema: cobrem parcela vencida há mais de 15 dias, que vence hoje e futuras
export function crediariosSeed(hoje: ISODate): Crediario[] {
  const dia = (offset: number) => addDays(hoje, offset)

  return [
    // 1ª parcela venceu há 20 dias e não foi paga
    crediario('CR-01', 'Patrícia Gomes', 'v1', dia(-50), 359.7, 3, 0),
    // 1ª paga; 2ª venceu há 16 dias
    crediario('CR-02', 'Luciana Ribeiro', 'v2', dia(-76), 479.6, 4, 1),
    // 1ª paga; 2ª vence hoje
    crediario('CR-03', 'Vanessa Teixeira', 'v3', dia(-60), 299.7, 3, 1),
  ]
}
