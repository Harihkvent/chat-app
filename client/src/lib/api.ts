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

// Add a response interceptor to handle auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired or invalid
      console.error('Authentication error, clearing session')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
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

// Helper function to get full image URL
export const getImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return ''
  // If it's already a full URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  // If it starts with /uploads, prepend the server base URL
  if (imageUrl.startsWith('/uploads')) {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
    return `${baseURL}${imageUrl}`
  }
  // Otherwise return as is
  return imageUrl
}

export default API

