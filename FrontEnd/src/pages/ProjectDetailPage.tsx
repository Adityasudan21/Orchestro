import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '../api/projects.api'
import { storiesApi } from '../api/stories.api'
import { useAuth } from '../context/AuthContext'
import { StatusBadge } from '../components/common/StatusBadge'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getById(projectId),
  })

  const { data: stories, isLoading: storiesLoading } = useQuery({
    queryKey: ['stories', projectId],
    queryFn: () => storiesApi.getByProject(projectId),
  })

  const createMutation = useMutation({
    mutationFn: (payload: { title: string; description: string }) =>
      storiesApi.create(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories', projectId] })
      setShowForm(false)
      setTitle('')
      setDescription('')
    },
  })

  const canCreate = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  if (projectLoading) return <LoadingSpinner />

  return (
    <div className="p-8">
      <div className="mb-1 text-sm text-gray-400">
        <Link to="/projects" className="hover:text-blue-600">Projects</Link>
        {' › '}
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project?.name}</h1>
          {project?.description && (
            <p className="text-sm text-gray-500 mt-1">{project.description}</p>
          )}
        </div>
        {canCreate && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + New Story
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Create Story</h2>
          <input
            autoFocus
            placeholder="Story title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none resize-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={() => createMutation.mutate({ title, description })}
              disabled={!title || createMutation.isPending}
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

      {storiesLoading && <LoadingSpinner />}

      <div className="space-y-3">
        {stories?.map((story) => (
          <Link
            key={story.id}
            to={`/stories/${story.id}`}
            className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-4 hover:shadow-md transition-shadow"
          >
            <div>
              <p className="font-medium text-gray-900">{story.title}</p>
              {story.assignee && (
                <p className="text-xs text-gray-400 mt-0.5">Assigned to {story.assignee.username}</p>
              )}
            </div>
            <StatusBadge status={story.status} />
          </Link>
        ))}
        {stories?.length === 0 && !storiesLoading && (
          <div className="text-center py-12 text-gray-400">No stories in this project yet.</div>
        )}
      </div>
    </div>
  )
}
