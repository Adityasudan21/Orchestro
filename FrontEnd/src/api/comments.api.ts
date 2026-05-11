import api from './axios'
import type { Comment } from '../types'

export const commentsApi = {
  getByTask: (taskId: number) =>
    api.get<Comment[]>(`/tasks/${taskId}/comments`).then((r) => r.data),
  getByStory: (storyId: number) =>
    api.get<Comment[]>(`/stories/${storyId}/comments`).then((r) => r.data),
  getByProject: (projectId: number) =>
    api.get<Comment[]>(`/projects/${projectId}/comments`).then((r) => r.data),
  addToTask: (taskId: number, content: string) =>
    api.post<Comment>(`/tasks/${taskId}/comments`, { content }).then((r) => r.data),
  addToStory: (storyId: number, content: string) =>
    api.post<Comment>(`/stories/${storyId}/comments`, { content }).then((r) => r.data),
  addToProject: (projectId: number, content: string) =>
    api.post<Comment>(`/projects/${projectId}/comments`, { content }).then((r) => r.data),
}
