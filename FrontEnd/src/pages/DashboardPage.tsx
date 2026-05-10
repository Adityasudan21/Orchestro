import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { tasksApi } from '../api/tasks.api'
import { storiesApi } from '../api/stories.api'
import { useAuth } from '../context/AuthContext'
import { StatusBadge } from '../components/common/StatusBadge'
import { TypeBadge } from '../components/common/TypeBadge'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

export function DashboardPage() {
  const { user } = useAuth()

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Work</h1>
        <p className="text-sm text-gray-500 mt-1">Stories and tasks assigned to you</p>
      </div>

      {isLoading && <LoadingSpinner />}

      {isEmpty && (
        <div className="text-center py-16 text-gray-400">
          Nothing assigned to you yet.
        </div>
      )}

      {/* Stories section */}
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

      {/* Tasks section */}
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
        </section>
      )}

      {user?.role === 'ADMIN' && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
          You are an Admin. Visit <Link to="/admin" className="underline">Users</Link> to manage team members.
        </div>
      )}
    </div>
  )
}
