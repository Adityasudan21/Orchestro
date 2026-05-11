export type Role = 'ADMIN' | 'MANAGER' | 'DEVELOPER'
export type TaskType = 'DEV' | 'DOC' | 'BUG'
export type TicketStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'DONE'
  | 'BLOCKED'
  | 'ASSIGNED_TO_AI'
  | 'NEEDS_MORE_INFO'

export interface User {
  id: number
  username: string
  email: string
  role: Role
  createdAt: string
}

export interface Project {
  id: number
  name: string
  description: string | null
  createdBy: User | null
  assignee: User | null
  reporter: User | null
  members: User[]
  createdAt: string
}

export interface Story {
  id: number
  projectId: number
  projectName: string
  title: string
  description: string | null
  assignee: User | null
  reporter: User | null
  status: TicketStatus
  gitLink: string | null
  commitNumber: string | null
  branch: string | null
  createdAt: string
}

export interface Task {
  id: number
  storyId: number
  storyTitle: string
  projectId: number
  title: string
  description: string | null
  type: TaskType
  assignee: User | null
  reporter: User | null
  status: TicketStatus
  gitLink: string | null
  commitNumber: string | null
  branch: string | null
  createdAt: string
}

export interface Comment {
  id: number
  taskId: number | null
  storyId: number | null
  user: User
  content: string
  createdAt: string
}

export interface Attachment {
  id: number
  taskId: number | null
  storyId: number | null
  fileName: string
  contentType: string | null
  uploadedBy: User
  createdAt: string
}

export interface CreateProjectPayload {
  name: string
  description?: string
  memberIds?: number[]
}

export interface CreateStoryPayload {
  title: string
  description?: string
  assigneeId?: number
  gitLink?: string
  commitNumber?: string
  branch?: string
}

export interface CreateTaskPayload {
  title: string
  description?: string
  type: TaskType
  assigneeId?: number
  gitLink?: string
  commitNumber?: string
  branch?: string
}

export interface UpdateStatusPayload {
  status: TicketStatus
}
