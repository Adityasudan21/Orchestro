import api from './axios'
import type { User, Role } from '../types'

export const usersApi = {
  getAssignable: () => api.get<User[]>('/users/assignable').then((r) => r.data),
  updateRole: (id: number, role: Role) =>
    api.patch<User>(`/users/${id}/role`, { role }).then((r) => r.data),
  deleteUser: (id: number) => api.delete(`/users/${id}`),
}
