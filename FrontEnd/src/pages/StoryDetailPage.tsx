import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { storiesApi } from '../api/stories.api'
import { tasksApi } from '../api/tasks.api'
import { usersApi } from '../api/users.api'
import { StatusBadge } from '../components/common/StatusBadge'
import { StatusSelect } from '../components/common/StatusSelect'
import { TypeBadge } from '../components/common/TypeBadge'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { AssigneeSelect } from '../components/common/AssigneeSelect'
import { useAuth } from '../context/AuthContext'
import type { TaskType, TicketStatus } from '../types'

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
  const [editingMeta, setEditingMeta] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
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

  const updateMetaMutation = useMutation({
    mutationFn: () => storiesApi.update(storyId, { title: editTitle, description: editDesc }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story', storyId] })
      setEditingMeta(false)
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: TicketStatus) => storiesApi.updateStatus(storyId, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['story', storyId] }),
  })

  function startEditing() {
    setEditTitle(story!.title)
    setEditDesc(story!.description ?? '')
    setEditingMeta(true)
  }

  const createMutation = useMutation({
    mutationFn: (payload: { title: string; type: TaskType; description: string; assigneeId?: number }) =>
      tasksApi.create(storyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', storyId] })
      // New task is non-DONE, so the backend may have reverted story status — re-fetch it.
      queryClient.invalidateQueries({ queryKey: ['story', storyId] })
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
        {editingMeta ? (
          <div className="flex-1 mr-4">
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
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
                disabled={!editTitle || updateMetaMutation.isPending}
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
            <h1 className="text-2xl font-bold text-gray-900">{story?.title}</h1>
            {story?.description && (
              <p className="text-sm text-gray-500 mt-1">{story.description}</p>
            )}
            <button
              onClick={startEditing}
              title="Edit title & description"
              className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 flex-shrink-0">
          {story && (() => {
            const allTasksDone = (tasks?.length ?? 0) > 0 && tasks!.every(t => t.status === 'DONE')
            return (
              <StatusSelect
                value={story.status}
                onChange={(s) => statusMutation.mutate(s)}
                disabled={statusMutation.isPending}
                disabledStatuses={allTasksDone ? [] : ['DONE']}
              />
            )
          })()}
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + New Task
          </button>
        </div>
      </div>

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
