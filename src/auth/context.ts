import { createContext } from 'react'
import type { Usuario } from '../data/types'

// Sessão encerrada depois de 15 minutos sem uso (HU 1.1)
export const SESSAO_MINUTOS = 15

export type MotivoSaida = 'expirou' | 'saiu'

export type ResultadoLogin = { ok: true; usuario: Usuario } | { ok: false; erro: string }

export interface AuthValue {
  usuario: Usuario | null
  motivoSaida?: MotivoSaida
  entrar: (email: string, senha: string) => ResultadoLogin
  sair: (motivo?: MotivoSaida) => void
}

export const AuthContext = createContext<AuthValue | null>(null)
