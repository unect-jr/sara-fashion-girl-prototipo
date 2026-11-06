import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAppStore } from '../store/useAppStore'
import { AuthContext, SESSAO_MINUTOS, type AuthValue, type MotivoSaida } from './context'

const STORAGE_KEY = 'sfg-sessao:v1'
const LIMITE_MS = SESSAO_MINUTOS * 60_000
const VERIFICAR_MS = 10_000
const SALVAR_MS = 10_000
const EVENTOS_DE_USO = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'] as const

interface Sessao {
  usuarioId: string | null
  motivo?: MotivoSaida
}

function gravar(usuarioId: string | null, ultimaAtividade = 0) {
  try {
    if (usuarioId) localStorage.setItem(STORAGE_KEY, JSON.stringify({ usuarioId, ultimaAtividade }))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Sem armazenamento: a sessão vale só enquanto a aba estiver aberta
  }
}

// Retoma a sessão salva, a menos que ela tenha ficado parada além do limite
function sessaoSalva(): Sessao {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY)
    if (!salvo) return { usuarioId: null }
    const { usuarioId, ultimaAtividade } = JSON.parse(salvo) as { usuarioId: string; ultimaAtividade: number }
    if (Date.now() - ultimaAtividade > LIMITE_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return { usuarioId: null, motivo: 'expirou' }
    }
    return { usuarioId }
  } catch {
    return { usuarioId: null }
  }
}

// Login simulado com perfis (HU 1.1 e 1.2); usuários vêm do mesmo estado da demo
export default function AuthProvider({ children }: { children: ReactNode }) {
  const { state } = useAppStore()
  const [sessao, setSessao] = useState<Sessao>(sessaoSalva)
  const ultimaAtividade = useRef(0)

  // Acesso desativado perde a sessão na hora
  const usuario = useMemo(
    () => (sessao.usuarioId ? (state.usuarios.find((u) => u.id === sessao.usuarioId && u.ativo) ?? null) : null),
    [sessao.usuarioId, state.usuarios],
  )

  const sair = useCallback((motivo: MotivoSaida = 'saiu') => {
    gravar(null)
    setSessao({ usuarioId: null, motivo })
  }, [])

  const entrar = useCallback<AuthValue['entrar']>(
    (email, senha) => {
      const alvo = state.usuarios.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
      if (!alvo || alvo.senha !== senha) return { ok: false, erro: 'E-mail ou senha incorretos. Confira e tente de novo.' }
      if (!alvo.ativo) return { ok: false, erro: 'Este acesso está desativado. Fale com a administração da loja.' }
      gravar(alvo.id, Date.now())
      setSessao({ usuarioId: alvo.id })
      return { ok: true, usuario: alvo }
    },
    [state.usuarios],
  )

  // Conta o tempo sem uso e encerra a sessão quando passa do limite
  useEffect(() => {
    const usuarioId = sessao.usuarioId
    if (!usuarioId) return
    let salvoEm = Date.now()
    ultimaAtividade.current = salvoEm
    gravar(usuarioId, salvoEm)

    function registrarUso() {
      const agora = Date.now()
      ultimaAtividade.current = agora
      if (agora - salvoEm > SALVAR_MS) {
        salvoEm = agora
        gravar(usuarioId, agora)
      }
    }
    for (const evento of EVENTOS_DE_USO) window.addEventListener(evento, registrarUso, { passive: true })
    const timer = window.setInterval(() => {
      if (Date.now() - ultimaAtividade.current > LIMITE_MS) sair('expirou')
    }, VERIFICAR_MS)

    return () => {
      for (const evento of EVENTOS_DE_USO) window.removeEventListener(evento, registrarUso)
      window.clearInterval(timer)
    }
  }, [sessao.usuarioId, sair])

  const value = useMemo<AuthValue>(() => ({ usuario, motivoSaida: sessao.motivo, entrar, sair }), [usuario, sessao.motivo, entrar, sair])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
