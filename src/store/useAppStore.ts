import { useContext } from 'react'
import { AppStoreContext, type AppStoreValue } from './context'

export function useAppStore(): AppStoreValue {
  const store = useContext(AppStoreContext)
  if (!store) throw new Error('useAppStore precisa estar dentro de <AppStoreProvider>')
  return store
}
