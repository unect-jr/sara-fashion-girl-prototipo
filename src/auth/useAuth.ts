import { useContext } from 'react'
import { AuthContext, type AuthValue } from './context'

export function useAuth(): AuthValue {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return auth
}
