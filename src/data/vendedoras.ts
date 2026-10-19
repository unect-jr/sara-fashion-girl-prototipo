import type { Vendedora } from './types'

// Nomes e regiões das cinco primeiras vêm do Painel no Figma; comissão de 25% como no mockup
export const vendedorasSeed: Vendedora[] = [
  { id: 'v1', nome: 'Rosângela Ferraz', telefone: '(11) 98741-2203', regiao: 'Vila Esperança', comissao: 0.25, ativa: true },
  { id: 'v2', nome: 'Cleide Antunes', telefone: '(11) 99612-5480', regiao: 'Jardim das Flores', comissao: 0.25, ativa: true },
  { id: 'v3', nome: 'Marinalva Souza', telefone: '(11) 97833-1196', regiao: 'Centro / Rodoviária', comissao: 0.25, ativa: true },
  { id: 'v4', nome: 'Edilene Prado', telefone: '(11) 98520-7741', regiao: 'Bairro Alto', comissao: 0.25, ativa: true },
  { id: 'v5', nome: 'Sueli Marcondes', telefone: '(11) 99104-3362', regiao: 'Vila Nova / Parque', comissao: 0.25, ativa: true },
  { id: 'v6', nome: 'Josiane Lima', telefone: '(11) 97455-8820', regiao: 'Morada do Sol', comissao: 0.25, ativa: true },
]
