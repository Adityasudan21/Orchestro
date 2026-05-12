import { useState } from 'react'
import { MentionTextarea } from '../components/common/MentionTextarea'
import { CommentText } from '../components/common/CommentText'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { storiesApi } from '../api/stories.api'
import { tasksApi } from '../api/tasks.api'
import { commentsApi } from '../api/comments.api'
import { attachmentsApi } from '../api/attachments.api'
import { usersApi } from '../api/users.api'
import { activityApi } from '../api/activity.api'
import { StatusBadge } from '../components/common/StatusBadge'
import { StatusSelect } from '../components/common/StatusSelect'
import { TypeBadge } from '../components/common/TypeBadge'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { AssigneeSelect } from '../components/common/AssigneeSelect'
import { Pagination } from '../components/common/Pagination'
import { useAuth } from '../context/AuthContext'
import type { TaskType, TicketStatus } from '../types'
import { timeAgo } from '../utils/timeAgo'

const TASK_TYPES: TaskType[] = ['DEV', 'DOC', 'BUG']
const TASK_PAGE_SIZE = 10

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
  const navigate = useNavigate()
  const { user: me } = useAuth()
  const [comment, setComment] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<TaskType>('DEV')
  const [description, setDescription] = useState('')
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<number | undefined>()
  const [editingMeta, setEditingMeta] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editCommentText, setEditCommentText] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [taskSearch, setTaskSearch] = useState('')
  const [taskTypeFilter, setTaskTypeFilter] = useState<TaskType | ''>('')
  const [taskStatusFilter, setTaskStatusFilter] = useState<TicketStatus | ''>('')
  const [taskPage, setTaskPage] = useState(0)
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

  const { data: activityLogs } = useQuery({
    queryKey: ['activity', 'story', storyId],
    queryFn: () => activityApi.getForStory(storyId),
  })

  const { data: assignableUsers } = useQuery({
    queryKey: ['users', 'assignable'],
    queryFn: usersApi.getAssignable,
  })

  const assignMutation = useMutation({
    mutationFn: (assigneeId: number) => storiesApi.assign(storyId, assigneeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story', storyId] })
      queryClient.invalidateQueries({ queryKey: ['activity', 'story', storyId] })
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story', storyId] })
      queryClient.invalidateQueries({ queryKey: ['activity', 'story', storyId] })
    },
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

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => commentsApi.deleteComment(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', 'story', storyId] }),
  })

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      commentsApi.updateComment(commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'story', storyId] })
      setEditingCommentId(null)
    },
  })

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: number) => attachmentsApi.deleteAttachment(attachmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attachments', 'story', storyId] }),
  })

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: number) => tasksApi.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', storyId] })
      queryClient.invalidateQueries({ queryKey: ['story', storyId] })
    },
  })

  const deleteStoryMutation = useMutation({
    mutationFn: () => storiesApi.deleteStory(storyId),
    onSuccess: () => navigate(`/projects/${story?.projectId}`),
  })

  function startEditing() {
    setEditTitle(story!.title)
    setEditDesc(story!.description ?? '')
    setEditingMeta(true)
  }

  if (isLoading) return <LoadingSpinner />
  if (!story) return null

  const allTasksDone = (tasks?.length ?? 0) > 0 && tasks!.every(t => t.status === 'DONE')

  const filteredTasks = tasks?.filter((t) => {
    const q = taskSearch.toLowerCase()
    if (q && !t.title.toLowerCase().includes(q)) return false
    if (taskTypeFilter && t.type !== taskTypeFilter) return false
    if (taskStatusFilter && t.status !== taskStatusFilter) return false
    return true
  }) ?? []
  const taskTotalPages = Math.ceil(filteredTasks.length / TASK_PAGE_SIZE)
  const pagedTasks = filteredTasks.slice(taskPage * TASK_PAGE_SIZE, (taskPage + 1) * TASK_PAGE_SIZE)

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
              <span className="text-[11px] text-gray-400">{timeAgo(story.createdAt)}</span>
            </div>
          )}
          {story.assignee && (
            <div className="flex items-center gap-2.5 py-1 text-sm text-gray-500">
              <span className="w-5 h-5 rounded-full bg-purple-500 text-white inline-flex items-center justify-center text-[11px] flex-shrink-0">→</span>
              <span className="flex-1">assigned to <b className="text-gray-700">{story.assignee.username}</b></span>
            </div>
          )}
          {activityLogs && activityLogs.length > 0 && (
            <div className="mt-2 space-y-1.5 border-l-2 border-gray-100 ml-2.5 pl-3">
              {activityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-xs text-gray-500">
                  <span className="text-gray-400 flex-shrink-0">{timeAgo(log.createdAt)}</span>
                  <span>
                    {log.actorUsername && <b className="text-gray-700">{log.actorUsername}</b>}
                    {' '}{log.action === 'STATUS_CHANGED' ? 'changed status:' : log.action === 'ASSIGNED' ? 'reassigned:' : log.action.toLowerCase() + ':'}
                    {' '}<span className="text-gray-600">{log.detail}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zone 2 — Rigid comment section: fixed height, internally scrollable */}
        <div className="mx-8 flex-shrink-0 h-52 overflow-y-auto border border-gray-200 rounded-xl bg-white p-3">
          <div className="space-y-3">
            {comments?.map((c) => (
              <div key={c.id} className="group flex gap-2.5 py-1.5">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {initials(c.user.username)}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-gray-900">{c.user.username}</span>
                    <span className="text-[11px] text-gray-400">{timeAgo(c.createdAt)}</span>
                    {(c.user.username === me?.username || me?.role === 'ADMIN') && (
                      <span className="ml-auto opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                        <button onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.content) }} className="text-[11px] text-gray-400 hover:text-blue-600 px-1">Edit</button>
                        <button onClick={() => deleteCommentMutation.mutate(c.id)} className="text-[11px] text-gray-400 hover:text-red-600 px-1">Delete</button>
                      </span>
                    )}
                  </div>
                  {editingCommentId === c.id ? (
                    <div className="mt-1">
                      <textarea
                        value={editCommentText}
                        onChange={(e) => setEditCommentText(e.target.value)}
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => updateCommentMutation.mutate({ commentId: c.id, content: editCommentText })}
                          disabled={!editCommentText || updateCommentMutation.isPending}
                          className="bg-slate-900 text-white text-[11px] font-semibold px-3 py-1 rounded-md hover:bg-slate-800 disabled:opacity-50"
                        >Save</button>
                        <button onClick={() => setEditingCommentId(null)} className="text-[11px] text-gray-500 px-2 hover:text-gray-700">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <CommentText content={c.content} />
                  )}
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
              <MentionTextarea
                value={comment}
                onChange={setComment}
                placeholder="Leave a comment, @mention or paste a link…"
                rows={2}
                className="w-full border-0 outline-none resize-none text-sm placeholder-gray-400 bg-transparent"
                users={assignableUsers ?? []}
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
              Tasks {tasks && tasks.length > 0 && <span className="ml-1 normal-case font-normal tracking-normal text-gray-400">{filteredTasks.length !== tasks.length ? `${filteredTasks.length}/` : ''}{tasks.length}</span>}
            </h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700"
            >
              + New Task
            </button>
          </div>

          {/* Search & filter bar */}
          <div className="flex gap-2 mb-3">
            <input
              value={taskSearch}
              onChange={(e) => { setTaskSearch(e.target.value); setTaskPage(0) }}
              placeholder="Search tasks…"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
            />
            <select
              value={taskTypeFilter}
              onChange={(e) => { setTaskTypeFilter(e.target.value as TaskType | ''); setTaskPage(0) }}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All types</option>
              {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              value={taskStatusFilter}
              onChange={(e) => { setTaskStatusFilter(e.target.value as TicketStatus | ''); setTaskPage(0) }}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
              <option value="BLOCKED">Blocked</option>
            </select>
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
            {pagedTasks.map((task) => (
              <div key={task.id} className="group relative flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:shadow-md transition-shadow">
                <Link to={`/tasks/${task.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <TypeBadge type={task.type} />
                    <span className="font-medium text-gray-900 text-sm">{task.title}</span>
                  </div>
                  {task.assignee && (
                    <p className="text-xs text-gray-400">Assigned to {task.assignee.username}</p>
                  )}
                </Link>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <StatusBadge status={task.status} />
                  {canAssign && (
                    <button
                      onClick={(e) => { e.preventDefault(); if (confirm('Delete this task?')) deleteTaskMutation.mutate(task.id) }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50"
                      title="Delete task"
                    >
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V3h4v1M5 4l1 9h4l1-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {tasks?.length === 0 && !tasksLoading && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No tasks yet.{canAssign && <span> Click <b>+ New Task</b> to add one.</span>}
              </div>
            )}
            {tasks && tasks.length > 0 && filteredTasks.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-sm">No tasks match the current filters.</div>
            )}
          </div>
          <Pagination page={taskPage} totalPages={taskTotalPages} onPageChange={setTaskPage} />
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
          <div key={a.id} className="group flex items-center justify-between py-2 text-xs text-gray-700 border-b border-dashed border-gray-200 last:border-b-0">
            <span className="truncate">📎 {a.fileName}</span>
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              <a href={attachmentsApi.downloadUrl(a.id)} download className="text-blue-600 hover:underline text-[11px]">Download</a>
              {(a.uploadedBy.username === me?.username || me?.role === 'ADMIN') && (
                <button onClick={() => { if (confirm('Delete this attachment?')) deleteAttachmentMutation.mutate(a.id) }} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500 p-0.5 rounded">
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V3h4v1M5 4l1 9h4l1-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              )}
            </div>
          </div>
        ))}
        {attachments?.length === 0 && <p className="text-xs text-gray-400 italic">None yet.</p>}
        <label className="inline-block mt-3 cursor-pointer text-blue-600 hover:underline text-xs font-medium">
          + Upload file
          <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMutation.mutate(f) }} />
        </label>

        {canAssign && (
          <div className="mt-8 pt-5 border-t border-gray-200">
            <button
              onClick={() => { if (confirm('Delete this story and all its tasks? This cannot be undone.')) deleteStoryMutation.mutate() }}
              disabled={deleteStoryMutation.isPending}
              className="w-full text-xs text-red-600 border border-red-200 rounded-lg py-2 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deleteStoryMutation.isPending ? 'Deleting…' : 'Delete Story'}
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
