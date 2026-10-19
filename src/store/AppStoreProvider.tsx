import { useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { createSeed } from '../data/seed'
import type { AppState } from '../data/types'
import { todayISO } from '../lib/date'
import { AppStoreContext } from './context'
import { appReducer } from './reducer'

// v2: produtos ganharam sku e imagem; estado salvo da v1 é descartado
const STORAGE_KEY = 'sfg-prototipo:v2'

// Reaproveita o estado salvo só se for do mesmo dia; em outro dia o seed é refeito
// para os status por prazo continuarem cobrindo atrasado / vence hoje / em dia
function carregarEstado(): AppState {
  const hoje = todayISO()
  try {
    const salvo = localStorage.getItem(STORAGE_KEY)
    if (salvo) {
      const estado = JSON.parse(salvo) as AppState
      if (estado.hoje === hoje) return estado
    }
  } catch {
    // localStorage indisponível ou JSON inválido: segue com o seed
  }
  return createSeed(hoje)
}

export default function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, carregarEstado)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Sem persistência (modo privado, cota cheia): a demo segue em memória
    }
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}
