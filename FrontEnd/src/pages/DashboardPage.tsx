import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { tasksApi } from '../api/tasks.api'
import { useAuth } from '../context/AuthContext'
import { StatusBadge } from '../components/common/StatusBadge'
import { TypeBadge } from '../components/common/TypeBadge'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

export function DashboardPage() {
  const { user, logout } = useAuth()
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: tasksApi.getMy,
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Work</h1>
          <p className="text-sm text-gray-500 mt-1">Tasks assigned to you</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Sign out
        </button>
      </div>

      {isLoading && <LoadingSpinner />}

      {tasks?.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          No tasks assigned to you yet.
        </div>
      )}

      {tasks && tasks.length > 0 && (
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
                      Project #{task.projectId}
                    </Link>
                    <span>›</span>
                    <Link
                      to={`/stories/${task.storyId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-blue-600"
                    >
                      {task.storyTitle}
                    </Link>
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
      )}

      {user?.role === 'ADMIN' && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
          You are an Admin. Visit <Link to="/admin" className="underline">Users</Link> to manage team members.
        </div>
      )}
    </div>
  )
}
