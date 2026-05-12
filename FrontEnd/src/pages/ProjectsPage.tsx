import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { projectsApi } from '../api/projects.api'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { timeAgo } from '../utils/timeAgo'

export function ProjectsPage() {
  const [search, setSearch] = useState('')
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  })

  const filtered = projects?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Projects</h1>
      </div>

      <div className="mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects…"
          className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
        />
      </div>

      {isLoading && <LoadingSpinner />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-gray-900 mb-1">{project.name}</h2>
            {project.description && (
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{project.description}</p>
            )}
            <div className="flex items-center justify-between text-xs text-gray-400">
              {project.assignee && <span>Assigned to {project.assignee.username}</span>}
              <span className="ml-auto">{timeAgo(project.createdAt)}</span>
            </div>
          </Link>
        ))}
      </div>

      {projects?.length === 0 && !isLoading && (
        <div className="text-center py-16 text-gray-400">No projects yet.</div>
      )}
      {projects && projects.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">No projects match your search.</div>
      )}
    </div>
  )
}
