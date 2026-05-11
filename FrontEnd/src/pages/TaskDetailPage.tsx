import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../api/tasks.api'
import { commentsApi } from '../api/comments.api'
import { attachmentsApi } from '../api/attachments.api'
import { usersApi } from '../api/users.api'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { AssigneeSelect } from '../components/common/AssigneeSelect'
import { useAuth } from '../context/AuthContext'
import { statusLabel, typeColors } from '../utils/statusColors'
import type { TicketStatus, TaskType } from '../types'

const STATUSES: TicketStatus[] = [
  'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED', 'ASSIGNED_TO_AI', 'NEEDS_MORE_INFO',
]

const TYPES: TaskType[] = ['DEV', 'DOC', 'BUG']

const TYPE_GLYPH: Record<TaskType, string> = { DEV: '◆', DOC: '✎', BUG: '●' }

const statusDot: Record<TicketStatus, string> = {
  TODO: 'bg-gray-400',
  IN_PROGRESS: 'bg-blue-500',
  IN_REVIEW: 'bg-purple-500',
  DONE: 'bg-green-500',
  BLOCKED: 'bg-red-500',
  ASSIGNED_TO_AI: 'bg-yellow-500',
  NEEDS_MORE_INFO: 'bg-orange-500',
}

const statusPillBg: Record<TicketStatus, string> = {
  TODO: 'bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-300',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300',
  IN_REVIEW: 'bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-300',
  DONE: 'bg-green-50 text-green-700 border-green-200 hover:border-green-300',
  BLOCKED: 'bg-red-50 text-red-700 border-red-200 hover:border-red-300',
  ASSIGNED_TO_AI: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:border-yellow-300',
  NEEDS_MORE_INFO: 'bg-orange-50 text-orange-700 border-orange-200 hover:border-orange-300',
}

