import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '../api/projects.api'
import { storiesApi } from '../api/stories.api'
import { usersApi } from '../api/users.api'
import { useAuth } from '../context/AuthContext'
import { StatusBadge } from '../components/common/StatusBadge'
import { AssigneeSelect } from '../components/common/AssigneeSelect'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assigneeId, setAssigneeId] = useState<number | undefined>()
  const [editingMeta, setEditingMeta] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const canCreate = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getById(projectId),
  })

  const { data: stories, isLoading: storiesLoading } = useQuery({
    queryKey: ['stories', projectId],
    queryFn: () => storiesApi.getByProject(projectId),
  })

  const { data: assignableUsers } = useQuery({
    queryKey: ['users', 'assignable'],
    queryFn: usersApi.getAssignable,
    enabled: canCreate,
  })

  const assignMutation = useMutation({
    mutationFn: (assigneeId: number) => projectsApi.assign(projectId, assigneeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
  })

  const reporterMutation = useMutation({
    mutationFn: (assigneeId: number) => projectsApi.assignReporter(projectId, assigneeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
  })

  const updateMetaMutation = useMutation({
    mutationFn: () => projectsApi.update(projectId, { name: editName, description: editDesc }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      setEditingMeta(false)
    },
  })

  function startEditing() {
    setEditName(project!.name)
    setEditDesc(project!.description ?? '')
    setEditingMeta(true)
  }

  const createMutation = useMutation({
    mutationFn: (payload: { title: string; description: string; assigneeId?: number }) =>
      storiesApi.create(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories', projectId] })
      setShowForm(false)
      setTitle('')
      setDescription('')
      setAssigneeId(undefined)
    },
  })

  if (projectLoading) return <LoadingSpinner />

  return (
    <div className="p-8">
      <div className="mb-1 text-sm text-gray-400">
        <Link to="/my-projects" className="hover:text-blue-600">My Projects</Link>
        {' › '}
      </div>
      <div className="flex items-start justify-between mb-6">
        {editingMeta ? (
          <div className="flex-1 mr-4">
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full text-xl font-bold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Description (optional)"
              rows={3}
              className="w-full text-sm text-gray-700 border border-gray-300 rounded-lg px-3 py-2 mb-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => updateMetaMutation.mutate()}
                disabled={!editName || updateMetaMutation.isPending}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-md transition-colors"
              >
                {updateMetaMutation.isPending ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setEditingMeta(false)} className="text-xs text-gray-500 px-3 py-1.5 hover:text-gray-700">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="group relative flex-1 mr-4">
            <h1 className="text-2xl font-bold text-gray-900">{project?.name}</h1>
            {project?.description && (
              <p className="text-sm text-gray-500 mt-1">{project.description}</p>
            )}
            <button
              onClick={startEditing}
              title="Edit name & description"
              className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        )}
        {canCreate && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 flex-shrink-0"
          >
            + New Story
          </button>
        )}
      </div>

      {/* Assignee + Reporter rows */}
      {!editingMeta && (
        <div className="flex flex-col gap-2 mb-6 -mt-2">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-20">Assignee</span>
            {canCreate && assignableUsers ? (
              <AssigneeSelect
                value={project?.assignee?.id ?? null}
                options={assignableUsers.map((u) => ({ id: u.id, username: u.username, role: u.role }))}
                onChange={(id) => assignMutation.mutate(id)}
              />
            ) : (
              <span className="text-xs text-gray-600">
                {project?.assignee?.username ?? <span className="text-gray-400 italic">Unassigned</span>}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-20">Reporter</span>
            {canCreate && assignableUsers ? (
              <AssigneeSelect
                value={project?.reporter?.id ?? null}
                options={assignableUsers.map((u) => ({ id: u.id, username: u.username, role: u.role }))}
                onChange={(id) => reporterMutation.mutate(id)}
              />
            ) : (
              <span className="text-xs text-gray-600">
                {project?.reporter?.username ?? <span className="text-gray-400 italic">None</span>}
              </span>
            )}
          </div>
        </div>
      )}

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
          {assignableUsers && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 mb-1.5">Assignee</p>
              <AssigneeSelect
                value={assigneeId ?? null}
                options={assignableUsers.map((u) => ({ id: u.id, username: u.username, role: u.role }))}
                onChange={(id) => setAssigneeId(id)}
              />
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => createMutation.mutate({ title, description, assigneeId })}
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
