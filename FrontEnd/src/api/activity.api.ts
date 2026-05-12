import api from './axios'
import type { ActivityLog } from '../types'

export const activityApi = {
  getForProject: (id: number) => api.get<ActivityLog[]>(`/projects/${id}/activity`).then((r) => r.data),
  getForStory: (id: number) => api.get<ActivityLog[]>(`/stories/${id}/activity`).then((r) => r.data),
  getForTask: (id: number) => api.get<ActivityLog[]>(`/tasks/${id}/activity`).then((r) => r.data),
}
