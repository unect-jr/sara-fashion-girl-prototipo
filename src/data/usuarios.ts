import type { Usuario } from './types'

// Senha única da demonstração (sem backend, sem criptografia)
export const SENHA_DEMO = 'sarah123'

// Tati e Leandro administram; cada vendedora tem o próprio acesso (Visão Geral do Projeto no ClickUp)
export const usuariosSeed: Usuario[] = [
  { id: 'u1', nome: 'Tati', email: 'tati@sarahfashion.com.br', senha: SENHA_DEMO, perfil: 'admin', ativo: true },
  { id: 'u2', nome: 'Leandro', email: 'leandro@sarahfashion.com.br', senha: SENHA_DEMO, perfil: 'admin', ativo: true },
  { id: 'u3', nome: 'Rosângela Ferraz', email: 'rosangela@sarahfashion.com.br', senha: SENHA_DEMO, perfil: 'vendedor', vendedoraId: 'v1', ativo: true },
  { id: 'u4', nome: 'Cleide Antunes', email: 'cleide@sarahfashion.com.br', senha: SENHA_DEMO, perfil: 'vendedor', vendedoraId: 'v2', ativo: true },
  { id: 'u5', nome: 'Marinalva Souza', email: 'marinalva@sarahfashion.com.br', senha: SENHA_DEMO, perfil: 'vendedor', vendedoraId: 'v3', ativo: true },
  { id: 'u6', nome: 'Edilene Prado', email: 'edilene@sarahfashion.com.br', senha: SENHA_DEMO, perfil: 'vendedor', vendedoraId: 'v4', ativo: true },
  { id: 'u7', nome: 'Sueli Marcondes', email: 'sueli@sarahfashion.com.br', senha: SENHA_DEMO, perfil: 'vendedor', vendedoraId: 'v5', ativo: true },
  // Desativado: mostra que acesso bloqueado não entra
  { id: 'u8', nome: 'Josiane Lima', email: 'josiane@sarahfashion.com.br', senha: SENHA_DEMO, perfil: 'vendedor', vendedoraId: 'v6', ativo: false },
]
