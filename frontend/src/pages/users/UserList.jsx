import { useState } from 'react'
import { Plus, Shield, UserX, Mail, Clock, Loader2 } from 'lucide-react'
import { RoleBadge } from '../../components/ui/Badge'
import { Table, Th, Td, Tr } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'
import { Input, Select } from '../../components/ui/Input'
import { Alert } from '../../components/ui/Alert'
import { PageLoader, SkeletonRow, ApiError } from '../../components/ui/Loading'
import { useApi, useMutation } from '../../hooks/useApi'
import { userService } from '../../services/user.service'
import { useToast } from '../../context/ToastContext'
import { formatDateTime } from '../../lib/utils'

const ROLES = ['admin', 'supervisor', 'cargo_agent', 'ground_handler']

const PERMISSIONS = {
  admin:          ['Create AWB', 'Edit AWB', 'Delete AWB', 'Approve DGR', 'Manage Users', 'View Audit Log', 'Manage Flights'],
  supervisor:     ['Create AWB', 'Edit AWB', 'Approve DGR', 'View Audit Log', 'Manage Flights'],
  cargo_agent:    ['Create AWB', 'Edit AWB'],
  ground_handler: [],
}

export default function UserList() {
  const { showToast } = useToast()

  const [createModal, setCreateModal] = useState(false)
  const [permModal,   setPermModal]   = useState(null)
  const [toggleTarget, setToggleTarget] = useState(null)

  const { data, loading, error, refetch } = useApi(() => userService.list())
  const users = data?.data || data || []

  const createMut = useMutation((payload) => userService.create(payload))
  const toggleMut = useMutation((id)      => userService.toggleStatus(id))

  const handleCreate = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    const password = form.get('password')
    if (password !== form.get('password_confirmation')) {
      showToast('Passwords do not match.', 'error')
      return
    }
    const { ok, error: err } = await createMut.mutate({
      name:                  form.get('name'),
      email:                 form.get('email'),
      role:                  form.get('role'),
      password,
      password_confirmation: form.get('password_confirmation'),
    })
    if (ok) { setCreateModal(false); showToast('Account registered — the user can now sign in.'); refetch() }
    else showToast(err || 'Failed to register user.', 'error')
  }

  const handleToggle = async () => {
    if (!toggleTarget) return
    const { ok } = await toggleMut.mutate(toggleTarget.id)
    setToggleTarget(null)
    if (ok) { showToast(`User ${toggleTarget.status === 'active' ? 'deactivated' : 'activated'}.`); refetch() }
    else showToast('Failed to update user status.', 'error')
  }

  const getRoleName = (u) => u.roles?.[0]?.name || u.role || '—'

  if (error) return <ApiError error={error} onRetry={refetch} />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{users.length} users in the system</p>
        </div>
        <button onClick={() => setCreateModal(true)} className="btn-primary">
          <Plus size={16} /> Add User
        </button>
      </div>


      {/* Role overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ROLES.map(role => {
          const count  = users.filter(u => getRoleName(u) === role).length
          const colors = {
            admin:          'border-purple-700/50 bg-purple-900/10',
            supervisor:     'border-blue-700/50 bg-blue-900/10',
            cargo_agent:    'border-cyan-700/50 bg-cyan-900/10',
            ground_handler: 'border-slate-600 bg-slate-800/50',
          }
          return (
            <div key={role} className={`card border ${colors[role]} p-4`}>
              <p className="text-xs text-slate-500 capitalize">{role.replace('_', ' ')}</p>
              <p className="text-2xl font-bold text-slate-100 mt-1">{count}</p>
              <p className="text-xs text-slate-600 mt-1">{PERMISSIONS[role]?.length || 0} permissions</p>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <Table>
          <thead>
            <tr className="bg-slate-900/50">
              <Th>User</Th><Th>Role</Th><Th>Status</Th><Th>Last Login</Th><Th>Joined</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              : users.map(u => {
                  const role   = getRoleName(u)
                  const avatar = u.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <Tr key={u.id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {avatar}
                          </div>
                          <div>
                            <p className="font-medium text-slate-100 text-sm">{u.name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1"><Mail size={10} /> {u.email}</p>
                          </div>
                        </div>
                      </Td>
                      <Td><RoleBadge role={role} /></Td>
                      <Td>
                        <span className={`badge ${u.status === 'active' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                          {u.status}
                        </span>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock size={11} /> {u.last_login ? formatDateTime(u.last_login) : '—'}
                        </div>
                      </Td>
                      <Td><span className="text-xs text-slate-500">{u.created_at?.slice(0, 10)}</span></Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setPermModal(u)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors" title="View permissions">
                            <Shield size={14} />
                          </button>
                          <button
                            onClick={() => setToggleTarget(u)}
                            title={u.status === 'active' ? 'Deactivate user' : 'Activate user'}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors"
                          >
                            <UserX size={14} />
                          </button>
                        </div>
                      </Td>
                    </Tr>
                  )
                })
            }
          </tbody>
        </Table>
      </div>

      {/* Register modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Register New User" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name *"     name="name"  placeholder="Aminata Diop" required />
            <Input label="Email Address *" name="email" type="email" placeholder="a.diop@cargoflow.mr" required />
          </div>
          <Select label="Role *" name="role" defaultValue="cargo_agent" required>
            {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Password *"         name="password"              type="password" minLength={8} placeholder="Min 8 chars" required />
            <Input label="Confirm Password *" name="password_confirmation" type="password" minLength={8} placeholder="Re-enter password" required />
          </div>
          <Alert variant="info">Password must be at least 8 characters and include letters and numbers. The account is active immediately and the user can sign in right away.</Alert>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setCreateModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMut.loading} className="btn-primary">
              {createMut.loading ? 'Registering…' : 'Register User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Permissions modal */}
      <Modal open={!!permModal} onClose={() => setPermModal(null)} title={`Permissions — ${permModal?.name}`} size="sm">
        <div className="space-y-3">
          <RoleBadge role={getRoleName(permModal || {})} />
          <div className="space-y-2 mt-2">
            {(PERMISSIONS[getRoleName(permModal || {})] || []).map(perm => (
              <div key={perm} className="flex items-center gap-2 py-1.5 px-3 bg-emerald-900/20 border border-emerald-800/30 rounded-lg">
                <span className="w-4 h-4 bg-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-[8px] text-white font-bold">✓</span>
                </span>
                <span className="text-sm text-emerald-300">{perm}</span>
              </div>
            ))}
            {(PERMISSIONS[getRoleName(permModal || {})] || []).length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">No specific permissions assigned</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Toggle status confirmation modal */}
      <Modal open={!!toggleTarget} onClose={() => setToggleTarget(null)} title="Change User Status" size="sm">
        <div className="space-y-4">
          <Alert variant={toggleTarget?.status === 'active' ? 'error' : 'info'}>
            {toggleTarget?.status === 'active'
              ? <>Deactivating <strong>{toggleTarget?.name}</strong> will prevent them from logging in.</>
              : <>Activating <strong>{toggleTarget?.name}</strong> will restore their access.</>
            }
          </Alert>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setToggleTarget(null)} className="btn-secondary">Cancel</button>
            <button
              onClick={handleToggle}
              disabled={toggleMut.loading}
              className={toggleTarget?.status === 'active' ? 'btn-danger' : 'btn-primary'}
            >
              {toggleMut.loading
                ? <Loader2 size={14} className="animate-spin" />
                : toggleTarget?.status === 'active' ? 'Deactivate' : 'Activate'
              }
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
