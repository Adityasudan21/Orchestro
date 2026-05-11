import api from './axios'
import type { Story, CreateStoryPayload, UpdateStatusPayload } from '../types'

export const storiesApi = {
  getMy: () => api.get<Story[]>('/stories/my').then((r) => r.data),
  getByProject: (projectId: number) =>
    api.get<Story[]>(`/projects/${projectId}/stories`).then((r) => r.data),
  getById: (id: number) => api.get<Story>(`/stories/${id}`).then((r) => r.data),
  create: (projectId: number, payload: CreateStoryPayload) =>
    api.post<Story>(`/projects/${projectId}/stories`, payload).then((r) => r.data),
  update: (id: number, payload: CreateStoryPayload) =>
    api.put<Story>(`/stories/${id}`, payload).then((r) => r.data),
  updateStatus: (id: number, payload: UpdateStatusPayload) =>
    api.patch<Story>(`/stories/${id}/status`, payload).then((r) => r.data),
  assign: (id: number, assigneeId: number) =>
    api.patch<Story>(`/stories/${id}/assignee`, { assigneeId }).then((r) => r.data),
  assignReporter: (id: number, assigneeId: number) =>
    api.patch<Story>(`/stories/${id}/reporter`, { assigneeId }).then((r) => r.data),
}
