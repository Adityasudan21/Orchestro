import api from './axios'
import type { Task, CreateTaskPayload, UpdateStatusPayload } from '../types'

export const tasksApi = {
  getByStory: (storyId: number) =>
    api.get<Task[]>(`/stories/${storyId}/tasks`).then((r) => r.data),
  getById: (id: number) => api.get<Task>(`/tasks/${id}`).then((r) => r.data),
  getMy: () => api.get<Task[]>('/tasks/my').then((r) => r.data),
  create: (storyId: number, payload: CreateTaskPayload) =>
    api.post<Task>(`/stories/${storyId}/tasks`, payload).then((r) => r.data),
  update: (id: number, payload: CreateTaskPayload) =>
    api.put<Task>(`/tasks/${id}`, payload).then((r) => r.data),
  updateStatus: (id: number, payload: UpdateStatusPayload) =>
    api.patch<Task>(`/tasks/${id}/status`, payload).then((r) => r.data),
  updateType: (id: number, type: string) =>
    api.patch<Task>(`/tasks/${id}/type`, { type }).then((r) => r.data),
  assign: (id: number, assigneeId: number) =>
    api.patch<Task>(`/tasks/${id}/assignee`, { assigneeId }).then((r) => r.data),
  assignReporter: (id: number, assigneeId: number) =>
    api.patch<Task>(`/tasks/${id}/reporter`, { assigneeId }).then((r) => r.data),
}
