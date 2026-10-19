import { createContext, type Dispatch } from 'react'
import type { AppState } from '../data/types'
import type { Action } from './actions'

export interface AppStoreValue {
  state: AppState
  dispatch: Dispatch<Action>
}

export const AppStoreContext = createContext<AppStoreValue | null>(null)
