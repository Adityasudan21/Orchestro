import api from './axios'
import type { Notification } from '../types'

export const notificationsApi = {
  getMy: () => api.get<Notification[]>('/notifications/my').then((r) => r.data),
  getUnreadCount: () => api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count),
  markRead: (id: number) => api.patch<Notification>(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then(() => {}),
}
