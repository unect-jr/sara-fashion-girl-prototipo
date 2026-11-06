import { useCallback } from 'react'
import { horaAtual } from '../lib/date'
import type { Carimbo } from '../store/actions'
import { useAppStore } from '../store/useAppStore'
import { useAuth } from './useAuth'

// Usuário, data e hora para registrar em cada movimentação; chame dentro de eventos
export function useCarimbo(): () => Carimbo {
  const { usuario } = useAuth()
  const { hoje } = useAppStore().state
  return useCallback(() => ({ usuarioId: usuario?.id ?? 'u1', data: hoje, hora: horaAtual() }), [usuario, hoje])
}
