import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth.api'
import { usersApi } from '../api/users.api'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import type { Role, User } from '../types'

const ROLES: Role[] = ['ADMIN', 'MANAGER', 'DEVELOPER']

const roleBadge: Record<Role, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  MANAGER: 'bg-purple-100 text-purple-700',
  DEVELOPER: 'bg-green-100 text-green-700',
}

export function AdminPage() {
  const { user: me } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newRole, setNewRole] = useState<Role>('DEVELOPER')
  const [createError, setCreateError] = useState('')

  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editRole, setEditRole] = useState<Role>('DEVELOPER')
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (me?.role !== 'ADMIN') {
    navigate('/dashboard', { replace: true })
    return null
  }

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { default: api } = await import('../api/axios')
      return api.get<User[]>('/users').then((r) => r.data)
    },
  })

  const registerMutation = useMutation({
    mutationFn: () => authApi.register({ username, email, password, role: newRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowForm(false)
      setUsername('')
      setEmail('')
      setPassword('')
      setCreateError('')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setCreateError(msg ?? 'Failed to create user')
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: () => usersApi.updateRole(editingUser!.id, editRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => usersApi.deleteUser(editingUser!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      closeModal()
    },
  })

  function openEdit(u: User) {
    setEditingUser(u)
    setEditRole(u.role)
    setConfirmDelete(false)
  }

  function closeModal() {
    setEditingUser(null)
    setConfirmDelete(false)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + New User
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5 max-w-md">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Create User</h2>
          <input
            autoFocus
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2 mb-3">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setNewRole(r)}
                className={`px-3 py-1 text-xs rounded-full font-medium border transition-colors ${
                  newRole === r ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {createError && <p className="text-xs text-red-600 mb-2">{createError}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => registerMutation.mutate()}
              disabled={!username || !email || !password || registerMutation.isPending}
              className="bg-blue-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Create
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500 px-3 py-1.5">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading && <LoadingSpinner />}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users?.map((u) => (
              <tr
                key={u.id}
                onClick={() => openEdit(u)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-3 font-medium text-gray-900">{u.username}</td>
                <td className="px-6 py-3 text-gray-500">{u.email}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleBadge[u.role]}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="w-10 h-10 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-base mb-2">
                  {editingUser.username[0].toUpperCase()}
                </div>
                <h2 className="font-semibold text-gray-900">{editingUser.username}</h2>
                <p className="text-xs text-gray-400">{editingUser.email}</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <p className="text-xs font-medium text-gray-500 mb-2">Role</p>
            <div className="flex gap-2 mb-5">
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setEditRole(r)}
                  className={`px-3 py-1 text-xs rounded-full font-medium border transition-colors ${
                    editRole === r ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => updateRoleMutation.mutate()}
                disabled={editRole === editingUser.role || updateRoleMutation.isPending}
                className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                {updateRoleMutation.isPending ? 'Saving…' : 'Save Role'}
              </button>

              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  disabled={editingUser.id === me?.id}
                  title={editingUser.id === me?.id ? "Can't delete yourself" : ''}
                  className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm transition-colors disabled:opacity-40"
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4h12M5 4V2.5a.5.5 0 01.5-.5h5a.5.5 0 01.5.5V4M6 7v5M10 7v5M3 4l1 9.5a.5.5 0 00.5.5h7a.5.5 0 00.5-.5L13 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleteMutation.isPending ? 'Deleting…' : 'Confirm delete'}
                </button>
              )}
            </div>

            {confirmDelete && (
              <p className="text-xs text-red-500 mt-2">
                This will remove all assignments for <strong>{editingUser.username}</strong> and cannot be undone.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