function StatusSelect({ value, onChange, disabled }: { value: TicketStatus; onChange: (s: TicketStatus) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-colors disabled:opacity-50 ${statusPillBg[value]}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${statusDot[value]}`}></span>
        {statusLabel[value]}
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="opacity-60"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-lg border border-gray-200 bg-white shadow-lg shadow-slate-900/10 py-1 overflow-hidden">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { onChange(s); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-slate-50 transition-colors ${s === value ? 'bg-slate-50 font-semibold text-slate-900' : 'text-gray-700'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusDot[s]}`}></span>
              <span className="flex-1">{statusLabel[s]}</span>
              {s === value && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L5 9.5L10 3" stroke="#3B5BDB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function TypeSelect({ value, onChange, disabled }: { value: TaskType; onChange: (t: TaskType) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-gray-200 bg-white hover:border-gray-300 text-xs text-gray-900 transition-colors disabled:opacity-50"
      >
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${typeColors[value]}`}>
          {TYPE_GLYPH[value]} {value}
        </span>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="opacity-60"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border border-gray-200 bg-white shadow-lg shadow-slate-900/10 py-1 overflow-hidden">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { onChange(t); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-slate-50 transition-colors ${t === value ? 'bg-slate-50 font-semibold' : 'text-gray-700'}`}
            >
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${typeColors[t]}`}>
                {TYPE_GLYPH[t]} {t}
              </span>
              {t === value && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto"><path d="M2 6.5L5 9.5L10 3" stroke="#3B5BDB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function initials(name?: string | null) {
  return (name?.[0] ?? '?').toUpperCase()
}

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const taskId = Number(id)
  const queryClient = useQueryClient()
  const { user: me } = useAuth()
  const [comment, setComment] = useState('')
  const canAssign = me?.role === 'ADMIN' || me?.role === 'MANAGER'

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksApi.getById(taskId),
  })

  const { data: comments } = useQuery({
    queryKey: ['comments', 'task', taskId],
    queryFn: () => commentsApi.getByTask(taskId),
  })

  const { data: attachments } = useQuery({
    queryKey: ['attachments', 'task', taskId],
    queryFn: () => attachmentsApi.getByTask(taskId),
  })

  const statusMutation = useMutation({
    mutationFn: (status: TicketStatus) => tasksApi.updateStatus(taskId, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task', taskId] }),
  })

  const commentMutation = useMutation({
    mutationFn: (content: string) => commentsApi.addToTask(taskId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'task', taskId] })
      setComment('')
    },
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => attachmentsApi.uploadToTask(taskId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attachments', 'task', taskId] }),
  })

  const { data: assignableUsers } = useQuery({
    queryKey: ['users', 'assignable'],
    queryFn: usersApi.getAssignable,
    enabled: canAssign,
  })

  const assignMutation = useMutation({
    mutationFn: (assigneeId: number) => tasksApi.assign(taskId, assigneeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task', taskId] }),
  })

  const typeMutation = useMutation({
    mutationFn: (type: string) => tasksApi.updateType(taskId, type),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task', taskId] }),
  })

  if (isLoading) return <LoadingSpinner />
  if (!task) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] h-full bg-[#F8F8F6]">
      {/* LEFT — content */}
      <section className="px-8 py-7 overflow-auto lg:border-r border-gray-200">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-400 mb-4">
          <Link to="/projects" className="hover:text-blue-600">Projects</Link>
          {' / '}
          <Link to={`/projects/${task.projectId}`} className="hover:text-blue-600">Project #{task.projectId}</Link>
          {' / '}
          <Link to={`/stories/${task.storyId}`} className="hover:text-blue-600">{task.storyTitle}</Link>
          {' / '}
          <span className="text-gray-900 font-semibold font-mono text-xs">{task.type}-{task.id}</span>
        </div>

        {/* Top meta row */}
        <div className="flex items-center gap-2.5 mb-3 text-xs font-mono">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded ${typeColors[task.type]} font-bold`}>
            {TYPE_GLYPH[task.type]} {task.type}-{task.id}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-gray-300 bg-white text-gray-600 text-[11px] font-semibold">
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot[task.status]}`}></span>
            {statusLabel[task.status]}
          </span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500">Created {new Date(task.createdAt).toLocaleString()}</span>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 leading-tight mb-4">{task.title}</h1>

        {task.description && (
          <p className="text-sm text-gray-700 leading-relaxed max-w-[640px] mb-8 whitespace-pre-wrap">
            {task.description}
          </p>
        )}

        {/* Activity & comments */}
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Activity</h2>

        {task.reporter && (
          <div className="flex items-center gap-2.5 py-1.5 text-sm text-gray-500">
            <span className="w-5 h-5 rounded-full bg-blue-500 text-white inline-flex items-center justify-center text-[11px]">●</span>
            <span className="flex-1"><b className="text-gray-700">{task.reporter.username}</b> created this task</span>
            <span className="text-[11px] text-gray-400">{new Date(task.createdAt).toLocaleDateString()}</span>
          </div>
        )}
        {task.assignee && (
          <div className="flex items-center gap-2.5 py-1.5 text-sm text-gray-500">
            <span className="w-5 h-5 rounded-full bg-purple-500 text-white inline-flex items-center justify-center text-[11px]">→</span>
            <span className="flex-1">assigned to <b className="text-gray-700">{task.assignee.username}</b></span>
          </div>
        )}

        <div className="space-y-3 mt-4">
          {comments?.map((c) => (
            <div key={c.id} className="flex gap-2.5 py-2">
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

        {/* New comment */}
        <div className="flex gap-2.5 mt-5 items-start">
          <div className="w-7 h-7 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            {initials(me?.username)}
          </div>
          <div className="flex-1 border border-gray-200 rounded-xl bg-white p-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a comment, @mention or paste a link…"
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
      </section>

      {/* RIGHT — properties dock */}
      <aside className="px-6 py-7 overflow-auto bg-[#FAFAF8]">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2.5">Properties</h2>

        <Row label="Status">
          <StatusSelect
            value={task.status}
            onChange={(s) => statusMutation.mutate(s)}
            disabled={statusMutation.isPending}
          />
        </Row>

        <Row label="Assignee">
          {canAssign && assignableUsers ? (
            <AssigneeSelect
              value={task.assignee?.id ?? null}
              options={assignableUsers}
              onChange={(id) => assignMutation.mutate(id)}
              disabled={assignMutation.isPending}
            />
          ) : (
            <AvatarChip name={task.assignee?.username ?? 'Unassigned'} />
          )}
        </Row>

        <Row label="Reporter"><AvatarChip name={task.reporter?.username ?? '—'} /></Row>

        <Row label="Type">
          <TypeSelect
            value={task.type}
            onChange={(t) => typeMutation.mutate(t)}
            disabled={typeMutation.isPending}
          />
        </Row>

        <Row label="Story">
          <Link to={`/stories/${task.storyId}`} className="text-blue-600 hover:underline text-xs font-medium truncate max-w-[160px]">
            {task.storyTitle}
          </Link>
        </Row>

        {(task.branch || task.commitNumber || task.gitLink) && (
          <>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mt-6 mb-2.5">Git</h2>
            {task.branch && (
              <Row label="Branch"><span className="font-mono text-xs text-gray-700">{task.branch}</span></Row>
            )}
            {task.commitNumber && (
              <Row label="Commit"><span className="font-mono text-xs text-gray-700">{task.commitNumber}</span></Row>
            )}
            {task.gitLink && (
              <Row label="Link">
                <a href={task.gitLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs font-medium">Open ↗</a>
              </Row>
            )}
          </>
        )}

        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mt-6 mb-2.5">Attachments</h2>
        {attachments?.map((a) => (
          <div key={a.id} className="flex items-center justify-between py-2 text-xs text-gray-700 border-b border-dashed border-gray-200 last:border-b-0">
            <span className="truncate">📎 {a.fileName}</span>
            <a
              href={attachmentsApi.downloadUrl(a.id)}
              download
              className="text-blue-600 hover:underline text-[11px] flex-shrink-0 ml-2"
            >
              Download
            </a>
          </div>
        ))}
        {attachments?.length === 0 && (
          <p className="text-xs text-gray-400 italic">None yet.</p>
        )}
        <label className="inline-block mt-3 cursor-pointer text-blue-600 hover:underline text-xs font-medium">
          + Upload file
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) uploadMutation.mutate(file)
            }}
          />
        </label>

        {task.status === 'ASSIGNED_TO_AI' && (
          <p className="mt-6 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md p-2.5 leading-relaxed">
            AI integration coming soon — this task will be processed by the AI agent.
          </p>
        )}
      </aside>
    </div>
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
