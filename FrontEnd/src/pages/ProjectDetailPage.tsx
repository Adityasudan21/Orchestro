import { useState } from 'react'
import { MentionTextarea } from '../components/common/MentionTextarea'
import { CommentText } from '../components/common/CommentText'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '../api/projects.api'
import { storiesApi } from '../api/stories.api'
import { commentsApi } from '../api/comments.api'
import { attachmentsApi } from '../api/attachments.api'
import { usersApi } from '../api/users.api'
import { useAuth } from '../context/AuthContext'
import { StatusBadge } from '../components/common/StatusBadge'
import { AssigneeSelect } from '../components/common/AssigneeSelect'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { Pagination } from '../components/common/Pagination'
import { timeAgo } from '../utils/timeAgo'

const STORY_PAGE_SIZE = 10

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

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assigneeId, setAssigneeId] = useState<number | undefined>()
  const [editingMeta, setEditingMeta] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [comment, setComment] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editCommentText, setEditCommentText] = useState('')
  const [storySearch, setStorySearch] = useState('')
  const [storyStatusFilter, setStoryStatusFilter] = useState('')
  const [storyPage, setStoryPage] = useState(0)
  const canCreate = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getById(projectId),
  })

  const { data: stories, isLoading: storiesLoading } = useQuery({
    queryKey: ['stories', projectId],
    queryFn: () => storiesApi.getByProject(projectId),
  })

  const { data: assignableUsers } = useQuery({
    queryKey: ['users', 'assignable'],
    queryFn: usersApi.getAssignable,
  })

  const { data: comments } = useQuery({
    queryKey: ['comments', 'project', projectId],
    queryFn: () => commentsApi.getByProject(projectId),
  })

  const { data: attachments } = useQuery({
    queryKey: ['attachments', 'project', projectId],
    queryFn: () => attachmentsApi.getByProject(projectId),
  })

  const commentMutation = useMutation({
    mutationFn: (content: string) => commentsApi.addToProject(projectId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'project', projectId] })
      setComment('')
    },
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => attachmentsApi.uploadToProject(projectId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attachments', 'project', projectId] }),
  })

  const assignMutation = useMutation({
    mutationFn: (id: number) => projectsApi.assign(projectId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
  })

  const reporterMutation = useMutation({
    mutationFn: (id: number) => projectsApi.assignReporter(projectId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
  })

  const updateMetaMutation = useMutation({
    mutationFn: () => projectsApi.update(projectId, { name: editName, description: editDesc }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      setEditingMeta(false)
    },
  })

  const createMutation = useMutation({
    mutationFn: (payload: { title: string; description: string; assigneeId?: number }) =>
      storiesApi.create(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories', projectId] })
      setShowForm(false)
      setTitle('')
      setDescription('')
      setAssigneeId(undefined)
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => commentsApi.deleteComment(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', 'project', projectId] }),
  })

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      commentsApi.updateComment(commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'project', projectId] })
      setEditingCommentId(null)
    },
  })

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: number) => attachmentsApi.deleteAttachment(attachmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attachments', 'project', projectId] }),
  })

  const addMemberMutation = useMutation({
    mutationFn: (userId: number) => projectsApi.addMember(projectId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => projectsApi.removeMember(projectId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
  })

  function startEditing() {
    setEditName(project!.name)
    setEditDesc(project!.description ?? '')
    setEditingMeta(true)
  }

  if (projectLoading) return <LoadingSpinner />
  if (!project) return null

  const filteredStories = stories?.filter((s) => {
    const q = storySearch.toLowerCase()
    if (q && !s.title.toLowerCase().includes(q)) return false
    if (storyStatusFilter && s.status !== storyStatusFilter) return false
    return true
  }) ?? []
  const storyTotalPages = Math.ceil(filteredStories.length / STORY_PAGE_SIZE)
  const pagedStories = filteredStories.slice(storyPage * STORY_PAGE_SIZE, (storyPage + 1) * STORY_PAGE_SIZE)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] h-full bg-[#F8F8F6]">
      {/* LEFT */}
      <section className="flex flex-col lg:border-r border-gray-200 h-full overflow-hidden">

        {/* Zone 1 — Static header: breadcrumb + title + activity */}
        <div className="px-8 pt-7 pb-3 flex-shrink-0">
          <div className="text-sm text-gray-400 mb-4">
            <Link to="/my-projects" className="hover:text-blue-600">My Projects</Link>
            {' / '}
            <span className="text-gray-900 font-semibold text-xs">{project.name}</span>
          </div>

          {editingMeta ? (
            <div className="mb-4">
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
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
                  disabled={!editName || updateMetaMutation.isPending}
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
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900 leading-tight">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-gray-700 leading-relaxed max-w-[640px] mt-3 whitespace-pre-wrap">{project.description}</p>
              )}
              <button
                onClick={startEditing}
                title="Edit name & description"
                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          )}

          {/* Activity */}
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Activity</h2>
          {project.createdBy && (
            <div className="flex items-center gap-2.5 py-1 text-sm text-gray-500">
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white inline-flex items-center justify-center text-[11px] flex-shrink-0">●</span>
              <span className="flex-1"><b className="text-gray-700">{project.createdBy.username}</b> created this project</span>
              <span className="text-[11px] text-gray-400">{timeAgo(project.createdAt)}</span>
            </div>
          )}
          {project.assignee && (
            <div className="flex items-center gap-2.5 py-1 text-sm text-gray-500">
              <span className="w-5 h-5 rounded-full bg-purple-500 text-white inline-flex items-center justify-center text-[11px] flex-shrink-0">→</span>
              <span className="flex-1">assigned to <b className="text-gray-700">{project.assignee.username}</b></span>
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
                    {(c.user.username === user?.username || user?.role === 'ADMIN') && (
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
              {initials(user?.username)}
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

        {/* Zone 4 — Stories: takes remaining height, scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto px-8 py-5 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Stories {stories && stories.length > 0 && <span className="ml-1 normal-case font-normal tracking-normal text-gray-400">{filteredStories.length !== stories.length ? `${filteredStories.length}/` : ''}{stories.length}</span>}
            </h2>
            {canCreate && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700"
              >
                + New Story
              </button>
            )}
          </div>

          {/* Search & filter bar */}
          <div className="flex gap-2 mb-3">
            <input
              value={storySearch}
              onChange={(e) => { setStorySearch(e.target.value); setStoryPage(0) }}
              placeholder="Search stories…"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
            />
            <select
              value={storyStatusFilter}
              onChange={(e) => { setStoryStatusFilter(e.target.value); setStoryPage(0) }}
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
                placeholder="Story title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none resize-none focus:ring-2 focus:ring-blue-500"
              />
              {assignableUsers && (
                <div className="mb-3 flex items-center gap-2">
                  <p className="text-xs font-medium text-gray-500">Assignee</p>
                  <AssigneeSelect
                    value={assigneeId ?? null}
                    options={assignableUsers.map((u) => ({ id: u.id, username: u.username, role: u.role }))}
                    onChange={(id) => setAssigneeId(id)}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => createMutation.mutate({ title, description, assigneeId })}
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

          {storiesLoading && <LoadingSpinner />}

          <div className="space-y-2">
            {pagedStories.map((story) => (
              <div key={story.id} className="group relative flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-4 hover:shadow-md transition-shadow">
                <Link to={`/stories/${story.id}`} className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{story.title}</p>
                  {story.assignee && (
                    <p className="text-xs text-gray-400 mt-0.5">Assigned to {story.assignee.username}</p>
                  )}
                </Link>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <StatusBadge status={story.status} />
                  {canCreate && (
                    <button
                      onClick={(e) => { e.preventDefault(); if (confirm('Delete this story and all its tasks?')) storiesApi.deleteStory(story.id).then(() => queryClient.invalidateQueries({ queryKey: ['stories', projectId] })) }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50"
                      title="Delete story"
                    >
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V3h4v1M5 4l1 9h4l1-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {stories?.length === 0 && !storiesLoading && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No stories yet.{canCreate && <span> Click <b>+ New Story</b> to create the first one.</span>}
              </div>
            )}
            {stories && stories.length > 0 && filteredStories.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-sm">No stories match the current filters.</div>
            )}
          </div>
          <Pagination page={storyPage} totalPages={storyTotalPages} onPageChange={setStoryPage} />
        </div>
      </section>

      {/* RIGHT — properties */}
      <aside className="px-6 py-7 overflow-auto bg-[#FAFAF8]">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2.5">Properties</h2>

        <Row label="Assignee">
          {canCreate && assignableUsers ? (
            <AssigneeSelect
              value={project.assignee?.id ?? null}
              options={assignableUsers.map((u) => ({ id: u.id, username: u.username, role: u.role }))}
              onChange={(id) => assignMutation.mutate(id)}
              disabled={assignMutation.isPending}
            />
          ) : (
            <AvatarChip name={project.assignee?.username ?? 'Unassigned'} />
          )}
        </Row>

        <Row label="Reporter">
          {canCreate && assignableUsers ? (
            <AssigneeSelect
              value={project.reporter?.id ?? null}
              options={assignableUsers.map((u) => ({ id: u.id, username: u.username, role: u.role }))}
              onChange={(id) => reporterMutation.mutate(id)}
              disabled={reporterMutation.isPending}
            />
          ) : (
            <AvatarChip name={project.reporter?.username ?? '—'} />
          )}
        </Row>

        {project.createdBy && (
          <Row label="Created by">
            <AvatarChip name={project.createdBy.username} />
          </Row>
        )}

        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mt-6 mb-2.5">Members</h2>
        <div className="space-y-1.5 mb-2">
          {project.members?.map((m) => (
            <div key={m.id} className="group flex items-center justify-between py-1">
              <AvatarChip name={m.username} />
              {canCreate && m.id !== project.createdBy?.id && (
                <button
                  onClick={() => { if (confirm(`Remove ${m.username} from this project?`)) removeMemberMutation.mutate(m.id) }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-gray-400 hover:text-red-600 px-1"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {(!project.members || project.members.length === 0) && (
            <p className="text-xs text-gray-400 italic">No members yet.</p>
          )}
        </div>
        {canCreate && assignableUsers && (
          <div className="flex items-center gap-2 mt-2">
            <select
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              defaultValue=""
              onChange={(e) => {
                const val = Number(e.target.value)
                if (val) { addMemberMutation.mutate(val); e.target.value = '' }
              }}
            >
              <option value="">+ Add member…</option>
              {assignableUsers
                .filter((u) => !project.members?.some((m) => m.id === u.id))
                .map((u) => (
                  <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                ))}
            </select>
          </div>
        )}

        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mt-6 mb-2.5">Attachments</h2>
        {attachments?.map((a) => (
          <div key={a.id} className="group flex items-center justify-between py-2 text-xs text-gray-700 border-b border-dashed border-gray-200 last:border-b-0">
            <span className="truncate">📎 {a.fileName}</span>
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              <a href={attachmentsApi.downloadUrl(a.id)} download className="text-blue-600 hover:underline text-[11px]">Download</a>
              {(a.uploadedBy.username === user?.username || user?.role === 'ADMIN') && (
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
      </aside>
    </div>
  )
}
