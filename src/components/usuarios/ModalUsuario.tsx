import { useState, type FormEvent } from 'react'
import { PERFIL_LABEL } from '../../data/catalogo'
import type { Perfil, Usuario } from '../../data/types'
import { proximoIdUsuario } from '../../store/consultas'
import { useAppStore } from '../../store/useAppStore'
import Button from '../ui/Button'
import Field from '../ui/Field'
import { fieldClasses, fieldErrorId } from '../ui/fieldStyles'
import Modal from '../ui/Modal'
import { MODAL_BODY, MODAL_FOOTER } from '../ui/modalStyles'
import Segmented from '../ui/Segmented'
import Select from '../ui/Select'

interface ModalUsuarioProps {
  open: boolean
  usuarioId?: string
  onClose: () => void
  onSuccess: (mensagem: string) => void
}

interface Erros {
  nome?: string
  email?: string
  vendedora?: string
  senha?: string
}

const PERFIS = (Object.keys(PERFIL_LABEL) as Perfil[]).map((valor) => ({ valor, rotulo: PERFIL_LABEL[valor] }))
const LATENCIA_MS = 500

// Cadastro e edição de acesso com perfil administrador ou vendedor (HU 1.2)
export default function ModalUsuario({ open, usuarioId, onClose, onSuccess }: ModalUsuarioProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={usuarioId ? 'Editar usuário' : 'Novo usuário'}
      subtitle={usuarioId ? 'As mudanças valem no próximo acesso' : 'A pessoa entra com este e-mail e a senha inicial'}
    >
      <UsuarioForm usuarioId={usuarioId} onClose={onClose} onSuccess={onSuccess} />
    </Modal>
  )
}

function UsuarioForm({ usuarioId, onClose, onSuccess }: Omit<ModalUsuarioProps, 'open'>) {
  const { state, dispatch } = useAppStore()
  const existente = state.usuarios.find((u) => u.id === usuarioId)
  const [nome, setNome] = useState(existente?.nome ?? '')
  const [email, setEmail] = useState(existente?.email ?? '')
  const [perfil, setPerfil] = useState<Perfil>(existente?.perfil ?? 'vendedor')
  // Vendedoras ainda sem acesso (ou a do próprio usuário)
  const livres = state.vendedoras.filter((v) => v.ativa && !state.usuarios.some((u) => u.vendedoraId === v.id && u.id !== usuarioId))
  const [vendedoraId, setVendedoraId] = useState(existente?.vendedoraId ?? livres[0]?.id ?? '')
  const [senha, setSenha] = useState('')
  const [erros, setErros] = useState<Erros>({})
  const [salvando, setSalvando] = useState(false)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (salvando) return
    const emailLimpo = email.trim().toLowerCase()
    const novosErros: Erros = {
      nome: nome.trim().length < 2 ? 'Informe o nome' : undefined,
      email: !/^\S+@\S+\.\S+$/.test(emailLimpo)
        ? 'Informe um e-mail válido'
        : state.usuarios.some((u) => u.id !== usuarioId && u.email.toLowerCase() === emailLimpo)
          ? 'Já existe um usuário com este e-mail'
          : undefined,
      vendedora: perfil === 'vendedor' && !vendedoraId ? 'Escolha a vendedora que este acesso representa' : undefined,
      senha: !existente && senha.length < 6 ? 'A senha inicial precisa de 6 caracteres ou mais' : existente && senha && senha.length < 6 ? 'Use 6 caracteres ou mais' : undefined,
    }
    setErros(novosErros)
    if (Object.values(novosErros).some(Boolean)) return

    const usuario: Usuario = {
      id: existente?.id ?? proximoIdUsuario(state.usuarios),
      nome: nome.trim(),
      email: emailLimpo,
      senha: senha || existente?.senha || '',
      perfil,
      vendedoraId: perfil === 'vendedor' ? vendedoraId : undefined,
      ativo: existente?.ativo ?? true,
    }
    setSalvando(true)
    window.setTimeout(() => {
      dispatch({ type: 'salvarUsuario', usuario })
      onSuccess(existente ? `${usuario.nome} atualizado` : `${usuario.nome} cadastrado com perfil ${PERFIL_LABEL[perfil]}`)
      onClose()
    }, LATENCIA_MS)
  }

  const aria = (campo: keyof Erros, id: string) => (erros[campo] ? { 'aria-invalid': true, 'aria-describedby': fieldErrorId(id) } : {})

  return (
    <form noValidate onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div data-modal-body className={MODAL_BODY}>
        <div className="flex flex-col gap-1.5">
          <p className="font-label text-label font-semibold text-muted uppercase">Perfil</p>
          <Segmented rotulo="Perfil" opcoes={PERFIS} valor={perfil} onChange={setPerfil} />
          <p className="px-3.5 text-caption text-muted">
            {perfil === 'admin' ? 'Vê e gerencia tudo: estoque, vendas, cobranças e dashboards.' : 'Vê só a tela de venda e baixa, com as peças que estão com ela.'}
          </p>
        </div>
        {perfil === 'vendedor' && (
          <Field label="Vendedora" htmlFor="usuario-vendedora" error={erros.vendedora}>
            <Select
              id="usuario-vendedora"
              value={vendedoraId}
              onChange={(event) => {
                const proxima = state.vendedoras.find((v) => v.id === event.target.value)
                setVendedoraId(event.target.value)
                if (proxima && !nome.trim()) setNome(proxima.nome)
              }}
              {...aria('vendedora', 'usuario-vendedora')}
            >
              {livres.length === 0 && <option value="">Todas as vendedoras já têm acesso</option>}
              {livres.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome} · {v.regiao}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Nome" htmlFor="usuario-nome" error={erros.nome}>
          <input id="usuario-nome" value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Ex.: Sueli Marcondes" className={fieldClasses()} {...aria('nome', 'usuario-nome')} />
        </Field>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Field label="E-mail" htmlFor="usuario-email" error={erros.email} className="flex-1">
            <input
              id="usuario-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nome@sarahfashion.com.br"
              className={fieldClasses()}
              {...aria('email', 'usuario-email')}
            />
          </Field>
          <Field label={existente ? 'Nova senha (opcional)' : 'Senha inicial'} htmlFor="usuario-senha" error={erros.senha} className="sm:w-48">
            <input
              id="usuario-senha"
              type="password"
              autoComplete="new-password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              placeholder={existente ? 'manter a atual' : 'mínimo 6 caracteres'}
              className={fieldClasses()}
              {...aria('senha', 'usuario-senha')}
            />
          </Field>
        </div>
      </div>
      <div className={MODAL_FOOTER}>
        <span />
        <div className="flex gap-2.5">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={salvando}>
            {salvando ? 'Salvando…' : existente ? 'Salvar alterações' : 'Cadastrar usuário'}
          </Button>
        </div>
      </div>
    </form>
  )
}
