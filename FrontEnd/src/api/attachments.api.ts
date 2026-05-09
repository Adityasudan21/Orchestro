import api from './axios'
import type { Attachment } from '../types'

export const attachmentsApi = {
  getByTask: (taskId: number) =>
    api.get<Attachment[]>(`/tasks/${taskId}/attachments`).then((r) => r.data),
  getByStory: (storyId: number) =>
    api.get<Attachment[]>(`/stories/${storyId}/attachments`).then((r) => r.data),
  uploadToTask: (taskId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post<Attachment>(`/tasks/${taskId}/attachments`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
  uploadToStory: (storyId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post<Attachment>(`/stories/${storyId}/attachments`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
  downloadUrl: (id: number) => `/api/attachments/${id}/download`,
}
