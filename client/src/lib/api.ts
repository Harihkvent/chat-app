import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  withCredentials: true,
})

// Add a request interceptor to include auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Auth endpoints
export const signup = (data: any) => API.post('/api/auth/signup', data)
export const login = (data: { username: string; password: string }) =>
  API.post('/api/auth/login', data)
export const googleAuth = (data: { credential: string }) =>
  API.post('/api/auth/google', data)

// User endpoints
export const getContacts = () => API.get('/api/users/contacts')
export const searchUsers = (query: string) => API.get(`/api/users/search?q=${query}`)
export const getUser = (userId: string) => API.get(`/api/users/${userId}`)

// Chat endpoints
export const getConversations = () => API.get('/api/chats/conversations')
export const getMessages = (conversationId: string) =>
  API.get(`/api/chats/messages/${conversationId}`)
export const sendMessage = (data: {
  conversationId: string
  content: string
  type?: string
}) => API.post('/api/chats/messages', data)

// Group endpoints
export const createGroup = (data: { name: string; memberIds: string[] }) =>
  API.post('/api/chats/groups', data)
export const getGroups = () => API.get('/api/chats/groups')

export default API

