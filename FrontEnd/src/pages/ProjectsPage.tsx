import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { projectsApi } from '../api/projects.api'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

export function ProjectsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  })

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setShowForm(false)
      setName('')
      setDescription('')
    },
  })

  const canCreate = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
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
          <div className="flex gap-2">
            <button
              onClick={() => createMutation.mutate({ name, description })}
              disabled={!name || createMutation.isPending}
              className="bg-blue-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Create
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading && <LoadingSpinner />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects?.map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-gray-900 mb-1">{project.name}</h2>
            {project.description && (
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{project.description}</p>
            )}
            <div className="flex items-center justify-end text-xs text-gray-400">
              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
      </div>

      {projects?.length === 0 && !isLoading && (
        <div className="text-center py-16 text-gray-400">No projects yet.</div>
      )}
    </div>
  )
}
