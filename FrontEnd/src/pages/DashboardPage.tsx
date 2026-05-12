import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { tasksApi } from '../api/tasks.api'
import { storiesApi } from '../api/stories.api'
import { useAuth } from '../context/AuthContext'
import { StatusBadge } from '../components/common/StatusBadge'
import { TypeBadge } from '../components/common/TypeBadge'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { timeAgo } from '../utils/timeAgo'
import type { TicketStatus } from '../types'

const BOARD_STATUSES: TicketStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED']
const STATUS_LABEL: Record<TicketStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  BLOCKED: 'Blocked',
  ASSIGNED_TO_AI: 'AI Assigned',
  NEEDS_MORE_INFO: 'Needs Info',
}
const STATUS_COL_COLOR: Record<TicketStatus, string> = {
  TODO: 'border-t-gray-300',
  IN_PROGRESS: 'border-t-blue-400',
  IN_REVIEW: 'border-t-purple-400',
  DONE: 'border-t-green-400',
  BLOCKED: 'border-t-red-400',
  ASSIGNED_TO_AI: 'border-t-yellow-400',
  NEEDS_MORE_INFO: 'border-t-orange-400',
}

export function DashboardPage() {
  const { user } = useAuth()
  const [view, setView] = useState<'list' | 'board'>('list')

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: tasksApi.getMy,
  })

  const { data: stories, isLoading: storiesLoading } = useQuery({
    queryKey: ['my-stories'],
    queryFn: storiesApi.getMy,
  })

  const isLoading = tasksLoading || storiesLoading
  const isEmpty = !isLoading && !tasks?.length && !stories?.length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Work</h1>
          <p className="text-sm text-gray-500 mt-1">Stories and tasks assigned to you</p>
        </div>
        {tasks && tasks.length > 0 && (
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'list' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:text-gray-800'}`}
            >
              List
            </button>
            <button
              onClick={() => setView('board')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'board' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Board
            </button>
          </div>
        )}
      </div>

      {isLoading && <LoadingSpinner />}

      {isEmpty && (
        <div className="text-center py-16 text-gray-400">
          <p className="mb-2">Nothing assigned to you yet.</p>
          <Link to="/projects" className="text-blue-600 hover:underline text-sm">Browse projects →</Link>
        </div>
      )}

      {/* ── LIST VIEW ─────────────────────────────────────────── */}
      {view === 'list' && (
        <>
          {stories && stories.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Stories
                <span className="ml-2 text-gray-300 normal-case font-normal tracking-normal">{stories.length}</span>
              </h2>
              <div className="space-y-3">
                {stories.map((story) => (
                  <Link
                    key={story.id}
                    to={`/stories/${story.id}`}
                    className="block bg-white border border-gray-200 rounded-xl px-5 py-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 text-xs text-gray-400">
                          <Link
                            to={`/projects/${story.projectId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-blue-600"
                          >
                            {story.projectName}
                          </Link>
                          <span className="text-gray-300">·</span>
                          <span>{timeAgo(story.createdAt)}</span>
                        </div>
                        <p className="font-medium text-gray-900 truncate">{story.title}</p>
                        {story.branch && (
                          <p className="text-xs text-gray-400 mt-1 font-mono">{story.branch}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <StatusBadge status={story.status} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {tasks && tasks.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Tasks
                <span className="ml-2 text-gray-300 normal-case font-normal tracking-normal">{tasks.length}</span>
              </h2>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <Link
                    key={task.id}
                    to={`/tasks/${task.id}`}
                    className="block bg-white border border-gray-200 rounded-xl px-5 py-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 text-xs text-gray-400">
                          <Link
                            to={`/projects/${task.projectId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-blue-600"
                          >
                            {task.projectName}
                          </Link>
                          <span>›</span>
                          <Link
                            to={`/stories/${task.storyId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-blue-600"
                          >
                            {task.storyTitle}
                          </Link>
                          <span className="text-gray-300">·</span>
                          <span>{timeAgo(task.createdAt)}</span>
                        </div>
                        <p className="font-medium text-gray-900 truncate">{task.title}</p>
                        {task.branch && (
                          <p className="text-xs text-gray-400 mt-1 font-mono">{task.branch}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <TypeBadge type={task.type} />
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── BOARD VIEW ────────────────────────────────────────── */}
      {view === 'board' && tasks && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {BOARD_STATUSES.filter((s) => tasks.some((t) => t.status === s)).map((status) => (
            <div
              key={status}
              className={`flex-shrink-0 w-64 bg-gray-50 rounded-xl border-t-4 ${STATUS_COL_COLOR[status]} shadow-sm`}
            >
              <div className="px-3 py-2.5 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">{STATUS_LABEL[status]}</span>
                <span className="text-xs font-bold text-gray-400 bg-white border border-gray-200 rounded-full px-1.5 py-0.5">
                  {tasks.filter((t) => t.status === status).length}
                </span>
              </div>
              <div className="p-2 space-y-2">
                {tasks.filter((t) => t.status === status).map((task) => (
                  <Link
                    key={task.id}
                    to={`/tasks/${task.id}`}
                    className="block bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <TypeBadge type={task.type} />
                    </div>
                    <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">{task.title}</p>
                    <p className="text-[11px] text-gray-400 mt-1.5 truncate">{task.projectName} › {task.storyTitle}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(task.createdAt)}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {user?.role === 'ADMIN' && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
          You are an Admin. Visit <Link to="/admin" className="underline">Users</Link> to manage team members.
        </div>
      )}
    </div>
  )
}
