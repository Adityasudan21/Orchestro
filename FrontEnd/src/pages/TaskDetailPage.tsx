import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../api/tasks.api'
import { commentsApi } from '../api/comments.api'
import { attachmentsApi } from '../api/attachments.api'
import { StatusBadge } from '../components/common/StatusBadge'
import { TypeBadge } from '../components/common/TypeBadge'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import type { TicketStatus } from '../types'

const STATUSES: TicketStatus[] = [
  'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED', 'ASSIGNED_TO_AI', 'NEEDS_MORE_INFO',
]

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const taskId = Number(id)
  const queryClient = useQueryClient()
  const [comment, setComment] = useState('')

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

  if (isLoading) return <LoadingSpinner />
  if (!task) return null

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-1 text-sm text-gray-400">
        <Link to="/projects" className="hover:text-blue-600">Projects</Link>
        {' › '}
        <Link to={`/projects/${task.projectId}`} className="hover:text-blue-600">
          Project #{task.projectId}
        </Link>
        {' › '}
        <Link to={`/stories/${task.storyId}`} className="hover:text-blue-600">
          {task.storyTitle}
        </Link>
        {' › '}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <TypeBadge type={task.type} />
            <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
          </div>
          <StatusBadge status={task.status} />
        </div>

        {task.description && (
          <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">{task.description}</p>
        )}

        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
          {task.assignee && (
            <>
              <span className="text-gray-400">Assignee</span>
              <span className="text-gray-700">{task.assignee.username}</span>
            </>
          )}
          {task.reporter && (
            <>
              <span className="text-gray-400">Reporter</span>
              <span className="text-gray-700">{task.reporter.username}</span>
            </>
          )}
          {task.branch && (
            <>
              <span className="text-gray-400">Branch</span>
              <span className="font-mono text-gray-700">{task.branch}</span>
            </>
          )}
          {task.commitNumber && (
            <>
              <span className="text-gray-400">Commit</span>
              <span className="font-mono text-gray-700">{task.commitNumber}</span>
            </>
          )}
          {task.gitLink && (
            <>
              <span className="text-gray-400">Git Link</span>
              <a href={task.gitLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">
                {task.gitLink}
              </a>
            </>
          )}
          <span className="text-gray-400">Created</span>
          <span className="text-gray-700">{new Date(task.createdAt).toLocaleString()}</span>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Change Status</p>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => statusMutation.mutate(s)}
                disabled={task.status === s || statusMutation.isPending}
                className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors ${
                  task.status === s
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'text-gray-600 border-gray-300 hover:border-blue-500 hover:text-blue-600'
                } disabled:opacity-50`}
              >
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          {task.status === 'ASSIGNED_TO_AI' && (
            <p className="mt-2 text-xs text-yellow-600">
              AI integration coming soon — this task will be processed by the AI agent.
            </p>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Comments</h2>
        <div className="space-y-4 mb-4">
          {comments?.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {c.user.username[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-gray-700">{c.user.username}</span>
                  <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
              </div>
            </div>
          ))}
          {comments?.length === 0 && (
            <p className="text-sm text-gray-400">No comments yet.</p>
          )}
        </div>
        <div className="flex gap-3">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment…"
            rows={2}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <button
            onClick={() => comment && commentMutation.mutate(comment)}
            disabled={!comment || commentMutation.isPending}
            className="bg-blue-600 text-white text-sm font-medium px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>

      {/* Attachments */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Attachments</h2>
        <div className="space-y-2 mb-4">
          {attachments?.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{a.fileName}</span>
              <a
                href={attachmentsApi.downloadUrl(a.id)}
                download
                className="text-blue-600 hover:underline text-xs"
              >
                Download
              </a>
            </div>
          ))}
          {attachments?.length === 0 && (
            <p className="text-sm text-gray-400">No attachments.</p>
          )}
        </div>
        <label className="cursor-pointer">
          <span className="text-sm text-blue-600 hover:underline">+ Upload file</span>
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) uploadMutation.mutate(file)
            }}
          />
        </label>
      </div>
    </div>
  )
}
