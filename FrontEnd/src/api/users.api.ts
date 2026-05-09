import api from './axios'
import type { User } from '../types'

export const usersApi = {
  getAssignable: () => api.get<User[]>('/users/assignable').then((r) => r.data),
}
