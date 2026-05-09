import api from './axios'
import type { User } from '../types'

export const authApi = {
  login: () => api.post<User>('/auth/login').then((r) => r.data),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
  register: (payload: { username: string; email: string; password: string; role: string }) =>
    api.post<User>('/auth/register', payload).then((r) => r.data),
}
