import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { storiesApi } from '../api/stories.api'
import { tasksApi } from '../api/tasks.api'
import { commentsApi } from '../api/comments.api'
import { attachmentsApi } from '../api/attachments.api'
import { usersApi } from '../api/users.api'
import { StatusBadge } from '../components/common/StatusBadge'
import { StatusSelect } from '../components/common/StatusSelect'
import { TypeBadge } from '../components/common/TypeBadge'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { AssigneeSelect } from '../components/common/AssigneeSelect'
import { useAuth } from '../context/AuthContext'
import type { TaskType, TicketStatus } from '../types'

const TASK_TYPES: TaskType[] = ['DEV', 'DOC', 'BUG']

function initials(name?: string | null) {
  return (name?.[0] ?? '?').toUpperCase()
}

function AvatarChip({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-700">
      <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center font-bold text-[10px]">
        {initials(name)}
      </span>
      {name}
    </span>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 text-xs">
      <span className="text-gray-500">{label}</span>
      <span>{children}</span>
    </div>
  )
}

export function StoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const storyId = Number(id)
  const queryClient = useQueryClient()
  const { user: me } = useAuth()
  const [comment, setComment] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<TaskType>('DEV')
  const [description, setDescription] = useState('')
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<number | undefined>()
  const [editingMeta, setEditingMeta] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const canAssign = me?.role === 'ADMIN' || me?.role === 'MANAGER'

  const { data: story, isLoading } = useQuery({
    queryKey: ['story', storyId],
    queryFn: () => storiesApi.getById(storyId),
  })

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', storyId],
    queryFn: () => tasksApi.getByStory(storyId),
  })

  const { data: comments } = useQuery({
    queryKey: ['comments', 'story', storyId],
    queryFn: () => commentsApi.getByStory(storyId),
  })

  const { data: attachments } = useQuery({
    queryKey: ['attachments', 'story', storyId],
    queryFn: () => attachmentsApi.getByStory(storyId),
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

  const reporterMutation = useMutation({
    mutationFn: (assigneeId: number) => storiesApi.assignReporter(storyId, assigneeId),
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

  const commentMutation = useMutation({
    mutationFn: (content: string) => commentsApi.addToStory(storyId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'story', storyId] })
      setComment('')
    },
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => attachmentsApi.uploadToStory(storyId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attachments', 'story', storyId] }),
  })

  const createMutation = useMutation({
    mutationFn: (payload: { title: string; type: TaskType; description: string; assigneeId?: number }) =>
      tasksApi.create(storyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', storyId] })
      queryClient.invalidateQueries({ queryKey: ['story', storyId] })
      setShowForm(false)
      setTitle('')
      setDescription('')
      setNewTaskAssigneeId(undefined)
    },
  })

  function startEditing() {
    setEditTitle(story!.title)
    setEditDesc(story!.description ?? '')
    setEditingMeta(true)
  }

  if (isLoading) return <LoadingSpinner />
  if (!story) return null

  const allTasksDone = (tasks?.length ?? 0) > 0 && tasks!.every(t => t.status === 'DONE')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] h-full bg-[#F8F8F6]">
      {/* LEFT */}
      <section className="flex flex-col lg:border-r border-gray-200 h-full overflow-hidden">

        {/* Zone 1 — Static header: breadcrumb + title + activity */}
        <div className="px-8 pt-7 pb-3 flex-shrink-0">
          {/* Breadcrumb */}
          <div className="text-sm text-gray-400 mb-4">
            <Link to="/my-projects" className="hover:text-blue-600">My Projects</Link>
            {' / '}
            <Link to={`/projects/${story.projectId}`} className="hover:text-blue-600">{story.projectName}</Link>
            {' / '}
            <span className="text-gray-900 font-semibold text-xs">Story #{storyId}</span>
          </div>

          {/* Title + edit */}
          {editingMeta ? (
            <div className="mb-4">
              <input
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-2xl font-semibold tracking-tight text-gray-900 border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={3}
                className="w-full text-sm text-gray-700 border border-gray-300 rounded-lg px-3 py-2 mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="group relative mb-4">
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900 leading-tight">{story.title}</h1>
              {story.description && (
                <p className="text-sm text-gray-700 leading-relaxed max-w-[640px] mt-3 whitespace-pre-wrap">{story.description}</p>
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

          {/* Activity */}
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Activity</h2>
          {story.reporter && (
            <div className="flex items-center gap-2.5 py-1 text-sm text-gray-500">
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white inline-flex items-center justify-center text-[11px] flex-shrink-0">●</span>
              <span className="flex-1"><b className="text-gray-700">{story.reporter.username}</b> created this story</span>
              <span className="text-[11px] text-gray-400">{new Date(story.createdAt).toLocaleDateString()}</span>
            </div>
          )}
          {story.assignee && (
            <div className="flex items-center gap-2.5 py-1 text-sm text-gray-500">
              <span className="w-5 h-5 rounded-full bg-purple-500 text-white inline-flex items-center justify-center text-[11px] flex-shrink-0">→</span>
              <span className="flex-1">assigned to <b className="text-gray-700">{story.assignee.username}</b></span>
            </div>
          )}
        </div>

        {/* Zone 2 — Rigid comment section: fixed height, internally scrollable */}
        <div className="mx-8 flex-shrink-0 h-52 overflow-y-auto border border-gray-200 rounded-xl bg-white p-3">
          <div className="space-y-3">
            {comments?.map((c) => (
              <div key={c.id} className="flex gap-2.5 py-1.5">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {initials(c.user.username)}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-gray-900">{c.user.username}</span>
                    <span className="text-[11px] text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mt-1 whitespace-pre-wrap">{c.content}</p>
                </div>
              </div>
            ))}
            {comments?.length === 0 && (
              <p className="text-sm text-gray-400 italic">No comments yet.</p>
            )}
          </div>
        </div>

        {/* Zone 3 — Pinned comment bar */}
        <div className="px-8 py-4 border-t border-gray-200 bg-[#F8F8F6] flex-shrink-0">
          <div className="flex gap-2.5 items-start">
            <div className="w-7 h-7 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {initials(me?.username)}
            </div>
            <div className="flex-1 border border-gray-200 rounded-xl bg-white p-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Leave a comment…"
                rows={2}
                className="w-full border-0 outline-none resize-none text-sm placeholder-gray-400 bg-transparent"
              />
              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  onClick={() => comment && commentMutation.mutate(comment)}
                  disabled={!comment || commentMutation.isPending}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-md transition-colors"
                >
                  Comment
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Zone 4 — Tasks: takes remaining height, scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto px-8 py-5 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Tasks {tasks && tasks.length > 0 && <span className="ml-1 normal-case font-normal tracking-normal text-gray-400">{tasks.length}</span>}
            </h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700"
            >
              + New Task
            </button>
          </div>

          {showForm && (
            <div className="mb-4 bg-white border border-gray-200 rounded-xl p-4">
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
                      type === t ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300 hover:border-blue-400'
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

          <div className="space-y-2">
            {tasks?.map((task) => (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TypeBadge type={task.type} />
                    <span className="font-medium text-gray-900 text-sm">{task.title}</span>
                  </div>
                  {task.assignee && (
                    <p className="text-xs text-gray-400">Assigned to {task.assignee.username}</p>
                  )}
                </div>
                <StatusBadge status={task.status} />
              </Link>
            ))}
            {tasks?.length === 0 && !tasksLoading && (
              <div className="text-center py-8 text-gray-400 text-sm">No tasks yet.</div>
            )}
          </div>
        </div>
      </section>

      {/* RIGHT — properties */}
      <aside className="px-6 py-7 overflow-auto bg-[#FAFAF8]">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2.5">Properties</h2>

        <Row label="Status">
          <StatusSelect
            value={story.status}
            onChange={(s) => statusMutation.mutate(s)}
            disabled={statusMutation.isPending}
            disabledStatuses={allTasksDone ? [] : ['DONE']}
          />
        </Row>

        <Row label="Assignee">
          {canAssign && assignableUsers ? (
            <AssigneeSelect
              value={story.assignee?.id ?? null}
              options={assignableUsers}
              onChange={(id) => assignMutation.mutate(id)}
              disabled={assignMutation.isPending}
            />
          ) : (
            <AvatarChip name={story.assignee?.username ?? 'Unassigned'} />
          )}
        </Row>

        <Row label="Reporter">
          {canAssign && assignableUsers ? (
            <AssigneeSelect
              value={story.reporter?.id ?? null}
              options={assignableUsers}
              onChange={(id) => reporterMutation.mutate(id)}
              disabled={reporterMutation.isPending}
            />
          ) : (
            <AvatarChip name={story.reporter?.username ?? '—'} />
          )}
        </Row>

        <Row label="Project">
          <Link to={`/projects/${story.projectId}`} className="text-blue-600 hover:underline text-xs font-medium truncate max-w-[160px]">
            {story.projectName}
          </Link>
        </Row>

        {(story.branch || story.commitNumber || story.gitLink) && (
          <>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mt-6 mb-2.5">Git</h2>
            {story.branch && (
              <Row label="Branch"><span className="font-mono text-xs text-gray-700">{story.branch}</span></Row>
            )}
            {story.commitNumber && (
              <Row label="Commit"><span className="font-mono text-xs text-gray-700">{story.commitNumber}</span></Row>
            )}
            {story.gitLink && (
              <Row label="Link">
                <a href={story.gitLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs font-medium">Open ↗</a>
              </Row>
            )}
          </>
        )}

        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mt-6 mb-2.5">Attachments</h2>
        {attachments?.map((a) => (
          <div key={a.id} className="flex items-center justify-between py-2 text-xs text-gray-700 border-b border-dashed border-gray-200 last:border-b-0">
            <span className="truncate">📎 {a.fileName}</span>
            <a href={attachmentsApi.downloadUrl(a.id)} download className="text-blue-600 hover:underline text-[11px] flex-shrink-0 ml-2">
              Download
            </a>
          </div>
        ))}
        {attachments?.length === 0 && <p className="text-xs text-gray-400 italic">None yet.</p>}
        <label className="inline-block mt-3 cursor-pointer text-blue-600 hover:underline text-xs font-medium">
          + Upload file
          <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMutation.mutate(f) }} />
        </label>
      </aside>
    </div>
  )
}
