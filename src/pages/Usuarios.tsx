import { motion } from 'motion/react'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'
import PageHeader from '../components/PageHeader'
import BarraFiltros, { CampoBusca, FiltroAlternar } from '../components/ui/BarraFiltros'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Select from '../components/ui/Select'
import Tag from '../components/ui/Tag'
import Toast, { type ToastMessage } from '../components/ui/Toast'
import ModalUsuario from '../components/usuarios/ModalUsuario'
import VendedoraAvatar from '../components/vendedoras/VendedoraAvatar'
import { PERFIL_LABEL } from '../data/catalogo'
import type { Perfil } from '../data/types'
import { formatNumber } from '../lib/format'
import { EASE_OUT } from '../lib/motion'
import { useAppStore } from '../store/useAppStore'

type ModalAberto = { tipo: 'novo' } | { tipo: 'editar'; usuarioId: string } | null

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

// Gestão de acessos: cadastrar, editar e desativar (HU 1.2)
export default function Usuarios() {
  const { state, dispatch } = useAppStore()
  const { usuario: atual } = useAuth()
  const [busca, setBusca] = useState('')
  const [perfil, setPerfil] = useState<Perfil | ''>('')
  const [desativados, setDesativados] = useState(true)
  const [modal, setModal] = useState<ModalAberto>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim())
    return state.usuarios
      .filter((u) => (!termo || normalizar(`${u.nome} ${u.email}`).includes(termo)) && (!perfil || u.perfil === perfil) && (desativados || u.ativo))
      .toSorted((a, b) => Number(b.ativo) - Number(a.ativo) || a.perfil.localeCompare(b.perfil) || a.nome.localeCompare(b.nome))
  }, [state.usuarios, busca, perfil, desativados])

  const ativos = state.usuarios.filter((u) => u.ativo)
  const fechar = useCallback(() => setModal(null), [])
  const avisar = useCallback((text: string) => setToast({ id: Date.now(), text }), [])
  const limparToast = useCallback(() => setToast(null), [])

  function alternar(usuarioId: string, ativo: boolean, nome: string) {
    dispatch({ type: 'alterarAcessoUsuario', usuarioId, ativo })
    avisar(ativo ? `Acesso de ${nome} reativado` : `Acesso de ${nome} desativado · ela não consegue mais entrar`)
  }

  return (
    <>
      <PageHeader
        title="Usuários"
        subtitle={`${formatNumber(ativos.length)} acessos ativos · ${formatNumber(ativos.filter((u) => u.perfil === 'admin').length)} administradores, ${formatNumber(ativos.filter((u) => u.perfil === 'vendedor').length)} vendedoras`}
        actions={
          <Button size="xs" variant="primary" onClick={() => setModal({ tipo: 'novo' })}>
            Novo usuário
          </Button>
        }
      />

      <div className="-mt-1 flex flex-col gap-5">
        <BarraFiltros contagem={`${formatNumber(filtrados.length)} de ${formatNumber(state.usuarios.length)} usuários`}>
          <CampoBusca valor={busca} onChange={setBusca} placeholder="Buscar nome ou e-mail" rotulo="Buscar usuário" />
          <Select size="sm" aria-label="Perfil" value={perfil} onChange={(event) => setPerfil(event.target.value as Perfil | '')} className="w-40">
            <option value="">Todos os perfis</option>
            <option value="admin">{PERFIL_LABEL.admin}</option>
            <option value="vendedor">{PERFIL_LABEL.vendedor}</option>
          </Select>
          <FiltroAlternar ativo={!desativados} onClick={() => setDesativados((v) => !v)}>
            Só ativos
          </FiltroAlternar>
        </BarraFiltros>

        <Card>
          {filtrados.length === 0 ? (
            <EmptyState title="Nenhum usuário encontrado" description="Ajuste a busca ou os filtros." />
          ) : (
            <ul>
              {filtrados.map((u, index) => {
                const vendedora = state.vendedoras.find((v) => v.id === u.vendedoraId)
                const souEu = u.id === atual?.id
                return (
                  <motion.li
                    key={u.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: EASE_OUT, delay: index * 0.03 }}
                    className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-card-x py-3.25 last:border-b-0 ${u.ativo ? '' : 'bg-surface-muted/60'}`}
                  >
                    <div className="flex min-w-0 flex-1 basis-60 items-center gap-3">
                      <VendedoraAvatar nome={u.nome} size="sm" />
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <p className={`truncate text-body font-medium ${u.ativo ? 'text-ink' : 'text-muted'}`}>
                          {u.nome}
                          {souEu && <span className="text-caption font-normal text-muted"> (você)</span>}
                        </p>
                        <p className="truncate text-caption text-muted">{u.email}</p>
                      </div>
                    </div>
                    <div className="w-28">
                      <Tag variant={u.perfil === 'admin' ? 'info' : 'muted'}>{PERFIL_LABEL[u.perfil].toUpperCase()}</Tag>
                    </div>
                    <p className="w-44 truncate text-sub text-ink-detail">
                      {vendedora ? (
                        <Link to={`/vendedoras/${vendedora.id}`} className="hover:underline">
                          {vendedora.nome}
                        </Link>
                      ) : (
                        <span className="text-muted">acesso total</span>
                      )}
                    </p>
                    <div className="w-28">{u.ativo ? <Tag variant="info">ATIVO</Tag> : <Tag variant="muted">DESATIVADO</Tag>}</div>
                    <div className="ml-auto flex gap-2">
                      <Button size="xs" onClick={() => setModal({ tipo: 'editar', usuarioId: u.id })}>
                        Editar
                      </Button>
                      <Button
                        size="xs"
                        disabled={souEu}
                        title={souEu ? 'Você não pode desativar o próprio acesso' : undefined}
                        className={u.ativo ? 'text-brand! hover:border-brand!' : ''}
                        onClick={() => alternar(u.id, !u.ativo, u.nome.split(' ')[0])}
                      >
                        {u.ativo ? 'Desativar' : 'Reativar'}
                      </Button>
                    </div>
                  </motion.li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      <ModalUsuario
        key={modal?.tipo === 'editar' ? modal.usuarioId : 'novo'}
        open={modal !== null}
        usuarioId={modal?.tipo === 'editar' ? modal.usuarioId : undefined}
        onClose={fechar}
        onSuccess={avisar}
      />
      <Toast toast={toast} onDismiss={limparToast} />
    </>
  )
}
