import { addDays, type ISODate } from '../lib/date'
import { statusRemessa } from '../lib/remessa'
import type { ItemRemessa, Remessa, Tamanho } from './types'

const PRAZO_PADRAO_DIAS = 30

function item(produtoId: string, tamanho: Tamanho, cor: string, enviada: number, devolvida = 0, vendida = 0): ItemRemessa {
  return { produtoId, tamanho, cor, enviada, devolvida, vendida }
}

function remessa(id: string, vendedoraId: string, dataSaida: ISODate, itens: ItemRemessa[]): Remessa {
  return {
    id,
    vendedoraId,
    dataSaida,
    prazoAcerto: addDays(dataSaida, PRAZO_PADRAO_DIAS),
    itens,
    status: statusRemessa(itens),
  }
}

// Datas relativas a hoje: as abertas cobrem os três status por prazo (−7, 0, +5, +14, +17 dias)
export function remessasSeed(hoje: ISODate): Remessa[] {
  const dia = (offset: number) => addDays(hoje, offset)

  return [
    // Fechadas (histórico)
    remessa('RM-0128', 'v1', dia(-96), [
      item('p14', 'M', 'Preto', 10, 3, 7),
      item('p08', 'M', 'Branco', 6, 0, 6),
      item('p20', 'P', 'Preto', 4, 2, 2),
    ]),
    remessa('RM-0136', 'v6', dia(-70), [
      item('p04', 'P', 'Preto', 5, 2, 3),
      item('p16', 'G', 'Jeans claro', 4, 0, 4),
      item('p10', 'M', 'Off-white', 6, 4, 2),
    ]),
    remessa('RM-0139', 'v2', dia(-62), [
      item('p02', 'G', 'Preto', 4, 1, 3),
      item('p13', 'M', 'Champanhe', 5, 0, 5),
      item('p21', 'P', 'Jeans claro', 6, 2, 4),
    ]),

    // Abertas: na rua (as do Painel no Figma)
    remessa('RM-0142', 'v1', dia(-37), [
      item('p01', 'M', 'Floral', 3),
      item('p01', 'G', 'Floral', 3),
      item('p08', 'P', 'Branco', 6),
      item('p08', 'M', 'Preto', 6),
      item('p12', 'M', 'Preto', 5),
      item('p15', 'M', 'Preto', 4),
      item('p20', 'M', 'Preto', 3),
      item('p14', 'M', 'Branco', 8),
    ]),
    remessa('RM-0147', 'v2', dia(-30), [
      item('p02', 'M', 'Preto', 4),
      item('p05', 'M', 'Estampado', 3),
      item('p11', 'P', 'Bege', 4),
      item('p16', 'M', 'Jeans claro', 3),
      item('p21', 'M', 'Jeans claro', 4),
      item('p13', 'P', 'Vinho', 4),
    ]),
    // Parcial: já teve um acerto (AC-004)
    remessa('RM-0149', 'v3', dia(-25), [
      item('p04', 'M', 'Preto', 5, 0, 2),
      item('p07', 'P', 'Champanhe', 3),
      item('p09', 'M', 'Branco', 4, 1, 1),
      item('p14', 'G', 'Preto', 8),
      item('p18', 'M', 'Mescla', 5),
      item('p24', 'P', 'Areia', 6),
    ]),
    remessa('RM-0151', 'v4', dia(-16), [
      item('p03', 'M', 'Areia', 3),
      item('p10', 'P', 'Off-white', 4),
      item('p17', 'M', 'Cáqui', 3),
      item('p22', 'P', 'Estampado', 3),
      item('p06', 'M', 'Branco', 4),
    ]),
    remessa('RM-0153', 'v5', dia(-13), [
      item('p01', 'P', 'Floral', 2),
      item('p02', 'P', 'Caramelo', 4),
      item('p08', 'G', 'Branco', 6),
      item('p12', 'P', 'Nude', 5),
      item('p14', 'P', 'Branco', 10),
      item('p15', 'G', 'Bege', 4),
      item('p19', 'M', 'Jeans escuro', 5),
      item('p23', 'M', 'Preto', 4),
      item('p11', 'M', 'Preto', 4),
    ]),
  ]
}
