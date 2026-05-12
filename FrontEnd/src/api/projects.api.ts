import api from './axios'
import type { Project, CreateProjectPayload } from '../types'

export const projectsApi = {
  getAll: () => api.get<Project[]>('/projects').then((r) => r.data),
  getMy: () => api.get<Project[]>('/projects/my').then((r) => r.data),
  getById: (id: number) => api.get<Project>(`/projects/${id}`).then((r) => r.data),
  create: (payload: CreateProjectPayload) =>
    api.post<Project>('/projects', payload).then((r) => r.data),
  update: (id: number, payload: CreateProjectPayload) =>
    api.put<Project>(`/projects/${id}`, payload).then((r) => r.data),
  assign: (id: number, assigneeId: number) =>
    api.patch<Project>(`/projects/${id}/assignee`, { assigneeId }).then((r) => r.data),
  assignReporter: (id: number, assigneeId: number) =>
    api.patch<Project>(`/projects/${id}/reporter`, { assigneeId }).then((r) => r.data),
  delete: (id: number) => api.delete(`/projects/${id}`),
  addMember: (id: number, userId: number) =>
    api.post<Project>(`/projects/${id}/members/${userId}`).then((r) => r.data),
  removeMember: (id: number, userId: number) =>
    api.delete<Project>(`/projects/${id}/members/${userId}`).then((r) => r.data),
}
