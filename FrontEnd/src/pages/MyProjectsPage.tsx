import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { projectsApi } from '../api/projects.api'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { timeAgo } from '../utils/timeAgo'
import type { Project, User } from '../types'

// ─── helpers ─────────────────────────────────────────────────────────────

const MONOGRAM_PALETTE = [
  { bg: 'bg-indigo-100', fg: 'text-indigo-700' },
  { bg: 'bg-amber-100',  fg: 'text-amber-700' },
  { bg: 'bg-emerald-100',fg: 'text-emerald-700' },
  { bg: 'bg-rose-100',   fg: 'text-rose-700' },
  { bg: 'bg-sky-100',    fg: 'text-sky-700' },
  { bg: 'bg-violet-100', fg: 'text-violet-700' },
  { bg: 'bg-teal-100',   fg: 'text-teal-700' },
] as const

function paletteFor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return MONOGRAM_PALETTE[Math.abs(h) % MONOGRAM_PALETTE.length]
}

const AVATAR_PALETTE = [
  'bg-blue-600', 'bg-purple-600', 'bg-emerald-600',
  'bg-rose-500', 'bg-amber-500',  'bg-sky-600',
] as const

function avatarColor(username: string) {
  let h = 0
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) | 0
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

// ─── page ────────────────────────────────────────────────────────────────

export function MyProjectsPage() {
  const [search, setSearch] = useState('')

  const { data: projects, isLoading } = useQuery({
    queryKey: ['my-projects'],
    queryFn: projectsApi.getMy,
  })

  const filtered = projects?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">Projects where you have an assigned story or task</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            width="14" height="14" viewBox="0 0 16 16" fill="none"
          >
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 placeholder-gray-400"
          />
        </div>
      </div>

      {isLoading && <LoadingSpinner />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {projects?.length === 0 && !isLoading && (
        <div className="text-center py-16 text-gray-400 text-sm">
          No projects assigned to you yet.
        </div>
      )}
      {projects && projects.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">No projects match your search.</div>
      )}
    </div>
  )
}

// ─── card ────────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: Project }) {
  const palette = paletteFor(project.name)
  const monogram = (project.name[0] ?? '?').toUpperCase()
  const members: User[] = project.members ?? []
  const visibleMembers = members.slice(0, 3)
  const overflow = Math.max(0, members.length - visibleMembers.length)

  const hasProgress = false
  const doneCount = 0
  const totalCount = 0

  return (
    <Link
      to={`/projects/${project.id}`}
      className="group block bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all"
    >
      {/* Top: monogram + name + description + age */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-9 h-9 rounded-lg ${palette.bg} ${palette.fg} inline-flex items-center justify-center font-bold text-sm shrink-0`}
        >
          {monogram}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
            {project.name}
          </h2>
          <p className={`text-xs truncate ${project.description ? 'text-gray-500' : 'text-gray-400 italic'}`}>
            {project.description || 'No description'}
          </p>
        </div>
        <span className="text-[10px] text-gray-400 font-mono shrink-0">
          {timeAgo(project.createdAt)}
        </span>
      </div>

      {/* Progress strip */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
          {hasProgress && totalCount > 0 && (
            <div
              className="h-full bg-green-500"
              style={{ width: `${(doneCount / totalCount) * 100}%` }}
            />
          )}
        </div>
        <span className="font-mono text-[10px] text-gray-400">
          {totalCount > 0 ? `${doneCount}/${totalCount}` : '—'}
        </span>
      </div>

      {/* Bottom: member avatars + created by */}
      <div className="flex items-center justify-between min-h-[24px]">
        {visibleMembers.length > 0 ? (
          <div className="flex -space-x-1.5">
            {visibleMembers.map((u) => (
              <span
                key={u.id}
                title={u.username}
                className={`w-6 h-6 rounded-full ${avatarColor(u.username)} text-white inline-flex items-center justify-center font-bold text-[10px] ring-2 ring-white`}
              >
                {u.username[0].toUpperCase()}
              </span>
            ))}
            {overflow > 0 && (
              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 inline-flex items-center justify-center font-bold text-[10px] ring-2 ring-white">
                +{overflow}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-gray-400">No members yet</span>
        )}

        {project.createdBy && (
          <span className="text-[11px] text-gray-500">
            by <span className="text-gray-700 font-medium">{project.createdBy.username}</span>
          </span>
        )}
      </div>
    </Link>
  )
}
