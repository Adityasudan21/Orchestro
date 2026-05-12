import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { projectsApi } from '../api/projects.api'
import { usersApi } from '../api/users.api'
import { useAuth } from '../context/AuthContext'
import { AssigneeSelect } from '../components/common/AssigneeSelect'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { timeAgo } from '../utils/timeAgo'

export function MyProjectsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [assigneeId, setAssigneeId] = useState<number | null>(null)
  const [reporterId, setReporterId] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const canCreate = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const { data: projects, isLoading } = useQuery({
    queryKey: ['my-projects'],
    queryFn: projectsApi.getMy,
  })

  const { data: assignableUsers } = useQuery({
    queryKey: ['users', 'assignable'],
    queryFn: usersApi.getAssignable,
    enabled: canCreate && showForm,
  })

  const createMutation = useMutation({
    mutationFn: () => projectsApi.create({
      name,
      description,
      assigneeId: assigneeId ?? undefined,
      reporterId: reporterId ?? undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setShowForm(false)
      setName('')
      setDescription('')
      setAssigneeId(null)
      setReporterId(null)
    },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Projects where you have an assigned story or task</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + New Project
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Create Project</h2>
          <input
            autoFocus
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          {assignableUsers && (
            <div className="flex gap-4 mb-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 mb-1.5">Assignee</p>
                <AssigneeSelect
                  value={assigneeId}
                  options={assignableUsers.map((u) => ({ id: u.id, username: u.username, role: u.role }))}
                  onChange={(id) => setAssigneeId(id)}
                />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 mb-1.5">Reporter</p>
                <AssigneeSelect
                  value={reporterId}
                  options={assignableUsers.map((u) => ({ id: u.id, username: u.username, role: u.role }))}
                  onChange={(id) => setReporterId(id)}
                />
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => createMutation.mutate()}
              disabled={!name || createMutation.isPending}
              className="bg-blue-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Create
            </button>
            <button
              onClick={() => { setShowForm(false); setAssigneeId(null); setReporterId(null) }}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects…"
          className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
        />
      </div>

      {isLoading && <LoadingSpinner />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects?.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())).map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-gray-900 mb-1">{project.name}</h2>
            {project.description && (
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{project.description}</p>
            )}
            <div className="flex items-center justify-between text-xs text-gray-400">
              {project.assignee && <span>Assigned to {project.assignee.username}</span>}
              <span className="ml-auto">{timeAgo(project.createdAt)}</span>
            </div>
          </Link>
        ))}
      </div>

      {projects?.length === 0 && !isLoading && (
        <div className="text-center py-16 text-gray-400">
          No projects assigned to you yet.{canCreate && <span> Click <b>+ New Project</b> to create one.</span>}
        </div>
      )}
    </div>
  )
}
