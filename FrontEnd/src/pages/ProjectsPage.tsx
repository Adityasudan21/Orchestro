import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { projectsApi } from '../api/projects.api'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

export function ProjectsPage() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Projects</h1>
      </div>

      {isLoading && <LoadingSpinner />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects?.map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-gray-900 mb-1">{project.name}</h2>
            {project.description && (
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{project.description}</p>
            )}
            <div className="flex items-center justify-end text-xs text-gray-400">
              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
      </div>

      {projects?.length === 0 && !isLoading && (
        <div className="text-center py-16 text-gray-400">No projects yet.</div>
      )}
    </div>
  )
}
