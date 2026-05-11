import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { storiesApi } from '../api/stories.api'
import { tasksApi } from '../api/tasks.api'
import { usersApi } from '../api/users.api'
import { StatusBadge } from '../components/common/StatusBadge'
import { TypeBadge } from '../components/common/TypeBadge'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { AssigneeSelect } from '../components/common/AssigneeSelect'
import { useAuth } from '../context/AuthContext'
import type { TaskType } from '../types'

const TASK_TYPES: TaskType[] = ['DEV', 'DOC', 'BUG']

export function StoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const storyId = Number(id)
  const queryClient = useQueryClient()
  const { user: me } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<TaskType>('DEV')
  const [description, setDescription] = useState('')
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<number | undefined>()
  const canAssign = me?.role === 'ADMIN' || me?.role === 'MANAGER'

  const { data: story, isLoading: storyLoading } = useQuery({
    queryKey: ['story', storyId],
    queryFn: () => storiesApi.getById(storyId),
  })

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', storyId],
    queryFn: () => tasksApi.getByStory(storyId),
  })

  const { data: assignableUsers } = useQuery({
    queryKey: ['users', 'assignable'],
    queryFn: usersApi.getAssignable,
    enabled: canAssign,
  })

  const assignMutation = useMutation({
    mutationFn: (assigneeId: number) => storiesApi.assign(storyId, assigneeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['story', storyId] }),
  })

  const createMutation = useMutation({
    mutationFn: (payload: { title: string; type: TaskType; description: string; assigneeId?: number }) =>
      tasksApi.create(storyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', storyId] })
      setShowForm(false)
      setTitle('')
      setDescription('')
      setNewTaskAssigneeId(undefined)
    },
  })

  if (storyLoading) return <LoadingSpinner />

  return (
    <div className="p-8">
      <div className="mb-1 text-sm text-gray-400">
        <Link to="/projects" className="hover:text-blue-600">Projects</Link>
        {' › '}
        {story && (
          <Link to={`/projects/${story.projectId}`} className="hover:text-blue-600">
            {story.projectName}
          </Link>
        )}
        {' › '}
      </div>

      <div className="flex items-start justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">{story?.title}</h1>
        <div className="flex items-center gap-2">
          {story && <StatusBadge status={story.status} />}
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + New Task
          </button>
        </div>
      </div>

      {story?.description && (
        <p className="text-sm text-gray-500 mb-2">{story.description}</p>
      )}

      <div className="flex items-center gap-3 mb-6">
        <span className="text-xs text-gray-500">Assignee</span>
        {canAssign && assignableUsers ? (
          <AssigneeSelect
            value={story?.assignee?.id ?? null}
            options={assignableUsers}
            onChange={(id) => assignMutation.mutate(id)}
            disabled={assignMutation.isPending}
          />
        ) : (
          <span className="text-xs text-gray-700">{story?.assignee?.username ?? 'Unassigned'}</span>
        )}
      </div>

      {showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Create Task</h2>
          <input
            autoFocus
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2 mb-3">
            {TASK_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1 text-xs rounded-full font-medium border transition-colors ${
                  type === t
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none resize-none focus:ring-2 focus:ring-blue-500"
          />
          {canAssign && assignableUsers && (
            <div className="mb-3 flex items-center gap-2">
              <p className="text-xs font-medium text-gray-500">Assignee</p>
              <AssigneeSelect
                value={newTaskAssigneeId ?? null}
                options={assignableUsers}
                onChange={(id) => setNewTaskAssigneeId(id)}
                disabled={createMutation.isPending}
              />
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => createMutation.mutate({ title, type, description, assigneeId: newTaskAssigneeId })}
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

      {tasksLoading && <LoadingSpinner />}

      <div className="space-y-3">
        {tasks?.map((task) => (
          <Link
            key={task.id}
            to={`/tasks/${task.id}`}
            className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-4 hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TypeBadge type={task.type} />
                <span className="font-medium text-gray-900">{task.title}</span>
              </div>
              {task.assignee && (
                <p className="text-xs text-gray-400">Assigned to {task.assignee.username}</p>
              )}
            </div>
            <StatusBadge status={task.status} />
          </Link>
        ))}
        {tasks?.length === 0 && !tasksLoading && (
          <div className="text-center py-12 text-gray-400">No tasks yet. Create one above.</div>
        )}
      </div>
    </div>
  )
}
