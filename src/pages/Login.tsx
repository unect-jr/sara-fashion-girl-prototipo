import { motion, useAnimate, useReducedMotion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { SESSAO_MINUTOS } from '../auth/context'
import { useAuth } from '../auth/useAuth'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import { fieldClasses } from '../components/ui/fieldStyles'
import { SENHA_DEMO } from '../data/usuarios'
import { EASE_OUT } from '../lib/motion'

const ACESSOS_DEMO = [
  { email: 'tati@sarahfashion.com.br', rotulo: 'Tati · administradora' },
  { email: 'sueli@sarahfashion.com.br', rotulo: 'Sueli · vendedora' },
]
const LATENCIA_MS = 500

// Login do administrador e das vendedoras (HU 1.1); sem backend, valida contra os usuários da demo
export default function Login() {
  const { usuario, entrar, motivoSaida } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState<string>()
  const [entrando, setEntrando] = useState(false)
  const [escopo, animar] = useAnimate<HTMLFormElement>()
  const reduzir = useReducedMotion()

  if (usuario) return <Navigate to={usuario.perfil === 'vendedor' ? '/venda' : '/'} replace />

  function falhar(mensagem: string) {
    setErro(mensagem)
    setEntrando(false)
    // Balanço curto no cartão para marcar o erro
    if (!reduzir && escopo.current) animar(escopo.current, { x: [0, -8, 7, -4, 3, 0] }, { duration: 0.4 })
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (entrando) return
    if (!email.trim() || !senha) {
      falhar('Informe o e-mail e a senha.')
      return
    }
    setEntrando(true)
    setErro(undefined)
    window.setTimeout(() => {
      const resultado = entrar(email, senha)
      if (!resultado.ok) falhar(resultado.erro)
    }, LATENCIA_MS)
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
        className="flex w-full max-w-105 flex-col gap-6"
      >
        <div className="flex flex-col items-center gap-0.75">
          <span className="font-label text-wordmark font-semibold text-ink">SARAH</span>
          <span className="text-tagline text-muted">fashion girl</span>
        </div>

        <form ref={escopo} noValidate onSubmit={onSubmit} className="flex flex-col gap-4 rounded-modal border border-line bg-surface p-7 shadow-modal">
          <div className="flex flex-col gap-1">
            <h1 className="text-metric font-semibold text-ink">Entrar</h1>
            <p className="text-sub text-muted">Use o e-mail e a senha cadastrados pela administração da loja.</p>
          </div>

          {motivoSaida === 'expirou' && !erro && (
            <p role="status" className="rounded-tile border border-warning bg-warning-tint px-3.5 py-2.75 text-caption text-warning">
              Sua sessão foi encerrada depois de {SESSAO_MINUTOS} minutos sem uso. Entre de novo para continuar.
            </p>
          )}

          <Field label="E-mail" htmlFor="login-email">
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              autoFocus
              placeholder="voce@sarahfashion.com.br"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={erro ? true : undefined}
              aria-describedby={erro ? 'login-erro' : undefined}
              className={fieldClasses()}
            />
          </Field>
          <Field label="Senha" htmlFor="login-senha">
            <div className="relative">
              <input
                id="login-senha"
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="current-password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                aria-invalid={erro ? true : undefined}
                aria-describedby={erro ? 'login-erro' : undefined}
                className={`${fieldClasses()} pr-22`}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((atual) => !atual)}
                aria-pressed={mostrarSenha}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full px-2.75 py-1 text-caption font-medium text-info transition-colors hover:bg-info-tint focus-visible:outline-2 focus-visible:outline-brand"
              >
                {mostrarSenha ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </Field>

          {erro && (
            <p id="login-erro" role="alert" className="px-3.5 text-caption text-brand">
              {erro}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={entrando} className="mt-1 w-full py-2.75">
            {entrando ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>

        <div className="flex flex-col gap-2.5 rounded-card border border-dashed border-line-strong px-5 py-4">
          <p className="text-caption text-muted">
            Acesso de demonstração, senha <span className="font-semibold text-ink-soft">{SENHA_DEMO}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {ACESSOS_DEMO.map((acesso) => (
              <Button
                key={acesso.email}
                size="xs"
                onClick={() => {
                  setEmail(acesso.email)
                  setSenha(SENHA_DEMO)
                  setErro(undefined)
                }}
              >
                {acesso.rotulo}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>
    </main>
  )
}
