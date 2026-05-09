import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export function setCredentials(username: string, password: string) {
  const token = btoa(`${username}:${password}`)
  api.defaults.headers.common['Authorization'] = `Basic ${token}`
}

export function clearCredentials() {
  delete api.defaults.headers.common['Authorization']
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearCredentials()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
